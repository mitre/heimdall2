package cmd

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBackup_CreatesArchive(t *testing.T) {
	p, fs, e := recoveryFixture(t, false)
	out := new(bytes.Buffer)
	r := &BackupRunner{Paths: p, FS: fs, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
	output := filepath.Join(filepath.Dir(p.ConfigDir), "backups")
	require.NoError(t, r.Run(output))
	require.Contains(t, out.String(), "Config:   backed up")
	require.Contains(t, out.String(), "Backup saved to:")
	entries, err := os.ReadDir(output)
	require.NoError(t, err)
	require.Len(t, entries, 1, "successful publication leaves only the completed archive")
	archive := filepath.Join(output, entries[0].Name())
	info, err := os.Stat(archive)
	require.NoError(t, err)
	require.Equal(t, os.FileMode(0600), info.Mode().Perm())
	extracted, err := extractRecoveryArchive(archive, t.TempDir())
	require.NoError(t, err)
	got, err := os.ReadFile(filepath.Join(extracted, "backend.env"))
	require.NoError(t, err)
	want, err := os.ReadFile(p.EnvFile)
	require.NoError(t, err)
	require.Equal(t, want, got)
	sql, err := os.ReadFile(filepath.Join(extracted, "database.sql"))
	require.NoError(t, err)
	require.Equal(t, "-- sentinel SQL\n", string(sql))
}

func TestBackup_CallsPgDumpWithCorrectArgs(t *testing.T) {
	p, fs, e := recoveryFixture(t, false)
	env := &FileEnvManager{Path: p.EnvFile}
	require.NoError(t, env.WriteEnvFile(map[string]string{"DATABASE_PASSWORD": "mypass", "DATABASE_HOST": "db.local", "DATABASE_PORT": "5433", "DATABASE_USERNAME": "heimdall", "DATABASE_NAME": "mydb"}))
	r := &BackupRunner{Paths: p, FS: fs, Exec: e, Env: env, Out: new(bytes.Buffer), ErrOut: new(bytes.Buffer)}
	require.NoError(t, r.Run(filepath.Dir(p.ConfigDir)))
	var found bool
	for _, call := range e.calls {
		if filepath.Base(call.Name) == "pg_dump" {
			found = true
			require.Equal(t, "mypass", call.Env["PGPASSWORD"])
			require.Equal(t, []string{"-h", "db.local", "-p", "5433", "-U", "heimdall", "mydb", "-f"}, call.Args[:8])
		}
	}
	require.True(t, found)
}

func TestBackup_HandlesPgDumpFailure(t *testing.T) {
	for _, result := range []FakeExecResult{{ExitCode: 1}, {Err: fmt.Errorf("pg_dump not found")}} {
		p, fs, _ := recoveryFixture(t, false)
		exec := &FakeExecRunner{Results: map[string]FakeExecResult{"pg_dump -h": result}}
		out := new(bytes.Buffer)
		r := &BackupRunner{Paths: p, FS: fs, Exec: exec, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
		require.Error(t, r.Run(filepath.Dir(p.ConfigDir)))
		require.Contains(t, out.String(), "backup FAILED")
		require.NotContains(t, out.String(), "Backup saved to:")
		for _, call := range exec.Calls {
			require.NotEqual(t, "tar", call.Name)
		}
		exec.Verify(t)
	}
}

func TestBackup_ConfigCopyFailure(t *testing.T) {
	for _, exists := range []bool{false, true} {
		t.Run(fmt.Sprintf("exists=%t", exists), func(t *testing.T) {
			fs := NewFakeFileSystem()
			if exists {
				fs.Dirs["/etc/heimdall-server/backend.env"] = true
			}
			exec := &FakeExecRunner{}
			r := &BackupRunner{Exec: exec, Env: &FakeEnvManager{Env: map[string]string{"DATABASE_PASSWORD": "secret"}}, FS: fs, Out: new(bytes.Buffer), ErrOut: new(bytes.Buffer)}
			require.Error(t, r.Run(t.TempDir()))
			require.Empty(t, exec.Calls)
		})
	}
}

func TestBackup_ConfigReadFailure(t *testing.T) {
	exec := &FakeExecRunner{}
	r := &BackupRunner{Exec: exec, Env: &FileEnvManager{Path: t.TempDir()}, FS: NewFakeFileSystem(), Out: new(bytes.Buffer), ErrOut: new(bytes.Buffer)}
	require.Error(t, r.Run(t.TempDir()))
	require.Empty(t, exec.Calls)
}

func TestBackup_SkipsDBWithoutPassword(t *testing.T) {
	p, fs, e := recoveryFixture(t, false)
	require.NoError(t, os.WriteFile(p.EnvFile, []byte("PORT=3000\n"), 0600))
	out := new(bytes.Buffer)
	r := &BackupRunner{Paths: p, FS: fs, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
	require.NoError(t, r.Run(filepath.Dir(p.ConfigDir)))
	require.Contains(t, out.String(), "Backup saved to:")
	require.Contains(t, out.String(), "skipped (no password configured)")
	for _, call := range e.calls {
		require.NotEqual(t, "pg_dump", filepath.Base(call.Name))
	}
}

func TestBackup_RejectsRelativePath(t *testing.T) {
	r := &BackupRunner{
		Env:       &FakeEnvManager{Env: map[string]string{"DATABASE_PASSWORD": "pass"}},
		Exec:      &FakeExecRunner{Results: make(map[string]FakeExecResult)},
		FS:        NewFakeFileSystem(),
		Out:       new(bytes.Buffer),
		ErrOut:    new(bytes.Buffer),
		CheckRoot: func() error { return nil },
	}
	err := r.Run("../../../tmp/evil")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "absolute")
}

func TestBackup_RejectsPathTraversal(t *testing.T) {
	r := &BackupRunner{
		Env:       &FakeEnvManager{Env: map[string]string{"DATABASE_PASSWORD": "pass"}},
		Exec:      &FakeExecRunner{Results: make(map[string]FakeExecResult)},
		FS:        NewFakeFileSystem(),
		Out:       new(bytes.Buffer),
		ErrOut:    new(bytes.Buffer),
		CheckRoot: func() error { return nil },
	}
	err := r.Run("/var/lib/../../../etc/passwd")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "traversal")
}

func TestBackupRPMRequiresDatabaseAndCompatibleServer(t *testing.T) {
	for _, tc := range []struct {
		name, password, version string
		ok                      bool
	}{
		{"missing password", "", "180006", false}, {"old", "secret", "120015", false}, {"newer", "secret", "190000", false}, {"malformed", "secret", "", false}, {"floor", "secret", "130022", true}, {"ceiling", "secret", "180006", true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			e.version = tc.version
			err := os.WriteFile(p.EnvFile, []byte("DATABASE_PASSWORD="+tc.password+"\n"), 0640)
			require.NoError(t, err)
			out := new(bytes.Buffer)
			r := &BackupRunner{Paths: p, FS: fs, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
			err = r.Run(filepath.Dir(p.ConfigDir))
			if tc.ok {
				require.NoError(t, err)
			} else {
				require.Error(t, err)
				archives, _ := filepath.Glob(filepath.Join(filepath.Dir(p.ConfigDir), "*.tar.gz"))
				require.Empty(t, archives)
				require.NotContains(t, out.String(), "Backup saved")
			}
		})
	}
}

func TestBackupRejectsUnsafeSourcesAndOutput(t *testing.T) {
	for _, kind := range []string{"config symlink", "Caddy symlink", "Caddy hardlink", "output symlink", "output file"} {
		t.Run(kind, func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			outside := filepath.Join(filepath.Dir(p.ConfigDir), "outside")
			require.NoError(t, os.WriteFile(outside, []byte("untouched"), 0600))
			output := filepath.Join(filepath.Dir(p.ConfigDir), "backups")
			switch kind {
			case "config symlink":
				require.NoError(t, os.Remove(p.EnvFile))
				require.NoError(t, os.Symlink(outside, p.EnvFile))
			case "Caddy symlink":
				require.NoError(t, os.Symlink(filepath.Dir(p.ConfigDir), p.ConfigDir+"/caddy"))
			case "Caddy hardlink":
				require.NoError(t, os.Mkdir(p.ConfigDir+"/caddy", 0700))
				require.NoError(t, os.Link(outside, p.ConfigDir+"/caddy/Caddyfile"))
			case "output symlink":
				require.NoError(t, os.Symlink(filepath.Dir(p.ConfigDir), output))
			case "output file":
				require.NoError(t, os.WriteFile(output, []byte("untouched"), 0600))
			}
			r := &BackupRunner{Paths: p, FS: fs, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: new(bytes.Buffer), ErrOut: new(bytes.Buffer)}
			require.Error(t, r.Run(output))
			require.Empty(t, e.calls)
			data, err := os.ReadFile(outside)
			require.NoError(t, err)
			require.Equal(t, "untouched", string(data))
		})
	}
}

