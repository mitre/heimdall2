package cmd

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMigrationsUseResolvedPaths(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Paths.AppDir, r.Paths.LibExecDir = "/custom/app", "/custom/libexec"
	r.Env.(*FakeEnvManager).Path = "/custom/backend.env"
	require.NoError(t, r.stepMigrations())
	call := r.Exec.(*FakeExecRunner).Calls[0]
	assert.Equal(t, map[string]string{"HEIMDALL_ENV_FILE": "/custom/backend.env", "HEIMDALL_APP_DIR": "/custom/app", "HEIMDALL_LIBEXEC_DIR": "/custom/libexec"}, call.Env)
}

func TestConfigExternalURLRequiresManagedProxySetup(t *testing.T) {
	for _, mode := range []string{"bundled", "nginx", "external", "none"} {
		t.Run(mode, func(t *testing.T) {
			env := &FakeEnvManager{Env: map[string]string{"HEIMDALL_PROXY_MODE": mode, "EXTERNAL_URL": "https://old.example.test"}}
			r := &ConfigRunner{Env: env, Out: new(bytes.Buffer)}
			err := r.Set("EXTERNAL_URL", "https://new.example.test")
			if mode == "bundled" || mode == "nginx" {
				require.ErrorContains(t, err, "setup")
				assert.Equal(t, "https://old.example.test", env.Env["EXTERNAL_URL"])
			} else {
				require.NoError(t, err)
				assert.Equal(t, "https://new.example.test", env.Env["EXTERNAL_URL"])
			}
		})
	}
}

func TestNginxAllowsApplicationUploadLimits(t *testing.T) {
	config, err := renderPrivateNginx(map[string]string{"EXTERNAL_URL": "https://localhost", "HEIMDALL_TLS_MODE": "self-signed", "MAX_FILE_UPLOAD_SIZE": "1024"}, "/etc/heimdall-server/nginx")
	require.NoError(t, err)
	assert.Contains(t, config, "client_max_body_size 0;")
}

func TestPersistConfigurationChecksPermissions(t *testing.T) {
	for _, command := range []string{"chown", "chmod"} {
		t.Run(command, func(t *testing.T) {
			r, out, _ := newTestSetupRunner()
			key := command + " " + configFileOwner
			if command == "chmod" {
				key = "chmod 0640"
			}
			r.Exec.(*FakeExecRunner).Results[key] = FakeExecResult{ExitCode: 1, Stdout: "Permission denied"}
			require.ErrorContains(t, r.persistConfiguration(map[string]string{"PORT": "3456"}), "Permission denied")
			assert.NotContains(t, out.String(), "Configuration saved")
		})
	}
}

func TestStandaloneTLSValidationPreservesConfiguration(t *testing.T) {
	for _, failure := range []string{"hostname", "key", "validation"} {
		t.Run(failure, func(t *testing.T) {
			r, _ := newTLSTestRunner(map[string]string{"EXTERNAL_URL": "https://example.test"})
			fs := r.FS.(*FakeFileSystem)
			target := "/etc/caddy/Caddyfile.d/heimdall-server.caddy"
			fs.Files[target] = []byte("original active config\n")
			switch failure {
			case "hostname":
				r.ExternalURL = "https://bad%20host"
			case "key":
				r.TLSKey = "/bad path"
			case "validation":
				r.Exec.(*FakeExecRunner).Results["caddy validate"] = FakeExecResult{ExitCode: 1}
			}
			require.Error(t, r.stepTLS())
			assert.Equal(t, "original active config\n", string(fs.Files[target]))
			assert.Empty(t, r.Systemd.(*FakeSystemdRunner).Actions)
		})
	}
}

func TestStandaloneTLSHonorsInternalModeAndPort(t *testing.T) {
	for _, host := range []string{"heimdall.example.com", "[::1]"} {
		t.Run(host, func(t *testing.T) {
			r, _ := newTLSTestRunner(map[string]string{"EXTERNAL_URL": "https://" + host, "PORT": "3456"})
			r.TLSMode = "internal"
			require.NoError(t, r.stepTLS())
			calls := r.Exec.(*FakeExecRunner).Calls
			var commands []string
			for _, call := range calls {
				commands = append(commands, call.Name+" "+strings.Join(call.Args, " "))
			}
			joined := strings.Join(commands, "\n")
			assert.Contains(t, string(r.FS.(*FakeFileSystem).Files[standaloneCaddyfile]), "issuer internal")
			assert.Contains(t, string(r.FS.(*FakeFileSystem).Files[standaloneCaddyfile]), "127.0.0.1:3456")
			assert.Contains(t, joined, "caddy validate")
			assert.NotContains(t, joined, "openssl")
		})
	}
}

