package cmd

import (
	"crypto/rand"
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

const (
	flagTLSMode                      = "tls-mode"
	flagExternalURL                  = "external-url"
	flagTLSCert                      = "tls-cert"
	flagTLSKey                       = "tls-key"
	databasePasswordPrompt           = "Database password"
	defaultDatabaseName              = "heimdall-server-production"
	tlsSelfSigned                    = "self-signed"
	loopbackIPv4                     = "127.0.0.1"
	httpsURLPrefix                   = "https://"
	defaultAdminEmail                = "admin@heimdall.local"
	generatedDatabasePasswordMessage = "  DATABASE_PASSWORD auto-generated"
	configFileOwner                  = "root:heimdall"
	caddyConfigSuffix                = "/caddy"
	caddyKeySuffix                   = "/certs/server.key"
	caddyCertSuffix                  = "/certs/server.crt"
	systemdEnabledRuntime            = "enabled-runtime"
	pendingFileSuffix                = ".pending"
	caddyConfigOwner                 = "root:heimdall-caddy"
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

	DatabaseMode      string
	ProxyMode         string
	TLSMode           string
	flagChanged       map[string]bool
	bundledRuntime    bool
	previousProxyMode string
	rollbackFirewall  func() error
	rollbackTLS       func() error
	stageConfig       bool
	pendingConfig     map[string]string

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
The backend port uses saved PORT, otherwise 3000. Use --port to override it;
managed HTTPS defaults to port 443. Setup rejects listener and
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
			for _, name := range []string{"port", flagDBHost, flagDBPort, flagDBUser, flagDBPassword, flagDBName, flagExternalURL, flagTLSCert, flagTLSKey, flagTLSMode} {
				runner.flagChanged[name] = cmd.Flags().Changed(name)
			}
			return runner.Run()
		},
	}

	flags := cmd.Flags()
	flags.StringVar(&runner.DatabaseMode, "database-mode", "", "Database ownership: bundled or external")
	flags.StringVar(&runner.ProxyMode, "proxy-mode", "", "Proxy ownership: nginx, bundled (Caddy), external, or none")
	flags.StringVar(&runner.TLSMode, flagTLSMode, "", "Proxy TLS: self-signed (Nginx), acme, internal, or custom")
	flags.BoolVar(&runner.Interactive, "interactive", false, "Prompt for configuration values")
	flags.BoolVar(&runner.NonInteract, "non-interactive", false, "Accept defaults and auto-generate secrets")
	flags.StringVar(&runner.Port, "port", DefaultAppPort, "Backend listen port (1024-65535; saved PORT wins unless explicitly set)")
	flags.StringVar(&runner.DBHost, flagDBHost, "localhost", "Database host")
	flags.IntVar(&runner.DBPort, flagDBPort, 5432, "Database port")
	flags.StringVar(&runner.DBUser, flagDBUser, "postgres", "Database user")
	flags.StringVar(&runner.DBPassword, flagDBPassword, "", databasePasswordPrompt)
	flags.StringVar(&runner.DBName, flagDBName, defaultDatabaseName, "Database name")
	flags.StringVar(&runner.ExternalURL, flagExternalURL, "", "Public URL (e.g. https://heimdall.example.com)")
	flags.StringVar(&runner.TLSCert, flagTLSCert, "", "Path to TLS certificate (PEM)")
	flags.StringVar(&runner.TLSKey, flagTLSKey, "", "Path to TLS private key (PEM)")
	flags.BoolVar(&runner.SkipDB, "skip-db", false, "Skip PostgreSQL bootstrap and migrations")
	flags.BoolVar(&runner.SkipTLS, "skip-tls", false, "Skip TLS reverse proxy setup")
	flags.BoolVar(&runner.Reconfigure, "reconfigure", false, "Re-run only the configuration step")
	flags.BoolVar(&runner.DryRun, "dry-run", false, "Show what setup would do without making changes")

	return cmd
}

