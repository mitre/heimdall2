package cmd

import (
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"testing"

	"github.com/stretchr/testify/require"
)

func postgresFilesFixture(t *testing.T) (*os.Root, *postgresFiles, string) {
	t.Helper()
	base := t.TempDir()
	data := filepath.Join(base, "heimdall-postgresql", "18", "data")
	require.NoError(t, os.MkdirAll(data, 0700))
	anchor, err := os.OpenRoot(base)
	require.NoError(t, err)
	t.Cleanup(func() { anchor.Close() })
	files, err := openPostgresDataAt(anchor, bundledPGData, os.Getuid(), os.Getgid())
	require.NoError(t, err)
	t.Cleanup(func() { files.Close() })
	return anchor, files, data
}

func TestPostgresFilesRejectRedirectedDirectories(t *testing.T) {
	for _, component := range []string{"heimdall-postgresql", "heimdall-postgresql/18", "heimdall-postgresql/18/data"} {
		t.Run(component, func(t *testing.T) {
			anchor, _, data := postgresFilesFixture(t)
			base := filepath.Dir(filepath.Dir(filepath.Dir(data)))
			original := filepath.Join(base, component)
			moved := original + ".moved"
			require.NoError(t, os.Rename(original, moved))
			require.NoError(t, os.Symlink(moved, original))
			_, err := openPostgresDataAt(anchor, bundledPGData, os.Getuid(), os.Getgid())
			require.ErrorContains(t, err, "unsafe PostgreSQL directory")
		})
	}
}

func TestPostgresFilesRejectUnexpectedDirectoryOwnerOrPermissions(t *testing.T) {
	anchor, _, data := postgresFilesFixture(t)
	_, err := openPostgresDataAt(anchor, bundledPGData, os.Getuid()+1, os.Getgid())
	require.ErrorContains(t, err, "unsafe PostgreSQL directory")
	require.NoError(t, os.Chmod(data, 0777))
	_, err = openPostgresDataAt(anchor, bundledPGData, os.Getuid(), os.Getgid())
	require.ErrorContains(t, err, "unsafe PostgreSQL directory")
}

func TestPostgresFilesHoldDirectoryAfterParentReplacement(t *testing.T) {
	_, files, data := postgresFilesFixture(t)
	outside := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(outside, "postgresql.conf"), []byte("outside"), 0600))
	require.NoError(t, os.Rename(data, data+".moved"))
	require.NoError(t, os.Symlink(outside, data))
	require.NoError(t, files.WriteFile("postgresql.conf", []byte("managed")))
	got, err := files.ReadFile("postgresql.conf")
	require.NoError(t, err)
	require.Equal(t, "managed", string(got))
	untouched, err := os.ReadFile(filepath.Join(outside, "postgresql.conf"))
	require.NoError(t, err)
	require.Equal(t, "outside", string(untouched))
}

func TestPostgresFilesRejectLinkedReadsAndReplaceWithoutFollowing(t *testing.T) {
	for _, kind := range []string{"symlink", "hardlink"} {
		t.Run(kind, func(t *testing.T) {
			_, files, data := postgresFilesFixture(t)
			outside := filepath.Join(t.TempDir(), "unrelated")
			require.NoError(t, os.WriteFile(outside, []byte("outside"), 0640))
			path := filepath.Join(data, "postgresql.conf")
			if kind == "symlink" {
				require.NoError(t, os.Symlink(outside, path))
			} else {
				require.NoError(t, os.Link(outside, path))
			}
			_, err := files.ReadFile("postgresql.conf")
			require.Error(t, err)
			require.NoError(t, files.WriteFile("postgresql.conf", []byte("managed")))
			untouched, err := os.ReadFile(outside)
			require.NoError(t, err)
			require.Equal(t, "outside", string(untouched))
			info, err := os.Stat(outside)
			require.NoError(t, err)
			require.Equal(t, os.FileMode(0640), info.Mode().Perm())
			got, err := files.ReadFile("postgresql.conf")
			require.NoError(t, err)
			require.Equal(t, "managed", string(got))
			info, err = os.Lstat(path)
			require.NoError(t, err)
			require.Equal(t, os.FileMode(0600), info.Mode().Perm())
			require.True(t, info.Mode().IsRegular())
		})
	}
}

func TestPostgresFilesRejectFIFOAndUnexpectedFileOwner(t *testing.T) {
	_, files, data := postgresFilesFixture(t)
	path := filepath.Join(data, "postgresql.conf")
	require.NoError(t, syscall.Mkfifo(path, 0600))
	_, err := files.ReadFile("postgresql.conf")
	require.ErrorContains(t, err, "unsafe PostgreSQL configuration file")
	require.NoError(t, os.Remove(path))
	require.NoError(t, os.WriteFile(path, []byte("private"), 0600))
	files.uid = os.Getuid() + 1
	_, err = files.ReadFile("postgresql.conf")
	require.ErrorContains(t, err, "unsafe PostgreSQL configuration file")
}