func TestStandaloneSetPortUpdatesProxyAndRollsBack(t *testing.T) {
	for _, failure := range []string{"none", "validate", "restart", "reload"} {
		t.Run(failure, func(t *testing.T) {
			r, ex, env, sd, _ := newSetPortRunner()
			r.FS, r.Paths = NewFakeFileSystem(), DefaultPaths()
			target := "/etc/caddy/Caddyfile.d/heimdall-server.caddy"
			original := "example.test {\n reverse_proxy 127.0.0.1:3000\n tls internal\n}\n"
			fs := r.FS.(*FakeFileSystem)
			fs.Files[target] = []byte(original)
			env.Env["HEIMDALL_PROXY_MODE"] = "bundled"
			env.Env["EXTERNAL_URL"] = "https://example.test"
			sd.ActiveServices["caddy"] = true
			r.Systemd = &portFailureSystemd{FakeSystemdRunner: sd, failure: failure}
			if failure == "validate" {
				ex.Results["caddy validate"] = FakeExecResult{ExitCode: 1}
			}
			err := r.Run("3456")
			if failure == "none" {
				require.NoError(t, err)
				assert.Contains(t, string(fs.Files[target]), "127.0.0.1:3456")
				assert.Contains(t, sd.Actions, "reload:caddy")
			} else {
				require.Error(t, err)
				assert.Equal(t, original, string(fs.Files[target]))
				assert.Equal(t, "3000", env.Env["PORT"])
			}
		})
	}
}

func TestSetupReconfigureRejectsPermissionFailures(t *testing.T) {
	for _, command := range []string{"chown root:heimdall", "chmod 0640"} {
		t.Run(command, func(t *testing.T) {
			r, out, _ := newTestSetupRunner()
			r.Exec.(*FakeExecRunner).Results[command] = FakeExecResult{ExitCode: 1, Stdout: "permission failure"}
			cmd := NewSetupCmd(r)
			cmd.SetArgs([]string{"--non-interactive", "--reconfigure"})
			require.ErrorContains(t, cmd.Execute(), "permission failure")
			assert.NotContains(t, out.String(), "Configuration saved")
		})
	}
}

func TestSetupProtectsBackupAndLogOwnership(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	require.NoError(t, r.stepSecurityPolicies())
	for _, call := range r.Exec.(*FakeExecRunner).Calls {
		if call.Name == "chown" {
			assert.NotContains(t, call.Args, "-R")
		}
		assert.NotContains(t, strings.Join(call.Args, " "), r.Paths.DataDir+"/backups")
	}
}

func TestSetupRejectsUntrustedProtectedLogDirectory(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	fs := r.FS.(*FakeFileSystem)
	fs.Dirs[r.Paths.LogDir] = true
	r.FS = &securityFS{FakeFileSystem: fs, badPath: r.Paths.LogDir, badMode: os.ModeDir | 0750, uid: 1000}
	require.ErrorContains(t, r.stepSecurityPolicies(), "root-owned")
	for _, call := range r.Exec.(*FakeExecRunner).Calls {
		if call.Name == "chown" {
			assert.NotContains(t, call.Args, r.Paths.LogDir)
		}
	}
}

func TestStandaloneTLSRestartFailureRestoresConfiguration(t *testing.T) {
	r, _ := newTLSTestRunner(map[string]string{"EXTERNAL_URL": "https://example.test"})
	fs := r.FS.(*FakeFileSystem)
	const original = "example.test { reverse_proxy 127.0.0.1:3000 }\n"
	fs.Files[standaloneCaddyfile] = []byte(original)
	sd := r.Systemd.(*FakeSystemdRunner)
	sd.ActiveServices["caddy"] = true
	r.Systemd = &portFailureSystemd{FakeSystemdRunner: sd, failure: "restart"}
	require.ErrorContains(t, r.stepTLS(), "restart failed")
	assert.Equal(t, original, string(fs.Files[standaloneCaddyfile]))
	assert.True(t, sd.ActiveServices["caddy"])
	assert.False(t, fs.Exists(standaloneCaddyfile+".pending"))
}

