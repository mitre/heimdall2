package main

import (
	"fmt"
	"os"
	"time"

	"github.com/mitre/heimdall2/apps/heimdall-cli/internal/cmd"
	"github.com/spf13/cobra/doc"
)

func generate(dir string) error {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	root := cmd.NewRootCmd()
	root.DisableAutoGenTag = true
	date := time.Date(2026, 9, 22, 0, 0, 0, 0, time.UTC)
	return doc.GenManTree(root, &doc.GenManHeader{
		Title: "HEIMDALL-CLI", Section: "1", Date: &date,
		Source: "Heimdall", Manual: "Heimdall administration",
	}, dir)
}

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "Usage: gen-manpages OUTPUT_DIRECTORY")
		os.Exit(64)
	}
	if err := generate(os.Args[1]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
