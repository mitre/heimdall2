package cmd

import (
	"bytes"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// These tests exercise commands through Cobra (not just the runner directly)
// to cover the NewXxxCmd() constructors and their RunE closures.

func TestConfigListCmd_ViaCobra(t *testing.T) {
	r := &ConfigRunner{
		Env: &FakeEnvManager{Env: map[string]string{"PORT": "3000", "DATABASE_HOST": "localhost"}},
	}
	cmd := NewConfigCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{"list"})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "PORT")
	assert.Contains(t, out.String(), "DATABASE_HOST")
}

func TestConfigGetCmd_ViaCobra(t *testing.T) {
	r := &ConfigRunner{
		Env: &FakeEnvManager{Env: map[string]string{"PORT": "3000"}},
	}
	cmd := NewConfigCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{"get", "PORT"})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "3000")
}

func TestConfigSetCmd_ViaCobra(t *testing.T) {
	port, _, _, _, _ := newSetPortRunner()
	env := &FakeEnvManager{Env: map[string]string{}}
	r := &ConfigRunner{
		Env:       env,
		Port:      port,
		CheckRoot: func() error { return nil },
	}
	cmd := NewConfigCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{"set", "PORT", "8080"})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Equal(t, "8080", env.Env["PORT"])
	assert.Contains(t, out.String(), "PORT=8080")
}

func TestStartCmd_ViaCobra(t *testing.T) {
	systemd := &FakeSystemdRunner{ActiveServices: make(map[string]bool), Properties: make(map[string]string)}
	r := newDefaultServiceRunner(nil, nil)
	r.Exec = &FakeExecRunner{Results: make(map[string]FakeExecResult)}
	r.Systemd = systemd
	r.CheckRoot = func() error { return nil }
	cmd := NewStartCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Service started.")
	assert.Contains(t, systemd.Actions, "start:"+ServiceName)
}

func TestStopCmd_ViaCobra(t *testing.T) {
	systemd := &FakeSystemdRunner{ActiveServices: make(map[string]bool), Properties: make(map[string]string)}
	r := newDefaultServiceRunner(nil, nil)
	r.Exec = &FakeExecRunner{Results: make(map[string]FakeExecResult)}
	r.Systemd = systemd
	r.CheckRoot = func() error { return nil }
	cmd := NewStopCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Service stopped.")
	assert.Contains(t, systemd.Actions, "stop:"+ServiceName)
}

func TestRestartCmd_ViaCobra(t *testing.T) {
	systemd := &FakeSystemdRunner{ActiveServices: make(map[string]bool), Properties: make(map[string]string)}
	r := newDefaultServiceRunner(nil, nil)
	r.Exec = &FakeExecRunner{Results: make(map[string]FakeExecResult)}
	r.Systemd = systemd
	r.CheckRoot = func() error { return nil }
	cmd := NewRestartCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Service restarted.")
	assert.Contains(t, systemd.Actions, "restart:"+ServiceName)
}

func TestLogsCmd_ViaCobra(t *testing.T) {
	r := newDefaultServiceRunner(nil, nil)
	r.Exec = &FakeExecRunner{Results: map[string]FakeExecResult{
		"journalctl -u": {Stdout: "log line 1\nlog line 2"},
	}}
	r.Systemd = &FakeSystemdRunner{ActiveServices: make(map[string]bool), Properties: make(map[string]string)}
	r.CheckRoot = func() error { return nil }
	cmd := NewLogsCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "log line 1")
	assert.Contains(t, out.String(), "log line 2")
}

func TestDiagCmd_ViaCobra(t *testing.T) {
	r := newDefaultServiceRunner(nil, nil)
	r.Exec = &FakeExecRunner{Results: map[string]FakeExecResult{
		"cat /etc/os-release": {Stdout: "NAME=TestOS\n"},
		"uname -rm":           {Stdout: "5.14.0 x86_64"},
		"free -h":             {Stdout: "Mem: 16Gi"},
		"ss -tlnp":            {Stdout: "LISTEN 0 128 *:3000"},
	}}
	r.Systemd = &FakeSystemdRunner{ActiveServices: make(map[string]bool), Properties: make(map[string]string)}
	r.CheckRoot = func() error { return nil }
	cmd := NewDiagCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Diagnostic Report")
	assert.Contains(t, out.String(), "--- OS ---")
}

