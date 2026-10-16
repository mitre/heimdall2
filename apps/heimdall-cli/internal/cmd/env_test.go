package cmd

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseEnv(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected map[string]string
	}{
		{
			name:     "simple key=value",
			input:    "PORT=3000\nHOST=localhost",
			expected: map[string]string{"PORT": "3000", "HOST": "localhost"},
		},
		{
			name:     "quoted value",
			input:    `DATABASE_NAME="heimdall-server-production"`,
			expected: map[string]string{"DATABASE_NAME": "heimdall-server-production"},
		},
		{
			name:     "single-quoted value",
			input:    `SECRET='my-secret'`,
			expected: map[string]string{"SECRET": "my-secret"},
		},
		{
			name:     "export prefix and literal escapes",
			input:    "export SECRET=\"quote\\\" \\$literal \\`text\\` \\\\ \\n\"",
			expected: map[string]string{"SECRET": "quote\" $literal `text` \\ \\n"},
		},
		{
			name:     "only one pair of outer quotes removed",
			input:    "SECRET='\"keep quotes\"'",
			expected: map[string]string{"SECRET": "\"keep quotes\""},
		},
		{
			name:     "variables and commands are not evaluated",
			input:    "SECRET=\"$HOME $(printf executed) `printf executed`\"",
			expected: map[string]string{"SECRET": "$HOME $(printf executed) `printf executed`"},
		},
		{
			name:     "comments and blank lines",
			input:    "# This is a comment\n\nPORT=3000\n# Another comment\nHOST=localhost\n",
			expected: map[string]string{"PORT": "3000", "HOST": "localhost"},
		},
		{
			name:     "no equals sign skipped",
			input:    "INVALID_LINE\nPORT=3000",
			expected: map[string]string{"PORT": "3000"},
		},
		{
			name:     "empty input",
			input:    "",
			expected: map[string]string{},
		},
		{
			name:     "value with equals sign",
			input:    "URL=postgres://user:pass@host:5432/db?sslmode=require",
			expected: map[string]string{"URL": "postgres://user:pass@host:5432/db?sslmode=require"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ParseEnv(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestFileEnvManager_WriteEnvKey(t *testing.T) {
	t.Run("updates existing key", func(t *testing.T) {
		dir := t.TempDir()
		path := filepath.Join(dir, "test.env")
		require.NoError(t, os.WriteFile(path, []byte("PORT=3000\nHOST=localhost\n"), 0640))

		m := &FileEnvManager{Path: path}
		require.NoError(t, m.WriteEnvKey("PORT", "8080"))

		env, err := m.ReadEnv()
		require.NoError(t, err)
		assert.Equal(t, "8080", env["PORT"])
		assert.Equal(t, "localhost", env["HOST"])
	})

	t.Run("adds new key", func(t *testing.T) {
		dir := t.TempDir()
		path := filepath.Join(dir, "test.env")
		require.NoError(t, os.WriteFile(path, []byte("PORT=3000\n"), 0640))

		m := &FileEnvManager{Path: path}
		require.NoError(t, m.WriteEnvKey("HOST", "0.0.0.0"))

		env, err := m.ReadEnv()
		require.NoError(t, err)
		assert.Equal(t, "3000", env["PORT"])
		assert.Equal(t, "0.0.0.0", env["HOST"])
	})

	t.Run("preserves comments", func(t *testing.T) {
		dir := t.TempDir()
		path := filepath.Join(dir, "test.env")
		content := "# Database config\nPORT=3000\n# End\n"
		require.NoError(t, os.WriteFile(path, []byte(content), 0640))

		m := &FileEnvManager{Path: path}
		require.NoError(t, m.WriteEnvKey("PORT", "8080"))

		data, err := os.ReadFile(path)
		require.NoError(t, err)
		assert.Contains(t, string(data), "# Database config")
		assert.Contains(t, string(data), "PORT=\"8080\"")
		assert.Contains(t, string(data), "# End")
	})
}

func TestFileEnvManager_ReadEnv(t *testing.T) {
	t.Run("returns empty map for missing file", func(t *testing.T) {
		m := &FileEnvManager{Path: "/nonexistent/path/test.env"}
		env, err := m.ReadEnv()
		// Error is returned but map is always non-nil (safe to access)
		assert.Error(t, err)
		assert.NotNil(t, env)
		assert.Empty(t, env)
	})
}

func TestFileEnvManager_GetEnvFilePath(t *testing.T) {
	t.Run("returns compile-time default", func(t *testing.T) {
		m := NewFileEnvManager()
		assert.Equal(t, EnvFile, m.GetEnvFilePath())
	})

	t.Run("returns custom path when set directly", func(t *testing.T) {
		m := &FileEnvManager{Path: "/tmp/override.env"}
		assert.Equal(t, "/tmp/override.env", m.GetEnvFilePath())
	})
}

func TestMaskSecret(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"empty", "", "(empty)"},
		{"short", "abc", "***"},
		{"exactly 6", "abcdef", "***"},
		{"normal", "mysecretvalue", "mys***lue"},
		{"7 chars", "abcdefg", "abc***efg"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, MaskSecret(tt.input))
		})
	}
}

