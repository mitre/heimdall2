package cmd

import (
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestStandalonePostgresAdminUsesSelectedPortWithoutPsqlRC(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	r.DBPort = 55439
	exec.Results["runuser -u postgres"] = FakeExecResult{Stdout: "SCRAM-SHA-256$hash"}
	install := &pgInstall{PsqlBin: "/usr/pgsql-18/bin/psql"}
	require.NoError(t, r.configureRole(install))
	require.NoError(t, r.verifyPasswordFormat(install))
	require.NoError(t, r.ensureDatabase(install))
	for _, call := range exec.Calls {
		require.Contains(t, call.Args, "-X", "administrative psql must ignore the service account's startup file")
		require.Contains(t, strings.Join(call.Args, " "), "-p 55439", "administration must target the selected cluster")
	}
}

// Ordinary path-based I/O must never reach PostgreSQL-owned directories while
// running as root. The dedicated descriptor API supplies the safe boundary.
type postgresPathForbiddenFS struct{ *FakeFileSystem }

func (f *postgresPathForbiddenFS) ReadFile(path string) ([]byte, error) {
	if strings.HasPrefix(path, "/var/lib/heimdall-postgresql/") || strings.HasPrefix(path, "/var/lib/pgsql/") {
		return nil, fmt.Errorf("privileged pathname read: %s", path)
	}
	return f.FakeFileSystem.ReadFile(path)
}
func (f *postgresPathForbiddenFS) WriteFile(path string, data []byte, mode os.FileMode) error {
	if strings.HasPrefix(path, "/var/lib/heimdall-postgresql/") || strings.HasPrefix(path, "/var/lib/pgsql/") {
		return fmt.Errorf("privileged pathname write: %s", path)
	}
	return f.FakeFileSystem.WriteFile(path, data, mode)
}

func TestStandalonePostgresConfigurationAvoidsPrivilegedPathIO(t *testing.T) {
	for _, path := range []string{"/var/lib/pgsql/data", "/var/lib/pgsql/18/data"} {
		t.Run(path, func(t *testing.T) {
			r, _, fs, _, _ := newBootstrapForTest()
			fs.Files[path+"/postgresql.conf"] = []byte("# preserve settings\n")
			fs.Files[path+"/pg_hba.conf"] = []byte("local all all peer\n")
			r.FS = &postgresPathForbiddenFS{fs}
			install := &pgInstall{DataDir: path}
			require.NoError(t, r.configureHBA(install))
			require.NoError(t, r.configurePasswordEncryption(install))
			require.Contains(t, string(fs.Files[path+"/pg_hba.conf"]), `host    all    "heimdall"    127.0.0.1/32    scram-sha-256`)
			require.Contains(t, string(fs.Files[path+"/postgresql.conf"]), "password_encryption = scram-sha-256")
		})
	}
}
func (f *postgresPathForbiddenFS) MkdirAll(path string, mode os.FileMode) error {
	if strings.HasPrefix(path, "/var/lib/heimdall-postgresql/") || path == bundledPGSocket {
		return fmt.Errorf("privileged pathname mkdir: %s", path)
	}
	return f.FakeFileSystem.MkdirAll(path, mode)
}

func TestBundledPostgresBootstrapAndRollbackAvoidPrivilegedPathIO(t *testing.T) {
	r := bundledSetupFixture(t)
	_, err := r.readConfiguration()
	require.NoError(t, err)
	fs := r.FS.(*FakeFileSystem)
	before := string(fs.Files[bundledPGData+postgresConfigFile])
	r.FS = &postgresPathForbiddenFS{fs}
	u := &bundledSetupUpdate{runner: r}
	require.NoError(t, u.snapshotPostgres())
	require.NoError(t, r.stepPostgresBootstrap())
	u.pgChanged = true
	require.NoError(t, u.restorePostgres())
	require.Equal(t, before, string(fs.Files[bundledPGData+postgresConfigFile]))
	for _, call := range r.Exec.(*FakeExecRunner).Calls {
		if call.Name == "chown" || call.Name == "chmod" || call.Name == "restorecon" {
			for _, arg := range call.Args {
				require.NotContains(t, arg, bundledPGData)
				require.NotEqual(t, bundledPGSocket, arg)
			}
		}
	}
}

type initializingPostgresExec struct {
	*FakeExecRunner
	fs       *FakeFileSystem
	initRuns int
}

func (e *initializingPostgresExec) Run(name string, args ...string) (string, int, error) {
	if name == "runuser" && len(args) > 3 && strings.HasSuffix(args[3], "/initdb") {
		e.initRuns++
		e.fs.Files[bundledPGData+"/PG_VERSION"] = []byte("18\n")
		e.fs.Files[bundledPGData+"/postgresql.conf"] = []byte("# initialized\n")
		e.fs.Files[bundledPGData+"/pg_hba.conf"] = []byte("local all all peer\n")
	}
	return e.FakeExecRunner.Run(name, args...)
}

func TestBundledPostgresFreshInitializationPreservesClusterOnRollbackAndRetry(t *testing.T) {
	r := bundledSetupFixture(t)
	_, err := r.readConfiguration()
	require.NoError(t, err)
	fs := r.FS.(*FakeFileSystem)
	for name := range fs.Files {
		if strings.HasPrefix(name, bundledPGData+"/") {
			delete(fs.Files, name)
		}
	}
	r.FS = &postgresPathForbiddenFS{fs}
	exec := &initializingPostgresExec{FakeExecRunner: r.Exec.(*FakeExecRunner), fs: fs}
	r.Exec = exec
	u := &bundledSetupUpdate{runner: r}
	require.NoError(t, u.snapshotPostgres())
	require.Empty(t, u.previousPG)
	require.NoError(t, r.stepPostgresBootstrap())
	u.pgChanged = true
	require.NoError(t, u.restorePostgres())
	require.Equal(t, "18\n", string(fs.Files[bundledPGData+"/PG_VERSION"]))
	require.NoError(t, r.stepPostgresBootstrap())
	require.Equal(t, 1, exec.initRuns, "a retry must reuse the initialized cluster")
	for _, call := range exec.Calls {
		require.NotEqual(t, "chown", call.Name, "initialization must not change ownership through mutable paths")
	}
}
