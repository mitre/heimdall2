package cmd

import (
	"crypto/x509"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExtractDBConfig_AllDefaults(t *testing.T) {
	cfg := ExtractDBConfig(map[string]string{})

	assert.Equal(t, "localhost", cfg.Host)
	assert.Equal(t, DefaultDBPort, cfg.Port)
	assert.Equal(t, "postgres", cfg.User)
	assert.Equal(t, "", cfg.Password)
	assert.Equal(t, "heimdall-server-production", cfg.DBName)
}

func TestExtractDBConfig_CustomValues(t *testing.T) {
	env := map[string]string{
		"DATABASE_HOST":     "db.example.com",
		"DATABASE_PORT":     "5433",
		"DATABASE_USERNAME": "heimdall",
		"DATABASE_PASSWORD": "s3cret",
		"DATABASE_NAME":     "mydb",
	}
	cfg := ExtractDBConfig(env)

	assert.Equal(t, "db.example.com", cfg.Host)
	assert.Equal(t, 5433, cfg.Port)
	assert.Equal(t, "heimdall", cfg.User)
	assert.Equal(t, "s3cret", cfg.Password)
	assert.Equal(t, "mydb", cfg.DBName)
}

func TestExtractDBConfig_PartialOverrides(t *testing.T) {
	env := map[string]string{
		"DATABASE_HOST":     "remote-host",
		"DATABASE_PASSWORD": "pass",
	}
	cfg := ExtractDBConfig(env)

	assert.Equal(t, "remote-host", cfg.Host)
	assert.Equal(t, DefaultDBPort, cfg.Port, "port should default when not set")
	assert.Equal(t, "postgres", cfg.User, "user should default when not set")
	assert.Equal(t, "pass", cfg.Password)
	assert.Equal(t, "heimdall-server-production", cfg.DBName, "db name should default when not set")
}

func TestExtractDBConfig_InvalidPort_FallsBackToDefault(t *testing.T) {
	env := map[string]string{
		"DATABASE_PORT": "notanumber",
	}
	cfg := ExtractDBConfig(env)

	assert.Equal(t, DefaultDBPort, cfg.Port, "invalid port string should fall back to default")
}

func TestExtractDBConfig_EmptyPort_FallsBackToDefault(t *testing.T) {
	env := map[string]string{
		"DATABASE_PORT": "",
	}
	cfg := ExtractDBConfig(env)

	assert.Equal(t, DefaultDBPort, cfg.Port, "empty port should fall back to default")
}

func TestPortStr(t *testing.T) {
	tests := []struct {
		name string
		port int
		want string
	}{
		{"default port", 5432, "5432"},
		{"custom port", 5433, "5433"},
		{"port 1", 1, "1"},
		{"high port", 65535, "65535"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := DBConfig{Port: tt.port}
			assert.Equal(t, tt.want, cfg.PortStr())
		})
	}
}

func TestExtractDBConfig_NilMap(t *testing.T) {
	// nil map should not panic — envDefault handles it
	cfg := ExtractDBConfig(nil)
	assert.Equal(t, "localhost", cfg.Host)
	assert.Equal(t, DefaultDBPort, cfg.Port)
}

func TestResolveDBConfigURLAndTLS(t *testing.T) {
	cfg, err := resolveDBConfig(map[string]string{
		"DATABASE_URL": "postgres://app:secret@db.example:6432/prod?sslmode=require",
		"DATABASE_SSL": "true", "DATABASE_SSL_INSECURE": "false", "DATABASE_SSL_CA": "/certs/ca.pem", "DATABASE_SSL_CERT": "/certs/client.pem", "DATABASE_SSL_KEY": "/certs/key.pem",
	})
	require.NoError(t, err)
	require.Equal(t, "db.example", cfg.Host)
	require.Equal(t, 6432, cfg.Port)
	require.Equal(t, "app", cfg.User)
	require.Equal(t, "secret", cfg.Password)
	require.Equal(t, "prod", cfg.DBName)
	require.Equal(t, map[string]string{"PGPASSWORD": "secret", "PGSSLMODE": "verify-full", "PGSSLROOTCERT": "/certs/ca.pem", "PGSSLCERT": "/certs/client.pem", "PGSSLKEY": "/certs/key.pem"}, cfg.PgEnv())
	for _, env := range []map[string]string{
		{"DATABASE_URL": "not a postgres URL"},
		{"DATABASE_URL": "postgres://app:secret@db.example:6432/prod", "DATABASE_HOST": "other"},
		{"DATABASE_URL": "postgres://app:secret@db.example:6432/prod", "DATABASE_PASSWORD": "different"},
		{"DATABASE_PORT": "bad"},
	} {
		_, err := resolveDBConfig(env)
		require.Error(t, err)
		require.NotContains(t, err.Error(), "secret")
	}
	for _, tc := range []struct{ ssl, insecure, want string }{{"true", "true", "require"}, {"true", "false", "verify-full"}, {"false", "", "disable"}, {"", "", "disable"}} {
		cfg, err := resolveDBConfig(map[string]string{"DATABASE_SSL": tc.ssl, "DATABASE_SSL_INSECURE": tc.insecure})
		require.NoError(t, err)
		require.Equal(t, tc.want, cfg.PgEnv()["PGSSLMODE"])
	}
}

func TestResolveDBConfigMatchesApplicationURLLiteralComponents(t *testing.T) {
	cfg, err := resolveDBConfig(map[string]string{"DATABASE_URL": "postgres://app:p%40ss@db.example:6432/my%2Ddb"})
	require.NoError(t, err)
	require.Equal(t, "p%40ss", cfg.Password, "application URL parser retains percent escapes")
	require.Equal(t, "my%2Ddb", cfg.DBName)
}

func TestResolveDBConfigTLSTrustPolicy(t *testing.T) {
	for _, tc := range []struct{ name, ca, insecure, mode string }{
		{"verified system trust", "", "false", "verify-full"},
		{"verified explicit trust", "/custom/root.pem", "false", "verify-full"},
		{"insecure ignores explicit trust", "/custom/root.pem", "true", "require"},
		{"insecure ignores ambient trust", "", "true", "require"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			cfg, err := resolveDBConfig(map[string]string{"DATABASE_SSL": "true", "DATABASE_SSL_INSECURE": tc.insecure, "DATABASE_SSL_CA": tc.ca, "DATABASE_SSL_CERT": "/client.pem", "DATABASE_SSL_KEY": "/key.pem"})
			require.NoError(t, err)
			env := cfg.PgEnv()
			require.Equal(t, tc.mode, env["PGSSLMODE"])
			require.Equal(t, "/client.pem", env["PGSSLCERT"])
			require.Equal(t, "/key.pem", env["PGSSLKEY"])
			root := env["PGSSLROOTCERT"]
			if tc.insecure == "true" {
				require.Equal(t, "/dev/null/heimdall-no-root.crt", root)
				_, err := os.Stat(root)
				require.Error(t, err)
			} else if tc.ca != "" {
				require.Equal(t, tc.ca, root)
			} else {
				require.NotEmpty(t, root, "verified TLS needs an explicit trust source")
				require.NotEqual(t, "system", root, "libpq 13 needs a file path")
				roots, err := os.ReadFile(root)
				require.NoError(t, err)
				require.True(t, x509.NewCertPool().AppendCertsFromPEM(roots), "default trust source must contain CA certificates")
			}
		})
	}
}
