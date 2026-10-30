package cmd

import (
	"bytes"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// stubLocalPostgresHappy registers fake exec results and filesystem state
// so PostgresBootstrapRunner.Run() succeeds end-to-end without touching
// a real PG. Use in higher-level setup tests that exercise the full
// orchestration but don't validate bootstrap internals.
func stubLocalPostgresHappy(r *SetupRunner) {
	exec := r.Exec.(*FakeExecRunner)
	fs := r.FS.(*FakeFileSystem)

	// PGDG 16 detected
	fs.Files["/usr/pgsql-16/bin/psql"] = []byte("")
	exec.Results["/usr/pgsql-16/bin/psql --version"] = FakeExecResult{
		Stdout: "psql (PostgreSQL) 16.4\n",
	}
	// Cluster already initialized
	fs.Files["/var/lib/pgsql/16/data/PG_VERSION"] = []byte("16\n")
	// Default config files present
	fs.Files["/var/lib/pgsql/16/data/pg_hba.conf"] = []byte(
		"# TYPE  DATABASE        USER            ADDRESS                 METHOD\n",
	)
	fs.Files["/var/lib/pgsql/16/data/postgresql.conf"] = []byte("")
	// SQL ops via runuser psql succeed; rolpassword is SCRAM-SHA-256
	exec.Results["runuser -u postgres"] = FakeExecResult{Stdout: "SCRAM-SHA-256$x"}
	// Final connection test
	exec.Results["/usr/pgsql-16/bin/psql postgresql://postgres@127.0.0.1:5432/heimdall-server-production -c"] = FakeExecResult{}
	exec.Results["/usr/pgsql-16/bin/psql postgresql://postgres@localhost:5432/heimdall-server-production -c"] = FakeExecResult{}
}

func newTestSetupRunner() (*SetupRunner, *bytes.Buffer, *bytes.Buffer) {
	out := new(bytes.Buffer)
	errOut := new(bytes.Buffer)
	r := &SetupRunner{
		Exec: &FakeExecRunner{
			Results: make(map[string]FakeExecResult),
		},
		Systemd: &FakeSystemdRunner{
			ActiveServices: make(map[string]bool),
			Properties:     make(map[string]string),
		},
		Env: &FakeEnvManager{
			Env: make(map[string]string),
		},
		FS:     NewFakeFileSystem(),
		DB:     &FakeDBConnector{},
		Out:    out,
		ErrOut: errOut,
		Paths:  DefaultPaths(),
	}
	return r, out, errOut
}

func TestSetupCompletionUsesConfiguredLogin(t *testing.T) {
	for _, bundled := range []bool{false, true} {
		t.Run(fmt.Sprintf("bundled=%t", bundled), func(t *testing.T) {
			r, out, _ := newTestSetupRunner()
			if bundled {
				r = bundledSetupFixture(t)
				out = r.Out.(*bytes.Buffer)
			} else {
				stubLocalPostgresHappy(r)
			}
			env := r.Env.(*FakeEnvManager)
			env.Env["ADMIN_EMAIL"] = "operator+admin@example.test"
			env.Env["EXTERNAL_URL"] = "https://portal.example.test"
			env.Env["ADMIN_PASSWORD"] = "private-admin-password"
			cmd := NewSetupCmd(r)
			cmd.SetArgs([]string{"--non-interactive", "--skip-tls"})
			require.NoError(t, cmd.Execute())
			output := out.String()
			assert.Contains(t, output, "Configured URL: https://portal.example.test")
			assert.Contains(t, output, "Admin email: operator+admin@example.test")
			assert.Contains(t, output, "sudo heimdall-cli reset-password 'operator+admin@example.test'")
			assert.Contains(t, output, "unknown")
			assert.Contains(t, output, "/usr/share/doc/heimdall-server/INSTALL.md")
			assert.NotContains(t, output, "only on this server")
			assert.NotContains(t, output, "private-admin-password")
			assert.NotContains(t, output, env.Env["DATABASE_PASSWORD"])
		})
	}
}

func TestSetupCompletionReflectsSkippedStepsAndLoginMode(t *testing.T) {
	for _, tc := range []struct {
		name, proxy, tls, disabled string
		skipDB, skipTLS, readError bool
		want, absent               string
	}{
		{name: "self-signed", proxy: "nginx", tls: "self-signed", want: "browser warning"},
		{name: "internal CA", proxy: "bundled", tls: "internal", want: "browser warning"},
		{name: "ACME", proxy: "bundled", tls: "acme", absent: "browser warning"},
		{name: "skipped TLS", proxy: "nginx", tls: "self-signed", skipTLS: true, want: "TLS setup was skipped", absent: "browser warning"},
		{name: "external proxy", proxy: "external", tls: "internal", want: "Verify your external proxy", absent: "browser warning"},
		{name: "no proxy", proxy: "none", tls: "internal", want: "No reverse proxy was configured", absent: "browser warning"},
		{name: "skipped database", skipDB: true, want: "Database setup and migrations were skipped", absent: "sudo heimdall-cli reset-password"},
		{name: "disabled local login", disabled: "true", want: "Local login is disabled", absent: "sudo heimdall-cli reset-password"},
		{name: "uppercase disabled local login", disabled: "TRUE", want: "Local login is disabled", absent: "sudo heimdall-cli reset-password"},
		{name: "unreadable configuration", readError: true, want: "Could not read login settings", absent: "sudo heimdall-cli reset-password"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, out, _ := newTestSetupRunner()
			r.ProxyMode, r.TLSMode = tc.proxy, tc.tls
			r.SkipDB, r.SkipTLS = tc.skipDB, tc.skipTLS
			r.ExternalURL = "https://localhost"
			r.Env.(*FakeEnvManager).Env = map[string]string{"LOCAL_LOGIN_DISABLED": tc.disabled, "EXTERNAL_URL": "https://localhost"}
			if tc.readError {
				r.Env = &FileEnvManager{Path: t.TempDir()}
			}
			r.printCompletionBanner()
			output := out.String()
			if tc.want != "" {
				assert.Contains(t, output, tc.want)
			}
			if tc.absent != "" {
				assert.NotContains(t, output, tc.absent)
			}
			assert.Contains(t, output, "only on this server")
			if !tc.skipDB && tc.disabled == "" && !tc.readError {
				assert.Contains(t, output, "sudo heimdall-cli reset-password 'admin@heimdall.local'")
			}
		})
	}
}

// --- Command-level tests ---

func TestSetupCmd_Help(t *testing.T) {
	cmd := NewSetupCmd(nil)
	out := new(bytes.Buffer)
	cmd.SetOut(out)
	cmd.SetArgs([]string{"--help"})
	err := cmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "setup")
	assert.Contains(t, out.String(), "--interactive")
	assert.Contains(t, out.String(), "--skip-db")
	assert.Contains(t, out.String(), "--skip-tls")
	assert.Contains(t, out.String(), "--reconfigure")
	assert.Contains(t, out.String(), "--external-url")
	assert.Contains(t, out.String(), "--tls-cert")
	assert.Contains(t, out.String(), "--tls-key")
}

func TestSetupCmd_UnknownFlag(t *testing.T) {
	cmd := NewSetupCmd(nil)
	cmd.SetArgs([]string{"--bogus-flag"})
	err := cmd.Execute()
	assert.Error(t, err)
}

func TestSetupCmd_TlsCertWithoutKey(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--tls-cert", "/tmp/cert.pem"})
	err := cmd.Execute()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "--tls-cert and --tls-key must be provided together")
}

func TestSetupCmd_TlsKeyWithoutCert(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--tls-key", "/tmp/key.pem"})
	err := cmd.Execute()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "--tls-cert and --tls-key must be provided together")
}

func TestSetupCmd_Reconfigure(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--reconfigure", "--non-interactive"})
	err := cmd.Execute()
	require.NoError(t, err)
	output := out.String()
	assert.NotContains(t, output, "=== Step ")
	assert.Contains(t, output, "Reconfiguration complete")
	// Reconfiguration must not start the setup pipeline.
	assert.NotContains(t, output, "\nPostgreSQL bootstrap")
	assert.NotContains(t, output, "\nConnection test")
}

func TestSetupCmd_SkipDB(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--skip-db", "--skip-tls", "--non-interactive"})
	err := cmd.Execute()
	require.NoError(t, err)
	output := out.String()
	assert.NotContains(t, output, "=== Step ")
	assert.Contains(t, output, "skipped")
	// Steps 2,3,4 should show "(skipped" in their headers
	assert.Contains(t, output, "PostgreSQL bootstrap (skipped")
	assert.Contains(t, output, "Connection test (skipped")
	assert.Contains(t, output, "Database migrations (skipped")
}

func TestSetupCmd_ExternalDBSkipsBootstrap(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	// Set up fake exec for db-setup binary
	r.Exec.(*FakeExecRunner).Results["heimdall-server-db-setup "] = FakeExecResult{}
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{
		"--non-interactive",
		"--skip-tls",
		"--db-host", "db.example.com",
		"--db-password", "secret",
	})
	err := cmd.Execute()
	require.NoError(t, err)
	output := out.String()
	// Step 2 should be skipped (external DB)
	assert.Contains(t, output, "skipped")
	assert.Contains(t, output, "external database")
	// Step 3 (connection test) should still run
	assert.Contains(t, output, "Connection test")
}

func TestSetupCmd_NonInteractiveAutoGeneratesPassword(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	stubLocalPostgresHappy(r)
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--non-interactive", "--skip-tls"})
	err := cmd.Execute()
	require.NoError(t, err)
	env := r.Env.(*FakeEnvManager).Env
	assert.NotEmpty(t, env["DATABASE_PASSWORD"], "password should be auto-generated")
}

