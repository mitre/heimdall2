package cmd

import (
	"bytes"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newSecurityTestRunner(env map[string]string) (*SetupRunner, *bytes.Buffer) {
	out := new(bytes.Buffer)
	r := &SetupRunner{
		Exec: &FakeExecRunner{
			Results: make(map[string]FakeExecResult),
		},
		Systemd: &FakeSystemdRunner{
			ActiveServices: make(map[string]bool),
			Properties:     make(map[string]string),
		},
		Env:   &FakeEnvManager{Env: env},
		FS:    NewFakeFileSystem(),
		Out:   out,
		Paths: DefaultPaths(),
	}
	return r, out
}

func TestStepSecurityPolicies_SELinuxPresent(t *testing.T) {
	r, out := newSecurityTestRunner(map[string]string{"PORT": "3000"})
	fs, ex := enableSELinux(r)
	require.NoError(t, r.stepSecurityPolicies())
	require.Equal(t, "heimdall_server_port_t tcp 3000\n", string(fs.Files[r.Paths.ConfigDir+"/selinux-ports"]))
	for _, c := range ex.Calls {
		if c.Name == "semanage" {
			require.NotContains(t, c.Args, "-m")
		}
	}
	require.NotContains(t, out.String(), "failed")
}
func TestStepSecurityPolicies_SELinuxAbsent(t *testing.T) {
	r, _ := newSecurityTestRunner(map[string]string{"PORT": "3000"})
	require.NoError(t, r.stepSecurityPolicies())
	for _, c := range r.Exec.(*FakeExecRunner).Calls {
		require.NotEqual(t, "semanage", c.Name)
		require.NotEqual(t, "restorecon", c.Name)
	}
}
func TestStepSecurityPolicies_CustomPort(t *testing.T) {
	r, out := newSecurityTestRunner(map[string]string{"PORT": "8443"})
	fs, _ := enableSELinux(r)
	r.SkipTLS = true
	enableFirewall(r)
	require.NoError(t, r.stepSecurityPolicies())
	require.Contains(t, string(fs.Files[r.Paths.ConfigDir+"/selinux-ports"]), "tcp 8443")
	require.Contains(t, out.String(), "firewalld: port 8443/tcp enabled")
}
func TestStepSecurityPolicies_FapolicydPresent(t *testing.T) {
	r, out := newSecurityTestRunner(map[string]string{})
	r.FS.(*FakeFileSystem).Files[r.Paths.RuntimePath("node", "bin", "node")] = nil
	require.NoError(t, r.stepSecurityPolicies())
	require.Contains(t, out.String(), "trust entries added")
	for _, c := range r.Exec.(*FakeExecRunner).Calls {
		require.NotContains(t, c.Name, "fapolicyd-trust.sh")
	}
}
func TestStepSecurityPolicies_FapolicydAbsent(t *testing.T) {
	r, out := newSecurityTestRunner(map[string]string{})
	r.Exec.(*FakeExecRunner).Results[`sh -c command -v "$1" sh fapolicyd-cli`] = FakeExecResult{ExitCode: 1}
	require.NoError(t, r.stepSecurityPolicies())
	require.Contains(t, out.String(), "not installed (skipped)")
}

func TestStepSecurityPolicies_FirewalldActiveWithTLS(t *testing.T) {
	r, out := newSecurityTestRunner(map[string]string{"EXTERNAL_URL": "https://heimdall.example.test"})
	enableFirewall(r)
	r.ProxyMode = "bundled"
	r.SkipTLS = false

	require.NoError(t, r.stepSecurityPolicies())

	assert.Contains(t, out.String(), "firewalld: proxy endpoint https enabled")
}

func TestStepSecurityPolicies_FirewalldActiveSkipTLS(t *testing.T) {
	r, out := newSecurityTestRunner(map[string]string{"PORT": "3000"})
	enableFirewall(r)
	r.SkipTLS = true

	require.NoError(t, r.stepSecurityPolicies())

	assert.Contains(t, out.String(), "firewalld: port 3000/tcp enabled")
}

func TestStepSecurityPolicies_FirewalldNotRunning(t *testing.T) {
	r, out := newSecurityTestRunner(map[string]string{})
	// firewalld not active (default in FakeSystemdRunner)

	r.stepSecurityPolicies()

	assert.Contains(t, out.String(), "firewalld: not running (skipped)")
}

func TestStepSecurityPolicies_FilePermissions(t *testing.T) {
	r, _ := newSecurityTestRunner(map[string]string{})

	r.stepSecurityPolicies()

	// Verify chmod/chown called for config, data, log dirs
	calls := r.Exec.(*FakeExecRunner).Calls
	chownCalls := 0
	chmodCalls := 0
	for _, c := range calls {
		if c.Name == "chown" {
			chownCalls++
		}
		if c.Name == "chmod" {
			chmodCalls++
		}
	}
	assert.GreaterOrEqual(t, chownCalls, 3, "should chown config, data, and log dirs")
	assert.GreaterOrEqual(t, chmodCalls, 3, "should chmod config dir, data dir, and log dir")
	assert.Contains(t, calls, FakeExecCall{Name: "runuser", Args: []string{"-u", "heimdall", "--", "chmod", "0700", r.Paths.DataDir + "/backups"}})
}
