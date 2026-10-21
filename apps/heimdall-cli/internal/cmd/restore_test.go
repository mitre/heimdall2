package cmd

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"io"
	"math/big"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// Recovery uses real files and archives; only database and host administration
// are substituted. This catches extraction, path and permission mistakes.
type recoveryFS struct {
	osFileSystem
	state string
}

func (f *recoveryFS) path(p string) string {
	if strings.HasPrefix(p, "/var/lib/.heimdall-restore.") {
		return filepath.Dir(f.state) + strings.TrimPrefix(p, "/var/lib")
	}
	if p == "/var/lib/heimdall-caddy" || strings.HasPrefix(p, "/var/lib/heimdall-caddy/") {
		return f.state + strings.TrimPrefix(p, "/var/lib/heimdall-caddy")
	}
	return p
}
func (f *recoveryFS) EvalSymlinks(p string) (string, error) { return filepath.EvalSymlinks(f.path(p)) }
func (f *recoveryFS) ReadFile(p string) ([]byte, error)     { return os.ReadFile(f.path(p)) }
func (f *recoveryFS) WriteFile(p string, b []byte, m os.FileMode) error {
	return os.WriteFile(f.path(p), b, m)
}
func (f *recoveryFS) Stat(p string) (os.FileInfo, error) { return os.Stat(f.path(p)) }
func (f *recoveryFS) Lstat(p string) (os.FileInfo, error) {
	if p == "/var" || p == "/var/lib" {
		return os.Stat(filepath.Dir(f.state))
	}
	return os.Lstat(f.path(p))
}
func (f *recoveryFS) ReadDir(p string) ([]os.DirEntry, error) { return os.ReadDir(f.path(p)) }
func (f *recoveryFS) MkdirAll(p string, m os.FileMode) error  { return os.MkdirAll(f.path(p), m) }
func (f *recoveryFS) CopyFile(a, b string) error {
	return f.osFileSystem.CopyFile(f.path(a), f.path(b))
}
func (f *recoveryFS) Rename(a, b string) error { return os.Rename(f.path(a), f.path(b)) }
func (f *recoveryFS) RemoveAll(p string) error { return os.RemoveAll(f.path(p)) }
func (f *recoveryFS) Exists(p string) bool     { _, e := f.Stat(p); return e == nil }

type recoveryExec struct {
	fs           *recoveryFS
	calls        []FakeExecCall
	version      string
	dumpVersions map[string]string
	nonempty     string
	fail         string
	sql          string
}

func (e *recoveryExec) Run(name string, args ...string) (string, int, error) {
	e.calls = append(e.calls, FakeExecCall{Name: name, Args: args})
	key := strings.Join(append([]string{name}, args...), " ")
	if e.fail != "" && strings.Contains(key, e.fail) {
		return "fixture failure", 1, nil
	}
	switch name {
	case "mktemp":
		template := args[1]
		path, err := os.MkdirTemp(filepath.Dir(e.fs.path(template)), filepath.Base(template))
		if err != nil {
			return "", 1, err
		}
		return filepath.Join(filepath.Dir(template), filepath.Base(path)), 0, nil
	case "mkdir":
		return "", 0, os.Mkdir(args[2], 0700)
	case "tar":
		return (&execRunner{}).Run(name, args...)
	case "chmod":
		var mode uint32
		_, err := fmt.Sscanf(args[0], "%o", &mode)
		if err != nil {
			return "", 1, err
		}
		return "", 0, os.Chmod(e.fs.path(args[1]), os.FileMode(mode))
	case "chown", "systemctl", "getent":
		return "", 0, nil
	default:
		if filepath.Base(name) == "pg_dump" && len(args) == 1 && args[0] == "--version" {
			version := "18.6"
			if configured, ok := e.dumpVersions[name]; ok {
				version = configured
			}
			return "pg_dump (PostgreSQL) " + version, 0, nil
		}
		return "", 1, fmt.Errorf("unexpected command %s", key)
	}
}
func (e *recoveryExec) RunWithEnv(env map[string]string, name string, args ...string) (string, int, error) {
	if name == "tar" {
		if e.fail != "" && strings.Contains(strings.Join(append([]string{name}, args...), " "), e.fail) {
			return "fixture failure", 1, nil
		}
		return (&execRunner{}).RunWithEnv(env, name, args...)
	}
	e.calls = append(e.calls, FakeExecCall{Name: name, Args: args, Env: env})
	key := strings.Join(append([]string{name}, args...), " ")
	if e.fail != "" && strings.Contains(key, e.fail) {
		return "fixture failure", 1, nil
	}
	if strings.Contains(key, "SHOW server_version_num") {
		return e.version, 0, nil
	}
	if strings.Contains(key, "pg_catalog.pg_namespace") {
		if e.nonempty != "" {
			return e.nonempty, 0, nil
		}
		return "f", 0, nil
	}
	for i, arg := range args {
		if arg != "-f" {
			continue
		}
		if filepath.Base(name) == "pg_dump" {
			return e.writeDump(name, args[i+1])
		}
		data, err := os.ReadFile(args[i+1])
		e.sql = string(data)
		return "", 0, err
	}
	return "", 1, fmt.Errorf("unexpected database command %s", key)
}

