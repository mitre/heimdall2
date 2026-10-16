package cmd

import (
	"bytes"
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newServiceRunner() (*ServiceRunner, *FakeSystemdRunner, *FakeExecRunner, *bytes.Buffer) {
	out := new(bytes.Buffer)
	errOut := new(bytes.Buffer)
	systemd := &FakeSystemdRunner{
		ActiveServices: map[string]bool{ServiceName: true},
		Properties:     map[string]string{},
	}
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{}}
	env := &FakeEnvManager{Env: map[string]string{}}
	return &ServiceRunner{
		Systemd: systemd,
		Exec:    exec,
		Env:     env,
		Out:     out,
		ErrOut:  errOut,
		Paths:   DefaultPaths(),
	}, systemd, exec, out
}

func TestServiceStart(t *testing.T) {
	runner, systemd, _, out := newServiceRunner()
	err := runner.Start()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Service started.")
	assert.Contains(t, systemd.Actions, "start:"+ServiceName)
}

func TestServiceStop(t *testing.T) {
	runner, systemd, _, out := newServiceRunner()
	err := runner.Stop()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Service stopped.")
	assert.Contains(t, systemd.Actions, "stop:"+ServiceName)
}

func TestServiceRestart(t *testing.T) {
	runner, systemd, _, out := newServiceRunner()
	err := runner.Restart()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Service restarted.")
	assert.Contains(t, systemd.Actions, "restart:"+ServiceName)
}

func TestServiceLogs_NoFollow(t *testing.T) {
	runner, _, exec, out := newServiceRunner()
	exec.Results["journalctl -u"] = FakeExecResult{Stdout: "log line 1\nlog line 2", ExitCode: 0}

	err := runner.Logs(50, false)
	require.NoError(t, err)
	assert.Contains(t, out.String(), "log line 1")
}

func TestServiceDiag(t *testing.T) {
	runner, _, exec, out := newServiceRunner()
	exec.Results["cat /etc/os-release"] = FakeExecResult{Stdout: "NAME=TestOS\nVERSION=1.0\n", ExitCode: 0}
	exec.Results["uname -rm"] = FakeExecResult{Stdout: "5.14.0 x86_64", ExitCode: 0}
	exec.Results["free -h"] = FakeExecResult{Stdout: "              total\nMem:          16Gi", ExitCode: 0}
	exec.Results["ss -tlnp"] = FakeExecResult{Stdout: "LISTEN 0 128 *:3000\nLISTEN 0 128 *:5432", ExitCode: 0}

	err := runner.Diag()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Diagnostic Report")
	assert.Contains(t, out.String(), "--- OS ---")
	assert.Contains(t, out.String(), "Kernel: 5.14.0 x86_64")
	assert.Contains(t, out.String(), "--- Memory ---")
	assert.Contains(t, out.String(), ":3000")
}

func TestStart_RootCheckFails(t *testing.T) {
	r := &ServiceRunner{
		Exec:      &FakeExecRunner{Results: make(map[string]FakeExecResult)},
		Systemd:   &FakeSystemdRunner{ActiveServices: make(map[string]bool), Properties: make(map[string]string)},
		Out:       new(bytes.Buffer),
		ErrOut:    new(bytes.Buffer),
		CheckRoot: func() error { return errors.New("not root") },
	}
	err := r.Start()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not root")
}

func TestStop_RootCheckFails(t *testing.T) {
	r := &ServiceRunner{
		Exec:      &FakeExecRunner{Results: make(map[string]FakeExecResult)},
		Systemd:   &FakeSystemdRunner{ActiveServices: make(map[string]bool), Properties: make(map[string]string)},
		Out:       new(bytes.Buffer),
		ErrOut:    new(bytes.Buffer),
		CheckRoot: func() error { return errors.New("not root") },
	}
	err := r.Stop()
	assert.Error(t, err)
}

func TestRestart_RootCheckFails(t *testing.T) {
	r := &ServiceRunner{
		Exec:      &FakeExecRunner{Results: make(map[string]FakeExecResult)},
		Systemd:   &FakeSystemdRunner{ActiveServices: make(map[string]bool), Properties: make(map[string]string)},
		Out:       new(bytes.Buffer),
		ErrOut:    new(bytes.Buffer),
		CheckRoot: func() error { return errors.New("not root") },
	}
	err := r.Restart()
	assert.Error(t, err)
}