// Run executes the 7-step setup.
func (r *SetupRunner) Run() (err error) {
	r.rollbackFirewall = nil
	r.rollbackTLS = nil
	defer func() { err = r.rollbackSetup(err) }()
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
	startAttempted := false
	if !r.bundledRuntime && !r.Reconfigure {
		before, snapshotErr := snapshotFile(r.FS, r.Env.GetEnvFilePath())
		if snapshotErr != nil {
			return snapshotErr
		}
		defer func() {
			if err != nil {
				err = errors.Join(err, r.rollbackStandaloneSetup(existing, before, startAttempted))
			}
		}()
	}
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

	if err := r.runDatabaseSteps(isLocalDB); err != nil {
		return err
	}
	if err := r.runProxyStep(); err != nil {
		return err
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
	startAttempted = true
	if err := r.stepStartService(); err != nil {
		return WrapError(err, "service start failed",
			"Check config: sudo heimdall-cli validate && sudo systemctl status "+ServiceName)
	}

	r.printCompletionBanner()
	return nil
}

func (r *SetupRunner) rollbackSetup(err error) error {
	if err != nil && r.rollbackFirewall != nil {
		err = errors.Join(err, r.rollbackFirewall())
	}
	if err != nil && r.rollbackTLS != nil {
		err = errors.Join(err, r.rollbackTLS())
	}
	r.rollbackTLS = nil
	return err
}

func (r *SetupRunner) rollbackStandaloneSetup(existing map[string]string, before savedFile, startAttempted bool) error {
	var stopErr error
	if startAttempted {
		stopErr = r.Systemd.Stop(ServiceName)
	}
	if _, file := r.Env.(*FileEnvManager); !file {
		return errors.Join(stopErr, r.Env.WriteEnvFile(existing))
	}
	restoreErr := before.restore(r.FS)
	if restoreErr == nil && before.exists {
		restoreErr = runChecked(r.Exec, "chmod", fmt.Sprintf("%04o", before.mode.Perm()), before.path)
	}
	return errors.Join(stopErr, restoreErr)
}

func (r *SetupRunner) runDatabaseSteps(isLocalDB bool) error {
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

	return nil
}

func (r *SetupRunner) runProxyStep() error {
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
	r.previousProxyMode = existing["HEIMDALL_PROXY_MODE"]
	configured := isConfigured(existing)
	requested := r.requestedDeployment(existing, configured)
	nginxAvailable := r.bundledRuntime && r.FS.Exists(r.Paths.RuntimePath("nginx", "sbin", "nginx"))
	d, err := resolveDeployment(existing, requested, configured)
	if err != nil {
		return nil, err
	}
	values, err := r.configurationValues(existing, d, configured)
	if err != nil {
		return nil, err
	}
	host, port, user := r.databaseDefaults(d.DatabaseMode)
	resolve := func(key, flag, value, fallback string) string {
		return r.resolveConfigValue(values, key, flag, value, fallback)
	}
	r.Port = resolve("PORT", "port", r.Port, DefaultAppPort)
	if !r.Interactive || r.flagChanged["port"] {
		if err := ValidateValue("PORT", r.Port); err != nil {
			return nil, WrapError(err, "invalid backend port", "Choose a port from 1024 to 65535 with --port")
		}
	}
	values["DATABASE_HOST"] = resolve("DATABASE_HOST", flagDBHost, r.DBHost, host)
	values["DATABASE_PORT"] = resolve("DATABASE_PORT", flagDBPort, strconv.Itoa(r.DBPort), port)
	values["DATABASE_USERNAME"] = resolve("DATABASE_USERNAME", flagDBUser, r.DBUser, user)
	values["DATABASE_PASSWORD"] = resolve("DATABASE_PASSWORD", flagDBPassword, r.DBPassword, "")
	values["DATABASE_NAME"] = resolve("DATABASE_NAME", flagDBName, r.DBName, defaultDatabaseName)
	cfg, err := resolveDBConfig(values)
	if err != nil {
		return nil, err
	}
	r.DBHost, r.DBPort, r.DBUser, r.DBPassword, r.DBName = cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName
	r.ExternalURL = resolve("EXTERNAL_URL", flagExternalURL, r.ExternalURL, "")
	r.TLSCert = resolve("HEIMDALL_TLS_CERT", flagTLSCert, r.TLSCert, "")
	r.TLSKey = resolve("HEIMDALL_TLS_KEY", flagTLSKey, r.TLSKey, "")
	r.resolveConfiguredTLS(existing, requested, &d)
	r.DatabaseMode, r.ProxyMode, r.TLSMode = d.DatabaseMode, d.ProxyMode, d.TLSMode
	if err := r.validateConfiguredTLS(nginxAvailable); err != nil {
		return nil, err
	}
	if configured && r.bundledRuntime && existing["HEIMDALL_DATABASE_MODE"] == "" && requested.DatabaseMode == "" {
		fmt.Fprintln(r.Out, "  Existing installation: defaulting database and proxy ownership to external; endpoints are preserved.")
	}
	return existing, nil
}

func (r *SetupRunner) requestedDeployment(existing map[string]string, configured bool) Deployment {
	requested := Deployment{r.DatabaseMode, r.ProxyMode, r.TLSMode}
	r.resolveLegacyDeployment(existing, &requested)
	nginxAvailable := r.bundledRuntime && r.FS.Exists(r.Paths.RuntimePath("nginx", "sbin", "nginx"))
	if nginxAvailable && !configured && requested.ProxyMode == "" && existing["HEIMDALL_PROXY_MODE"] == "" && (requested.TLSMode == "" || requested.TLSMode == tlsSelfSigned) && r.TLSCert == "" && r.TLSKey == "" {
		requested.ProxyMode = "nginx"
	}
	if requested.ProxyMode == "nginx" && requested.TLSMode == "" && existing["HEIMDALL_PROXY_MODE"] != "nginx" {
		requested.TLSMode = tlsSelfSigned
	}
	if requested.ProxyMode != "" && requested.ProxyMode != "nginx" && requested.TLSMode == "" && existing["HEIMDALL_TLS_MODE"] == tlsSelfSigned {
		requested.TLSMode = defaultTLSMode(envDefault(existing, "EXTERNAL_URL", r.ExternalURL), r.TLSCert, r.TLSKey)
	}
	return requested
}

func (r *SetupRunner) resolveLegacyDeployment(existing map[string]string, requested *Deployment) {
	if !r.bundledRuntime && requested.DatabaseMode == "" && existing["HEIMDALL_DATABASE_MODE"] == "" {
		host := envDefault(existing, "DATABASE_HOST", "localhost")
		if r.DBHost != "" && ((r.flagChanged == nil && r.DBHost != "localhost") || r.flagChanged[flagDBHost]) {
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
}

func (r *SetupRunner) databaseDefaults(databaseMode string) (host, port, user string) {
	host, port, user = "localhost", "5432", "postgres"
	if r.bundledRuntime && databaseMode == "bundled" {
		host, port, user = loopbackIPv4, "55432", "heimdall"
	}
	return host, port, user
}

func (r *SetupRunner) configurationValues(existing map[string]string, d Deployment, configured bool) (map[string]string, error) {
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
	return values, nil
}

func (r *SetupRunner) resolveConfigValue(values map[string]string, key, flag, value, fallback string) string {
	changed := r.flagChanged[flag]
	if r.flagChanged == nil {
		changed = value != "" && value != "0" && value != fallback
	}
	if changed {
		return value
	}
	return envDefault(values, key, fallback)
}

func (r *SetupRunner) resolveConfiguredTLS(existing map[string]string, requested Deployment, d *Deployment) {
	if requested.TLSMode == "" && d.ProxyMode != "nginx" {
		if (r.flagChanged[flagTLSCert] || r.flagChanged[flagTLSKey]) && r.TLSCert != "" && r.TLSKey != "" {
			d.TLSMode = "custom"
		} else if existing["HEIMDALL_TLS_MODE"] == "" {
			externalURL := r.ExternalURL
			if externalURL == "" && existing["NGINX_HOST"] != "" {
				externalURL = httpsURLPrefix + existing["NGINX_HOST"]
			}
			d.TLSMode = defaultTLSMode(externalURL, r.TLSCert, r.TLSKey)
		}
	}
}

func (r *SetupRunner) validateConfiguredTLS(nginxAvailable bool) error {
	if r.ProxyMode == "nginx" && !nginxAvailable {
		return fmt.Errorf("private Nginx runtime is unavailable; reinstall the current heimdall-server RPM")
	}
	if r.ProxyMode == "bundled" && !r.SkipTLS {
		if (r.TLSCert == "") != (r.TLSKey == "") {
			return fmt.Errorf("--tls-cert and --tls-key must be provided together")
		}
		if r.TLSMode == "custom" && (r.TLSCert == "" || r.TLSKey == "") {
			return fmt.Errorf("custom TLS requires --tls-cert and --tls-key")
		}
	}
	return nil
}

func defaultTLSMode(externalURL, cert, key string) string {
	if cert != "" && key != "" {
		return "custom"
	}
	externalURL, err := normalizeExternalURL(externalURL, "bundled")
	if err != nil {
		return "internal"
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
	existing, rerun, err := r.interactiveExistingConfiguration(existing)
	if err != nil {
		return err
	}
	if rerun {
		return r.interactiveWriteConfig(existing, existing)
	}
	prompted, err := r.interactiveDatabase()
	if err != nil {
		return err
	}
	tlsChoice, err := r.interactiveProxyChoice()
	if err != nil {
		return err
	}
	if err := r.applyInteractiveProxy(tlsChoice); err != nil {
		return err
	}
	application, err := r.interactiveApplication(existing)
	if err != nil {
		return err
	}
	if err := r.interactiveTLSMode(existing, application["EXTERNAL_URL"], tlsChoice); err != nil {
		return err
	}
	certDays, err := r.interactiveCertificateLifetime(existing, application["EXTERNAL_URL"])
	if err != nil {
		return err
	}
	maps.Copy(prompted, application)
	prompted["HEIMDALL_TLS_CERT_DAYS"] = certDays
	return r.interactiveWriteConfig(existing, prompted)
}

func (r *SetupRunner) interactiveExistingConfiguration(existing map[string]string) (map[string]string, bool, error) {
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
			return existing, false, err
		}

		switch action {
		case 0: // Re-run — keep existing config, just rewrite and continue
			fmt.Fprintln(r.Out, "  Re-running with existing configuration")
			return existing, true, nil
		case 1: // Edit — show prompts with existing values as defaults
			// fall through to the full wizard below (existing values as defaults)
		case 2: // Start fresh — clear existing and run full wizard
			existing = map[string]string{}
			if !r.flagChanged[flagDBPassword] {
				r.DBPassword = ""
			}
		}
	}

	return existing, false, nil
}

func (r *SetupRunner) interactiveDatabase() (map[string]string, error) {
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
		return nil, err
	}

	var dbHost, dbPort, dbUser, dbPassword, dbName string

	switch dbChoice {
	case 0: // Bundled/local PostgreSQL — only prompt for password
		dbHost = "localhost"
		dbPort = "5432"
		dbUser = "postgres"
		dbName = r.DBName
		if r.bundledRuntime {
			dbHost, dbPort, dbUser = loopbackIPv4, "55432", "heimdall"
			if r.DatabaseMode == "bundled" {
				dbHost, dbPort, dbUser = r.DBHost, strconv.Itoa(r.DBPort), r.DBUser
			}
		}
		r.DatabaseMode = "bundled"

		dbPassword, err = r.interactivePassword(r.DBPassword)
		if err != nil {
			return nil, err
		}

	case 1: // External PostgreSQL — prompt for all DB fields
		r.DatabaseMode = "external"
		dbHost, err = r.Prompter.Input("Database host", r.DBHost)
		if err != nil {
			return nil, err
		}
		dbPort, err = r.Prompter.Input("Database port", strconv.Itoa(r.DBPort))
		if err != nil {
			return nil, err
		}
		dbUser, err = r.Prompter.Input("Database user", r.DBUser)
		if err != nil {
			return nil, err
		}
		dbPassword, err = r.interactivePassword(r.DBPassword)
		if err != nil {
			return nil, err
		}
		dbName, err = r.Prompter.Input("Database name", r.DBName)
		if err != nil {
			return nil, err
		}

	}

	return map[string]string{
		"DATABASE_HOST": dbHost, "DATABASE_PORT": dbPort,
		"DATABASE_USERNAME": dbUser, "DATABASE_PASSWORD": dbPassword, "DATABASE_NAME": dbName,
	}, nil
}

func (r *SetupRunner) interactiveProxyChoice() (int, error) {
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
		return 0, err
	}

	if tlsChoice < 0 || tlsChoice >= len(tlsOptions) {
		return 0, fmt.Errorf("invalid TLS selection")
	}
	if nginxAvailable {
		tlsChoice--
	}
	return tlsChoice, nil
}

