package cmd

import (
	"os"
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

func TestSetupDatabaseInputPrecedence(t *testing.T) {
	const yaml = "db-host: yaml.example.test\ndb-port: 6432\ndb-user: yamluser\ndb-password: yaml-secret\ndb-name: yamldb\n"
	const saved = "DATABASE_HOST=saved.example.test\nDATABASE_PORT=7432\nDATABASE_USERNAME=saveduser\nDATABASE_PASSWORD=saved-secret\nDATABASE_NAME=saveddb\n"
	environment := map[string]string{
		"HEIMDALL_DB_HOST": "env.example.test", "HEIMDALL_DB_PORT": "8432",
		"HEIMDALL_DB_USER": "envuser", "HEIMDALL_DB_PASSWORD": "env-secret", "HEIMDALL_DB_NAME": "envdb",
	}
	for _, tc := range []struct {
		name, config, saved, want string
		env                       map[string]string
		flags                     []string
		password                  bool
	}{
		{name: "defaults", want: "postgres@localhost:5432/heimdall-server-production"},
		{name: "saved", saved: saved, want: "saveduser@saved.example.test:7432/saveddb", password: true},
		{name: "yaml overrides saved", config: yaml, saved: saved, want: "yamluser@yaml.example.test:6432/yamldb", password: true},
		{name: "environment overrides yaml", config: yaml, saved: saved, env: environment, want: "envuser@env.example.test:8432/envdb", password: true},
		{name: "partial environment retains saved values", saved: saved, env: map[string]string{"HEIMDALL_DB_HOST": "env.example.test"}, want: "saveduser@env.example.test:7432/saveddb", password: true},
		{name: "explicit defaults override all inputs", config: yaml, saved: saved, env: environment,
			flags: []string{"--db-host=localhost", "--db-port=5432", "--db-user=postgres", "--db-password=", "--db-name=heimdall-server-production"},
			want:  "postgres@localhost:5432/heimdall-server-production"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			for key := range environment {
				t.Setenv(key, tc.env[key])
			}
			dir := t.TempDir()
			envPath, configPath := filepath.Join(dir, "backend.env"), filepath.Join(dir, "cli.yaml")
			require.NoError(t, os.WriteFile(envPath, []byte(tc.saved), 0600))
			require.NoError(t, os.WriteFile(configPath, []byte(tc.config), 0600))
			args := []string{"--env-file", envPath, "--app-dir", dir, "--config", configPath, "setup", "--dry-run", "--database-mode=external", "--proxy-mode=external"}
			out, _, err := executeCommand(t, append(args, tc.flags...)...)
			require.NoError(t, err)
			require.Contains(t, out, "Database: "+tc.want)
			if tc.password {
				require.NotContains(t, out, "DATABASE_PASSWORD: would auto-generate")
			} else {
				require.Contains(t, out, "DATABASE_PASSWORD: would auto-generate")
			}
			for _, secret := range []string{"yaml-secret", "env-secret", "saved-secret"} {
				require.NotContains(t, out, secret)
			}
			data, err := os.ReadFile(envPath)
			require.NoError(t, err)
			require.Equal(t, tc.saved, string(data), "dry run must not change the configuration")
		})
	}
}

func TestSetupRejectsInvalidDatabasePortFromEnvironment(t *testing.T) {
	for _, port := range []string{"invalid", "0", "65536", "5432.5"} {
		t.Run(port, func(t *testing.T) {
			t.Setenv("HEIMDALL_DB_PORT", port)
			dir := t.TempDir()
			config := filepath.Join(dir, "cli.yaml")
			require.NoError(t, os.WriteFile(config, nil, 0600))
			_, _, err := executeCommand(t, "--config", config, "--env-file", filepath.Join(dir, "missing.env"), "--app-dir", dir, "setup", "--dry-run", "--database-mode=external", "--proxy-mode=external")
			require.Error(t, err)
		})
	}
}
