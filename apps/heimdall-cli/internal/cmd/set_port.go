package cmd

import (
	"errors"
	"fmt"
	"io"
	"maps"
	"regexp"

	"github.com/spf13/cobra"
)

const standaloneCaddyfile = "/etc/caddy/Caddyfile.d/heimdall-server.caddy"

var standaloneCaddyUpstream = regexp.MustCompile(`(?m)(\breverse_proxy[ \t]+127\.0\.0\.1:)[0-9]+\b`)

// SetPortRunner holds dependencies for the set-port command.
type SetPortRunner struct {
	FS        FileSystem
	Paths     Paths
	Exec      ExecRunner
	Env       EnvManager
	Systemd   SystemdRunner
	Out       io.Writer
	ErrOut    io.Writer
	CheckRoot func() error
}

// Run executes the set-port logic.
func (r *SetPortRunner) Run(portStr string) (err error) {
	if r.CheckRoot != nil {
		if err := r.CheckRoot(); err != nil {
			return err
		}
	}
	if r.FS == nil {
		r.FS = &osFileSystem{}
	}
	if r.Paths.AppDir == "" {
		r.Paths = DefaultPaths()
	}
	if err := ValidateValue("PORT", portStr); err != nil {
		return err
	}

	env, err := r.Env.ReadEnv()
	if err != nil {
		return fmt.Errorf("failed to read env: %w", err)
	}
	oldPort := env["PORT"]
	if oldPort == "" {
		oldPort = DefaultAppPort
	}

	bundled, err := r.Paths.hasRuntime(r.FS)
	if err != nil {
		return err
	}
	setup := &SetupRunner{
		Paths: r.Paths, Exec: r.Exec, FS: r.FS, Systemd: r.Systemd, Env: r.Env, Out: r.Out,
		DatabaseMode: env["HEIMDALL_DATABASE_MODE"], ProxyMode: env["HEIMDALL_PROXY_MODE"],
	}
	if err := setup.validateBackendPort(portStr, env); err != nil {
		return err
	}
	ports := []selinuxPort{{"heimdall_server_port_t", portStr}}
	if err := configureSELinuxPorts(r.Exec, r.FS, r.Paths.ConfigDir, ports, true); err != nil {
		return err
	}
	proxy, before, err := r.preparePortChange(setup, env, portStr, bundled)
	if err != nil {
		return err
	}
	wrote, restarted := false, false
	var rollbackFirewall func() error
	defer func() {
		if err == nil {
			return
		}
		err = errors.Join(err, r.rollbackPortChange(env, before, proxy, wrote, restarted, rollbackFirewall))
	}()
	rollbackFirewall, err = setup.configureFirewall(portStr, env["HEIMDALL_PROXY_MODE"], env["EXTERNAL_URL"])
	if err != nil {
		return err
	}
	wrote = true
	if err := r.Env.WriteEnvKey("PORT", portStr); err != nil {
		return fmt.Errorf("failed to update env: %w", err)
	}
	fmt.Fprintf(r.Out, "Config:    PORT=%s (was %s)\n", portStr, oldPort)

	if err := restoreSELinuxPaths(r.Exec, r.FS, r.Paths.ConfigDir); err != nil {
		return err
	}
	// Restart
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "Restarting service...")
	restarted = true
	if err := r.Systemd.Restart(ServiceName); err != nil {
		return fmt.Errorf("failed to restart service: %w", err)
	}
	if err := (&ServiceRunner{Systemd: r.Systemd}).requireActive(); err != nil {
		return err
	}
	if proxy != nil {
		if err := proxy.apply(); err != nil {
			return err
		}
	}
	if bundled && env["HEIMDALL_PROXY_MODE"] == "external" {
		fmt.Fprintf(r.Out, "Backend address: http://127.0.0.1:%s\n", portStr)
	}
	fmt.Fprintf(r.Out, "Done. Heimdall now listening on port %s.\n", portStr)

	return nil
}

