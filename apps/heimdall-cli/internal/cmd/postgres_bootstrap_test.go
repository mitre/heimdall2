package cmd

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// newBootstrapForTest returns a PostgresBootstrapRunner wired to fakes
// with sensible defaults. Each test mutates fields it cares about.
func newBootstrapForTest() (*PostgresBootstrapRunner, *FakeExecRunner, *FakeFileSystem, *FakeSystemdRunner, *bytes.Buffer) {
	exec := &FakeExecRunner{Results: map[string]FakeExecResult{}}
	fs := &FakeFileSystem{Files: map[string][]byte{}}
	sysd := &FakeSystemdRunner{ActiveServices: map[string]bool{}}
	out := &bytes.Buffer{}
	r := &PostgresBootstrapRunner{
		Exec:       exec,
		FS:         fs,
		Systemd:    sysd,
		Out:        out,
		DBHost:     "127.0.0.1",
		DBPort:     5432,
		DBUser:     "heimdall",
		DBPassword: "secret",
		DBName:     "heimdall-server-production",
	}
	return r, exec, fs, sysd, out
}

func TestPostgresBootstrap_ValidateInputs_RequiresUser(t *testing.T) {
	r, _, _, _, _ := newBootstrapForTest()
	r.DBUser = ""

	err := r.Run()

	require.Error(t, err, "empty DBUser must produce an error")
	require.Contains(t, strings.ToLower(err.Error()), "username",
		"error must mention username")
}

func TestPostgresBootstrap_ValidateInputs_RequiresPassword(t *testing.T) {
	r, _, _, _, _ := newBootstrapForTest()
	r.DBPassword = ""

	err := r.Run()

	require.Error(t, err, "empty DBPassword must produce an error")
	require.Contains(t, strings.ToLower(err.Error()), "password",
		"error must mention password")
}

func TestPostgresBootstrap_ValidateInputs_TreatsWhitespaceAsEmpty(t *testing.T) {
	r, _, _, _, _ := newBootstrapForTest()
	r.DBPassword = "   \t\n"

	err := r.Run()

	require.Error(t, err, "whitespace-only DBPassword must be rejected")
}

func TestPostgresBootstrap_SkipsRemoteHost(t *testing.T) {
	cases := []struct {
		name string
		host string
	}{
		{"explicit IP", "10.0.0.5"},
		{"hostname", "db.internal"},
		{"FQDN", "postgres.example.com"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			r, exec, _, _, out := newBootstrapForTest()
			r.DBHost = tc.host

			err := r.Run()

			require.NoError(t, err, "remote host must not error")
			require.Contains(t, out.String(), "skipping",
				"output must explain that bootstrap was skipped")
			require.Contains(t, out.String(), tc.host,
				"output must mention the remote host")
			require.Empty(t, exec.Calls,
				"no external commands should be invoked for remote host")
		})
	}
}

func TestPostgresBootstrap_DetectPG_FindsPGDG(t *testing.T) {
	cases := []struct {
		name        string
		presentPath string
		wantMajor   int
		wantService string
		wantDataDir string
		versionOut  string
	}{
		{
			name:        "PGDG 18",
			presentPath: "/usr/pgsql-18/bin/psql",
			wantMajor:   18,
			wantService: "postgresql-18",
			wantDataDir: "/var/lib/pgsql/18/data",
			versionOut:  "psql (PostgreSQL) 18.0\n",
		},
		{
			name:        "PGDG 16",
			presentPath: "/usr/pgsql-16/bin/psql",
			wantMajor:   16,
			wantService: "postgresql-16",
			wantDataDir: "/var/lib/pgsql/16/data",
			versionOut:  "psql (PostgreSQL) 16.4\n",
		},
		{
			name:        "PGDG 13 (lowest supported)",
			presentPath: "/usr/pgsql-13/bin/psql",
			wantMajor:   13,
			wantService: "postgresql-13",
			wantDataDir: "/var/lib/pgsql/13/data",
			versionOut:  "psql (PostgreSQL) 13.16\n",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			r, exec, fs, _, _ := newBootstrapForTest()
			fs.Files[tc.presentPath] = []byte("")
			exec.Results[tc.presentPath+" --version"] = FakeExecResult{Stdout: tc.versionOut}

			install, err := r.detectPG()

			require.NoError(t, err)
			require.NotNil(t, install)
			require.Equal(t, tc.presentPath, install.PsqlBin)
			require.Equal(t, tc.wantMajor, install.Major)
			require.Equal(t, tc.wantService, install.Service)
			require.Equal(t, tc.wantDataDir, install.DataDir)
		})
	}
}

func TestPostgresBootstrap_DetectPG_PrefersHigherPGDGVersion(t *testing.T) {
	r, exec, fs, _, _ := newBootstrapForTest()
	// Simulate both PGDG 16 and PGDG 18 installed — must pick 18.
	fs.Files["/usr/pgsql-18/bin/psql"] = []byte("")
	fs.Files["/usr/pgsql-16/bin/psql"] = []byte("")
	exec.Results["/usr/pgsql-18/bin/psql --version"] = FakeExecResult{
		Stdout: "psql (PostgreSQL) 18.0\n"}

	install, err := r.detectPG()

	require.NoError(t, err)
	require.Equal(t, "/usr/pgsql-18/bin/psql", install.PsqlBin)
	require.Equal(t, 18, install.Major)
}

