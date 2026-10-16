package cmd

import (
	"crypto/rand"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/spf13/cobra"
	"golang.org/x/sys/unix"
)

// BackupRunner implements the backup command.
type BackupRunner struct {
	Paths     Paths
	Exec      ExecRunner
	Env       EnvManager
	FS        FileSystem
	Out       io.Writer
	ErrOut    io.Writer
	CheckRoot func() error
}

// NewBackupCmd creates the "backup" command.
func NewBackupCmd(runner *BackupRunner) *cobra.Command {
	production := runner == nil
	if runner == nil {
		runner = &BackupRunner{
			Exec:      &execRunner{},
			Env:       NewFileEnvManager(),
			FS:        &osFileSystem{},
			CheckRoot: requireRoot,
		}
	}
	var outputDir string

	cmd := &cobra.Command{
		Use:   "backup",
		Short: "Backup database and configuration to a timestamped archive",
		Long: `Create a backup of the Heimdall Server database and configuration. The
backup includes a pg_dump of the PostgreSQL database and a copy of the
backend.env configuration file. Private proxy configuration and certificate/CA
state are included when present. These are packaged into a private (0600), timestamped
tar.gz archive named heimdall-backup-YYYYMMDD-HHMMSS.tar.gz.

The database backup requires a password in DATABASE_PASSWORD or DATABASE_URL.
RPM installations require a successful database dump and PostgreSQL 13–18.
A newer server requires an RPM with compatible clients. Standalone installations
without a password retain configuration-only backups. Requires root privileges.`,
		Example: `  # Create a backup in the current directory
  sudo heimdall-cli backup

  # Create a backup in a specific directory
  sudo heimdall-cli backup --output /var/backups/heimdall

  # Create a backup before upgrading
  sudo heimdall-cli backup -o /tmp && sudo dnf upgrade heimdall-server`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if production {
				runner.Paths = commandPaths(cmd)
				runner.Env = &FileEnvManager{Path: runner.Paths.EnvFile}
			}
			initIO(&runner.Out, &runner.ErrOut, cmd)
			if production && !cmd.Flags().Changed("output") {
				outputDir = filepath.Join(runner.Paths.DataDir, "backups")
			}
			return runner.Run(outputDir)
		},
	}

	cmd.Flags().StringVarP(&outputDir, "output", "o", DataDir+"/backups", "Output directory for backup archive")
	return cmd
}