func TestServiceLogs_Follow(t *testing.T) {
	// Save original execvp and restore after test
	originalExecvp := execvp
	defer func() { execvp = originalExecvp }()

	var capturedName string
	var capturedArgs []string
	execvp = func(name string, args []string) error {
		capturedName = name
		capturedArgs = args
		return nil
	}

	runner, _, _, _ := newServiceRunner()
	err := runner.Logs(100, true)
	require.NoError(t, err)

	assert.Equal(t, "journalctl", capturedName)
	assert.Contains(t, capturedArgs, "-u")
	assert.Contains(t, capturedArgs, ServiceName)
	assert.Contains(t, capturedArgs, "-f")
	assert.Contains(t, capturedArgs, "--no-pager")
	assert.Contains(t, capturedArgs, "-n")
	assert.Contains(t, capturedArgs, "100")
}

func TestServiceLogs_FollowError(t *testing.T) {
	originalExecvp := execvp
	defer func() { execvp = originalExecvp }()

	execvp = func(name string, args []string) error {
		return fmt.Errorf("journalctl not found")
	}

	runner, _, _, _ := newServiceRunner()
	err := runner.Logs(50, true)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "journalctl not found")
}

func TestServiceLogs_NoFollowError(t *testing.T) {
	runner, _, exec, _ := newServiceRunner()
	exec.Results["journalctl -u"] = FakeExecResult{
		Err: errors.New("journal read error"),
	}

	err := runner.Logs(50, false)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to read logs")
}

func TestServiceStart_SystemdFails(t *testing.T) {
	runner, _, _, _ := newServiceRunner()
	runner.Systemd.(*FakeSystemdRunner).Err = errors.New("unit masked")
	err := runner.Start()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to start service")
}

func TestServiceStop_SystemdFails(t *testing.T) {
	runner, _, _, _ := newServiceRunner()
	runner.Systemd.(*FakeSystemdRunner).Err = errors.New("not loaded")
	err := runner.Stop()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to stop service")
}

func TestServiceRestart_SystemdFails(t *testing.T) {
	runner, _, _, _ := newServiceRunner()
	runner.Systemd.(*FakeSystemdRunner).Err = errors.New("timeout")
	err := runner.Restart()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to restart service")
}

func TestServiceStopLeavesSelectedPrivateServicesRunning(t *testing.T) {
	r, sd, exec, out := newServiceRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{"HEIMDALL_DATABASE_MODE": "bundled", "HEIMDALL_PROXY_MODE": "bundled"}
	sd.ActiveServices[bundledPGService], sd.ActiveServices[bundledCaddyService] = true, true
	require.NoError(t, r.Stop())
	require.Equal(t, []string{"stop:heimdall-server"}, sd.Actions)
	require.Empty(t, exec.Calls)
	require.True(t, sd.ActiveServices[bundledPGService])
	require.True(t, sd.ActiveServices[bundledCaddyService])
	require.Contains(t, out.String(), "Database and proxy services remain running")
}

func TestServiceDiagReportsOnlySelectedPrivateUnits(t *testing.T) {
	for _, mode := range []string{"bundled", "external"} {
		t.Run(mode, func(t *testing.T) {
			r, sd, _, out := newServiceRunner()
			r.Env.(*FakeEnvManager).Env = map[string]string{"HEIMDALL_DATABASE_MODE": mode, "HEIMDALL_PROXY_MODE": mode}
			sd.ActiveServices[bundledPGService] = true
			require.NoError(t, r.Diag())
			require.Empty(t, sd.Actions)
			if mode == "bundled" {
				require.Contains(t, out.String(), "heimdall-postgresql running: true (journalctl -u heimdall-postgresql)")
				require.Contains(t, out.String(), "heimdall-caddy running: false (journalctl -u heimdall-caddy)")
			} else {
				require.NotContains(t, out.String(), "heimdall-postgresql")
				require.NotContains(t, out.String(), "heimdall-caddy")
			}
		})
	}
}
