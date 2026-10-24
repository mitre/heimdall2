package cmd

import (
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/lib/pq"
)

const (
	postgresLoopback       = "127.0.0.1"
	postgresHBAFileName    = "pg_hba.conf"
	postgresHBAFile        = "/" + postgresHBAFileName
	psqlStopOnError        = "ON_ERROR_STOP=1"
	psqlUserVariable       = "db_user="
	postgresConfigFileName = "postgresql.conf"
	postgresConfigFile     = "/" + postgresConfigFileName
	postgresVersionFile    = "/PG_VERSION"
)

// PostgresBootstrapRunner replaces heimdall-postgres-setup.sh with a
// native Go implementation. It probes for a PostgreSQL installation
// (PGDG 13+ or system), initializes the data directory if needed,
// hardens pg_hba.conf and postgresql.conf for SCRAM-SHA-256, starts
// the service, and creates the application role + database.
//
// All operations are idempotent: re-running against an already-set-up
// system leaves it unchanged.
type PostgresBootstrapRunner struct {
	Exec    ExecRunner
	FS      FileSystem
	Systemd SystemdRunner
	Out     io.Writer

	Paths        Paths
	DatabaseMode string

	DBHost     string
	DBPort     int
	DBUser     string
	DBPassword string
	DBName     string
}

// Run executes the full bootstrap. Safe to call repeatedly — every step
// is idempotent.
func (r *PostgresBootstrapRunner) Run() error {
	if r.DatabaseMode == "external" {
		return nil
	}
	if err := r.validateInputs(); err != nil {
		return err
	}
	bundled, err := r.Paths.hasRuntime(r.FS)
	if err != nil {
		return err
	}
	if bundled {
		if r.DatabaseMode != "bundled" {
			return fmt.Errorf("explicit database ownership is required for the RPM runtime")
		}
		return r.runBundled()
	}
	if r.isRemoteHost() {
		fmt.Fprintf(r.Out,
			"DATABASE_HOST=%s; skipping local PostgreSQL bootstrap.\n", r.DBHost)
		return nil
	}

	install, err := r.detectPG()
	if err != nil {
		return err
	}
	fmt.Fprintf(r.Out, "Detected PostgreSQL %d (%s)\n", install.Major, install.PsqlBin)

	if err := r.ensureDataDir(install); err != nil {
		return err
	}
	if err := r.configureHBA(install); err != nil {
		return err
	}
	if err := r.configurePasswordEncryption(install); err != nil {
		return err
	}
	if err := r.startService(install); err != nil {
		return err
	}
	if err := r.configureRole(install); err != nil {
		return err
	}
	if err := r.verifyPasswordFormat(install); err != nil {
		return err
	}
	if err := r.ensureDatabase(install); err != nil {
		return err
	}
	if err := r.testConnection(install); err != nil {
		return err
	}

	fmt.Fprintln(r.Out, "PostgreSQL bootstrap complete.")
	return nil
}

func (r *PostgresBootstrapRunner) validateInputs() error {
	if _, err := quoteHBARole(r.DBUser); err != nil {
		return err
	}
	if strings.TrimSpace(r.DBPassword) == "" {
		return fmt.Errorf("DATABASE_PASSWORD is required")
	}
	return nil
}

// isRemoteHost reports whether DBHost points anywhere other than this
// machine. For remote DBs we skip local bootstrap entirely.
func (r *PostgresBootstrapRunner) isRemoteHost() bool {
	return r.DBHost != postgresLoopback && r.DBHost != "localhost"
}

// pgInstall captures everything we need to know about a detected
// PostgreSQL installation to bootstrap it.
type pgInstall struct {
	InitdbBin string
	SocketDir string
	OSUser    string
	PsqlBin   string // absolute path to psql
	SetupBin  string // path to postgresql-setup (or postgresql-N-setup)
	Service   string // systemd unit name
	DataDir   string // cluster data directory
	Major     int    // major version (e.g. 16)
}

// pgdgVersions are the PGDG major versions probed in priority order
// (highest first). Update when a new PGDG release lands.
var pgdgVersions = []int{18, 17, 16, 15, 14, 13}