func TestPostgresBootstrap_DetectPG_FallsBackToSystemPsql(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	// No PGDG paths exist. command -v psql returns the system path.
	exec.Results[`sh -c command -v "$1" sh psql`] = FakeExecResult{Stdout: "/usr/bin/psql\n"}
	exec.Results["/usr/bin/psql --version"] = FakeExecResult{
		Stdout: "psql (PostgreSQL) 15.5\n"}

	install, err := r.detectPG()

	require.NoError(t, err)
	require.Equal(t, "/usr/bin/psql", install.PsqlBin)
	require.Equal(t, 15, install.Major)
	require.Equal(t, "postgresql", install.Service)
	require.Equal(t, "/var/lib/pgsql/data", install.DataDir)
}

func TestPostgresBootstrap_DetectPG_ErrorsWhenNoPsqlFound(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	// Empty fakes — neither PGDG paths nor command -v finds anything.
	exec.Results[`sh -c command -v "$1" sh psql`] = FakeExecResult{ExitCode: 1}

	install, err := r.detectPG()

	require.Error(t, err)
	require.Nil(t, install)
	require.Contains(t, strings.ToLower(err.Error()), "psql")
}

func TestPostgresBootstrap_DetectPG_RejectsVersionBelow13(t *testing.T) {
	r, exec, fs, _, _ := newBootstrapForTest()
	fs.Files["/usr/pgsql-12/bin/psql"] = []byte("")
	// Should NOT pick up pgsql-12 (out of probe range), so falls through.
	// But if some user had set system psql to 12, we'd reject it:
	exec.Results[`sh -c command -v "$1" sh psql`] = FakeExecResult{Stdout: "/usr/bin/psql\n"}
	exec.Results["/usr/bin/psql --version"] = FakeExecResult{
		Stdout: "psql (PostgreSQL) 12.20\n"}

	install, err := r.detectPG()

	require.Error(t, err)
	require.Nil(t, install)
	require.Contains(t, err.Error(), "13")
}

func TestPostgresBootstrap_EnsureDataDir_SkipsIfAlreadyInitialized(t *testing.T) {
	r, exec, fs, _, _ := newBootstrapForTest()
	install := &pgInstall{
		PsqlBin:  "/usr/pgsql-16/bin/psql",
		SetupBin: "/usr/pgsql-16/bin/postgresql-16-setup",
		Service:  "postgresql-16",
		DataDir:  "/var/lib/pgsql/16/data",
		Major:    16,
	}
	fs.Files[install.DataDir+"/PG_VERSION"] = []byte("16\n")

	err := r.ensureDataDir(install)

	require.NoError(t, err)
	for _, c := range exec.Calls {
		require.NotContains(t, c.Args, "initdb",
			"must not invoke initdb when PG_VERSION already present")
	}
}

func TestPostgresBootstrap_EnsureDataDir_RunsPGDGInitdb(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	install := &pgInstall{
		SetupBin: "/usr/pgsql-16/bin/postgresql-16-setup",
		Service:  "postgresql-16",
		DataDir:  "/var/lib/pgsql/16/data",
	}
	exec.Results["/usr/pgsql-16/bin/postgresql-16-setup initdb"] = FakeExecResult{}

	err := r.ensureDataDir(install)

	require.NoError(t, err)
	require.Len(t, exec.Calls, 1)
	require.Equal(t, install.SetupBin, exec.Calls[0].Name)
	require.Equal(t, []string{"initdb"}, exec.Calls[0].Args)
}

func TestPostgresBootstrap_EnsureDataDir_RunsSystemInitdb(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	install := &pgInstall{
		SetupBin: "/usr/bin/postgresql-setup",
		Service:  "postgresql",
		DataDir:  "/var/lib/pgsql/data",
	}
	exec.Results["/usr/bin/postgresql-setup --initdb"] = FakeExecResult{}

	err := r.ensureDataDir(install)

	require.NoError(t, err)
	require.Len(t, exec.Calls, 1)
	require.Equal(t, install.SetupBin, exec.Calls[0].Name)
	require.Equal(t, []string{"--initdb"}, exec.Calls[0].Args)
}

func TestPostgresBootstrap_EnsureDataDir_ErrorsWithoutSetupBin(t *testing.T) {
	r, _, _, _, _ := newBootstrapForTest()
	install := &pgInstall{
		Service: "postgresql",
		DataDir: "/var/lib/pgsql/data",
		// no SetupBin
	}

	err := r.ensureDataDir(install)

	require.Error(t, err)
	require.Contains(t, strings.ToLower(err.Error()), "setup")
}

func TestPostgresBootstrap_ConfigureHBA_SkipsIfFileMissing(t *testing.T) {
	r, _, fs, _, _ := newBootstrapForTest()
	install := &pgInstall{DataDir: "/var/lib/pgsql/16/data"}

	err := r.configureHBA(install)

	require.NoError(t, err)
	require.Empty(t, fs.Files,
		"no file should be written when pg_hba.conf is absent")
}

