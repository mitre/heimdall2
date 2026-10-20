package cmd

import (
	"archive/tar"
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNginxStatusReportsSelectedService(t *testing.T) {
	for _, asJSON := range []bool{false, true} {
		r, out := newTestStatusRunner()
		r.JSON = asJSON
		env := r.Env.(*FakeEnvManager).Env
		env["HEIMDALL_DATABASE_MODE"], env["HEIMDALL_PROXY_MODE"], env["HEIMDALL_TLS_MODE"] = "external", "nginx", "self-signed"
		env["EXTERNAL_URL"] = "https://heimdall.example.test"
		fs := r.FS.(*FakeFileSystem)
		fs.Files[r.Paths.AppDir+"/runtime-manifest.json"] = []byte(`{"runtimes":{"nginx":{"version":"1.28.3"}}}`)
		fs.Files[r.Paths.RuntimePath("postgresql", "bin", "psql")] = nil
		r.Systemd.(*FakeSystemdRunner).ActiveServices["heimdall-nginx"] = true
		require.NoError(t, r.Run())
		if asJSON {
			var report struct {
				Services map[string]bool   `json:"managed_services"`
				Runtimes map[string]string `json:"runtimes"`
			}
			require.NoError(t, json.Unmarshal(out.Bytes(), &report))
			require.Equal(t, map[string]bool{"heimdall-nginx": true}, report.Services)
			require.Equal(t, "1.28.3", report.Runtimes["nginx"])
		} else {
			require.Contains(t, out.String(), "Bundled nginx: 1.28.3")
			require.Contains(t, out.String(), "heimdall-nginx running: true")
		}
		require.NotContains(t, out.String(), "heimdall-caddy")
	}
}

func TestNginxDiagnosticsReportsSelectedService(t *testing.T) {
	r, sd, _, out := newServiceRunner()
	r.Env.(*FakeEnvManager).Env["HEIMDALL_PROXY_MODE"] = "nginx"
	sd.ActiveServices["heimdall-nginx"] = true
	require.NoError(t, r.Diag())
	require.Contains(t, out.String(), "heimdall-nginx running: true (journalctl -u heimdall-nginx)")
	require.NotContains(t, out.String(), "heimdall-caddy")
}

func TestNginxSELinuxRegistersHTTPS(t *testing.T) {
	r := &SetupRunner{ProxyMode: "nginx", DatabaseMode: "external"}
	ports, err := r.selectedSELinuxPorts(map[string]string{"PORT": "3210", "EXTERNAL_URL": "https://heimdall.example.test"})
	require.NoError(t, err)
	require.Equal(t, []selinuxPort{{"heimdall_server_port_t", "3210"}, {"http_port_t", "443"}}, ports)
}

func TestNginxRecoveryRoundTrip(t *testing.T) {
	p, fs, e := recoveryFixture(t, true)
	originalEnv := []byte("DATABASE_PASSWORD=secret\nHEIMDALL_DATABASE_MODE=external\nHEIMDALL_PROXY_MODE=nginx\nHEIMDALL_TLS_MODE=self-signed\n")
	require.NoError(t, os.WriteFile(p.EnvFile, originalEnv, 0640))
	originals := map[string]string{"nginx.conf": "proxy_pass http://127.0.0.1:3210;", "certs/server.crt": "original certificate", "certs/server.key": "original private key"}
	for path, content := range originals {
		target := filepath.Join(p.ConfigDir, "nginx", path)
		require.NoError(t, os.MkdirAll(filepath.Dir(target), 0750))
		require.NoError(t, os.WriteFile(target, []byte(content), 0640))
	}
	out := new(bytes.Buffer)
	backup := &BackupRunner{Paths: p, FS: fs, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
	require.NoError(t, backup.Run(filepath.Dir(p.ConfigDir)))
	archives, err := filepath.Glob(filepath.Join(filepath.Dir(p.ConfigDir), "heimdall-backup-*.tar.gz"))
	require.NoError(t, err)
	require.Len(t, archives, 1)
	for path := range originals {
		require.NoError(t, os.WriteFile(filepath.Join(p.ConfigDir, "nginx", path), []byte("replaced"), 0666))
	}
	require.NoError(t, recoveryRestore(p, fs, e).Run(archives[0]))
	for path, expected := range originals {
		target := filepath.Join(p.ConfigDir, "nginx", path)
		content, err := os.ReadFile(target)
		require.NoError(t, err)
		require.Equal(t, expected, string(content))
		info, err := os.Stat(target)
		require.NoError(t, err)
		require.Equal(t, os.FileMode(0640), info.Mode().Perm())
	}
	require.Equal(t, recoverySQLHeaders+"-- sentinel SQL\n", e.sql)
	var stops []string
	var nginxOwner bool
	for _, call := range e.calls {
		if call.Name == "systemctl" {
			stops = append(stops, strings.Join(call.Args, " "))
		}
		if call.Name == "chown" && call.Args[0] == "root:heimdall-nginx" {
			nginxOwner = true
		}
	}
	require.Equal(t, []string{"stop heimdall-server", "stop heimdall-nginx"}, stops)
	require.True(t, nginxOwner)
}

func TestNginxBackupRejectsUnsafeSources(t *testing.T) {
	for _, kind := range []string{"symlink", "hardlink"} {
		t.Run(kind, func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			outside := filepath.Join(filepath.Dir(p.ConfigDir), "outside")
			require.NoError(t, os.WriteFile(outside, []byte("outside secret"), 0600))
			require.NoError(t, os.MkdirAll(p.ConfigDir+"/nginx/certs", 0750))
			target := p.ConfigDir + "/nginx/certs/server.key"
			if kind == "symlink" {
				require.NoError(t, os.Symlink(outside, target))
			} else {
				require.NoError(t, os.Link(outside, target))
			}
			r := &BackupRunner{Paths: p, FS: fs, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: new(bytes.Buffer), ErrOut: new(bytes.Buffer)}
			require.Error(t, r.Run(filepath.Dir(p.ConfigDir)))
			require.Empty(t, e.calls)
		})
	}
}

func TestNginxRestoreRejectsLinksBeforeMutation(t *testing.T) {
	for _, kind := range []byte{tar.TypeSymlink, tar.TypeLink} {
		p, fs, e := recoveryFixture(t, true)
		archive := recoveryArchive(t, []*tar.Header{{Name: "backup/backend.env", Mode: 0640, Typeflag: tar.TypeReg}, {Name: "backup/nginx-config/certs/server.key", Typeflag: kind, Linkname: "/etc/shadow"}}, []string{"PORT=3210\n", ""})
		require.Error(t, recoveryRestore(p, fs, e).Run(archive))
		require.Empty(t, e.calls)
	}
}

func TestNginxSetPortRollbackAndConfigDelegation(t *testing.T) {
	for _, failure := range []string{"validate", "restart", "reload", "none"} {
		t.Run(failure, func(t *testing.T) {
			setup := bundledSetupFixture(t)
			env := setup.Env.(*FakeEnvManager).Env
			env["HEIMDALL_PROXY_MODE"], env["HEIMDALL_TLS_MODE"] = "nginx", "self-signed"
			fs := setup.FS.(*FakeFileSystem)
			fs.Files[setup.Paths.RuntimePath("nginx", "sbin", "nginx")] = nil
			fs.Files[setup.Paths.ConfigDir+"/nginx/nginx.conf"] = []byte("old config\n")
			sd := &portFailureSystemd{FakeSystemdRunner: setup.Systemd.(*FakeSystemdRunner), failure: failure}
			sd.ActiveServices["heimdall-nginx"] = true
			exec := setup.Exec.(*FakeExecRunner)
			if failure == "validate" {
				exec.Results["setpriv --reuid=heimdall-nginx --regid=heimdall-nginx --init-groups --inh-caps=-all,+net_bind_service --ambient-caps=-all,+net_bind_service --bounding-set=-all,+net_bind_service -- "+setup.Paths.RuntimePath("nginx", "sbin", "nginx")+" -t -c "+setup.Paths.ConfigDir+"/nginx/nginx.conf.pending"] = FakeExecResult{ExitCode: 1}
			}
			port := &SetPortRunner{Exec: exec, Env: setup.Env, Systemd: sd, FS: fs, Paths: setup.Paths, Out: setup.Out}
			cfg := &ConfigRunner{Env: setup.Env, Out: setup.Out, Port: port}
			err := cfg.Set("PORT", "4567")
			if failure == "none" {
				require.NoError(t, err)
				require.Equal(t, "4567", env["PORT"])
				require.Contains(t, string(fs.Files[setup.Paths.ConfigDir+"/nginx/nginx.conf"]), "127.0.0.1:4567")
				require.Contains(t, sd.Actions, "reload:heimdall-nginx")
			} else {
				require.Error(t, err)
				require.Equal(t, "3210", setup.Env.(*FakeEnvManager).Env["PORT"])
				require.Equal(t, "old config\n", string(fs.Files[setup.Paths.ConfigDir+"/nginx/nginx.conf"]))
			}
			if failure == "validate" {
				require.Empty(t, sd.Actions)
			}
		})
	}
}
