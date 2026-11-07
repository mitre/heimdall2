//go:build integration

package cmd

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// Opt in with a locally installed PostgreSQL bin directory. The server uses
// only an isolated Unix socket and is stopped before its temporary files go away.
func TestRecoveryPostgresOverwriteAndRollback(t *testing.T) {
	bin := os.Getenv("HEIMDALL_TEST_POSTGRES_BIN")
	if bin == "" {
		t.Skip("set HEIMDALL_TEST_POSTGRES_BIN to run the isolated native PostgreSQL recovery test")
	}
	scratch, err := os.MkdirTemp("", "heimdall-pg-")
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, os.RemoveAll(scratch)) })
	scratch, err = filepath.EvalSymlinks(scratch)
	require.NoError(t, err)
	command := func(name string, args ...string) string {
		t.Helper()
		out, err := exec.Command(filepath.Join(bin, name), args...).CombinedOutput()
		require.NoError(t, err, "%s: %s", name, out)
		return string(out)
	}
	command("initdb", "-D", scratch+"/pgdata", "--auth=trust", "--no-locale")
	command("pg_ctl", "-D", scratch+"/pgdata", "-l", scratch+"/postgres.log", "-o", fmt.Sprintf("-k %s -c listen_addresses='' -p 5432", scratch), "-w", "start")
	t.Cleanup(func() { command("pg_ctl", "-D", scratch+"/pgdata", "-m", "immediate", "-w", "stop") })
	current, err := user.Current()
	require.NoError(t, err)
	query := func(sql string) string {
		t.Helper()
		return strings.TrimSpace(command("psql", "-X", "-h", scratch, "-p", "5432", "-U", current.Username, "-d", "postgres", "-At", "-v", "ON_ERROR_STOP=1", "-c", sql))
	}
	query("CREATE TABLE recovery_sentinel(id integer PRIMARY KEY, value text); INSERT INTO recovery_sentinel VALUES (1, 'original');")
	p, fs, host := recoveryFixture(t, true)
	env := &FileEnvManager{Path: p.EnvFile}
	require.NoError(t, env.WriteEnvFile(map[string]string{
		"DATABASE_HOST": scratch, "DATABASE_PORT": "5432", "DATABASE_USERNAME": current.Username,
		"DATABASE_NAME": "postgres", "DATABASE_PASSWORD": "unused-trust-password", "HEIMDALL_PROXY_MODE": "external",
	}))
	runner := &nativeRecoveryExec{recoveryExec: host, bin: bin}
	output := new(bytes.Buffer)
	backup := &BackupRunner{Paths: p, FS: fs, Exec: runner, Env: env, Out: output, ErrOut: output}
	require.NoError(t, backup.Run(filepath.Dir(p.ConfigDir)))
	archives, err := filepath.Glob(filepath.Join(filepath.Dir(p.ConfigDir), "*.tar.gz"))
	require.NoError(t, err)
	require.Len(t, archives, 1)
	restore := recoveryRestore(p, fs, host)
	restore.Exec = runner
	query("UPDATE recovery_sentinel SET value='changed';")
	require.NoError(t, restore.Run(archives[0]))
	require.Equal(t, "original", query("SELECT value FROM recovery_sentinel WHERE id=1"))

	extracted, err := extractRecoveryArchive(archives[0], t.TempDir())
	require.NoError(t, err)
	sqlPath := filepath.Join(extracted, "database.sql")
	file, err := os.OpenFile(sqlPath, os.O_APPEND|os.O_WRONLY, 0600)
	require.NoError(t, err)
	_, err = file.WriteString("\nSELECT recovery_missing_function();\n")
	require.NoError(t, err)
	require.NoError(t, file.Close())
	broken := filepath.Join(t.TempDir(), "broken.tar.gz")
	out, err := exec.Command("tar", "czf", broken, "-C", extracted, ".").CombinedOutput()
	require.NoError(t, err, "%s", out)
	query("UPDATE recovery_sentinel SET value='keep after failure';")
	require.Error(t, restore.Run(broken))
	require.Equal(t, "keep after failure", query("SELECT value FROM recovery_sentinel WHERE id=1"))
}

type nativeRecoveryExec struct {
	*recoveryExec
	bin string
}

func (e *nativeRecoveryExec) Run(name string, args ...string) (string, int, error) {
	if filepath.Base(name) == "pg_dump" {
		return (&execRunner{}).Run(filepath.Join(e.bin, "pg_dump"), args...)
	}
	return e.recoveryExec.Run(name, args...)
}

func (e *nativeRecoveryExec) RunWithEnv(env map[string]string, name string, args ...string) (string, int, error) {
	if tool := filepath.Base(name); tool == "psql" || tool == "pg_dump" {
		return (&execRunner{}).RunWithEnv(env, filepath.Join(e.bin, tool), args...)
	}
	return e.recoveryExec.RunWithEnv(env, name, args...)
}