func (r *SetupRunner) applyInteractiveProxy(tlsChoice int) error {
	switch tlsChoice {
	case -1:
		r.ProxyMode, r.TLSMode = "nginx", tlsSelfSigned
	case 0: // Caddy
		r.ProxyMode = "bundled"
		if r.TLSMode == tlsSelfSigned {
			r.TLSMode = "internal"
		}

	case 1: // External SSL termination
		r.ProxyMode = "external"

	case 2: // BYO certificate
		r.ProxyMode = "bundled"
		r.TLSMode = "custom"
		if err := r.interactiveCustomCertificate(); err != nil {
			return err
		}

	case 3: // No TLS
		r.ProxyMode = "none"
	}

	if r.ProxyMode != "nginx" && r.TLSMode == tlsSelfSigned {
		r.TLSMode = "internal"
	}

	return nil
}

func (r *SetupRunner) interactiveCustomCertificate() error {
	cert, err := r.Prompter.Input("TLS certificate path", r.TLSCert)
	if err != nil {
		return err
	}
	key, err := r.Prompter.Input("TLS private key path", r.TLSKey)
	if err != nil {
		return err
	}
	r.TLSCert, r.TLSKey = cert, key
	return nil
}

func (r *SetupRunner) interactiveApplication(existing map[string]string) (map[string]string, error) {
	// --- Application config ---
	fmt.Fprintln(r.Out)
	defaultExternalURL := r.ExternalURL
	if defaultExternalURL == "" {
		defaultExternalURL = envDefault(existing, "NGINX_HOST", "localhost")
	}
	externalURL, err := r.Prompter.Input("External URL", defaultExternalURL)
	if err != nil {
		return nil, err
	}
	if externalURL == "" {
		externalURL = defaultExternalURL
	}
	externalURL, err = normalizeExternalURL(externalURL, r.ProxyMode)
	if err != nil {
		return nil, err
	}
	adminEmail, err := r.Prompter.Input("Admin email", envDefault(existing, "ADMIN_EMAIL", defaultAdminEmail))
	if err != nil {
		return nil, err
	}
	jwtDefault := envDefault(existing, "JWT_EXPIRE_TIME", "1d")
	fmt.Fprintln(r.Out, "  Heimdall caps JWT lifetimes at 2 days.")
	jwtExpire, err := r.Prompter.Input("JWT expiration (e.g. 1d or 25m)", jwtDefault)
	if err != nil {
		return nil, err
	}
	jwtExpire = strings.TrimSpace(jwtExpire)
	if jwtExpire == "" {
		jwtExpire = jwtDefault
	}
	if err := ValidateValue("JWT_EXPIRE_TIME", jwtExpire); err != nil {
		return nil, err
	}

	return map[string]string{"EXTERNAL_URL": externalURL, "ADMIN_EMAIL": adminEmail, "JWT_EXPIRE_TIME": jwtExpire}, nil
}

func (r *SetupRunner) interactiveTLSMode(existing map[string]string, externalURL string, tlsChoice int) error {
	if r.ProxyMode == "bundled" && tlsChoice == 0 {
		mode := r.TLSMode
		if existing["HEIMDALL_TLS_MODE"] == "" && !r.flagChanged[flagTLSMode] {
			mode = defaultTLSMode(externalURL, "", "")
		}
		var err error
		mode, err = r.interactiveCaddyMode(mode)
		if err != nil {
			return err
		}

		r.TLSMode = mode
	}
	if r.ProxyMode == "bundled" && r.TLSMode == "custom" && (r.TLSCert == "" || r.TLSKey == "") {
		return fmt.Errorf("custom TLS requires certificate and key paths")
	}
	return nil
}

func (r *SetupRunner) interactiveCaddyMode(mode string) (string, error) {
	if !r.bundledRuntime {
		return mode, nil
	}
	options := []string{"internal", "acme", "custom"}
	choice, err := r.Prompter.Select("TLS mode", mode, options)
	if err != nil {
		return "", err
	}
	if choice < 0 || choice >= len(options) {
		return "", fmt.Errorf("invalid TLS selection")
	}
	mode = options[choice]
	if mode == "custom" {
		if err := r.interactiveCustomCertificate(); err != nil {
			return "", err
		}
	}
	return mode, nil
}

func (r *SetupRunner) interactiveCertificateLifetime(existing map[string]string, externalURL string) (string, error) {
	certDays := envDefault(existing, "HEIMDALL_TLS_CERT_DAYS", "7")
	u, err := url.Parse(externalURL)
	if err != nil {
		return "", fmt.Errorf("invalid external URL: %w", err)
	}
	localTLS := r.TLSMode == "internal" || r.TLSMode == tlsSelfSigned
	if !r.bundledRuntime {
		strategy := determineTLSStrategy(u.Hostname(), r.TLSCert, r.TLSKey)
		localTLS = strategy == tlsPrivate || strategy == tlsIP
	}
	if (r.ProxyMode == "bundled" || r.ProxyMode == "nginx") && !r.SkipTLS && u.Scheme == "https" && localTLS {
		certDays, err = r.Prompter.Input("Certificate lifetime in days", certDays)
		if err != nil {
			return "", err
		}
		certDays = strings.TrimSpace(certDays)
		if certDays == "" {
			certDays = envDefault(existing, "HEIMDALL_TLS_CERT_DAYS", "7")
		}
		if err := ValidateValue("HEIMDALL_TLS_CERT_DAYS", certDays); err != nil {
			return "", err
		}
		fmt.Fprintln(r.Out, "  Applies to new certificates; existing certificates are preserved.")
		if r.ProxyMode == "bundled" && (r.bundledRuntime || net.ParseIP(u.Hostname()) == nil) {
			fmt.Fprintln(r.Out, "  Caddy may shorten new certificates to the current CA's remaining validity.")
		}
	}

	return certDays, nil
}

