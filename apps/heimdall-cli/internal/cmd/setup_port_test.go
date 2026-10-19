package cmd

import (
	"bytes"
	"errors"
	"maps"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSetupBackendPortDefaultsOverridesAndPersistence(t *testing.T) {
	for _, tc := range []struct {
		name, saved, argument, want string
		explicit                    bool
	}{
		{name: "fresh default", want: "3000"},
		{name: "saved", saved: "3210", want: "3210"},
		{name: "override", saved: "3210", argument: "3456", explicit: true, want: "3456"},
		{name: "explicit default", saved: "3210", argument: "3000", explicit: true, want: "3000"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, _ := expirationSetupFixture(t)
			if tc.saved != "" {
				r.Env.(*FakeEnvManager).Env["PORT"] = tc.saved
			}
			args := []string{"--non-interactive", "--reconfigure"}
			if tc.explicit {
				args = append(args, "--port="+tc.argument)
			}
			cmd := NewSetupCmd(r)
			cmd.SetArgs(args)
			require.NoError(t, cmd.Execute())
			require.Equal(t, tc.want, r.Env.(*FakeEnvManager).Env["PORT"])
			cmd = NewSetupCmd(r)
			cmd.SetArgs([]string{"--non-interactive", "--reconfigure"})
			require.NoError(t, cmd.Execute())
			require.Equal(t, tc.want, r.Env.(*FakeEnvManager).Env["PORT"])
		})
	}
}

func TestSetupBackendPortInteractiveDefaults(t *testing.T) {
	for _, tc := range []struct{ name, saved, argument, input, wantDefault, want string }{
		{name: "fresh", wantDefault: "3000", want: "3000"},
		{name: "saved", saved: "3210", wantDefault: "3210", want: "3210"},
		{name: "flag overrides saved", saved: "3210", argument: "3000", wantDefault: "3000", want: "3000"},
		{name: "answer overrides saved", saved: "3210", input: "3456", wantDefault: "3210", want: "3456"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, p := expirationSetupFixture(t)
			r.Env.(*FakeEnvManager).Env["PORT"] = tc.saved
			if tc.input != "" {
				p.Inputs = map[string]string{"Backend port": tc.input}
			}
			args := []string{"--interactive", "--reconfigure"}
			if tc.argument != "" {
				args = append(args, "--port="+tc.argument)
			}
			cmd := NewSetupCmd(r)
			cmd.SetArgs(args)
			require.NoError(t, cmd.Execute())
			assert.Equal(t, tc.wantDefault, p.InputDefaults["Backend port"])
			assert.Equal(t, tc.want, r.Env.(*FakeEnvManager).Env["PORT"])
			assert.Contains(t, r.Out.(*bytes.Buffer).String(), "    Backend port: "+tc.want)
		})
	}
}

func assertSetupPortUnchanged(t *testing.T, r *SetupRunner) func() {
	t.Helper()
	env, err := r.Env.ReadEnv()
	require.NoError(t, err)
	fs := r.FS.(*FakeFileSystem)
	files, dirs := maps.Clone(fs.Files), maps.Clone(fs.Dirs)
	return func() {
		t.Helper()
		assert.Equal(t, env, r.Env.(*FakeEnvManager).Env)
		assert.Equal(t, files, fs.Files)
		assert.Equal(t, dirs, fs.Dirs)
		assert.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
		for _, call := range r.Exec.(*FakeExecRunner).Calls {
			// These are the only read-only commands needed before port acceptance.
			assert.True(t, call.Name == "ss" || call.Name == "sh" || call.Name == "cat" ||
				(call.Name == "semanage" && strings.Join(call.Args, " ") == "port -l") ||
				(call.Name == "systemctl" && strings.Join(call.Args, " ") == "show-environment"), "%+v", call)
		}
	}
}

