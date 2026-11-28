package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestGenerateCommandPages(t *testing.T) {
	dir := t.TempDir()
	if err := generate(dir); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"heimdall-cli.1", "heimdall-cli-setup.1", "heimdall-cli-backup.1"} {
		data, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil {
			t.Fatal(err)
		}
		if len(data) == 0 {
			t.Fatalf("empty page: %s", name)
		}
	}
	data, err := os.ReadFile(filepath.Join(dir, "heimdall-cli-setup.1"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(strings.ReplaceAll(string(data), "\\-", "-"), "skip-tls") {
		t.Fatal("setup flags missing")
	}
}