const minSupportedMajor = 13

// detectPG probes for a PostgreSQL installation. Prefers PGDG packages
// (versioned paths under /usr/pgsql-N) over the system psql.
func (r *PostgresBootstrapRunner) detectPG() (*pgInstall, error) {
	install := &pgInstall{}

	// 1. Probe PGDG paths in priority order.
	for _, ver := range pgdgVersions {
		path := fmt.Sprintf("/usr/pgsql-%d/bin/psql", ver)
		if r.FS.Exists(path) {
			install.PsqlBin = path
			install.SetupBin = fmt.Sprintf("/usr/pgsql-%d/bin/postgresql-%d-setup", ver, ver)
			install.Service = fmt.Sprintf("postgresql-%d", ver)
			install.DataDir = fmt.Sprintf("/var/lib/pgsql/%d/data", ver)
			break
		}
	}

	// 2. Fall back to system psql via PATH lookup.
	if install.PsqlBin == "" {
		stdout, code, err := r.Exec.Run("sh", "-c", `command -v "$1"`, "sh", "psql")
		if err != nil || code != 0 || strings.TrimSpace(stdout) == "" {
			return nil, fmt.Errorf(
				"psql not found; install a PostgreSQL client/server (>= %d) before running setup",
				minSupportedMajor)
		}
		install.PsqlBin = strings.TrimSpace(stdout)
		install.Service = "postgresql"
		install.DataDir = "/var/lib/pgsql/data"
		// Best-effort: locate the system postgresql-setup binary.
		if setupOut, setupCode, _ := r.Exec.Run("sh", "-c", `command -v "$1"`, "sh", "postgresql-setup"); setupCode == 0 {
			install.SetupBin = strings.TrimSpace(setupOut)
		}
	}

	// 3. Determine major version from `psql --version`.
	major, err := r.psqlMajorVersion(install.PsqlBin)
	if err != nil {
		return nil, err
	}
	install.Major = major

	// 4. Enforce minimum supported version.
	if install.Major < minSupportedMajor {
		return nil, fmt.Errorf(
			"PostgreSQL >= %d is required (detected: %d)",
			minSupportedMajor, install.Major)
	}

	return install, nil
}

// hbaMarker identifies the two localhost rules owned by Heimdall, including
// files created before managed rules were updated on subsequent setup runs.
const hbaMarker = "# Heimdall: password authentication for TCP connections from localhost"

func quoteHBARole(role string) (string, error) {
	if strings.TrimSpace(role) == "" {
		return "", fmt.Errorf("DATABASE_USERNAME is required")
	}
	if strings.ContainsAny(role, "\r\n\x00") {
		return "", fmt.Errorf("DATABASE_USERNAME must not contain line breaks or NUL bytes")
	}
	return `"` + strings.ReplaceAll(role, `"`, `""`) + `"`, nil
}

// configureHBA replaces only our rules and places them before existing rules,
// because PostgreSQL applies the first matching authentication rule.
func (r *PostgresBootstrapRunner) configureHBA(install *pgInstall) error {
	role, err := quoteHBARole(r.DBUser)
	if err != nil {
		return err
	}
	hbaPath := install.DataDir + postgresHBAFile
	files, err := r.FS.OpenPostgresData(install.DataDir)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	defer files.Close()
	data, err := files.ReadFile(postgresHBAFileName)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("reading %s: %w", hbaPath, err)
	}
	lines := strings.Split(string(data), "\n")
	preserved := make([]string, 0, len(lines))
	for i := 0; i < len(lines); i++ {
		if strings.TrimSpace(lines[i]) != hbaMarker {
			preserved = append(preserved, lines[i])
			continue
		}
		i += managedHBARuleCount(lines[i+1:])
	}
	block := fmt.Sprintf("%s\nhost    all    %s    127.0.0.1/32    scram-sha-256\nhost    all    %s    ::1/128         scram-sha-256", hbaMarker, role, role)
	insert := 0
	for insert < len(preserved) {
		line := strings.TrimSpace(preserved[insert])
		if line != "" && !strings.HasPrefix(line, "#") {
			break
		}
		insert++
	}
	out := append([]string{}, preserved[:insert]...)
	out = append(out, block)
	out = append(out, preserved[insert:]...)
	updated := strings.Join(out, "\n")
	if updated == string(data) {
		return nil
	}
	return files.WriteFile(postgresHBAFileName, []byte(updated))
}