// interactivePassword handles the password prompt with auto-generation for empty input.
func (r *SetupRunner) interactivePassword(existingPass string) (string, error) {
	if existingPass != "" {
		fmt.Fprintln(r.Out, "  Database password: [already set -- press Enter to keep]")
		dbPassword, err := r.Prompter.Password(databasePasswordPrompt)
		if err != nil {
			return "", err
		}
		if dbPassword == "" {
			return existingPass, nil
		}
		return dbPassword, nil
	}

	dbPassword, err := ConfirmPassword(r.Prompter, databasePasswordPrompt, true)
	if err != nil {
		return "", err
	}
	if dbPassword == "" {
		b := make([]byte, 33)
		if _, err := rand.Read(b); err != nil {
			return "", fmt.Errorf("generating password: %w", err)
		}
		dbPassword = hex.EncodeToString(b)
		fmt.Fprintln(r.Out, generatedDatabasePasswordMessage)
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
		dbName = defaultDatabaseName
	}
	if adminEmail == "" {
		adminEmail = defaultAdminEmail
	}

	// Auto-generate password if still empty
	if dbPassword == "" {
		b := make([]byte, 33)
		if _, err := rand.Read(b); err != nil {
			return fmt.Errorf("generating password: %w", err)
		}
		dbPassword = hex.EncodeToString(b)
		fmt.Fprintln(r.Out, generatedDatabasePasswordMessage)
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
	apiKeySecret, apiKeySet := existing["API_KEY_SECRET"]
	if apiKeySecret == "" && (!apiKeySet || !isConfigured(existing)) {
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
	return r.writeConfig(settings, map[string]string{
		"DATABASE_HOST": dbHost, "DATABASE_PORT": dbPort, "DATABASE_USERNAME": dbUser,
		"DATABASE_PASSWORD": dbPassword, "DATABASE_NAME": dbName, "JWT_SECRET": jwtSecret,
		"API_KEY_SECRET": apiKeySecret, "NGINX_HOST": nginxHost, "EXTERNAL_URL": externalURL, "ADMIN_EMAIL": adminEmail,
	})
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
		fmt.Fprintln(r.Out, generatedDatabasePasswordMessage)
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

	apiKeySecret, apiKeySet := existing["API_KEY_SECRET"]
	if apiKeySecret == "" && (!apiKeySet || !isConfigured(existing)) {
		var err error
		apiKeySecret, err = randomHex(33)
		if err != nil {
			return fmt.Errorf("generating API key secret: %w", err)
		}
		fmt.Fprintln(r.Out, "  API_KEY_SECRET auto-generated")
	}

	nginxHost := envDefault(existing, "NGINX_HOST", "localhost")
	adminEmail := envDefault(existing, "ADMIN_EMAIL", defaultAdminEmail)
	externalURL := r.ExternalURL
	if externalURL == "" {
		externalURL = nginxHost
	}

	return r.writeConfig(existing, map[string]string{
		"DATABASE_HOST": dbHost, "DATABASE_PORT": dbPort, "DATABASE_USERNAME": dbUser,
		"DATABASE_PASSWORD": dbPassword, "DATABASE_NAME": dbName, "JWT_SECRET": jwtSecret,
		"API_KEY_SECRET": apiKeySecret, "NGINX_HOST": nginxHost, "EXTERNAL_URL": externalURL, "ADMIN_EMAIL": adminEmail,
	})
}

// writeConfig writes the resolved config to the env file.
func (r *SetupRunner) writeConfig(existing, values map[string]string) error {
	dbHost, dbPort, dbUser := values["DATABASE_HOST"], values["DATABASE_PORT"], values["DATABASE_USERNAME"]
	dbPassword, dbName := values["DATABASE_PASSWORD"], values["DATABASE_NAME"]
	jwtSecret, apiKeySecret := values["JWT_SECRET"], values["API_KEY_SECRET"]
	nginxHost, externalURL, adminEmail := values["NGINX_HOST"], values["EXTERNAL_URL"], values["ADMIN_EMAIL"]

	if (r.Reconfigure || r.SkipTLS) && existing["HEIMDALL_PROXY_MODE"] != "" && existing["HEIMDALL_PROXY_MODE"] != r.ProxyMode {
		return &CLIError{Summary: "proxy ownership changes require full setup", Suggestion: "Run heimdall-cli setup without --reconfigure or --skip-tls to change proxy ownership"}
	}
	externalURL, nginxHost, err := r.configurationURL(externalURL, nginxHost)
	if err != nil {
		return err
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
	if err := r.validateSkippedProxy(port, externalURL); err != nil {
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

	return r.persistConfiguration(entries)
}

func (r *SetupRunner) validateSkippedProxy(port, externalURL string) error {
	if !r.SkipTLS {
		return nil
	}
	// The interactive "Start fresh" action clears existing, but leaves the proxy running.
	previous, err := r.Env.ReadEnv()
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	previousProxy := previous["HEIMDALL_PROXY_MODE"]
	if previousProxy == "" && !r.bundledRuntime && r.FS.Exists(standaloneCaddyfile) {
		previousProxy = "bundled"
	}
	if previousProxy != "" && previousProxy != r.ProxyMode {
		return &CLIError{Summary: "proxy ownership changes require full setup", Suggestion: "Run heimdall-cli setup without --reconfigure or --skip-tls to change proxy ownership"}
	}
	if !isConfigured(previous) || (r.ProxyMode != "bundled" && r.ProxyMode != "nginx") {
		return nil
	}
	previousURL, _, err := r.configurationURL(previous["EXTERNAL_URL"], envDefault(previous, "NGINX_HOST", "localhost"))
	if err != nil {
		return err
	}
	previousPort, _ := strconv.Atoi(envDefault(previous, "PORT", DefaultAppPort))
	if port != strconv.Itoa(previousPort) || externalURL != previousURL {
		return &CLIError{Summary: "endpoint changes require proxy setup", Suggestion: "Run heimdall-cli setup without --skip-tls to change the backend port or external URL"}
	}
	return nil
}

func (r *SetupRunner) configurationURL(externalURL, nginxHost string) (string, string, error) {
	if externalURL == "" {
		externalURL = nginxHost
	}
	var err error
	externalURL, err = normalizeExternalURL(externalURL, r.ProxyMode)
	if err != nil {
		return "", "", err
	}
	u, _ := url.Parse(externalURL)
	if r.bundledRuntime {
		if _, err := validatePublicURL(externalURL); err != nil {
			return "", "", err
		}
	}
	nginxHost = u.Hostname()
	if r.ProxyMode == "nginx" && (u.Scheme != "https" || (u.Port() != "" && u.Port() != "443")) {
		return "", "", fmt.Errorf("managed Nginx requires an HTTPS external URL on port 443")
	}
	return externalURL, nginxHost, nil
}

func (r *SetupRunner) persistConfiguration(entries map[string]string) error {
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
	if err := runChecked(r.Exec, "chown", configFileOwner, r.Env.GetEnvFilePath()); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chmod", "0640", r.Env.GetEnvFilePath()); err != nil {
		return err
	}

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
	_, exitCode, err := r.Exec.RunWithEnv(map[string]string{
		"HEIMDALL_ENV_FILE":    r.Env.GetEnvFilePath(),
		"HEIMDALL_APP_DIR":     r.Paths.AppDir,
		"HEIMDALL_LIBEXEC_DIR": r.Paths.LibExecDir,
	}, "heimdall-server-db-setup")
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
func (r *SetupRunner) resolveExternalHost() (host, externalURL string) {
	externalURL = r.ExternalURL
	if externalURL == "" {
		env, _ := r.Env.ReadEnv()
		externalURL = env["EXTERNAL_URL"]
	}

	if externalURL != "" {
		address := externalURL
		if !strings.Contains(address, "://") {
			address = "//" + address
		}
		if parsed, err := url.Parse(address); err == nil {
			host = parsed.Hostname()
		}
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
		externalURL = httpsURLPrefix + host
	}

	// Persist EXTERNAL_URL if not already set
	env, _ := r.Env.ReadEnv()
	if env["EXTERNAL_URL"] == "" {
		r.Env.WriteEnvKey("EXTERNAL_URL", externalURL)
		fmt.Fprintf(r.Out, "  Set EXTERNAL_URL=%s\n", externalURL)
	}
	return host, externalURL
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
func (r *SetupRunner) configureCaddyfile(strategy tlsStrategy, host, externalURL, caddyfileDst string) error {
	env, err := r.Env.ReadEnv()
	if err != nil {
		return err
	}
	port := envDefault(env, "PORT", DefaultAppPort)
	if err := ValidateValue("PORT", port); err != nil {
		return err
	}
	externalURL, err = normalizeExternalURL(externalURL, "bundled")
	if err != nil {
		return err
	}
	publicURL, _ := url.Parse(externalURL)
	days := 7
	if strategy == tlsPrivate || strategy == tlsIP {
		days, err = certificateLifetimeDays(env)
		if err != nil {
			return err
		}
	}
	tlsConfig := ""
	switch strategy {
	case tlsBYO:
		if r.TLSCert == "" || r.TLSKey == "" {
			return fmt.Errorf("custom TLS requires both a certificate and a key")
		}
		cert, err := r.FS.ReadFile(r.TLSCert)
		if err != nil {
			return fmt.Errorf("reading custom TLS certificate: %w", err)
		}
		key, err := r.FS.ReadFile(r.TLSKey)
		if err != nil {
			return fmt.Errorf("reading custom TLS key: %w", err)
		}
		if err := validateTLSCertificate(cert, key, publicURL.Hostname()); err != nil {
			return err
		}
		tlsConfig = fmt.Sprintf("tls %s %s\n\t", strconv.Quote(r.TLSCert), strconv.Quote(r.TLSKey))
		fmt.Fprintf(r.Out, "  Caddy: configured with provided certificate\n")
		fmt.Fprintf(r.Out, "    Cert: %s\n", r.TLSCert)
		fmt.Fprintf(r.Out, "    Key:  %s\n", r.TLSKey)

	case tlsPrivate:
		tlsConfig = fmt.Sprintf("tls {\n\t\tissuer internal {\n\t\t\tlifetime %dh\n\t\t}\n\t}\n\t", days*24)
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
		tlsConfig = fmt.Sprintf("tls %s %s\n\t", strconv.Quote(certFile), strconv.Quote(keyFile))
		fmt.Fprintln(r.Out, "  Caddy: configured with self-signed cert (IP-based deployment)")
	}
	config := fmt.Sprintf("%s://%s {\n\t%sreverse_proxy 127.0.0.1:%s\n}\n", publicURL.Scheme, publicURL.Host, tlsConfig, port)
	return r.FS.WriteFile(caddyfileDst, []byte(config), 0644)
}

func (r *SetupRunner) resolveStandaloneTLSStrategy(host string) (tlsStrategy, error) {
	if r.TLSCert != "" {
		if err := validateFilePath(r.TLSCert); err != nil {
			return 0, fmt.Errorf("unsafe TLS cert path: %w", err)
		}
	}
	if r.TLSKey != "" {
		if err := validateFilePath(r.TLSKey); err != nil {
			return 0, fmt.Errorf("unsafe TLS key path: %w", err)
		}
	}
	strategy := determineTLSStrategy(host, r.TLSCert, r.TLSKey)
	switch r.TLSMode {
	case "internal":
		strategy = tlsPrivate
	case "acme":
		strategy = tlsPublic
	case "custom":
		strategy = tlsBYO
	}
	if strategy == tlsIP {
		if err := validateFilePath(r.Paths.CertDir); err != nil {
			return 0, err
		}
	}
	return strategy, nil
}

func (r *SetupRunner) stepTLS() (err error) {
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

	caddyfileDst := standaloneCaddyfile
	pending := caddyfileDst + ".pending"
	env, err := r.Env.ReadEnv()
	if err != nil {
		return err
	}
	value := r.ExternalURL
	if value == "" {
		value = env["EXTERNAL_URL"]
	}
	if value != "" {
		if _, err := normalizeExternalURL(value, r.ProxyMode); err != nil {
			return err
		}
	}
	port := envDefault(env, "PORT", DefaultAppPort)
	if err := ValidateValue("PORT", port); err != nil {
		return err
	}

	externalHost, externalURL := r.resolveExternalHost()
	if err := validateHostname(externalHost); err != nil {
		return fmt.Errorf("unsafe hostname %q: %w", externalHost, err)
	}
	strategy, err := r.resolveStandaloneTLSStrategy(externalHost)
	if err != nil {
		return err
	}
	var saved []savedFile
	for _, path := range []string{caddyfileDst, "/etc/caddy/Caddyfile", r.Paths.CertDir + "/server.crt", r.Paths.CertDir + "/server.key"} {
		before, err := snapshotFile(r.FS, path)
		if err != nil {
			return err
		}
		saved = append(saved, before)
	}
	if err := safeManagedPath(r.FS, pending); err != nil {
		return err
	}
	wasActive, err := r.Systemd.IsActive("caddy")
	if err != nil {
		return err
	}
	state, err := r.Systemd.ShowProperty("caddy", "UnitFileState")
	if err != nil {
		return err
	}
	previous := serviceState{"caddy", wasActive, state == "enabled" || state == systemdEnabledRuntime}
	restarted, enableAttempted, restored := false, false, false
	rollback := func() error {
		if restored {
			return nil
		}
		restored = true
		return r.restoreStandaloneTLS(saved, previous, restarted, enableAttempted)
	}
	r.rollbackTLS = rollback
	defer func() {
		_ = r.FS.RemoveAll(pending)
		if err != nil {
			err = errors.Join(err, rollback())
		}
	}()
	if err := r.runTLSCommand("mkdir", "-p", "/etc/caddy/Caddyfile.d"); err != nil {
		return err
	}
	if err := r.configureCaddyfile(strategy, externalHost, externalURL, pending); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "caddy", "validate", "--config", pending, "--adapter", "caddyfile"); err != nil {
		return err
	}
	if err := r.FS.Rename(pending, caddyfileDst); err != nil {
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

	enableAttempted = true
	if err := r.Systemd.Enable("caddy"); err != nil {
		return fmt.Errorf("enabling Caddy: %w", err)
	}
	restarted = true
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

func (r *SetupRunner) restoreStandaloneTLS(saved []savedFile, previous serviceState, restarted, enableAttempted bool) error {
	var failures []error
	for _, before := range saved {
		failures = append(failures, before.restore(r.FS))
	}
	if restarted {
		if previous.active {
			failures = append(failures, r.Systemd.Restart(previous.unit))
		} else {
			failures = append(failures, r.Systemd.Stop(previous.unit))
		}
	}
	if enableAttempted && !previous.enabled {
		failures = append(failures, runChecked(r.Exec, "systemctl", "disable", previous.unit))
	}
	return errors.Join(failures...)
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
	if net.ParseIP(host) != nil {
		return nil
	}
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
	host = strings.ToLower(host)
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
	if err := rootManagedFile(r.FS, r.Paths.LogDir+"/.heimdall-log-check"); err != nil {
		return err
	}
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
	configMode := "0750"
	if r.bundledRuntime {
		configMode = "0751"
	}
	for _, dir := range []struct{ path, owner, mode string }{
		{r.Paths.ConfigDir, configFileOwner, configMode},
		{r.Paths.DataDir, "heimdall:heimdall", "0750"},
		{r.Paths.LogDir, configFileOwner, "0750"},
	} {
		if err := safeManagedPath(r.FS, dir.path+"/.heimdall-directory-check"); err != nil {
			return err
		}
		if err := r.FS.MkdirAll(dir.path, 0750); err != nil {
			return err
		}
		if err := runChecked(r.Exec, "chown", dir.owner, dir.path); err != nil {
			return err
		}
		if err := runChecked(r.Exec, "chmod", dir.mode, dir.path); err != nil {
			return err
		}
	}
	fmt.Fprintln(r.Out, "  File permissions hardened")
	r.rollbackFirewall, err = r.configureFirewall(port, r.ProxyMode, env["EXTERNAL_URL"])
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
	env, err := r.Env.ReadEnv()
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "==========================================")
	fmt.Fprintln(r.Out, " Heimdall server is running.")
	if publicURL := envDefault(env, "EXTERNAL_URL", r.ExternalURL); publicURL != "" {
		fmt.Fprintf(r.Out, " Configured URL: %s\n", publicURL)
		if u, parseErr := url.Parse(publicURL); parseErr == nil && isLocalHost(u.Hostname()) {
			fmt.Fprintln(r.Out, " This URL works only on this server.")
		}
	}
	switch {
	case r.SkipTLS:
		fmt.Fprintln(r.Out, " TLS setup was skipped; verify your proxy and HTTPS.")
	case r.ProxyMode == "external":
		fmt.Fprintln(r.Out, " Verify your external proxy and HTTPS.")
	case r.ProxyMode == "none":
		fmt.Fprintln(r.Out, " No reverse proxy was configured; check URL reachability.")
	case r.TLSMode == tlsSelfSigned || r.TLSMode == "internal":
		fmt.Fprintln(r.Out, " For a TLS browser warning, see certificate trust in the guide.")
	}
	fmt.Fprintln(r.Out)
	if r.SkipDB {
		fmt.Fprintln(r.Out, " Database setup and migrations were skipped; verify readiness before login.")
	}
	if err != nil {
		fmt.Fprintf(r.Out, " Could not read login settings; check %s.\n", r.Env.GetEnvFilePath())
	} else if strings.EqualFold(env["LOCAL_LOGIN_DISABLED"], "true") {
		fmt.Fprintln(r.Out, " Local login is disabled; use your configured identity provider.")
	} else {
		adminEmail := envDefault(env, "ADMIN_EMAIL", defaultAdminEmail)
		fmt.Fprintf(r.Out, " Admin email: %s\n", adminEmail)
		if !r.SkipDB {
			fmt.Fprintln(r.Out, " Web login uses a separate password from DATABASE_PASSWORD.")
			fmt.Fprintln(r.Out, " If your web password is unknown, generate one:")
			fmt.Fprintf(r.Out, "   sudo heimdall-cli reset-password '%s'\n", strings.ReplaceAll(adminEmail, "'", "'\\''"))
			fmt.Fprintln(r.Out, " Save the displayed password and sign in with the email above.")
		}
	}
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, " Check: sudo heimdall-cli validate && sudo heimdall-cli status")
	fmt.Fprintf(r.Out, " View configured variables: %s\n", r.Env.GetEnvFilePath())
	fmt.Fprintln(r.Out, " Guide: /usr/share/doc/heimdall-server/INSTALL.md")

	cloud := r.detectCloud()
	r.printCloudHint(cloud)

	fmt.Fprintln(r.Out, "==========================================")
}

// detectCloud checks cloud metadata endpoints.
func (r *SetupRunner) detectCloud() string {
	// EC2
	out, exitCode, _ := r.Exec.Run("curl", "-sf", "-m", "2", "http://169.254.169.254/latest/meta-data/instance-id") // NOSONAR: AWS defines this fixed, non-routable link-local metadata endpoint.
	if exitCode == 0 && out != "" {
		return "ec2"
	}
	// Azure
	out, exitCode, _ = r.Exec.Run("curl", "-sf", "-m", "2", "-H", "Metadata:true",
		"http://169.254.169.254/metadata/instance?api-version=2021-02-01") // NOSONAR: Azure defines this fixed, non-routable link-local metadata endpoint.
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
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		if err := validateOwnedListener(line, port, unit, active, pid); err != nil {
			return err
		}
		if err := checkListenerWorkers(exec, systemd, line, port, unit, pid); err != nil {
			return err
		}
	}
	return nil
}

func validateOwnedListener(line string, port int, unit string, active bool, pid string) error {
	pidNum, _ := strconv.Atoi(strings.TrimSpace(pid))
	fields := strings.Fields(line)
	if !active || pidNum <= 0 || len(fields) < 6 || (fields[0] != "LISTEN" && fields[0] != "UNCONN") || !strings.HasSuffix(fields[3], ":"+strconv.Itoa(port)) {
		return fmt.Errorf("port %d is occupied by a process outside %s; choose another port or reconfigure its owner", port, unit)
	}
	return nil
}

func checkListenerWorkers(exec ExecRunner, systemd SystemdRunner, line string, port int, unit, pid string) error {
	owners := regexp.MustCompile(`pid=([0-9]+),`).FindAllStringSubmatch(line, -1)
	if len(owners) == 0 {
		return fmt.Errorf("cannot identify listener owner on port %d", port)
	}
	for _, match := range owners {
		if match[1] == strings.TrimSpace(pid) {
			continue
		}
		if err := checkListenerControlGroup(exec, systemd, unit, match[1], port); err != nil {
			return err
		}
	}
	return nil
}

func checkListenerControlGroup(exec ExecRunner, systemd SystemdRunner, unit, pid string, port int) error {
	group, err := systemd.ShowProperty(unit, "ControlGroup")
	if err != nil || !strings.HasPrefix(group, "/") || group == "/" {
		return fmt.Errorf("cannot verify worker ownership for %s", unit)
	}
	out, code, err := exec.Run("cat", "/proc/"+pid+"/cgroup")
	if err != nil || code != 0 {
		return fmt.Errorf("cannot verify listener process %s on port %d", pid, port)
	}
	for _, entry := range strings.Split(strings.TrimSpace(out), "\n") {
		fields := strings.SplitN(entry, ":", 3)
		if len(fields) == 3 && fields[2] == group {
			return nil
		}
	}
	return fmt.Errorf("port %d has another owner", port)
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
	return renderPrivateCaddy(env, ConfigDir+caddyConfigSuffix)
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
		tlsLine = fmt.Sprintf("\ttls %s %s\n", strconv.Quote(dir+caddyCertSuffix), strconv.Quote(dir+caddyKeySuffix))
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
	dir := r.Paths.ConfigDir + caddyConfigSuffix
	config, err := renderPrivateCaddy(env, dir)
	if err != nil {
		return nil, err
	}
	binary := r.Paths.RuntimePath("caddy", "caddy")
	if err := requireRegular(r.FS, binary); err != nil {
		return nil, err
	}
	if err := r.checkCaddyPorts(env); err != nil {
		return nil, err
	}
	update := &caddyUpdate{runner: r, unit: bundledCaddyService, group: bundledCaddyService, runDir: "/run/heimdall-caddy", config: config, pending: dir + "/Caddyfile.pending", certs: map[string][]byte{}}
	if err := update.snapshotCaddy(dir); err != nil {
		return nil, err
	}
	candidate, err := update.customCaddyCertificates(env, dir)
	if err != nil {
		return nil, err
	}
	if err := r.prepareCaddyDirectories(dir); err != nil {
		return nil, err
	}
	defer update.cleanup()
	if err := update.stageCaddyConfiguration(candidate); err != nil {
		return nil, err
	}
	if err := restoreSELinuxPaths(r.Exec, r.FS, r.Paths.LibExecDir+"/runtime/caddy", r.Paths.ConfigDir+caddyConfigSuffix, "/var/lib/heimdall-caddy"); err != nil {
		return nil, err
	}
	if err := runChecked(r.Exec, "runuser", "-u", bundledCaddyService, "--", "env", "XDG_DATA_HOME=/var/lib/heimdall-caddy/data", "XDG_CONFIG_HOME=/var/lib/heimdall-caddy/config", binary, "validate", "--config", update.pending, "--adapter", "caddyfile"); err != nil {
		return nil, fmt.Errorf("validating private Caddy configuration: %w", err)
	}
	return update, nil
}
func (r *SetupRunner) checkCaddyPorts(env map[string]string) error {
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
			return err
		}
	}
	if u.Scheme == "https" {
		if err := checkOwnedPort(r.Exec, r.Systemd, port, proxyPortOwner(r.previousProxyMode, bundledCaddyService), true); err != nil {
			return err
		}
	}
	return nil
}

func (u *caddyUpdate) snapshotCaddy(dir string) error {
	r := u.runner
	var err error
	u.active, err = r.Systemd.IsActive(bundledCaddyService)
	if err != nil {
		return err
	}
	state, err := r.Systemd.ShowProperty(bundledCaddyService, "UnitFileState")
	if err != nil {
		return err
	}
	u.enabled = state == "enabled" || state == systemdEnabledRuntime
	for _, path := range []string{dir + "/Caddyfile", dir + caddyCertSuffix, dir + caddyKeySuffix} {
		saved, err := snapshotFile(r.FS, path)
		if err != nil {
			return err
		}
		u.saved = append(u.saved, saved)
	}
	for _, path := range []string{u.pending, dir + "/certs/server.crt.pending", dir + "/certs/server.key.pending", "/var/lib/heimdall-caddy/data/.heimdall-check", "/var/lib/heimdall-caddy/config/.heimdall-check", "/run/heimdall-caddy/.heimdall-check"} {
		if err := safeManagedPath(r.FS, path); err != nil {
			return err
		}
	}
	return nil
}

func (u *caddyUpdate) customCaddyCertificates(env map[string]string, dir string) (string, error) {
	r := u.runner
	candidate := u.config
	if env["HEIMDALL_TLS_MODE"] == "custom" {
		cert, err := r.FS.ReadFile(env["HEIMDALL_TLS_CERT"])
		if err != nil {
			return "", fmt.Errorf("reading custom TLS certificate: %w", err)
		}
		key, err := r.FS.ReadFile(env["HEIMDALL_TLS_KEY"])
		if err != nil {
			return "", fmt.Errorf("reading custom TLS key: %w", err)
		}
		publicURL, err := validatePublicURL(env["EXTERNAL_URL"])
		if err != nil {
			return "", err
		}
		if err := validateTLSCertificate(cert, key, publicURL.Hostname()); err != nil {
			return "", err
		}
		u.certs[dir+caddyCertSuffix] = cert
		u.certs[dir+caddyKeySuffix] = key
		for path := range u.certs {
			candidate = strings.ReplaceAll(candidate, strconv.Quote(path), strconv.Quote(path+pendingFileSuffix))
		}
	}
	return candidate, nil
}

func (r *SetupRunner) prepareCaddyDirectories(dir string) error {
	for _, path := range []string{dir, dir + "/certs"} {
		if err := r.FS.MkdirAll(path, 0750); err != nil {
			return err
		}
		if err := runChecked(r.Exec, "chown", caddyConfigOwner, path); err != nil {
			return err
		}
		if err := runChecked(r.Exec, "chmod", "0750", path); err != nil {
			return err
		}
	}
	if err := runChecked(r.Exec, "chmod", "0751", r.Paths.ConfigDir); err != nil {
		return err
	}
	// Validation uses exactly the service account and private state locations.
	for _, path := range []string{"/var/lib/heimdall-caddy/data", "/var/lib/heimdall-caddy/config"} {
		if err := r.FS.MkdirAll(path, 0700); err != nil {
			return err
		}
		if err := runChecked(r.Exec, "chown", "heimdall-caddy:heimdall-caddy", path); err != nil {
			return err
		}
	}
	return nil
}

func (u *caddyUpdate) stageCaddyConfiguration(candidate string) error {
	r := u.runner
	if err := r.FS.RemoveAll(u.pending); err != nil {
		return err
	}
	for path, data := range u.certs {
		if err := r.FS.RemoveAll(path + pendingFileSuffix); err != nil {
			return err
		}
		if err := r.FS.WriteFile(path+pendingFileSuffix, data, 0640); err != nil {
			return err
		}
		if err := runChecked(r.Exec, "chown", caddyConfigOwner, path+pendingFileSuffix); err != nil {
			return err
		}
		if err := runChecked(r.Exec, "chmod", "0640", path+pendingFileSuffix); err != nil {
			return err
		}
	}
	if err := r.FS.WriteFile(u.pending, []byte(candidate), 0640); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chown", caddyConfigOwner, u.pending); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chmod", "0640", u.pending); err != nil {
		return err
	}
	return nil
}