func TestReadEnv_MissingFile(t *testing.T) {
	m := &FileEnvManager{Path: "/nonexistent/path/backend.env"}
	env, err := m.ReadEnv()
	// Error is returned but map is always non-nil (safe to access)
	assert.Error(t, err)
	assert.NotNil(t, env)
	assert.Empty(t, env)
}

func TestFileEnvManager_WriteEnvFile(t *testing.T) {
	t.Run("writes sorted keys to file", func(t *testing.T) {
		dir := t.TempDir()
		path := filepath.Join(dir, "test.env")

		m := &FileEnvManager{Path: path}
		entries := map[string]string{
			"ZZZ_LAST":  "last",
			"AAA_FIRST": "first",
			"MMM_MID":   "middle",
		}
		require.NoError(t, m.WriteEnvFile(entries))

		data, err := os.ReadFile(path)
		require.NoError(t, err)
		content := string(data)

		// Keys should be in sorted order
		assert.Equal(t, "AAA_FIRST=\"first\"\nMMM_MID=\"middle\"\nZZZ_LAST=\"last\"\n", content)
	})

	t.Run("preserves existing file content", func(t *testing.T) {
		dir := t.TempDir()
		path := filepath.Join(dir, "test.env")
		require.NoError(t, os.WriteFile(path, []byte("OLD_KEY=old_value\n"), 0640))

		m := &FileEnvManager{Path: path}
		require.NoError(t, m.WriteEnvFile(map[string]string{
			"NEW_KEY": "new_value",
		}))

		data, err := os.ReadFile(path)
		require.NoError(t, err)
		content := string(data)
		assert.Equal(t, "OLD_KEY=old_value\nNEW_KEY=\"new_value\"\n", content)
	})

	t.Run("round-trips through ReadEnv", func(t *testing.T) {
		dir := t.TempDir()
		path := filepath.Join(dir, "test.env")

		m := &FileEnvManager{Path: path}
		original := map[string]string{
			"PORT":     "3000",
			"HOST":     "localhost",
			"NODE_ENV": "production",
		}
		require.NoError(t, m.WriteEnvFile(original))

		readBack, err := m.ReadEnv()
		require.NoError(t, err)
		assert.Equal(t, original, readBack)
	})

	t.Run("empty map writes empty file", func(t *testing.T) {
		dir := t.TempDir()
		path := filepath.Join(dir, "test.env")

		m := &FileEnvManager{Path: path}
		require.NoError(t, m.WriteEnvFile(map[string]string{}))

		data, err := os.ReadFile(path)
		require.NoError(t, err)
		assert.Equal(t, "", string(data))
	})

	t.Run("sets file permissions to 0640", func(t *testing.T) {
		dir := t.TempDir()
		path := filepath.Join(dir, "test.env")

		m := &FileEnvManager{Path: path}
		require.NoError(t, m.WriteEnvFile(map[string]string{"KEY": "val"}))

		info, err := os.Stat(path)
		require.NoError(t, err)
		assert.Equal(t, os.FileMode(0640), info.Mode().Perm())
	})
}

func TestWriteEnvPreservesTextAndLiteralSecrets(t *testing.T) {
	path := filepath.Join(t.TempDir(), "backend.env")
	initial := "# operator comment\nLOCAL_LOGIN_DISABLED=true\nOIDC_NAME='Corporate Login'\n"
	require.NoError(t, os.WriteFile(path, []byte(initial), 0640))
	manager := &FileEnvManager{Path: path}
	secret := "Rpm $literal `text` \\" + " quote\""
	require.NoError(t, manager.WriteEnvFile(map[string]string{"DATABASE_PASSWORD": secret}))
	first, err := os.ReadFile(path)
	require.NoError(t, err)
	require.True(t, strings.HasPrefix(string(first), initial))
	values, err := manager.ReadEnv()
	require.NoError(t, err)
	require.Equal(t, secret, values["DATABASE_PASSWORD"])
	command := exec.Command("bash", "-c", `set -e; source "$1"; printf '%s' "$DATABASE_PASSWORD"`, "test", path)
	output, err := command.Output()
	require.NoError(t, err)
	require.Equal(t, secret, string(output))
	require.NoError(t, manager.WriteEnvFile(values))
	second, err := os.ReadFile(path)
	require.NoError(t, err)
	require.Equal(t, first, second)
}