func TestSetupBackendPortRejectsInvalidWithoutMutation(t *testing.T) {
	for _, port := range []string{"", "0", "65536", "-1", "three", "3.5", "3210\nPORT=443"} {
		for _, reconfigure := range []bool{true, false} {
			t.Run(port+map[bool]string{true: " reconfigure", false: " full"}[reconfigure], func(t *testing.T) {
				r := bundledSetupFixture(t)
				unchanged := assertSetupPortUnchanged(t, r)
				cmd := NewSetupCmd(r)
				args := []string{"--non-interactive", "--port=" + port}
				if reconfigure {
					args = append(args, "--reconfigure")
				}
				cmd.SetArgs(args)
				err := cmd.Execute()
				require.Error(t, err)
				require.Contains(t, err.Error(), "PORT")
				unchanged()
			})
		}
	}
}

func TestSetupBackendPortRejectsConflictsWithoutMutation(t *testing.T) {
	for _, tc := range []struct{ name, port, problem string }{
		{"occupied", "3456", "occupied"},
		{"SELinux owner", "3000", "ntop_port_t"},
		{"proxy HTTPS", "443", "1024"},
		{"proxy HTTP", "80", "1024"},
		{"bundled database", "55432", "PostgreSQL"},
	} {
		for _, reconfigure := range []bool{true, false} {
			t.Run(tc.name+map[bool]string{true: " reconfigure", false: " full"}[reconfigure], func(t *testing.T) {
				r := bundledSetupFixture(t)
				exec := r.Exec.(*FakeExecRunner)
				if tc.name == "occupied" {
					exec.Results["ss -H -ltnp sport = :3456"] = FakeExecResult{Stdout: `LISTEN 0 100 127.0.0.1:3456 0.0.0.0:* users:(("other",pid=123,fd=1))`}
				}
				if tc.name == "SELinux owner" {
					r.FS.(*FakeFileSystem).Files["/sys/fs/selinux/enforce"] = []byte("1")
					exec.Results["semanage port -l"] = FakeExecResult{Stdout: "ntop_port_t tcp 3000\n"}
				}
				unchanged := assertSetupPortUnchanged(t, r)
				cmd := NewSetupCmd(r)
				args := []string{"--non-interactive", "--port=" + tc.port}
				if reconfigure {
					args = append(args, "--reconfigure")
				}
				cmd.SetArgs(args)
				err := cmd.Execute()
				require.Error(t, err)
				assert.Contains(t, err.Error(), tc.problem)
				assert.Contains(t, FormatCLIError(err, false), "--port")
				unchanged()
			})
		}
	}
}

func TestSetupBackendPortPromptBeforeSummary(t *testing.T) {
	for _, reconfigure := range []bool{false, true} {
		t.Run(map[bool]string{false: "full setup", true: "reconfigure"}[reconfigure], func(t *testing.T) {
			r, _ := expirationSetupFixture(t)
			r.FS.(*FakeFileSystem).Files[r.Paths.RuntimePath("nginx", "sbin", "nginx")] = nil
			out := r.Out.(*bytes.Buffer)
			cancelled := errors.New("cancelled at port prompt")
			unchanged := assertSetupPortUnchanged(t, r)
			p := &setupPortPrompter{FakePrompter: FakePrompter{IsTTY: true}, cancel: cancelled, before: func() {
				assert.NotContains(t, out.String(), "Configuration summary:")
				unchanged()
			}}
			r.Prompter = p
			cmd := NewSetupCmd(r)
			args := []string{"--interactive"}
			if reconfigure {
				args = append(args, "--reconfigure")
			}
			cmd.SetArgs(args)
			require.ErrorIs(t, cmd.Execute(), cancelled)
			assert.Equal(t, []string{"3000"}, p.defaults)
			assert.Empty(t, r.Env.(*FakeEnvManager).Env)
			assert.NotContains(t, out.String(), "=== Step ")
		})
	}
}

type setupPortPrompter struct {
	FakePrompter
	answers  []string
	defaults []string
	before   func()
	cancel   error
}

func (p *setupPortPrompter) Input(title, fallback string) (string, error) {
	if title != "Backend port" {
		return p.FakePrompter.Input(title, fallback)
	}
	p.defaults = append(p.defaults, fallback)
	if p.before != nil {
		p.before()
	}
	if len(p.answers) == 0 {
		return "", p.cancel
	}
	answer := p.answers[0]
	p.answers = p.answers[1:]
	return answer, nil
}

