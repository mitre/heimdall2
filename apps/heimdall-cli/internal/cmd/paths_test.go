package cmd

import (
	"strings"
	"testing"

	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
)

func TestDefaultPaths_MatchFHS(t *testing.T) {
	// Verify compile-time defaults are FHS-correct
	assert.Equal(t, "/etc/heimdall-server/backend.env", EnvFile)
	assert.Equal(t, "/usr/share/heimdall-server", AppDir)
	assert.Equal(t, "/var/lib/heimdall-server", DataDir)
	assert.Equal(t, "/usr/libexec/heimdall-server", LibExecDir)
	assert.Equal(t, "/etc/pki/heimdall-server", CertDir)
}

func TestViperDefaults_RegisteredOnInit(t *testing.T) {
	// Create a fresh root command (which registers Viper defaults)
	v := viper.New()
	registerPathDefaults(v)

	assert.Equal(t, AppDir, v.GetString("app-dir"))
	assert.Equal(t, DataDir, v.GetString("data-dir"))
	assert.Equal(t, LibExecDir, v.GetString("libexec-dir"))
	assert.Equal(t, CertDir, v.GetString("cert-dir"))
	assert.Equal(t, EnvFile, v.GetString("env-file"))
	assert.Equal(t, "/etc/heimdall-server", v.GetString("config-dir"))
	assert.Equal(t, "/var/log/heimdall-server", v.GetString("log-dir"))
}

func TestViperDefaults_EnvOverridesDefault(t *testing.T) {
	v := viper.New()
	v.SetEnvPrefix("HEIMDALL")
	v.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))
	v.AutomaticEnv()
	registerPathDefaults(v)

	t.Setenv("HEIMDALL_APP_DIR", "/custom/app")
	assert.Equal(t, "/custom/app", v.GetString("app-dir"))
}

// --- Paths struct tests ---

func TestDefaultPaths_AllAbsolute(t *testing.T) {
	p := DefaultPaths()
	assert.Equal(t, "/usr/share/heimdall-server", p.AppDir)
	assert.Equal(t, "/var/lib/heimdall-server", p.DataDir)
	assert.Equal(t, "/usr/libexec/heimdall-server", p.LibExecDir)
	assert.Equal(t, "/etc/heimdall-server", p.ConfigDir)
	assert.Equal(t, "/etc/pki/heimdall-server", p.CertDir)
	assert.Equal(t, "/var/log/heimdall-server", p.LogDir)
	assert.Equal(t, "/etc/heimdall-server/backend.env", p.EnvFile)
}

func TestNewPathsFromViper_ReadsAllKeys(t *testing.T) {
	v := viper.New()
	v.Set("app-dir", "/custom/app")
	v.Set("data-dir", "/custom/data")
	v.Set("libexec-dir", "/custom/libexec")
	v.Set("config-dir", "/custom/config")
	v.Set("cert-dir", "/custom/certs")
	v.Set("log-dir", "/custom/logs")
	v.Set("env-file", "/custom/config/backend.env")

	p := NewPathsFromViper(v)
	assert.Equal(t, "/custom/app", p.AppDir)
	assert.Equal(t, "/custom/data", p.DataDir)
	assert.Equal(t, "/custom/libexec", p.LibExecDir)
	assert.Equal(t, "/custom/config", p.ConfigDir)
	assert.Equal(t, "/custom/certs", p.CertDir)
	assert.Equal(t, "/custom/logs", p.LogDir)
	assert.Equal(t, "/custom/config/backend.env", p.EnvFile)
}

func TestNewPathsFromViper_FallsBackToDefaults(t *testing.T) {
	v := viper.New()
	registerPathDefaults(v)

	p := NewPathsFromViper(v)
	defaults := DefaultPaths()
	assert.Equal(t, defaults, p)
}