func TestBackupCommandFailuresDoNotClaimSuccess(t *testing.T) {
	for _, fail := range []string{"SHOW server_version_num", "pg_dump", "tar czf", "chmod 0600"} {
		t.Run(fail, func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			e.fail = fail
			out := new(bytes.Buffer)
			r := &BackupRunner{Paths: p, FS: fs, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
			require.Error(t, r.Run(filepath.Dir(p.ConfigDir)))
			require.NotContains(t, out.String(), "Backup saved to:")
		})
	}
}

func TestBackupRPMAcceptsResolvedURLCredentials(t *testing.T) {
	p, fs, e := recoveryFixture(t, true)
	require.NoError(t, os.WriteFile(p.EnvFile, []byte("DATABASE_URL=postgres://backup:secret@db.example.test:5432/heimdall\nHEIMDALL_DATABASE_MODE=external\n"), 0600))
	r := &BackupRunner{Paths: p, FS: fs, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: new(bytes.Buffer), ErrOut: new(bytes.Buffer)}
	require.NoError(t, r.Run(filepath.Join(filepath.Dir(p.ConfigDir), "url-backups")))
	var dumped bool
	for _, call := range e.calls {
		if filepath.Base(call.Name) == "pg_dump" {
			dumped = true
			require.Equal(t, "secret", call.Env["PGPASSWORD"])
			require.Contains(t, call.Args, "db.example.test")
			require.Contains(t, call.Args, "backup")
			require.Contains(t, call.Args, "heimdall")
		}
	}
	require.True(t, dumped, "URL-only credentials must produce the required SQL dump")
}

