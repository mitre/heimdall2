package cmd

import (
	"archive/tar"
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
)

// RestoreRunner implements the restore command.
type RestoreRunner struct {
	Paths     Paths
	Exec      ExecRunner
	Env       EnvManager
	FS        FileSystem
	Out       io.Writer
	ErrOut    io.Writer
	CheckRoot func() error
	Prompter  Prompter
}

// NewRestoreCmd creates the "restore" command.
func NewRestoreCmd(runner *RestoreRunner) *cobra.Command {
	production := runner == nil
	if runner == nil {
		runner = &RestoreRunner{
			Exec:      &execRunner{},
			Env:       NewFileEnvManager(),
			FS:        &osFileSystem{},
			CheckRoot: requireRoot,
		}
	}
	return &cobra.Command{
		Use:   "restore <archive.tar.gz>",
		Short: "Restore database and configuration from a backup archive",
		Long: `Restore the Heimdall Server database and configuration from a backup
archive created by 'heimdall-cli backup'. The archive is extracted to
a temporary directory, backend.env is restored with proper ownership
(root:heimdall, mode 0640), and the database SQL dump is replayed
using psql.

The database credentials are read from the restored backend.env, so
the restore is self-contained. Private proxy configuration and certificate/CA
state are restored when present; older archives are accepted. RPM restores stop
the app and selected private proxy, and block app startup until successful setup
and migrations. PostgreSQL remains available for logical SQL restore. Requires root privileges.`,
		Example: `  # Restore from a backup archive
  sudo heimdall-cli restore /var/backups/heimdall/heimdall-backup-20260401-120000.tar.gz

  # Restore, migrate, and start selected services
  sudo heimdall-cli restore /tmp/heimdall-backup-20260401-120000.tar.gz && \
    sudo heimdall-cli setup --non-interactive`,
		Args: cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if production {
				runner.Paths = commandPaths(cmd)
				runner.Env = &FileEnvManager{Path: runner.Paths.EnvFile}
			}
			initIO(&runner.Out, &runner.ErrOut, cmd)
			return runner.Run(args[0])
		},
	}
}