func TestSetupCmd_AllStepsRunWithMocks(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.DB.(*FakeDBConnector).Tables = 5
	stubLocalPostgresHappy(r)
	r.Exec.(*FakeExecRunner).Results["heimdall-server-db-setup "] = FakeExecResult{}
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--non-interactive", "--skip-tls", "--db-password", "testpass"})
	err := cmd.Execute()
	require.NoError(t, err)
	output := out.String()
	assert.NotContains(t, output, "=== Step ")
	assert.Contains(t, output, "Connection test")
	assert.Contains(t, output, "\nDatabase migrations")
	assert.Contains(t, output, "Starting service")
}

func TestSetupCmd_ConnectionTestFailure(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	stubLocalPostgresHappy(r)
	r.DB.(*FakeDBConnector).ConnErr = errors.New("connection refused")
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--non-interactive", "--skip-tls", "--db-password", "testpass"})
	err := cmd.Execute()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "connection test failed")
}

// --- stepConfigure preservation tests ---

func TestStepConfigurePreservesAdditionalSettings(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	original := map[string]string{
		"LOCAL_LOGIN_DISABLED": "true", "OIDC_NAME": "Corporate Login",
		"EXTERNAL_URL":      "https://heimdall.example.test",
		"DATABASE_PASSWORD": "existing-password", "JWT_SECRET": "existing-jwt",
		"API_KEY_SECRET": "existing-api",
	}
	r.Env.(*FakeEnvManager).Env = original
	require.NoError(t, r.stepConfigure())
	first, err := r.Env.ReadEnv()
	require.NoError(t, err)
	for key, value := range original {
		require.Equal(t, value, first[key], key)
	}
	require.NoError(t, r.stepConfigure())
	second, err := r.Env.ReadEnv()
	require.NoError(t, err)
	require.Equal(t, first, second)
}

func TestStepConfigureReturnsReadError(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	path := t.TempDir()
	marker := filepath.Join(path, "keep")
	require.NoError(t, os.WriteFile(marker, []byte("unchanged"), 0640))
	r.Env = &FileEnvManager{Path: path}
	_, readErr := r.Env.ReadEnv()
	require.Error(t, readErr)

	err := r.stepConfigure()
	require.EqualError(t, err, readErr.Error())
	require.Empty(t, out.String())
	require.Empty(t, r.Exec.(*FakeExecRunner).Calls)
	info, err := os.Stat(path)
	require.NoError(t, err)
	require.True(t, info.IsDir())
	content, err := os.ReadFile(marker)
	require.NoError(t, err)
	require.Equal(t, "unchanged", string(content))
}

func TestStepConfigureCreatesMissingFile(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env = &FileEnvManager{Path: filepath.Join(t.TempDir(), "backend.env")}
	require.NoError(t, r.stepConfigure())
	env, err := r.Env.ReadEnv()
	require.NoError(t, err)
	require.NotEmpty(t, env["DATABASE_PASSWORD"])
	require.NotEmpty(t, env["JWT_SECRET"])
	require.NotEmpty(t, env["API_KEY_SECRET"])
}

func TestStepConfigure_PreservesExistingSecrets(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	// Simulate existing backend.env with secrets already set
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"JWT_SECRET":        "existing-jwt-secret-do-not-overwrite",
		"API_KEY_SECRET":    "existing-api-key-do-not-overwrite",
		"DATABASE_PASSWORD": "existing-db-password",
		"NODE_ENV":          "production",
		"PORT":              "3000",
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "existing-jwt-secret-do-not-overwrite", env["JWT_SECRET"], "JWT_SECRET should be preserved")
	assert.Equal(t, "existing-api-key-do-not-overwrite", env["API_KEY_SECRET"], "API_KEY_SECRET should be preserved")
	assert.Equal(t, "existing-db-password", env["DATABASE_PASSWORD"], "DATABASE_PASSWORD should be preserved")
}

func TestStepConfigure_GeneratesSecretsWhenMissing(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	// Empty env — no existing secrets
	r.Env.(*FakeEnvManager).Env = map[string]string{}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.NotEmpty(t, env["JWT_SECRET"], "JWT_SECRET should be generated")
	assert.NotEmpty(t, env["API_KEY_SECRET"], "API_KEY_SECRET should be generated")
	assert.NotEmpty(t, env["DATABASE_PASSWORD"], "DATABASE_PASSWORD should be generated")
	assert.Contains(t, out.String(), "auto-generated")
}

func TestStepConfigure_WritesAllExpectedKeys(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	expectedKeys := []string{
		"NODE_ENV", "PORT", "DATABASE_HOST", "DATABASE_PORT",
		"DATABASE_USERNAME", "DATABASE_PASSWORD", "DATABASE_NAME",
		"JWT_SECRET", "JWT_EXPIRE_TIME", "API_KEY_SECRET",
		"NGINX_HOST", "EXTERNAL_URL", "ADMIN_EMAIL",
	}
	for _, key := range expectedKeys {
		assert.Contains(t, env, key, "missing key: %s", key)
	}
}

func TestStepConfigure_CLIFlagOverridesExisting(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"DATABASE_HOST": "old-host.example.com",
	}
	r.DBHost = "new-host.example.com"

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "new-host.example.com", env["DATABASE_HOST"])
}

func TestStepConfigure_ExplicitPasswordOverridesExisting(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"DATABASE_PASSWORD": "old-password",
	}
	r.DBPassword = "new-explicit-password"

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "new-explicit-password", env["DATABASE_PASSWORD"])
}

func TestStepConfigure_WritesNginxHost(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "localhost", env["NGINX_HOST"])
}

func TestStepConfigure_WritesAdminEmail(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "admin@heimdall.local", env["ADMIN_EMAIL"])
}

func TestStepConfigure_DerivesExternalURLFromNginxHost(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"NGINX_HOST": "heimdall.example.com",
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "https://heimdall.example.com", env["EXTERNAL_URL"])
}

func TestStepConfigure_SetsFilePermissions(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{}

	err := r.stepConfigure()
	require.NoError(t, err)

	// Verify chown and chmod were called
	exec := r.Exec.(*FakeExecRunner)
	foundChown := false
	foundChmod := false
	for _, call := range exec.Calls {
		if call.Name == "chown" {
			foundChown = true
		}
		if call.Name == "chmod" {
			foundChmod = true
		}
	}
	assert.True(t, foundChown, "chown should be called on env file")
	assert.True(t, foundChmod, "chmod should be called on env file")
}

// --- stepPostgresBootstrap tests ---
// stepPostgresBootstrap delegates to PostgresBootstrapRunner. The runner
// itself is exhaustively tested in postgres_bootstrap_test.go; here we
// just verify the wiring (inputs are forwarded, errors propagate, no
// shell-out to the old script remains).

func TestStepPostgresBootstrap_DelegatesToNativeRunner(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.DBUser = "heimdall"
	r.DBPassword = "secret"
	r.DBHost = "127.0.0.1"
	r.DBPort = 5432
	r.DBName = "heimdall-server-production"

	exec := r.Exec.(*FakeExecRunner)
	fs := r.FS.(*FakeFileSystem)

	fs.Files["/usr/pgsql-16/bin/psql"] = []byte("")
	exec.Results["/usr/pgsql-16/bin/psql --version"] = FakeExecResult{
		Stdout: "psql (PostgreSQL) 16.4\n",
	}
	fs.Files["/var/lib/pgsql/16/data/PG_VERSION"] = []byte("16\n")
	fs.Files["/var/lib/pgsql/16/data/pg_hba.conf"] = []byte(
		"# TYPE  DATABASE        USER            ADDRESS                 METHOD\n",
	)
	fs.Files["/var/lib/pgsql/16/data/postgresql.conf"] = []byte("")
	exec.Results["runuser -u postgres"] = FakeExecResult{Stdout: "SCRAM-SHA-256$x"}
	exec.Results["/usr/pgsql-16/bin/psql postgresql://heimdall@127.0.0.1:5432/heimdall-server-production -c"] = FakeExecResult{}

	err := r.stepPostgresBootstrap()

	require.NoError(t, err)

	// Verify the OLD shell-out is gone.
	for _, c := range exec.Calls {
		require.NotContains(t, c.Name, "postgres-setup.sh",
			"native runner must not invoke postgres-setup.sh")
	}
}

func TestStepPostgresBootstrap_PropagatesValidationError(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.DBUser = ""
	r.DBPassword = ""

	err := r.stepPostgresBootstrap()

	require.Error(t, err, "missing credentials must surface as an error")
}

func TestStepPostgresBootstrap_SkipsForRemoteHost(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.DBHost = "db.internal"
	r.DBUser = "u"
	r.DBPassword = "p"

	err := r.stepPostgresBootstrap()

	require.NoError(t, err, "remote host short-circuits with no error")
	assert.Contains(t, out.String(), "skipping",
		"output must explain remote host was skipped")
}

// --- stepConnectionTest tests ---

func TestStepConnectionTest_Success(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.DBHost = "localhost"
	r.DBPort = 5432
	r.DBUser = "postgres"
	r.DBPassword = "secret"
	r.DBName = "heimdall-server-production"

	err := r.stepConnectionTest()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Connected to localhost:5432/heimdall-server-production")
}

func TestStepConnectionTest_Failure(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.DB.(*FakeDBConnector).ConnErr = errors.New("connection refused")
	r.DBHost = "db.example.com"
	r.DBPort = 5432
	r.DBName = "mydb"

	err := r.stepConnectionTest()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "cannot connect to db.example.com:5432/mydb")
}

// --- stepMigrations tests ---

func TestStepMigrations_Success(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Exec.(*FakeExecRunner).Results["heimdall-server-db-setup"] = FakeExecResult{ExitCode: 0}

	err := r.stepMigrations()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Database migrations complete")
}

func TestStepMigrations_Failure(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Exec.(*FakeExecRunner).Results["heimdall-server-db-setup"] = FakeExecResult{ExitCode: 1}

	err := r.stepMigrations()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "exited with code 1")
}

// --- stepStartService tests ---

