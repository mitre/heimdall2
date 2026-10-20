package cmd

import (
	"path/filepath"
	"testing"

	"github.com/spf13/afero"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRootCmd_Help(t *testing.T) {
	stdout, _, err := executeCommand(t, "--help")
	require.NoError(t, err)
	assert.Contains(t, stdout, "administration tool for Heimdall Server")
}

func TestRootCmd_Version(t *testing.T) {
	stdout, _, err := executeCommand(t, "--version")
	require.NoError(t, err)
	assert.Contains(t, stdout, "dev")
}

// TestRootCmd_NilRunnerSubcommands verifies that every subcommand registered
// via NewRootCmd() can at least show --help without panicking. This catches
// nil-runner bugs where production defaults aren't initialized.
func TestRootCmd_NilRunnerSubcommands(t *testing.T) {
	root := NewRootCmd()
	for _, sub := range root.Commands() {
		t.Run(sub.Name()+"_help", func(t *testing.T) {
			root := NewRootCmd()
			root.SetArgs([]string{sub.Name(), "--help"})
			err := root.Execute()
			assert.NoError(t, err, "command %q --help should not panic or error", sub.Name())
		})
	}
}

func TestRootCmd_HasGlobalFlags(t *testing.T) {
	root := NewRootCmd()
	assert.NotNil(t, root.PersistentFlags().Lookup("db-host"))
	assert.NotNil(t, root.PersistentFlags().Lookup("db-port"))
	assert.NotNil(t, root.PersistentFlags().Lookup("verbose"))
	assert.NotNil(t, root.PersistentFlags().Lookup("config"))
}

func TestLocalConfigRequiresExplicitPath(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	path := filepath.Join(dir, "heimdall-cli.yaml")
	for _, explicit := range []bool{false, true} {
		v := viper.New()
		fs := afero.NewMemMapFs()
		v.SetFs(fs)
		registerPathDefaults(v)
		require.NoError(t, afero.WriteFile(fs, path, []byte("libexec-dir: /untrusted/runtime\n"), 0600))
		config := ""
		expected := LibExecDir
		if explicit {
			config, expected = path, "/untrusted/runtime"
		}
		require.NoError(t, initConfig(v, config))
		require.Equal(t, expected, NewPathsFromViper(v).LibExecDir)
	}
}