// managedHBARuleCount recognizes at most the two same-role rules after our marker.
func managedHBARuleCount(lines []string) int {
	var ownedRole string
	count := 0
	for count < 2 && count < len(lines) {
		line := strings.TrimSpace(lines[count])
		const prefix = "host    all    "
		if !strings.HasPrefix(line, prefix) {
			break
		}
		var suffix string
		for _, candidate := range []string{"    127.0.0.1/32    scram-sha-256", "    ::1/128         scram-sha-256"} {
			if strings.HasSuffix(line, candidate) {
				suffix = candidate
			}
		}
		user := strings.TrimSuffix(strings.TrimPrefix(line, prefix), suffix)
		if suffix == "" || (count > 0 && user != ownedRole) {
			break
		}
		ownedRole = user
		count++
	}
	return count
}

// The password placeholder is replaced with a quoted SQL literal on stdin.
const roleSetupSQL = `ALTER SYSTEM SET password_encryption = 'scram-sha-256';
SELECT pg_reload_conf();

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_pass')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_user') \gexec
SELECT format('ALTER ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_pass') \gexec
SELECT format('ALTER ROLE %I CREATEDB', :'db_user') \gexec
`

// configureRole creates or updates the application's PostgreSQL role.
func (r *PostgresBootstrapRunner) configureRole(install *pgInstall) error {
	if strings.ContainsRune(r.DBPassword, 0) {
		return fmt.Errorf("DATABASE_PASSWORD must not contain NUL bytes")
	}
	args := append(r.adminPrefix(install), []string{
		"-v", psqlStopOnError,
		"-d", "postgres",
		"-v", psqlUserVariable + r.DBUser,
	}...)
	sql := strings.ReplaceAll(roleSetupSQL, ":'db_pass'", pq.QuoteLiteral(r.DBPassword))
	_, code, err := r.Exec.RunWithStdin(sql, "runuser", args...)
	if err != nil {
		return fmt.Errorf("running psql for role setup: %w", err)
	}
	if code != 0 {
		// psql errors can include the password-bearing SQL statement.
		return fmt.Errorf("psql role setup exited %d", code)
	}
	return nil
}

// passwordFormatSQL queries the stored password format for the configured
// role. We expect SCRAM-SHA-256$... — anything else (md5, plain, NULL)
// indicates the role was created with the wrong password_encryption
// setting and must be regenerated.
const passwordFormatSQL = `SELECT rolpassword FROM pg_authid WHERE rolname = :'db_user';
`

// verifyPasswordFormat asserts the application role's stored password
// hash is SCRAM-SHA-256. Catches scenarios where password_encryption was
// not yet scram when the role was created.
func (r *PostgresBootstrapRunner) verifyPasswordFormat(install *pgInstall) error {
	args := append(r.adminPrefix(install), []string{
		"-tA", // tuples-only, unaligned — clean single value
		"-v", psqlStopOnError,
		"-d", "postgres",
		"-v", psqlUserVariable + r.DBUser,
	}...)
	stdout, code, err := r.Exec.RunWithStdin(passwordFormatSQL, "runuser", args...)
	if err != nil {
		return fmt.Errorf("querying rolpassword: %w", err)
	}
	if code != 0 {
		return fmt.Errorf("psql rolpassword query exited %d: %s", code, strings.TrimSpace(stdout))
	}
	if !strings.HasPrefix(strings.TrimSpace(stdout), "SCRAM-SHA-256") {
		return fmt.Errorf(
			"role password is not stored as SCRAM-SHA-256 (got prefix %q); "+
				"check PostgreSQL password_encryption and recreate the role",
			truncate(stdout, 16))
	}
	return nil
}