func TestPostgresBootstrap_ConfigureHBA_InsertsHostRulesAfterTypeHeader(t *testing.T) {
	r, _, fs, _, _ := newBootstrapForTest()
	r.DBUser = "heimdalluser"
	install := &pgInstall{DataDir: "/var/lib/pgsql/16/data"}
	hbaPath := install.DataDir + "/pg_hba.conf"
	original := "# PostgreSQL Client Authentication Configuration File\n" +
		"# TYPE  DATABASE        USER            ADDRESS                 METHOD\n" +
		"local   all             all                                     peer\n" +
		"host    all             all             127.0.0.1/32            ident\n"
	fs.Files[hbaPath] = []byte(original)

	err := r.configureHBA(install)

	require.NoError(t, err)
	updated := string(fs.Files[hbaPath])

	require.Contains(t, updated, "# Heimdall",
		"updated file must contain the Heimdall marker")
	require.Contains(t, updated, `host    all    "heimdalluser"    127.0.0.1/32    scram-sha-256`,
		"must insert IPv4 scram rule for the configured user")
	require.Contains(t, updated, `host    all    "heimdalluser"    ::1/128         scram-sha-256`,
		"must insert IPv6 scram rule for the configured user")

	// Heimdall block must appear immediately after the # TYPE header line,
	// before the existing local/host lines.
	typeIdx := strings.Index(updated, "# TYPE")
	heimdallIdx := strings.Index(updated, "# Heimdall")
	defaultLocalIdx := strings.Index(updated, "local   all             all")
	require.Greater(t, heimdallIdx, typeIdx,
		"# Heimdall must come after # TYPE")
	require.Less(t, heimdallIdx, defaultLocalIdx,
		"# Heimdall must come before the existing default rules")
}

func TestPostgresBootstrap_ConfigurePasswordEncryption_SkipsIfFileMissing(t *testing.T) {
	r, _, fs, _, _ := newBootstrapForTest()
	install := &pgInstall{DataDir: "/var/lib/pgsql/16/data"}

	err := r.configurePasswordEncryption(install)

	require.NoError(t, err)
	require.Empty(t, fs.Files)
}

func TestPostgresBootstrap_ConfigurePasswordEncryption_SkipsIfAlreadySet(t *testing.T) {
	r, _, fs, _, _ := newBootstrapForTest()
	install := &pgInstall{DataDir: "/var/lib/pgsql/16/data"}
	confPath := install.DataDir + "/postgresql.conf"
	original := "# default config\nshared_buffers = 128MB\npassword_encryption = scram-sha-256\n"
	fs.Files[confPath] = []byte(original)

	err := r.configurePasswordEncryption(install)

	require.NoError(t, err)
	require.Equal(t, original, string(fs.Files[confPath]))
}

func TestPostgresBootstrap_ConfigurePasswordEncryption_AppendsWhenMissing(t *testing.T) {
	r, _, fs, _, _ := newBootstrapForTest()
	install := &pgInstall{DataDir: "/var/lib/pgsql/16/data"}
	confPath := install.DataDir + "/postgresql.conf"
	original := "# default config\nshared_buffers = 128MB\n"
	fs.Files[confPath] = []byte(original)

	err := r.configurePasswordEncryption(install)

	require.NoError(t, err)
	updated := string(fs.Files[confPath])
	require.Contains(t, updated, original,
		"existing content must be preserved")
	require.Contains(t, updated, "password_encryption = scram-sha-256",
		"directive must be appended when missing")
}

func TestPostgresBootstrap_StartService_EnablesAndStarts(t *testing.T) {
	r, _, _, sysd, _ := newBootstrapForTest()
	install := &pgInstall{Service: "postgresql-16"}

	err := r.startService(install)

	require.NoError(t, err)
	require.Contains(t, sysd.Actions, "enable:postgresql-16",
		"service must be enabled")
	require.Contains(t, sysd.Actions, "start:postgresql-16",
		"service must be started")
}

func TestPostgresBootstrap_StartService_TolerantToEnableFailure(t *testing.T) {
	// The bash script swallows errors from systemctl with `|| true`, since
	// some installs already have postgresql enabled at install time. Match
	// that behavior here: enable failures must not abort bootstrap.
	r, _, _, sysd, _ := newBootstrapForTest()
	install := &pgInstall{Service: "postgresql-16"}
	sysd.Err = fmt.Errorf("already enabled")

	err := r.startService(install)

	require.NoError(t, err,
		"startService must tolerate systemd errors (matches bash script behavior)")
}

func TestPostgresBootstrap_ConfigureRole_RunsPSQLAsPostgresWithExpectedArgs(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	r.DBUser = "heimdall"
	r.DBPassword = "s3cret"
	install := &pgInstall{PsqlBin: "/usr/pgsql-16/bin/psql"}
	exec.Results["runuser -u postgres"] = FakeExecResult{}

	err := r.configureRole(install)

	require.NoError(t, err)
	require.Len(t, exec.Calls, 1, "exactly one psql invocation")
	call := exec.Calls[0]

	require.Equal(t, "runuser", call.Name,
		"must invoke psql as the postgres OS user via runuser")
	require.Contains(t, call.Args, "-u")
	require.Contains(t, call.Args, "postgres")
	require.Contains(t, call.Args, install.PsqlBin)
	require.Contains(t, call.Args, "-v")
	require.Contains(t, call.Args, "ON_ERROR_STOP=1",
		"psql must abort on first error")
	require.Contains(t, call.Args, "-d")
	require.Contains(t, call.Args, "postgres",
		"connect to the postgres maintenance database")

	require.Contains(t, call.Args, "db_user=heimdall",
		"db_user binding must use psql -v not interpolation")
	require.NotContains(t, strings.Join(call.Args, " "), r.DBPassword,
		"passwords must not appear in process arguments")

	require.Contains(t, call.Stdin, "ALTER SYSTEM SET password_encryption = 'scram-sha-256'")
	require.Contains(t, call.Stdin, "SELECT pg_reload_conf()")
	require.Contains(t, call.Stdin, "CREATE ROLE %I LOGIN PASSWORD %L")
	require.Contains(t, call.Stdin, "ALTER ROLE %I CREATEDB")
	require.Contains(t, call.Stdin, ":'db_user'",
		"SQL must reference db_user via psql variable, not interpolated")
	require.Contains(t, call.Stdin, ":'db_user', 's3cret')",
		"password must be a quoted SQL literal delivered only through stdin")
	require.NotContains(t, call.Stdin, "heimdall",
		"raw username must NOT appear in SQL — bound via -v")
}