func (e *recoveryExec) writeDump(name, path string) (string, int, error) {
	server, err := strconv.Atoi(e.version)
	if err != nil {
		return "", 1, err
	}
	version := "18.6"
	if configured, ok := e.dumpVersions[name]; ok {
		version = configured
	}
	sql := fmt.Sprintf("-- PostgreSQL database dump\n\n-- Dumped from database version %d.6\n-- Dumped by pg_dump version %s\n\n-- sentinel SQL\n", server/10000, version)
	return "", 0, os.WriteFile(path, []byte(sql), 0600)
}

func (e *recoveryExec) RunWithEnvAndStdin(map[string]string, string, string, ...string) (string, int, error) {
	return "", 1, fmt.Errorf("unexpected stdin command")
}

func (e *recoveryExec) RunWithStdin(string, string, ...string) (string, int, error) {
	return "", 1, fmt.Errorf("unexpected stdin command")
}

func recoveryFixture(t *testing.T, rpm bool) (Paths, *recoveryFS, *recoveryExec) {
	t.Helper()
	root, err := filepath.EvalSymlinks(t.TempDir())
	require.NoError(t, err)
	p := DefaultPaths()
	p.ConfigDir = root + "/etc"
	p.EnvFile = p.ConfigDir + "/backend.env"
	p.AppDir = root + "/app"
	p.LibExecDir = root + "/libexec"
	p.DataDir = root + "/data"
	fs := &recoveryFS{state: root + "/caddy-state"}
	for _, dir := range []string{p.ConfigDir, p.AppDir, p.RuntimePath("postgresql", "bin")} {
		require.NoError(t, os.MkdirAll(dir, 0700))
	}
	if rpm {
		require.NoError(t, os.WriteFile(p.AppDir+"/runtime-manifest.json", []byte("{}"), 0600))
	}
	for _, name := range []string{"psql", "pg_dump"} {
		require.NoError(t, os.WriteFile(p.RuntimePath("postgresql", "bin", name), nil, 0700))
	}
	require.NoError(t, os.WriteFile(p.EnvFile, []byte("DATABASE_PASSWORD='secret value'\nJWT_SECRET=original\nHEIMDALL_DATABASE_MODE=external\nHEIMDALL_PROXY_MODE=bundled\nHEIMDALL_TLS_MODE=internal\n"), 0640))
	return p, fs, &recoveryExec{fs: fs, version: "180006"}
}

func recoveryArchive(t *testing.T, headers []*tar.Header, data []string) string {
	t.Helper()
	root, err := filepath.EvalSymlinks(t.TempDir())
	require.NoError(t, err)
	filename := filepath.Join(root, "archive.tar.gz")
	f, err := os.Create(filename)
	require.NoError(t, err)
	gz := gzip.NewWriter(f)
	tw := tar.NewWriter(gz)
	for i, h := range headers {
		if h.Typeflag == tar.TypeReg || h.Typeflag == 0 {
			h.Size = int64(len(data[i]))
		}
		require.NoError(t, tw.WriteHeader(h))
		if h.Size > 0 {
			_, err = io.WriteString(tw, data[i])
			require.NoError(t, err)
		}
	}
	require.NoError(t, tw.Close())
	require.NoError(t, gz.Close())
	require.NoError(t, f.Close())
	return filename
}
func oldRecoveryArchive(t *testing.T, env string, sql bool) string {
	h := []*tar.Header{{Name: "heimdall-backup-old/backend.env", Mode: 0644, Typeflag: tar.TypeReg}}
	d := []string{env}
	if sql {
		h = append(h, &tar.Header{Name: "heimdall-backup-old/database.sql", Mode: 0644, Typeflag: tar.TypeReg})
		d = append(d, recoverySQLHeaders+"-- old SQL")
	}
	return recoveryArchive(t, h, d)
}

