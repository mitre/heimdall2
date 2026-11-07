package cmd

import (
	"fmt"
	"io"
	"strings"

	"github.com/spf13/cobra"
)

// ValidateRunner checks configuration before service start.
type ValidateRunner struct {
	Paths  Paths
	Env    EnvManager
	FS     FileSystem
	DB     DBConnector
	Out    io.Writer
	SkipDB bool
}

// NewValidateCmd creates the validate command.
func NewValidateCmd(runner *ValidateRunner) *cobra.Command {
	production := runner == nil
	if runner == nil {
		runner = &ValidateRunner{
			Env: NewFileEnvManager(),
			FS:  &osFileSystem{},
			DB:  &psqlConnector{},
		}
	}

	cmd := &cobra.Command{
		Use:   "validate",
		Short: "Validate configuration before service start",
		Long: `Validate the Heimdall Server configuration before starting the service.
This command performs the following checks:

  1. Environment file: Verifies backend.env exists and is readable
  2. Required variables: Confirms DATABASE_PASSWORD and JWT_SECRET are
     set and non-empty
  3. Database connectivity: Attempts a test connection to PostgreSQL
     (can be skipped with --skip-db)

Exit code 0 means all checks passed. Exit code 1 means one or more
errors were found. This command is suitable for use in a systemd
ExecStartPre= directive to prevent the service from starting with
an invalid configuration.`,
		Example: `  # Validate before starting the service
  sudo heimdall-cli validate

  # Validate config only (skip database check)
  sudo heimdall-cli validate --skip-db

  # Use in a systemd unit file
  # ExecStartPre=/usr/bin/heimdall-cli validate`,
		SilenceUsage:  true,
		SilenceErrors: true,
		RunE: func(cmd *cobra.Command, args []string) error {
			if production {
				runner.Paths = commandPaths(cmd)
				runner.Env = &FileEnvManager{Path: runner.Paths.EnvFile}
			}
			initIO(&runner.Out, nil, cmd)
			return runner.Run()
		},
	}

	cmd.Flags().BoolVar(&runner.SkipDB, "skip-db", false, "Skip database connectivity check")

	return cmd
}

// requiredVars are env vars that must be set and non-empty for the service to start.
var requiredVars = []string{
	"DATABASE_PASSWORD",
	"JWT_SECRET",
}

// Run executes all validation checks.
func (r *ValidateRunner) Run() error {
	env, err := r.Env.ReadEnv()
	if err != nil {
		return fmt.Errorf("cannot read %s: %w", r.Env.GetEnvFilePath(), err)
	}

	var errors []string

	// Check required variables
	for _, key := range requiredVars {
		val, ok := env[key]
		if !ok || strings.TrimSpace(val) == "" {
			errors = append(errors, fmt.Sprintf("required variable %s is missing or empty", key))
		}
	}

	// Stop early if required vars are missing (DB check would fail anyway)
	if len(errors) > 0 {
		return WrapError(
			fmt.Errorf("%s", strings.Join(errors, "; ")),
			"validation failed",
			"Run setup to generate missing values: sudo heimdall-cli setup")
	}

	dbCfg, err := resolveDBConfig(env)
	if err != nil {
		return err
	}
	if !r.SkipDB {
		if err := configureDBConnector(r.DB, r.Paths, r.FS, dbCfg); err != nil {
			return err
		}
	}

	// Check database connectivity
	if !r.SkipDB {

		if err := r.DB.TestConnection(dbCfg.Host, dbCfg.Port, dbCfg.User, dbCfg.Password, dbCfg.DBName); err != nil {
			errors = append(errors, fmt.Sprintf("database unreachable at %s:%d/%s: %v", dbCfg.Host, dbCfg.Port, dbCfg.DBName, err))
		} else {
			fmt.Fprintf(r.Out, "  Database: connected to %s:%d/%s\n", dbCfg.Host, dbCfg.Port, dbCfg.DBName)
		}
	} else {
		fmt.Fprintln(r.Out, "  Database: skipped (--skip-db)")
	}

	if len(errors) > 0 {
		return WrapError(
			fmt.Errorf("%s", strings.Join(errors, "; ")),
			"validation failed",
			"Check PostgreSQL: sudo systemctl status postgresql")
	}

	fmt.Fprintln(r.Out, "  Configuration valid")
	return nil
}
