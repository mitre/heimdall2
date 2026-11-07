package cmd

import (
	"fmt"
	"os"

	"golang.org/x/sys/unix"
)

// UseColor returns true when stdout is a terminal and NO_COLOR is unset.
func UseColor() bool {
	if _, ok := os.LookupEnv("NO_COLOR"); ok {
		return false
	}
	_, err := unix.IoctlGetWinsize(int(os.Stdout.Fd()), unix.TIOCGWINSZ)
	return err == nil
}

func ansi(code, text string) string {
	if UseColor() {
		return fmt.Sprintf("\033[%sm%s\033[0m", code, text)
	}
	return text
}

func Green(t string) string  { return ansi("32", t) }
func Red(t string) string    { return ansi("31", t) }
func Yellow(t string) string { return ansi("33", t) }
func Cyan(t string) string   { return ansi("36", t) }
func Bold(t string) string   { return ansi("1", t) }
func Dim(t string) string    { return ansi("2", t) }

// Status line helpers.
func Ok(label string) string   { return Green("\u2713") + " " + label }
func Warn(label string) string { return Yellow("\u26a0") + " " + label }
func Fail(label string) string { return Red("\u2717") + " " + label }
func Skip(label string) string { return Dim("\u25cb " + label) }