const recoverySQLHeaders = "-- PostgreSQL database dump\n\n-- Dumped from database version 18.6\n-- Dumped by pg_dump version 18.6\n\n"

func recoveryRestore(p Paths, fs *recoveryFS, e *recoveryExec) *RestoreRunner {
	return &RestoreRunner{Paths: p, FS: fs, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: new(bytes.Buffer), ErrOut: new(bytes.Buffer)}
}

func TestRecoveryArchiveRoundTrip(t *testing.T) {
	previousMask := syscall.Umask(0077)
	defer syscall.Umask(previousMask)
	p, fs, e := recoveryFixture(t, true)
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)
	certificate := &x509.Certificate{SerialNumber: big.NewInt(1), NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(time.Hour), IsCA: true, BasicConstraintsValid: true, KeyUsage: x509.KeyUsageCertSign}
	der, err := x509.CreateCertificate(rand.Reader, certificate, certificate, &key.PublicKey, key)
	require.NoError(t, err)
	keyDER, err := x509.MarshalECPrivateKey(key)
	require.NoError(t, err)
	ca := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})
	private := pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyDER})
	for path, content := range map[string][]byte{p.ConfigDir + "/caddy/Caddyfile": []byte("tls internal"), fs.state + "/data/caddy/pki/authorities/local/root.crt": ca, fs.state + "/data/caddy/pki/authorities/local/root.key": private} {
		require.NoError(t, os.MkdirAll(filepath.Dir(path), 0700))
		mode := os.FileMode(0600)
		if strings.HasSuffix(path, "Caddyfile") {
			mode = 0640
		}
		require.NoError(t, os.WriteFile(path, content, mode))
		require.NoError(t, os.Chmod(path, mode))
	}
	original, err := os.ReadFile(p.EnvFile)
	require.NoError(t, err)
	out := new(bytes.Buffer)
	b := &BackupRunner{Paths: p, FS: fs, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
	require.NoError(t, b.Run(filepath.Dir(p.ConfigDir)))
	archives, err := filepath.Glob(filepath.Join(filepath.Dir(p.ConfigDir), "heimdall-backup-*.tar.gz"))
	require.NoError(t, err)
	require.Len(t, archives, 1)
	info, err := os.Stat(archives[0])
	require.NoError(t, err)
	require.Equal(t, os.FileMode(0600), info.Mode().Perm())
	require.NoError(t, os.WriteFile(p.EnvFile, []byte("JWT_SECRET=replaced\nHEIMDALL_PROXY_MODE=bundled\n"), 0640))
	require.NoError(t, os.WriteFile(fs.state+"/data/caddy/pki/authorities/local/root.crt", []byte("different CA"), 0644))
	require.NoError(t, os.WriteFile(fs.state+"/data/caddy/pki/authorities/local/root.key", []byte("different key"), 0600))
	r := recoveryRestore(p, fs, e)
	require.NoError(t, r.Run(archives[0]))
	restored, err := os.ReadFile(p.EnvFile)
	require.NoError(t, err)
	require.Equal(t, original, restored)
	restored, err = os.ReadFile(fs.state + "/data/caddy/pki/authorities/local/root.crt")
	require.NoError(t, err)
	block, _ := pem.Decode(restored)
	require.NotNil(t, block)
	parsed, err := x509.ParseCertificate(block.Bytes)
	require.NoError(t, err)
	require.Equal(t, sha256.Sum256(der), sha256.Sum256(parsed.Raw))
	restored, err = os.ReadFile(fs.state + "/data/caddy/pki/authorities/local/root.key")
	require.NoError(t, err)
	require.Equal(t, private, restored)
	require.Equal(t, recoverySQLHeaders+"-- sentinel SQL\n", e.sql)
	for path, mode := range map[string]os.FileMode{p.EnvFile: 0640, p.ConfigDir + "/caddy/Caddyfile": 0640, p.ConfigDir + "/upgrade-pending": 0600, fs.state + "/data/caddy/pki/authorities/local/root.crt": 0600, fs.state + "/data/caddy/pki/authorities/local": 0700} {
		info, err := os.Stat(path)
		require.NoError(t, err)
		require.Equal(t, mode, info.Mode().Perm(), path)
	}
	var stops, owners []string
	for _, call := range e.calls {
		if call.Name == "systemctl" {
			require.Equal(t, "stop", call.Args[0])
			stops = append(stops, call.Args[1])
		}
		if call.Name == "chown" {
			owners = append(owners, call.Args[0])
		}
		require.NotContains(t, strings.Join(call.Args, " "), "/var/lib/heimdall-postgresql")
	}
	require.Equal(t, []string{"heimdall-server", "heimdall-caddy"}, stops)
	require.Contains(t, owners, "root:heimdall")
	require.Contains(t, owners, "root:heimdall-caddy")
	require.Contains(t, owners, "heimdall-caddy:heimdall-caddy")
	require.Contains(t, owners, "root:root")
	require.Contains(t, r.Out.(*bytes.Buffer).String(), "setup --non-interactive")
}