func (u *caddyUpdate) cleanup() {
	_ = u.runner.FS.RemoveAll(u.pending)
	for path := range u.certs {
		_ = u.runner.FS.RemoveAll(path + pendingFileSuffix)
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

type serviceState struct {
	unit            string
	active, enabled bool
}

type bundledSetupUpdate struct {
	runner                                                             *SetupRunner
	existing, env                                                      map[string]string
	marker                                                             string
	originalMarker, before, dependency                                 savedFile
	selectedPorts                                                      []selinuxPort
	proxy                                                              *caddyUpdate
	previousPG                                                         []postgresConfigSnapshot
	disabled                                                           []serviceState
	pgWasActive, pgWasEnabled                                          bool
	markerRemoved, pgChanged, wrote, dependencyChanged, startAttempted bool
}

// RPM setup stages settings until every replacement can be validated. A failed
// activation restores configuration; a migration failure always leaves the app stopped.
func (r *SetupRunner) runBundledSetup(existing map[string]string) (err error) {
	u := &bundledSetupUpdate{runner: r, existing: existing, env: r.pendingConfig, marker: r.Paths.ConfigDir + "/upgrade-pending"}
	if err := u.prepare(); err != nil {
		return err
	}
	defer func() {
		if err != nil {
			err = errors.Join(err, u.rollback())
		}
	}()
	return u.activate()
}

func (u *bundledSetupUpdate) prepare() error {
	r := u.runner
	if err := u.preflight(); err != nil {
		return err
	}
	if err := u.snapshotConfiguration(); err != nil {
		return err
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
	if err := r.testExternalDatabase(u.env); err != nil {
		return err
	}
	if err := configureSELinuxPorts(r.Exec, r.FS, r.Paths.ConfigDir, u.selectedPorts, true); err != nil {
		return err
	}
	if err := u.prepareProxy(); err != nil {
		return err
	}
	return u.snapshotPostgres()
}

func (u *bundledSetupUpdate) preflight() error {
	r := u.runner
	if err := rootManagedFile(r.FS, u.marker); err != nil {
		return err
	}
	var err error
	u.originalMarker, err = snapshotFile(r.FS, u.marker)
	if err != nil {
		return err
	}
	u.selectedPorts, err = r.selectedSELinuxPorts(u.env)
	if err != nil {
		return err
	}
	if err := configureSELinuxPorts(r.Exec, r.FS, r.Paths.ConfigDir, u.selectedPorts, false); err != nil {
		return err
	}
	portValue := envDefault(u.env, "PORT", DefaultAppPort)
	if err := ValidateValue("PORT", portValue); err != nil {
		return err
	}
	port, _ := strconv.Atoi(portValue)
	if err := checkOwnedPort(r.Exec, r.Systemd, port, ServiceName, false); err != nil {
		return err
	}
	return r.validateExternalEndpoints(u.env)
}

func (r *SetupRunner) validateExternalEndpoints(env map[string]string) error {
	if !r.SkipTLS && r.ProxyMode != "bundled" && r.ProxyMode != "nginx" {
		target, err := validatePublicURL(env["EXTERNAL_URL"])
		if err != nil {
			return err
		}
		if r.ProxyMode == "external" {
			for _, unit := range []string{bundledCaddyService, bundledNginxService} {
				if err := r.rejectPrivateEndpoint(target.Hostname(), publicURLPort(target), unit); err != nil {
					return err
				}
			}
		}
	}
	if !r.SkipDB && r.DatabaseMode == "external" {
		return r.rejectPrivateEndpoint(r.DBHost, r.DBPort, bundledPGService)
	}
	return nil
}

func publicURLPort(u *url.URL) int {
	port := 443
	if u.Scheme == "http" {
		port = 80
	}
	if u.Port() != "" {
		port, _ = strconv.Atoi(u.Port())
	}
	return port
}

func (u *bundledSetupUpdate) snapshotConfiguration() error {
	r := u.runner
	var err error
	u.before, err = snapshotFile(r.FS, r.Env.GetEnvFilePath())
	if err != nil {
		return err
	}
	u.dependency, err = snapshotFile(r.FS, databaseDependency)
	if err != nil {
		return err
	}
	if u.dependency.exists && string(u.dependency.data) != databaseDependencyContent {
		return fmt.Errorf("refusing to replace an unrecognized database dependency: %s", databaseDependency)
	}
	return nil
}

func (r *SetupRunner) testExternalDatabase(env map[string]string) error {
	if r.SkipDB || r.DatabaseMode != "external" {
		return nil
	}
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
	return checkPostgresServer(r.Exec, r.Paths, r.FS, cfg)
}

func (u *bundledSetupUpdate) prepareProxy() error {
	r := u.runner
	if r.SkipTLS || (r.ProxyMode != "bundled" && r.ProxyMode != "nginx") {
		return nil
	}
	var err error
	if r.ProxyMode == "nginx" {
		u.proxy, err = r.prepareBundledNginx(u.env)
	} else {
		u.proxy, err = r.prepareBundledCaddy(u.env)
	}
	if err != nil {
		return err
	}
	if r.TLSMode == "custom" {
		u.env["HEIMDALL_TLS_CERT"] = r.Paths.ConfigDir + "/caddy/certs/server.crt"
		u.env["HEIMDALL_TLS_KEY"] = r.Paths.ConfigDir + "/caddy/certs/server.key"
	}
	return nil
}

func (u *bundledSetupUpdate) snapshotPostgres() error {
	r := u.runner
	if r.SkipDB || r.DatabaseMode != "bundled" {
		return nil
	}
	var err error
	u.pgWasActive, err = r.Systemd.IsActive(bundledPGService)
	if err != nil {
		return err
	}
	state, err := r.Systemd.ShowProperty(bundledPGService, "UnitFileState")
	if err != nil {
		return err
	}
	u.pgWasEnabled = state == "enabled" || state == systemdEnabledRuntime
	files, err := r.FS.OpenPostgresData(bundledPGData)
	if os.IsNotExist(err) {
		return nil // A fresh cluster has no prior configuration to restore.
	}
	if err != nil {
		return err
	}
	defer files.Close()
	if _, err = files.ReadFile("PG_VERSION"); err == nil {
		for _, file := range []string{"postgresql.conf", "heimdall.conf", "pg_hba.conf"} {
			snapshot, err := snapshotPostgresConfig(files, file)
			if err != nil {
				return err
			}
			u.previousPG = append(u.previousPG, snapshot)
		}
	} else if !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (u *bundledSetupUpdate) rollback() error {
	r := u.runner
	var rollback []error
	if u.markerRemoved {
		rollback = append(rollback, u.restoreMarker())
	}
	// Stop any partially started app before restoring prior configuration.
	if u.startAttempted {
		rollback = append(rollback, r.Systemd.Stop(ServiceName))
	}
	if u.proxy != nil {
		rollback = append(rollback, u.proxy.rollback())
	}
	rollback = append(rollback, u.restorePostgres())
	if u.wrote {
		rollback = append(rollback, r.Env.WriteEnvFile(u.existing))
		if _, fileBacked := r.Env.(*FileEnvManager); fileBacked {
			rollback = append(rollback, u.before.restore(r.FS))
		}
	}
	if u.dependencyChanged {
		rollback = append(rollback, u.dependency.restore(r.FS), runChecked(r.Exec, "systemctl", "daemon-reload"))
	}
	rollback = append(rollback, u.restoreDisabledServices())
	return errors.Join(rollback...)
}

func (u *bundledSetupUpdate) restoreMarker() error {
	r := u.runner
	if err := rootManagedFile(r.FS, u.marker); err != nil {
		return err
	}
	if err := r.FS.WriteFile(u.marker, u.originalMarker.data, 0600); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chown", "root:root", u.marker); err != nil {
		return err
	}
	return runChecked(r.Exec, "chmod", "0600", u.marker)
}

func (u *bundledSetupUpdate) restorePostgresPassword() error {
	r := u.runner
	existing := u.existing
	if (existing["HEIMDALL_DATABASE_MODE"] != "bundled" && !u.dependency.exists) || existing["DATABASE_USERNAME"] != r.DBUser || existing["DATABASE_PASSWORD"] == "" || existing["DATABASE_PASSWORD"] == r.DBPassword {
		return nil
	}
	previous := &PostgresBootstrapRunner{Paths: r.Paths, Exec: r.Exec, DBPort: r.DBPort, DBUser: r.DBUser, DBPassword: existing["DATABASE_PASSWORD"]}
	install := &pgInstall{PsqlBin: r.Paths.RuntimePath("postgresql", "bin", "psql"), SocketDir: bundledPGSocket, OSUser: "heimdall-postgres"}
	if err := previous.waitReady(install); err != nil {
		return err
	}
	return previous.configureRole(install)
}

func (u *bundledSetupUpdate) restorePostgres() error {
	if !u.pgChanged {
		return nil
	}
	r := u.runner
	rollback := []error{u.restorePostgresPassword()}
	if len(u.previousPG) > 0 {
		files, err := r.FS.OpenPostgresData(bundledPGData)
		if err != nil {
			rollback = append(rollback, err)
		} else {
			defer files.Close()
			for _, saved := range u.previousPG {
				rollback = append(rollback, saved.restore(files))
			}
		}
	}
	if u.pgWasActive {
		rollback = append(rollback, r.Systemd.Restart(bundledPGService))
	} else {
		rollback = append(rollback, r.Systemd.Stop(bundledPGService))
	}
	if !u.pgWasEnabled {
		rollback = append(rollback, runChecked(r.Exec, "systemctl", "disable", bundledPGService))
	}
	return errors.Join(rollback...)
}

func (u *bundledSetupUpdate) restoreDisabledServices() error {
	var rollback []error
	for _, unit := range u.disabled {
		if unit.enabled {
			rollback = append(rollback, u.runner.Systemd.Enable(unit.unit))
		}
		if unit.active {
			rollback = append(rollback, u.runner.Systemd.Start(unit.unit))
		}
	}
	return errors.Join(rollback...)
}

func (u *bundledSetupUpdate) activate() error {
	r := u.runner
	r.printSummary(r.DatabaseMode == "bundled")
	if !r.SkipDB || r.FS.Exists(u.marker) {
		if err := r.Systemd.Stop(ServiceName); err != nil {
			return err
		}
	}
	u.wrote = true
	if err := r.Env.WriteEnvFile(u.env); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chown", configFileOwner, r.Env.GetEnvFilePath()); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chmod", "0640", r.Env.GetEnvFilePath()); err != nil {
		return err
	}
	if err := u.migrateDatabase(); err != nil {
		return err
	}
	if err := u.activateProxy(); err != nil {
		return err
	}
	if err := u.disableDeselectedServices(); err != nil {
		return err
	}
	if r.ProxyMode != "bundled" && r.ProxyMode != "nginx" {
		fmt.Fprintf(r.Out, "  Backend address: http://127.0.0.1:%s\n", envDefault(u.env, "PORT", DefaultAppPort))
	}
	if err := r.stepSecurityPolicies(); err != nil {
		return err
	}
	return u.startApplication()
}

func (u *bundledSetupUpdate) migrateDatabase() error {
	r := u.runner
	if r.SkipDB {
		return nil
	}
	if r.DatabaseMode == "bundled" {
		u.pgChanged = true
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
	if err := u.updateDatabaseDependency(); err != nil {
		return err
	}
	if u.dependencyChanged {
		return runChecked(r.Exec, "systemctl", "daemon-reload")
	}
	return nil
}

func (u *bundledSetupUpdate) updateDatabaseDependency() error {
	r := u.runner
	if r.DatabaseMode == "bundled" {
		if err := r.FS.MkdirAll(filepath.Dir(databaseDependency), 0755); err != nil {
			return err
		}
		u.dependencyChanged = true
		return r.FS.WriteFile(databaseDependency, []byte(databaseDependencyContent), 0644)
	}
	if u.dependency.exists {
		u.dependencyChanged = true
		return r.FS.RemoveAll(databaseDependency)
	}
	return nil
}

func (u *bundledSetupUpdate) activateProxy() error {
	if u.proxy == nil {
		return nil
	}
	r := u.runner
	oldUnit := ""
	if u.existing["HEIMDALL_PROXY_MODE"] == "bundled" && r.ProxyMode == "nginx" {
		oldUnit = bundledCaddyService
	}
	if u.existing["HEIMDALL_PROXY_MODE"] == "nginx" && r.ProxyMode == "bundled" {
		oldUnit = bundledNginxService
	}
	if oldUnit != "" {
		active, err := r.Systemd.IsActive(oldUnit)
		if err != nil {
			return err
		}
		if err := u.disableService(oldUnit, active); err != nil {
			return err
		}
	}
	if err := u.proxy.apply(); err != nil {
		return err
	}
	if r.TLSMode == "internal" {
		fmt.Fprintln(r.Out, "  Import the private Caddy CA where needed:", bundledCaddyRoot)
	}
	return nil
}

func (u *bundledSetupUpdate) disableService(unit string, active bool) error {
	r := u.runner
	state, err := r.Systemd.ShowProperty(unit, "UnitFileState")
	if err != nil {
		return err
	}
	u.disabled = append(u.disabled, serviceState{unit, active, state == "enabled" || state == systemdEnabledRuntime})
	return runChecked(r.Exec, "systemctl", "disable", "--now", unit)
}

func (u *bundledSetupUpdate) disableDeselectedServices() error {
	r := u.runner
	// Replacements passed their applicable preflight checks. Retain deselected state.
	for _, selection := range []struct {
		skip                       bool
		mode, key, unit, ownedMode string
	}{
		{r.SkipDB, r.DatabaseMode, "HEIMDALL_DATABASE_MODE", bundledPGService, "bundled"},
		{r.SkipTLS, r.ProxyMode, "HEIMDALL_PROXY_MODE", bundledCaddyService, "bundled"},
		{r.SkipTLS, r.ProxyMode, "HEIMDALL_PROXY_MODE", bundledNginxService, "nginx"},
	} {
		if selection.skip || selection.mode == selection.ownedMode || (u.proxy != nil && selection.key == "HEIMDALL_PROXY_MODE") {
			continue
		}
		active, err := r.Systemd.IsActive(selection.unit)
		if err != nil {
			return err
		}
		if u.existing[selection.key] == selection.ownedMode || (selection.unit == bundledPGService && u.dependency.exists) {
			if err := u.disableService(selection.unit, active); err != nil {
				return err
			}
		}
	}
	return nil
}

func (u *bundledSetupUpdate) startApplication() error {
	r := u.runner
	if r.FS.Exists(u.marker) {
		if r.SkipDB {
			fmt.Fprintln(r.Out, "Upgrade pending: migrations were skipped; application remains stopped. Run setup --non-interactive.")
			return nil
		}
		if err := rootManagedFile(r.FS, u.marker); err != nil {
			return err
		}
		if err := r.FS.RemoveAll(u.marker); err != nil {
			return err
		}
		u.markerRemoved = true
	}
	u.startAttempted = true
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
	addresses, err := localEndpointAddresses(host)
	if err != nil {
		return err
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
		if err := rejectPrivateListener(line, addresses, host, port, unit, pid); err != nil {
			return err
		}
	}
	return nil
}

func localEndpointAddresses(host string) ([]net.IP, error) {
	if strings.EqualFold(strings.TrimSuffix(host, "."), "localhost") {
		return []net.IP{net.ParseIP(loopbackIPv4), net.ParseIP("::1")}, nil
	}
	ip := net.ParseIP(host)
	if ip == nil {
		return nil, nil
	}
	if ip.IsLoopback() {
		return []net.IP{ip}, nil
	}
	interfaces, err := net.InterfaceAddrs()
	if err != nil {
		return nil, fmt.Errorf("checking local addresses: %w", err)
	}
	for _, address := range interfaces {
		iface, _, err := net.ParseCIDR(address.String())
		if err == nil && iface.Equal(ip) {
			return []net.IP{ip}, nil
		}
	}
	return nil, nil
}

func rejectPrivateListener(line string, addresses []net.IP, host string, port int, unit, pid string) error {
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
	if !listenerMatchesAddresses(address, listenIP, addresses) {
		return nil
	}
	owners := regexp.MustCompile(`pid=([0-9]+),`).FindAllStringSubmatch(line, -1)
	if len(owners) == 0 {
		return fmt.Errorf("cannot identify listener owner for external endpoint %s:%d", host, port)
	}
	for _, owner := range owners {
		if owner[1] == pid {
			return fmt.Errorf("external endpoint %s:%d is still served by %s; choose an independent endpoint before deselecting that service", host, port, unit)
		}
	}
	return nil
}

func listenerMatchesAddresses(address string, listenIP net.IP, addresses []net.IP) bool {
	for _, ip := range addresses {
		if address == "*" || listenIP.Equal(ip) || (listenIP.IsUnspecified() && (listenIP.To4() == nil || ip.To4() != nil)) {
			return true
		}
	}
	return false
}
