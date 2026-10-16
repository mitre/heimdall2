//go:build functional

package cmd

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// binaryPath builds the CLI binary once and returns its path.
// Uses a temp directory so tests don't pollute the repo.
var testBinary string

func TestMain(m *testing.M) {
	// Build the binary for functional tests
	dir, err := os.MkdirTemp("", "heimdall-cli-test-*")
	if err != nil {
		panic("failed to create temp dir: " + err.Error())
	}
	defer os.RemoveAll(dir)

	testBinary = filepath.Join(dir, "heimdall-cli")
	build := exec.Command("go", "build", "-o", testBinary, "../../cmd/heimdall-cli")
	build.Dir, _ = os.Getwd()
	out, err := build.CombinedOutput()
	if err != nil {
		panic("failed to build binary: " + err.Error() + "\n" + string(out))
	}

	os.Exit(m.Run())
}

// run executes the built binary with args and returns stdout+stderr and exit code.
func run(args ...string) (string, int) {
	cmd := exec.Command(testBinary, args...)
	out, err := cmd.CombinedOutput()
	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			exitCode = -1
		}
	}
	return string(out), exitCode
}

// runWithEnv executes with extra environment variables.
func runWithEnv(env map[string]string, args ...string) (string, int) {
	cmd := exec.Command(testBinary, args...)
	cmd.Env = os.Environ()
	for k, v := range env {
		cmd.Env = append(cmd.Env, k+"="+v)
	}
	out, err := cmd.CombinedOutput()
	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			exitCode = -1
		}
	}
	return string(out), exitCode
}

// --- Global flags ---

func TestFunctional_Version(t *testing.T) {
	out, code := run("--version")
	assert.Equal(t, 0, code)
	assert.Contains(t, out, "heimdall-cli")
}

func TestFunctional_Help(t *testing.T) {
	out, code := run("--help")
	assert.Equal(t, 0, code)
	assert.Contains(t, out, "administration tool for Heimdall")
	assert.Contains(t, out, "backup")
	assert.Contains(t, out, "status")
}

// --- All subcommands --help ---

func TestFunctional_SubcommandHelp(t *testing.T) {
	subcmds := []struct {
		name   string
		expect string
	}{
		{"backup", "Backup"},
		{"restore", "Restore"},
		{"config", "View or modify"},
		{"setup", "orchestrates"},
		{"status", "status report"},
		{"start", "Start"},
		{"stop", "Stop"},
		{"restart", "Restart"},
		{"logs", "View"},
		{"diag", "diagnostic"},
		{"reset-password", "Reset"},
		{"set-port", "Change"},
		{"add-cert", "Add"},
	}

	for _, tc := range subcmds {
		t.Run(tc.name, func(t *testing.T) {
			out, code := run(tc.name, "--help")
			assert.Equal(t, 0, code, "exit code for %s --help", tc.name)
			assert.Contains(t, strings.ToLower(out), strings.ToLower(tc.expect),
				"%s --help should contain %q", tc.name, tc.expect)
		})
	}
}

// --- Config subcommands ---

func TestFunctional_ConfigListShowsCategories(t *testing.T) {
	out, code := run("config", "list")
	assert.Equal(t, 0, code)
	assert.Contains(t, out, "Core")
	assert.Contains(t, out, "Database")
	assert.Contains(t, out, "PORT")
}

func TestFunctional_ConfigGetFromEnvFile(t *testing.T) {
	// Create a temp env file
	tmp, err := os.CreateTemp("", "test-heimdall-*.env")
	require.NoError(t, err)
	defer os.Remove(tmp.Name())

	_, err = tmp.WriteString("PORT=3000\nDATABASE_HOST=localhost\n")
	require.NoError(t, err)
	tmp.Close()

	out, code := runWithEnv(map[string]string{"HEIMDALL_ENV_FILE": tmp.Name()},
		"config", "get", "PORT")
	assert.Equal(t, 0, code)
	assert.Contains(t, out, "PORT=3000")
}

func TestFunctional_ConfigGetUnknownKey(t *testing.T) {
	_, code := run("config", "get", "NONEXISTENT_KEY_XYZ_123")
	assert.NotEqual(t, 0, code)
}

// --- Missing arg errors ---

func TestFunctional_MissingArgs(t *testing.T) {
	cmds := []struct {
		name string
		args []string
	}{
		{"restore", []string{"restore"}},
		{"set-port", []string{"set-port"}},
		{"add-cert", []string{"add-cert"}},
		{"config get", []string{"config", "get"}},
		{"config set one arg", []string{"config", "set", "ONLY_ONE"}},
	}

	for _, tc := range cmds {
		t.Run(tc.name, func(t *testing.T) {
			_, code := run(tc.args...)
			assert.NotEqual(t, 0, code, "%s should fail with missing args", tc.name)
		})
	}
}

// --- Unknown command ---

func TestFunctional_UnknownCommand(t *testing.T) {
	_, code := run("nonexistent-command")
	assert.NotEqual(t, 0, code)
}

// --- Config flag ---

func TestFunctional_ConfigFlagWithValidFile(t *testing.T) {
	tmp, err := os.CreateTemp("", "test-heimdall-*.yaml")
	require.NoError(t, err)
	defer os.Remove(tmp.Name())

	_, err = tmp.WriteString("db-host: localhost\ndb-port: 5432\n")
	require.NoError(t, err)
	tmp.Close()

	_, code := run("--config", tmp.Name(), "config", "list")
	assert.Equal(t, 0, code)
}

func TestFunctional_ConfigFlagWithMissingFile(t *testing.T) {
	// Config file is optional — should not error
	_, code := run("--config", "/tmp/no-such-heimdall-config-XXXXX.yaml", "config", "list")
	assert.Equal(t, 0, code)
}