func TestRestoreRejectsUnsafeArchivesBeforeMutation(t *testing.T) {
	for _, tc := range []struct {
		name   string
		header tar.Header
	}{
		{"traversal", tar.Header{Name: "../escape", Typeflag: tar.TypeReg}},
		{"absolute", tar.Header{Name: "/etc/escape", Typeflag: tar.TypeReg}},
		{"nested traversal", tar.Header{Name: "backup/caddy-state/../../escape", Typeflag: tar.TypeReg}},
		{"symlink", tar.Header{Name: "backup/caddy-state/link", Typeflag: tar.TypeSymlink, Linkname: "/etc"}},
		{"hardlink", tar.Header{Name: "backup/caddy-state/key", Typeflag: tar.TypeLink, Linkname: "backend.env"}},
		{"device", tar.Header{Name: "backup/caddy-state/device", Typeflag: tar.TypeChar}},
		{"live cluster", tar.Header{Name: "backup/postgresql/data/PG_VERSION", Typeflag: tar.TypeReg}},
		{"duplicate", tar.Header{Name: "backup/backend.env", Typeflag: tar.TypeReg}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			original, err := os.ReadFile(p.EnvFile)
			require.NoError(t, err)
			archive := recoveryArchive(t, []*tar.Header{{Name: "backup/backend.env", Mode: 0600, Typeflag: tar.TypeReg}, &tc.header}, []string{"DATABASE_PASSWORD=secret\n", "evil"})
			require.Error(t, recoveryRestore(p, fs, e).Run(archive))
			got, err := os.ReadFile(p.EnvFile)
			require.NoError(t, err)
			require.Equal(t, original, got)
			require.Empty(t, e.calls)
			require.NoFileExists(t, p.ConfigDir+"/upgrade-pending")
		})
	}
}

func TestRestoreOldArchiveAndStandaloneConfigOnly(t *testing.T) {
	for _, rpm := range []bool{false, true} {
		t.Run(fmt.Sprint(rpm), func(t *testing.T) {
			p, fs, e := recoveryFixture(t, rpm)
			require.NoError(t, os.WriteFile(p.EnvFile, []byte("HEIMDALL_PROXY_MODE=external\n"), 0600))
			archive := oldRecoveryArchive(t, "DATABASE_PASSWORD=old\nHEIMDALL_PROXY_MODE=external\n", true)
			r := recoveryRestore(p, fs, e)
			require.NoError(t, r.Run(archive))
			require.Equal(t, recoverySQLHeaders+"-- old SQL", e.sql)
			for _, c := range e.calls {
				if c.Name == "systemctl" {
					require.Equal(t, []string{"stop", "heimdall-server"}, c.Args)
				}
			}
		})
	}
	p, fs, e := recoveryFixture(t, false)
	r := recoveryRestore(p, fs, e)
	require.NoError(t, r.Run(oldRecoveryArchive(t, "PORT=3000\n", false)))
	require.Empty(t, e.sql)
}

func TestRestoreRejectsIncompatibleDumpBeforeMutation(t *testing.T) {
	for _, sql := range []string{
		"-- Dumped from database version 14.19\n-- Dumped by pg_dump version 18.6\nSELECT 1;\n",
		"-- Dumped from database version 18.6\n-- Dumped by pg_dump version 14.19\nSELECT 1;\n",
		"-- no PostgreSQL version headers\nSELECT 1;\n",
	} {
		t.Run(strings.Split(sql, "\n")[0], func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			e.version = "140019"
			before, err := os.ReadFile(p.EnvFile)
			require.NoError(t, err)
			archive := recoveryArchive(t, []*tar.Header{
				{Name: "backup/backend.env", Mode: 0600, Typeflag: tar.TypeReg},
				{Name: "backup/database.sql", Mode: 0600, Typeflag: tar.TypeReg},
			}, []string{"DATABASE_PASSWORD=secret\n", sql})
			err = recoveryRestore(p, fs, e).Run(archive)
			require.Error(t, err)
			after, err := os.ReadFile(p.EnvFile)
			require.NoError(t, err)
			require.Equal(t, before, after)
			require.NoFileExists(t, p.ConfigDir+"/upgrade-pending")
			require.Empty(t, e.sql)
			for _, call := range e.calls {
				require.NotContains(t, []string{"systemctl", "chown", "chmod"}, call.Name)
			}
		})
	}
}