func TestStepStartService_Success(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env["DATABASE_PASSWORD"] = "secret"

	err := r.stepStartService()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Service enabled and started")
	assert.Equal(t, []string{"enable:" + ServiceName, "restart:" + ServiceName}, r.Systemd.(*FakeSystemdRunner).Actions)
}

func TestStepStartService_MissingPassword(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{}

	err := r.stepStartService()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "DATABASE_PASSWORD is not set")
}

func TestStepStartService_SystemdFails(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env["DATABASE_PASSWORD"] = "secret"
	r.Systemd.(*FakeSystemdRunner).Err = errors.New("unit not found")

	err := r.stepStartService()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "enabling service")
}

// --- isLocalHost tests ---

func TestIsLocalHost(t *testing.T) {
	tests := []struct {
		host  string
		local bool
	}{
		{"localhost", true},
		{"", true},
		{"127.0.0.1", true},
		{"::1", true},
		{"  localhost  ", true},
		{"db.example.com", false},
		{"192.168.1.100", false},
		{"10.0.0.1", false},
	}
	for _, tt := range tests {
		t.Run(tt.host, func(t *testing.T) {
			assert.Equal(t, tt.local, isLocalHost(tt.host))
		})
	}
}

// --- resolveExternalHost tests ---

func TestResolveExternalHost_FromExternalURL(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.ExternalURL = "https://heimdall.example.com"

	host, url := r.resolveExternalHost()
	assert.Equal(t, "heimdall.example.com", host)
	assert.Equal(t, "https://heimdall.example.com", url)
}

func TestResolveExternalHost_StripsPortAndPath(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.ExternalURL = "https://heimdall.example.com:443/api"

	host, _ := r.resolveExternalHost()
	assert.Equal(t, "heimdall.example.com", host)
}

func TestResolveExternalHost_URLForms(t *testing.T) {
	for _, tc := range []struct{ address, host string }{
		{"https://[::1]:8443/api", "::1"},
		{"http://heimdall.example.com:8080/api", "heimdall.example.com"},
		{"heimdall.example.com:8443/api", "heimdall.example.com"},
	} {
		t.Run(tc.address, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			r.ExternalURL = tc.address
			host, address := r.resolveExternalHost()
			require.Equal(t, tc.host, host)
			require.Equal(t, tc.address, address)
		})
	}
}

func TestResolveExternalHost_FallsBackToHostname(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Exec.(*FakeExecRunner).Results["hostname -f"] = FakeExecResult{Stdout: "myserver.local"}

	host, url := r.resolveExternalHost()
	assert.Equal(t, "myserver.local", host)
	assert.Equal(t, "https://myserver.local", url)
}

func TestResolveExternalHost_FallsBackToLocalhost(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	// Both hostname commands return empty
	r.Exec.(*FakeExecRunner).Results["hostname -f"] = FakeExecResult{Stdout: ""}
	r.Exec.(*FakeExecRunner).Results["hostname"] = FakeExecResult{Stdout: ""}

	host, _ := r.resolveExternalHost()
	assert.Equal(t, "localhost", host)
}

// --- Interactive setup tests (topology-aware wizard) ---

func TestInteractiveRPMExternalURLDefault(t *testing.T) {
	for _, tc := range []struct {
		name              string
		saved             map[string]string
		args              []string
		clearInput        bool
		wantURL, wantHost string
	}{
		{"fresh bundled database", nil, nil, false, "https://localhost", "localhost"},
		{"external database", nil, []string{"--database-mode=external", "--db-host=db.example.com"}, false, "https://localhost", "localhost"},
		{"saved hostname", map[string]string{"NGINX_HOST": "heimdall.example.com"}, nil, false, "https://heimdall.example.com", "heimdall.example.com"},
		{"saved URL", map[string]string{"EXTERNAL_URL": "https://saved.example.com", "NGINX_HOST": "old.example.com"}, nil, false, "https://saved.example.com", "saved.example.com"},
		{"explicit URL", map[string]string{"EXTERNAL_URL": "https://saved.example.com"}, []string{"--external-url=https://flag.example.com"}, false, "https://flag.example.com", "flag.example.com"},
		{"cleared input keeps displayed default", map[string]string{"EXTERNAL_URL": "https://saved.example.com", "NGINX_HOST": "old.example.com"}, nil, true, "https://saved.example.com", "saved.example.com"},
		{"no TLS uses HTTP", nil, []string{"--proxy-mode=none"}, false, "http://localhost", "localhost"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
			r.Env.(*FakeEnvManager).Env = tc.saved
			displayDefault := tc.wantURL
			if tc.saved["EXTERNAL_URL"] == "" && len(tc.args) == 0 {
				displayDefault = tc.wantHost
			}
			if tc.wantURL == "https://localhost" || tc.wantURL == "http://localhost" {
				displayDefault = "localhost"
			}
			prompt := "External URL"
			prompter := &FakePrompter{IsTTY: true}
			if tc.clearInput {
				prompter.Inputs = map[string]string{prompt: ""}
			}
			r.Prompter = prompter
			cmd := NewSetupCmd(r)
			cmd.SetArgs(append([]string{"--interactive", "--reconfigure"}, tc.args...))
			require.NoError(t, cmd.Execute())
			assert.Contains(t, prompter.InputDefaults, prompt)
			assert.Equal(t, displayDefault, prompter.InputDefaults[prompt])
			env := r.Env.(*FakeEnvManager).Env
			assert.Equal(t, tc.wantURL, env["EXTERNAL_URL"])
			assert.Equal(t, tc.wantHost, env["NGINX_HOST"])
		})
	}
}

func TestInteractiveRerunExternalURLFallback(t *testing.T) {
	for _, tc := range []struct{ hostname, wantURL string }{
		{"", "https://localhost"},
		{"heimdall.example.com", "https://heimdall.example.com"},
	} {
		t.Run(tc.wantURL, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			r.Interactive = true
			r.Env.(*FakeEnvManager).Env = map[string]string{
				"DATABASE_HOST":     "db.example.com",
				"DATABASE_PASSWORD": "saved-password",
				"NGINX_HOST":        tc.hostname,
			}
			r.Prompter = &FakePrompter{IsTTY: true}
			require.NoError(t, r.stepConfigure())
			assert.Equal(t, tc.wantURL, r.Env.(*FakeEnvManager).Env["EXTERNAL_URL"])
		})
	}
}

// Test: External DB + External SSL (most common enterprise deployment)
func TestInteractive_ExternalDB_ExternalSSL(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 1, // External PostgreSQL
			"TLS/SSL setup":  1, // External SSL termination
		},
		Inputs: map[string]string{
			"Database host":     "db.prod.example.com",
			"Database port":     "5433",
			"Database user":     "heimdall_app",
			"Database password": "Str0ng!Pass#2026",
			"Confirm password":  "Str0ng!Pass#2026",
			"Database name":     "heimdall_prod",
			"External URL":      "https://heimdall.example.com",
			"Admin email":       "admin@example.com",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "db.prod.example.com", env["DATABASE_HOST"])
	assert.Equal(t, "5433", env["DATABASE_PORT"])
	assert.Equal(t, "heimdall_app", env["DATABASE_USERNAME"])
	assert.Equal(t, "Str0ng!Pass#2026", env["DATABASE_PASSWORD"])
	assert.Equal(t, "heimdall_prod", env["DATABASE_NAME"])
	assert.Equal(t, "https://heimdall.example.com", env["EXTERNAL_URL"])
	assert.Equal(t, "admin@example.com", env["ADMIN_EMAIL"])
	assert.Equal(t, "external", r.ProxyMode)
	assert.False(t, r.SkipTLS, "ownership must not rewrite a temporary skip")
	// SkipDB stays false — we still want connection test + migrations
	assert.False(t, r.SkipDB, "external DB should NOT set SkipDB (migrations still needed)")
	assert.Contains(t, out.String(), "Configuration saved")
}

// Test: Local DB + Caddy (default single-box deployment)
func TestInteractive_LocalDB_Caddy(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 0, // Local PostgreSQL
			"TLS/SSL setup":  0, // Caddy
		},
		Inputs: map[string]string{
			"Database password": "localpass",
			"Confirm password":  "localpass",
			"External URL":      "https://heimdall.local",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "localhost", env["DATABASE_HOST"], "local DB uses localhost")
	assert.Equal(t, "5432", env["DATABASE_PORT"], "local DB uses default port")
	assert.Equal(t, "postgres", env["DATABASE_USERNAME"], "local DB uses default user")
	assert.Equal(t, "localpass", env["DATABASE_PASSWORD"])
	assert.False(t, r.SkipTLS, "Caddy choice should leave SkipTLS false")
}

// Test: External DB + BYO cert
func TestInteractive_ExternalDB_BYOCert(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 1, // External PostgreSQL
			"TLS/SSL setup":  2, // BYO certificate
		},
		Inputs: map[string]string{
			"Database host":        "db.example.com",
			"Database port":        "5432",
			"Database user":        "heimdall",
			"Database password":    "secret",
			"Confirm password":     "secret",
			"Database name":        "heimdall_prod",
			"TLS certificate path": "/etc/pki/tls/certs/heimdall.crt",
			"TLS private key path": "/etc/pki/tls/private/heimdall.key",
			"External URL":         "https://heimdall.example.com",
			"Admin email":          "admin@example.com",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	assert.Equal(t, "/etc/pki/tls/certs/heimdall.crt", r.TLSCert, "BYO cert path set on runner")
	assert.Equal(t, "/etc/pki/tls/private/heimdall.key", r.TLSKey, "BYO key path set on runner")
	assert.False(t, r.SkipTLS, "BYO cert should leave SkipTLS false (Caddy still runs)")
}

// Test: Local DB + No TLS (development mode)
func TestInteractive_LocalDB_NoTLS(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 0, // Local PostgreSQL
			"TLS/SSL setup":  3, // No TLS
		},
		Inputs: map[string]string{
			"Database password": "devpass",
			"Confirm password":  "devpass",
			"External URL":      "",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	assert.Equal(t, "none", r.ProxyMode)
	assert.False(t, r.SkipTLS, "ownership must not rewrite a temporary skip")
}