// Run performs the restore from a .tar.gz archive.
func (r *RestoreRunner) Run(archive string) error {
	if r.CheckRoot != nil {
		if err := r.CheckRoot(); err != nil {
			return err
		}
	}
	if !r.FS.Exists(archive) {
		return fmt.Errorf("file not found: %s", archive)
	}

	// Confirmation prompt for destructive operation
	if r.Prompter != nil && r.Prompter.CanPrompt() {
		ok, err := r.Prompter.Confirm("Restore will overwrite current config and database. Continue?", false)
		if err != nil {
			return err
		}
		if !ok {
			fmt.Fprintln(r.Out, "Restore cancelled.")
			return nil
		}
	}

	// Archive parsing and destination validation happen before stopping services
	// or changing any installed configuration/state.
	info, err := r.FS.Lstat(archive)
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() {
		return fmt.Errorf("archive must be a regular file")
	}
	tmpDir, err := os.MkdirTemp("", "heimdall-restore-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(tmpDir)
	tmpDir, err = filepath.EvalSymlinks(tmpDir)
	if err != nil {
		return err
	}
	restoreDir, err := extractRecoveryArchive(archive, tmpDir)
	if err != nil {
		return fmt.Errorf("failed to extract archive: %w", err)
	}
	envBackup := filepath.Join(restoreDir, "backend.env")
	content, err := os.ReadFile(envBackup)
	if err != nil {
		return fmt.Errorf("failed to read restored config: %w", err)
	}
	env := ParseEnv(string(content))
	dbCfg, err := resolveDBConfig(env)
	if err != nil {
		return err
	}
	sqlBackup := filepath.Join(restoreDir, "database.sql")
	_, sqlErr := os.Stat(sqlBackup)
	hasSQL := sqlErr == nil
	rpm, err := r.Paths.hasRuntime(r.FS)
	if err != nil {
		return err
	}
	if hasSQL && dbCfg.Password == "" {
		return fmt.Errorf("cannot restore database.sql without a password in restored config")
	}
	envDest := r.Env.GetEnvFilePath()
	if err := safeManagedPath(r.FS, envDest); err != nil {
		return err
	}
	config := r.Paths.ConfigDir
	if config == "" {
		config = ConfigDir
	}
	pending := filepath.Join(config, "upgrade-pending")
	if rpm {
		if err := safeManagedPath(r.FS, pending); err != nil {
			return err
		}
	}
	trees := map[string]string{}
	for name, dest := range recoveryTrees(r.Paths) {
		source := filepath.Join(restoreDir, name)
		if _, err := os.Stat(source); os.IsNotExist(err) {
			continue
		} else if err != nil {
			return err
		}
		// Validate the existing tree too: recursive ownership must never follow a link.
		if _, err := r.FS.Lstat(dest); err == nil {
			if err := walkRecoveryTree(r.FS, dest, func(string, os.FileInfo) error { return nil }); err != nil {
				return err
			}
		} else if !os.IsNotExist(err) {
			return err
		}
		if err := walkRecoveryTree(&osFileSystem{}, source, func(path string, info os.FileInfo) error {
			rel, err := filepath.Rel(source, path)
			if err != nil {
				return err
			}
			target := filepath.Join(dest, rel)
			if info.IsDir() {
				target = filepath.Join(target, ".heimdall-recovery-check")
			}
			return safeManagedPath(r.FS, target)
		}); err != nil {
			return err
		}
		trees[name] = source
	}
	binary := ""
	if hasSQL {
		binary, err = postgresClient(r.Paths, r.FS, "psql")
		if err != nil {
			return err
		}
		if rpm {
			if err := checkPostgresServer(r.Exec, r.Paths, r.FS, dbCfg); err != nil {
				return fmt.Errorf("cannot restore database: %w; newer servers require a heimdall-server RPM with compatible PostgreSQL clients", err)
			}
		}
	}
	if rpm {
		existing, err := r.Env.ReadEnv()
		if err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("reading current selections: %w", err)
		}
		if err := r.FS.WriteFile(pending, []byte("Restore requires successful setup and migrations.\n"), 0600); err != nil {
			return err
		}
		if err := recoveryPermissions(r.Exec, pending, "root:root", 0600); err != nil {
			return err
		}
		if err := runChecked(r.Exec, "systemctl", "stop", ServiceName); err != nil {
			return err
		}
		proxyUnit := ""
		switch existing["HEIMDALL_PROXY_MODE"] {
		case "bundled":
			proxyUnit = bundledCaddyService
		case "nginx":
			proxyUnit = bundledNginxService
		}
		if proxyUnit != "" {
			args := []string{"stop", proxyUnit}
			if existing["HEIMDALL_PROXY_MODE"] != env["HEIMDALL_PROXY_MODE"] {
				args = []string{"disable", "--now", proxyUnit}
			}
			if err := runChecked(r.Exec, "systemctl", args...); err != nil {
				return err
			}
		}
	}
	// Tighten an existing destination before it receives restored secrets.
	if _, err := r.FS.Lstat(envDest); err == nil {
		if err := recoveryPermissions(r.Exec, envDest, "root:heimdall", 0640); err != nil {
			return err
		}
	} else if !os.IsNotExist(err) {
		return err
	}
	if err := r.FS.CopyFile(envBackup, envDest); err != nil {
		return fmt.Errorf("failed to restore config: %w", err)
	}
	if err := recoveryPermissions(r.Exec, envDest, "root:heimdall", 0640); err != nil {
		return err
	}
	fmt.Fprintln(r.Out, "Config:   restored")
	for name, source := range trees {
		if err := r.restoreRecoveryTree(source, recoveryTrees(r.Paths)[name], name); err != nil {
			return fmt.Errorf("restoring %s: %w", name, err)
		}
	}

	if hasSQL {
		_, code, err := r.Exec.RunWithEnv(dbCfg.PgEnv(), binary, "-h", dbCfg.Host, "-p", dbCfg.PortStr(), "-U", dbCfg.User, "-d", dbCfg.DBName, "-X", "-v", "ON_ERROR_STOP=1", "-f", sqlBackup)
		if err != nil || code != 0 {
			fmt.Fprintln(r.ErrOut, "Database: restore FAILED")
			return fmt.Errorf("failed to restore database: psql exited with status %d: %v", code, err)
		}
		fmt.Fprintln(r.Out, "Database: restored")
	} else {
		fmt.Fprintln(r.Out, "Legacy archive restored configuration only; current database data was not changed.")
	}
	fmt.Fprintln(r.Out, "Run successful setup and migrations before starting the app: sudo heimdall-cli setup --non-interactive")
	return nil
}