func TestConfigLegacyStandaloneURLRequiresSetup(t *testing.T) {
	fs := NewFakeFileSystem()
	fs.Files[standaloneCaddyfile] = []byte("existing managed configuration")
	env := &FakeEnvManager{Env: map[string]string{"EXTERNAL_URL": "https://old.example.test"}}
	r := &ConfigRunner{Env: env, Out: new(bytes.Buffer), Port: &SetPortRunner{FS: fs}}
	require.ErrorContains(t, r.Set("EXTERNAL_URL", "https://new.example.test"), "setup")
	assert.Equal(t, "https://old.example.test", env.Env["EXTERNAL_URL"])
}

func TestStandaloneSetupRestoresEnvironmentOnFailure(t *testing.T) {
	for _, failure := range []string{"validate", "restart", "security"} {
		t.Run(failure, func(t *testing.T) {
			r, _, _ := newTestSetupRunner()
			original := map[string]string{"PORT": "3000", "EXTERNAL_URL": "https://old.example.test", "DATABASE_HOST": "db.example.test", "DATABASE_PASSWORD": "saved", "HEIMDALL_DATABASE_MODE": "external", "HEIMDALL_PROXY_MODE": "bundled", "HEIMDALL_TLS_MODE": "internal"}
			r.Env.(*FakeEnvManager).Env = original
			fs := r.FS.(*FakeFileSystem)
			const previous = "https://old.example.test { reverse_proxy 127.0.0.1:3000 }\n"
			fs.Files[standaloneCaddyfile] = []byte(previous)
			fs.Files["/etc/caddy/Caddyfile"] = []byte("import /etc/caddy/Caddyfile.d/*.caddy\n")
			if failure == "validate" {
				r.Exec.(*FakeExecRunner).Results["caddy validate"] = FakeExecResult{ExitCode: 1}
			}
			if failure == "restart" {
				r.Systemd = &portFailureSystemd{FakeSystemdRunner: r.Systemd.(*FakeSystemdRunner), failure: "restart"}
			}
			if failure == "security" {
				r.Exec.(*FakeExecRunner).Results["chmod 0750 "+r.Paths.LogDir] = FakeExecResult{ExitCode: 1}
			}
			command := NewSetupCmd(r)
			command.SetArgs([]string{"--non-interactive", "--skip-db", "--port=3456", "--external-url=https://new.example.test"})
			require.Error(t, command.Execute())
			assert.Equal(t, original, r.Env.(*FakeEnvManager).Env)
			assert.Equal(t, previous, string(fs.Files[standaloneCaddyfile]))
		})
	}
}

func TestStandaloneTLSRestoresEnabledStateOnFailure(t *testing.T) {
	for _, state := range []string{"enabled", "disabled"} {
		t.Run(state, func(t *testing.T) {
			r, _ := newTLSTestRunner(map[string]string{"EXTERNAL_URL": "https://example.test"})
			sd := r.Systemd.(*FakeSystemdRunner)
			sd.Properties["caddy:UnitFileState"] = state
			r.Systemd = &portFailureSystemd{FakeSystemdRunner: sd, failure: "restart"}
			require.Error(t, r.stepTLS())
			disable := FakeExecCall{Name: "systemctl", Args: []string{"disable", "caddy"}}
			if state == "enabled" {
				assert.NotContains(t, r.Exec.(*FakeExecRunner).Calls, disable)
			} else {
				assert.Contains(t, r.Exec.(*FakeExecRunner).Calls, disable)
			}
		})
	}
}

func TestStandaloneTLSRendersIndependentlyOfBundledReference(t *testing.T) {
	const bundledReference = "{\n admin unix//run/heimdall-caddy/admin.sock\n}\nhttps://localhost {\n tls internal\n}\n"
	for _, mode := range []string{"internal", "acme", "custom"} {
		t.Run(mode, func(t *testing.T) {
			r, _ := newTLSTestRunner(map[string]string{"EXTERNAL_URL": "https://portal.example.com:8443", "PORT": "3456"})
			r.TLSMode = mode
			if mode == "custom" {
				r.TLSCert = "/etc/tls/cert.pem"
				r.TLSKey = "/etc/tls/key.pem"
				cert, key, err := selfSignedCertificate("portal.example.com", 7)
				require.NoError(t, err)
				r.FS.(*FakeFileSystem).Files[r.TLSCert] = cert
				r.FS.(*FakeFileSystem).Files[r.TLSKey] = key
			}
			fs := r.FS.(*FakeFileSystem)
			fs.Files[r.Paths.LibExecDir+"/heimdall-Caddyfile"] = []byte(bundledReference)
			require.NoError(t, r.stepTLS())
			config := string(fs.Files[standaloneCaddyfile])
			assert.Contains(t, config, "https://portal.example.com:8443 {")
			assert.Contains(t, config, "reverse_proxy 127.0.0.1:3456")
			assert.NotContains(t, config, "heimdall-caddy/admin.sock")
			assert.NotContains(t, config, "https://localhost")
			if mode == "internal" {
				assert.Contains(t, config, "issuer internal")
				assert.Contains(t, config, "lifetime 168h")
			}
			if mode == "acme" {
				assert.NotContains(t, config, "tls ")
			}
			if mode == "custom" {
				assert.Contains(t, config, `tls "/etc/tls/cert.pem" "/etc/tls/key.pem"`)
				assert.NotContains(t, config, "internal")
			}
		})
	}
}

