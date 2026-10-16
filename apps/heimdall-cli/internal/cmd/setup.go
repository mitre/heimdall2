package cmd

import (
	"crypto/rand"
	"crypto/tls"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"maps"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"syscall"

	"github.com/spf13/cobra"
)

// SetupRunner orchestrates the 7-step setup process using injected dependencies.
type SetupRunner struct {
	Exec     ExecRunner
	Systemd  SystemdRunner
	Env      EnvManager
	FS       FileSystem
	DB       DBConnector
	Prompter Prompter
	Terminal TerminalDetector
	Out      io.Writer
	ErrOut   io.Writer
	Paths    Paths

	DatabaseMode        string
	ProxyMode           string
	TLSMode             string
	flagChanged         map[string]bool
	bundledRuntime      bool
	previousProxyMode   string
	previousBackendPort string
	rollbackFirewall    func() error
	stageConfig         bool
	pendingConfig       map[string]string

	// Flags
	Interactive bool
	NonInteract bool
	Port        string
	DBHost      string
	DBPort      int
	DBUser      string
	DBPassword  string
	DBName      string
	ExternalURL string
	TLSCert     string
	TLSKey      string
	SkipDB      bool
	SkipTLS     bool
	Reconfigure bool
	DryRun      bool
}

// NewSetupCmd creates the setup cobra command. If runner is nil, a default
// runner is used (for production); tests inject a pre-configured runner.
func NewSetupCmd(runner *SetupRunner) *cobra.Command {
	production := runner == nil
	if runner == nil {
		runner = &SetupRunner{
			Exec:     &execRunner{},
			Systemd:  &systemdRunner{},
			Env:      NewFileEnvManager(),
			FS:       &osFileSystem{},
			DB:       &psqlConnector{},
			Prompter: &huhPrompter{},
			Terminal: &stdioDetector{},
			Paths:    DefaultPaths(),
		}
	}

	cmd := &cobra.Command{
		Use:   "setup",
		Short: "Run post-install setup for Heimdall Server",
		Long: `Run the full post-install setup wizard for Heimdall Server. This command
orchestrates seven steps in sequence:

  1. Configuration   Write backend.env with database credentials and secrets
  2. PostgreSQL      Bootstrap selected bundled PostgreSQL (external servers unchanged)
  3. Connection test Verify database connectivity with SELECT 1
  4. Migrations      Run heimdall-server-db-setup to create/update schema
  5. TLS proxy       Configure the selected reverse proxy with HTTPS
  6. Security        Apply SELinux policies, fapolicyd trust, and firewalld rules
  7. Service start   Enable and start the heimdall-server systemd unit

Steps can be selectively skipped with --skip-db and --skip-tls. Use
--reconfigure to re-run only step 1 without restarting the full pipeline.
The bundled RPM defaults to bundled database and proxy ownership on a fresh
installation (Nginx with a generated self-signed certificate when available).
Choose each independently with --database-mode and --proxy-mode;
external PostgreSQL 13–18 is supported, including on localhost. --proxy-mode none
is HTTP-only development. Nginx uses self-signed TLS. Bundled Caddy TLS supports
acme, internal, and custom.
The backend port uses saved PORT, otherwise 3002 for a fresh RPM installation
or 3000 for standalone and configured legacy installations. Use --port to
override it; managed HTTPS defaults to port 443. Setup rejects listener and
SELinux conflicts before changing configuration and prompts again in
interactive mode.
Saved selections are reused; explicit flags override them. Temporary skips do
not change ownership. Setup does not download or install bundled runtimes.

After RPM upgrades, run setup --non-interactive to apply migrations and clear
the upgrade-pending marker. Failed or skipped migrations and --reconfigure keep
the application stopped. Database major migration is a separate operation.
Cloud environments (AWS, Azure, GCP) are auto-detected for security group hints.`,
		Example: `  # Full interactive setup with local PostgreSQL
  sudo heimdall-cli setup --interactive

  # Non-interactive setup with an external database
  sudo heimdall-cli setup --non-interactive \
    --database-mode external --proxy-mode external \
    --db-host db.example.com --db-port 5432 \
    --db-user heimdall --db-password secret \
    --external-url https://heimdall.example.com

  # Use an existing HTTPS proxy
  sudo heimdall-cli setup --non-interactive --proxy-mode external

  # Update only the configuration file without restarting services
  sudo heimdall-cli setup --reconfigure --db-host new-db.example.com`,
		SilenceUsage:  true,
		SilenceErrors: true,
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if production {
				runner.Paths = commandPaths(cmd)
				runner.Env = &FileEnvManager{Path: runner.Paths.EnvFile}
			}
			// Validate TLS flags
			certSet := runner.TLSCert != ""
			keySet := runner.TLSKey != ""
			if !runner.SkipTLS && (certSet != keySet) {
				return fmt.Errorf("--tls-cert and --tls-key must be provided together")
			}
			return nil
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			initIO(&runner.Out, &runner.ErrOut, cmd)
			runner.flagChanged = map[string]bool{}
			for _, name := range []string{"port", "db-host", "db-port", "db-user", "db-password", "db-name", "external-url", "tls-cert", "tls-key", "tls-mode"} {
				runner.flagChanged[name] = cmd.Flags().Changed(name)
			}
			return runner.Run()
		},
	}

	flags := cmd.Flags()
	flags.StringVar(&runner.DatabaseMode, "database-mode", "", "Database ownership: bundled or external")
	flags.StringVar(&runner.ProxyMode, "proxy-mode", "", "Proxy ownership: nginx, bundled (Caddy), external, or none")
	flags.StringVar(&runner.TLSMode, "tls-mode", "", "Proxy TLS: self-signed (Nginx), acme, internal, or custom")
	flags.BoolVar(&runner.Interactive, "interactive", false, "Prompt for configuration values")
	flags.BoolVar(&runner.NonInteract, "non-interactive", false, "Accept defaults and auto-generate secrets")
	flags.StringVar(&runner.Port, "port", DefaultAppPort, "Backend listen port (1024-65535; default shown is standalone; fresh RPM default 3002; saved PORT wins unless explicitly set)")
	flags.StringVar(&runner.DBHost, "db-host", "localhost", "Database host")
	flags.IntVar(&runner.DBPort, "db-port", 5432, "Database port")
	flags.StringVar(&runner.DBUser, "db-user", "postgres", "Database user")
	flags.StringVar(&runner.DBPassword, "db-password", "", "Database password")
	flags.StringVar(&runner.DBName, "db-name", "heimdall-server-production", "Database name")
	flags.StringVar(&runner.ExternalURL, "external-url", "", "Public URL (e.g. https://heimdall.example.com)")
	flags.StringVar(&runner.TLSCert, "tls-cert", "", "Path to TLS certificate (PEM)")
	flags.StringVar(&runner.TLSKey, "tls-key", "", "Path to TLS private key (PEM)")
	flags.BoolVar(&runner.SkipDB, "skip-db", false, "Skip PostgreSQL bootstrap and migrations")
	flags.BoolVar(&runner.SkipTLS, "skip-tls", false, "Skip TLS reverse proxy setup")
	flags.BoolVar(&runner.Reconfigure, "reconfigure", false, "Re-run only the configuration step")
	flags.BoolVar(&runner.DryRun, "dry-run", false, "Show what setup would do without making changes")

	return cmd
}

// Run executes the 7-step setup.
func (r *SetupRunner) Run() (err error) {
	r.rollbackFirewall = nil
	defer func() {
		if err != nil && r.rollbackFirewall != nil {
			err = errors.Join(err, r.rollbackFirewall())
		}
	}()
	existing, err := r.readConfiguration()
	if err != nil {
		return err
	}
	if r.DryRun {
		return r.printDryRun(r.DatabaseMode == "bundled")
	}

	if !r.Reconfigure {
		_, code, err := r.Exec.Run("systemctl", "show-environment")
		if err != nil || code != 0 {
			return fmt.Errorf("setup requires a running systemd service manager")
		}
	}

	r.stageConfig = r.bundledRuntime && !r.Reconfigure
	defer func() { r.stageConfig = false }()
	// Step 1: Configuration
	if err := r.configure(existing); err != nil {
		if _, ok := err.(*CLIError); ok {
			return err
		}
		return WrapError(err, "configuration failed",
			"Check file permissions: ls -la "+r.Env.GetEnvFilePath())
	}

	if r.stageConfig {
		return r.runBundledSetup(existing)
	}

	isLocalDB := r.DatabaseMode == "bundled"
	r.printSummary(isLocalDB)

	if r.Reconfigure {
		fmt.Fprintln(r.Out)
		fmt.Fprintln(r.Out, "Reconfiguration complete. Run full setup to apply these settings:")
		fmt.Fprintln(r.Out, "  sudo heimdall-cli setup --non-interactive")
		return nil
	}

	// Step 2: PostgreSQL bootstrap
	fmt.Fprintln(r.Out)
	if r.SkipDB {
		fmt.Fprintln(r.Out, "PostgreSQL bootstrap (skipped -- --skip-db)")
	} else if !isLocalDB {
		fmt.Fprintln(r.Out, "PostgreSQL bootstrap (skipped -- external database)")
	} else {
		fmt.Fprintln(r.Out, "PostgreSQL bootstrap")
		if err := r.stepPostgresBootstrap(); err != nil {
			return WrapError(err, "PostgreSQL bootstrap failed",
				"Check the selected PostgreSQL runtime and configuration")
		}
	}

	// Step 3: Connection test
	fmt.Fprintln(r.Out)
	if r.SkipDB {
		fmt.Fprintln(r.Out, "Connection test (skipped -- --skip-db)")
	} else {
		fmt.Fprintln(r.Out, "Connection test")
		if err := r.stepConnectionTest(); err != nil {
			return WrapError(err, "database connection test failed",
				"Check PostgreSQL is running: sudo systemctl status postgresql")
		}
	}

	// Step 4: Database migrations
	fmt.Fprintln(r.Out)
	if r.SkipDB {
		fmt.Fprintln(r.Out, "Database migrations (skipped -- --skip-db)")
	} else {
		fmt.Fprintln(r.Out, "Database migrations")
		if err := r.stepMigrations(); err != nil {
			return WrapError(err, "database migrations failed",
				"Check DB connectivity: sudo heimdall-cli validate")
		}
	}

	// Step 5: TLS reverse proxy
	fmt.Fprintln(r.Out)
	if r.SkipTLS {
		fmt.Fprintln(r.Out, "TLS reverse proxy (skipped -- --skip-tls)")
	} else if r.ProxyMode != "bundled" && r.ProxyMode != "nginx" {
		fmt.Fprintf(r.Out, "TLS reverse proxy (skipped -- %s proxy)\n", r.ProxyMode)
		fmt.Fprintf(r.Out, "  Backend address: http://127.0.0.1:%s\n", r.Port)
	} else {
		fmt.Fprintln(r.Out, "TLS reverse proxy")
		if err := r.stepTLS(); err != nil {
			return WrapError(err, "TLS setup failed",
				"Skip TLS and configure later: sudo heimdall-cli setup --skip-tls")
		}
	}

	// Step 6: Security policies
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "Security policies")
	if err := r.stepSecurityPolicies(); err != nil {
		return err
	}

	// Step 7: Start service
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "Starting service")
	if err := r.stepStartService(); err != nil {
		return WrapError(err, "service start failed",
			"Check config: sudo heimdall-cli validate && sudo systemctl status "+ServiceName)
	}

	r.printCompletionBanner()
	return nil
}

func (r *SetupRunner) printSummary(isLocalDB bool) {
	fmt.Fprintln(r.Out, "Heimdall Server Setup")
	fmt.Fprintln(r.Out, "---------------------")
	fmt.Fprintf(r.Out, "  Database mode: %s\n  Proxy mode: %s\n  TLS mode: %s\n", r.DatabaseMode, r.ProxyMode, r.TLSMode)
	fmt.Fprintf(r.Out, "  Backend port: %s\n", r.Port)
	fmt.Fprintf(r.Out, "  Database host: %s:%d\n", r.DBHost, r.DBPort)
	fmt.Fprintf(r.Out, "  Database name: %s\n", r.DBName)
	if r.SkipDB {
		fmt.Fprintln(r.Out, "  PostgreSQL bootstrap: skip (--skip-db)")
		fmt.Fprintln(r.Out, "  Database migrations:  skip (--skip-db)")
	} else if !isLocalDB {
		fmt.Fprintln(r.Out, "  PostgreSQL bootstrap: skip (external database)")
		fmt.Fprintln(r.Out, "  Database migrations:  run")
	} else {
		fmt.Fprintln(r.Out, "  PostgreSQL bootstrap: run")
		fmt.Fprintln(r.Out, "  Database migrations:  run")
	}
	if r.SkipTLS {
		fmt.Fprintln(r.Out, "  TLS reverse proxy:    skip (--skip-tls)")
	} else if r.ProxyMode != "bundled" && r.ProxyMode != "nginx" {
		fmt.Fprintf(r.Out, "  TLS reverse proxy:    skip (%s)\n", r.ProxyMode)
	} else {
		fmt.Fprintln(r.Out, "  TLS reverse proxy:    run")
	}
	fmt.Fprintln(r.Out)
}