func TestPostgresBootstrap_ConfigureRole_ErrorsOnPSQLFailure(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	install := &pgInstall{PsqlBin: "/usr/bin/psql"}
	exec.Results["runuser -u postgres"] = FakeExecResult{
		Stdout: "ERROR: statement contained password " + r.DBPassword, ExitCode: 1,
	}

	err := r.configureRole(install)

	require.Error(t, err)
	require.Contains(t, err.Error(), "exited 1")
	require.NotContains(t, err.Error(), r.DBPassword,
		"psql can echo the password-bearing statement on failure")
}

func TestPostgresBootstrap_ConfigureRole_QuotesPasswordOnStdin(t *testing.T) {
	for _, tc := range []struct{ name, password, literal string }{
		{"quotes", "x'); DROP ROLE postgres; --", "'x''); DROP ROLE postgres; --'"},
		{"backslashes", `x'\n\quit`, ` E'x''\\n\\quit'`},
		{"multiline", "x'\n\\quit\nsecret", " E'x''\n\\\\quit\nsecret'"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, exec, _, _, _ := newBootstrapForTest()
			r.DBPassword = tc.password
			require.NoError(t, r.configureRole(&pgInstall{PsqlBin: "/usr/bin/psql"}))
			call := exec.Calls[0]
			require.NotContains(t, strings.Join(call.Args, " "), tc.password)
			require.Equal(t, 2, strings.Count(call.Stdin, ":'db_user', "+tc.literal+")"))
			require.NotContains(t, call.Stdin, ":'db_pass'")
		})
	}
}

func TestPostgresBootstrap_ConfigureRole_RejectsNULPassword(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	r.DBPassword = "before\x00after"
	err := r.configureRole(&pgInstall{PsqlBin: "/usr/bin/psql"})
	require.Error(t, err)
	require.NotContains(t, err.Error(), "before")
	require.Empty(t, exec.Calls)
}

func TestPostgresServerMajorRejectsUnsupportedOrInvalidResponses(t *testing.T) {
	for _, tc := range []struct {
		name, response, failure string
		exitCode, major         int
	}{
		{"minimum", "130023", "", 0, 13},
		{"maximum", "180006\n", "", 0, 18},
		{"old", "120010", "unsupported", 0, 0},
		{"new", "190001", "unsupported", 0, 0},
		{"malformed", "not a version", "invalid", 0, 0},
		{"query failed", "", "exit 1", 1, 0},
	} {
		t.Run(tc.name, func(t *testing.T) {
			exec := &FakeExecRunner{Results: map[string]FakeExecResult{"psql -X": {Stdout: tc.response, ExitCode: tc.exitCode}}}
			major, err := postgresServerMajor(exec, DefaultPaths(), NewFakeFileSystem(), DBConfig{})
			if tc.failure != "" {
				require.ErrorContains(t, err, tc.failure)
			} else {
				require.NoError(t, err)
			}
			require.Equal(t, tc.major, major)
		})
	}
}

func TestPostgresBootstrap_VerifyPasswordFormat_AcceptsScramSHA256(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	install := &pgInstall{PsqlBin: "/usr/bin/psql"}
	exec.Results["runuser -u postgres"] = FakeExecResult{
		Stdout: "SCRAM-SHA-256$4096:abc...", ExitCode: 0,
	}

	err := r.verifyPasswordFormat(install)

	require.NoError(t, err)
}

func TestPostgresBootstrap_VerifyPasswordFormat_RejectsMD5(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	install := &pgInstall{PsqlBin: "/usr/bin/psql"}
	exec.Results["runuser -u postgres"] = FakeExecResult{
		Stdout: "md5deadbeef...", ExitCode: 0,
	}

	err := r.verifyPasswordFormat(install)

	require.Error(t, err)
	require.Contains(t, strings.ToLower(err.Error()), "scram-sha-256",
		"error must mention required hash format")
}

func TestPostgresBootstrap_VerifyPasswordFormat_BindsUserViaPSQLVar(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	r.DBUser = "heimdall"
	install := &pgInstall{PsqlBin: "/usr/bin/psql"}
	exec.Results["runuser -u postgres"] = FakeExecResult{
		Stdout: "SCRAM-SHA-256$4096:x"}

	_ = r.verifyPasswordFormat(install)

	require.Len(t, exec.Calls, 1)
	call := exec.Calls[0]
	require.Contains(t, call.Args, "-tA",
		"must use -tA for tuples-only unaligned output")
	require.Contains(t, call.Args, "db_user=heimdall",
		"username must be bound via psql -v, not interpolated")
	require.Contains(t, call.Stdin, ":'db_user'",
		"SQL must reference db_user via psql variable")
	require.NotContains(t, call.Stdin, "heimdall",
		"raw username must NOT appear in SQL")
}

func TestPostgresBootstrap_EnsureDatabase_CreatesWhenMissing(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	r.DBName = "heimdall-server-production"
	install := &pgInstall{PsqlBin: "/usr/bin/psql"}
	exec.Results["runuser -u postgres"] = FakeExecResult{}

	err := r.ensureDatabase(install)

	require.NoError(t, err)
	require.Len(t, exec.Calls, 1)
	call := exec.Calls[0]
	require.Equal(t, "runuser", call.Name)
	require.Contains(t, call.Args, "db_name=heimdall-server-production",
		"db name must be bound via psql -v")
	require.Contains(t, call.Stdin, "CREATE DATABASE %I")
	require.Contains(t, call.Stdin, "WHERE NOT EXISTS",
		"DDL must be idempotent")
	require.Contains(t, call.Stdin, ":'db_name'",
		"SQL must reference db_name via psql variable")
	require.NotContains(t, call.Stdin, "heimdall-server-production",
		"raw db name must NOT appear in SQL")
}