// Never write or change metadata through proxy-owned descendants. Prepare a
// complete replacement beneath a root-only sibling, then move directory entries.
// The protected parent remains root-owned even after its child belongs to the proxy.
func (r *RestoreRunner) restoreRecoveryTree(source, dest, kind string) (result error) {
	parent := filepath.Dir(dest)
	output, code, err := r.Exec.Run("mktemp", "-d", filepath.Join(parent, ".heimdall-restore.XXXXXX"))
	if err != nil || code != 0 {
		return fmt.Errorf("creating private restore staging (exit %d): %v", code, err)
	}
	staging := strings.TrimSpace(output)
	if filepath.Dir(staging) != parent || !strings.HasPrefix(filepath.Base(staging), ".heimdall-restore.") {
		return fmt.Errorf("invalid restore staging path: %q", staging)
	}
	retain := false
	defer func() {
		if !retain {
			if err := r.FS.RemoveAll(staging); err != nil {
				result = errors.Join(result, fmt.Errorf("removing restore staging %s: %w", staging, err))
				retain = true
			}
		}
		if retain {
			fmt.Fprintf(r.ErrOut, "Restore staging retained for recovery: %s\n", staging)
		}
	}()
	if err := recoveryPermissions(r.Exec, staging, "root:root", 0700); err != nil {
		return err
	}
	replacement := filepath.Join(staging, "restored")
	if err := walkRecoveryTree(&osFileSystem{}, source, func(path string, info os.FileInfo) error {
		rel, err := filepath.Rel(source, path)
		if err != nil {
			return err
		}
		target := filepath.Join(replacement, rel)
		owner, mode := "heimdall-caddy:heimdall-caddy", os.FileMode(0600)
		if info.IsDir() {
			mode = 0700
		}
		if kind == "caddy-config" || kind == "nginx-config" {
			owner = "root:heimdall-caddy"
			if kind == "nginx-config" {
				owner = "root:heimdall-nginx"
			}
			mode = info.Mode().Perm() & 0640
			if info.IsDir() {
				mode = 0750
			}
		}
		if info.IsDir() {
			err = r.FS.MkdirAll(target, mode)
		} else {
			err = r.FS.CopyFile(path, target)
		}
		if err != nil {
			return err
		}
		return recoveryPermissions(r.Exec, target, owner, mode)
	}); err != nil {
		return err
	}
	previous := filepath.Join(staging, "previous")
	moved := false
	if err := r.FS.Rename(dest, previous); err == nil {
		moved = true
	} else if !os.IsNotExist(err) {
		retain = true
		return fmt.Errorf("retaining previous tree: %w", err)
	}
	if err := r.FS.Rename(replacement, dest); err != nil {
		retain = true
		if moved {
			if rollback := r.FS.Rename(previous, dest); rollback != nil {
				return errors.Join(fmt.Errorf("publishing restored tree: %w", err), fmt.Errorf("restoring previous tree from %s: %w", previous, rollback))
			}
		}
		return fmt.Errorf("publishing restored tree: %w", err)
	}
	// Removing an entry never follows a symlink moved out of the old tree.
	if moved {
		if err := r.FS.RemoveAll(previous); err != nil {
			retain = true
			return fmt.Errorf("removing previous tree retained at %s: %w", previous, err)
		}
	}
	return nil
}