// ensureDatabaseSQL creates the application database if it does not
// already exist. Idempotent; uses psql -v binding for safety.
const ensureDatabaseSQL = `SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') \gexec
`

// ensureDatabase creates the application database when missing.
func (r *PostgresBootstrapRunner) ensureDatabase(install *pgInstall) error {
	args := append(r.adminPrefix(install), []string{
		"-v", psqlStopOnError,
		"-d", "postgres",
		"-v", "db_name=" + r.DBName,
		"-v", psqlUserVariable + r.DBUser,
	}...)
	stdout, code, err := r.Exec.RunWithStdin(ensureDatabaseSQL, "runuser", args...)
	if err != nil {
		return fmt.Errorf("ensuring database: %w", err)
	}
	if code != 0 {
		return fmt.Errorf("psql CREATE DATABASE exited %d: %s", code, strings.TrimSpace(stdout))
	}
	return nil
}

// truncate returns at most n bytes of s — for safe inclusion in error
// messages where rolpassword could be long.
func truncate(s string, n int) string {
	s = strings.TrimSpace(s)
	if len(s) <= n {
		return s
	}
	return s[:n]
}

// testConnection performs a final round-trip via the configured user's
// password (matches what the application will do at startup). Verifies
// that pg_hba.conf scram entry, role password, and database creation
// all line up.
func (r *PostgresBootstrapRunner) testConnection(install *pgInstall) error {
	stdout, code, err := r.Exec.RunWithEnv(
		map[string]string{"PGPASSWORD": r.DBPassword},
		install.PsqlBin, "-X", "-h", r.DBHost, "-p", strconv.Itoa(r.DBPort),
		"-U", r.DBUser, "-d", pgDatabaseName(r.DBName), "-c", "SELECT 1",
	)
	if err != nil {
		return fmt.Errorf("password connection test: %w", err)
	}
	if code != 0 {
		return fmt.Errorf("password connection test exited %d: %s",
			code, strings.TrimSpace(stdout))
	}
	return nil
}

// configurePasswordEncryption ensures `password_encryption = scram-sha-256`
// is present in postgresql.conf. Idempotent: appends only when missing.
func (r *PostgresBootstrapRunner) configurePasswordEncryption(install *pgInstall) error {
	confPath := install.DataDir + postgresConfigFile
	files, err := r.FS.OpenPostgresData(install.DataDir)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	defer files.Close()
	data, err := files.ReadFile(postgresConfigFileName)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("reading %s: %w", confPath, err)
	}

	const directive = "password_encryption = scram-sha-256"
	for _, line := range strings.Split(string(data), "\n") {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "password_encryption") &&
			strings.Contains(trimmed, "scram-sha-256") &&
			!strings.HasPrefix(trimmed, "#") {
			return nil
		}
	}

	updated := string(data)
	if !strings.HasSuffix(updated, "\n") {
		updated += "\n"
	}
	updated += directive + "\n"

	return files.WriteFile(postgresConfigFileName, []byte(updated))
}

// startService enables and starts the PostgreSQL systemd unit. Tolerant
// to errors — many installs already have the service enabled at install
// time, and we should not abort bootstrap on those benign failures.
func (r *PostgresBootstrapRunner) startService(install *pgInstall) error {
	_ = r.Systemd.Enable(install.Service)
	_ = r.Systemd.Start(install.Service)
	return nil
}

// ensureDataDir initializes the PostgreSQL cluster if its data directory
// has not been set up yet. Idempotent: a present PG_VERSION file means
// the cluster exists and we leave it alone.
//
// PGDG packages ship a versioned setup binary that takes the bare
// `initdb` argument; the system postgresql-server package uses
// `--initdb` instead.
func (r *PostgresBootstrapRunner) ensureDataDir(install *pgInstall) error {
	if r.FS.Exists(install.DataDir + postgresVersionFile) {
		return nil
	}
	if install.SetupBin == "" {
		return fmt.Errorf("cannot initialize PostgreSQL cluster: setup utility not found")
	}
	arg := "--initdb"
	if strings.HasPrefix(install.Service, "postgresql-") {
		arg = "initdb"
	}
	if _, code, err := r.Exec.Run(install.SetupBin, arg); err != nil || code != 0 {
		return fmt.Errorf("running %s %s: exit %d, %w", install.SetupBin, arg, code, err)
	}
	return nil
}