func TestPostgresBootstrap_EnsureDatabase_ErrorsOnPSQLFailure(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	install := &pgInstall{PsqlBin: "/usr/bin/psql"}
	exec.Results["runuser -u postgres"] = FakeExecResult{
		Stdout: "FATAL: connection refused", ExitCode: 1,
	}

	err := r.ensureDatabase(install)

	require.Error(t, err)
	require.Contains(t, err.Error(), "connection refused")
}

func TestPostgresBootstrap_EnsureDatabase_AssignsApplicationOwner(t *testing.T) {
	for _, osUser := range []string{"", "heimdall-postgres"} {
		t.Run("os_user="+osUser, func(t *testing.T) {
			r, exec, _, _, _ := newBootstrapForTest()
			install := &pgInstall{PsqlBin: "/usr/bin/psql", OSUser: osUser}

			require.NoError(t, r.ensureDatabase(install))

			require.Len(t, exec.Calls, 1)
			call := exec.Calls[0]
			require.Contains(t, call.Stdin, "CREATE DATABASE %I OWNER %I",
				"the application role must own the database to create tables on PostgreSQL 15+")
			require.Contains(t, call.Stdin, ":'db_name', :'db_user'")
			require.Contains(t, call.Args, "db_user=heimdall")
			require.NotContains(t, call.Stdin, "heimdall")
		})
	}
}

func TestPostgresBootstrap_TestConnection_PassesPGPASSWORDViaEnv(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	r.DBHost = "127.0.0.1"
	r.DBPort = 5432
	r.DBUser = "heimdall"
	r.DBPassword = "s3cret"
	r.DBName = "heimdall-server-production"
	install := &pgInstall{PsqlBin: "/usr/bin/psql"}
	exec.Results["/usr/bin/psql -X -h 127.0.0.1 -p 5432 -U heimdall -d heimdall-server-production -c SELECT 1"] = FakeExecResult{}

	err := r.testConnection(install)

	require.NoError(t, err)
	require.Len(t, exec.Calls, 1)
	call := exec.Calls[0]

	require.Equal(t, install.PsqlBin, call.Name)
	require.Equal(t, "s3cret", call.Env["PGPASSWORD"],
		"PGPASSWORD must be passed as env, not as a command arg")
	require.Equal(t, []string{"-X", "-h", "127.0.0.1", "-p", "5432", "-U", "heimdall", "-d", "heimdall-server-production", "-c", "SELECT 1"}, call.Args)
	require.Contains(t, call.Args, "-c")
	require.Contains(t, call.Args, "SELECT 1")
}

func TestPostgresBootstrap_TestConnection_ErrorsOnFailure(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	install := &pgInstall{PsqlBin: "/usr/bin/psql"}
	exec.Results["/usr/bin/psql -X -h 127.0.0.1 -p 5432 -U heimdall -d heimdall-server-production -c SELECT 1"] = FakeExecResult{
		Stdout:   "psql: error: connection to server at \"127.0.0.1\" failed",
		ExitCode: 2,
	}

	err := r.testConnection(install)

	require.Error(t, err)
	require.Contains(t, err.Error(), "connection")
}

// TestPostgresBootstrap_Run_FullOrchestration verifies Run() invokes
// every step in order against a fake-equipped local PostgreSQL install.
// This is the unit-level smoke test for the runner — the integration
// test against real PG lives in integration_postgres_bootstrap_test.go.
func TestPostgresBootstrap_Run_FullOrchestration(t *testing.T) {
	r, exec, fs, sysd, out := newBootstrapForTest()
	r.DBUser = "heimdall"
	r.DBPassword = "s3cret"
	r.DBName = "heimdall-server-production"

	// PGDG 16 is installed
	fs.Files["/usr/pgsql-16/bin/psql"] = []byte("")
	exec.Results["/usr/pgsql-16/bin/psql --version"] = FakeExecResult{
		Stdout: "psql (PostgreSQL) 16.4\n",
	}
	// Cluster already initialized — skip initdb
	fs.Files["/var/lib/pgsql/16/data/PG_VERSION"] = []byte("16\n")
	// Both config files exist with default content (will be modified)
	fs.Files["/var/lib/pgsql/16/data/pg_hba.conf"] = []byte(
		"# TYPE  DATABASE        USER            ADDRESS                 METHOD\n" +
			"local   all             all                                     peer\n",
	)
	fs.Files["/var/lib/pgsql/16/data/postgresql.conf"] = []byte("shared_buffers = 128MB\n")
	// SQL operations — runuser psql succeeds
	exec.Results["runuser -u postgres"] = FakeExecResult{
		Stdout: "SCRAM-SHA-256$4096:abc",
	}
	// Final connection test
	exec.Results["/usr/pgsql-16/bin/psql -X -h 127.0.0.1 -p 5432 -U heimdall -d heimdall-server-production -c SELECT 1"] = FakeExecResult{}

	err := r.Run()

	require.NoError(t, err, "full orchestration must succeed with all happy-path fakes")

	// Service was enabled + started
	require.Contains(t, sysd.Actions, "enable:postgresql-16")
	require.Contains(t, sysd.Actions, "start:postgresql-16")

	// pg_hba.conf was updated with Heimdall block
	require.Contains(t, string(fs.Files["/var/lib/pgsql/16/data/pg_hba.conf"]), "# Heimdall")

	// postgresql.conf got the password_encryption directive
	require.Contains(t, string(fs.Files["/var/lib/pgsql/16/data/postgresql.conf"]),
		"password_encryption = scram-sha-256")

	// Out got the completion message
	require.Contains(t, out.String(), "complete",
		"must announce completion to Out")
}