func TestStandaloneSetupRestoresExactEnvironmentFile(t *testing.T) {
	directory, err := filepath.EvalSymlinks(t.TempDir())
	require.NoError(t, err)
	path := filepath.Join(directory, "backend.env")
	const original = "# Keep administrator comments and order\nPORT=3000\nEXTERNAL_URL=https://old.example.test\nDATABASE_HOST=db.example.test\nDATABASE_PASSWORD=saved\nHEIMDALL_DATABASE_MODE=external\nHEIMDALL_PROXY_MODE=external\nHEIMDALL_TLS_MODE=internal\n"
	require.NoError(t, os.WriteFile(path, []byte(original), 0600))
	r, _, _ := newTestSetupRunner()
	r.Env = &FileEnvManager{Path: path}
	r.FS = &osFileSystem{}
	r.Paths.AppDir = directory
	r.Exec.(*FakeExecRunner).Results["heimdall-server-db-setup"] = FakeExecResult{ExitCode: 1}
	r.Exec = &setupPermissionExec{FakeExecRunner: r.Exec.(*FakeExecRunner), path: path}
	command := NewSetupCmd(r)
	command.SetArgs([]string{"--non-interactive", "--skip-tls", "--port=3456", "--external-url=https://new.example.test"})
	require.ErrorContains(t, command.Execute(), "migrations")
	restored, err := os.ReadFile(path)
	require.NoError(t, err)
	assert.Equal(t, original, string(restored))
	info, err := os.Stat(path)
	require.NoError(t, err)
	assert.Equal(t, os.FileMode(0600), info.Mode().Perm())
}

type setupPermissionExec struct {
	*FakeExecRunner
	path string
}

func (e *setupPermissionExec) Run(name string, args ...string) (string, int, error) {
	if name == "chmod" && len(args) == 2 && args[1] == e.path {
		mode, err := strconv.ParseUint(args[0], 8, 32)
		if err != nil {
			return "", 1, err
		}
		return "", 0, os.Chmod(e.path, os.FileMode(mode))
	}
	return e.FakeExecRunner.Run(name, args...)
}

type setupStatusFailureSystemd struct {
	*FakeSystemdRunner
	env        EnvManager
	portAtStop string
}

func (s *setupStatusFailureSystemd) IsActive(unit string) (bool, error) {
	if unit == ServiceName && s.ActiveServices[unit] {
		return false, fmt.Errorf("service status unavailable")
	}
	return s.FakeSystemdRunner.IsActive(unit)
}

func (s *setupStatusFailureSystemd) Stop(unit string) error {
	if unit == ServiceName {
		env, _ := s.env.ReadEnv()
		s.portAtStop = env["PORT"]
	}
	return s.FakeSystemdRunner.Stop(unit)
}

func TestStandaloneSetupStopsAppBeforeRestoringEnvironment(t *testing.T) {
	r, _, _ := newTestSetupRunner()
	r.Env.(*FakeEnvManager).Env = map[string]string{
		"PORT": "3000", "DATABASE_PASSWORD": "saved", "HEIMDALL_DATABASE_MODE": "external", "HEIMDALL_PROXY_MODE": "none",
	}
	systemd := &setupStatusFailureSystemd{FakeSystemdRunner: r.Systemd.(*FakeSystemdRunner), env: r.Env}
	r.Systemd = systemd
	command := NewSetupCmd(r)
	command.SetArgs([]string{"--non-interactive", "--skip-db", "--skip-tls", "--port=3456"})
	require.ErrorContains(t, command.Execute(), "service status unavailable")
	assert.False(t, systemd.ActiveServices[ServiceName])
	assert.Equal(t, "3456", systemd.portAtStop, "stop the app before replacing its environment")
	assert.Equal(t, "3000", r.Env.(*FakeEnvManager).Env["PORT"])
}