// Test: Re-run with existing config keeps current values
func TestInteractive_RerunKeepCurrent(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Interactive = true
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"DATABASE_HOST":     "existing.db.com",
		"DATABASE_PORT":     "5433",
		"DATABASE_USERNAME": "myuser",
		"DATABASE_PASSWORD": "existing-pass",
		"DATABASE_NAME":     "mydb",
		"EXTERNAL_URL":      "https://heimdall.existing.com",
		"ADMIN_EMAIL":       "admin@existing.com",
		"JWT_SECRET":        "existing-jwt",
		"API_KEY_SECRET":    "existing-api",
	}
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"What would you like to do?": 0, // Re-run with current config
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "existing.db.com", env["DATABASE_HOST"], "existing DB host preserved")
	assert.Equal(t, "5433", env["DATABASE_PORT"], "existing DB port preserved")
	assert.Equal(t, "myuser", env["DATABASE_USERNAME"], "existing DB user preserved")
	assert.Equal(t, "existing-pass", env["DATABASE_PASSWORD"], "existing password preserved")
	assert.Equal(t, "mydb", env["DATABASE_NAME"], "existing DB name preserved")
	assert.Equal(t, "existing-jwt", env["JWT_SECRET"], "existing JWT secret preserved")
	assert.Equal(t, "existing-api", env["API_KEY_SECRET"], "existing API key preserved")
	assert.Contains(t, out.String(), "Re-running with existing configuration")
}

// Test: Re-run -> edit config changes one value
func TestInteractive_RerunEditConfig(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"DATABASE_HOST":     "old-host.example.com",
		"DATABASE_PORT":     "5432",
		"DATABASE_USERNAME": "postgres",
		"DATABASE_PASSWORD": "old-pass",
		"DATABASE_NAME":     "olddb",
		"EXTERNAL_URL":      "https://old.example.com",
		"ADMIN_EMAIL":       "old@example.com",
		"JWT_SECRET":        "keep-this-jwt",
		"API_KEY_SECRET":    "keep-this-api",
	}
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"What would you like to do?": 1, // Edit configuration
			"Database setup":             1, // External PostgreSQL
			"TLS/SSL setup":              1, // External SSL
		},
		Inputs: map[string]string{
			"Database host":     "new-host.example.com", // changed
			"Database port":     "5432",                 // kept
			"Database user":     "postgres",             // kept
			"Database password": "",                     // blank keeps the existing password
			"Database name":     "olddb",                // kept
			"External URL":      "https://old.example.com",
			"Admin email":       "old@example.com",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "new-host.example.com", env["DATABASE_HOST"], "changed value updated")
	assert.Equal(t, "old-pass", env["DATABASE_PASSWORD"], "unchanged value preserved")
	assert.Equal(t, "keep-this-jwt", env["JWT_SECRET"], "secrets preserved on edit")
	assert.Equal(t, "keep-this-api", env["API_KEY_SECRET"], "secrets preserved on edit")
}

// Test: Non-TTY returns CLIError
func TestInteractive_NonTTYReturnsError(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{IsTTY: false}

	err := r.stepConfigure()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "terminal")
}

// Test: Prompter error propagates
func TestInteractive_PrompterErrorPropagates(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{
		IsTTY: true,
		Err:   fmt.Errorf("user cancelled"),
	}

	err := r.stepConfigure()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "user cancelled")
}

// Test: Empty password auto-generates
func TestInteractive_EmptyPasswordAutoGenerates(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 0, // Local PostgreSQL
			"TLS/SSL setup":  3, // No TLS
		},
		Inputs: map[string]string{
			"Database password": "", // empty = auto-generate
			"External URL":      "",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.NotEmpty(t, env["DATABASE_PASSWORD"], "empty input should auto-generate password")
	assert.Contains(t, out.String(), "DATABASE_PASSWORD auto-generated")
}

// Test: Existing secrets preserved during interactive setup
func TestInteractive_ExistingSecretsPreserved(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Interactive = true
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"JWT_SECRET":     "existing-jwt",
		"API_KEY_SECRET": "existing-api",
	}
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 0, // Local PostgreSQL
			"TLS/SSL setup":  0, // Caddy
		},
		Inputs: map[string]string{
			"Database password": "pass",
			"Confirm password":  "pass",
			"External URL":      "",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "existing-jwt", env["JWT_SECRET"], "existing JWT_SECRET preserved")
	assert.Equal(t, "existing-api", env["API_KEY_SECRET"], "existing API_KEY_SECRET preserved")
	assert.NotContains(t, out.String(), "JWT_SECRET auto-generated")
}

// Test: Secrets auto-generated when missing
func TestInteractive_SecretsAutoGenerated(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 0, // Local PostgreSQL
			"TLS/SSL setup":  0, // Caddy
		},
		Inputs: map[string]string{
			"Database password": "pass",
			"Confirm password":  "pass",
			"External URL":      "",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.NotEmpty(t, env["JWT_SECRET"], "should auto-generate JWT_SECRET")
	assert.NotEmpty(t, env["API_KEY_SECRET"], "should auto-generate API_KEY_SECRET")
	assert.Contains(t, out.String(), "JWT_SECRET auto-generated")
	assert.Contains(t, out.String(), "API_KEY_SECRET auto-generated")
}

// Test: External URL derives NGINX_HOST
func TestInteractive_DeriveExternalURL(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 0, // Local
			"TLS/SSL setup":  0, // Caddy
		},
		Inputs: map[string]string{
			"Database password": "pass",
			"Confirm password":  "pass",
			"External URL":      "https://heimdall.example.com:443/app",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "https://heimdall.example.com:443/app", env["EXTERNAL_URL"])
	assert.Equal(t, "heimdall.example.com", env["NGINX_HOST"], "NGINX_HOST derived from URL")
}

// Test: HTTP URL derives NGINX_HOST correctly
func TestInteractive_URLDerivesNginxHostFromHTTP(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 0,
			"TLS/SSL setup":  0,
		},
		Inputs: map[string]string{
			"Database password": "pass",
			"Confirm password":  "pass",
			"External URL":      "http://heimdall.internal:8080/path",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "heimdall.internal", env["NGINX_HOST"], "NGINX_HOST derived from http:// URL")
}

// Test: Empty URL uses the displayed localhost default
func TestInteractive_EmptyURLUsesDefault(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 0, // Local
			"TLS/SSL setup":  0, // Caddy
		},
		Inputs: map[string]string{
			"Database password": "pass",
			"Confirm password":  "pass",
			"External URL":      "",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	// Empty input accepts the displayed public URL default.
	assert.Equal(t, "https://localhost", env["EXTERNAL_URL"])
	assert.Equal(t, "localhost", env["NGINX_HOST"])
}

// Test: --interactive flag works end-to-end through cobra
func TestSetupCmd_InteractiveFlagWorks(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	stubLocalPostgresHappy(r)
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 0, // Local
			"TLS/SSL setup":  3, // No TLS (avoids TLS step)
		},
		Inputs: map[string]string{
			"Database password": "testpass",
			"Confirm password":  "testpass",
			"External URL":      "",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--interactive"})
	err := cmd.Execute()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "testpass", env["DATABASE_PASSWORD"])
}

// Test: Re-run "start fresh" clears existing and runs full wizard
func TestInteractive_StartFresh(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"DATABASE_HOST":     "old-host.example.com",
		"DATABASE_PASSWORD": "old-pass",
		"JWT_SECRET":        "old-jwt",
		"API_KEY_SECRET":    "old-api",
	}
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"What would you like to do?": 2, // Start fresh
			"Database setup":             0, // Local
			"TLS/SSL setup":              3, // No TLS
		},
		Inputs: map[string]string{
			"Database password": "fresh-pass",
			"Confirm password":  "fresh-pass",
			"External URL":      "",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "localhost", env["DATABASE_HOST"], "start fresh uses defaults")
	assert.Equal(t, "fresh-pass", env["DATABASE_PASSWORD"], "start fresh uses new password")
	// Secrets should be newly generated (old ones cleared)
	assert.NotEqual(t, "old-jwt", env["JWT_SECRET"], "start fresh generates new JWT secret")
	assert.NotEqual(t, "old-api", env["API_KEY_SECRET"], "start fresh generates new API secret")
}

func TestInteractive_StartFreshPasswordDefaults(t *testing.T) {
	for _, tc := range []struct {
		name     string
		dbChoice int
		password string
	}{
		{"local Enter", 0, ""},
		{"external Enter", 1, ""},
		{"local explicit flag", 0, "explicit-pass"},
		{"external explicit flag", 1, "explicit-pass"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, out, _ := newTestSetupRunner()
			r.Env.(*FakeEnvManager).Env = map[string]string{
				"DATABASE_HOST":     "old-host.example.com",
				"DATABASE_PASSWORD": "old-pass",
				"JWT_SECRET":        "old-jwt",
				"API_KEY_SECRET":    "old-api",
			}
			r.Prompter = &FakePrompter{
				IsTTY: true,
				Selects: map[string]int{
					"What would you like to do?": 2,
					"Database setup":             tc.dbChoice,
					"TLS/SSL setup":              3,
				},
			}
			db := &recordingDBConnector{}
			r.DB = db
			cmd := NewSetupCmd(r)
			args := []string{"--interactive", "--reconfigure"}
			if tc.password != "" {
				args = append(args, "--db-password="+tc.password)
			}
			cmd.SetArgs(args)
			require.NoError(t, cmd.Execute())

			env := r.Env.(*FakeEnvManager).Env
			if tc.password == "" {
				assert.NotEmpty(t, env["DATABASE_PASSWORD"])
				assert.NotEqual(t, "old-pass", env["DATABASE_PASSWORD"])
				assert.Contains(t, out.String(), "DATABASE_PASSWORD auto-generated")
			} else {
				assert.Equal(t, tc.password, env["DATABASE_PASSWORD"])
				assert.NotContains(t, out.String(), "DATABASE_PASSWORD auto-generated")
			}
			assert.NotEqual(t, "old-jwt", env["JWT_SECRET"])
			assert.NotEqual(t, "old-api", env["API_KEY_SECRET"])
			assert.Zero(t, db.connections)
		})
	}
}

