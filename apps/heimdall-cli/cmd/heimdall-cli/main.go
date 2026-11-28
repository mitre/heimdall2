package main

import (
	"fmt"
	"os"

	"github.com/mitre/heimdall2/apps/heimdall-cli/internal/cmd"
)

func main() {
	if err := cmd.Execute(); err != nil {
		if cmd.IsUserAbort(err) {
			fmt.Fprintln(os.Stderr, "\nSetup cancelled.")
			os.Exit(130) // standard exit code for Ctrl+C
		}
		color := os.Getenv("NO_COLOR") == "" && isTerminal()
		fmt.Fprint(os.Stderr, cmd.FormatCLIError(err, color))
		os.Exit(1)
	}
}

func isTerminal() bool {
	fi, err := os.Stderr.Stat()
	if err != nil {
		return false
	}
	return fi.Mode()&os.ModeCharDevice != 0
}
