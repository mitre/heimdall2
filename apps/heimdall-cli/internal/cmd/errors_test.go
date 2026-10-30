package cmd

import (
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCLIError_Error(t *testing.T) {
	err := &CLIError{
		Summary: "database connection failed",
		Err:     fmt.Errorf("connection refused"),
	}
	assert.Equal(t, "database connection failed: connection refused", err.Error())
}

func TestCLIError_ErrorWithoutWrapped(t *testing.T) {
	err := &CLIError{
		Summary: "missing required configuration",
	}
	assert.Equal(t, "missing required configuration", err.Error())
}

func TestCLIError_Unwrap(t *testing.T) {
	inner := fmt.Errorf("ECONNREFUSED")
	err := &CLIError{
		Summary: "connection failed",
		Err:     inner,
	}
	assert.True(t, errors.Is(err, inner))
}

func TestCLIError_FullFields(t *testing.T) {
	err := &CLIError{
		Summary:    "PostgreSQL bootstrap failed",
		Detail:     "postgres-setup.sh exited with code 1",
		Suggestion: "Check PostgreSQL is installed: sudo dnf install postgresql-server",
		Err:        fmt.Errorf("exit code 1"),
	}
	assert.Contains(t, err.Error(), "PostgreSQL bootstrap failed")
	assert.Equal(t, "postgres-setup.sh exited with code 1", err.Detail)
	assert.Contains(t, err.Suggestion, "sudo dnf install")
}

func TestFormatCLIError_PlainText(t *testing.T) {
	err := &CLIError{
		Summary:    "database connection failed",
		Detail:     "cannot connect to localhost:5432/heimdall-server-production",
		Suggestion: "Check PostgreSQL is running: sudo systemctl status postgresql",
	}
	output := FormatCLIError(err, false)
	assert.Contains(t, output, "Error: database connection failed")
	assert.Contains(t, output, "cannot connect to localhost:5432")
	assert.Contains(t, output, "Fix: Check PostgreSQL is running")
}

func TestFormatCLIError_RegularError(t *testing.T) {
	err := fmt.Errorf("something went wrong")
	output := FormatCLIError(err, false)
	assert.Contains(t, output, "Error: something went wrong")
	assert.NotContains(t, output, "Fix:")
}

func TestFormatCLIError_WithColor(t *testing.T) {
	err := &CLIError{
		Summary:    "service start failed",
		Suggestion: "Run: sudo systemctl status heimdall-server",
	}
	output := FormatCLIError(err, true)
	// Should contain ANSI escape codes
	assert.Contains(t, output, "\033[")
	assert.Contains(t, output, "service start failed")
}

func TestCLIError_WrapWithSuggestion(t *testing.T) {
	inner := fmt.Errorf("ECONNREFUSED")
	err := WrapError(inner, "database connection failed",
		"Check PostgreSQL is running: sudo systemctl status postgresql")

	var cliErr *CLIError
	require.True(t, errors.As(err, &cliErr))
	assert.Equal(t, "database connection failed", cliErr.Summary)
	assert.Contains(t, cliErr.Suggestion, "sudo systemctl status postgresql")
	assert.True(t, errors.Is(err, inner))
}

func TestCLIError_WrapWithoutSuggestion(t *testing.T) {
	inner := fmt.Errorf("file not found")
	err := WrapError(inner, "backup failed", "")

	var cliErr *CLIError
	require.True(t, errors.As(err, &cliErr))
	assert.Equal(t, "backup failed", cliErr.Summary)
	assert.Empty(t, cliErr.Suggestion)
}

func TestIsUserAbort(t *testing.T) {
	assert.True(t, IsUserAbort(fmt.Errorf("user aborted")))
	assert.True(t, IsUserAbort(fmt.Errorf("operation interrupted")))
	assert.True(t, IsUserAbort(fmt.Errorf("canceled by user")))
	assert.False(t, IsUserAbort(fmt.Errorf("connection refused")))
	assert.False(t, IsUserAbort(nil))
}