func TestWriteConfig_AdminPasswordPreserved(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"ADMIN_PASSWORD": "existing-admin-pass",
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "existing-admin-pass", env["ADMIN_PASSWORD"],
		"ADMIN_PASSWORD should be preserved when present in existing env")
}

func TestWriteConfig_AdminPasswordAbsent(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	_, hasAdminPassword := env["ADMIN_PASSWORD"]
	assert.False(t, hasAdminPassword,
		"ADMIN_PASSWORD should NOT be written when not in existing env")
}

func TestWriteConfig_PreservesPortAndJWTExpire(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"PORT":            "8080",
		"JWT_EXPIRE_TIME": "7d",
	}

	err := r.stepConfigure()
	require.NoError(t, err)

	env := r.Env.(*FakeEnvManager).Env
	assert.Equal(t, "8080", env["PORT"], "existing PORT should be preserved")
	assert.Equal(t, "7d", env["JWT_EXPIRE_TIME"], "existing JWT_EXPIRE_TIME should be preserved")
}

func TestSetupCmd_DryRun_ShowsBYOCert(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.DryRun = true
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{
		"--dry-run", "--non-interactive",
		"--tls-cert", "/path/to/cert.pem",
		"--tls-key", "/path/to/key.pem",
	})
	err := cmd.Execute()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "Cert: /path/to/cert.pem")
	assert.Contains(t, output, "Key: /path/to/key.pem")
}

func TestSetupCmd_DryRun_AutoGeneratePasswordMessage(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.DryRun = true
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--dry-run", "--non-interactive"})
	err := cmd.Execute()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "would auto-generate")
}

func TestSetupCmd_PrintSummary_SkipDB(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.SkipDB = true
	r.printSummary(true)
	output := out.String()
	assert.Contains(t, output, "skip (--skip-db)")
}

func TestSetupCmd_PrintSummary_ExternalDB(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.printSummary(false)
	output := out.String()
	assert.Contains(t, output, "skip (external database)")
}

func TestSetupCmd_PrintSummary_LocalDB(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.printSummary(true)
	output := out.String()
	assert.Contains(t, output, "PostgreSQL bootstrap: run")
	assert.Contains(t, output, "Database migrations:  run")
}

func TestSetupCmd_PrintSummary_SkipTLS(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.SkipTLS = true
	r.printSummary(true)
	output := out.String()
	assert.Contains(t, output, "skip (--skip-tls)")
}

func TestSetupCmd_PrintSummary_RunTLS(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.ProxyMode = "bundled"
	r.printSummary(true)
	output := out.String()
	assert.Contains(t, output, "TLS reverse proxy:    run")
}

func TestRestore_ConfirmationAccepted(t *testing.T) {
	p, fs, e := recoveryFixture(t, false)
	r := recoveryRestore(p, fs, e)
	r.Prompter = &FakePrompter{Confirms: map[string]bool{"Restore will overwrite current config and database. Continue?": true}, IsTTY: true}
	err := r.Run(oldRecoveryArchive(t, "PORT=3000\n", false))
	assert.NoError(t, err)
	assert.Contains(t, r.Out.(*bytes.Buffer).String(), "Config:   restored")
}

// --- Connectivity validation tests ---

func TestInteractive_ExternalDB_ConnectivityTestPasses(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Interactive = true
	r.DB.(*FakeDBConnector).ConnErr = nil // connection succeeds
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 1, // External
			"TLS/SSL setup":  3, // No TLS
		},
		Inputs: map[string]string{
			"Database host":     "db.example.com",
			"Database port":     "5432",
			"Database user":     "postgres",
			"Database password": "pass123",
			"Confirm password":  "pass123",
			"Database name":     "heimdall",
			"External URL":      "",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.Run()
	require.NoError(t, err)
	assert.Contains(t, out.String(), "Connected to db.example.com:5432/heimdall")
}

func TestInteractive_ExternalDB_ConnectivityTestFails(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Interactive = true
	r.DB.(*FakeDBConnector).ConnErr = fmt.Errorf("connection refused")
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup":                        1, // External
			"TLS/SSL setup":                         3, // No TLS
			"Connection failed. What would you do?": 1, // Continue anyway
		},
		Inputs: map[string]string{
			"Database host":     "db.example.com",
			"Database port":     "5432",
			"Database user":     "postgres",
			"Database password": "pass123",
			"Confirm password":  "pass123",
			"Database name":     "heimdall",
			"External URL":      "",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.Run()
	require.ErrorContains(t, err, "connection refused")
	assert.NotContains(t, out.String(), "\nDatabase migrations")
}

func TestInteractive_ExternalDB_ReconfigureSkipsConnection(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.DB.(*FakeDBConnector).ConnErr = fmt.Errorf("connection refused")
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup":                        1, // External
			"Connection failed. What would you do?": 0, // Abort
		},
		Inputs: map[string]string{
			"Database host":     "db.example.com",
			"Database port":     "5432",
			"Database user":     "postgres",
			"Database password": "pass123",
			"Confirm password":  "pass123",
			"Database name":     "heimdall",
		},
		IsTTY: true,
	}

	r.Reconfigure = true
	require.NoError(t, r.Run())
}

func TestInteractive_LocalDB_SkipsConnectivityTest(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Interactive = true
	r.Prompter = &FakePrompter{
		Selects: map[string]int{
			"Database setup": 0, // Local
			"TLS/SSL setup":  3, // No TLS
		},
		Inputs: map[string]string{
			"Database password": "pass",
			"Confirm password":  "pass",
			"External URL":      "",
			"Admin email":       "admin@heimdall.local",
		},
		IsTTY: true,
	}

	err := r.stepConfigure()
	require.NoError(t, err)
	// Should NOT contain connectivity test output for local DB
	assert.NotContains(t, out.String(), "Testing connection")
}

// --- DryRun tests ---

func TestSetupCmd_DryRun_PrintsPlanWithoutExecuting(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.DryRun = true
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--dry-run", "--non-interactive", "--db-password", "testpass"})
	err := cmd.Execute()
	require.NoError(t, err)
	output := out.String()

	// Should show the plan
	assert.Contains(t, output, "DRY RUN")
	assert.NotContains(t, output, "=== Step ")
	assert.Contains(t, output, "Starting service")

	// Should NOT have actually written config or started the service
	exec := r.Exec.(*FakeExecRunner)
	for _, call := range exec.Calls {
		assert.NotEqual(t, "chown", call.Name, "chown should not be called in dry-run")
		assert.NotEqual(t, "chmod", call.Name, "chmod should not be called in dry-run")
	}
	systemd := r.Systemd.(*FakeSystemdRunner)
	assert.Empty(t, systemd.Actions, "no systemd actions should occur in dry-run")
}

func TestSetupCmd_DryRun_ShowsSkippedSteps(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.DryRun = true
	cmd := NewSetupCmd(r)
	cmd.SetArgs([]string{"--dry-run", "--non-interactive", "--skip-db", "--skip-tls"})
	err := cmd.Execute()
	require.NoError(t, err)
	output := out.String()
	assert.Contains(t, output, "DRY RUN")
	assert.Contains(t, output, "skipped")
}

func TestSetupRestartsAnExistingService(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env["DATABASE_PASSWORD"] = "existing"
	systemd := r.Systemd.(*FakeSystemdRunner)
	systemd.ActiveServices[ServiceName] = true
	require.NoError(t, r.stepStartService())
	require.Equal(t, []string{"enable:" + ServiceName, "restart:" + ServiceName}, systemd.Actions)
}

func TestSetupUsesExistingRemoteHost(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.DBHost = "localhost"
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"DATABASE_HOST": "db.example.test", "DATABASE_PASSWORD": "existing",
	}
	r.SkipTLS = true
	require.NoError(t, r.Run())
	require.Contains(t, out.String(), "skipped -- external database")
	require.Contains(t, out.String(), "Database host: db.example.test:")
	for _, call := range r.Exec.(*FakeExecRunner).Calls {
		if call.Name == "runuser" {
			require.Equal(t, []string{"-u", "heimdall", "--", "chmod", "0700", r.Paths.DataDir + "/backups"}, call.Args)
		}
	}
}

func TestSetupRejectsMissingServiceManager(t *testing.T) {
	for _, result := range []FakeExecResult{{ExitCode: 1}, {Err: errors.New("systemctl missing")}} {
		r, out, _ := newTestSetupRunner()
		r.Exec.(*FakeExecRunner).Results["systemctl show-environment"] = result
		require.ErrorContains(t, r.Run(), "running systemd service manager")
		require.Empty(t, r.Env.(*FakeEnvManager).Env)
		require.Empty(t, out.String())
		require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
		r.Reconfigure = true
		require.NoError(t, r.Run())
		require.NotEmpty(t, r.Env.(*FakeEnvManager).Env)
	}
}

func TestSetupRequiredServiceFailures(t *testing.T) {
	for _, service := range []string{ServiceName, "caddy"} {
		for _, failure := range []string{"enable", "restart", "is-active", "inactive"} {
			t.Run(service+"/"+failure, func(t *testing.T) {
				checkSetupRequiredServiceFailure(t, service, failure)
			})
		}
	}
}