func TestRestoreLegacyRequiresEmptyDestinationBeforeMutation(t *testing.T) {
	p, fs, e := recoveryFixture(t, true)
	e.nonempty = "t"
	before, err := os.ReadFile(p.EnvFile)
	require.NoError(t, err)
	err = recoveryRestore(p, fs, e).Run(oldRecoveryArchive(t, "DATABASE_PASSWORD=old\n", true))
	require.ErrorContains(t, err, "empty destination")
	after, err := os.ReadFile(p.EnvFile)
	require.NoError(t, err)
	require.Equal(t, before, after)
	require.NoFileExists(t, p.ConfigDir+"/upgrade-pending")
	require.Empty(t, e.sql)
	for _, call := range e.calls {
		require.NotContains(t, []string{"systemctl", "chown", "chmod"}, call.Name)
	}
}

func TestRestoreRejectsRecoveryMarkerWithoutSQL(t *testing.T) {
	p, fs, e := recoveryFixture(t, true)
	archive := recoveryArchive(t, []*tar.Header{
		{Name: "backend.env", Mode: 0600, Typeflag: tar.TypeReg},
		{Name: "database.restore", Mode: 0600, Typeflag: tar.TypeReg},
	}, []string{"PORT=3000\n", "pg_dump-clean-v1\n"})
	require.ErrorContains(t, recoveryRestore(p, fs, e).Run(archive), "database.sql")
	require.Empty(t, e.calls)
	require.NoFileExists(t, p.ConfigDir+"/upgrade-pending")
}

func TestRestoreVersionAndCommandErrors(t *testing.T) {
	for _, tc := range []struct{ name, version, fail string }{
		{"old server", "120010", ""}, {"new server", "190000", ""}, {"malformed version", "broken", ""}, {"version query", "180006", "SHOW server_version_num"}, {"stop", "180006", "systemctl stop"}, {"owner", "180006", "chown root:heimdall"}, {"permissions", "180006", "chmod 0640"}, {"SQL", "180006", " -f "},
	} {
		t.Run(tc.name, func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			e.version = tc.version
			e.fail = tc.fail
			r := recoveryRestore(p, fs, e)
			require.Error(t, r.Run(oldRecoveryArchive(t, "DATABASE_PASSWORD=old\n", true)))
			require.NotContains(t, r.Out.(*bytes.Buffer).String(), "Database: restored")
			if strings.Contains(tc.name, "server") || strings.Contains(tc.name, "version") {
				require.NoFileExists(t, p.ConfigDir+"/upgrade-pending")
			}
		})
	}
}

func TestRestoreLegacyConfigOnlyRPMRequiresSetup(t *testing.T) {
	p, fs, e := recoveryFixture(t, true)
	r := recoveryRestore(p, fs, e)
	require.NoError(t, r.Run(oldRecoveryArchive(t, "PORT=3000\nJWT_SECRET=legacy\n", false)))
	require.Empty(t, e.sql)
	require.FileExists(t, p.ConfigDir+"/upgrade-pending")
	require.Contains(t, r.Out.(*bytes.Buffer).String(), "configuration only")
	var actions []string
	for _, call := range e.calls {
		require.NotEqual(t, "psql", filepath.Base(call.Name))
		if call.Name == "systemctl" {
			actions = append(actions, strings.Join(call.Args, " "))
		}
	}
	require.Equal(t, []string{"stop heimdall-server", "disable --now heimdall-caddy"}, actions)
}

