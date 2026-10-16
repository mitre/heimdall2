package cmd

import (
	"context"
	"fmt"
	"strings"

	"github.com/mitre/heimdall2/apps/heimdall-cli/internal/version"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// NewRootCmd creates the root command. Using a constructor (not package-level var)
// so each test gets a fresh command tree.
func NewRootCmd() *cobra.Command {
	root := &cobra.Command{
		Use:   "heimdall-cli",
		Short: "Admin tool for Heimdall Server RPM installations",
		Long: `heimdall-cli is the administration tool for Heimdall Server RPM installations.
It manages post-install setup, service lifecycle, configuration, backups,
and diagnostics for Heimdall Enterprise Server on RHEL-family systems.

All commands that modify system state require root privileges (sudo).

ENVIRONMENT VARIABLES:
  HEIMDALL_DB_HOST        Database host (default: localhost)
  HEIMDALL_DB_PORT        Database port (default: 5432)
  HEIMDALL_DB_USER        Database user (default: postgres)
  HEIMDALL_DB_PASSWORD    Database password
  HEIMDALL_DB_NAME        Database name (default: heimdall-server-production)
  HEIMDALL_APP_DIR        Application directory (default: /usr/share/heimdall-server)
  HEIMDALL_DATA_DIR       Data directory (default: /var/lib/heimdall-server)
  HEIMDALL_LIBEXEC_DIR    Libexec directory (default: /usr/libexec/heimdall-server)
  HEIMDALL_CONFIG_DIR     Configuration directory (default: /etc/heimdall-server)
  HEIMDALL_CERT_DIR       Certificate directory (default: /etc/pki/heimdall-server)
  HEIMDALL_LOG_DIR        Log directory (default: /var/log/heimdall-server)
  HEIMDALL_ENV_FILE       Environment file path (default: /etc/heimdall-server/backend.env)

FILES:
  /etc/heimdall-server/backend.env     Service environment variables
  /etc/heimdall-server/heimdall-cli.yaml  CLI configuration (optional)
  $HOME/.heimdall/heimdall-cli.yaml    Per-user CLI configuration (optional)`,
		SilenceUsage:  true,
		SilenceErrors: true,
		Version:       fmt.Sprintf("%s (commit %s, built %s)", version.Version, version.Commit, version.Date),
	}

	// Global persistent flags
	pf := root.PersistentFlags()
	pf.String("db-host", "localhost", "Database host")
	pf.Int("db-port", 5432, "Database port")
	pf.String("db-user", "postgres", "Database user")
	pf.String("db-password", "", "Database password")
	pf.String("db-name", "heimdall-server-production", "Database name")
	pf.BoolP("verbose", "v", false, "Verbose output")
	pf.String("config", "", "Config file path")

	// Create a local Viper instance (not the global singleton) for test isolation.
	v := viper.New()
	v.SetEnvPrefix("HEIMDALL")
	v.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))
	v.AutomaticEnv()

	// Register FHS path defaults (overridable via env/config/flags)
	registerPathDefaults(v)

	// Path override flags (empty default = only active when explicitly set)
	pf.String("app-dir", "", "Application directory")
	pf.String("data-dir", "", "Data directory")
	pf.String("libexec-dir", "", "Libexec directory")
	pf.String("config-dir", "", "Configuration directory")
	pf.String("cert-dir", "", "Certificate directory")
	pf.String("log-dir", "", "Log directory")
	pf.String("env-file", "", "Environment file path")

	_ = v.BindPFlag("app-dir", pf.Lookup("app-dir"))
	_ = v.BindPFlag("data-dir", pf.Lookup("data-dir"))
	_ = v.BindPFlag("libexec-dir", pf.Lookup("libexec-dir"))
	_ = v.BindPFlag("config-dir", pf.Lookup("config-dir"))
	_ = v.BindPFlag("cert-dir", pf.Lookup("cert-dir"))
	_ = v.BindPFlag("log-dir", pf.Lookup("log-dir"))
	_ = v.BindPFlag("env-file", pf.Lookup("env-file"))

	_ = v.BindPFlag("db-host", pf.Lookup("db-host"))
	_ = v.BindPFlag("db-port", pf.Lookup("db-port"))
	_ = v.BindPFlag("db-user", pf.Lookup("db-user"))
	_ = v.BindPFlag("db-password", pf.Lookup("db-password"))
	_ = v.BindPFlag("db-name", pf.Lookup("db-name"))
	_ = v.BindPFlag("verbose", pf.Lookup("verbose"))

	root.PersistentPreRunE = func(cmd *cobra.Command, args []string) error {
		cfgFile, _ := cmd.Flags().GetString("config")
		if err := initConfig(v, cfgFile); err != nil {
			return err
		}
		cmd.SetContext(context.WithValue(cmd.Context(), pathsContextKey{}, NewPathsFromViper(v)))
		return nil
	}

	// Register all subcommands
	root.AddCommand(NewSetupCmd(nil))
	root.AddCommand(NewStatusCmd(nil))
	root.AddCommand(NewConfigCmd(nil))
	root.AddCommand(NewBackupCmd(nil))
	root.AddCommand(NewRestoreCmd(nil))
	root.AddCommand(NewResetPasswordCmd(nil))
	root.AddCommand(NewStartCmd(nil))
	root.AddCommand(NewStopCmd(nil))
	root.AddCommand(NewRestartCmd(nil))
	root.AddCommand(NewLogsCmd(nil))
	root.AddCommand(NewDiagCmd(nil))
	root.AddCommand(NewSetPortCmd(nil))
	root.AddCommand(NewAddCertCmd(nil))
	root.AddCommand(NewValidateCmd(nil))
	root.AddCommand(NewFapolicydCmd(nil))

	return root
}

func initConfig(v *viper.Viper, cfgFile string) error {
	if cfgFile != "" {
		v.SetConfigFile(cfgFile)
	} else {
		v.SetConfigName("heimdall-cli")
		v.SetConfigType("yaml")
		v.AddConfigPath("/etc/heimdall-server")
		v.AddConfigPath("$HOME/.heimdall")
		v.AddConfigPath(".")
	}
	// Config file is optional
	_ = v.ReadInConfig()
	return nil
}

// Execute runs the root command.
func Execute() error {
	return NewRootCmd().Execute()
}
