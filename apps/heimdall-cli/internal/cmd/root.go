package cmd

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/mitre/heimdall2/apps/heimdall-cli/internal/version"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

const (
	flagDBHost     = "db-host"
	flagDBPort     = "db-port"
	flagDBUser     = "db-user"
	flagDBPassword = "db-password"
	flagDBName     = "db-name"
	flagAppDir     = "app-dir"
	flagDataDir    = "data-dir"
	flagLibexecDir = "libexec-dir"
	flagConfigDir  = "config-dir"
	flagCertDir    = "cert-dir"
	flagLogDir     = "log-dir"
	flagEnvFile    = "env-file"
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
  HEIMDALL_LOG_DIR        Log directory (default: /var/log/heimdall-server-journal)
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
	pf.String(flagDBHost, "localhost", "Database host")
	pf.Int(flagDBPort, 5432, "Database port")
	pf.String(flagDBUser, "postgres", "Database user")
	pf.String(flagDBPassword, "", "Database password")
	pf.String(flagDBName, "heimdall-server-production", "Database name")
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
	pf.String(flagAppDir, "", "Application directory")
	pf.String(flagDataDir, "", "Data directory")
	pf.String(flagLibexecDir, "", "Libexec directory")
	pf.String(flagConfigDir, "", "Configuration directory")
	pf.String(flagCertDir, "", "Certificate directory")
	pf.String(flagLogDir, "", "Log directory")
	pf.String(flagEnvFile, "", "Environment file path")

	_ = v.BindPFlag(flagAppDir, pf.Lookup(flagAppDir))
	_ = v.BindPFlag(flagDataDir, pf.Lookup(flagDataDir))
	_ = v.BindPFlag(flagLibexecDir, pf.Lookup(flagLibexecDir))
	_ = v.BindPFlag(flagConfigDir, pf.Lookup(flagConfigDir))
	_ = v.BindPFlag(flagCertDir, pf.Lookup(flagCertDir))
	_ = v.BindPFlag(flagLogDir, pf.Lookup(flagLogDir))
	_ = v.BindPFlag(flagEnvFile, pf.Lookup(flagEnvFile))

	_ = v.BindPFlag(flagDBHost, pf.Lookup(flagDBHost))
	_ = v.BindPFlag(flagDBPort, pf.Lookup(flagDBPort))
	_ = v.BindPFlag(flagDBUser, pf.Lookup(flagDBUser))
	_ = v.BindPFlag(flagDBPassword, pf.Lookup(flagDBPassword))
	_ = v.BindPFlag(flagDBName, pf.Lookup(flagDBName))
	_ = v.BindPFlag("verbose", pf.Lookup("verbose"))

	root.PersistentPreRunE = func(cmd *cobra.Command, args []string) error {
		cfgFile, _ := cmd.Flags().GetString("config")
		if err := initConfig(v, cfgFile); err != nil {
			return err
		}
		if cmd.Name() == "setup" {
			for _, name := range []string{flagDBHost, flagDBPort, flagDBUser, flagDBPassword, flagDBName} {
				if !cmd.Flags().Changed(name) && v.IsSet(name) {
					// Apply explicit configuration through the same validation and precedence as flags.
					if err := cmd.Flags().Set(name, v.GetString(name)); err != nil {
						return err
					}
				}
			}
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
	}
	err := v.ReadInConfig()
	var missing viper.ConfigFileNotFoundError
	if cfgFile == "" && errors.As(err, &missing) {
		return nil
	}
	return err
}

// Execute runs the root command.
func Execute() error {
	return NewRootCmd().Execute()
}