func checkSetupRequiredServiceFailure(t *testing.T, service, failure string) {
	t.Helper()
	dir := t.TempDir()
	calls := filepath.Join(dir, "calls")
	require.NoError(t, os.WriteFile(filepath.Join(dir, "systemctl"), []byte(`#!/bin/sh
printf '%s\n' "$*" >> "$SYSTEMCTL_CALLS"
if [ "$1" = "$SYSTEMCTL_FAILURE" ]; then exit 1; fi
if [ "$1" = is-active ]; then
  if [ "$SYSTEMCTL_FAILURE" = inactive ]; then echo inactive; else echo active; fi
fi
`), 0755))
	t.Setenv("PATH", dir)
	t.Setenv("SYSTEMCTL_CALLS", calls)
	t.Setenv("SYSTEMCTL_FAILURE", failure)
	r, out, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env["DATABASE_PASSWORD"] = "existing"
	if service == "caddy" {
		r, out = newTLSTestRunner(map[string]string{"EXTERNAL_URL": "https://heimdall.internal"})
	}
	r.Systemd = &systemdRunner{binary: filepath.Join(dir, "systemctl")}
	var err error
	if service == "caddy" {
		err = r.stepTLS()
	} else {
		err = r.stepStartService()
	}
	require.Error(t, err)
	require.NotContains(t, out.String(), "enabled and running")
	require.NotContains(t, out.String(), "Service enabled and started")
	data, readErr := os.ReadFile(calls)
	require.NoError(t, readErr)
	want := "enable " + service + "\n"
	if failure != "enable" {
		want += "restart " + service + "\n"
	}
	if failure == "is-active" || failure == "inactive" {
		want += "is-active " + service + "\n"
	}
	if service == "caddy" {
		// Snapshot service state before staging; a failed activation restores it.
		want = "is-active caddy\nshow -p UnitFileState --value caddy\n" + want
		if failure == "restart" {
			want += "restart caddy\n"
		}
		if failure == "is-active" || failure == "inactive" {
			want = "is-active caddy\n"
		}
	}
	require.Equal(t, want, string(data))
}

type setupRPMChoice struct {
	name                              string
	saved                             map[string]string
	args                              []string
	database, proxy, host, port, user string
}

func TestSetupRPMChoicesAndDryRun(t *testing.T) {
	for _, tc := range []setupRPMChoice{
		{"fresh template", map[string]string{"DATABASE_HOST": "localhost", "DATABASE_PORT": "5432", "DATABASE_USERNAME": "postgres"}, nil, "bundled", "bundled", "127.0.0.1", "55432", "heimdall"},
		{"saved selection", map[string]string{"DATABASE_PASSWORD": "saved", "HEIMDALL_DATABASE_MODE": "bundled", "HEIMDALL_PROXY_MODE": "none", "DATABASE_HOST": "127.0.0.1", "DATABASE_PORT": "55433", "DATABASE_USERNAME": "app"}, nil, "bundled", "none", "127.0.0.1", "55433", "app"},
		{"legacy localhost", map[string]string{"DATABASE_PASSWORD": "saved", "DATABASE_HOST": "localhost"}, nil, "external", "external", "localhost", "5432", "postgres"},
		{"explicit defaults win", map[string]string{"DATABASE_PASSWORD": "saved", "HEIMDALL_DATABASE_MODE": "bundled", "HEIMDALL_PROXY_MODE": "bundled", "DATABASE_HOST": "db.internal", "DATABASE_PORT": "55432", "DATABASE_USERNAME": "app", "DATABASE_NAME": "custom"}, []string{"--database-mode=external", "--proxy-mode=external", "--db-host=localhost", "--db-port=5432", "--db-user=postgres", "--db-name=heimdall-server-production"}, "external", "external", "localhost", "5432", "postgres"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			for _, dry := range []bool{false, true} {
				checkSetupRPMChoice(t, tc, dry)
			}
		})
	}
}

func checkSetupRPMChoice(t *testing.T, tc setupRPMChoice, dry bool) {
	t.Helper()
	r, out, _ := newTestSetupRunner()
	fs := r.FS.(*FakeFileSystem)
	fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
	r.Env.(*FakeEnvManager).Env = tc.saved
	before, err := r.Env.ReadEnv()
	require.NoError(t, err)
	files := map[string][]byte{}
	for k, v := range fs.Files {
		files[k] = append([]byte(nil), v...)
	}
	cmd := NewSetupCmd(r)
	args := append([]string{"--non-interactive", "--reconfigure", "--skip-db", "--skip-tls"}, tc.args...)
	if dry {
		args = append(args, "--dry-run")
	}
	cmd.SetArgs(args)
	err = cmd.Execute()
	if !dry && before["HEIMDALL_PROXY_MODE"] != "" && before["HEIMDALL_PROXY_MODE"] != tc.proxy {
		require.ErrorContains(t, err, "full setup")
		require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
		require.Empty(t, r.Exec.(*FakeExecRunner).Calls)
		require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
		return
	}
	require.NoError(t, err)
	if dry {
		require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
		require.Equal(t, files, fs.Files)
		require.Empty(t, fs.Dirs)
		require.Empty(t, r.Exec.(*FakeExecRunner).Calls)
		require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
		require.Contains(t, out.String(), tc.host+":"+tc.port)
		require.Contains(t, out.String(), "Database mode: "+tc.database)
	} else {
		env := r.Env.(*FakeEnvManager).Env
		require.Equal(t, tc.database, env["HEIMDALL_DATABASE_MODE"])
		require.Equal(t, tc.proxy, env["HEIMDALL_PROXY_MODE"])
		require.Equal(t, tc.host, env["DATABASE_HOST"])
		require.Equal(t, tc.port, env["DATABASE_PORT"])
		require.Equal(t, tc.user, env["DATABASE_USERNAME"])
		if password, ok := before["DATABASE_PASSWORD"]; ok {
			require.Equal(t, password, env["DATABASE_PASSWORD"])
		}
	}
}

func TestSetupRPMInvalidModeAndURLConflictHaveNoSideEffects(t *testing.T) {
	for _, args := range [][]string{{"--database-mode=localhost"}, {"--db-host=other-host"}} {
		r, _, _ := newTestSetupRunner()
		r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
		r.Env.(*FakeEnvManager).Env = map[string]string{"DATABASE_URL": "postgres://app:secret@db.example:6432/prod", "DATABASE_PASSWORD": "secret"}
		before, _ := r.Env.ReadEnv()
		cmd := NewSetupCmd(r)
		cmd.SetArgs(append([]string{"--reconfigure"}, args...))
		require.Error(t, cmd.Execute())
		require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
		require.Empty(t, r.Exec.(*FakeExecRunner).Calls)
		require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
	}
}

func TestInteractiveRPMOwnershipAndRerun(t *testing.T) {
	for _, tc := range []struct {
		db, proxy         int
		dbMode, proxyMode string
	}{{0, 0, "bundled", "bundled"}, {0, 1, "bundled", "external"}, {1, 0, "external", "bundled"}, {1, 1, "external", "external"}} {
		t.Run(tc.dbMode+"/"+tc.proxyMode, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
			r.Interactive = true
			r.Reconfigure = true
			r.Prompter = &FakePrompter{IsTTY: true, Selects: map[string]int{"Database setup": tc.db, "TLS/SSL setup": tc.proxy}, Inputs: map[string]string{"Database host": "localhost", "Database port": "5432", "Database user": "externalapp", "Database password": "secret", "Confirm password": "secret"}}
			r.DB = &recordingDBConnector{}
			require.NoError(t, r.Run())
			env := r.Env.(*FakeEnvManager).Env
			require.Equal(t, tc.dbMode, env["HEIMDALL_DATABASE_MODE"])
			require.Equal(t, tc.proxyMode, env["HEIMDALL_PROXY_MODE"])
			require.False(t, r.SkipTLS, "selection is not a temporary skip")
			require.Zero(t, r.DB.(*recordingDBConnector).connections)
			if tc.db == 0 {
				require.Equal(t, "127.0.0.1", env["DATABASE_HOST"])
				require.Equal(t, "55432", env["DATABASE_PORT"])
			} else {
				require.Equal(t, "localhost", env["DATABASE_HOST"])
			}
			before, _ := r.Env.ReadEnv()
			// Enter on rerun must select saved ownership and endpoint defaults.
			r.Prompter = &FakePrompter{IsTTY: true}
			require.NoError(t, r.Run())
			require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
		})
	}
}

type recordingDBConnector struct{ connections int }

func (d *recordingDBConnector) TestConnection(string, int, string, string, string) error {
	d.connections++
	return nil
}
func (d *recordingDBConnector) TableCount(string, int, string, string, string) (int, error) {
	return 7, nil
}

func TestInteractiveReconfigureDefersConnection(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Interactive = true
	r.Reconfigure = true
	r.Prompter = &FakePrompter{IsTTY: true, Selects: map[string]int{"Database setup": 1, "TLS/SSL setup": 1}, Inputs: map[string]string{"Database host": "localhost"}}
	db := &recordingDBConnector{}
	r.DB = db
	require.NoError(t, r.Run())
	require.Zero(t, db.connections)
}

func TestSetupRPMExternalLocalhostTestsAndMigratesWithoutAdministeringServices(t *testing.T) {
	r, out, _ := newTestSetupRunner()
	r.Exec.(*FakeExecRunner).Results[r.Paths.RuntimePath("postgresql", "bin", "psql")+" -X"] = FakeExecResult{Stdout: "180006"}
	fs := r.FS.(*FakeFileSystem)
	fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
	fs.Files[r.Paths.RuntimePath("postgresql", "bin", "psql")] = nil
	r.Env.(*FakeEnvManager).Env = map[string]string{"DATABASE_HOST": "localhost", "DATABASE_PORT": "5432", "DATABASE_USERNAME": "app", "DATABASE_NAME": "prod", "DATABASE_PASSWORD": "saved", "HEIMDALL_DATABASE_MODE": "external", "HEIMDALL_PROXY_MODE": "external", "PORT": "4000"}
	db := &recordingDBConnector{}
	r.DB = db
	require.NoError(t, r.Run())
	require.Equal(t, 1, db.connections)
	require.Contains(t, out.String(), "Backend address: http://127.0.0.1:4000")
	migrations := 0
	for _, call := range r.Exec.(*FakeExecRunner).Calls {
		if call.Name == "heimdall-server-db-setup" {
			migrations++
		}
		if call.Name == "runuser" {
			require.Equal(t, []string{"-u", "heimdall", "--", "chmod", "0700", r.Paths.DataDir + "/backups"}, call.Args)
		}
		require.NotEqual(t, "caddy", call.Name)
	}
	require.Equal(t, 1, migrations)
	out.Reset()
	r.DryRun = true
	require.NoError(t, r.Run())
	require.Contains(t, out.String(), "Backend address: http://127.0.0.1:4000")
	for _, action := range r.Systemd.(*FakeSystemdRunner).Actions {
		require.NotContains(t, action, "postgres")
		require.NotContains(t, action, "caddy")
	}
}