func TestRestoreRejectsUnsafeDestinationsBeforeMutation(t *testing.T) {
	for _, kind := range []string{"env symlink", "env hardlink", "Caddy ancestor symlink", "Caddy file hardlink", "marker symlink"} {
		t.Run(kind, func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			outside := filepath.Join(filepath.Dir(p.ConfigDir), "outside")
			require.NoError(t, os.WriteFile(outside, []byte("unchanged"), 0600))
			switch kind {
			case "env symlink":
				require.NoError(t, os.Remove(p.EnvFile))
				require.NoError(t, os.Symlink(outside, p.EnvFile))
			case "env hardlink":
				require.NoError(t, os.Remove(p.EnvFile))
				require.NoError(t, os.Link(outside, p.EnvFile))
			case "marker symlink":
				require.NoError(t, os.Symlink(outside, p.ConfigDir+"/upgrade-pending"))
			case "Caddy ancestor symlink":
				require.NoError(t, os.Symlink(filepath.Dir(p.ConfigDir), p.ConfigDir+"/caddy"))
			case "Caddy file hardlink":
				require.NoError(t, os.Mkdir(p.ConfigDir+"/caddy", 0700))
				require.NoError(t, os.Link(outside, p.ConfigDir+"/caddy/Caddyfile"))
			}
			archive := recoveryArchive(t, []*tar.Header{{Name: "backup/backend.env", Mode: 0640, Typeflag: tar.TypeReg}, {Name: "backup/caddy-config/Caddyfile", Mode: 0640, Typeflag: tar.TypeReg}}, []string{"PORT=3000\n", "tls internal"})
			require.Error(t, recoveryRestore(p, fs, e).Run(archive))
			require.Empty(t, e.calls)
			data, err := os.ReadFile(outside)
			require.NoError(t, err)
			require.Equal(t, "unchanged", string(data))
		})
	}
}

func TestRestoreMissingCorruptAndConfirmation(t *testing.T) {
	p, fs, e := recoveryFixture(t, false)
	r := recoveryRestore(p, fs, e)
	require.ErrorContains(t, r.Run(p.ConfigDir+"/missing.tar.gz"), "file not found")
	corrupt := p.ConfigDir + "/corrupt.tar.gz"
	require.NoError(t, os.WriteFile(corrupt, []byte("broken"), 0600))
	require.ErrorContains(t, r.Run(corrupt), "failed to extract")
	archive := oldRecoveryArchive(t, "PORT=3000\n", false)
	r.Prompter = &FakePrompter{IsTTY: true, Confirms: map[string]bool{"Restore will overwrite current config and database. Continue?": false}}
	require.NoError(t, r.Run(archive))
	require.Contains(t, r.Out.(*bytes.Buffer).String(), "cancelled")
	r.Prompter = &FakePrompter{IsTTY: true, Err: fmt.Errorf("interrupted")}
	require.ErrorContains(t, r.Run(archive), "interrupted")
	r.CheckRoot = func() error { return fmt.Errorf("not root") }
	require.ErrorContains(t, r.Run(archive), "not root")
	require.Empty(t, e.calls)
}

type privateRecoveryCopyFS struct {
	*recoveryFS
	env string
}

func (f *privateRecoveryCopyFS) CopyFile(src, dest string) error {
	if dest == f.env {
		info, err := os.Stat(dest)
		if err != nil {
			return err
		}
		if info.Mode().Perm()&0007 != 0 {
			return fmt.Errorf("refusing to expose restored secrets through existing public file")
		}
	}
	return f.recoveryFS.CopyFile(src, dest)
}
func TestRestoreSecuresExistingEnvBeforeCopy(t *testing.T) {
	p, fs, e := recoveryFixture(t, true)
	require.NoError(t, os.Chmod(p.EnvFile, 0644))
	r := recoveryRestore(p, fs, e)
	r.FS = &privateRecoveryCopyFS{recoveryFS: fs, env: p.EnvFile}
	require.NoError(t, r.Run(oldRecoveryArchive(t, "JWT_SECRET=restored\n", false)))
}

type recoverySwapOnStop struct {
	*recoveryExec
	swap    func() error
	swapped bool
}

func (e *recoverySwapOnStop) Run(name string, args ...string) (string, int, error) {
	if !e.swapped && name == "systemctl" && len(args) == 2 && args[0] == "stop" && args[1] == bundledCaddyService {
		if err := e.swap(); err != nil {
			return "", 1, err
		}
		e.swapped = true
	}
	return e.recoveryExec.Run(name, args...)
}

func TestRestoreConfinesPublicationAfterPreflight(t *testing.T) {
	for _, kind := range []string{"leaf symlink", "leaf hardlink", "ancestor symlink", "root symlink"} {
		t.Run(kind, func(t *testing.T) {
			checkRestorePublicationAfterPreflight(t, kind)
		})
	}
}