func TestPostgresBootstrap_Run_PropagatesDetectFailure(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	exec.Results[`sh -c command -v "$1" sh psql`] = FakeExecResult{ExitCode: 1}

	err := r.Run()

	require.Error(t, err)
	require.Contains(t, err.Error(), "psql not found")
}

func TestPostgresBootstrap_Run_PropagatesRoleConfigFailure(t *testing.T) {
	r, exec, fs, _, _ := newBootstrapForTest()
	fs.Files["/usr/pgsql-16/bin/psql"] = []byte("")
	exec.Results["/usr/pgsql-16/bin/psql --version"] = FakeExecResult{
		Stdout: "psql (PostgreSQL) 16.4\n",
	}
	fs.Files["/var/lib/pgsql/16/data/PG_VERSION"] = []byte("16\n")
	// configureRole / verifyPasswordFormat / ensureDatabase / testConnection
	// all share the runuser key in the fake — make them fail.
	exec.Results["runuser -u postgres"] = FakeExecResult{
		Stdout: "FATAL: server closed", ExitCode: 1,
	}

	err := r.Run()

	require.Error(t, err)
	require.Contains(t, err.Error(), "psql role setup exited 1")
}

func TestPostgresBootstrap_PsqlMajorVersion_HandlesMalformedOutput(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	exec.Results["/usr/bin/psql --version"] = FakeExecResult{
		Stdout: "psql\n", // too few fields
	}

	_, err := r.psqlMajorVersion("/usr/bin/psql")

	require.Error(t, err)
	require.Contains(t, err.Error(), "unexpected")
}

func TestPostgresBootstrap_PsqlMajorVersion_HandlesNonNumericMajor(t *testing.T) {
	r, exec, _, _, _ := newBootstrapForTest()
	exec.Results["/usr/bin/psql --version"] = FakeExecResult{
		Stdout: "psql (PostgreSQL) X.Y\n",
	}

	_, err := r.psqlMajorVersion("/usr/bin/psql")

	require.Error(t, err)
	require.Contains(t, err.Error(), "parsing")
}

func TestPostgresBootstrap_DoesNotSkipForLocalhost(t *testing.T) {
	cases := []struct {
		name string
		host string
	}{
		{"127.0.0.1", "127.0.0.1"},
		{"localhost", "localhost"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			r, exec, _, _, out := newBootstrapForTest()
			r.DBHost = tc.host

			// Run will eventually fail at later steps (no PG installed in fakes),
			// but it must NOT short-circuit with the "skipping" message.
			_ = r.Run()

			require.NotContains(t, out.String(), "skipping",
				"localhost must not be treated as remote")
			// Must have at least attempted to detect PG
			require.NotEmpty(t, exec.Calls,
				"localhost must trigger PG detection")
		})
	}
}

func TestPostgresBootstrap_DetectPG_RealPathLookup(t *testing.T) {
	dir := t.TempDir()
	require.NoError(t, os.Symlink("/bin/sh", filepath.Join(dir, "sh")))
	psql := filepath.Join(dir, "psql")
	require.NoError(t, os.WriteFile(psql, []byte("#!/bin/sh\necho 'psql (PostgreSQL) 18.0'\n"), 0755))
	setup := filepath.Join(dir, "postgresql-setup")
	require.NoError(t, os.WriteFile(setup, []byte("#!/bin/sh\nexit 0\n"), 0755))
	t.Setenv("PATH", dir)
	r, _, _, _, _ := newBootstrapForTest()
	r.Exec = &execRunner{}
	install, err := r.detectPG()
	require.NoError(t, err)
	require.Equal(t, psql, install.PsqlBin)
	require.Equal(t, setup, install.SetupBin)
	require.Equal(t, 18, install.Major)
	require.NoError(t, os.Remove(setup))
	install, err = r.detectPG()
	require.NoError(t, err)
	require.Empty(t, install.SetupBin)
	require.NoError(t, os.Remove(psql))
	_, err = r.detectPG()
	require.ErrorContains(t, err, "psql not found")
}

func TestBundledPostgresNeverUsesSystemSocket(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.DatabaseMode = "bundled"
	r.DBHost, r.DBPort = "127.0.0.1", 55432
	r.DBUser, r.DBPassword, r.DBName = "heimdall", "test-only-password", "heimdall_test"
	fs := r.FS.(*FakeFileSystem)
	fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
	for _, tool := range []string{"psql", "postgres", "initdb", "pg_isready"} {
		fs.Files[r.Paths.RuntimePath("postgresql", "bin", tool)] = nil
	}
	fs.Files["/var/lib/heimdall-postgresql/18/data/PG_VERSION"] = []byte("18\n")
	fs.Files["/var/lib/heimdall-postgresql/18/data/postgresql.conf"] = []byte("# preserve this\n")
	fs.Files["/var/lib/heimdall-postgresql/18/data/pg_hba.conf"] = []byte("local all all peer\nhost all all 127.0.0.1/32 scram-sha-256\n")
	r.Exec.(*FakeExecRunner).Results["runuser -u heimdall-postgres"] = FakeExecResult{Stdout: "SCRAM-SHA-256$hash"}
	require.NoError(t, r.stepPostgresBootstrap())
	count := 0
	for _, call := range r.Exec.(*FakeExecRunner).Calls {
		if call.Name == "runuser" && strings.Contains(strings.Join(call.Args, " "), "/bin/psql") {
			count++
			joined := strings.Join(call.Args, " ")
			for _, want := range []string{"-u heimdall-postgres --", "-h /run/heimdall-postgresql", "-p 55432", "-U heimdall-postgres"} {
				require.Contains(t, joined, want)
			}
			require.NotContains(t, joined, "/usr/pgsql-")
		}
	}
	require.Equal(t, 3, count)
	require.Contains(t, r.Systemd.(*FakeSystemdRunner).Actions, "start:heimdall-postgresql")
}