// Run performs the backup.
func (r *BackupRunner) Run(outputDir string) (err error) {
	if r.CheckRoot != nil {
		if err := r.CheckRoot(); err != nil {
			return err
		}
	}
	env, err := r.Env.ReadEnv()
	if err != nil {
		return fmt.Errorf("failed to read env: %w", err)
	}

	rpm, err := r.Paths.hasRuntime(r.FS)
	if err != nil {
		return err
	}
	dbCfg, err := resolveDBConfig(env)
	if err != nil {
		return err
	}
	if rpm && dbCfg.Password == "" {
		return fmt.Errorf("RPM backup requires a database password and a successful database dump; run setup before backing up")
	}
	binary, err := postgresClient(r.Paths, r.FS, "pg_dump")
	if err != nil {
		return err
	}

	// Validate output directory to prevent path traversal
	if !filepath.IsAbs(outputDir) {
		return fmt.Errorf("output directory must be absolute path, got: %s", outputDir)
	}
	if strings.Contains(outputDir, "..") {
		return fmt.Errorf("output directory must not contain path traversal (..): %s", outputDir)
	}

	if err := safeManagedPath(r.FS, filepath.Join(outputDir, ".heimdall-backup-check")); err != nil {
		return err
	}
	envPath := r.Env.GetEnvFilePath()
	if err := requireRegular(r.FS, envPath); err != nil {
		return fmt.Errorf("failed to back up config: %w", err)
	}
	trees := map[string]string{}
	if rpm {
		trees, err = r.recoverySources()
		if err != nil {
			return err
		}
		if err := checkPostgresServer(r.Exec, r.Paths, r.FS, dbCfg); err != nil {
			return fmt.Errorf("cannot back up database: %w; newer servers require a heimdall-server RPM with compatible PostgreSQL clients", err)
		}
	}
	ts := time.Now().Format("20060102-150405")
	backupName := "heimdall-backup-" + ts
	archive := filepath.Join(outputDir, backupName+".tar.gz")
	if err := safeManagedPath(r.FS, archive); err != nil {
		return err
	}
	if _, err := r.FS.Lstat(archive); err == nil {
		return fmt.Errorf("backup archive already exists: %s", archive)
	} else if !os.IsNotExist(err) {
		return err
	}
	// Keep all path-consuming copies, pg_dump and tar below trusted ancestry.
	// A 0700 child under the app-owned output directory does not protect its name.
	output, err := openBackupOutput(outputDir, true)
	if err != nil {
		return fmt.Errorf("opening backup output: %w", err)
	}
	defer output.Close()
	staging, err := backupWorkspace()
	if err != nil {
		return err
	}
	keepArchive, archiveReady := false, false
	temporaryArchive := ""
	defer func() {
		if cleanupErr := r.FS.RemoveAll(staging); cleanupErr != nil {
			err = errors.Join(err, fmt.Errorf("cleaning backup workspace %s: %w", staging, cleanupErr))
			keepArchive = archiveReady
		}
		if !keepArchive && temporaryArchive != "" {
			if cleanupErr := os.Remove(temporaryArchive); cleanupErr != nil {
				err = errors.Join(err, fmt.Errorf("cleaning private archive %s: %w", temporaryArchive, cleanupErr))
				keepArchive = archiveReady
			}
		}
		if err == nil {
			fmt.Fprintf(r.Out, "\nBackup saved to: %s\n", archive)
		} else if keepArchive {
			err = fmt.Errorf("%w; completed private archive retained at %s", err, temporaryArchive)
		}
	}()
	backupDir := filepath.Join(staging, backupName)
	if err := r.FS.MkdirAll(backupDir, 0700); err != nil {
		return fmt.Errorf("failed to create backup directory: %w", err)
	}

	// Copy backend.env
	if err := r.FS.CopyFile(envPath, filepath.Join(backupDir, recoveryEnvFile)); err != nil {
		fmt.Fprintf(r.ErrOut, "Config:   copy failed: %v\n", err)
		return fmt.Errorf("failed to back up config: %w", err)
	}
	if err := runChecked(r.Exec, "chmod", "0600", filepath.Join(backupDir, recoveryEnvFile)); err != nil {
		return err
	}
	for name, source := range trees {
		if err := r.backupRecoveryTree(backupDir, name, source); err != nil {
			return err
		}
	}
	fmt.Fprintln(r.Out, "Config:   backed up")

	if err := r.backupDatabase(dbCfg, binary, backupDir); err != nil {
		return err
	}

	// Keep the archive separate so a partial workspace cleanup cannot destroy
	// completed recovery evidence. The validated temp parent protects its name.
	archiveFile, err := os.CreateTemp(filepath.Dir(staging), ".heimdall-backup-*.tar.gz")
	if err != nil {
		return err
	}
	temporaryArchive = archiveFile.Name()
	if err := archiveFile.Close(); err != nil {
		return err
	}
	if err := r.createBackupArchive(temporaryArchive, staging, backupName); err != nil {
		return err
	}

	keepArchive, archiveReady = true, true
	if err := backupOutputUnchanged(outputDir, output); err != nil {
		return err
	}
	input, err := os.Open(temporaryArchive)
	if err != nil {
		return err
	}
	defer input.Close()
	if err := publishBackupArchive(output, filepath.Base(archive), input); err != nil {
		return fmt.Errorf("publishing backup archive: %w", err)
	}
	if err := backupOutputUnchanged(outputDir, output); err != nil {
		return err
	}
	keepArchive = false
	return nil
}