func TestSetupRPMTLSSelection(t *testing.T) {
	for _, tc := range []struct {
		name  string
		saved map[string]string
		args  []string
		want  string
	}{
		{"public", nil, []string{"--external-url=https://heimdall.example.com"}, "acme"},
		{"offline", nil, nil, "internal"},
		{"custom flag wins", map[string]string{"HEIMDALL_TLS_MODE": "internal"}, []string{"--tls-cert=/cert.pem", "--tls-key=/key.pem"}, "custom"},
		{"saved cert", map[string]string{"HEIMDALL_TLS_MODE": "custom", "HEIMDALL_TLS_CERT": "/saved-cert.pem", "HEIMDALL_TLS_KEY": "/saved-key.pem"}, nil, "custom"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
			r.Env.(*FakeEnvManager).Env = tc.saved
			cmd := NewSetupCmd(r)
			cmd.SetArgs(append([]string{"--reconfigure"}, tc.args...))
			require.NoError(t, cmd.Execute())
			env := r.Env.(*FakeEnvManager).Env
			require.Equal(t, tc.want, env["HEIMDALL_TLS_MODE"])
			if tc.want == "custom" {
				require.NotEmpty(t, env["HEIMDALL_TLS_CERT"])
				require.NotEmpty(t, env["HEIMDALL_TLS_KEY"])
			}
		})
	}
}

func TestInteractiveRPMResolvedPasswordDefaults(t *testing.T) {
	for _, tc := range []struct {
		name, mode string
		saved      map[string]string
		args       []string
		want       string
	}{
		{"URL-only Enter rerun", "external", map[string]string{"DATABASE_URL": "postgres://app:secret@db.example:6432/prod"}, nil, "secret"},
		{"external explicit flag", "external", map[string]string{"DATABASE_PASSWORD": "old"}, []string{"--db-password=explicit"}, "explicit"},
		{"bundled explicit flag", "bundled", map[string]string{"DATABASE_PASSWORD": "old"}, []string{"--db-password=explicit"}, "explicit"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			r.FS.(*FakeFileSystem).Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
			saved := tc.saved
			saved["JWT_SECRET"] = "saved-jwt"
			saved["API_KEY_SECRET"] = "saved-api"
			saved["HEIMDALL_DATABASE_MODE"] = tc.mode
			saved["HEIMDALL_PROXY_MODE"] = "external"
			r.Env.(*FakeEnvManager).Env = saved
			r.Prompter = &FakePrompter{IsTTY: true}
			db := &recordingDBConnector{}
			r.DB = db
			cmd := NewSetupCmd(r)
			cmd.SetArgs(append([]string{"--interactive", "--reconfigure"}, tc.args...))
			require.NoError(t, cmd.Execute())
			env := r.Env.(*FakeEnvManager).Env
			require.Equal(t, tc.want, env["DATABASE_PASSWORD"])
			require.Equal(t, "saved-jwt", env["JWT_SECRET"])
			require.Equal(t, "saved-api", env["API_KEY_SECRET"])
			if saved["DATABASE_URL"] != "" {
				require.Equal(t, saved["DATABASE_URL"], env["DATABASE_URL"])
				require.Equal(t, "db.example", env["DATABASE_HOST"])
				require.Equal(t, "6432", env["DATABASE_PORT"])
				require.Equal(t, "app", env["DATABASE_USERNAME"])
				require.Equal(t, "prod", env["DATABASE_NAME"])
			}
			require.Zero(t, db.connections)
		})
	}
}

