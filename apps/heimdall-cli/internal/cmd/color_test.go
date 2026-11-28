package cmd

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestUseColor_FalseWhenNoColorSet(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	assert.False(t, UseColor(), "UseColor should return false when NO_COLOR is set")
}

func TestAnsi_PlainTextWhenNoColor(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	assert.Equal(t, "hello", ansi("32", "hello"), "ansi should return plain text when NO_COLOR is set")
}

func TestGreen_NoColor(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	assert.Equal(t, "hello", Green("hello"))
}

func TestRed_NoColor(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	assert.Equal(t, "hello", Red("hello"))
}

func TestYellow_NoColor(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	assert.Equal(t, "hello", Yellow("hello"))
}

func TestCyan_NoColor(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	assert.Equal(t, "hello", Cyan("hello"))
}

func TestBold_NoColor(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	assert.Equal(t, "hello", Bold("hello"))
}

func TestDim_NoColor(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	assert.Equal(t, "hello", Dim("hello"))
}

func TestOk_NoColor(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	result := Ok("passed")
	assert.Contains(t, result, "\u2713")
	assert.Contains(t, result, "passed")
}

func TestWarn_NoColor(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	result := Warn("caution")
	assert.Contains(t, result, "\u26a0")
	assert.Contains(t, result, "caution")
}

func TestFail_NoColor(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	result := Fail("error")
	assert.Contains(t, result, "\u2717")
	assert.Contains(t, result, "error")
}

func TestSkip_NoColor(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	result := Skip("skipped")
	assert.Contains(t, result, "\u25cb")
	assert.Contains(t, result, "skipped")
}

func TestColor_NoColorEnv(t *testing.T) {
	t.Setenv("NO_COLOR", "1")
	result := Green("hello")
	assert.Equal(t, "hello", result)
	assert.NotContains(t, result, "\033[")
}

func TestAnsiDirect_AlwaysAppliesColor(t *testing.T) {
	// ansiDirect bypasses UseColor() — always applies ANSI codes.
	// This is the path used by FormatCLIError(err, true).
	result := ansiDirect("32", "hello")
	assert.Contains(t, result, "\033[32m")
	assert.Contains(t, result, "hello")
	assert.Contains(t, result, "\033[0m")
}

func TestFormatCLIError_ColoredRegularError(t *testing.T) {
	// FormatCLIError with color=true on a regular (non-CLIError) error.
	err := fmt.Errorf("disk full")
	output := FormatCLIError(err, true)
	assert.Contains(t, output, "\033[31m")
	assert.Contains(t, output, "Error:")
	assert.Contains(t, output, "disk full")
}

func TestFormatCLIError_ColoredCLIErrorWithAllFields(t *testing.T) {
	err := &CLIError{
		Summary:    "backup failed",
		Detail:     "no space left on device",
		Suggestion: "Free disk space or use a different path",
	}
	output := FormatCLIError(err, true)
	// Summary colored in red (31)
	assert.Contains(t, output, "\033[31m")
	assert.Contains(t, output, "backup failed")
	// Detail colored in dim (2)
	assert.Contains(t, output, "\033[2m")
	assert.Contains(t, output, "no space left on device")
	// Suggestion colored in yellow (33)
	assert.Contains(t, output, "\033[33m")
	assert.Contains(t, output, "Fix:")
	assert.Contains(t, output, "Free disk space")
}