// psqlMajorVersion runs `psql --version` and parses the major version.
// Output format: "psql (PostgreSQL) 16.4" → 16.
func (r *PostgresBootstrapRunner) psqlMajorVersion(psqlBin string) (int, error) {
	stdout, _, err := r.Exec.Run(psqlBin, "--version")
	if err != nil {
		return 0, fmt.Errorf("invoking %s --version: %w", psqlBin, err)
	}
	fields := strings.Fields(stdout)
	if len(fields) < 3 {
		return 0, fmt.Errorf("unexpected %s --version output: %q", psqlBin, stdout)
	}
	majorStr, _, _ := strings.Cut(fields[2], ".")
	major, err := strconv.Atoi(majorStr)
	if err != nil {
		return 0, fmt.Errorf("parsing major version from %q: %w", stdout, err)
	}
	return major, nil
}

const bundledPGData = "/var/lib/heimdall-postgresql/18/data"
const bundledPGSocket = "/run/heimdall-postgresql"
const bundledPGService = "heimdall-postgresql"

func (r *PostgresBootstrapRunner) adminPrefix(install *pgInstall) []string {
	if install.OSUser == "" {
		return []string{"-u", "postgres", "--", install.PsqlBin, "-X", "-p", strconv.Itoa(r.DBPort)}
	}
	return []string{"-u", install.OSUser, "--", install.PsqlBin, "-X", "-h", install.SocketDir, "-p", strconv.Itoa(r.DBPort), "-U", install.OSUser}
}

func (r *PostgresBootstrapRunner) bundledPreflight() (*pgInstall, error) {
	if r.DBHost != postgresLoopback && r.DBHost != "localhost" {
		return nil, fmt.Errorf("bundled PostgreSQL requires DATABASE_HOST=127.0.0.1 or localhost")
	}
	if r.DBPort < 1 || r.DBPort > 65535 {
		return nil, fmt.Errorf("DATABASE_PORT must be between 1 and 65535")
	}
	if r.DBUser == "heimdall-postgres" {
		return nil, fmt.Errorf("application role must differ from the bundled bootstrap superuser")
	}
	install := &pgInstall{PsqlBin: r.Paths.RuntimePath("postgresql", "bin", "psql"), InitdbBin: r.Paths.RuntimePath("postgresql", "bin", "initdb"), SocketDir: bundledPGSocket, OSUser: "heimdall-postgres", Service: bundledPGService, DataDir: bundledPGData, Major: 18}
	for _, path := range []string{install.PsqlBin, install.InitdbBin, r.Paths.RuntimePath("postgresql", "bin", "postgres"), r.Paths.RuntimePath("postgresql", "bin", "pg_isready")} {
		if err := requireRegular(r.FS, path); err != nil {
			return nil, err
		}
	}
	files, err := r.FS.OpenPostgresData(install.DataDir)
	if err != nil && !os.IsNotExist(err) {
		return nil, err
	}
	if err == nil {
		defer files.Close()
		if err := validateBundledCluster(files); err != nil {
			return nil, err
		}
		if err := validateBundledOverrides(files); err != nil {
			return nil, err
		}
	}
	if err := checkOwnedPort(r.Exec, r.Systemd, r.DBPort, install.Service, false); err != nil {
		return nil, err
	}
	return install, nil
}

func validateBundledCluster(files postgresDataFiles) error {
	version, err := files.ReadFile("PG_VERSION")
	if err == nil {
		if strings.TrimSpace(string(version)) != "18" {
			return fmt.Errorf("bundled PostgreSQL requires cluster major 18; found %q; perform a separate database migration", strings.TrimSpace(string(version)))
		}
		for _, file := range []string{postgresConfigFileName, postgresHBAFileName} {
			if _, err := files.ReadFile(file); err != nil {
				return err
			}
		}
	} else if !os.IsNotExist(err) {
		return err
	} else {
		entries, err := files.ReadDir()
		if err != nil && !os.IsNotExist(err) {
			return err
		}
		if len(entries) != 0 {
			return fmt.Errorf("refusing to initialize nonempty PostgreSQL data directory without PG_VERSION: %s", bundledPGData)
		}
	}
	return nil
}