func TestBundledPostgresPreflightAndFailures(t *testing.T) {
	for _, failure := range []string{"major", "nonempty", "remote", "port", "initdb", "enable", "sql", "missing runtime", "unexpected path"} {
		t.Run(failure, func(t *testing.T) {
			testBundledPostgresPreflightFailure(t, failure)
		})
	}
}

func testBundledPostgresPreflightFailure(t *testing.T, failure string) {
	t.Helper()
	setup := bundledSetupFixture(t)
	_, err := setup.readConfiguration()
	require.NoError(t, err)
	fs := setup.FS.(*FakeFileSystem)
	exec := setup.Exec.(*FakeExecRunner)
	sd := setup.Systemd.(*FakeSystemdRunner)
	switch failure {
	case "major":
		fs.Files[bundledPGData+"/PG_VERSION"] = []byte("17")
	case "nonempty":
		delete(fs.Files, bundledPGData+"/PG_VERSION")
	case "remote":
		setup.DBHost = "elsewhere.test"
	case "port":
		setup.DBPort = 65536
	case "initdb":
		for path := range fs.Files {
			if strings.HasPrefix(path, bundledPGData+"/") {
				delete(fs.Files, path)
			}
		}
		exec.Results["runuser -u heimdall-postgres"] = FakeExecResult{ExitCode: 1}
	case "enable":
		sd.Err = fmt.Errorf("enable refused")
	case "sql":
		exec.Results["runuser -u heimdall-postgres"] = FakeExecResult{ExitCode: 1}
	case "missing runtime":
		delete(fs.Files, setup.Paths.RuntimePath("postgresql", "bin", "postgres"))
	case "unexpected path":
		fs.Files["/var/lib/heimdall-postgresql"] = []byte("not directory")
	}
	before := map[string]string{}
	for path, data := range fs.Files {
		before[path] = string(data)
	}
	require.Error(t, setup.stepPostgresBootstrap())
	require.NotContains(t, setup.Out.(*bytes.Buffer).String(), "bootstrap complete")
	if failure != "initdb" && failure != "enable" && failure != "sql" {
		require.Empty(t, sd.Actions)
		after := map[string]string{}
		for path, data := range fs.Files {
			after[path] = string(data)
		}
		require.Equal(t, before, after)
	}
}

func TestBundledPostgresExternalLocalhostNeverBootstraps(t *testing.T) {
	r, exec, fs, sd, _ := newBootstrapForTest()
	r.DatabaseMode = "external"
	r.DBHost = "localhost"
	require.NoError(t, r.Run())
	require.Empty(t, exec.Calls)
	require.Empty(t, sd.Actions)
	require.Empty(t, fs.Files)
}

func TestBundledPortChecksOwnershipAtRequestedListener(t *testing.T) {
	for _, tc := range []struct {
		name, output, pid string
		active            bool
		fail              bool
	}{
		{"free", "", "", false, false},
		{"own", `LISTEN 0 100 127.0.0.1:55432 0.0.0.0:* users:(("postgres",pid=123,fd=1))`, "123", true, false},
		{"other pid", `LISTEN 0 100 127.0.0.1:55432 0.0.0.0:* users:(("postgres",pid=123,fd=1))`, "456", true, true},
		{"same unit wrong port", `LISTEN 0 100 127.0.0.1:5432 0.0.0.0:* users:(("postgres",pid=123,fd=1))`, "123", true, true},
		{"unknown owner", `LISTEN 0 100 127.0.0.1:55432 0.0.0.0:*`, "123", true, true},
		{"inactive", `LISTEN 0 100 127.0.0.1:55432 0.0.0.0:* users:(("postgres",pid=123,fd=1))`, "123", false, true},
		{"malformed", "garbage", "123", true, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			exec := &FakeExecRunner{Results: map[string]FakeExecResult{"ss -H": {Stdout: tc.output}}}
			sd := &FakeSystemdRunner{ActiveServices: map[string]bool{bundledPGService: tc.active}, Properties: map[string]string{bundledPGService + ":MainPID": tc.pid}}
			err := checkOwnedPort(exec, sd, 55432, bundledPGService, false)
			if tc.fail {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}
			require.Empty(t, sd.Actions)
		})
	}
}

