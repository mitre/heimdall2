package cmd

// Package cmd provides the Heimdall CLI command implementations.

import "strings"

// IsUserAbort returns true if the error represents user cancellation (Esc/Ctrl+C).
func IsUserAbort(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "user aborted") ||
		strings.Contains(msg, "interrupted") ||
		strings.Contains(msg, "canceled")
}

// CLIError is a structured error with actionable guidance for the user.
// Pattern from gh CLI: Summary tells WHAT failed, Detail tells WHY,
// Suggestion tells HOW TO FIX.
type CLIError struct {
	Summary    string // what failed (shown after "Error:")
	Detail     string // why it failed (shown indented)
	Suggestion string // how to fix it (shown after "Fix:")
	Err        error  // wrapped underlying error
}

func (e *CLIError) Error() string {
	if e.Err != nil {
		return e.Summary + ": " + e.Err.Error()
	}
	return e.Summary
}

func (e *CLIError) Unwrap() error {
	return e.Err
}

// WrapError creates a CLIError wrapping an existing error with a summary
// and optional suggestion. Use empty suggestion when no fix is known.
func WrapError(err error, summary, suggestion string) error {
	return &CLIError{
		Summary:    summary,
		Detail:     err.Error(),
		Suggestion: suggestion,
		Err:        err,
	}
}

// FormatCLIError formats any error for display on stderr.
// CLIErrors get structured output with Summary/Detail/Suggestion.
// Regular errors get a simple "Error: message" line.
// When color is true, ANSI codes are applied directly (bypassing UseColor check).
func FormatCLIError(err error, color bool) string {
	cliErr, ok := err.(*CLIError)
	if !ok {
		if color {
			return ansiDirect("31", "Error:") + " " + err.Error() + "\n"
		}
		return "Error: " + err.Error() + "\n"
	}

	var s string
	if color {
		s = ansiDirect("31", "Error:") + " " + cliErr.Summary + "\n"
	} else {
		s = "Error: " + cliErr.Summary + "\n"
	}

	if cliErr.Detail != "" {
		if color {
			s += "  " + ansiDirect("2", cliErr.Detail) + "\n"
		} else {
			s += "  " + cliErr.Detail + "\n"
		}
	}

	if cliErr.Suggestion != "" {
		if color {
			s += ansiDirect("33", "Fix:") + " " + cliErr.Suggestion + "\n"
		} else {
			s += "Fix: " + cliErr.Suggestion + "\n"
		}
	}

	return s
}

// ansiDirect applies ANSI codes without checking UseColor().
// Used by FormatCLIError which has its own color flag.
func ansiDirect(code, text string) string {
	return "\033[" + code + "m" + text + "\033[0m"
}
