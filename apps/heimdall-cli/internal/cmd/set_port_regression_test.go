package cmd

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSetPortRestoresExactStandaloneEnvOnFailure(t *testing.T) {
	for _, mode := range []string{"", "none", "external"} {
		for _, portLine := range []string{"", "PORT=\"3000\" # keep this comment\n"} {
			t.Run(mode+"/"+portLine, func(t *testing.T) {
				dir, err := filepath.EvalSymlinks(t.TempDir())
				require.NoError(t, err)
				r, _, _, sd, _ := newSetPortRunner()
				r.Paths = Paths{AppDir: filepath.Join(dir, "app"), ConfigDir: dir, EnvFile: filepath.Join(dir, "backend.env")}
				r.FS = &osFileSystem{}
				r.Env = &FileEnvManager{Path: r.Paths.EnvFile}
				r.Systemd = &portFailureSystemd{FakeSystemdRunner: sd, failure: "restart"}
				original := "# Existing configuration\nHEIMDALL_PROXY_MODE=" + mode + "\n" + portLine
				require.NoError(t, os.WriteFile(r.Paths.EnvFile, []byte(original), 0600))
				require.ErrorContains(t, r.Run("4567"), "failed to restart service")
				restored, err := os.ReadFile(r.Paths.EnvFile)
				require.NoError(t, err)
				require.Equal(t, original, string(restored))
				info, err := os.Stat(r.Paths.EnvFile)
				require.NoError(t, err)
				require.Equal(t, os.FileMode(0600), info.Mode().Perm())
			})
		}
	}
}

func TestSetPortRejectsInactiveBackendBeforeProxyUpdate(t *testing.T) {
	setup := bundledSetupFixture(t)
	fs := setup.FS.(*FakeFileSystem)
	proxyConfig := setup.Paths.ConfigDir + "/caddy/Caddyfile"
	fs.Files[proxyConfig] = []byte("old proxy config\n")
	sd := &inactivePortSystemd{FakeSystemdRunner: setup.Systemd.(*FakeSystemdRunner)}
	sd.ActiveServices[bundledCaddyService] = true
	r := &SetPortRunner{FS: fs, Paths: setup.Paths, Exec: setup.Exec, Env: setup.Env, Systemd: sd, Out: setup.Out}
	err := r.Run("4567")
	require.ErrorContains(t, err, "service is not active")
	require.Equal(t, "3210", setup.Env.(*FakeEnvManager).Env["PORT"])
	require.Equal(t, "old proxy config\n", string(fs.Files[proxyConfig]))
	require.NotContains(t, sd.Actions, "reload:"+bundledCaddyService)
	require.NotContains(t, setup.Out.(*bytes.Buffer).String(), "Done. Heimdall now listening")
}

func TestSetPortPreservesStandaloneEnvSymlink(t *testing.T) {
	for _, failure := range []string{"restart", "none"} {
		t.Run(failure, func(t *testing.T) {
			dir, err := filepath.EvalSymlinks(t.TempDir())
			require.NoError(t, err)
			r, _, _, sd, _ := newSetPortRunner()
			r.Paths = Paths{AppDir: filepath.Join(dir, "app"), ConfigDir: dir, EnvFile: filepath.Join(dir, "backend.env")}
			r.FS = &osFileSystem{}
			r.Env = &FileEnvManager{Path: r.Paths.EnvFile}
			r.Systemd = &portFailureSystemd{FakeSystemdRunner: sd, failure: failure}
			target := filepath.Join(dir, "backend-real.env")
			const original = "# Existing configuration\nHEIMDALL_PROXY_MODE=external\n"
			require.NoError(t, os.WriteFile(target, []byte(original), 0600))
			require.NoError(t, os.Symlink(filepath.Base(target), r.Paths.EnvFile))
			err = r.Run("4567")
			if failure == "restart" {
				require.ErrorContains(t, err, "failed to restart service")
			} else {
				require.NoError(t, err)
			}
			data, err := os.ReadFile(target)
			require.NoError(t, err)
			if failure == "restart" {
				require.Equal(t, original, string(data))
			} else {
				require.Equal(t, "4567", ParseEnv(string(data))["PORT"])
			}
			link, err := os.Readlink(r.Paths.EnvFile)
			require.NoError(t, err)
			require.Equal(t, filepath.Base(target), link)
			info, err := os.Stat(target)
			require.NoError(t, err)
			require.Equal(t, os.FileMode(0600), info.Mode().Perm())
		})
	}
}

type inactivePortSystemd struct {
	*FakeSystemdRunner
	restarted bool
}

func (s *inactivePortSystemd) Restart(unit string) error {
	err := s.FakeSystemdRunner.Restart(unit)
	if unit == ServiceName && !s.restarted {
		s.restarted = true
		s.ActiveServices[unit] = false
	}
	return err
}