// printDryRun shows what setup would do without making any changes.
func (r *SetupRunner) printDryRun(isLocalDB bool) error {
	fmt.Fprintln(r.Out, "=== DRY RUN — no changes will be made ===")
	fmt.Fprintf(r.Out, "  Database mode: %s\n  Proxy mode: %s\n  TLS mode: %s\n", r.DatabaseMode, r.ProxyMode, r.TLSMode)
	fmt.Fprintln(r.Out)

	fmt.Fprintf(r.Out, "  Would write config to %s\n", r.Env.GetEnvFilePath())
	fmt.Fprintf(r.Out, "  Backend port: %s\n", r.Port)
	fmt.Fprintf(r.Out, "  Database: %s@%s:%d/%s\n", r.DBUser, r.DBHost, r.DBPort, r.DBName)
	if r.DBPassword == "" {
		fmt.Fprintln(r.Out, "  DATABASE_PASSWORD: would auto-generate")
	}

	if r.Reconfigure {
		return nil
	}

	fmt.Fprintln(r.Out)
	if r.SkipDB {
		fmt.Fprintln(r.Out, "PostgreSQL bootstrap (skipped -- --skip-db)")
	} else if !isLocalDB {
		fmt.Fprintln(r.Out, "PostgreSQL bootstrap (skipped -- external database)")
	} else {
		fmt.Fprintln(r.Out, "PostgreSQL bootstrap")
		fmt.Fprintln(r.Out, "  Would bootstrap local PostgreSQL (detect, init, configure, role, database)")
	}

	fmt.Fprintln(r.Out)
	if r.SkipDB {
		fmt.Fprintln(r.Out, "Connection test (skipped -- --skip-db)")
	} else {
		fmt.Fprintln(r.Out, "Connection test")
		fmt.Fprintf(r.Out, "  Would test: %s:%d/%s\n", r.DBHost, r.DBPort, r.DBName)
	}

	fmt.Fprintln(r.Out)
	if r.SkipDB {
		fmt.Fprintln(r.Out, "Database migrations (skipped -- --skip-db)")
	} else {
		fmt.Fprintln(r.Out, "Database migrations")
		fmt.Fprintln(r.Out, "  Would run: heimdall-server-db-setup")
	}

	fmt.Fprintln(r.Out)
	if r.SkipTLS {
		fmt.Fprintln(r.Out, "TLS reverse proxy (skipped -- --skip-tls)")
	} else if r.ProxyMode != "bundled" && r.ProxyMode != "nginx" {
		fmt.Fprintf(r.Out, "TLS reverse proxy (skipped -- %s proxy)\n", r.ProxyMode)
		fmt.Fprintf(r.Out, "  Backend address: http://127.0.0.1:%s\n", r.Port)
	} else {
		fmt.Fprintln(r.Out, "TLS reverse proxy")
		fmt.Fprintf(r.Out, "  Would configure %s TLS reverse proxy\n", r.ProxyMode)
		if r.TLSCert != "" {
			fmt.Fprintf(r.Out, "  Cert: %s\n  Key: %s\n", r.TLSCert, r.TLSKey)
		}
	}

	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "Security policies")
	fmt.Fprintln(r.Out, "  Would configure: SELinux, fapolicyd, firewalld, file permissions")

	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "Starting service")
	fmt.Fprintf(r.Out, "  Would enable and start: %s\n", ServiceName)

	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "=== End DRY RUN — run without --dry-run to apply ===")
	return nil
}

// stepConfigure writes backend.env with DB credentials and secrets.
// In --interactive mode, prompts the user for each value.
// Preserves existing values — only generates secrets if they don't already exist.
func (r *SetupRunner) stepConfigure() error {
	existing, err := r.readConfiguration()
	if err != nil {
		return err
	}
	return r.configure(existing)
}

func (r *SetupRunner) configure(existing map[string]string) error {
	if r.Interactive {
		return r.stepConfigureInteractive(existing)
	}
	return r.stepConfigureNonInteractive(existing)
}

// readConfiguration resolves the plan without generating secrets or executing
// commands. Both dry-run and the actual setup therefore use the same settings.
func (r *SetupRunner) readConfiguration() (map[string]string, error) {
	existing, err := r.Env.ReadEnv()
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}
	if existing == nil {
		existing = map[string]string{}
	}
	r.bundledRuntime, err = r.Paths.hasRuntime(r.FS)
	if err != nil {
		return nil, err
	}
	requested := Deployment{r.DatabaseMode, r.ProxyMode, r.TLSMode}
	r.previousProxyMode = existing["HEIMDALL_PROXY_MODE"]
	r.previousBackendPort = existing["PORT"]
	configured := isConfigured(existing)
	if !r.bundledRuntime && requested.DatabaseMode == "" && existing["HEIMDALL_DATABASE_MODE"] == "" {
		host := envDefault(existing, "DATABASE_HOST", "localhost")
		if r.DBHost != "" && ((r.flagChanged == nil && r.DBHost != "localhost") || r.flagChanged["db-host"]) {
			host = r.DBHost
		}
		requested.DatabaseMode = "external"
		if isLocalHost(host) {
			requested.DatabaseMode = "bundled"
		}
	}
	if !r.bundledRuntime && requested.ProxyMode == "" && existing["HEIMDALL_PROXY_MODE"] == "" {
		requested.ProxyMode = "bundled"
	}
	nginxAvailable := r.bundledRuntime && r.FS.Exists(r.Paths.RuntimePath("nginx", "sbin", "nginx"))
	if nginxAvailable && !configured && requested.ProxyMode == "" && existing["HEIMDALL_PROXY_MODE"] == "" && (requested.TLSMode == "" || requested.TLSMode == "self-signed") && r.TLSCert == "" && r.TLSKey == "" {
		requested.ProxyMode = "nginx"
	}
	if requested.ProxyMode == "nginx" && requested.TLSMode == "" && existing["HEIMDALL_PROXY_MODE"] != "nginx" {
		requested.TLSMode = "self-signed"
	}
	if requested.ProxyMode != "" && requested.ProxyMode != "nginx" && requested.TLSMode == "" && existing["HEIMDALL_TLS_MODE"] == "self-signed" {
		requested.TLSMode = defaultTLSMode(envDefault(existing, "EXTERNAL_URL", r.ExternalURL), r.TLSCert, r.TLSKey)
	}
	d, err := resolveDeployment(existing, requested, configured)
	if err != nil {
		return nil, err
	}
	host, port, user := "localhost", "5432", "postgres"
	if r.bundledRuntime && d.DatabaseMode == "bundled" {
		host, port, user = "127.0.0.1", "55432", "heimdall"
	}
	values := map[string]string{}
	for k, v := range existing {
		values[k] = v
	}
	// An RPM template's endpoints are placeholders, not an existing deployment.
	if r.bundledRuntime && !configured && d.DatabaseMode == "bundled" {
		for _, k := range []string{"DATABASE_HOST", "DATABASE_PORT", "DATABASE_USERNAME"} {
			delete(values, k)
		}
	}
	if values["DATABASE_URL"] != "" {
		cfg, err := resolveDBConfig(values)
		if err != nil {
			return nil, err
		}
		values["DATABASE_HOST"], values["DATABASE_PORT"], values["DATABASE_USERNAME"], values["DATABASE_PASSWORD"], values["DATABASE_NAME"] = cfg.Host, cfg.PortStr(), cfg.User, cfg.Password, cfg.DBName
	}
	resolve := func(key, flag, value, fallback string) string {
		changed := r.flagChanged[flag]
		if r.flagChanged == nil {
			changed = value != "" && value != "0" && value != fallback
		}
		if changed {
			return value
		}
		return envDefault(values, key, fallback)
	}
	r.Port = resolve("PORT", "port", r.Port, DefaultAppPort)
	// Keep saved and explicit ports, including the historical standalone default.
	if r.bundledRuntime && !configured && values["PORT"] == "" &&
		!r.flagChanged["port"] && r.Port == DefaultAppPort {
		r.Port = DefaultRPMAppPort
	}
	if !r.Interactive || r.flagChanged["port"] {
		if err := ValidateValue("PORT", r.Port); err != nil {
			return nil, WrapError(err, "invalid backend port", "Choose a port from 1024 to 65535 with --port")
		}
	}
	values["DATABASE_HOST"] = resolve("DATABASE_HOST", "db-host", r.DBHost, host)
	values["DATABASE_PORT"] = resolve("DATABASE_PORT", "db-port", strconv.Itoa(r.DBPort), port)
	values["DATABASE_USERNAME"] = resolve("DATABASE_USERNAME", "db-user", r.DBUser, user)
	values["DATABASE_PASSWORD"] = resolve("DATABASE_PASSWORD", "db-password", r.DBPassword, "")
	values["DATABASE_NAME"] = resolve("DATABASE_NAME", "db-name", r.DBName, "heimdall-server-production")
	cfg, err := resolveDBConfig(values)
	if err != nil {
		return nil, err
	}
	r.DBHost, r.DBPort, r.DBUser, r.DBPassword, r.DBName = cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName
	r.ExternalURL = resolve("EXTERNAL_URL", "external-url", r.ExternalURL, "")
	r.TLSCert = resolve("HEIMDALL_TLS_CERT", "tls-cert", r.TLSCert, "")
	r.TLSKey = resolve("HEIMDALL_TLS_KEY", "tls-key", r.TLSKey, "")
	if requested.TLSMode == "" && d.ProxyMode != "nginx" {
		if (r.flagChanged["tls-cert"] || r.flagChanged["tls-key"]) && r.TLSCert != "" && r.TLSKey != "" {
			d.TLSMode = "custom"
		} else if existing["HEIMDALL_TLS_MODE"] == "" {
			externalURL := r.ExternalURL
			if externalURL == "" && existing["NGINX_HOST"] != "" {
				externalURL = "https://" + existing["NGINX_HOST"]
			}
			d.TLSMode = defaultTLSMode(externalURL, r.TLSCert, r.TLSKey)
		}
	}
	r.DatabaseMode, r.ProxyMode, r.TLSMode = d.DatabaseMode, d.ProxyMode, d.TLSMode
	if r.ProxyMode == "nginx" && !nginxAvailable {
		return nil, fmt.Errorf("private Nginx runtime is unavailable; reinstall the current heimdall-server RPM")
	}
	if r.ProxyMode == "bundled" && !r.SkipTLS {
		if (r.TLSCert == "") != (r.TLSKey == "") {
			return nil, fmt.Errorf("--tls-cert and --tls-key must be provided together")
		}
		if r.TLSMode == "custom" && (r.TLSCert == "" || r.TLSKey == "") {
			return nil, fmt.Errorf("custom TLS requires --tls-cert and --tls-key")
		}
	}
	if configured && r.bundledRuntime && existing["HEIMDALL_DATABASE_MODE"] == "" && requested.DatabaseMode == "" {
		fmt.Fprintln(r.Out, "  Existing installation: defaulting database and proxy ownership to external; endpoints are preserved.")
	}
	return existing, nil
}

func defaultTLSMode(externalURL, cert, key string) string {
	if cert != "" && key != "" {
		return "custom"
	}
	u, err := url.Parse(externalURL)
	if err == nil && u.Hostname() != "" && determineTLSStrategy(u.Hostname(), "", "") == tlsPublic {
		return "acme"
	}
	return "internal"
}