func TestSetupBackendPortInteractiveRepromptsAndCancellation(t *testing.T) {
	for _, cancel := range []bool{false, true} {
		t.Run(map[bool]string{true: "cancel", false: "accept"}[cancel], func(t *testing.T) {
			r := bundledSetupFixture(t)
			r.FS.(*FakeFileSystem).Files["/sys/fs/selinux/enforce"] = []byte("1")
			exec := r.Exec.(*FakeExecRunner)
			exec.Results["semanage port -l"] = FakeExecResult{Stdout: "ntop_port_t tcp 3000\nheimdall_server_port_t tcp 3456\n"}
			exec.Results["ss -H -ltnp sport = :3210"] = FakeExecResult{Stdout: `LISTEN 0 100 127.0.0.1:3210 0.0.0.0:* users:(("other",pid=123,fd=1))`}
			cancelled := errors.New("cancelled")
			p := &setupPortPrompter{FakePrompter: FakePrompter{IsTTY: true}, answers: []string{"0", "3210", "3000", "443", "55432"}, before: assertSetupPortUnchanged(t, r), cancel: cancelled}
			if !cancel {
				p.answers = append(p.answers, "3456")
			}
			r.Prompter = p
			cmd := NewSetupCmd(r)
			cmd.SetArgs([]string{"--interactive", "--reconfigure"})
			err := cmd.Execute()
			if cancel {
				require.ErrorIs(t, err, cancelled)
				p.before()
			} else {
				require.NoError(t, err)
				assert.Equal(t, "3456", r.Env.(*FakeEnvManager).Env["PORT"])
			}
			require.Len(t, p.defaults, 6)
			assert.Equal(t, "3210", p.defaults[0])
		})
	}
}

func TestDiagUsesConfiguredBackendPort(t *testing.T) {
	r, _, exec, out := newServiceRunner()
	r.Env.(*FakeEnvManager).Env["PORT"] = "3456"
	exec.Results["ss -tlnp"] = FakeExecResult{Stdout: "LISTEN 0 128 127.0.0.1:3456 0.0.0.0:*\nLISTEN 0 128 127.0.0.1:3000 0.0.0.0:*\nLISTEN 0 128 127.0.0.1:34560 0.0.0.0:*\n"}
	require.NoError(t, r.Diag())
	assert.Contains(t, out.String(), "127.0.0.1:3456 ")
	assert.NotContains(t, out.String(), "127.0.0.1:3000 ")
	assert.NotContains(t, out.String(), "127.0.0.1:34560 ")
}

func TestSetupBackendPortManagedProxiesAndReruns(t *testing.T) {
	for _, proxy := range []string{"bundled", "nginx"} {
		t.Run(proxy, func(t *testing.T) {
			r := bundledSetupFixture(t)
			fs := r.FS.(*FakeFileSystem)
			env := r.Env.(*FakeEnvManager).Env
			env["HEIMDALL_PROXY_MODE"] = proxy
			config := r.Paths.ConfigDir + "/caddy/Caddyfile"
			if proxy == "nginx" {
				fs.Files[r.Paths.RuntimePath("nginx", "sbin", "nginx")] = nil
				env["HEIMDALL_TLS_MODE"] = "self-signed"
				config = r.Paths.ConfigDir + "/nginx/nginx.conf"
			}
			firewall := enableFirewall(r)
			cmd := NewSetupCmd(r)
			cmd.SetArgs([]string{"--non-interactive", "--port=3456"})
			require.NoError(t, cmd.Execute())
			assert.Equal(t, "3456", r.Env.(*FakeEnvManager).Env["PORT"])
			assert.Contains(t, string(fs.Files[config]), "127.0.0.1:3456")
			if proxy == "nginx" {
				assert.Contains(t, string(fs.Files[config]), "listen 443 ssl;")
			} else {
				assert.Contains(t, string(fs.Files[config]), `"https://heimdall.example.test"`)
			}
			ports, err := r.selectedSELinuxPorts(r.Env.(*FakeEnvManager).Env)
			require.NoError(t, err)
			assert.Contains(t, ports, selinuxPort{"heimdall_server_port_t", "3456"})
			assert.Contains(t, ports, selinuxPort{"http_port_t", "443"})
			for _, call := range firewall.Calls {
				assert.NotContains(t, strings.Join(call.Args, " "), "--add-port=3456/tcp")
			}
			cmd = NewSetupCmd(r)
			cmd.SetArgs([]string{"--non-interactive"})
			require.NoError(t, cmd.Execute())
			assert.Equal(t, "3456", r.Env.(*FakeEnvManager).Env["PORT"])
			assert.Contains(t, string(fs.Files[config]), "127.0.0.1:3456")
		})
	}
}