func checkRestorePublicationAfterPreflight(t *testing.T, kind string) {
	t.Helper()
	p, fs, e := recoveryFixture(t, true)
	require.NoError(t, os.MkdirAll(fs.state+"/data", 0700))
	require.NoError(t, os.WriteFile(fs.state+"/data/key", []byte("old state"), 0600))
	outsideDir := filepath.Join(filepath.Dir(p.ConfigDir), "outside")
	require.NoError(t, os.MkdirAll(outsideDir+"/data", 0700))
	for _, file := range []string{outsideDir + "/key", outsideDir + "/data/key"} {
		require.NoError(t, os.WriteFile(file, []byte("untouched"), 0644))
		require.NoError(t, os.Chmod(file, 0644))
	}
	archive := recoveryArchive(t, []*tar.Header{{Name: "backup/backend.env", Mode: 0640, Typeflag: tar.TypeReg}, {Name: "backup/caddy-state/data/key", Mode: 0600, Typeflag: tar.TypeReg}}, []string{"DATABASE_PASSWORD=old\nHEIMDALL_PROXY_MODE=bundled\n", "restored private key"})
	r := recoveryRestore(p, fs, e)
	swap := &recoverySwapOnStop{recoveryExec: e, swap: func() error {
		target := fs.state + "/data/key"
		outside := outsideDir + "/key"
		if kind == "ancestor symlink" {
			target = fs.state + "/data"
			outside = outsideDir
		}
		if kind == "root symlink" {
			target = fs.state
			outside = outsideDir
		}
		if err := os.Rename(target, target+".before-swap"); err != nil {
			return err
		}
		if kind == "leaf hardlink" {
			return os.Link(outside, target)
		}
		return os.Symlink(outside, target)
	}}
	r.Exec = swap
	require.NoError(t, r.Run(archive))
	require.True(t, swap.swapped)
	for _, file := range []string{outsideDir + "/key", outsideDir + "/data/key"} {
		data, err := os.ReadFile(file)
		require.NoError(t, err)
		require.Equal(t, "untouched", string(data))
		info, err := os.Stat(file)
		require.NoError(t, err)
		require.Equal(t, os.FileMode(0644), info.Mode().Perm())
	}
	data, err := os.ReadFile(fs.state + "/data/key")
	require.NoError(t, err)
	require.Equal(t, "restored private key", string(data))
	require.FileExists(t, p.ConfigDir+"/upgrade-pending")
}

type recoveryPublicationFailureFS struct {
	*recoveryFS
	failure string
}

func (f *recoveryPublicationFailureFS) Rename(src, dest string) error {
	if (f.failure == "publish" || f.failure == "rollback") && strings.HasSuffix(src, "/restored") {
		return fmt.Errorf("injected publication failure")
	}
	if f.failure == "rollback" && strings.HasSuffix(src, "/previous") {
		return fmt.Errorf("injected rollback failure")
	}
	return f.recoveryFS.Rename(src, dest)
}
func (f *recoveryPublicationFailureFS) RemoveAll(path string) error {
	if f.failure == "cleanup" && strings.HasSuffix(path, "/previous") {
		return fmt.Errorf("injected prior-tree cleanup failure")
	}
	return f.recoveryFS.RemoveAll(path)
}
func TestRestorePublicationFailuresRetainRecoveryState(t *testing.T) {
	for _, failure := range []string{"publish", "rollback", "cleanup"} {
		t.Run(failure, func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			require.NoError(t, os.MkdirAll(fs.state+"/data", 0700))
			require.NoError(t, os.WriteFile(fs.state+"/data/key", []byte("prior CA key"), 0600))
			archive := recoveryArchive(t, []*tar.Header{{Name: "backup/backend.env", Mode: 0640, Typeflag: tar.TypeReg}, {Name: "backup/database.sql", Mode: 0600, Typeflag: tar.TypeReg}, {Name: "backup/caddy-state/data/key", Mode: 0600, Typeflag: tar.TypeReg}}, []string{"DATABASE_PASSWORD=old\nHEIMDALL_PROXY_MODE=bundled\n", recoverySQLHeaders + "-- sql must not run", "restored CA key"})
			r := recoveryRestore(p, fs, e)
			r.FS = &recoveryPublicationFailureFS{recoveryFS: fs, failure: failure}
			require.Error(t, r.Run(archive))
			require.Empty(t, e.sql)
			require.FileExists(t, p.ConfigDir+"/upgrade-pending")
			require.Contains(t, r.ErrOut.(*bytes.Buffer).String(), "Restore staging retained for recovery:")
			stages, err := filepath.Glob(filepath.Join(filepath.Dir(fs.state), ".heimdall-restore.*"))
			require.NoError(t, err)
			require.Len(t, stages, 1)
			info, err := os.Stat(stages[0])
			require.NoError(t, err)
			require.Equal(t, os.FileMode(0700), info.Mode().Perm())
			prior := stages[0] + "/previous/data/key"
			if failure == "publish" {
				prior = fs.state + "/data/key"
			}
			data, err := os.ReadFile(prior)
			require.NoError(t, err)
			require.Equal(t, "prior CA key", string(data))
			for _, call := range e.calls {
				if call.Name == "systemctl" {
					require.Equal(t, "stop", call.Args[0])
				}
			}
		})
	}
}

