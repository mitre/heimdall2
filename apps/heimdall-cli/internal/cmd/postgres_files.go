package cmd

import (
	"crypto/rand"
	"fmt"
	"io"
	"os"
	"os/user"
	"strconv"
	"syscall"
)

// PostgreSQL owns this tree and may rename entries even while setup is running.
// Never use privileged pathname writes, chown, or reads inside it. A checked
// directory descriptor confines names; reads validate the opened inode and
// writes replace entries with newly created files instead of truncating them.
type postgresDataFiles interface {
	ReadFile(name string) ([]byte, error)
	WriteFile(name string, data []byte) error
	ReadDir() ([]os.DirEntry, error)
	Remove(name string) error
	Close() error
}

type postgresFiles struct {
	root     *os.Root
	uid, gid int
}

func (*osFileSystem) OpenPostgresData(path string) (postgresDataFiles, error) {
	accountName, _, err := postgresDataLayout(path)
	if err != nil {
		return nil, err
	}
	account, err := user.Lookup(accountName)
	if err != nil {
		return nil, err
	}
	uid, err := strconv.Atoi(account.Uid)
	if err != nil {
		return nil, err
	}
	gid, err := strconv.Atoi(account.Gid)
	if err != nil {
		return nil, err
	}
	anchor, err := os.OpenRoot("/")
	if err != nil {
		return nil, err
	}
	for _, name := range []string{"var", "lib"} {
		next, openErr := openPostgresDirectory(anchor, name, 0)
		anchor.Close()
		if openErr != nil {
			return nil, openErr
		}
		anchor = next
	}
	defer anchor.Close()
	files, err := openPostgresDataAt(anchor, path, uid, gid)
	if err != nil {
		return nil, err
	}
	return files, nil
}

// anchor is an already trusted /var/lib descriptor. Check every service-owned
// component separately, so neither an initial symlink nor a rename during open
// can redirect configuration I/O to another service's directory.
func openPostgresDataAt(anchor *os.Root, path string, uid, gid int) (*postgresFiles, error) {
	account, components, err := postgresDataLayout(path)
	if err != nil {
		return nil, err
	}
	parent := anchor
	for i, name := range components {
		owners := []int{uid}
		if account == "postgres" && i < len(components)-1 {
			// Distribution packages differ on ownership of pgsql/version
			// parents. The cluster itself must always belong to postgres.
			owners = append(owners, 0)
		}
		child, err := openPostgresDirectory(parent, name, owners...)
		if parent != anchor {
			parent.Close()
		}
		if err != nil {
			return nil, err
		}
		parent = child
	}
	return &postgresFiles{root: parent, uid: uid, gid: gid}, nil
}

// Only layouts produced by detectPG and the bundled RPM are accepted. This is
// not a general privileged file API, and never accepts a caller-selected user.
func postgresDataLayout(path string) (string, []string, error) {
	if path == bundledPGData {
		return "heimdall-postgres", []string{"heimdall-postgresql", "18", "data"}, nil
	}
	if path == "/var/lib/pgsql/data" {
		return "postgres", []string{"pgsql", "data"}, nil
	}
	for _, major := range pgdgVersions {
		version := strconv.Itoa(major)
		if path == "/var/lib/pgsql/"+version+"/data" {
			return "postgres", []string{"pgsql", version, "data"}, nil
		}
	}
	return "", nil, fmt.Errorf("unsupported PostgreSQL data directory %q", path)
}

func openPostgresDirectory(parent *os.Root, name string, owners ...int) (*os.Root, error) {
	before, err := parent.Lstat(name)
	if err != nil {
		return nil, err
	}
	stat, ok := before.Sys().(*syscall.Stat_t)
	allowed := false
	if ok {
		for _, uid := range owners {
			allowed = allowed || int(stat.Uid) == uid
		}
	}
	if !allowed || !before.IsDir() || before.Mode()&0022 != 0 {
		return nil, fmt.Errorf("unsafe PostgreSQL directory %s", name)
	}
	child, err := parent.OpenRoot(name)
	if err != nil {
		return nil, err
	}
	after, err := child.Stat(".")
	if err != nil || !os.SameFile(before, after) {
		child.Close()
		return nil, fmt.Errorf("PostgreSQL directory changed while opening %s", name)
	}
	return child, nil
}

func postgresConfigName(name string) error {
	switch name {
	case "PG_VERSION", "postgresql.conf", "postgresql.auto.conf", "heimdall.conf", "pg_hba.conf":
		return nil
	default:
		return fmt.Errorf("unsupported PostgreSQL configuration file %q", name)
	}
}

func (p *postgresFiles) ReadFile(name string) ([]byte, error) {
	if err := postgresConfigName(name); err != nil {
		return nil, err
	}
	// NONBLOCK prevents a substituted FIFO from hanging privileged setup.
	f, err := p.root.OpenFile(name, os.O_RDONLY|syscall.O_NOFOLLOW|syscall.O_NONBLOCK, 0)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		return nil, err
	}
	stat, ok := info.Sys().(*syscall.Stat_t)
	if !ok || !info.Mode().IsRegular() || int(stat.Uid) != p.uid || stat.Nlink != 1 {
		return nil, fmt.Errorf("unsafe PostgreSQL configuration file %s", name)
	}
	return io.ReadAll(f)
}

func (p *postgresFiles) WriteFile(name string, data []byte) error {
	if err := postgresConfigName(name); err != nil {
		return err
	}
	tmp := ".heimdall-" + rand.Text()
	f, err := p.root.OpenFile(tmp, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	defer f.Close()
	defer p.root.Remove(tmp)
	if _, err := f.Write(data); err != nil {
		return err
	}
	if err := f.Chmod(0600); err != nil {
		return err
	}
	if err := f.Chown(p.uid, p.gid); err != nil {
		return err
	}
	if err := f.Sync(); err != nil {
		return err
	}
	opened, err := f.Stat()
	if err != nil {
		return err
	}
	named, err := p.root.Lstat(tmp)
	if err != nil || !os.SameFile(opened, named) {
		return fmt.Errorf("PostgreSQL temporary configuration changed before installation")
	}
	// A service-user swap after this comparison can only install its own
	// entry. There are no privileged reads, writes or metadata changes after
	// the rename; a symlink/hardlink destination is replaced, never followed.
	return p.root.Rename(tmp, name)
}

func (p *postgresFiles) ReadDir() ([]os.DirEntry, error) {
	f, err := p.root.Open(".")
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return f.ReadDir(-1)
}

func (p *postgresFiles) Remove(name string) error {
	if err := postgresConfigName(name); err != nil {
		return err
	}
	err := p.root.Remove(name)
	if os.IsNotExist(err) {
		return nil
	}
	return err
}

func (p *postgresFiles) Close() error { return p.root.Close() }

type postgresConfigSnapshot struct {
	name   string
	data   []byte
	exists bool
}

func snapshotPostgresConfig(files postgresDataFiles, name string) (postgresConfigSnapshot, error) {
	s := postgresConfigSnapshot{name: name}
	data, err := files.ReadFile(s.name)
	if os.IsNotExist(err) {
		return s, nil
	}
	if err != nil {
		return s, err
	}
	s.data, s.exists = data, true
	return s, nil
}

func (s postgresConfigSnapshot) restore(files postgresDataFiles) error {
	if !s.exists {
		return files.Remove(s.name)
	}
	return files.WriteFile(s.name, s.data)
}