func TestSetupBackendPortReservedOnFreshIdleHost(t *testing.T) {
	for _, tc := range []struct {
		name, port string
		args       []string
	}{
		{name: "nginx", port: "443"},
		{name: "nginx skipped", port: "443", args: []string{"--skip-tls"}},
		{name: "database", port: "55432"},
		{name: "database skipped", port: "55432", args: []string{"--skip-db"}},
		{name: "selected database", port: "56543", args: []string{"--db-port=56543"}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, _ := expirationSetupFixture(t)
			r.FS.(*FakeFileSystem).Files[r.Paths.RuntimePath("nginx", "sbin", "nginx")] = nil
			unchanged := assertSetupPortUnchanged(t, r)
			cmd := NewSetupCmd(r)
			cmd.SetArgs(append([]string{"--non-interactive", "--reconfigure", "--port=" + tc.port}, tc.args...))
			err := cmd.Execute()
			require.Error(t, err)
			assert.Contains(t, FormatCLIError(err, false), "--port")
			unchanged()
		})
	}
}

func TestSetupBackendPortAcceptsExistingHeimdallListener(t *testing.T) {
	r := bundledSetupFixture(t)
	r.Exec.(*FakeExecRunner).Results["ss -H -ltnp sport = :3210"] = FakeExecResult{Stdout: `LISTEN 0 100 127.0.0.1:3210 0.0.0.0:* users:(("node",pid=123,fd=1))`}
	sd := r.Systemd.(*FakeSystemdRunner)
	sd.ActiveServices[ServiceName] = true
	sd.Properties[ServiceName+":MainPID"] = "123"
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--non-interactive", "--reconfigure"})
	require.NoError(t, cmd.Execute())
	assert.Equal(t, "3210", r.Env.(*FakeEnvManager).Env["PORT"])
	assert.Empty(t, sd.Actions)
}

func TestSetupBackendPortInteractiveLegacyRerun(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{"PORT": "3210", "JWT_SECRET": "keep", "DATABASE_PASSWORD": "keep"}
	p := &FakePrompter{IsTTY: true, Inputs: map[string]string{"Backend port": "3456"}}
	r.Prompter = p
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--interactive", "--reconfigure"})
	require.NoError(t, cmd.Execute())
	assert.Equal(t, "3210", p.InputDefaults["Backend port"])
	assert.Equal(t, "3456", r.Env.(*FakeEnvManager).Env["PORT"])
}

func TestSetupBackendPortDryRunShowsOverrideWithoutMutation(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env["PORT"] = "3210"
	unchanged := assertSetupPortUnchanged(t, r)
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--non-interactive", "--dry-run", "--port=3456", "--proxy-mode=external"})
	require.NoError(t, cmd.Execute())
	assert.Contains(t, out.String(), "Backend port: 3456")
	assert.Contains(t, out.String(), "http://127.0.0.1:3456")
	assert.NotContains(t, out.String(), "3210")
	assert.Empty(t, r.Exec.(*FakeExecRunner).Calls)
	unchanged()
}

func TestStatusReportsSelectedBackendPort(t *testing.T) {
	for _, asJSON := range []bool{false, true} {
		r, out := newTestStatusRunner()
		r.JSON = asJSON
		r.Env.(*FakeEnvManager).Env["PORT"] = "3456"
		require.NoError(t, r.Run())
		if asJSON {
			assert.Contains(t, out.String(), `"port": "3456"`)
			assert.Contains(t, out.String(), `"backend": "http://127.0.0.1:3456"`)
		} else {
			assert.Contains(t, out.String(), "Port: 3456")
		}
	}
}