func validateBundledOverrides(files postgresDataFiles) error {
	if data, err := files.ReadFile("postgresql.auto.conf"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			key, _, _ := strings.Cut(strings.TrimSpace(line), "=")
			switch strings.TrimSpace(key) {
			case "port", "listen_addresses", "unix_socket_directories":
				return fmt.Errorf("remove the %s override from postgresql.auto.conf before applying bundled configuration", strings.TrimSpace(key))
			}
		}
	} else if !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (r *PostgresBootstrapRunner) openBundledCluster(install *pgInstall) (postgresDataFiles, error) {
	files, err := r.FS.OpenPostgresData(install.DataDir)
	if err != nil && !os.IsNotExist(err) {
		return nil, err
	}
	if err == nil {
		if err := validateBundledCluster(files); err != nil {
			files.Close()
			return nil, err
		}
		_, err = files.ReadFile("PG_VERSION")
		if err == nil {
			return files, nil
		}
		files.Close()
		if !os.IsNotExist(err) {
			return nil, err
		}
	}
	// The RPM owns the fixed parent directories. Only the service account
	// creates the mutable cluster, including PGDATA itself.
	if err := runChecked(r.Exec, "runuser", "-u", install.OSUser, "--", install.InitdbBin, "-D", install.DataDir, "--username="+install.OSUser, "--encoding=UTF8", "--locale=C.UTF-8", "--auth-local=peer", "--auth-host=scram-sha-256"); err != nil {
		return nil, err
	}
	files, err = r.FS.OpenPostgresData(install.DataDir)
	if err != nil {
		return nil, err
	}
	// initdb success must leave a real cluster, not merely a zero exit status.
	version, err := files.ReadFile("PG_VERSION")
	if err != nil || strings.TrimSpace(string(version)) != "18" {
		files.Close()
		return nil, fmt.Errorf("initdb did not create a PostgreSQL 18 cluster")
	}
	return files, nil
}