func recoveryPermissions(exec ExecRunner, path, owner string, mode os.FileMode) error {
	if err := runChecked(exec, "chmod", fmt.Sprintf("%04o", mode), path); err != nil {
		return err
	}
	return runChecked(exec, "chown", owner, path)
}

// Stream regular files into an empty private directory. Never ask tar to interpret
// links, special files, duplicate entries or traversal paths as root.
func extractRecoveryArchive(archive, dest string) (string, error) {
	file, err := os.Open(archive)
	if err != nil {
		return "", err
	}
	defer file.Close()
	gz, err := gzip.NewReader(file)
	if err != nil {
		return "", err
	}
	defer gz.Close()
	reader := tar.NewReader(gz)
	seen := map[string]bool{}
	for {
		header, err := reader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", err
		}
		name := strings.TrimPrefix(header.Name, "./")
		name = strings.TrimSuffix(name, "/")
		if name == "." || name == "" {
			if header.Typeflag == tar.TypeDir {
				continue
			}
			return "", fmt.Errorf("invalid empty archive path")
		}
		if filepath.IsAbs(name) || strings.Contains(name, "\\") || filepath.Clean(name) != name || name == ".." || strings.HasPrefix(name, "../") {
			return "", fmt.Errorf("unsafe archive path: %s", header.Name)
		}
		if seen[name] {
			return "", fmt.Errorf("duplicate archive path: %s", name)
		}
		seen[name] = true
		target := filepath.Join(dest, name)
		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(target, 0700); err != nil {
				return "", err
			}
		case tar.TypeReg:
			if err := os.MkdirAll(filepath.Dir(target), 0700); err != nil {
				return "", err
			}
			out, err := os.OpenFile(target, os.O_WRONLY|os.O_CREATE|os.O_EXCL, os.FileMode(header.Mode)&0640)
			if err != nil {
				return "", err
			}
			if err := out.Chmod(os.FileMode(header.Mode) & 0640); err != nil {
				out.Close()
				return "", err
			}
			_, copyErr := io.Copy(out, reader)
			closeErr := out.Close()
			if copyErr != nil {
				return "", copyErr
			}
			if closeErr != nil {
				return "", closeErr
			}
		default:
			return "", fmt.Errorf("unsupported archive entry (links and special files are forbidden): %s", name)
		}
	}
	// Consume the gzip trailer to detect truncated archives or checksum failures.
	if _, err := io.Copy(io.Discard, gz); err != nil {
		return "", err
	}
	root := dest
	if _, err := os.Stat(filepath.Join(root, "backend.env")); os.IsNotExist(err) {
		entries, err := os.ReadDir(root)
		if err != nil {
			return "", err
		}
		if len(entries) != 1 || !entries[0].IsDir() {
			return "", fmt.Errorf("archive must contain backend.env in one backup directory")
		}
		root = filepath.Join(root, entries[0].Name())
	}
	err = filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		if rel == "." {
			return nil
		}
		top := strings.Split(rel, string(filepath.Separator))[0]
		switch top {
		case "backend.env", "database.sql":
			if rel != top || !entry.Type().IsRegular() {
				return fmt.Errorf("invalid archive file: %s", rel)
			}
		case "caddy-config", "caddy-state", "nginx-config":
			if rel == top && !entry.IsDir() {
				return fmt.Errorf("invalid archive directory: %s", rel)
			}
		default:
			return fmt.Errorf("unexpected archive path: %s", rel)
		}
		return nil
	})
	if err != nil {
		return "", err
	}
	if info, err := os.Stat(filepath.Join(root, "backend.env")); err != nil || !info.Mode().IsRegular() {
		return "", fmt.Errorf("archive requires regular backend.env")
	}
	return root, nil
}