func TestWriteEnvRejectsInvalidEntriesWithoutChangingFile(t *testing.T) {
	for _, entry := range []struct{ key, value string }{
		{"", "value"}, {"1KEY", "value"}, {"KEY;false", "value"},
		{"KEY$(false)", "value"}, {"KEY`false`", "value"}, {"KEY-NAME", "value"},
		{"KEY.NAME", "value"}, {"KEY NAME", "value"}, {"KEY=NAME", "value"},
		{"KEY\tNAME", "value"}, {"KEY\nNAME", "value"}, {"KEY\rNAME", "value"},
		{"KEY\x00NAME", "value"}, {"KÉY", "value"},
		{"KEY", "line\nbreak"}, {"KEY", "carriage\rreturn"}, {"KEY", "nul\x00byte"},
	} {
		t.Run(entry.key+"/"+entry.value, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "backend.env")
			initial := "# keep\nKEY=original\n"
			require.NoError(t, os.WriteFile(path, []byte(initial), 0640))
			manager := &FileEnvManager{Path: path}
			require.Error(t, manager.WriteEnvFile(map[string]string{"VALID": "changed", entry.key: entry.value}))
			content, err := os.ReadFile(path)
			require.NoError(t, err)
			require.Equal(t, initial, string(content))
			require.Error(t, manager.WriteEnvKey(entry.key, entry.value))
			content, err = os.ReadFile(path)
			require.NoError(t, err)
			require.Equal(t, initial, string(content))
		})
	}
}

func TestWriteEnvKeyPreservesLiteralAndUnchangedText(t *testing.T) {
	path := filepath.Join(t.TempDir(), "backend.env")
	initial := "# keep\nexport SECRET='old'\n\n  UNCHANGED='same value'\n"
	require.NoError(t, os.WriteFile(path, []byte(initial), 0600))
	manager := &FileEnvManager{Path: path}
	secret := "quotes '\" $literal `text` \\"
	require.NoError(t, manager.WriteEnvKey("SECRET", secret))
	content, err := os.ReadFile(path)
	require.NoError(t, err)
	require.True(t, strings.HasSuffix(string(content), "\n\n  UNCHANGED='same value'\n"))
	require.True(t, strings.HasPrefix(string(content), "# keep\n"))
	values, err := manager.ReadEnv()
	require.NoError(t, err)
	require.Equal(t, map[string]string{"SECRET": secret, "UNCHANGED": "same value"}, values)
	command := exec.Command("bash", "-c", `set -e; source "$1"; printf '%s' "$SECRET"`, "test", path)
	output, err := command.Output()
	require.NoError(t, err)
	require.Equal(t, secret, string(output))
	info, err := os.Stat(path)
	require.NoError(t, err)
	require.Equal(t, os.FileMode(0600), info.Mode().Perm())
}

func TestWriteEnvFilePreservesEmptyUpdatesAndLineEndings(t *testing.T) {
	for _, initial := range []string{"", "KEY='value'", "# keep\nKEY='value'\n\n"} {
		t.Run(initial, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "backend.env")
			require.NoError(t, os.WriteFile(path, []byte(initial), 0640))
			manager := &FileEnvManager{Path: path}
			for _, entries := range []map[string]string{{}, ParseEnv(initial)} {
				require.NoError(t, manager.WriteEnvFile(entries))
				content, err := os.ReadFile(path)
				require.NoError(t, err)
				require.Equal(t, initial, string(content))
			}
		})
	}
}

func TestWriteEnvFileUpdatesDuplicatesAndSortsNewKeys(t *testing.T) {
	path := filepath.Join(t.TempDir(), "backend.env")
	require.NoError(t, os.WriteFile(path, []byte("# keep\nKEY=old\nexport KEY='last'\n"), 0640))
	manager := &FileEnvManager{Path: path}
	require.NoError(t, manager.WriteEnvFile(map[string]string{
		"KEY": "updated", "_a0": "underscore", "aZ09": "letters and digits",
	}))
	content, err := os.ReadFile(path)
	require.NoError(t, err)
	require.Equal(t, "# keep\nKEY=\"updated\"\nKEY=\"updated\"\n_a0=\"underscore\"\naZ09=\"letters and digits\"\n", string(content))
}

func TestWriteEnvReturnsReadErrors(t *testing.T) {
	path := t.TempDir()
	manager := &FileEnvManager{Path: path}
	_, readErr := manager.ReadEnv()
	require.Error(t, readErr)
	require.EqualError(t, manager.WriteEnvFile(map[string]string{"KEY": "value"}), readErr.Error())
	require.EqualError(t, manager.WriteEnvKey("KEY", "value"), readErr.Error())
	info, err := os.Stat(path)
	require.NoError(t, err)
	require.True(t, info.IsDir())
}