// Only these Heimdall-owned trees supplement the logical SQL backup.
func recoveryTrees(paths Paths) map[string]string {
	config := paths.ConfigDir
	if config == "" {
		config = ConfigDir
	}
	return map[string]string{"caddy-config": filepath.Join(config, "caddy"), "caddy-state": "/var/lib/heimdall-caddy", recoveryNginxConfig: filepath.Join(config, "nginx")}
}

// Validate every object, including all directory ancestors, without following links.
func walkRecoveryTree(fs FileSystem, root string, visit func(string, os.FileInfo) error) error {
	info, err := fs.Lstat(root)
	if err != nil {
		return err
	}
	check := root
	if info.IsDir() {
		check = filepath.Join(root, ".heimdall-recovery-check")
	}
	if err := safeManagedPath(fs, check); err != nil {
		return err
	}
	if err := visit(root, info); err != nil {
		return err
	}
	if !info.IsDir() {
		return nil
	}
	entries, err := fs.ReadDir(root)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if err := walkRecoveryTree(fs, filepath.Join(root, entry.Name()), visit); err != nil {
			return err
		}
	}
	return nil
}

// These paths are used by subprocesses, so every ancestor must prevent another
// account from renaming our private workspace. Sticky temp directories are safe
// when their owner is trusted, just like root's own 0700 directories.
func backupWorkspace() (string, error) {
	parent, err := filepath.EvalSymlinks(os.TempDir())
	if err != nil {
		return "", err
	}
	for path := parent; ; path = filepath.Dir(path) {
		info, err := os.Lstat(path)
		if err != nil {
			return "", err
		}
		stat, ok := info.Sys().(*syscall.Stat_t)
		if !info.IsDir() || !ok || (stat.Uid != 0 && stat.Uid != uint32(os.Geteuid())) ||
			(info.Mode().Perm()&0022 != 0 && info.Mode()&os.ModeSticky == 0) {
			return "", fmt.Errorf("backup temporary directory has unprotected ancestry: %s", path)
		}
		if path == filepath.Dir(path) {
			break
		}
	}
	return os.MkdirTemp(parent, ".heimdall-backup-")
}

// Open each component without following links. Held descriptors continue to
// identify the intended directory if its app-owned name or an ancestor moves.
func openBackupOutput(path string, create bool) (*os.File, error) {
	dir, err := os.Open(string(os.PathSeparator))
	if err != nil {
		return nil, err
	}
	for _, component := range strings.Split(strings.TrimPrefix(filepath.Clean(path), "/"), "/") {
		if component == "" {
			continue
		}
		fd, err := unix.Openat(int(dir.Fd()), component, unix.O_RDONLY|unix.O_DIRECTORY|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0)
		if errors.Is(err, unix.ENOENT) && create {
			if err = unix.Mkdirat(int(dir.Fd()), component, 0700); err == nil || errors.Is(err, unix.EEXIST) {
				fd, err = unix.Openat(int(dir.Fd()), component, unix.O_RDONLY|unix.O_DIRECTORY|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0)
			}
		}
		dir.Close()
		if err != nil {
			return nil, fmt.Errorf("%s: %w", path, err)
		}
		dir = os.NewFile(uintptr(fd), component)
	}
	return dir, nil
}

func backupOutputUnchanged(path string, original *os.File) error {
	current, err := openBackupOutput(path, false)
	if err != nil {
		return fmt.Errorf("backup output changed: %w", err)
	}
	defer current.Close()
	before, err := original.Stat()
	if err != nil {
		return err
	}
	after, err := current.Stat()
	if err != nil {
		return err
	}
	if !os.SameFile(before, after) {
		return fmt.Errorf("backup output directory changed: %s", path)
	}
	return nil
}

