package cmd

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newAddCertRunner() (*AddCertRunner, *FakeExecRunner, *FakeEnvManager, *FakeFileSystem, *bytes.Buffer) {
	out := new(bytes.Buffer)
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{}}
	env := &FakeEnvManager{Env: map[string]string{}}
	fs := NewFakeFileSystem()
	return &AddCertRunner{
		Exec: exec,
		Env:  env,
		FS:   fs,
		Out:  out,
	}, exec, env, fs, out
}

func TestAddCert_FileNotFound(t *testing.T) {
	runner, _, _, _, _ := newAddCertRunner()
	err := runner.Run("/nonexistent/cert.pem")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "file not found")
}

func TestAddCert_CopiesFile(t *testing.T) {
	runner, _, _, fs, _ := newAddCertRunner()
	fs.Files["/tmp/my-ca.pem"] = []byte("cert-data")

	err := runner.Run("/tmp/my-ca.pem")
	require.NoError(t, err)

	dest := "/etc/pki/ca-trust/source/anchors/my-ca.pem"
	assert.Equal(t, []byte("cert-data"), fs.Files[dest])
}

func TestAddCert_RunsUpdateCaTrust(t *testing.T) {
	runner, exec, _, fs, _ := newAddCertRunner()
	fs.Files["/tmp/my-ca.pem"] = []byte("cert-data")

	err := runner.Run("/tmp/my-ca.pem")
	require.NoError(t, err)

	found := false
	for _, call := range exec.Calls {
		if call.Name == "update-ca-trust" {
			found = true
		}
	}
	assert.True(t, found, "should call update-ca-trust")
}

func TestAddCert_SetsNodeExtraCACerts(t *testing.T) {
	runner, _, env, fs, out := newAddCertRunner()
	fs.Files["/tmp/my-ca.pem"] = []byte("cert-data")

	err := runner.Run("/tmp/my-ca.pem")
	require.NoError(t, err)

	assert.Equal(t, "/etc/pki/tls/certs/ca-bundle.crt", env.Env["NODE_EXTRA_CA_CERTS"])
	assert.Contains(t, out.String(), "NODE_EXTRA_CA_CERTS")
}

func TestAddCert_SkipsEnvUpdateIfAlreadySet(t *testing.T) {
	runner, _, env, fs, out := newAddCertRunner()
	fs.Files["/tmp/my-ca.pem"] = []byte("cert-data")
	env.Env["NODE_EXTRA_CA_CERTS"] = "/etc/pki/tls/certs/ca-bundle.crt"

	err := runner.Run("/tmp/my-ca.pem")
	require.NoError(t, err)

	assert.NotContains(t, out.String(), "Set NODE_EXTRA_CA_CERTS")
}

func TestAddCertTrustFailureStopsConfiguration(t *testing.T) {
	for _, result := range []FakeExecResult{
		{ExitCode: 1, Stdout: "could not rebuild trust"},
		{Err: fmt.Errorf("could not execute update-ca-trust")},
	} {
		r, exec, env, fs, out := newAddCertRunner()
		fs.Files["/tmp/corporate.pem"] = []byte("certificate")
		exec.Results["update-ca-trust"] = result
		require.Error(t, r.Run("/tmp/corporate.pem"))
		require.NotContains(t, out.String(), "System trust store updated")
		require.Empty(t, env.Env["NODE_EXTRA_CA_CERTS"])
	}
}

func TestAddCert_FileNotExists(t *testing.T) {
	r := &AddCertRunner{
		Env:       &FakeEnvManager{Env: map[string]string{}},
		Exec:      &FakeExecRunner{Results: make(map[string]FakeExecResult)},
		FS:        NewFakeFileSystem(),
		Out:       new(bytes.Buffer),
		CheckRoot: func() error { return nil },
	}
	err := r.Run("/nonexistent/cert.pem")
	assert.Error(t, err)
}

type addCertTrustFileSystem struct{ osFileSystem }

func (*addCertTrustFileSystem) CopyFile(_, _ string) error { return nil }

func TestAddCertCmdUsesSelectedEnvFile(t *testing.T) {
	for _, tc := range []struct {
		name     string
		useFlag  bool
		injected bool
	}{
		{name: "env-file flag", useFlag: true},
		{name: "HEIMDALL_ENV_FILE"},
		{name: "injected environment is preserved", useFlag: true, injected: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			dir := t.TempDir()
			selected := filepath.Join(dir, "selected.env")
			other := filepath.Join(dir, "other.env")
			cert := filepath.Join(dir, "corporate-ca.pem")
			config := filepath.Join(dir, "cli.yaml")
			const original = "# Preserve existing settings\nEXTERNAL_URL=https://heimdall.example.test\n"
			for path, content := range map[string]string{selected: original, other: original, cert: "certificate", config: ""} {
				require.NoError(t, os.WriteFile(path, []byte(content), 0600))
			}
			t.Setenv("HEIMDALL_ENV_FILE", selected)
			args := []string{"--config", config, "add-cert", cert}
			if tc.useFlag {
				t.Setenv("HEIMDALL_ENV_FILE", other)
				args = append(args, "--env-file", selected)
			}
			runner := &AddCertRunner{
				Exec: &FakeExecRunner{Results: map[string]FakeExecResult{}},
				FS:   &addCertTrustFileSystem{},
				Out:  new(bytes.Buffer),
			}
			if tc.injected {
				runner.Env = &FileEnvManager{Path: other}
			}
			root := NewRootCmd()
			previous, _, err := root.Find([]string{"add-cert"})
			require.NoError(t, err)
			root.RemoveCommand(previous)
			root.AddCommand(NewAddCertCmd(runner))
			root.SetArgs(args)
			require.NotPanics(t, func() { err = root.Execute() }, "initialize the environment from the resolved command paths")
			require.NoError(t, err)
			if tc.injected {
				selected, other = other, selected
			}
			updated, err := os.ReadFile(selected)
			require.NoError(t, err)
			require.Contains(t, string(updated), original)
			require.Equal(t, "/etc/pki/tls/certs/ca-bundle.crt", ParseEnv(string(updated))["NODE_EXTRA_CA_CERTS"])
			unchanged, err := os.ReadFile(other)
			require.NoError(t, err)
			require.Equal(t, original, string(unchanged))
		})
	}
}