func TestStatusCmd_ViaCobra(t *testing.T) {
	r := &StatusRunner{
		Exec: &FakeExecRunner{Results: make(map[string]FakeExecResult)},
		Systemd: &FakeSystemdRunner{
			ActiveServices: map[string]bool{ServiceName: true},
			Properties: map[string]string{
				ServiceName + ":MainPID":              "1234",
				ServiceName + ":ActiveEnterTimestamp": "Thu 2026-01-01 00:00:00 UTC",
			},
		},
		Env:   &FakeEnvManager{Env: map[string]string{"PORT": "3000", "DATABASE_PASSWORD": "pass"}},
		FS:    NewFakeFileSystem(),
		DB:    &FakeDBConnector{Tables: 9},
		Paths: DefaultPaths(),
	}
	cmd := NewStatusCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{})
	err := cmd.Execute()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "pid=1234")
	assert.Contains(t, output, "9 tables")
	assert.Contains(t, output, "Port: 3000")
}

func TestSetPortCmd_ViaCobra(t *testing.T) {
	env := &FakeEnvManager{Env: map[string]string{"PORT": "3000"}}
	r := &SetPortRunner{
		Env:       env,
		Exec:      &FakeExecRunner{Results: make(map[string]FakeExecResult)},
		Systemd:   &FakeSystemdRunner{ActiveServices: make(map[string]bool), Properties: make(map[string]string)},
		CheckRoot: func() error { return nil },
	}
	cmd := NewSetPortCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{"8080"})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Equal(t, "8080", env.Env["PORT"])
	assert.Contains(t, out.String(), "PORT=8080 (was 3000)")
}

func TestRestoreCmd_ViaCobra_MissingFile(t *testing.T) {
	r := &RestoreRunner{
		Env:       &FakeEnvManager{Env: map[string]string{}},
		Exec:      &FakeExecRunner{Results: make(map[string]FakeExecResult)},
		FS:        NewFakeFileSystem(),
		CheckRoot: func() error { return nil },
	}
	cmd := NewRestoreCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{"/tmp/nonexistent.tar.gz"})
	err := cmd.Execute()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "file not found")
}

func TestBackupCmd_ViaCobra(t *testing.T) {
	paths, fs, exec := recoveryFixture(t, false)
	r := &BackupRunner{
		Paths:     paths,
		Env:       &FileEnvManager{Path: paths.EnvFile},
		Exec:      exec,
		FS:        fs,
		CheckRoot: func() error { return nil },
	}
	cmd := NewBackupCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{"-o", filepath.Dir(paths.ConfigDir)})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Backup saved to:")
}

func TestResetPasswordCmd_ViaCobra(t *testing.T) {
	r := &ResetPasswordRunner{
		Env: &FakeEnvManager{Env: map[string]string{
			"DATABASE_PASSWORD": "pass",
			"DATABASE_HOST":     "localhost",
		}},
		Exec: &FakeExecRunner{Results: map[string]FakeExecResult{
			"psql -h": {Stdout: "UPDATE 1", ExitCode: 0},
		}},
		Hasher:    &FakePasswordHasher{},
		CheckRoot: func() error { return nil },
	}
	cmd := NewResetPasswordCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	// Use default email (admin@heimdall.local)
	cmd.SetArgs([]string{})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Password reset for admin@heimdall.local")
}

func TestAddCertCmd_ViaCobra_MissingFile(t *testing.T) {
	r := &AddCertRunner{
		Env:       &FakeEnvManager{Env: map[string]string{}},
		Exec:      &FakeExecRunner{Results: make(map[string]FakeExecResult)},
		FS:        NewFakeFileSystem(),
		CheckRoot: func() error { return nil },
	}
	cmd := NewAddCertCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{"/tmp/test.pem"})
	err := cmd.Execute()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

func TestValidateCmd_ViaCobra(t *testing.T) {
	r := &ValidateRunner{
		Env: &FakeEnvManager{Env: map[string]string{
			"DATABASE_PASSWORD": "pass",
			"JWT_SECRET":        "secret",
		}},
		FS: NewFakeFileSystem(),
		DB: &FakeDBConnector{},
	}
	cmd := NewValidateCmd(r)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{"--skip-db"})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Configuration valid")
}