// stepConfigureInteractive runs the topology-aware setup wizard.
// It uses Select prompts to ask about architecture first, then only shows
// relevant Input prompts based on the deployment topology.
func (r *SetupRunner) stepConfigureInteractive(existing map[string]string) error {
	if !r.Prompter.CanPrompt() {
		return &CLIError{
			Summary:    "--interactive requires a terminal",
			Suggestion: "Run without --interactive, or use --non-interactive for defaults",
		}
	}

	// Helper: resolve default from existing value or fallback
	def := func(key, fallback string) string {
		if v, ok := existing[key]; ok && v != "" {
			return v
		}
		return fallback
	}

	// --- Re-run detection ---
	hasExisting := isConfigured(existing)
	if hasExisting && !r.bundledRuntime {
		fmt.Fprintln(r.Out, "  Existing Heimdall configuration detected.")
		action, err := r.Prompter.Select("What would you like to do?", "",
			[]string{
				"Re-run setup with current config",
				"Edit configuration",
				"Start fresh",
			})
		if err != nil {
			return err
		}

		switch action {
		case 0: // Re-run — keep existing config, just rewrite and continue
			fmt.Fprintln(r.Out, "  Re-running with existing configuration")
			return r.interactiveWriteConfig(existing, existing)
		case 1: // Edit — show prompts with existing values as defaults
			// fall through to the full wizard below (existing values as defaults)
		case 2: // Start fresh — clear existing and run full wizard
			existing = map[string]string{}
			if !r.flagChanged["db-password"] {
				r.DBPassword = ""
			}
		}
	}

	// --- Database topology ---
	fmt.Fprintln(r.Out)
	dbOptions := []string{"Local PostgreSQL (installed on this machine)", "External PostgreSQL (including an existing same-host instance)"}
	if r.bundledRuntime {
		dbOptions[0] = "Bundled PostgreSQL (Heimdall-owned instance)"
	}
	dbDefault := dbOptions[0]
	if r.DatabaseMode == "external" {
		dbDefault = dbOptions[1]
	}
	dbChoice, err := r.Prompter.Select("Database setup", dbDefault, dbOptions)
	if err != nil {
		return err
	}

	var dbHost, dbPort, dbUser, dbPassword, dbName string

	switch dbChoice {
	case 0: // Bundled/local PostgreSQL — only prompt for password
		dbHost = "localhost"
		dbPort = "5432"
		dbUser = "postgres"
		dbName = r.DBName
		if r.bundledRuntime {
			dbHost, dbPort, dbUser = "127.0.0.1", "55432", "heimdall"
			if r.DatabaseMode == "bundled" {
				dbHost, dbPort, dbUser = r.DBHost, strconv.Itoa(r.DBPort), r.DBUser
			}
		}
		r.DatabaseMode = "bundled"

		dbPassword, err = r.interactivePassword(r.DBPassword)
		if err != nil {
			return err
		}

	case 1: // External PostgreSQL — prompt for all DB fields
		r.DatabaseMode = "external"
		dbHost, err = r.Prompter.Input("Database host", r.DBHost)
		if err != nil {
			return err
		}
		dbPort, err = r.Prompter.Input("Database port", strconv.Itoa(r.DBPort))
		if err != nil {
			return err
		}
		dbUser, err = r.Prompter.Input("Database user", r.DBUser)
		if err != nil {
			return err
		}
		dbPassword, err = r.interactivePassword(r.DBPassword)
		if err != nil {
			return err
		}
		dbName, err = r.Prompter.Input("Database name", r.DBName)
		if err != nil {
			return err
		}

	}

	// --- TLS topology ---
	fmt.Fprintln(r.Out)
	tlsOptions := []string{"Caddy reverse proxy (automatic HTTPS)", "External SSL termination (load balancer, nginx)", "BYO certificate (provide cert and key paths)", "No TLS (development/testing only)"}
	nginxAvailable := r.bundledRuntime && r.FS.Exists(r.Paths.RuntimePath("nginx", "sbin", "nginx"))
	nginxOption := "Nginx reverse proxy (generated self-signed certificate)"
	tlsDefault := tlsOptions[0]
	switch r.ProxyMode {
	case "external":
		tlsDefault = tlsOptions[1]
	case "none":
		tlsDefault = tlsOptions[3]
	case "bundled":
		if r.TLSMode == "custom" {
			tlsDefault = tlsOptions[2]
		}
	}
	if nginxAvailable {
		tlsOptions = append([]string{nginxOption}, tlsOptions...)
		if r.ProxyMode == "nginx" {
			tlsDefault = nginxOption
		}
	}
	tlsChoice, err := r.Prompter.Select("TLS/SSL setup", tlsDefault, tlsOptions)
	if err != nil {
		return err
	}

	if tlsChoice < 0 || tlsChoice >= len(tlsOptions) {
		return fmt.Errorf("invalid TLS selection")
	}
	if nginxAvailable {
		tlsChoice--
	}
	switch tlsChoice {
	case -1:
		r.ProxyMode, r.TLSMode = "nginx", "self-signed"
	case 0: // Caddy
		r.ProxyMode = "bundled"
		if r.TLSMode == "self-signed" {
			r.TLSMode = "internal"
		}

	case 1: // External SSL termination
		r.ProxyMode = "external"

	case 2: // BYO certificate
		r.ProxyMode = "bundled"
		r.TLSMode = "custom"
		certPath, certErr := r.Prompter.Input("TLS certificate path", r.TLSCert)
		if certErr != nil {
			return certErr
		}
		keyPath, keyErr := r.Prompter.Input("TLS private key path", r.TLSKey)
		if keyErr != nil {
			return keyErr
		}
		r.TLSCert = certPath
		r.TLSKey = keyPath

	case 3: // No TLS
		r.ProxyMode = "none"
	}

	if r.ProxyMode != "nginx" && r.TLSMode == "self-signed" {
		r.TLSMode = "internal"
	}

	// --- Application config ---
	fmt.Fprintln(r.Out)
	defaultExternalURL := r.ExternalURL
	if defaultExternalURL == "" {
		defaultExternalURL = def("NGINX_HOST", "localhost")
	}
	externalURL, err := r.Prompter.Input("External URL", defaultExternalURL)
	if err != nil {
		return err
	}
	if externalURL == "" {
		externalURL = defaultExternalURL
	}
	externalURL, err = normalizeExternalURL(externalURL, r.ProxyMode)
	if err != nil {
		return err
	}
	adminEmail, err := r.Prompter.Input("Admin email", def("ADMIN_EMAIL", "admin@heimdall.local"))
	if err != nil {
		return err
	}
	jwtDefault := def("JWT_EXPIRE_TIME", "1d")
	fmt.Fprintln(r.Out, "  Heimdall caps JWT lifetimes at 2 days.")
	jwtExpire, err := r.Prompter.Input("JWT expiration (e.g. 1d or 25m)", jwtDefault)
	if err != nil {
		return err
	}
	jwtExpire = strings.TrimSpace(jwtExpire)
	if jwtExpire == "" {
		jwtExpire = jwtDefault
	}
	if err := ValidateValue("JWT_EXPIRE_TIME", jwtExpire); err != nil {
		return err
	}

	if r.ProxyMode == "bundled" && tlsChoice == 0 {
		mode := r.TLSMode
		if existing["HEIMDALL_TLS_MODE"] == "" && !r.flagChanged["tls-mode"] {
			mode = defaultTLSMode(externalURL, "", "")
		}
		if r.bundledRuntime {
			options := []string{"internal", "acme", "custom"}
			choice, err := r.Prompter.Select("TLS mode", mode, options)
			if err != nil {
				return err
			}
			if choice < 0 || choice >= len(options) {
				return fmt.Errorf("invalid TLS selection")
			}
			mode = options[choice]
			if mode == "custom" {
				r.TLSCert, err = r.Prompter.Input("TLS certificate path", r.TLSCert)
				if err != nil {
					return err
				}
				r.TLSKey, err = r.Prompter.Input("TLS private key path", r.TLSKey)
				if err != nil {
					return err
				}
			}
		}
		r.TLSMode = mode
	}
	if r.ProxyMode == "bundled" && r.TLSMode == "custom" && (r.TLSCert == "" || r.TLSKey == "") {
		return fmt.Errorf("custom TLS requires certificate and key paths")
	}
	certDays := def("HEIMDALL_TLS_CERT_DAYS", "7")
	u, err := url.Parse(externalURL)
	if err != nil {
		return fmt.Errorf("invalid external URL: %w", err)
	}
	localTLS := r.TLSMode == "internal" || r.TLSMode == "self-signed"
	if !r.bundledRuntime {
		strategy := determineTLSStrategy(u.Hostname(), r.TLSCert, r.TLSKey)
		localTLS = strategy == tlsPrivate || strategy == tlsIP
	}
	if (r.ProxyMode == "bundled" || r.ProxyMode == "nginx") && !r.SkipTLS && u.Scheme == "https" && localTLS {
		certDays, err = r.Prompter.Input("Certificate lifetime in days", certDays)
		if err != nil {
			return err
		}
		certDays = strings.TrimSpace(certDays)
		if certDays == "" {
			certDays = def("HEIMDALL_TLS_CERT_DAYS", "7")
		}
		if err := ValidateValue("HEIMDALL_TLS_CERT_DAYS", certDays); err != nil {
			return err
		}
		fmt.Fprintln(r.Out, "  Applies to new certificates; existing certificates are preserved.")
		if r.ProxyMode == "bundled" && (r.bundledRuntime || net.ParseIP(u.Hostname()) == nil) {
			fmt.Fprintln(r.Out, "  Caddy may shorten new certificates to the current CA's remaining validity.")
		}
	}

	// Build the prompted values map
	prompted := map[string]string{
		"DATABASE_HOST":          dbHost,
		"DATABASE_PORT":          dbPort,
		"DATABASE_USERNAME":      dbUser,
		"DATABASE_PASSWORD":      dbPassword,
		"DATABASE_NAME":          dbName,
		"EXTERNAL_URL":           externalURL,
		"ADMIN_EMAIL":            adminEmail,
		"JWT_EXPIRE_TIME":        jwtExpire,
		"HEIMDALL_TLS_CERT_DAYS": certDays,
	}
	return r.interactiveWriteConfig(existing, prompted)
}

// interactivePassword handles the password prompt with auto-generation for empty input.
func (r *SetupRunner) interactivePassword(existingPass string) (string, error) {
	if existingPass != "" {
		fmt.Fprintln(r.Out, "  Database password: [already set -- press Enter to keep]")
		dbPassword, err := r.Prompter.Password("Database password")
		if err != nil {
			return "", err
		}
		if dbPassword == "" {
			return existingPass, nil
		}
		return dbPassword, nil
	}

	dbPassword, err := ConfirmPassword(r.Prompter, "Database password", true)
	if err != nil {
		return "", err
	}
	if dbPassword == "" {
		b := make([]byte, 33)
		if _, err := rand.Read(b); err != nil {
			return "", fmt.Errorf("generating password: %w", err)
		}
		dbPassword = hex.EncodeToString(b)
		fmt.Fprintln(r.Out, "  DATABASE_PASSWORD auto-generated")
	}
	return dbPassword, nil
}

// interactiveWriteConfig resolves secrets and derived values, then calls writeConfig.
// prompted contains user-entered values; existing contains previously-saved values.
func (r *SetupRunner) interactiveWriteConfig(existing, prompted map[string]string) error {
	dbHost := prompted["DATABASE_HOST"]
	dbPort := prompted["DATABASE_PORT"]
	dbUser := prompted["DATABASE_USERNAME"]
	dbPassword := prompted["DATABASE_PASSWORD"]
	dbName := prompted["DATABASE_NAME"]
	externalURL := prompted["EXTERNAL_URL"]
	adminEmail := prompted["ADMIN_EMAIL"]

	// Use defaults for empty values (re-run path)
	if dbHost == "" {
		dbHost = "localhost"
	}
	if dbPort == "" {
		dbPort = "5432"
	}
	if dbUser == "" {
		dbUser = "postgres"
	}
	if dbName == "" {
		dbName = "heimdall-server-production"
	}
	if adminEmail == "" {
		adminEmail = "admin@heimdall.local"
	}

	// Auto-generate password if still empty
	if dbPassword == "" {
		b := make([]byte, 33)
		if _, err := rand.Read(b); err != nil {
			return fmt.Errorf("generating password: %w", err)
		}
		dbPassword = hex.EncodeToString(b)
		fmt.Fprintln(r.Out, "  DATABASE_PASSWORD auto-generated")
	}

	// Secrets — preserve existing, only generate if missing
	var err error
	jwtSecret := existing["JWT_SECRET"]
	if jwtSecret == "" {
		jwtSecret, err = randomHex(64)
		if err != nil {
			return fmt.Errorf("generating JWT secret: %w", err)
		}
		fmt.Fprintln(r.Out, "  JWT_SECRET auto-generated")
	}
	apiKeySecret := existing["API_KEY_SECRET"]
	if apiKeySecret == "" {
		apiKeySecret, err = randomHex(33)
		if err != nil {
			return fmt.Errorf("generating API key secret: %w", err)
		}
		fmt.Fprintln(r.Out, "  API_KEY_SECRET auto-generated")
	}

	nginxHost := envDefault(existing, "NGINX_HOST", "localhost")
	settings := maps.Clone(existing)
	settings["JWT_EXPIRE_TIME"] = envDefault(prompted, "JWT_EXPIRE_TIME", envDefault(existing, "JWT_EXPIRE_TIME", "1d"))
	settings["HEIMDALL_TLS_CERT_DAYS"] = envDefault(prompted, "HEIMDALL_TLS_CERT_DAYS", envDefault(existing, "HEIMDALL_TLS_CERT_DAYS", "7"))
	return r.writeConfig(settings, dbHost, dbPort, dbUser, dbPassword, dbName,
		jwtSecret, apiKeySecret, nginxHost, externalURL, adminEmail)
}