func bundledSetupFixture(t *testing.T) *SetupRunner {
	t.Helper()
	r, _, _ := newTestSetupRunner()
	fs := r.FS.(*FakeFileSystem)
	fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{}`)
	for _, tool := range []string{"psql", "postgres", "initdb", "pg_isready"} {
		fs.Files[r.Paths.RuntimePath("postgresql", "bin", tool)] = nil
	}
	fs.Files[r.Paths.RuntimePath("caddy", "caddy")] = nil
	fs.Files["/var/lib/heimdall-postgresql/18/data/PG_VERSION"] = []byte("18\n")
	fs.Files["/var/lib/heimdall-postgresql/18/data/postgresql.conf"] = []byte("# retain\n")
	fs.Files["/var/lib/heimdall-postgresql/18/data/pg_hba.conf"] = []byte("local all all peer\nhost all all 127.0.0.1/32 scram-sha-256\n")
	r.Exec.(*FakeExecRunner).Results["runuser -u heimdall-postgres"] = FakeExecResult{Stdout: "SCRAM-SHA-256$hash"}
	r.Exec.(*FakeExecRunner).Results[r.Paths.RuntimePath("postgresql", "bin", "psql")+" -X"] = FakeExecResult{Stdout: "180006"}
	r.Env.(*FakeEnvManager).Env = map[string]string{"DATABASE_HOST": "127.0.0.1", "DATABASE_PORT": "55432", "DATABASE_USERNAME": "heimdall", "DATABASE_PASSWORD": "keep-password", "DATABASE_NAME": "prod", "HEIMDALL_DATABASE_MODE": "bundled", "HEIMDALL_PROXY_MODE": "bundled", "HEIMDALL_TLS_MODE": "internal", "EXTERNAL_URL": "https://heimdall.example.test", "PORT": "3210", "JWT_SECRET": "keep-jwt", "API_KEY_SECRET": "keep-api"}
	return r
}

func TestBundledSetupPreflightPreservesConfiguration(t *testing.T) {
	for _, kind := range []string{"major", "occupied", "external connection", "external major", "caddy validation"} {
		t.Run(kind, func(t *testing.T) {
			r := bundledSetupFixture(t)
			before, _ := r.Env.ReadEnv()
			fs := r.FS.(*FakeFileSystem)
			exec := r.Exec.(*FakeExecRunner)
			r.ExternalURL = "https://changed.example.test"
			switch kind {
			case "major":
				fs.Files["/var/lib/heimdall-postgresql/18/data/PG_VERSION"] = []byte("17")
			case "occupied":
				exec.Results["ss -H -ltnp sport = :55432"] = FakeExecResult{Stdout: `LISTEN 0 100 127.0.0.1:55432 0.0.0.0:* users:(("other",pid=123,fd=1))`}
			case "external connection":
				r.DatabaseMode = "external"
				r.DB = &FakeDBConnector{ConnErr: fmt.Errorf("unavailable")}
			case "external major":
				r.DatabaseMode = "external"
				exec.Results[r.Paths.RuntimePath("postgresql", "bin", "psql")+" -X"] = FakeExecResult{Stdout: "190001"}
			case "caddy validation":
				exec.Results["runuser -u heimdall-caddy"] = FakeExecResult{ExitCode: 1}
			}
			require.Error(t, r.Run())
			require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
			require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
			for _, call := range exec.Calls {
				require.False(t, call.Name == "systemctl" && len(call.Args) > 0 && call.Args[0] == "disable")
				require.NotEqual(t, "heimdall-server-db-setup", call.Name)
			}
		})
	}
}

func TestBundledSetupPrivateServicesAndDependency(t *testing.T) {
	r := bundledSetupFixture(t)
	require.NoError(t, r.Run())
	fs := r.FS.(*FakeFileSystem)
	require.Equal(t, "[Unit]\nRequires=heimdall-postgresql.service\nAfter=heimdall-postgresql.service\n", string(fs.Files["/etc/systemd/system/heimdall-server.service.d/database.conf"]))
	require.Contains(t, string(fs.Files[r.Paths.ConfigDir+"/caddy/Caddyfile"]), "127.0.0.1:3210")
	require.Contains(t, r.Systemd.(*FakeSystemdRunner).Actions, "start:heimdall-caddy")
	for _, call := range r.Exec.(*FakeExecRunner).Calls {
		for _, arg := range call.Args {
			require.NotContains(t, arg, "/etc/caddy")
			require.NotContains(t, arg, "/usr/pgsql-")
		}
	}
}

func TestBundledSetupTransitionsAndMigrationFailure(t *testing.T) {
	for _, target := range []string{"external", "bundled", "migration failure"} {
		t.Run(target, func(t *testing.T) {
			checkBundledSetupTransition(t, target)
		})
	}
}

func checkBundledSetupTransition(t *testing.T, target string) {
	t.Helper()
	r := bundledSetupFixture(t)
	fs := r.FS.(*FakeFileSystem)
	sd := r.Systemd.(*FakeSystemdRunner)
	exec := r.Exec.(*FakeExecRunner)
	fs.Files[databaseDependency] = []byte(databaseDependencyContent)
	fs.Files[r.Paths.ConfigDir+"/caddy/Caddyfile"] = []byte("keep old config\n")
	fs.Files["/var/lib/heimdall-caddy/data/caddy/pki/authorities/local/root.crt"] = []byte("keep CA")
	sd.ActiveServices[bundledPGService], sd.ActiveServices[bundledCaddyService] = true, true
	if target == "bundled" {
		r.Env.(*FakeEnvManager).Env["HEIMDALL_DATABASE_MODE"] = "external"
		r.Env.(*FakeEnvManager).Env["HEIMDALL_PROXY_MODE"] = "external"
		r.DatabaseMode = "bundled"
		r.ProxyMode = "bundled"
		delete(fs.Files, databaseDependency)
	} else {
		r.DatabaseMode = "external"
		r.ProxyMode = "external"
		r.DBHost, r.DBPort = "db.external.test", 5432
		r.flagChanged = map[string]bool{"db-host": true, "db-port": true}
	}
	if target == "migration failure" {
		exec.Results["heimdall-server-db-setup"] = FakeExecResult{ExitCode: 1}
	}
	before, _ := r.Env.ReadEnv()
	err := r.Run()
	if target == "migration failure" {
		require.Error(t, err)
		require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
		require.NotContains(t, sd.Actions, "restart:"+ServiceName)
	} else {
		require.NoError(t, err)
	}
	disabled := []string{}
	for _, c := range exec.Calls {
		if c.Name == "systemctl" && len(c.Args) == 3 && c.Args[0] == "disable" {
			disabled = append(disabled, c.Args[2])
		}
	}
	if target == "external" {
		require.ElementsMatch(t, []string{bundledPGService, bundledCaddyService}, disabled)
		require.NotContains(t, fs.Files, databaseDependency)
	} else {
		require.Empty(t, disabled)
	}
	require.Equal(t, "keep CA", string(fs.Files["/var/lib/heimdall-caddy/data/caddy/pki/authorities/local/root.crt"]))
}

func TestBundledSetupFailedPortChangeRestoresPostgresConfig(t *testing.T) {
	r := bundledSetupFixture(t)
	fs := r.FS.(*FakeFileSystem)
	sd := r.Systemd.(*FakeSystemdRunner)
	fs.Files[bundledPGData+"/heimdall.conf"] = []byte("port = 55432\n")
	sd.ActiveServices[bundledPGService] = true
	r.DBPort = 55555
	r.flagChanged = map[string]bool{"db-port": true}
	r.Exec.(*FakeExecRunner).Results["heimdall-server-db-setup"] = FakeExecResult{ExitCode: 1}
	require.Error(t, r.Run())
	require.Equal(t, "55432", r.Env.(*FakeEnvManager).Env["DATABASE_PORT"])
	require.Equal(t, "port = 55432\n", string(fs.Files[bundledPGData+"/heimdall.conf"]))
}

func TestBundledSetupInvalidExternalProxyKeepsOwnedService(t *testing.T) {
	r := bundledSetupFixture(t)
	r.ProxyMode = "external"
	r.ExternalURL = "file:///invalid"
	r.SkipDB = true
	before, _ := r.Env.ReadEnv()
	require.Error(t, r.Run())
	require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
	require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
}

func TestBundledFailedTransitionKeepsPreviouslyStoppedUnitsStopped(t *testing.T) {
	r := bundledSetupFixture(t)
	r.DatabaseMode = "external"
	r.ProxyMode = "external"
	sd := r.Systemd.(*FakeSystemdRunner)
	sd.Properties[bundledPGService+":UnitFileState"] = "enabled"
	sd.Properties[bundledCaddyService+":UnitFileState"] = "enabled"
	r.Systemd = &portFailureSystemd{FakeSystemdRunner: sd, failure: "restart"}
	require.Error(t, r.Run())
	require.False(t, sd.ActiveServices[bundledPGService])
	require.False(t, sd.ActiveServices[bundledCaddyService])
}

func TestBundledFailedSetupRestoresPreviousRolePassword(t *testing.T) {
	r := bundledSetupFixture(t)
	r.DBPassword = "new-password"
	r.flagChanged = map[string]bool{"db-password": true}
	sd := r.Systemd.(*FakeSystemdRunner)
	sd.ActiveServices[bundledPGService] = true
	exec := r.Exec.(*FakeExecRunner)
	exec.Results["heimdall-server-db-setup"] = FakeExecResult{ExitCode: 1}
	require.Error(t, r.Run())
	passwords := []string{}
	for _, call := range exec.Calls {
		if strings.Contains(call.Stdin, "CREATE ROLE %I LOGIN PASSWORD %L") {
			passwords = append(passwords, call.Stdin)
			require.NotContains(t, strings.Join(call.Args, " "), "password")
		}
	}
	require.Len(t, passwords, 2)
	require.Contains(t, passwords[0], "'new-password'")
	require.Contains(t, passwords[1], "'keep-password'")
}

func TestBundledSetupSkipTLSRejectsProxyOwnershipChanges(t *testing.T) {
	for _, previous := range []string{"bundled", "nginx", "external", "none"} {
		t.Run(previous, func(t *testing.T) {
			r := bundledSetupFixture(t)
			env := r.Env.(*FakeEnvManager)
			env.Env["HEIMDALL_PROXY_MODE"] = previous
			if previous == "nginx" {
				env.Env["HEIMDALL_TLS_MODE"] = "self-signed"
			}
			before, _ := env.ReadEnv()
			r.ProxyMode = "external"
			if previous == "external" {
				r.ProxyMode = "none"
			}
			r.SkipTLS = true
			err := r.Run()
			require.ErrorContains(t, err, "proxy ownership changes require full setup")
			var cliErr *CLIError
			require.ErrorAs(t, err, &cliErr)
			require.Contains(t, cliErr.Suggestion, "--skip-tls")
			require.Equal(t, before, env.Env)
			require.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
		})
	}
}

type externalEndpointCase struct {
	name, host, address, pid string
	proxy, fail              bool
}

func TestBundledExternalTransitionEndpointIndependence(t *testing.T) {
	for _, tc := range []externalEndpointCase{
		{"private database", "127.0.0.1", "127.0.0.1", "123", false, true},
		{"private localhost database", "localhost", "127.0.0.1", "123", false, true},
		{"private wildcard database", "127.0.0.1", "0.0.0.0", "123", false, true},
		{"operator localhost database", "localhost", "127.0.0.1", "456", false, false},
		{"other loopback database", "127.0.0.2", "127.0.0.1", "123", false, false},
		{"private HTTPS proxy", "127.0.0.1", "127.0.0.1", "123", true, true},
		{"operator localhost proxy", "localhost", "127.0.0.1", "456", true, false},
		{"remote load balancer same URL", "heimdall.example.test", "0.0.0.0", "123", true, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			checkBundledExternalEndpoint(t, tc)
		})
	}
}

func checkBundledExternalEndpoint(t *testing.T, tc externalEndpointCase) {
	t.Helper()
	r := bundledSetupFixture(t)
	fs := r.FS.(*FakeFileSystem)
	sd := r.Systemd.(*FakeSystemdRunner)
	exec := r.Exec.(*FakeExecRunner)
	unit, port := bundledPGService, 55432
	if tc.proxy {
		unit, port = bundledCaddyService, 443
		r.ProxyMode = "external"
		r.SkipDB = true
		r.ExternalURL = "https://" + tc.host
	} else {
		r.DatabaseMode = "external"
		r.SkipTLS = true
		r.DBHost = tc.host
		r.flagChanged = map[string]bool{"db-host": true}
	}
	sd.ActiveServices[unit] = true
	sd.Properties[unit+":MainPID"] = "123"
	exec.Results[fmt.Sprintf("ss -H -ltnp sport = :%d", port)] = FakeExecResult{Stdout: fmt.Sprintf("LISTEN 0 100 %s:%d 0.0.0.0:* users:((\"listener\",pid=%s,fd=1))", tc.address, port, tc.pid)}
	// The same port can have an independent listener on another loopback address.
	if tc.name == "other loopback database" {
		result := exec.Results["ss -H -ltnp sport = :55432"]
		result.Stdout += "\nLISTEN 0 100 127.0.0.2:55432 0.0.0.0:* users:((\"other\",pid=456,fd=1))"
		exec.Results["ss -H -ltnp sport = :55432"] = result
	}
	before, _ := r.Env.ReadEnv()
	files := map[string]string{}
	for path, data := range fs.Files {
		files[path] = string(data)
	}
	err := r.Run()
	if tc.fail {
		require.ErrorContains(t, err, "still served by "+unit)
		require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
		require.Empty(t, sd.Actions)
		require.Empty(t, fs.Dirs)
		after := map[string]string{}
		for path, data := range fs.Files {
			after[path] = string(data)
		}
		require.Equal(t, files, after)
		for _, call := range exec.Calls {
			require.True(t, call.Name == "ss" || (call.Name == "systemctl" && len(call.Args) == 1 && call.Args[0] == "show-environment"), "unexpected call before refusing dependent endpoint: %+v", call)
		}
		return
	}
	require.NoError(t, err)
	disabled := false
	for _, call := range exec.Calls {
		if call.Name == "systemctl" && strings.Join(call.Args, " ") == "disable --now "+unit {
			disabled = true
		}
	}
	require.True(t, disabled, "old private service should be deselected only after independent replacement validation")
}

func TestBundledExternalEndpointInspectionErrorsDoNotDisableServices(t *testing.T) {
	for _, tc := range []struct {
		name   string
		result FakeExecResult
	}{
		{"ss failure", FakeExecResult{ExitCode: 1}}, {"missing ss", FakeExecResult{Err: fmt.Errorf("not found")}},
		{"malformed", FakeExecResult{Stdout: "unexpected"}},
		{"unknown owner", FakeExecResult{Stdout: "LISTEN 0 100 127.0.0.1:55432 0.0.0.0:*"}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r := bundledSetupFixture(t)
			r.DatabaseMode = "external"
			r.SkipTLS = true
			sd := r.Systemd.(*FakeSystemdRunner)
			sd.ActiveServices[bundledPGService] = true
			sd.Properties[bundledPGService+":MainPID"] = "123"
			r.Exec.(*FakeExecRunner).Results["ss -H -ltnp sport = :55432"] = tc.result
			before, _ := r.Env.ReadEnv()
			require.Error(t, r.Run())
			require.Equal(t, before, r.Env.(*FakeEnvManager).Env)
			require.Empty(t, sd.Actions)
		})
	}
}
