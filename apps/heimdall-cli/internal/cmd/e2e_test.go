//go:build e2e

package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// e2e tests cross-compile the binary, push to an OrbStack VM, and run via SSH.
// Usage: go test -tags e2e -run TestE2E ./internal/cmd/ -vm oracle
//
// These tests require:
//   - orb CLI (OrbStack) installed on macOS
//   - SSH access to the VM via <vm>@orb
//   - Go toolchain for cross-compilation

var e2eVM = "oracle"
var e2eRemotePath = "/tmp/heimdall-cli"

func init() {
	if v := os.Getenv("E2E_VM"); v != "" {
		e2eVM = v
	}
}

// sshRun executes a command on the VM via SSH and returns output + exit code.
func sshRun(cmd string) (string, int) {
	c := exec.Command("ssh", e2eVM+"@orb", cmd)
	out, err := c.CombinedOutput()
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

func TestE2E_Setup(t *testing.T) {
	// Cross-compile
	t.Log("Cross-compiling for linux/arm64...")
	build := exec.Command("go", "build",
		"-o", "heimdall-cli-linux-arm64",
		"../../cmd/heimdall-cli")
	build.Env = append(os.Environ(), "GOOS=linux", "GOARCH=arm64", "CGO_ENABLED=0")
	out, err := build.CombinedOutput()
	require.NoError(t, err, "cross-compile failed: %s", string(out))
	defer os.Remove("heimdall-cli-linux-arm64")

	// Push to VM
	t.Log("Pushing binary to VM...")
	push := exec.Command("orb", "push", "-m", e2eVM, "heimdall-cli-linux-arm64", e2eRemotePath)
	out, err = push.CombinedOutput()
	require.NoError(t, err, "orb push failed: %s", string(out))

	// Make executable
	sshOut, code := sshRun(fmt.Sprintf("chmod +x %s", e2eRemotePath))
	require.Equal(t, 0, code, "chmod failed: %s", sshOut)

	t.Log("Binary deployed successfully")
}

func TestE2E_Version(t *testing.T) {
	out, code := sshRun(fmt.Sprintf("%s --version", e2eRemotePath))
	assert.Equal(t, 0, code)
	assert.Contains(t, out, "heimdall-cli")
}

func TestE2E_Help(t *testing.T) {
	out, code := sshRun(fmt.Sprintf("%s --help", e2eRemotePath))
	assert.Equal(t, 0, code)
	assert.Contains(t, out, "Admin tool")
}

func TestE2E_Status(t *testing.T) {
	out, code := sshRun(fmt.Sprintf("sudo %s status", e2eRemotePath))
	assert.Equal(t, 0, code)
	assert.Contains(t, out, "Service")
	assert.Contains(t, out, "Database")
}

func TestE2E_ConfigList(t *testing.T) {
	out, code := sshRun(fmt.Sprintf("sudo %s config list", e2eRemotePath))
	assert.Equal(t, 0, code)
	assert.True(t, len(strings.TrimSpace(out)) > 0, "config list should produce output")
}

func TestE2E_Diag(t *testing.T) {
	out, code := sshRun(fmt.Sprintf("sudo %s diag", e2eRemotePath))
	assert.Equal(t, 0, code)
	assert.Contains(t, out, "Diagnostic Report")
}

func TestE2E_BackupRequiresRoot(t *testing.T) {
	out, code := sshRun(fmt.Sprintf("%s backup", e2eRemotePath))
	assert.NotEqual(t, 0, code)
	assert.Contains(t, strings.ToLower(out), "root")
}