// Copy to the output filesystem through a private directory descriptor, then
// atomically link the finished inode into place without overwriting any entry.
// os.Root cannot link between two independently held roots; linkat can.
func publishBackupArchive(output *os.File, name string, input io.Reader) (err error) {
	parentFD := int(output.Fd())
	container := ".heimdall-publish-" + rand.Text()
	if err := unix.Mkdirat(parentFD, container, 0700); err != nil {
		return err
	}
	fd, err := unix.Openat(parentFD, container, unix.O_RDONLY|unix.O_DIRECTORY|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0)
	if err != nil {
		return fmt.Errorf("opening private publication directory %s (retained): %w", container, err)
	}
	dir := os.NewFile(uintptr(fd), container)
	defer dir.Close()
	info, err := dir.Stat()
	if err != nil {
		return err
	}
	stat, ok := info.Sys().(*syscall.Stat_t)
	if !ok || stat.Uid != uint32(os.Geteuid()) || info.Mode().Perm() != 0700 {
		return fmt.Errorf("private publication directory changed: %s (retained)", container)
	}
	defer func() {
		if cleanupErr := removeBackupPublication(output, dir, container); cleanupErr != nil {
			err = errors.Join(err, cleanupErr)
		}
	}()
	fileFD, err := unix.Openat(fd, "archive", unix.O_WRONLY|unix.O_CREAT|unix.O_EXCL|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0600)
	if err != nil {
		return err
	}
	file := os.NewFile(uintptr(fileFD), "archive")
	defer func() {
		if cleanupErr := unix.Unlinkat(fd, "archive", 0); cleanupErr != nil {
			err = errors.Join(err, fmt.Errorf("cleaning private publication file in %s: %w", container, cleanupErr))
		}
	}()
	// Metadata is applied to the new inode, never to an app-controlled pathname.
	copyErr := file.Chmod(0600)
	if copyErr == nil {
		_, copyErr = io.Copy(file, input)
	}
	if copyErr == nil {
		copyErr = file.Sync()
	}
	written, statErr := file.Stat()
	closeErr := file.Close()
	if err := errors.Join(copyErr, statErr, closeErr); err != nil {
		return err
	}
	if err := unix.Linkat(fd, "archive", parentFD, name, 0); err != nil {
		return err
	}
	publishedFD, err := unix.Openat(parentFD, name, unix.O_RDONLY|unix.O_NOFOLLOW|unix.O_NONBLOCK|unix.O_CLOEXEC, 0)
	if err != nil {
		return fmt.Errorf("published archive changed: %w", err)
	}
	published := os.NewFile(uintptr(publishedFD), name)
	defer published.Close()
	info, err = published.Stat()
	if err != nil {
		return err
	}
	if !os.SameFile(written, info) {
		return fmt.Errorf("published archive entry changed: %s", name)
	}
	return nil
}

func removeBackupPublication(output, dir *os.File, name string) error {
	fd, err := unix.Openat(int(output.Fd()), name, unix.O_RDONLY|unix.O_DIRECTORY|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0)
	if err != nil {
		return fmt.Errorf("publication directory changed; entry %s retained: %w", name, err)
	}
	current := os.NewFile(uintptr(fd), name)
	defer current.Close()
	before, err := dir.Stat()
	if err != nil {
		return err
	}
	after, err := current.Stat()
	if err != nil {
		return err
	}
	if !os.SameFile(before, after) {
		return fmt.Errorf("publication directory changed; entry %s retained", name)
	}
	// A final name race can only remove an empty directory in this held output
	// namespace. AT_REMOVEDIR cannot follow links or delete replacement contents.
	if err := unix.Unlinkat(int(output.Fd()), name, unix.AT_REMOVEDIR); err != nil {
		return fmt.Errorf("cleaning publication directory %s: %w", name, err)
	}
	return nil
}

