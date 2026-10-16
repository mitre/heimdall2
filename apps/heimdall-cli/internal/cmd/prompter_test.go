package cmd

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	xansi "github.com/charmbracelet/x/ansi"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHuhPrompterInputDefaults(t *testing.T) {
	for _, tc := range []struct {
		name, input, fallback, want, title string
	}{
		{"Enter accepts default", "\n", "localhost", "localhost", "External URL (default: localhost)"},
		{"typed value overrides default", "example.test\n", "localhost", "example.test", "External URL (default: localhost)"},
		{"no default", "\n", "", "", "External URL"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			dir := t.TempDir()
			inputPath := filepath.Join(dir, "input")
			require.NoError(t, os.WriteFile(inputPath, []byte(tc.input), 0600))
			input, err := os.Open(inputPath)
			require.NoError(t, err)
			defer input.Close()
			output, err := os.Create(filepath.Join(dir, "output"))
			require.NoError(t, err)
			defer output.Close()
			stdin, stdout := os.Stdin, os.Stdout
			t.Cleanup(func() { os.Stdin, os.Stdout = stdin, stdout })
			os.Stdin, os.Stdout = input, output
			value, err := (&huhPrompter{}).Input("External URL", tc.fallback)
			os.Stdin, os.Stdout = stdin, stdout
			require.NoError(t, err)
			assert.Equal(t, tc.want, value)
			shown, err := os.ReadFile(output.Name())
			require.NoError(t, err)
			assert.Equal(t, tc.title, strings.TrimSpace(xansi.Strip(string(shown))))
		})
	}
}

func TestFakePrompter_Input(t *testing.T) {
	p := &FakePrompter{
		Inputs: map[string]string{
			"Database host": "db.example.com",
		},
	}
	val, err := p.Input("Database host", "localhost")
	require.NoError(t, err)
	assert.Equal(t, "db.example.com", val)
}

func TestFakePrompter_Input_UsesDefault(t *testing.T) {
	p := &FakePrompter{
		Inputs: map[string]string{},
	}
	val, err := p.Input("Database host", "localhost")
	require.NoError(t, err)
	assert.Equal(t, "localhost", val)
}

func TestFakePrompter_Password(t *testing.T) {
	p := &FakePrompter{
		Inputs: map[string]string{
			"Database password": "secret123",
		},
	}
	val, err := p.Password("Database password")
	require.NoError(t, err)
	assert.Equal(t, "secret123", val)
}

func TestFakePrompter_Confirm(t *testing.T) {
	p := &FakePrompter{
		Confirms: map[string]bool{
			"Continue?": true,
		},
	}
	val, err := p.Confirm("Continue?", false)
	require.NoError(t, err)
	assert.True(t, val)
}

func TestFakePrompter_Confirm_UsesDefault(t *testing.T) {
	p := &FakePrompter{
		Confirms: map[string]bool{},
	}
	val, err := p.Confirm("Continue?", false)
	require.NoError(t, err)
	assert.False(t, val)
}

func TestFakePrompter_Select(t *testing.T) {
	p := &FakePrompter{
		Selects: map[string]int{
			"Choose option": 2,
		},
	}
	val, err := p.Select("Choose option", "", []string{"a", "b", "c"})
	require.NoError(t, err)
	assert.Equal(t, 2, val)
}

func TestFakePrompter_CanPrompt(t *testing.T) {
	p := &FakePrompter{IsTTY: true}
	assert.True(t, p.CanPrompt())

	p.IsTTY = false
	assert.False(t, p.CanPrompt())
}

func TestFakeTerminalDetector(t *testing.T) {
	d := &FakeTerminalDetector{TTY: true}
	assert.True(t, d.IsTerminal())

	d.TTY = false
	assert.False(t, d.IsTerminal())
}
