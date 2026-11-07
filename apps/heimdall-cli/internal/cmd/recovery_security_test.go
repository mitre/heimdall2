package cmd

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

type backupChangingConfigExec struct {
	*recoveryExec
	path, replacement string
	changed           bool
}

func (e *backupChangingConfigExec) RunWithEnv(env map[string]string, name string, args ...string) (string, int, error) {
	if !e.changed {
		if err := os.WriteFile(e.path, []byte(e.replacement), 0640); err != nil {
			return "", 1, err
		}
		e.changed = true
	}
	return e.recoveryExec.RunWithEnv(env, name, args...)
}

func TestBackupUsesSingleConfigurationSnapshot(t *testing.T) {
	p, fs, exec := recoveryFixture(t, true)
	original := "# Preserve this comment\nDATABASE_NAME=original\nDATABASE_PASSWORD=secret\nMULTILINE='one\ntwo'\n"
	changed := "DATABASE_NAME=other_database\nDATABASE_PASSWORD=secret\n"
	require.NoError(t, os.WriteFile(p.EnvFile, []byte(original), 0640))
	env := &FileEnvManager{Path: p.EnvFile}
	changing := &backupChangingConfigExec{recoveryExec: exec, path: p.EnvFile, replacement: changed}
	out := new(bytes.Buffer)
	r := &BackupRunner{Paths: p, FS: fs, Exec: changing, Env: env, Out: out, ErrOut: out}
	require.NoError(t, r.Run(filepath.Dir(p.ConfigDir)))
	require.True(t, changing.changed)
	archives, err := filepath.Glob(filepath.Join(filepath.Dir(p.ConfigDir), "*.tar.gz"))
	require.NoError(t, err)
	require.Len(t, archives, 1)
	extracted, err := extractRecoveryArchive(archives[0], t.TempDir())
	require.NoError(t, err)
	content, err := os.ReadFile(filepath.Join(extracted, "backend.env"))
	require.NoError(t, err)
	require.Equal(t, original, string(content))
	for _, call := range exec.calls {
		if filepath.Base(call.Name) == "pg_dump" && contains(call.Args, "-f") {
			require.Equal(t, ParseEnv(string(content))["DATABASE_NAME"], call.Args[6])
		}
	}
}

func TestBackupRejectsWritableAncestry(t *testing.T) {
	root, err := filepath.EvalSymlinks(t.TempDir())
	require.NoError(t, err)
	parent := filepath.Join(root, "untrusted")
	require.NoError(t, os.Mkdir(parent, 0777))
	require.NoError(t, os.Chmod(parent, 0777))
	output, err := openBackupOutput(filepath.Join(parent, "backups"), true)
	if output != nil {
		output.Close()
	}
	require.ErrorContains(t, err, "unprotected ancestry")
	_, err = os.Stat(filepath.Join(parent, "backups"))
	require.True(t, os.IsNotExist(err))
}

func TestRestoreRejectsWritableArchiveAndAncestry(t *testing.T) {
	for _, kind := range []string{"archive", "parent", "hardlink"} {
		t.Run(kind, func(t *testing.T) {
			root, err := filepath.EvalSymlinks(t.TempDir())
			require.NoError(t, err)
			path := filepath.Join(root, "archive.tar.gz")
			require.NoError(t, os.WriteFile(path, []byte("malicious SQL"), 0600))
			switch kind {
			case "archive":
				require.NoError(t, os.Chmod(path, 0666))
			case "parent":
				require.NoError(t, os.Chmod(root, 0777))
			case "hardlink":
				require.NoError(t, os.Link(path, filepath.Join(root, "alias")))
			}
			_, err = extractRecoveryArchive(path, t.TempDir())
			require.ErrorContains(t, err, "unprotected")
		})
	}
}

func TestRecoveryRejectsApplicationOwnedPaths(t *testing.T) {
	if os.Geteuid() != 0 {
		t.Skip("requires root to model another account's ownership")
	}
	root, err := filepath.EvalSymlinks(t.TempDir())
	require.NoError(t, err)
	path := filepath.Join(root, "archive.tar.gz")
	require.NoError(t, os.WriteFile(path, []byte("untrusted SQL"), 0600))
	require.NoError(t, os.Chown(path, 65534, 65534))
	_, err = extractRecoveryArchive(path, t.TempDir())
	require.ErrorContains(t, err, "unprotected recovery archive")
	require.NoError(t, os.Chown(path, 0, 0))
	require.NoError(t, os.Chown(root, 65534, 65534))
	defer os.Chown(root, 0, 0)
	output, err := openBackupOutput(root, false)
	if output != nil {
		output.Close()
	}
	require.ErrorContains(t, err, "unprotected ancestry")
	_, err = extractRecoveryArchive(path, t.TempDir())
	require.ErrorContains(t, err, "unprotected ancestry")
}