func TestBundledPostgresRerunPreservesSettingsWithoutDuplicates(t *testing.T) {
	r := bundledSetupFixture(t)
	_, err := r.readConfiguration()
	require.NoError(t, err)
	fs := r.FS.(*FakeFileSystem)
	fs.Files[bundledPGData+"/postgresql.conf"] = []byte("shared_buffers = '256MB'\ninclude = 'heimdall.conf'\nport = 1234\n")
	require.NoError(t, r.stepPostgresBootstrap())
	require.NoError(t, r.stepPostgresBootstrap())
	content := string(fs.Files[bundledPGData+"/postgresql.conf"])
	require.Contains(t, content, "shared_buffers = '256MB'")
	require.Equal(t, 1, strings.Count(content, "include = 'heimdall.conf'"))
	require.True(t, strings.HasSuffix(content, "include = 'heimdall.conf'\n"))
	require.Equal(t, 1, strings.Count(string(fs.Files[bundledPGData+"/pg_hba.conf"]), "host all all 127.0.0.1/32 scram-sha-256"))
	fs.Files[bundledPGData+"/postgresql.auto.conf"] = []byte("listen_addresses = '*'\n")
	actions := len(r.Systemd.(*FakeSystemdRunner).Actions)
	require.ErrorContains(t, r.stepPostgresBootstrap(), "remove the listen_addresses override")
	require.Len(t, r.Systemd.(*FakeSystemdRunner).Actions, actions)
}

func TestPostgresBootstrap_ConfigureHBA_ReplacesLegacyRole(t *testing.T) {
	r, _, fs, _, _ := newBootstrapForTest()
	r.DBUser = "new user"
	install := &pgInstall{DataDir: "/pg"}
	path := install.DataDir + postgresHBAFile
	unrelated := "# operator rules\nhost all admin 127.0.0.1/32 trust\n"
	fs.Files[path] = []byte(unrelated + "# Heimdall: password authentication for TCP connections from localhost\nhost    all    olduser    127.0.0.1/32    scram-sha-256\nhost    all    olduser    ::1/128         scram-sha-256\nhost all all 0.0.0.0/0 reject\n")
	require.NoError(t, r.configureHBA(install))
	updated := string(fs.Files[path])
	require.NotContains(t, updated, "olduser")
	require.Contains(t, updated, "# operator rules\n")
	require.Contains(t, updated, "host all admin 127.0.0.1/32 trust\n")
	require.Contains(t, updated, `host    all    "new user"    127.0.0.1/32    scram-sha-256`)
	require.Contains(t, updated, "host all all 0.0.0.0/0 reject\n")
	require.NoError(t, r.configureHBA(install))
	require.Equal(t, updated, string(fs.Files[path]))
	r.DBUser = "nextuser"
	require.NoError(t, r.configureHBA(install))
	require.NotContains(t, string(fs.Files[path]), "new user")
	require.Contains(t, string(fs.Files[path]), `host    all    "nextuser"    ::1/128         scram-sha-256`)
}

func TestPostgresBootstrap_ConfigureHBA_PrecedesExistingRulesWithoutHeader(t *testing.T) {
	for _, existing := range []string{"host all all 127.0.0.1/32 reject\n", "hostssl all all 0.0.0.0/0 ident\n", "include 'operator.conf'\n"} {
		t.Run(existing, func(t *testing.T) {
			r, _, fs, _, _ := newBootstrapForTest()
			install := &pgInstall{DataDir: "/pg"}
			path := install.DataDir + postgresHBAFile
			fs.Files[path] = []byte("# operator comment\n" + existing)
			require.NoError(t, r.configureHBA(install))
			content := string(fs.Files[path])
			require.Contains(t, content, existing)
			require.Less(t, strings.Index(content, "scram-sha-256"), strings.Index(content, existing))
		})
	}
}

func TestPostgresBootstrap_ConfigureHBA_QuotesLiteralRoles(t *testing.T) {
	for _, tc := range []struct{ role, token string }{
		{"app user", `"app user"`}, {"all", `"all"`}, {"+group", `"+group"`},
		{"a,b", `"a,b"`}, {`a"b`, `"a""b"`}, {"@file", `"@file"`}, {`a\b`, `"a\b"`},
	} {
		t.Run(tc.role, func(t *testing.T) {
			r, _, fs, _, _ := newBootstrapForTest()
			r.DBUser = tc.role
			install := &pgInstall{DataDir: "/pg"}
			path := install.DataDir + postgresHBAFile
			fs.Files[path] = []byte("# TYPE\nhost all all 127.0.0.1/32 reject\n")
			require.NoError(t, r.configureHBA(install))
			require.Contains(t, string(fs.Files[path]), "host    all    "+tc.token+"    127.0.0.1/32    scram-sha-256")
		})
	}
}

func TestPostgresBootstrap_RejectsHBARoleLineBreaksBeforeWrites(t *testing.T) {
	for _, role := range []string{"app\nuser", "app\ruser", "app\x00user"} {
		t.Run(role, func(t *testing.T) {
			r, exec, fs, _, _ := newBootstrapForTest()
			r.DBUser = role
			require.ErrorContains(t, r.Run(), "DATABASE_USERNAME")
			require.Empty(t, exec.Calls)
			require.Empty(t, fs.Files)
		})
	}
}

func TestPostgresBootstrap_ConfigureHBA_PreservesAdjacentUnrelatedRule(t *testing.T) {
	r, _, fs, _, _ := newBootstrapForTest()
	install := &pgInstall{DataDir: "/pg"}
	path := install.DataDir + postgresHBAFile
	adminRule := "host    all    admin    ::1/128         scram-sha-256\n"
	fs.Files[path] = []byte("# Heimdall: password authentication for TCP connections from localhost\nhost    all    olduser    127.0.0.1/32    scram-sha-256\n" + adminRule)
	require.NoError(t, r.configureHBA(install))
	require.Contains(t, string(fs.Files[path]), adminRule)
	require.NotContains(t, string(fs.Files[path]), "olduser")
}