// stepConfigureNonInteractive uses CLI flags, existing values, and defaults.
func (r *SetupRunner) stepConfigureNonInteractive(existing map[string]string) error {
	dbHost, dbPort, dbUser, dbName := r.DBHost, strconv.Itoa(r.DBPort), r.DBUser, r.DBName
	dbPassword := r.DBPassword

	if dbPassword == "" {
		b := make([]byte, 33)
		if _, err := rand.Read(b); err != nil {
			return fmt.Errorf("generating password: %w", err)
		}
		dbPassword = hex.EncodeToString(b)
		fmt.Fprintln(r.Out, "  DATABASE_PASSWORD auto-generated")
	}

	jwtSecret := existing["JWT_SECRET"]
	if jwtSecret == "" {
		var err error
		jwtSecret, err = randomHex(64)
		if err != nil {
			return fmt.Errorf("generating JWT secret: %w", err)
		}
		fmt.Fprintln(r.Out, "  JWT_SECRET auto-generated")
	}

	apiKeySecret := existing["API_KEY_SECRET"]
	if apiKeySecret == "" {
		var err error
		apiKeySecret, err = randomHex(33)
		if err != nil {
			return fmt.Errorf("generating API key secret: %w", err)
		}
		fmt.Fprintln(r.Out, "  API_KEY_SECRET auto-generated")
	}

	nginxHost := envDefault(existing, "NGINX_HOST", "localhost")
	adminEmail := envDefault(existing, "ADMIN_EMAIL", "admin@heimdall.local")
	externalURL := r.ExternalURL
	if externalURL == "" {
		externalURL = nginxHost
	}

	return r.writeConfig(existing, dbHost, dbPort, dbUser, dbPassword, dbName,
		jwtSecret, apiKeySecret, nginxHost, externalURL, adminEmail)
}

// writeConfig writes the resolved config to the env file.
func (r *SetupRunner) writeConfig(existing map[string]string,
	dbHost, dbPort, dbUser, dbPassword, dbName,
	jwtSecret, apiKeySecret, nginxHost, externalURL, adminEmail string) error {

	if r.Reconfigure && existing["HEIMDALL_PROXY_MODE"] != "" && existing["HEIMDALL_PROXY_MODE"] != r.ProxyMode {
		return &CLIError{Summary: "proxy ownership changes require full setup", Suggestion: "Run heimdall-cli setup without --reconfigure to change proxy ownership"}
	}
	if externalURL == "" {
		externalURL = nginxHost
	}
	var err error
	externalURL, err = normalizeExternalURL(externalURL, r.ProxyMode)
	if err != nil {
		return err
	}
	u, _ := url.Parse(externalURL)
	if r.bundledRuntime {
		if _, err := validatePublicURL(externalURL); err != nil {
			return err
		}
	}
	nginxHost = u.Hostname()
	if r.ProxyMode == "nginx" && (u.Scheme != "https" || (u.Port() != "" && u.Port() != "443")) {
		return fmt.Errorf("managed Nginx requires an HTTPS external URL on port 443")
	}
	// Preserve saved values unless the interactive wizard supplied replacements.
	jwtExpire := "1d"
	if v, ok := existing["JWT_EXPIRE_TIME"]; ok && v != "" {
		jwtExpire = v
	}
	if err := ValidateValue("JWT_EXPIRE_TIME", jwtExpire); err != nil {
		return err
	}
	certDays := envDefault(existing, "HEIMDALL_TLS_CERT_DAYS", "7")
	if err := ValidateValue("HEIMDALL_TLS_CERT_DAYS", certDays); err != nil {
		return err
	}
	adminPassword := existing["ADMIN_PASSWORD"]

	// Write all keys — matches heimdall-configure.sh output
	entries := map[string]string{
		"NODE_ENV":               "production",
		"PORT":                   r.Port,
		"DATABASE_HOST":          dbHost,
		"DATABASE_PORT":          dbPort,
		"DATABASE_USERNAME":      dbUser,
		"DATABASE_PASSWORD":      dbPassword,
		"DATABASE_NAME":          dbName,
		"JWT_SECRET":             jwtSecret,
		"JWT_EXPIRE_TIME":        jwtExpire,
		"API_KEY_SECRET":         apiKeySecret,
		"NGINX_HOST":             nginxHost,
		"EXTERNAL_URL":           externalURL,
		"ADMIN_EMAIL":            adminEmail,
		"HEIMDALL_TLS_CERT_DAYS": certDays,
	}
	if adminPassword != "" {
		entries["ADMIN_PASSWORD"] = adminPassword
	}

	for key, value := range existing {
		if _, managed := entries[key]; !managed {
			entries[key] = value
		}
	}

	entries["HEIMDALL_DATABASE_MODE"] = r.DatabaseMode
	entries["HEIMDALL_PROXY_MODE"] = r.ProxyMode
	entries["HEIMDALL_TLS_MODE"] = r.TLSMode
	entries["HEIMDALL_TLS_CERT"] = r.TLSCert
	entries["HEIMDALL_TLS_KEY"] = r.TLSKey
	if _, err := resolveDeployment(entries, Deployment{}, true); err != nil {
		return err
	}
	if _, err := resolveDBConfig(entries); err != nil {
		return err
	}

	port, err := r.selectBackendPort(entries)
	if err != nil {
		return err
	}
	r.Port, entries["PORT"] = port, port

	if r.Interactive {
		fmt.Fprintln(r.Out)
		fmt.Fprintln(r.Out, "  Configuration summary:")
		fmt.Fprintf(r.Out, "    Database: %s@%s:%s/%s\n", dbUser, dbHost, dbPort, dbName)
		fmt.Fprintln(r.Out, "    Password: ********")
		fmt.Fprintf(r.Out, "    URL:      %s\n", externalURL)
		fmt.Fprintf(r.Out, "    Admin:    %s\n", adminEmail)
		fmt.Fprintf(r.Out, "    Backend port: %s\n", port)
		fmt.Fprintln(r.Out)
	}

	// Store resolved values back to runner so subsequent steps use them
	// (e.g., stepConnectionTest needs the auto-generated DB password).
	r.DBHost = dbHost
	if p, err := strconv.Atoi(dbPort); err == nil {
		r.DBPort = p
	}
	r.DBUser = dbUser
	r.DBPassword = dbPassword
	r.DBName = dbName
	r.ExternalURL = externalURL

	if r.stageConfig {
		r.pendingConfig = entries
		return nil
	}
	if r.bundledRuntime {
		if err := safeManagedPath(r.FS, r.Env.GetEnvFilePath()); err != nil {
			return err
		}
	}
	if err := r.Env.WriteEnvFile(entries); err != nil {
		return fmt.Errorf("writing env file: %w", err)
	}
	// Set file permissions (matches heimdall-configure.sh)
	r.Exec.Run("chown", "root:heimdall", r.Env.GetEnvFilePath())
	r.Exec.Run("chmod", "0640", r.Env.GetEnvFilePath())

	fmt.Fprintf(r.Out, "  Configuration saved to %s\n", r.Env.GetEnvFilePath())
	return nil
}

// Resolve the backend port before configuration writes or service changes.
func (r *SetupRunner) selectBackendPort(env map[string]string) (string, error) {
	port := r.Port
	for {
		if r.Interactive {
			input, err := r.Prompter.Input("Backend port", port)
			if err != nil {
				return "", err
			}
			if input = strings.TrimSpace(input); input != "" {
				port = input
			}
		}
		if err := r.validateBackendPort(port, env); err != nil {
			if !r.Interactive {
				return "", WrapError(err, "backend port unavailable", "Choose another port with --port or run setup --interactive")
			}
			fmt.Fprintf(r.Out, "  Backend port %q: %v\n  Choose another backend port.\n", port, err)
			continue
		}
		n, _ := strconv.Atoi(port)
		return strconv.Itoa(n), nil
	}
}

func (r *SetupRunner) validateBackendPort(value string, env map[string]string) error {
	if err := ValidateValue("PORT", value); err != nil {
		return err
	}
	port, _ := strconv.Atoi(value)
	dbPort, _ := strconv.Atoi(env["DATABASE_PORT"])
	if r.DatabaseMode == "bundled" && port == dbPort {
		return fmt.Errorf("port %d is selected for bundled PostgreSQL", port)
	}
	if r.ProxyMode == "nginx" && port == 443 {
		return fmt.Errorf("port 443 is reserved for the HTTPS proxy")
	}
	if r.ProxyMode == "bundled" {
		u, err := url.Parse(env["EXTERNAL_URL"])
		if err != nil {
			return err
		}
		proxyPort := 80
		if u.Scheme == "https" {
			proxyPort = 443
		}
		if u.Port() != "" {
			proxyPort, _ = strconv.Atoi(u.Port())
		}
		if port == proxyPort || (u.Scheme == "https" && port == 80) {
			return fmt.Errorf("port %d is reserved for the selected proxy", port)
		}
	}
	if err := checkOwnedPort(r.Exec, r.Systemd, port, ServiceName, false); err != nil {
		return err
	}
	return configureSELinuxPorts(r.Exec, r.FS, r.Paths.ConfigDir, []selinuxPort{{"heimdall_server_port_t", strconv.Itoa(port)}}, false)
}

// stepPostgresBootstrap delegates PostgreSQL bootstrap to the native
// PostgresBootstrapRunner. Replaces the previous shell-out to
// /usr/libexec/heimdall-server/postgres-setup.sh.
func (r *SetupRunner) stepPostgresBootstrap() error {
	bootstrapper := &PostgresBootstrapRunner{
		Paths:        r.Paths,
		DatabaseMode: r.DatabaseMode,
		Exec:         r.Exec,
		FS:           r.FS,
		Systemd:      r.Systemd,
		Out:          r.Out,
		DBHost:       r.DBHost,
		DBPort:       r.DBPort,
		DBUser:       r.DBUser,
		DBPassword:   r.DBPassword,
		DBName:       r.DBName,
	}
	return bootstrapper.Run()
}

// stepConnectionTest runs SELECT 1 against the database.
func (r *SetupRunner) stepConnectionTest() error {
	env, err := r.Env.ReadEnv()
	if err != nil {
		return err
	}
	cfg, err := resolveDBConfig(env)
	if err != nil {
		return err
	}
	if err := configureDBConnector(r.DB, r.Paths, r.FS, cfg); err != nil {
		return err
	}
	if err := r.DB.TestConnection(r.DBHost, r.DBPort, r.DBUser, r.DBPassword, r.DBName); err != nil {
		return fmt.Errorf("cannot connect to %s:%d/%s: %w", r.DBHost, r.DBPort, r.DBName, err)
	}
	fmt.Fprintf(r.Out, "  Connected to %s:%d/%s\n", r.DBHost, r.DBPort, r.DBName)
	return nil
}

// stepMigrations runs heimdall-server-db-setup.
func (r *SetupRunner) stepMigrations() error {
	_, exitCode, err := r.Exec.Run("heimdall-server-db-setup")
	if err != nil {
		return fmt.Errorf("running heimdall-server-db-setup: %w", err)
	}
	if exitCode != 0 {
		return fmt.Errorf("heimdall-server-db-setup exited with code %d", exitCode)
	}
	fmt.Fprintln(r.Out, "  Database migrations complete")
	return nil
}

// stepTLS sets up Caddy as a TLS reverse proxy for Heimdall.
// Handles: BYO certificates, private hostnames (internal CA), public
// hostnames (Let's Encrypt ACME), and IP-based (self-signed via openssl).
// tlsStrategy describes which TLS approach to use for Caddy.
type tlsStrategy int

const (
	tlsBYO     tlsStrategy = iota // user-provided certificate
	tlsPrivate                    // private hostname, Caddy internal CA
	tlsPublic                     // public hostname, Let's Encrypt ACME
	tlsIP                         // IP address, self-signed certificate
)

// determineTLSStrategy picks a TLS strategy based on the hostname and flags.
func determineTLSStrategy(host, tlsCert, tlsKey string) tlsStrategy {
	if tlsCert != "" && tlsKey != "" {
		return tlsBYO
	}
	if net.ParseIP(host) != nil {
		return tlsIP
	}
	if isPrivateHostname(host) {
		return tlsPrivate
	}
	return tlsPublic
}