func TestRestoreStagingRemainsRootOnlyUntilPublication(t *testing.T) {
	p, fs, e := recoveryFixture(t, true)
	archive := recoveryArchive(t, []*tar.Header{{Name: "backup/backend.env", Mode: 0640, Typeflag: tar.TypeReg}, {Name: "backup/caddy-state/data/key", Mode: 0600, Typeflag: tar.TypeReg}}, []string{"PORT=3000\n", "private CA key"})
	r := recoveryRestore(p, fs, e)
	guard := &recoveryStagingGuard{recoveryExec: e, t: t}
	r.Exec = guard
	require.NoError(t, r.Run(archive))
	require.True(t, guard.checked)
}

type recoveryStagingGuard struct {
	*recoveryExec
	t       *testing.T
	checked bool
}

func (e *recoveryStagingGuard) Run(name string, args ...string) (string, int, error) {
	if name == "chown" && args[0] == "heimdall-caddy:heimdall-caddy" {
		prefix, _, ok := strings.Cut(args[1], "/restored")
		require.True(e.t, ok, "Caddy ownership must be assigned only inside unpublished staging")
		info, err := os.Stat(e.fs.path(prefix))
		require.NoError(e.t, err)
		require.Equal(e.t, os.FileMode(0700), info.Mode().Perm())
		var rootOwned bool
		for _, call := range e.calls {
			if call.Name == "chown" && len(call.Args) == 2 && call.Args[1] == prefix {
				rootOwned = call.Args[0] == "root:root"
			}
		}
		require.True(e.t, rootOwned, "the staging container must retain root ownership")
		e.checked = true
	}
	return e.recoveryExec.Run(name, args...)
}

func TestRestoreProxyOwnershipTransition(t *testing.T) {
	for _, oldMode := range []string{"bundled", "nginx"} {
		for _, newMode := range []string{"bundled", "nginx", "external", "none", ""} {
			t.Run(oldMode+" to "+newMode, func(t *testing.T) {
				checkRestoreProxyOwnershipTransition(t, oldMode, newMode)
			})
		}
	}
}

func checkRestoreProxyOwnershipTransition(t *testing.T, oldMode, newMode string) {
	t.Helper()
	p, fs, exec := recoveryFixture(t, true)
	before := "DATABASE_PASSWORD=old-secret\nHEIMDALL_PROXY_MODE=" + oldMode + "\n"
	require.NoError(t, os.WriteFile(p.EnvFile, []byte(before), 0640))
	archived := "DATABASE_PASSWORD=new-secret\nHEIMDALL_DATABASE_MODE=external\nHEIMDALL_PROXY_MODE=" + newMode + "\n"
	require.NoError(t, recoveryRestore(p, fs, exec).Run(oldRecoveryArchive(t, archived, true)))
	unit := bundledCaddyService
	if oldMode == "nginx" {
		unit = bundledNginxService
	}
	action := "stop " + unit
	if oldMode != newMode {
		action = "disable --now " + unit
	}
	var actions []string
	for _, call := range exec.calls {
		if call.Name == "systemctl" {
			actions = append(actions, strings.Join(call.Args, " "))
		}
	}
	require.Equal(t, []string{"stop heimdall-server", action}, actions)
}

func TestRestoreProxyDisableFailurePreservesCurrentConfig(t *testing.T) {
	p, fs, exec := recoveryFixture(t, true)
	before, err := os.ReadFile(p.EnvFile)
	require.NoError(t, err)
	exec.fail = "systemctl disable --now heimdall-caddy"
	archive := oldRecoveryArchive(t, "DATABASE_PASSWORD=secret\nHEIMDALL_PROXY_MODE=nginx\n", true)
	require.Error(t, recoveryRestore(p, fs, exec).Run(archive))
	after, err := os.ReadFile(p.EnvFile)
	require.NoError(t, err)
	require.Equal(t, before, after)
	require.Empty(t, exec.sql)
	require.True(t, fs.Exists(p.ConfigDir+"/upgrade-pending"))
}