func TestPostgresFilesSnapshotAndRollbackDoNotFollowReplacements(t *testing.T) {
	_, files, data := postgresFilesFixture(t)
	require.NoError(t, files.WriteFile("postgresql.conf", []byte("original")))
	before, err := snapshotPostgresConfig(files, "postgresql.conf")
	require.NoError(t, err)
	absent, err := snapshotPostgresConfig(files, "heimdall.conf")
	require.NoError(t, err)
	outside := filepath.Join(t.TempDir(), "unrelated")
	require.NoError(t, os.WriteFile(outside, []byte("outside"), 0600))
	require.NoError(t, os.Remove(filepath.Join(data, "postgresql.conf")))
	for _, name := range []string{"postgresql.conf", "heimdall.conf"} {
		require.NoError(t, os.Symlink(outside, filepath.Join(data, name)))
	}
	require.NoError(t, before.restore(files))
	require.NoError(t, absent.restore(files))
	got, err := files.ReadFile("postgresql.conf")
	require.NoError(t, err)
	require.Equal(t, "original", string(got))
	_, err = os.Lstat(filepath.Join(data, "heimdall.conf"))
	require.True(t, os.IsNotExist(err))
	got, err = os.ReadFile(outside)
	require.NoError(t, err)
	require.Equal(t, "outside", string(got))
}

func TestPostgresFilesMissingClusterAndFailedWrite(t *testing.T) {
	anchor, files, data := postgresFilesFixture(t)
	require.NoError(t, os.Mkdir(filepath.Join(data, "postgresql.conf"), 0700))
	require.Error(t, files.WriteFile("postgresql.conf", []byte("managed")))
	entries, err := files.ReadDir()
	require.NoError(t, err)
	require.Len(t, entries, 1, "a failed replacement must not leave temporary configuration files")
	require.NoError(t, os.Remove(filepath.Join(data, "postgresql.conf")))
	require.NoError(t, os.Remove(data))
	_, err = openPostgresDataAt(anchor, bundledPGData, os.Getuid(), os.Getgid())
	require.True(t, os.IsNotExist(err))
}

func TestPostgresFilesStandaloneLayoutsConfineConfiguration(t *testing.T) {
	for _, layout := range []string{"/var/lib/pgsql/data", "/var/lib/pgsql/18/data"} {
		t.Run(layout, func(t *testing.T) {
			base := t.TempDir()
			data := filepath.Join(base, strings.TrimPrefix(layout, "/var/lib/"))
			require.NoError(t, os.MkdirAll(data, 0700))
			anchor, err := os.OpenRoot(base)
			require.NoError(t, err)
			defer anchor.Close()
			files, err := openPostgresDataAt(anchor, layout, os.Getuid(), os.Getgid())
			require.NoError(t, err)
			defer files.Close()
			outside := t.TempDir()
			require.NoError(t, os.WriteFile(filepath.Join(outside, "pg_hba.conf"), []byte("outside"), 0600))
			require.NoError(t, os.Rename(data, data+".moved"))
			require.NoError(t, os.Symlink(outside, data))
			require.NoError(t, files.WriteFile("pg_hba.conf", []byte("managed")))
			got, err := os.ReadFile(filepath.Join(outside, "pg_hba.conf"))
			require.NoError(t, err)
			require.Equal(t, "outside", string(got))
			_, err = openPostgresDataAt(anchor, layout, os.Getuid(), os.Getgid())
			require.ErrorContains(t, err, "unsafe PostgreSQL directory")
		})
	}
}

func TestPostgresFilesRejectUnsupportedLayouts(t *testing.T) {
	for _, path := range []string{"/etc", "/var/lib/pgsql/18/data/other", "/var/lib/pgsql/../other/data", "/var/lib/other/data"} {
		_, err := (&osFileSystem{}).OpenPostgresData(path)
		require.ErrorContains(t, err, "unsupported PostgreSQL data directory")
	}
}

func TestPostgresFilesPrivilegedOwnership(t *testing.T) {
	if os.Geteuid() != 0 {
		t.Skip("requires root in an isolated test container to exercise ownership changes")
	}
	base := t.TempDir()
	data := filepath.Join(base, "pgsql", "18", "data")
	require.NoError(t, os.MkdirAll(data, 0700))
	const serviceUID = 65534
	require.NoError(t, os.Chown(data, serviceUID, serviceUID))
	anchor, err := os.OpenRoot(base)
	require.NoError(t, err)
	defer anchor.Close()
	files, err := openPostgresDataAt(anchor, "/var/lib/pgsql/18/data", serviceUID, serviceUID)
	require.NoError(t, err, "trusted root-owned package parents are allowed above a service-owned cluster")
	defer files.Close()
	require.NoError(t, os.WriteFile(filepath.Join(data, "postgresql.conf"), []byte("root-owned"), 0600))
	_, err = files.ReadFile("postgresql.conf")
	require.ErrorContains(t, err, "unsafe PostgreSQL configuration file")
	require.NoError(t, files.WriteFile("postgresql.conf", []byte("managed")))
	got, err := files.ReadFile("postgresql.conf")
	require.NoError(t, err)
	require.Equal(t, "managed", string(got))
	info, err := os.Stat(filepath.Join(data, "postgresql.conf"))
	require.NoError(t, err)
	stat := info.Sys().(*syscall.Stat_t)
	require.Equal(t, uint32(serviceUID), stat.Uid)
	require.Equal(t, uint32(serviceUID), stat.Gid)
}