// resolveExternalHost extracts the hostname from EXTERNAL_URL, flags, or the
// system hostname, and ensures EXTERNAL_URL is persisted in backend.env.
func (r *SetupRunner) resolveExternalHost() (host, url string) {
	url = r.ExternalURL
	if url == "" {
		env, _ := r.Env.ReadEnv()
		url = env["EXTERNAL_URL"]
	}

	if url != "" {
		// Strip scheme and port/path: https://foo.example.com:443/bar → foo.example.com
		h := url
		for _, prefix := range []string{"https://", "http://"} {
			if len(h) > len(prefix) && h[:len(prefix)] == prefix {
				h = h[len(prefix):]
				break
			}
		}
		if idx := strings.IndexAny(h, ":/"); idx >= 0 {
			h = h[:idx]
		}
		host = h
	}

	if host == "" {
		out, _, _ := r.Exec.Run("hostname", "-f")
		host = strings.TrimSpace(out)
		if host == "" {
			out, _, _ = r.Exec.Run("hostname")
			host = strings.TrimSpace(out)
		}
		if host == "" {
			host = "localhost"
		}
		url = "https://" + host
	}

	// Persist EXTERNAL_URL if not already set
	env, _ := r.Env.ReadEnv()
	if env["EXTERNAL_URL"] == "" {
		r.Env.WriteEnvKey("EXTERNAL_URL", url)
		fmt.Fprintf(r.Out, "  Set EXTERNAL_URL=%s\n", url)
	}
	return host, url
}

func (r *SetupRunner) runTLSCommand(name string, args ...string) error {
	_, code, err := r.Exec.Run(name, args...)
	if err != nil {
		return fmt.Errorf("running %s for TLS setup: %w", name, err)
	}
	if code != 0 {
		return fmt.Errorf("%s for TLS setup exited with code %d", name, code)
	}
	return nil
}

// configureCaddyfile applies the TLS strategy to the Caddyfile and generates
// certificates when needed.
func (r *SetupRunner) configureCaddyfile(strategy tlsStrategy, host, caddyfileDst string) error {
	days := 7
	if strategy == tlsPrivate || strategy == tlsIP {
		env, err := r.Env.ReadEnv()
		if err != nil {
			return err
		}
		days, err = certificateLifetimeDays(env)
		if err != nil {
			return err
		}
	}
	if strategy != tlsIP {
		if err := r.runTLSCommand("sed", "-i", fmt.Sprintf("s|^:443 {|%s {|", host), caddyfileDst); err != nil {
			return err
		}
	}
	switch strategy {
	case tlsBYO:
		if err := r.runTLSCommand("sed", "-i", fmt.Sprintf(`/reverse_proxy/i\\ttls %s %s`, r.TLSCert, r.TLSKey), caddyfileDst); err != nil {
			return err
		}
		fmt.Fprintf(r.Out, "  Caddy: configured with provided certificate\n")
		fmt.Fprintf(r.Out, "    Cert: %s\n", r.TLSCert)
		fmt.Fprintf(r.Out, "    Key:  %s\n", r.TLSKey)

	case tlsPrivate:
		if err := r.runTLSCommand("sed", "-i", fmt.Sprintf(`/reverse_proxy/i\\ttls {\n\t\tissuer internal {\n\t\t\tlifetime %dh\n\t\t}\n\t}`, days*24), caddyfileDst); err != nil {
			return err
		}
		fmt.Fprintln(r.Out, "  Caddy: private hostname detected — using internal CA")
		fmt.Fprintln(r.Out, "    Import root CA into browsers to avoid warnings:")
		fmt.Fprintln(r.Out, "    /var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt")

	case tlsPublic:
		fmt.Fprintln(r.Out, "  Caddy: public hostname — automatic Let's Encrypt certificate")

	case tlsIP:
		certDir := r.Paths.CertDir
		if err := r.FS.MkdirAll(certDir, 0750); err != nil {
			return fmt.Errorf("creating TLS certificate directory: %w", err)
		}
		if err := r.runTLSCommand("chown", "root:caddy", certDir); err != nil {
			return err
		}
		certFile := certDir + "/server.crt"
		keyFile := certDir + "/server.key"
		if !r.FS.Exists(certFile) {
			if err := r.runTLSCommand("openssl", "req", "-x509", "-nodes", "-days", strconv.Itoa(days),
				"-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:prime256v1",
				"-keyout", keyFile, "-out", certFile,
				"-subj", fmt.Sprintf("/CN=%s", host),
				"-addext", fmt.Sprintf("subjectAltName=IP:%s,DNS:localhost", host)); err != nil {
				return err
			}
			if err := r.runTLSCommand("chmod", "640", keyFile); err != nil {
				return err
			}
			if err := r.runTLSCommand("chown", "root:caddy", keyFile); err != nil {
				return err
			}
			if err := r.runTLSCommand("chmod", "644", certFile); err != nil {
				return err
			}
			fmt.Fprintf(r.Out, "  Generated self-signed cert for %s\n", host)
		}
		if err := r.runTLSCommand("sed", "-i", fmt.Sprintf(`/reverse_proxy/i\\ttls %s %s`, certFile, keyFile), caddyfileDst); err != nil {
			return err
		}
		fmt.Fprintln(r.Out, "  Caddy: configured with self-signed cert (IP-based deployment)")
	}
	return nil
}

func (r *SetupRunner) stepTLS() error {
	bundled, err := r.Paths.hasRuntime(r.FS)
	if err != nil {
		return err
	}
	if bundled {
		env, err := r.Env.ReadEnv()
		if err != nil {
			return err
		}
		update, err := r.prepareBundledCaddy(env)
		if err != nil {
			return err
		}
		if err := update.apply(); err != nil {
			return err
		}
		if r.TLSMode == "internal" {
			fmt.Fprintln(r.Out, "  Import the private Caddy CA where needed:", bundledCaddyRoot)
		}
		return nil
	}

	// Check if Caddy is available
	_, exitCode, err := r.Exec.Run("sh", "-c", `command -v "$1"`, "sh", "caddy")
	if err != nil {
		return fmt.Errorf("looking up Caddy: %w", err)
	}
	if exitCode != 0 {
		fmt.Fprintln(r.Out, "  Caddy not installed -- skipping TLS proxy setup")
		fmt.Fprintln(r.Out, "  Install Caddy, then re-run: sudo heimdall-cli setup --skip-db")
		return nil
	}

	caddyfileSrc := r.Paths.LibExecDir + "/heimdall-Caddyfile"
	caddyfileDst := "/etc/caddy/Caddyfile.d/heimdall-server.caddy"

	externalHost, _ := r.resolveExternalHost()

	// Copy Caddyfile template
	if !r.FS.Exists(caddyfileSrc) {
		fmt.Fprintln(r.Out, "  Caddyfile template not found, skipping")
		return nil
	}
	if err := r.runTLSCommand("mkdir", "-p", "/etc/caddy/Caddyfile.d"); err != nil {
		return err
	}
	if err := r.FS.CopyFile(caddyfileSrc, caddyfileDst); err != nil {
		return fmt.Errorf("copying Caddyfile: %w", err)
	}

	if err := validateHostname(externalHost); err != nil {
		return fmt.Errorf("unsafe hostname %q: %w", externalHost, err)
	}
	if r.TLSCert != "" {
		if err := validateFilePath(r.TLSCert); err != nil {
			return fmt.Errorf("unsafe TLS cert path: %w", err)
		}
	}
	if r.TLSKey != "" {
		if err := validateFilePath(r.TLSKey); err != nil {
			return fmt.Errorf("unsafe TLS key path: %w", err)
		}
	}

	strategy := determineTLSStrategy(externalHost, r.TLSCert, r.TLSKey)
	if err := r.configureCaddyfile(strategy, externalHost, caddyfileDst); err != nil {
		return err
	}

	// Ensure main Caddyfile imports our config
	caddyMain := "/etc/caddy/Caddyfile"
	if r.FS.Exists(caddyMain) {
		mainData, err := r.FS.ReadFile(caddyMain)
		if err != nil {
			return fmt.Errorf("reading Caddyfile: %w", err)
		}
		if !strings.Contains(string(mainData), "import /etc/caddy/Caddyfile.d/") {
			if err := r.runTLSCommand("sh", "-c", `echo 'import /etc/caddy/Caddyfile.d/*.caddy' >> /etc/caddy/Caddyfile`); err != nil {
				return err
			}
		}
	}

	// Install internal CA root cert into system trust.
	// Use update-ca-trust instead of 'caddy trust' which hangs waiting for
	// interactive password input on some systems.
	r.Exec.Run("update-ca-trust")

	if err := r.Systemd.Enable("caddy"); err != nil {
		return fmt.Errorf("enabling Caddy: %w", err)
	}
	if err := r.Systemd.Restart("caddy"); err != nil {
		return fmt.Errorf("restarting Caddy: %w", err)
	}
	active, err := r.Systemd.IsActive("caddy")
	if err != nil {
		return fmt.Errorf("checking Caddy: %w", err)
	}
	if !active {
		return fmt.Errorf("service caddy is not active after restart")
	}
	fmt.Fprintln(r.Out, "  Caddy: enabled and running")

	// SELinux: allow Caddy to proxy to backend
	_, exitCode, _ = r.Exec.Run("sh", "-c", `command -v "$1"`, "sh", "setsebool")
	if exitCode == 0 {
		r.Exec.Run("setsebool", "-P", "httpd_can_network_connect", "on")
		fmt.Fprintln(r.Out, "  SELinux: httpd_can_network_connect enabled")
	}

	return nil
}

// filePathPattern restricts file paths to safe characters for use in sed
// arguments. Only allows alphanumeric, dots, underscores, hyphens, and slashes.
var filePathPattern = regexp.MustCompile(`^/[a-zA-Z0-9._/-]+$`)

// validateFilePath checks that a file path is absolute and contains only
// safe characters for interpolation into sed commands.
func validateFilePath(path string) error {
	if path == "" {
		return fmt.Errorf("path is empty")
	}
	if !filePathPattern.MatchString(path) {
		return fmt.Errorf("path contains unsafe characters: %s", path)
	}
	if strings.Contains(path, "..") {
		return fmt.Errorf("path contains traversal: %s", path)
	}
	return nil
}