type backupSwapAfterCheckFS struct {
	*recoveryFS
	target  string
	reads   int
	swapped bool
	swap    func() error
}

func (f *backupSwapAfterCheckFS) Lstat(path string) (os.FileInfo, error) {
	info, err := f.recoveryFS.Lstat(path)
	if err != nil {
		return info, err
	}
	if path == f.target {
		f.reads++
	}
	// The fourth leaf stat is the copy walk's guard, after the initial preflight.
	// Swap only after the last ancestor check returns its original metadata.
	if f.reads == 4 && !f.swapped && path == "/var" {
		if err := f.swap(); err != nil {
			return nil, err
		}
		f.swapped = true
	}
	return info, nil
}
func TestBackupConfinesSourceReadAfterPreflight(t *testing.T) {
	for _, kind := range []string{"leaf symlink", "ancestor symlink", "hardlink"} {
		t.Run(kind, func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			require.NoError(t, os.MkdirAll(fs.state+"/data", 0700))
			target := fs.state + "/data/key"
			require.NoError(t, os.WriteFile(target, []byte("owned state"), 0600))
			outside := filepath.Join(filepath.Dir(fs.state), "outside")
			require.NoError(t, os.Mkdir(outside, 0700))
			require.NoError(t, os.WriteFile(outside+"/key", []byte("outside data must never be archived"), 0600))
			racing := &backupSwapAfterCheckFS{recoveryFS: fs, target: "/var/lib/heimdall-caddy/data/key", swap: func() error {
				leaf := target
				link := outside + "/key"
				if kind == "ancestor symlink" {
					leaf = fs.state + "/data"
					link = outside
				}
				if err := os.Rename(leaf, leaf+".prior"); err != nil {
					return err
				}
				if kind == "hardlink" {
					return os.Link(link, leaf)
				}
				return os.Symlink(link, leaf)
			}}
			out := new(bytes.Buffer)
			r := &BackupRunner{Paths: p, FS: racing, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
			require.Error(t, r.Run(filepath.Dir(p.ConfigDir)))
			require.True(t, racing.swapped)
			archives, err := filepath.Glob(filepath.Join(filepath.Dir(p.ConfigDir), "*.tar.gz"))
			require.NoError(t, err)
			require.Empty(t, archives)
			require.NotContains(t, out.String(), "Backup saved")
		})
	}
}

// Simulate the application renaming entries it owns while root backs up.
// Only paths under output are attacker-controlled; protected temp paths are not.
type backupOutputSwapFS struct {
	*recoveryFS
	output, outside, sentinel, kind string
	swapped, protected              bool
}