func (r *BackupRunner) recoverySources() (map[string]string, error) {
	trees := map[string]string{}
	for name, source := range recoveryTrees(r.Paths) {
		if info, err := r.FS.Lstat(source); os.IsNotExist(err) {
			continue
		} else if err != nil {
			return nil, err
		} else if !info.IsDir() {
			return nil, fmt.Errorf("expected private proxy directory: %s", source)
		}
		if err := walkRecoveryTree(r.FS, source, func(string, os.FileInfo) error { return nil }); err != nil {
			return nil, err
		}
		trees[name] = source
	}
	return trees, nil
}

func (r *BackupRunner) backupRecoveryTree(backupDir, name, source string) error {
	canonical, err := r.FS.EvalSymlinks(source)
	if err != nil {
		return err
	}
	root, err := os.OpenRoot(canonical)
	if err != nil {
		return err
	}
	defer root.Close()
	if err := walkRecoveryTree(r.FS, source, func(path string, info os.FileInfo) error {
		return r.copyRecoveryEntry(root, source, backupDir, name, path, info)
	}); err != nil {
		return fmt.Errorf("backing up %s: %w", name, err)
	}
	return nil
}

func (r *BackupRunner) copyRecoveryEntry(root *os.Root, source, backupDir, name, path string, info os.FileInfo) error {
	rel, err := filepath.Rel(source, path)
	if err != nil {
		return err
	}
	dest := filepath.Join(backupDir, name, rel)
	if info.IsDir() {
		return r.FS.MkdirAll(dest, 0700)
	}
	// The descriptor stays beneath the owned source even if the proxy swaps
	// a descendant after preflight. Never copy an outside hard-link inode.
	input, err := root.Open(rel)
	if err != nil {
		return err
	}
	defer input.Close()
	opened, err := input.Stat()
	if err != nil {
		return err
	}
	if !opened.Mode().IsRegular() {
		return fmt.Errorf("unexpected backup source: %s", path)
	}
	if stat, ok := opened.Sys().(*syscall.Stat_t); ok && stat.Nlink > 1 {
		return fmt.Errorf("hard-linked backup source: %s", path)
	}
	output, err := os.OpenFile(dest, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(output, input)
	closeErr := output.Close()
	if copyErr != nil {
		return copyErr
	}
	if closeErr != nil {
		return closeErr
	}
	mode := os.FileMode(0600)
	if name == "caddy-config" || name == recoveryNginxConfig {
		mode = opened.Mode().Perm() & 0640
	}
	return runChecked(r.Exec, "chmod", fmt.Sprintf("%04o", mode), dest)
}

func (r *BackupRunner) backupDatabase(dbCfg DBConfig, binary, backupDir string) error {
	if dbCfg.Password != "" {
		dumpFile := filepath.Join(backupDir, "database.sql")
		pgEnv := dbCfg.PgEnv()
		_, exitCode, err := r.Exec.RunWithEnv(pgEnv, binary,
			"-h", dbCfg.Host, "-p", dbCfg.PortStr(), "-U", dbCfg.User, dbCfg.DBName, "-f", dumpFile)
		if err != nil || exitCode != 0 {
			fmt.Fprintln(r.ErrOut, "Database: backup FAILED")
			if err != nil {
				return fmt.Errorf("failed to back up database: %w", err)
			}
			return fmt.Errorf("failed to back up database: pg_dump exited with status %d", exitCode)
		} else {
			fmt.Fprintln(r.Out, "Database: backed up")
		}
	} else {
		fmt.Fprintln(r.Out, "Database: skipped (no password configured)")
	}

	return nil
}

func (r *BackupRunner) createBackupArchive(temporaryArchive, staging, backupName string) error {
	if err := runChecked(r.Exec, "chmod", "0600", temporaryArchive); err != nil {
		return err
	}
	_, exitCode, err := r.Exec.RunWithEnv(map[string]string{"COPYFILE_DISABLE": "1"}, "tar", "czf", temporaryArchive, "-C", staging, backupName)
	if err != nil || exitCode != 0 {
		fmt.Fprintln(r.ErrOut, "Archive creation failed")
		return fmt.Errorf("failed to create archive")
	}

	return nil
}