// NewSetPortCmd creates the set-port command.
func NewSetPortCmd(runner *SetPortRunner) *cobra.Command {
	production := runner == nil
	if runner == nil {
		runner = &SetPortRunner{
			FS: &osFileSystem{}, Paths: DefaultPaths(),
			Exec:      &execRunner{},
			Env:       NewFileEnvManager(),
			Systemd:   &systemdRunner{},
			CheckRoot: requireRoot,
		}
	}
	return &cobra.Command{
		Use:   "set-port <port>",
		Short: "Change the listen port (updates config, SELinux, firewalld)",
		Long: `Change the port that Heimdall Server listens on. This command updates
three system layers in a single operation:

  1. Config:    Sets PORT in backend.env to the new value
  2. SELinux:   Registers the new port as heimdall_server_port_t so the
               service is allowed to bind under enforcing mode
  3. firewalld: Exposes the configured managed proxy endpoint, or the backend port otherwise

An existing incompatible SELinux port assignment is refused before changes.
With a managed proxy, its upstream is validated and updated with rollback on
failure. After updating all layers, the application is restarted.
The port must be between 1024 and 65535. Requires root privileges.`,
		Example: `  # Change the listen port to 8443
  sudo heimdall-cli set-port 8443

  # Change to a non-standard port
  sudo heimdall-cli set-port 9000`,
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

func (r *SetPortRunner) preparePortChange(setup *SetupRunner, env map[string]string, portStr string, bundled bool) (*caddyUpdate, savedFile, error) {
	var proxy *caddyUpdate
	envPath := r.Env.GetEnvFilePath()
	if _, file := r.Env.(*FileEnvManager); file && !bundled {
		// Standalone env files may be symlinks; restore the same target on failure.
		resolved, err := r.FS.EvalSymlinks(envPath)
		if err != nil {
			return nil, savedFile{}, err
		}
		envPath = resolved
	}
	before, err := snapshotFile(r.FS, envPath)
	if err != nil {
		return nil, before, err
	}
	if bundled {
		if env["HEIMDALL_PROXY_MODE"] == "bundled" || env["HEIMDALL_PROXY_MODE"] == "nginx" {
			candidate := maps.Clone(env)
			candidate["PORT"] = portStr
			if env["HEIMDALL_PROXY_MODE"] == "nginx" {
				proxy, err = setup.prepareBundledNginx(candidate)
			} else {
				proxy, err = setup.prepareBundledCaddy(candidate)
			}
			if err != nil {
				return nil, before, err
			}
		}
	} else if env["HEIMDALL_PROXY_MODE"] == "bundled" || (env["HEIMDALL_PROXY_MODE"] == "" && r.FS.Exists(standaloneCaddyfile)) {
		proxy, err = setup.prepareStandaloneCaddyPort(portStr)
		if err != nil {
			return nil, before, err
		}
	}
	return proxy, before, nil
}

func (r *SetupRunner) prepareStandaloneCaddyPort(port string) (*caddyUpdate, error) {
	before, err := snapshotFile(r.FS, standaloneCaddyfile)
	if err != nil {
		return nil, err
	}
	if !before.exists || len(standaloneCaddyUpstream.FindAll(before.data, -1)) != 1 {
		return nil, fmt.Errorf("standalone Caddy upstream is missing or ambiguous; run heimdall-cli setup to regenerate it")
	}
	u := &caddyUpdate{runner: r, unit: "caddy", group: "caddy", runDir: "/run/caddy", pending: standaloneCaddyfile + ".pending", saved: []savedFile{before}}
	u.config = standaloneCaddyUpstream.ReplaceAllString(string(before.data), "${1}"+port)
	u.active, err = r.Systemd.IsActive("caddy")
	if err != nil {
		return nil, err
	}
	state, err := r.Systemd.ShowProperty("caddy", "UnitFileState")
	if err != nil {
		return nil, err
	}
	u.enabled = state == "enabled" || state == "enabled-runtime"
	if err := safeManagedPath(r.FS, u.pending); err != nil {
		return nil, err
	}
	defer u.cleanup()
	if err := r.FS.WriteFile(u.pending, []byte(u.config), 0640); err != nil {
		return nil, err
	}
	if err := runChecked(r.Exec, "caddy", "validate", "--config", u.pending, "--adapter", "caddyfile"); err != nil {
		return nil, err
	}
	return u, nil
}

func (r *SetPortRunner) restorePortConfig(env map[string]string, before savedFile) error {
	if _, ok := r.Env.(*FileEnvManager); ok {
		return before.restore(r.FS)
	}
	return r.Env.WriteEnvFile(env)
}

func (r *SetPortRunner) rollbackPortChange(env map[string]string, before savedFile, proxy *caddyUpdate, wrote, restarted bool, rollbackFirewall func() error) error {
	var rollback []error
	if rollbackFirewall != nil {
		rollback = append(rollback, rollbackFirewall())
	}
	if wrote {
		rollback = append(rollback, r.restorePortConfig(env, before))
	}
	if proxy != nil {
		rollback = append(rollback, proxy.rollback())
	}
	if restarted {
		rollback = append(rollback, r.Systemd.Restart(ServiceName))
	}
	return errors.Join(rollback...)
}
