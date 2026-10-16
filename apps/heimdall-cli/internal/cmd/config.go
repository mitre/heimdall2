package cmd

import (
	"fmt"
	"io"

	"github.com/spf13/cobra"
)

// ConfigRunner implements the config get/set/list subcommands.
type ConfigRunner struct {
	Port      *SetPortRunner
	Env       EnvManager
	Out       io.Writer
	ErrOut    io.Writer
	CheckRoot func() error
}

// NewConfigCmd creates the "config" command with get/set/list subcommands.
func NewConfigCmd(runner *ConfigRunner) *cobra.Command {
	production := runner == nil
	if runner == nil {
		runner = &ConfigRunner{
			Port:      &SetPortRunner{Exec: &execRunner{}, Systemd: &systemdRunner{}, FS: &osFileSystem{}, Paths: DefaultPaths()},
			Env:       NewFileEnvManager(),
			CheckRoot: requireRoot,
		}
	}
	cmd := &cobra.Command{
		Use:   "config",
		Short: "View or modify backend.env configuration",
		Long: `View or modify the Heimdall Server backend.env configuration file. This
command provides three subcommands: list, get, and set.

The 'list' subcommand shows all known configuration keys grouped by category
(database, authentication, security, etc.) with descriptions and defaults.
The 'get' subcommand retrieves the current value of a specific key, masking
secrets automatically. The 'set' subcommand updates a key after validating
its value, and requires root privileges since it writes to backend.env.

PORT changes restart the app and update its selected proxy automatically. Other
changes made with 'config set' require a service restart to take effect.`,
		Example: `  # List all known configuration keys with descriptions
  sudo heimdall-cli config list

  # Get the current value of a specific key
  sudo heimdall-cli config get DATABASE_HOST

  # Set a configuration value (requires root)
  sudo heimdall-cli config set EXTERNAL_URL https://heimdall.example.com

  # Set an authentication provider
  sudo heimdall-cli config set GITHUB_CLIENTID my-client-id`,
	}

	cmd.AddCommand(newConfigListCmd(runner))
	cmd.AddCommand(newConfigGetCmd(runner))
	cmd.AddCommand(newConfigSetCmd(runner))

	if production {
		for _, child := range cmd.Commands() {
			child.PreRun = func(cmd *cobra.Command, args []string) {
				paths := commandPaths(cmd)
				runner.Env = &FileEnvManager{Path: paths.EnvFile}
				runner.Port.Paths = paths
			}
		}
	}

	return cmd
}

func newConfigListCmd(runner *ConfigRunner) *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "Show all known config keys grouped by category",
		Long: `Show all known Heimdall Server configuration keys organized by category.
Each key is displayed with its description and default value (if any).
This is a read-only operation useful for discovering available settings.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			initIO(&runner.Out, &runner.ErrOut, cmd)
			return runner.List()
		},
	}
}

func newConfigGetCmd(runner *ConfigRunner) *cobra.Command {
	return &cobra.Command{
		Use:   "get <key>",
		Short: "Show the value of a config key",
		Long: `Retrieve the current value of a configuration key from backend.env.
Secret values (passwords, JWT tokens, API keys) are automatically masked
in the output. If the key is not set, its schema description and default
value are shown as a hint.`,
		Args: cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			initIO(&runner.Out, &runner.ErrOut, cmd)
			return runner.Get(args[0])
		},
	}
}

func newConfigSetCmd(runner *ConfigRunner) *cobra.Command {
	return &cobra.Command{
		Use:   "set <key> <value>",
		Short: "Set a config key (requires root)",
		Long: `Set a configuration key in backend.env. The value is validated against
the configuration schema before writing. This command requires root
privileges because it modifies the service environment file. After
setting a value, restart the service for the change to take effect.`,
		Args: cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			initIO(&runner.Out, &runner.ErrOut, cmd)
			return runner.Set(args[0], args[1])
		},
	}
}

// List shows all config keys grouped by category.
func (r *ConfigRunner) List() error {
	// Read current values from backend.env
	env, _ := r.Env.ReadEnv()

	for _, cat := range SortedCategories() {
		keys := KeysForCategory(cat.ID)
		if len(keys) == 0 {
			continue
		}
		fmt.Fprintln(r.Out, cat.Label)
		for _, k := range keys {
			entry := ConfigSchema[k]
			line := fmt.Sprintf("  %s  %s", k, entry.Description)

			// Show current value if set, otherwise show default
			if val, ok := env[k]; ok && val != "" {
				if IsSecret(k) {
					line += fmt.Sprintf("  = %s", MaskSecret(val))
				} else {
					line += fmt.Sprintf("  = %s", val)
				}
			} else if entry.Default != "" {
				line += fmt.Sprintf("  [%s]", entry.Default)
			}
			fmt.Fprintln(r.Out, line)
		}
		fmt.Fprintln(r.Out)
	}
	return nil
}

// Get shows the value of a single key.
func (r *ConfigRunner) Get(key string) error {
	env, err := r.Env.ReadEnv()
	if err != nil {
		return err
	}

	val, ok := env[key]
	if !ok {
		if entry, exists := ConfigSchema[key]; exists {
			fmt.Fprintf(r.ErrOut, "Key not found: %s\n", key)
			fmt.Fprintf(r.ErrOut, "  Description: %s\n", entry.Description)
			fmt.Fprintf(r.ErrOut, "  Default: %s\n", entry.Default)
		}
		return fmt.Errorf("key not found: %s", key)
	}

	display := val
	if IsSecret(key) {
		display = MaskSecret(val)
	}
	fmt.Fprintf(r.Out, "%s=%s\n", key, display)

	if entry, exists := ConfigSchema[key]; exists {
		fmt.Fprintf(r.Out, "  %s\n", entry.Description)
	}
	return nil
}

// Set updates a config key after validation.
func (r *ConfigRunner) Set(key, value string) error {
	switch key {
	case "HEIMDALL_TLS_CERT_DAYS":
		return fmt.Errorf("Use heimdall-cli setup --interactive to change certificate lifetime.")
	case "HEIMDALL_DATABASE_MODE", "HEIMDALL_PROXY_MODE", "HEIMDALL_TLS_MODE", "HEIMDALL_TLS_CERT", "HEIMDALL_TLS_KEY":
		return fmt.Errorf("Use heimdall-cli setup --database-mode or --proxy-mode to change service ownership.")
	}
	if r.CheckRoot != nil {
		if err := r.CheckRoot(); err != nil {
			return err
		}
	}
	if err := ValidateValue(key, value); err != nil {
		return err
	}

	if key == "PORT" {
		if r.Port == nil {
			return fmt.Errorf("PORT changes require the set-port runner")
		}
		r.Port.Env, r.Port.Out, r.Port.ErrOut = r.Env, r.Out, r.ErrOut
		return r.Port.Run(value)
	}
	if err := r.Env.WriteEnvKey(key, value); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}

	display := value
	if IsSecret(key) {
		display = MaskSecret(value)
	}
	fmt.Fprintf(r.Out, "Set %s=%s\n", key, display)
	fmt.Fprintf(r.Out, "Restart to apply: sudo systemctl restart %s\n", ServiceName)
	return nil
}