func (f *backupOutputSwapFS) CopyFile(source, dest string) error {
	if filepath.Base(dest) == "backend.env" && !f.swapped && !f.protected {
		stage := filepath.Dir(filepath.Dir(dest))
		if f.kind == "staging" && !strings.HasPrefix(stage, f.output+string(os.PathSeparator)) {
			f.protected = true
		} else {
			victim, replacement := f.output, f.outside
			if f.kind == "staging" {
				victim = stage
			} else if f.kind == "ancestor" {
				victim = filepath.Dir(f.output)
			}
			if err := os.Rename(victim, victim+".original"); err != nil {
				return err
			}
			if err := os.Symlink(replacement, victim); err != nil {
				return err
			}
			if strings.HasPrefix(dest, victim+string(os.PathSeparator)) {
				rel, err := filepath.Rel(victim, dest)
				if err != nil {
					return err
				}
				redirected := filepath.Join(replacement, rel)
				if err := os.MkdirAll(filepath.Dir(redirected), 0700); err != nil {
					return err
				}
				if err := os.Symlink(f.sentinel, redirected); err != nil {
					return err
				}
			}
			f.swapped = true
		}
	}
	return f.recoveryFS.CopyFile(source, dest)
}

func TestBackupProtectsStagingAndOutputAncestry(t *testing.T) {
	for _, kind := range []string{"staging", "output", "ancestor"} {
		t.Run(kind, func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			base := filepath.Dir(p.ConfigDir)
			output := filepath.Join(base, "app-owned", "backups")
			require.NoError(t, os.MkdirAll(output, 0700))
			outside := filepath.Join(base, "outside")
			require.NoError(t, os.Mkdir(outside, 0700))
			sentinel := filepath.Join(base, "sentinel")
			require.NoError(t, os.WriteFile(sentinel, []byte("untouched"), 0644))
			tracing := &backupOutputSwapFS{recoveryFS: fs, output: output, outside: outside, sentinel: sentinel, kind: kind}
			out := new(bytes.Buffer)
			r := &BackupRunner{Paths: p, FS: tracing, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
			err := r.Run(output)
			data, readErr := os.ReadFile(sentinel)
			require.NoError(t, readErr)
			require.Equal(t, "untouched", string(data), "output swaps must not redirect privileged writes")
			info, statErr := os.Stat(sentinel)
			require.NoError(t, statErr)
			require.Equal(t, os.FileMode(0644), info.Mode().Perm())
			if kind == "staging" {
				require.True(t, tracing.protected, "dump and tar staging must not be named under app-owned output")
				require.NoError(t, err)
			} else {
				require.True(t, tracing.swapped)
				require.Error(t, err)
				requireRetainedBackup(t, err)
				require.NotContains(t, out.String(), "Backup saved to:")
			}
		})
	}
}

type backupPublishSwapExec struct {
	*recoveryExec
	output, outside, kind string
	swapped               bool
}