// hostnamePattern validates that a hostname or IP is safe for use in sed
// regex patterns and openssl certificate subjects.
var hostnamePattern = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9.\-]{0,252}[a-zA-Z0-9]$|^[a-zA-Z0-9]$`)

// validateHostname checks that a hostname is well-formed and safe for use
// in sed commands and openssl -subj arguments.
func validateHostname(host string) error {
	if host == "" {
		return fmt.Errorf("hostname is empty")
	}
	if !hostnamePattern.MatchString(host) {
		return fmt.Errorf("invalid hostname: contains unsafe characters")
	}
	return nil
}

// isPrivateHostname returns true for hostnames that need Caddy's internal CA
// instead of Let's Encrypt ACME (which can't validate private names).
func isPrivateHostname(host string) bool {
	privateSuffixes := []string{
		".internal", ".local", ".lan", ".localdomain",
		".home.arpa", ".corp", ".private", ".test",
	}
	for _, suffix := range privateSuffixes {
		if strings.HasSuffix(host, suffix) {
			return true
		}
	}
	// Single-label hostname (no dots) is private
	if !strings.Contains(host, ".") {
		return true
	}
	return false
}

// stepSecurityPolicies configures SELinux, fapolicyd, and firewalld.
// Reads PORT from backend.env to register the correct port (not hardcoded 3000).
func (r *SetupRunner) stepSecurityPolicies() error {
	env, err := r.Env.ReadEnv()
	if err != nil {
		return err
	}
	port := envDefault(env, "PORT", DefaultAppPort)
	if !r.bundledRuntime {
		if err := configureSELinuxPorts(r.Exec, r.FS, r.Paths.ConfigDir, []selinuxPort{{"heimdall_server_port_t", port}}, true); err != nil {
			return err
		}
		if err := (&FapolicydRunner{Exec: r.Exec, FS: r.FS, Systemd: r.Systemd, Out: r.Out}).Add(); err != nil {
			return err
		}
	}
	if err := restoreSELinuxPaths(r.Exec, r.FS, r.Paths.AppDir, r.Paths.ConfigDir, r.Paths.DataDir, r.Paths.LogDir, "/run/heimdall-server"); err != nil {
		return err
	}

	// File permission hardening
	r.Exec.Run("chown", "root:heimdall", r.Paths.ConfigDir)
	configMode := "0750"
	if r.bundledRuntime {
		configMode = "0751"
	}
	r.Exec.Run("chmod", configMode, r.Paths.ConfigDir)
	r.Exec.Run("chown", "-R", "heimdall:heimdall", r.Paths.DataDir)
	r.Exec.Run("chmod", "0750", r.Paths.DataDir)
	// The app can replace this directory entry; never follow it with root privileges.
	if err := runChecked(r.Exec, "runuser", "-u", "heimdall", "--", "chmod", "0700", r.Paths.DataDir+"/backups"); err != nil {
		return err
	}
	r.Exec.Run("chown", "-R", "heimdall:heimdall", r.Paths.LogDir)
	r.Exec.Run("chmod", "0750", r.Paths.LogDir)
	fmt.Fprintln(r.Out, "  File permissions hardened")
	r.rollbackFirewall, err = r.configureFirewall(port, r.ProxyMode, r.previousBackendPort, env["EXTERNAL_URL"])
	return err
}

// stepStartService enables and starts the service.
// Validates that required config exists before attempting to start.
func (r *SetupRunner) stepStartService() error {
	// Verify critical config exists before starting (matches heimdall-server.sh)
	env, _ := r.Env.ReadEnv()
	if env["DATABASE_PASSWORD"] == "" {
		return fmt.Errorf("DATABASE_PASSWORD is not set in %s — run setup first", r.Env.GetEnvFilePath())
	}

	if err := r.Systemd.Enable(ServiceName); err != nil {
		return fmt.Errorf("enabling service: %w", err)
	}
	if err := r.Systemd.Restart(ServiceName); err != nil {
		return fmt.Errorf("restarting service: %w", err)
	}
	active, err := r.Systemd.IsActive(ServiceName)
	if err != nil {
		return err
	}
	if !active {
		return fmt.Errorf("service %s is not active after restart", ServiceName)
	}
	fmt.Fprintln(r.Out, "  Service enabled and started")
	return nil
}

func (r *SetupRunner) printCompletionBanner() {
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "==========================================")
	fmt.Fprintln(r.Out, " Heimdall server is running.")
	if r.ExternalURL != "" {
		fmt.Fprintf(r.Out, " Open: %s\n", r.ExternalURL)
	}
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, " Useful commands:")
	fmt.Fprintf(r.Out, "   systemctl status  %s\n", ServiceName)
	fmt.Fprintf(r.Out, "   journalctl -u     %s\n", ServiceName)

	cloud := r.detectCloud()
	r.printCloudHint(cloud)

	fmt.Fprintln(r.Out, "==========================================")
}

// detectCloud checks cloud metadata endpoints.
func (r *SetupRunner) detectCloud() string {
	// EC2
	out, exitCode, _ := r.Exec.Run("curl", "-sf", "-m", "2", "http://169.254.169.254/latest/meta-data/instance-id")
	if exitCode == 0 && out != "" {
		return "ec2"
	}
	// Azure
	out, exitCode, _ = r.Exec.Run("curl", "-sf", "-m", "2", "-H", "Metadata:true",
		"http://169.254.169.254/metadata/instance?api-version=2021-02-01")
	if exitCode == 0 && out != "" {
		return "azure"
	}
	// GCP
	out, exitCode, _ = r.Exec.Run("curl", "-sf", "-m", "2", "-H", "Metadata-Flavor: Google",
		"http://metadata.google.internal/")
	if exitCode == 0 && out != "" {
		return "gcp"
	}
	return "bare-metal"
}

func (r *SetupRunner) printCloudHint(cloud string) {
	switch cloud {
	case "ec2":
		fmt.Fprintln(r.Out)
		fmt.Fprintln(r.Out, "  NOTE: Detected AWS EC2 instance.")
		fmt.Fprintln(r.Out, "  Ensure your Security Group allows inbound HTTPS (TCP 443).")
	case "azure":
		fmt.Fprintln(r.Out)
		fmt.Fprintln(r.Out, "  NOTE: Detected Azure VM.")
		fmt.Fprintln(r.Out, "  Ensure your Network Security Group (NSG) allows inbound HTTPS (TCP 443).")
	case "gcp":
		fmt.Fprintln(r.Out)
		fmt.Fprintln(r.Out, "  NOTE: Detected GCP VM.")
		fmt.Fprintln(r.Out, "  Ensure your VPC firewall rule allows inbound HTTPS (TCP 443).")
	}
}

// isLocalHost returns true if the host refers to localhost.
func isLocalHost(host string) bool {
	h := strings.TrimSpace(host)
	if h == "" || h == "localhost" {
		return true
	}
	ip := net.ParseIP(h)
	return ip != nil && ip.IsLoopback()
}

// randomHex generates n random bytes and returns them hex-encoded.
// Uses crypto/rand which delegates to BoringSSL under GOEXPERIMENT=boringcrypto (FIPS).
func randomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// safeManagedPath rejects symlinks and unexpected objects before root writes.
// Ancestors must be directories; a missing leaf is allowed for initial setup.
func safeManagedPath(fs FileSystem, path string) error {
	if !filepath.IsAbs(path) || filepath.Clean(path) != path {
		return fmt.Errorf("unsafe managed path: %s", path)
	}
	for current := path; current != "/"; current = filepath.Dir(current) {
		info, err := fs.Lstat(current)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return err
		}
		if stat, ok := info.Sys().(*syscall.Stat_t); ok && info.Mode().IsRegular() && stat.Nlink > 1 {
			return fmt.Errorf("unsafe hard-linked managed path: %s", current)
		}
		if info.Mode()&os.ModeSymlink != 0 || (current != path && !info.IsDir()) || (current == path && !info.Mode().IsRegular()) {
			return fmt.Errorf("unsafe managed path: %s", current)
		}
	}
	return nil
}

func requireRegular(fs FileSystem, path string) error {
	if err := safeManagedPath(fs, path); err != nil {
		return err
	}
	info, err := fs.Stat(path)
	if err != nil {
		return fmt.Errorf("required runtime/configuration file %s: %w", path, err)
	}
	if !info.Mode().IsRegular() {
		return fmt.Errorf("expected a regular file: %s", path)
	}
	return nil
}

func runChecked(exec ExecRunner, name string, args ...string) error {
	out, code, err := exec.Run(name, args...)
	if err != nil || code != 0 {
		return fmt.Errorf("%s failed (exit %d): %s: %v", name, code, strings.TrimSpace(out), err)
	}
	return nil
}

func checkOwnedPort(exec ExecRunner, systemd SystemdRunner, port int, unit string, udp bool) error {
	flags := "-ltnp"
	if udp {
		flags = "-lunp"
	}
	out, code, err := exec.Run("ss", "-H", flags, "sport = :"+strconv.Itoa(port))
	if err != nil || code != 0 {
		return fmt.Errorf("cannot check port %d with ss (exit %d): %v", port, code, err)
	}
	if strings.TrimSpace(out) == "" {
		return nil
	}
	active, err := systemd.IsActive(unit)
	if err != nil {
		return err
	}
	pid, err := systemd.ShowProperty(unit, "MainPID")
	if err != nil {
		return err
	}
	pidNum, _ := strconv.Atoi(strings.TrimSpace(pid))
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		fields := strings.Fields(line)
		if !active || pidNum <= 0 || len(fields) < 6 || (fields[0] != "LISTEN" && fields[0] != "UNCONN") || !strings.HasSuffix(fields[3], ":"+strconv.Itoa(port)) {
			return fmt.Errorf("port %d is occupied by a process outside %s; choose another port or reconfigure its owner", port, unit)
		}
		owners := regexp.MustCompile(`pid=([0-9]+),`).FindAllStringSubmatch(line, -1)
		if len(owners) == 0 {
			return fmt.Errorf("cannot identify listener owner on port %d", port)
		}
		for _, match := range owners {
			if match[1] == strings.TrimSpace(pid) {
				continue
			}
			group, err := systemd.ShowProperty(unit, "ControlGroup")
			if err != nil || !strings.HasPrefix(group, "/") || group == "/" {
				return fmt.Errorf("cannot verify worker ownership for %s", unit)
			}
			out, code, err := exec.Run("cat", "/proc/"+match[1]+"/cgroup")
			if err != nil || code != 0 {
				return fmt.Errorf("cannot verify listener process %s on port %d", match[1], port)
			}
			owned := false
			for _, entry := range strings.Split(strings.TrimSpace(out), "\n") {
				fields := strings.SplitN(entry, ":", 3)
				if len(fields) == 3 && fields[2] == group {
					owned = true
				}
			}
			if !owned {
				return fmt.Errorf("port %d has another owner", port)
			}
		}
	}
	return nil
}

const bundledCaddyService = "heimdall-caddy"
const bundledCaddyRoot = "/var/lib/heimdall-caddy/data/caddy/pki/authorities/local/root.crt"

func certificateLifetimeDays(env map[string]string) (int, error) {
	days := envDefault(env, "HEIMDALL_TLS_CERT_DAYS", "7")
	if err := ValidateValue("HEIMDALL_TLS_CERT_DAYS", days); err != nil {
		return 0, err
	}
	return strconv.Atoi(days)
}

func renderBundledCaddy(env map[string]string) (string, error) {
	return renderPrivateCaddy(env, ConfigDir+"/caddy")
}

func renderPrivateCaddy(env map[string]string, dir string) (string, error) {
	portValue := envDefault(env, "PORT", DefaultAppPort)
	if err := ValidateValue("PORT", portValue); err != nil {
		return "", err
	}
	port, _ := strconv.Atoi(portValue)
	u, err := validatePublicURL(env["EXTERNAL_URL"])
	if err != nil {
		return "", err
	}
	global := "{\n\tadmin unix//run/heimdall-caddy/admin.sock\n\tskip_install_trust\n"
	tlsLine := ""
	switch env["HEIMDALL_TLS_MODE"] {
	case "internal":
		days, err := certificateLifetimeDays(env)
		if err != nil {
			return "", err
		}
		// Caddy renews intermediates with 20% remaining; keep that longer than a leaf lifetime.
		global += fmt.Sprintf("\tpki {\n\t\tca local {\n\t\t\tintermediate_lifetime %dh\n\t\t}\n\t}\n", days*24*6)
		tlsLine = fmt.Sprintf("\ttls {\n\t\tissuer internal {\n\t\t\tlifetime %dh\n\t\t}\n\t}\n", days*24)
	case "custom":
		tlsLine = fmt.Sprintf("\ttls %s %s\n", strconv.Quote(dir+"/certs/server.crt"), strconv.Quote(dir+"/certs/server.key"))
	case "acme":
		if email := env["ADMIN_EMAIL"]; email != "" {
			if strings.ContainsAny(email, "\r\n{}") {
				return "", fmt.Errorf("ADMIN_EMAIL contains unsafe characters")
			}
			global += "\temail " + strconv.Quote(email) + "\n"
		}
	default:
		return "", fmt.Errorf("HEIMDALL_TLS_MODE must be acme, internal or custom")
	}
	return global + "}\n" + strconv.Quote(u.Scheme+"://"+u.Host) + " {\n" + tlsLine + fmt.Sprintf("\treverse_proxy %s\n}\n", strconv.Quote("127.0.0.1:"+strconv.Itoa(port))), nil
}

type savedFile struct {
	path   string
	data   []byte
	mode   os.FileMode
	exists bool
}

func snapshotFile(fs FileSystem, path string) (savedFile, error) {
	s := savedFile{path: path, mode: 0640}
	if err := safeManagedPath(fs, path); err != nil {
		return s, err
	}
	data, err := fs.ReadFile(path)
	if os.IsNotExist(err) {
		return s, nil
	}
	if err != nil {
		return s, err
	}
	info, err := fs.Stat(path)
	if err != nil {
		return s, err
	}
	s.data, s.mode, s.exists = data, info.Mode().Perm(), true
	return s, nil
}
func (s savedFile) restore(fs FileSystem) error {
	if err := safeManagedPath(fs, s.path); err != nil {
		return err
	}
	if !s.exists {
		return fs.RemoveAll(s.path)
	}
	return fs.WriteFile(s.path, s.data, s.mode)
}

type caddyUpdate struct {
	runner              *SetupRunner
	unit, group, runDir string
	config              string
	pending             string
	saved               []savedFile
	certs               map[string][]byte
	active              bool
	enabled             bool
	applied             bool
}

func (r *SetupRunner) prepareBundledCaddy(env map[string]string) (*caddyUpdate, error) {
	dir := r.Paths.ConfigDir + "/caddy"
	config, err := renderPrivateCaddy(env, dir)
	if err != nil {
		return nil, err
	}
	binary := r.Paths.RuntimePath("caddy", "caddy")
	if err := requireRegular(r.FS, binary); err != nil {
		return nil, err
	}
	u, _ := url.Parse(env["EXTERNAL_URL"])
	port := 443
	if u.Scheme == "http" {
		port = 80
	}
	if u.Port() != "" {
		port, _ = strconv.Atoi(u.Port())
	}
	ports := []int{port}
	if u.Scheme == "https" && port != 80 {
		ports = append(ports, 80)
	}
	for _, p := range ports {
		if err := checkOwnedPort(r.Exec, r.Systemd, p, proxyPortOwner(r.previousProxyMode, bundledCaddyService), false); err != nil {
			return nil, err
		}
	}
	if u.Scheme == "https" {
		if err := checkOwnedPort(r.Exec, r.Systemd, port, proxyPortOwner(r.previousProxyMode, bundledCaddyService), true); err != nil {
			return nil, err
		}
	}
	update := &caddyUpdate{runner: r, unit: bundledCaddyService, group: "heimdall-caddy", runDir: "/run/heimdall-caddy", config: config, pending: dir + "/Caddyfile.pending", certs: map[string][]byte{}}
	update.active, err = r.Systemd.IsActive(bundledCaddyService)
	if err != nil {
		return nil, err
	}
	state, err := r.Systemd.ShowProperty(bundledCaddyService, "UnitFileState")
	if err != nil {
		return nil, err
	}
	update.enabled = state == "enabled" || state == "enabled-runtime"
	for _, path := range []string{dir + "/Caddyfile", dir + "/certs/server.crt", dir + "/certs/server.key"} {
		saved, err := snapshotFile(r.FS, path)
		if err != nil {
			return nil, err
		}
		update.saved = append(update.saved, saved)
	}
	for _, path := range []string{update.pending, dir + "/certs/server.crt.pending", dir + "/certs/server.key.pending", "/var/lib/heimdall-caddy/data/.heimdall-check", "/var/lib/heimdall-caddy/config/.heimdall-check", "/run/heimdall-caddy/.heimdall-check"} {
		if err := safeManagedPath(r.FS, path); err != nil {
			return nil, err
		}
	}
	candidate := config
	if env["HEIMDALL_TLS_MODE"] == "custom" {
		cert, err := r.FS.ReadFile(env["HEIMDALL_TLS_CERT"])
		if err != nil {
			return nil, fmt.Errorf("reading custom TLS certificate: %w", err)
		}
		key, err := r.FS.ReadFile(env["HEIMDALL_TLS_KEY"])
		if err != nil {
			return nil, fmt.Errorf("reading custom TLS key: %w", err)
		}
		if _, err := tls.X509KeyPair(cert, key); err != nil {
			return nil, fmt.Errorf("invalid custom TLS certificate/key: %w", err)
		}
		update.certs[dir+"/certs/server.crt"] = cert
		update.certs[dir+"/certs/server.key"] = key
		for path := range update.certs {
			candidate = strings.ReplaceAll(candidate, strconv.Quote(path), strconv.Quote(path+".pending"))
		}
	}
	for _, path := range []string{dir, dir + "/certs"} {
		if err := r.FS.MkdirAll(path, 0750); err != nil {
			return nil, err
		}
		if err := runChecked(r.Exec, "chown", "root:heimdall-caddy", path); err != nil {
			return nil, err
		}
		if err := runChecked(r.Exec, "chmod", "0750", path); err != nil {
			return nil, err
		}
	}
	if err := runChecked(r.Exec, "chmod", "0751", r.Paths.ConfigDir); err != nil {
		return nil, err
	}
	// Validation uses exactly the service account and private state locations.
	for _, path := range []string{"/var/lib/heimdall-caddy/data", "/var/lib/heimdall-caddy/config"} {
		if err := r.FS.MkdirAll(path, 0700); err != nil {
			return nil, err
		}
		if err := runChecked(r.Exec, "chown", "heimdall-caddy:heimdall-caddy", path); err != nil {
			return nil, err
		}
	}
	defer update.cleanup()
	if err := r.FS.RemoveAll(update.pending); err != nil {
		return nil, err
	}
	for path, data := range update.certs {
		if err := r.FS.RemoveAll(path + ".pending"); err != nil {
			return nil, err
		}
		if err := r.FS.WriteFile(path+".pending", data, 0640); err != nil {
			return nil, err
		}
		if err := runChecked(r.Exec, "chown", "root:heimdall-caddy", path+".pending"); err != nil {
			return nil, err
		}
		if err := runChecked(r.Exec, "chmod", "0640", path+".pending"); err != nil {
			return nil, err
		}
	}
	if err := r.FS.WriteFile(update.pending, []byte(candidate), 0640); err != nil {
		return nil, err
	}
	if err := runChecked(r.Exec, "chown", "root:heimdall-caddy", update.pending); err != nil {
		return nil, err
	}
	if err := runChecked(r.Exec, "chmod", "0640", update.pending); err != nil {
		return nil, err
	}
	if err := restoreSELinuxPaths(r.Exec, r.FS, r.Paths.LibExecDir+"/runtime/caddy", r.Paths.ConfigDir+"/caddy", "/var/lib/heimdall-caddy"); err != nil {
		return nil, err
	}
	if err := runChecked(r.Exec, "runuser", "-u", "heimdall-caddy", "--", "env", "XDG_DATA_HOME=/var/lib/heimdall-caddy/data", "XDG_CONFIG_HOME=/var/lib/heimdall-caddy/config", binary, "validate", "--config", update.pending, "--adapter", "caddyfile"); err != nil {
		return nil, fmt.Errorf("validating private Caddy configuration: %w", err)
	}
	return update, nil
}
func (u *caddyUpdate) cleanup() {
	_ = u.runner.FS.RemoveAll(u.pending)
	for path := range u.certs {
		_ = u.runner.FS.RemoveAll(path + ".pending")
	}
}
func (u *caddyUpdate) apply() (err error) {
	r := u.runner
	defer u.cleanup()
	u.applied = true
	defer func() {
		if err != nil {
			err = errors.Join(err, u.rollback())
		}
	}()
	for path, data := range u.certs {
		if err := safeManagedPath(r.FS, path); err != nil {
			return err
		}
		if err := r.FS.WriteFile(path, data, 0640); err != nil {
			return err
		}
		if err := runChecked(r.Exec, "chown", "root:"+u.group, path); err != nil {
			return err
		}
		if err := runChecked(r.Exec, "chmod", "0640", path); err != nil {
			return err
		}
	}
	if err := safeManagedPath(r.FS, u.pending); err != nil {
		return err
	}
	if err := r.FS.WriteFile(u.pending, []byte(u.config), 0640); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chown", "root:"+u.group, u.pending); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chmod", "0640", u.pending); err != nil {
		return err
	}
	if err := r.FS.Rename(u.pending, u.saved[0].path); err != nil {
		return err
	}
	if err := r.FS.MkdirAll(u.runDir, 0750); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chown", u.group+":"+u.group, u.runDir); err != nil {
		return err
	}
	if err := restoreSELinuxPaths(r.Exec, r.FS, filepath.Dir(u.pending), "/var/lib/"+u.group, u.runDir); err != nil {
		return err
	}
	if err := r.Systemd.Enable(u.unit); err != nil {
		return err
	}
	if u.active {
		err = r.Systemd.Reload(u.unit)
	} else {
		err = r.Systemd.Start(u.unit)
	}
	if err != nil {
		return err
	}
	active, err := r.Systemd.IsActive(u.unit)
	if err != nil {
		return err
	}
	if !active {
		return fmt.Errorf("private proxy is not active after activation")
	}
	return nil
}
func (u *caddyUpdate) rollback() error {
	if !u.applied {
		return nil
	}
	u.applied = false
	var errs []error
	for _, saved := range u.saved {
		errs = append(errs, saved.restore(u.runner.FS))
	}
	if u.active {
		errs = append(errs, u.runner.Systemd.Reload(u.unit))
	} else {
		errs = append(errs, u.runner.Systemd.Stop(u.unit))
	}
	if !u.enabled {
		errs = append(errs, runChecked(u.runner.Exec, "systemctl", "disable", u.unit))
	}
	return errors.Join(errs...)
}

const databaseDependency = "/etc/systemd/system/heimdall-server.service.d/database.conf"
const databaseDependencyContent = "[Unit]\nRequires=heimdall-postgresql.service\nAfter=heimdall-postgresql.service\n"

// RPM setup stages settings until every replacement can be validated. A failed
// activation restores configuration; a migration failure always leaves the app stopped.
func (r *SetupRunner) runBundledSetup(existing map[string]string) (err error) {
	env := r.pendingConfig
	marker := r.Paths.ConfigDir + "/upgrade-pending"
	if err := rootManagedFile(r.FS, marker); err != nil {
		return err
	}
	originalMarker, err := snapshotFile(r.FS, marker)
	if err != nil {
		return err
	}
	markerRemoved := false
	selectedPorts, err := r.selectedSELinuxPorts(env)
	if err != nil {
		return err
	}
	if err := configureSELinuxPorts(r.Exec, r.FS, r.Paths.ConfigDir, selectedPorts, false); err != nil {
		return err
	}
	portValue := envDefault(env, "PORT", DefaultAppPort)
	if err := ValidateValue("PORT", portValue); err != nil {
		return err
	}
	port, _ := strconv.Atoi(portValue)
	if err := checkOwnedPort(r.Exec, r.Systemd, port, ServiceName, false); err != nil {
		return err
	}
	if !r.SkipTLS && r.ProxyMode != "bundled" && r.ProxyMode != "nginx" {
		target, err := validatePublicURL(env["EXTERNAL_URL"])
		if err != nil {
			return err
		}
		if r.ProxyMode == "external" {
			proxyPort := 443
			if target.Scheme == "http" {
				proxyPort = 80
			}
			if target.Port() != "" {
				proxyPort, _ = strconv.Atoi(target.Port())
			}
			if err := r.rejectPrivateEndpoint(target.Hostname(), proxyPort, bundledCaddyService); err != nil {
				return err
			}
			if err := r.rejectPrivateEndpoint(target.Hostname(), proxyPort, bundledNginxService); err != nil {
				return err
			}
		}
	}
	if !r.SkipDB && r.DatabaseMode == "external" {
		if err := r.rejectPrivateEndpoint(r.DBHost, r.DBPort, bundledPGService); err != nil {
			return err
		}
	}

	before, err := snapshotFile(r.FS, r.Env.GetEnvFilePath())
	if err != nil {
		return err
	}
	dependency, err := snapshotFile(r.FS, databaseDependency)
	if err != nil {
		return err
	}
	if dependency.exists && string(dependency.data) != databaseDependencyContent {
		return fmt.Errorf("refusing to replace an unrecognized database dependency: %s", databaseDependency)
	}
	if !r.SkipDB && r.DatabaseMode == "bundled" {
		bootstrap := &PostgresBootstrapRunner{Paths: r.Paths, FS: r.FS, Exec: r.Exec, Systemd: r.Systemd, DBHost: r.DBHost, DBPort: r.DBPort, DBUser: r.DBUser}
		if _, err := bootstrap.bundledPreflight(); err != nil {
			return err
		}
	}
	if err := (&FapolicydRunner{Exec: r.Exec, FS: r.FS, Systemd: r.Systemd, Out: r.Out}).Add(); err != nil {
		return err
	}
	if err := restoreSELinuxPaths(r.Exec, r.FS, r.Paths.LibExecDir+"/runtime", r.Paths.AppDir, r.Paths.ConfigDir); err != nil {
		return err
	}
	if !r.SkipDB && r.DatabaseMode == "external" {
		cfg, err := resolveDBConfig(env)
		if err != nil {
			return err
		}
		if err := configureDBConnector(r.DB, r.Paths, r.FS, cfg); err != nil {
			return err
		}
		if err := r.DB.TestConnection(cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName); err != nil {
			return err
		}
		if err := checkPostgresServer(r.Exec, r.Paths, r.FS, cfg); err != nil {
			return err
		}
	}
	if err := configureSELinuxPorts(r.Exec, r.FS, r.Paths.ConfigDir, selectedPorts, true); err != nil {
		return err
	}
	var proxy *caddyUpdate
	if !r.SkipTLS && (r.ProxyMode == "bundled" || r.ProxyMode == "nginx") {
		if r.ProxyMode == "nginx" {
			proxy, err = r.prepareBundledNginx(env)
		} else {
			proxy, err = r.prepareBundledCaddy(env)
		}
		if err != nil {
			return err
		}
		if r.TLSMode == "custom" {
			env["HEIMDALL_TLS_CERT"] = r.Paths.ConfigDir + "/caddy/certs/server.crt"
			env["HEIMDALL_TLS_KEY"] = r.Paths.ConfigDir + "/caddy/certs/server.key"
		}
	}
	var previousPG []savedFile
	pgWasActive, pgWasEnabled := false, false
	if !r.SkipDB && r.DatabaseMode == "bundled" {
		pgWasActive, err = r.Systemd.IsActive(bundledPGService)
		if err != nil {
			return err
		}
		state, err := r.Systemd.ShowProperty(bundledPGService, "UnitFileState")
		if err != nil {
			return err
		}
		pgWasEnabled = state == "enabled" || state == "enabled-runtime"
		if r.FS.Exists(bundledPGData + "/PG_VERSION") {
			for _, file := range []string{"postgresql.conf", "heimdall.conf", "pg_hba.conf"} {
				snapshot, err := snapshotFile(r.FS, bundledPGData+"/"+file)
				if err != nil {
					return err
				}
				previousPG = append(previousPG, snapshot)
			}
		}
	}
	pgChanged := false
	var disabled []struct {
		unit            string
		active, enabled bool
	}
	wrote, dependencyChanged, startAttempted := false, false, false
	defer func() {
		if err == nil {
			return
		}
		var rollback []error
		if markerRemoved {
			markerErr := func() error {
				if err := rootManagedFile(r.FS, marker); err != nil {
					return err
				}
				if err := r.FS.WriteFile(marker, originalMarker.data, 0600); err != nil {
					return err
				}
				if err := runChecked(r.Exec, "chown", "root:root", marker); err != nil {
					return err
				}
				return runChecked(r.Exec, "chmod", "0600", marker)
			}()
			rollback = append(rollback, markerErr)
		}
		// Stop any partially started app before restoring prior configuration.
		if startAttempted {
			rollback = append(rollback, r.Systemd.Stop(ServiceName))
		}
		if proxy != nil {
			rollback = append(rollback, proxy.rollback())
		}
		if pgChanged && (existing["HEIMDALL_DATABASE_MODE"] == "bundled" || dependency.exists) && existing["DATABASE_USERNAME"] == r.DBUser && existing["DATABASE_PASSWORD"] != "" && existing["DATABASE_PASSWORD"] != r.DBPassword {
			previous := &PostgresBootstrapRunner{Paths: r.Paths, Exec: r.Exec, DBPort: r.DBPort, DBUser: r.DBUser, DBPassword: existing["DATABASE_PASSWORD"]}
			install := &pgInstall{PsqlBin: r.Paths.RuntimePath("postgresql", "bin", "psql"), SocketDir: bundledPGSocket, OSUser: "heimdall-postgres"}
			if readyErr := previous.waitReady(install); readyErr != nil {
				rollback = append(rollback, readyErr)
			} else {
				rollback = append(rollback, previous.configureRole(install))
			}
		}
		if pgChanged {
			for _, saved := range previousPG {
				rollback = append(rollback, saved.restore(r.FS))
			}
			if pgWasActive {
				rollback = append(rollback, r.Systemd.Restart(bundledPGService))
			} else {
				rollback = append(rollback, r.Systemd.Stop(bundledPGService))
			}
		}

		if pgChanged && !pgWasEnabled {
			rollback = append(rollback, runChecked(r.Exec, "systemctl", "disable", bundledPGService))
		}
		if wrote {
			rollback = append(rollback, r.Env.WriteEnvFile(existing))
			if _, fileBacked := r.Env.(*FileEnvManager); fileBacked {
				rollback = append(rollback, before.restore(r.FS))
			}
		}
		if dependencyChanged {
			rollback = append(rollback, dependency.restore(r.FS), runChecked(r.Exec, "systemctl", "daemon-reload"))
		}
		for _, unit := range disabled {
			if unit.enabled {
				rollback = append(rollback, r.Systemd.Enable(unit.unit))
			}
			if unit.active {
				rollback = append(rollback, r.Systemd.Start(unit.unit))
			}
		}

		err = errors.Join(append([]error{err}, rollback...)...)
	}()
	r.printSummary(r.DatabaseMode == "bundled")
	if !r.SkipDB || r.FS.Exists(marker) {
		if err := r.Systemd.Stop(ServiceName); err != nil {
			return err
		}
	}
	wrote = true
	if err := r.Env.WriteEnvFile(env); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chown", "root:heimdall", r.Env.GetEnvFilePath()); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chmod", "0640", r.Env.GetEnvFilePath()); err != nil {
		return err
	}
	if !r.SkipDB {
		if r.DatabaseMode == "bundled" {
			pgChanged = true
			if err := r.stepPostgresBootstrap(); err != nil {
				return err
			}
			if err := r.stepConnectionTest(); err != nil {
				return err
			}
		}
		if err := r.stepMigrations(); err != nil {
			return err
		}
		if r.DatabaseMode == "bundled" {
			if err := r.FS.MkdirAll(filepath.Dir(databaseDependency), 0755); err != nil {
				return err
			}
			dependencyChanged = true
			if err := r.FS.WriteFile(databaseDependency, []byte(databaseDependencyContent), 0644); err != nil {
				return err
			}
		} else if dependency.exists {
			dependencyChanged = true
			if err := r.FS.RemoveAll(databaseDependency); err != nil {
				return err
			}
		}
		if dependencyChanged {
			if err := runChecked(r.Exec, "systemctl", "daemon-reload"); err != nil {
				return err
			}
		}
	}
	if proxy != nil {
		oldUnit := ""
		if existing["HEIMDALL_PROXY_MODE"] == "bundled" && r.ProxyMode == "nginx" {
			oldUnit = bundledCaddyService
		}
		if existing["HEIMDALL_PROXY_MODE"] == "nginx" && r.ProxyMode == "bundled" {
			oldUnit = bundledNginxService
		}
		if oldUnit != "" {
			active, e := r.Systemd.IsActive(oldUnit)
			if e != nil {
				return e
			}
			state, e := r.Systemd.ShowProperty(oldUnit, "UnitFileState")
			if e != nil {
				return e
			}
			disabled = append(disabled, struct {
				unit            string
				active, enabled bool
			}{oldUnit, active, state == "enabled" || state == "enabled-runtime"})
			if e := runChecked(r.Exec, "systemctl", "disable", "--now", oldUnit); e != nil {
				return e
			}
		}
		if err := proxy.apply(); err != nil {
			return err
		}
		if r.TLSMode == "internal" {
			fmt.Fprintln(r.Out, "  Import the private Caddy CA where needed:", bundledCaddyRoot)
		}
	}
	// Replacements passed their applicable preflight checks. Retain deselected state.
	for _, selection := range []struct {
		skip                       bool
		mode, key, unit, ownedMode string
	}{
		{r.SkipDB, r.DatabaseMode, "HEIMDALL_DATABASE_MODE", bundledPGService, "bundled"},
		{r.SkipTLS, r.ProxyMode, "HEIMDALL_PROXY_MODE", bundledCaddyService, "bundled"},
		{r.SkipTLS, r.ProxyMode, "HEIMDALL_PROXY_MODE", bundledNginxService, "nginx"},
	} {
		if selection.skip || selection.mode == selection.ownedMode || (proxy != nil && selection.key == "HEIMDALL_PROXY_MODE") {
			continue
		}
		active, err := r.Systemd.IsActive(selection.unit)
		if err != nil {
			return err
		}
		if existing[selection.key] == selection.ownedMode || (selection.unit == bundledPGService && dependency.exists) {
			state, err := r.Systemd.ShowProperty(selection.unit, "UnitFileState")
			if err != nil {
				return err
			}
			disabled = append(disabled, struct {
				unit            string
				active, enabled bool
			}{selection.unit, active, state == "enabled" || state == "enabled-runtime"})
			if err := runChecked(r.Exec, "systemctl", "disable", "--now", selection.unit); err != nil {
				return err
			}
		}
	}
	if r.ProxyMode != "bundled" && r.ProxyMode != "nginx" {
		fmt.Fprintf(r.Out, "  Backend address: http://127.0.0.1:%s\n", envDefault(env, "PORT", DefaultAppPort))
	}
	if err := r.stepSecurityPolicies(); err != nil {
		return err
	}
	if r.FS.Exists(marker) {
		if r.SkipDB {
			fmt.Fprintln(r.Out, "Upgrade pending: migrations were skipped; application remains stopped. Run setup --non-interactive.")
			return nil
		}
		if err := rootManagedFile(r.FS, marker); err != nil {
			return err
		}
		if err := r.FS.RemoveAll(marker); err != nil {
			return err
		}
		markerRemoved = true
	}
	startAttempted = true
	if err := r.stepStartService(); err != nil {
		return err
	}
	r.printCompletionBanner()
	return nil
}

func validatePublicURL(raw string) (*url.URL, error) {
	u, err := url.Parse(raw)
	if err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.User != nil || u.RawQuery != "" || u.ForceQuery || u.Fragment != "" || (u.Path != "" && u.Path != "/") || u.Hostname() == "" {
		return nil, fmt.Errorf("EXTERNAL_URL must be an http/https URL without credentials, query, fragment or path")
	}
	if net.ParseIP(u.Hostname()) == nil {
		if err := validateHostname(u.Hostname()); err != nil {
			return nil, err
		}
	}
	if strings.HasSuffix(u.Host, ":") {
		return nil, fmt.Errorf("EXTERNAL_URL has an empty port")
	}
	if raw := u.Port(); raw != "" {
		p, err := strconv.Atoi(raw)
		if err != nil || p < 1 || p > 65535 {
			return nil, fmt.Errorf("EXTERNAL_URL has an invalid port")
		}
	}
	return u, nil
}

// Reject a demonstrably dependent local endpoint before disabling its provider.
// A public hostname alone does not establish that a remote proxy depends on us.
func (r *SetupRunner) rejectPrivateEndpoint(host string, port int, unit string) error {
	var addresses []net.IP
	if strings.EqualFold(strings.TrimSuffix(host, "."), "localhost") {
		addresses = []net.IP{net.ParseIP("127.0.0.1"), net.ParseIP("::1")}
	} else if ip := net.ParseIP(host); ip != nil {
		local := ip.IsLoopback()
		if !local {
			interfaces, err := net.InterfaceAddrs()
			if err != nil {
				return fmt.Errorf("checking local addresses: %w", err)
			}
			for _, address := range interfaces {
				iface, _, err := net.ParseCIDR(address.String())
				if err == nil && iface.Equal(ip) {
					local = true
					break
				}
			}
		}
		if local {
			addresses = []net.IP{ip}
		}
	}
	if len(addresses) == 0 {
		return nil
	}
	active, err := r.Systemd.IsActive(unit)
	if err != nil {
		return err
	}
	if !active {
		return nil
	}
	pid, err := r.Systemd.ShowProperty(unit, "MainPID")
	if err != nil {
		return err
	}
	pid = strings.TrimSpace(pid)
	number, err := strconv.Atoi(pid)
	if err != nil || number <= 0 {
		return fmt.Errorf("cannot verify external endpoint independence: %s has no valid MainPID", unit)
	}
	out, code, err := r.Exec.Run("ss", "-H", "-ltnp", "sport = :"+strconv.Itoa(port))
	if err != nil || code != 0 {
		return fmt.Errorf("cannot verify external endpoint independence on port %d (ss exit %d): %v", port, code, err)
	}
	if strings.TrimSpace(out) == "" {
		return nil
	}
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 5 || fields[0] != "LISTEN" {
			return fmt.Errorf("cannot parse listener while checking external endpoint on port %d", port)
		}
		address, listenPort, err := net.SplitHostPort(fields[3])
		if err != nil || listenPort != strconv.Itoa(port) {
			return fmt.Errorf("unexpected listener while checking external endpoint on port %d", port)
		}
		listenIP := net.ParseIP(address)
		if address != "*" && listenIP == nil {
			return fmt.Errorf("invalid listener address while checking external endpoint on port %d", port)
		}
		matches := false
		for _, ip := range addresses {
			if address == "*" || listenIP.Equal(ip) || (listenIP.IsUnspecified() && (listenIP.To4() == nil || ip.To4() != nil)) {
				matches = true
				break
			}
		}
		if matches {
			owners := regexp.MustCompile(`pid=([0-9]+),`).FindAllStringSubmatch(line, -1)
			if len(owners) == 0 {
				return fmt.Errorf("cannot identify listener owner for external endpoint %s:%d", host, port)
			}
			for _, owner := range owners {
				if owner[1] == pid {
					return fmt.Errorf("external endpoint %s:%d is still served by %s; choose an independent endpoint before deselecting that service", host, port, unit)
				}
			}
		}
	}
	return nil
}