func (r *PostgresBootstrapRunner) runBundled() error {
	install, err := r.bundledPreflight()
	if err != nil {
		return err
	}
	if err := restoreSELinuxPaths(r.Exec, r.FS, r.Paths.LibExecDir+"/runtime/postgresql"); err != nil {
		return err
	}
	files, err := r.openBundledCluster(install)
	if err != nil {
		return err
	}
	defer files.Close()
	if err := validateBundledOverrides(files); err != nil {
		return err
	}
	conf, err := files.ReadFile(postgresConfigFileName)
	if err != nil {
		return err
	}
	const include = "include = 'heimdall.conf'"
	lines := strings.Split(strings.TrimRight(string(conf), "\n"), "\n")
	kept := lines[:0]
	for _, line := range lines {
		if strings.TrimSpace(line) != include {
			kept = append(kept, line)
		}
	}
	updated := strings.Join(append(kept, include), "\n") + "\n"
	if err := files.WriteFile(postgresConfigFileName, []byte(updated)); err != nil {
		return err
	}
	settings := fmt.Sprintf("listen_addresses = '127.0.0.1'\nport = %d\nunix_socket_directories = '%s'\npassword_encryption = 'scram-sha-256'\n", r.DBPort, install.SocketDir)
	if err := files.WriteFile("heimdall.conf", []byte(settings)); err != nil {
		return err
	}
	hba, err := files.ReadFile(postgresHBAFileName)
	if err != nil {
		return err
	}
	const scram = "host all all 127.0.0.1/32 scram-sha-256\n"
	hbaLines := strings.Split(strings.TrimRight(string(hba), "\n"), "\n")
	preserved := hbaLines[:0]
	for _, line := range hbaLines {
		if strings.TrimSpace(line) != strings.TrimSpace(scram) {
			preserved = append(preserved, line)
		}
	}
	if err := files.WriteFile(postgresHBAFileName, []byte(scram+strings.Join(preserved, "\n")+"\n")); err != nil {
		return err
	}
	// PostgreSQL data inherits its packaged directory label. systemd creates
	// and labels RuntimeDirectory; never recursively relabel user-owned paths.
	if err := r.Systemd.Enable(install.Service); err != nil {
		return err
	}
	active, err := r.Systemd.IsActive(install.Service)
	if err != nil {
		return err
	}
	if active {
		err = r.Systemd.Restart(install.Service)
	} else {
		err = r.Systemd.Start(install.Service)
	}
	if err != nil {
		return err
	}
	if err := r.waitReady(install); err != nil {
		return err
	}
	if err := r.configureRole(install); err != nil {
		return err
	}
	if err := r.verifyPasswordFormat(install); err != nil {
		return err
	}
	if err := r.ensureDatabase(install); err != nil {
		return err
	}
	cfg := DBConfig{Host: postgresLoopback, Port: r.DBPort, User: r.DBUser, Password: r.DBPassword, DBName: r.DBName}
	out, code, err := r.Exec.RunWithEnv(cfg.PgEnv(), install.PsqlBin, "-h", cfg.Host, "-p", cfg.PortStr(), "-U", cfg.User, "-d", pgDatabaseName(cfg.DBName), "-v", psqlStopOnError, "-c", "SELECT 1")
	if err != nil || code != 0 {
		return fmt.Errorf("bundled PostgreSQL connection failed (exit %d): %s: %v", code, strings.TrimSpace(out), err)
	}
	fmt.Fprintln(r.Out, "PostgreSQL bootstrap complete.")
	return nil
}

// checkPostgresServer uses the shipped client, including the resolved TLS policy.
func checkPostgresServer(exec ExecRunner, paths Paths, fs FileSystem, cfg DBConfig) error {
	_, err := postgresServerMajor(exec, paths, fs, cfg)
	return err
}

func postgresServerMajor(exec ExecRunner, paths Paths, fs FileSystem, cfg DBConfig) (int, error) {
	binary, err := postgresClient(paths, fs, "psql")
	if err != nil {
		return 0, err
	}
	out, code, err := exec.RunWithEnv(cfg.PgEnv(), binary, "-X", "-h", cfg.Host, "-p", cfg.PortStr(), "-U", cfg.User, "-d", pgDatabaseName(cfg.DBName), "-v", psqlStopOnError, "-tAc", "SHOW server_version_num")
	if err != nil || code != 0 {
		return 0, fmt.Errorf("checking PostgreSQL server version failed (exit %d): %v", code, err)
	}
	version, err := strconv.Atoi(strings.TrimSpace(out))
	if err != nil {
		return 0, fmt.Errorf("invalid PostgreSQL server_version_num response")
	}
	major := version / 10000
	if major < 13 || major > 18 {
		return 0, fmt.Errorf("PostgreSQL server major %d is unsupported; use PostgreSQL 13–18 with this RPM", major)
	}
	return major, nil
}

func (r *PostgresBootstrapRunner) waitReady(install *pgInstall) error {
	ready := false
	for attempt := 0; attempt < 50; attempt++ {
		_, code, err := r.Exec.Run("runuser", "-u", install.OSUser, "--", r.Paths.RuntimePath("postgresql", "bin", "pg_isready"), "-h", install.SocketDir, "-p", strconv.Itoa(r.DBPort), "-U", install.OSUser, "-d", "postgres", "-t", "1")
		if err != nil {
			return fmt.Errorf("checking bundled PostgreSQL readiness: %w", err)
		}
		if code == 0 {
			ready = true
			break
		}
		if code != 1 && code != 2 {
			return fmt.Errorf("bundled PostgreSQL readiness check failed (exit %d)", code)
		}
		time.Sleep(100 * time.Millisecond)
	}
	if !ready {
		return fmt.Errorf("bundled PostgreSQL did not become ready")
	}
	return nil
}