func (e *backupPublishSwapExec) RunWithEnv(env map[string]string, name string, args ...string) (string, int, error) {
	out, code, err := e.recoveryExec.RunWithEnv(env, name, args...)
	if name != "tar" || err != nil || code != 0 {
		return out, code, err
	}
	archive := filepath.Join(e.output, args[len(args)-1]+".tar.gz")
	if e.kind == "output" {
		err = os.Rename(e.output, e.output+".original")
		if err == nil {
			err = os.Symlink(e.outside, e.output)
		}
	} else if e.kind == "symlink" {
		err = os.Symlink(e.outside, archive)
	} else {
		err = os.WriteFile(archive, []byte("existing archive"), 0644)
	}
	e.swapped = err == nil
	return out, code, err
}
func TestBackupPublicationDoesNotFollowOrOverwriteReplacements(t *testing.T) {
	for _, kind := range []string{"output", "symlink", "file"} {
		t.Run(kind, func(t *testing.T) {
			p, fs, e := recoveryFixture(t, true)
			base := filepath.Dir(p.ConfigDir)
			output := filepath.Join(base, "backups")
			require.NoError(t, os.Mkdir(output, 0700))
			outside := filepath.Join(base, "outside")
			require.NoError(t, os.Mkdir(outside, 0700))
			swap := &backupPublishSwapExec{recoveryExec: e, output: output, outside: outside, kind: kind}
			out := new(bytes.Buffer)
			r := &BackupRunner{Paths: p, FS: fs, Exec: swap, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
			err := r.Run(output)
			require.True(t, swap.swapped)
			require.Error(t, err, "a changed output or colliding final entry must refuse success")
			requireRetainedBackup(t, err)
			require.NotContains(t, out.String(), "Backup saved to:")
			entries, readErr := os.ReadDir(outside)
			require.NoError(t, readErr)
			require.Empty(t, entries)
			if kind != "output" {
				archives, globErr := filepath.Glob(filepath.Join(output, "*.tar.gz"))
				require.NoError(t, globErr)
				require.Len(t, archives, 1)
				if kind == "symlink" {
					target, linkErr := os.Readlink(archives[0])
					require.NoError(t, linkErr)
					require.Equal(t, outside, target)
				} else {
					data, readErr := os.ReadFile(archives[0])
					require.NoError(t, readErr)
					require.Equal(t, "existing archive", string(data))
				}
			}
		})
	}
}

type backupPublicationReader struct {
	io.Reader
	change func() error
}

func (r *backupPublicationReader) Read(p []byte) (int, error) {
	if r.change != nil {
		change := r.change
		r.change = nil
		if err := change(); err != nil {
			return 0, err
		}
	}
	return r.Reader.Read(p)
}

func TestBackupPublicationUsesOpenedContainerAndPreservesReplacement(t *testing.T) {
	for _, kind := range []string{"symlink", "empty directory", "nonempty directory"} {
		t.Run(kind, func(t *testing.T) {
			base, err := filepath.EvalSymlinks(t.TempDir())
			require.NoError(t, err)
			output, err := openBackupOutput(filepath.Join(base, "output"), true)
			require.NoError(t, err)
			defer output.Close()
			outside := filepath.Join(base, "outside")
			require.NoError(t, os.Mkdir(outside, 0700))
			sentinel := filepath.Join(outside, "archive")
			require.NoError(t, os.WriteFile(sentinel, []byte("untouched"), 0644))
			var container string
			reader := &backupPublicationReader{Reader: strings.NewReader("private completed archive"), change: func() error {
				entries, err := filepath.Glob(filepath.Join(base, "output", ".heimdall-publish-*"))
				if err != nil {
					return err
				}
				require.Len(t, entries, 1)
				container = entries[0]
				if err := os.Rename(container, container+".original"); err != nil {
					return err
				}
				if kind == "symlink" {
					return os.Symlink(outside, container)
				}
				if err := os.Mkdir(container, 0700); err != nil {
					return err
				}
				if kind == "nonempty directory" {
					return os.WriteFile(container+"/replacement", []byte("preserve"), 0644)
				}
				return nil
			}}
			err = publishBackupArchive(output, "complete.tar.gz", reader)
			require.ErrorContains(t, err, "retained")
			_, err = os.Lstat(container)
			require.NoError(t, err, "observed replacement entry must remain")
			data, err := os.ReadFile(sentinel)
			require.NoError(t, err)
			require.Equal(t, "untouched", string(data))
			info, err := os.Stat(sentinel)
			require.NoError(t, err)
			require.Equal(t, os.FileMode(0644), info.Mode().Perm())
			if kind == "nonempty directory" {
				data, err := os.ReadFile(container + "/replacement")
				require.NoError(t, err)
				require.Equal(t, "preserve", string(data))
			}
			data, err = os.ReadFile(filepath.Join(base, "output", "complete.tar.gz"))
			require.NoError(t, err)
			require.Equal(t, "private completed archive", string(data), "publication must use the opened private container")
		})
	}
}

func TestBackupRefusesUnprotectedTemporaryAncestry(t *testing.T) {
	p, fs, e := recoveryFixture(t, true)
	temporary := filepath.Join(filepath.Dir(p.ConfigDir), "unprotected")
	require.NoError(t, os.Mkdir(temporary, 0700))
	require.NoError(t, os.Chmod(temporary, 0777))
	t.Setenv("TMPDIR", temporary)
	out := new(bytes.Buffer)
	r := &BackupRunner{Paths: p, FS: fs, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
	require.ErrorContains(t, r.Run(filepath.Join(filepath.Dir(p.ConfigDir), "backups")), "unprotected ancestry")
	require.NotContains(t, out.String(), "Backup saved")
	entries, err := os.ReadDir(temporary)
	require.NoError(t, err)
	require.Empty(t, entries)
}

func requireRetainedBackup(t *testing.T, backupErr error) string {
	t.Helper()
	_, archive, found := strings.Cut(backupErr.Error(), "; completed private archive retained at ")
	require.True(t, found, "publication uncertainty must locate protected recovery evidence")
	t.Cleanup(func() { require.NoError(t, os.Remove(archive)) })
	info, err := os.Stat(archive)
	require.NoError(t, err)
	require.Equal(t, os.FileMode(0600), info.Mode().Perm())
	info, err = os.Stat(filepath.Dir(archive))
	require.NoError(t, err)
	require.True(t, info.Mode().Perm()&0022 == 0 || info.Mode()&os.ModeSticky != 0, "archive name must have protected temporary ancestry")
	root, err := extractRecoveryArchive(archive, t.TempDir())
	require.NoError(t, err)
	data, err := os.ReadFile(filepath.Join(root, "database.sql"))
	require.NoError(t, err)
	require.Equal(t, "-- sentinel SQL\n", string(data))
	return archive
}

func TestBackupPublicationReadFailureCleansOnlyItsPrivateFiles(t *testing.T) {
	path, err := filepath.EvalSymlinks(t.TempDir())
	require.NoError(t, err)
	output, err := openBackupOutput(path, false)
	require.NoError(t, err)
	defer output.Close()
	sentinel := filepath.Join(path, "keep")
	require.NoError(t, os.WriteFile(sentinel, []byte("untouched"), 0644))
	reader := &backupPublicationReader{Reader: strings.NewReader(""), change: func() error { return fmt.Errorf("source read failure") }}
	require.ErrorContains(t, publishBackupArchive(output, "backup.tar.gz", reader), "source read failure")
	entries, err := os.ReadDir(path)
	require.NoError(t, err)
	require.Len(t, entries, 1)
	require.Equal(t, "keep", entries[0].Name())
	data, err := os.ReadFile(sentinel)
	require.NoError(t, err)
	require.Equal(t, "untouched", string(data))
}

type backupCleanupFailureFS struct {
	*recoveryFS
	workspace string
}

func (f *backupCleanupFailureFS) RemoveAll(path string) error {
	if strings.HasPrefix(filepath.Base(path), ".heimdall-backup-") {
		f.workspace = path
		// Simulate a cleanup that removed payload before encountering an error.
		entries, err := os.ReadDir(path)
		if err != nil {
			return err
		}
		for _, entry := range entries {
			if err := os.RemoveAll(filepath.Join(path, entry.Name())); err != nil {
				return err
			}
		}
		return fmt.Errorf("workspace cleanup failure")
	}
	return f.recoveryFS.RemoveAll(path)
}
func TestBackupWorkspaceCleanupFailureRetainsCompleteArchive(t *testing.T) {
	p, fs, e := recoveryFixture(t, true)
	failing := &backupCleanupFailureFS{recoveryFS: fs}
	t.Cleanup(func() {
		if failing.workspace != "" {
			require.NoError(t, os.RemoveAll(failing.workspace))
		}
	})
	out := new(bytes.Buffer)
	r := &BackupRunner{Paths: p, FS: failing, Exec: e, Env: &FileEnvManager{Path: p.EnvFile}, Out: out, ErrOut: out}
	err := r.Run(filepath.Join(filepath.Dir(p.ConfigDir), "backups"))
	require.ErrorContains(t, err, "workspace cleanup failure")
	require.NotContains(t, out.String(), "Backup saved to:")
	requireRetainedBackup(t, err)
}

func TestBackupPublicationStaysInOpenedOutputAfterRename(t *testing.T) {
	base, err := filepath.EvalSymlinks(t.TempDir())
	require.NoError(t, err)
	path := filepath.Join(base, "output")
	output, err := openBackupOutput(path, true)
	require.NoError(t, err)
	defer output.Close()
	outside := filepath.Join(base, "outside")
	require.NoError(t, os.Mkdir(outside, 0700))
	sentinel := filepath.Join(outside, "backup.tar.gz")
	require.NoError(t, os.WriteFile(sentinel, []byte("untouched"), 0644))
	reader := &backupPublicationReader{Reader: strings.NewReader("private archive"), change: func() error {
		if err := os.Rename(path, path+".original"); err != nil {
			return err
		}
		return os.Symlink(outside, path)
	}}
	require.NoError(t, publishBackupArchive(output, "backup.tar.gz", reader))
	require.ErrorContains(t, backupOutputUnchanged(path, output), "changed")
	data, err := os.ReadFile(sentinel)
	require.NoError(t, err)
	require.Equal(t, "untouched", string(data))
	info, err := os.Stat(sentinel)
	require.NoError(t, err)
	require.Equal(t, os.FileMode(0644), info.Mode().Perm())
	data, err = os.ReadFile(filepath.Join(path+".original", "backup.tar.gz"))
	require.NoError(t, err)
	require.Equal(t, "private archive", string(data))
}
