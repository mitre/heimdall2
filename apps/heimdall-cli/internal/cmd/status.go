package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/spf13/cobra"
)

// StatusRunner displays system status using injected dependencies.
type StatusRunner struct {
	Exec    ExecRunner
	Systemd SystemdRunner
	Env     EnvManager
	FS      FileSystem
	DB      DBConnector
	Out     io.Writer
	Paths   Paths
	JSON    bool
}

// NewStatusCmd creates the status cobra command.
func NewStatusCmd(runner *StatusRunner) *cobra.Command {
	production := runner == nil
	if runner == nil {
		runner = &StatusRunner{
			Exec:    &execRunner{},
			Systemd: &systemdRunner{},
			Env:     NewFileEnvManager(),
			FS:      &osFileSystem{},
			DB:      &psqlConnector{},
			Paths:   DefaultPaths(),
		}
	}

	var outputFormat string

	cmd := &cobra.Command{
		Use:   "status",
		Short: "Show Heimdall Server status",
		Long: `Display a comprehensive status report for the Heimdall Server installation.
This command checks all major subsystems and reports their state:

  - Service:   Whether heimdall-server is running, its PID, and uptime
  - Database:  PostgreSQL connectivity, table count, and connection details
  - SELinux:   Enforcement mode, policy module, and port type registration
  - fapolicyd: Trust file status and number of trusted binaries
  - firewalld: Setup's default zone and whether the configured endpoint is allowed
  - Config:    Environment file location and enabled authentication providers

This command does not require root and does not modify any state. It reads
the backend.env file to determine database credentials and configuration.`,
		Example: `  # Show full status report
  sudo heimdall-cli status

  # JSON output for scripting
  sudo heimdall-cli status --output json`,
		SilenceUsage:  true,
		SilenceErrors: true,
		RunE: func(cmd *cobra.Command, args []string) error {
			if production {
				runner.Paths = commandPaths(cmd)
				runner.Env = &FileEnvManager{Path: runner.Paths.EnvFile}
			}
			initIO(&runner.Out, nil, cmd)
			runner.JSON = outputFormat == "json"
			return runner.Run()
		},
	}

	cmd.Flags().StringVarP(&outputFormat, "output", "o", "text", "Output format (text, json)")
	return cmd
}

// Run displays the full status report.
func (r *StatusRunner) Run() error {
	env, err := r.Env.ReadEnv()
	if err != nil {
		return fmt.Errorf("reading env: %w", err)
	}

	dbCfg, err := resolveDBConfig(env)
	if err != nil {
		return err
	}
	if err := configureDBConnector(r.DB, r.Paths, r.FS, dbCfg); err != nil {
		return err
	}

	deployment, err := resolveDeployment(env, Deployment{}, isConfigured(env))
	if err != nil {
		return err
	}
	bundledRuntime, err := r.Paths.hasRuntime(r.FS)
	if err != nil {
		return err
	}
	port := envDefault(env, "PORT", DefaultAppPort)
	runtimes, units, err := r.runtimeStatus(deployment, bundledRuntime)
	if err != nil {
		return err
	}

	// Version
	versionData, err := r.FS.ReadFile(r.Paths.AppDir + "/apps/backend/package.json")
	version := "(unknown)"
	if err == nil {
		if v := extractJSONField(string(versionData), "version"); v != "" {
			version = v
		}
	}

	if r.JSON {
		return r.runJSON(dbCfg, deployment, version, port, env["EXTERNAL_URL"], runtimes, units)
	}

	r.runtimeSummary(version, deployment, bundledRuntime, env["EXTERNAL_URL"], runtimes, units)

	r.serviceStatus(port)
	r.databaseStatus(dbCfg, deployment, bundledRuntime)
	r.databaseConnectionStatus(dbCfg)
	r.selinuxStatus(port)
	r.fapolicydStatus()
	r.firewalldStatus(port, deployment.ProxyMode, env["EXTERNAL_URL"])
	r.configStatus(env)

	return nil
}

// runJSON outputs the status report as structured JSON.
func (r *StatusRunner) runJSON(dbCfg DBConfig, deployment Deployment, version, port, publicURL string, runtimes map[string]string, units map[string]bool) error {
	active, _ := r.Systemd.IsActive(ServiceName)

	result := map[string]interface{}{
		"version":    version,
		"port":       port,
		"deployment": map[string]string{"database_mode": deployment.DatabaseMode, "proxy_mode": deployment.ProxyMode, "tls_mode": deployment.TLSMode},
	}

	result["proxy"] = map[string]string{"mode": deployment.ProxyMode, "url": publicURL, "backend": "http://127.0.0.1:" + port}
	if len(runtimes) > 0 {
		result["runtimes"] = runtimes
	}
	if len(units) > 0 {
		result["managed_services"] = units
	}
	// Service
	svc := map[string]interface{}{"running": active}
	if active {
		if pid, _ := r.Systemd.ShowProperty(ServiceName, "MainPID"); pid != "" {
			svc["pid"] = pid
		}
		if since, _ := r.Systemd.ShowProperty(ServiceName, "ActiveEnterTimestamp"); since != "" {
			svc["since"] = since
		}
	}
	result["service"] = svc

	// Database
	db := map[string]interface{}{
		"host": dbCfg.Host,
		"port": dbCfg.Port,
		"name": dbCfg.DBName,
		"user": dbCfg.User,
	}
	if dbCfg.Password != "" {
		tables, err := r.DB.TableCount(dbCfg.Host, dbCfg.Port, dbCfg.User, dbCfg.Password, dbCfg.DBName)
		if err == nil {
			db["connected"] = true
			db["tables"] = tables
		} else {
			db["connected"] = false
			db["error"] = err.Error()
		}
	}
	result["database"] = db

	// Config
	result["config_file"] = r.Env.GetEnvFilePath()

	out, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return fmt.Errorf("marshalling JSON: %w", err)
	}
	fmt.Fprintln(r.Out, string(out))
	return nil
}

// extractJSONField extracts a string value from a flat JSON object.
func extractJSONField(data, field string) string {
	var m map[string]interface{}
	if err := json.Unmarshal([]byte(data), &m); err != nil {
		return ""
	}
	if v, ok := m[field]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func (r *StatusRunner) serviceStatus(port string) {
	// Service
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "Service")
	active, _ := r.Systemd.IsActive(ServiceName)
	if active {
		pid, _ := r.Systemd.ShowProperty(ServiceName, "MainPID")
		since, _ := r.Systemd.ShowProperty(ServiceName, "ActiveEnterTimestamp")
		extra := ""
		if pid != "" {
			extra += "  pid=" + pid
		}
		if since != "" {
			extra += "  since " + since
		}
		fmt.Fprintf(r.Out, "  %s\n", Ok("running"+extra))
	} else {
		fmt.Fprintf(r.Out, "  %s\n", Warn("stopped"))
	}
	fmt.Fprintf(r.Out, "  Port: %s\n", port)

}

func (r *StatusRunner) databaseStatus(dbCfg DBConfig, deployment Deployment, bundledRuntime bool) {
	// Database
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "Database")
	fmt.Fprintf(r.Out, "  Target: %s@%s:%s/%s\n", dbCfg.User, dbCfg.Host, dbCfg.PortStr(), dbCfg.DBName)

	// An RPM's saved ownership, never a loopback hostname, identifies our service.
	if bundledRuntime {
		fmt.Fprintf(r.Out, "  Database mode: %s\n  Proxy mode: %s\n  TLS mode: %s\n", deployment.DatabaseMode, deployment.ProxyMode, deployment.TLSMode)
		if deployment.DatabaseMode == "bundled" {
			if active, _ := r.Systemd.IsActive("heimdall-postgresql"); active {
				fmt.Fprintf(r.Out, "  %s\n", Ok("heimdall-postgresql running"))
			} else {
				fmt.Fprintf(r.Out, "  %s\n", Warn("heimdall-postgresql stopped"))
			}
		} else {
			fmt.Fprintln(r.Out, "  External PostgreSQL (service managed by administrator)")
		}
	} else if isLocalHost(dbCfg.Host) {
		r.localDatabaseStatus()
	} else {
		fmt.Fprintf(r.Out, "  %s\n", Skip(fmt.Sprintf("remote database (%s:%s)", dbCfg.Host, dbCfg.PortStr())))
	}

}

func (r *StatusRunner) databaseConnectionStatus(dbCfg DBConfig) {
	// DB connectivity
	if dbCfg.Password != "" {
		tables, err := r.DB.TableCount(dbCfg.Host, dbCfg.Port, dbCfg.User, dbCfg.Password, dbCfg.DBName)
		if err == nil {
			fmt.Fprintf(r.Out, "  %s\n", Ok(fmt.Sprintf("connected (%d tables)", tables)))
		} else {
			fmt.Fprintf(r.Out, "  %s\n", Fail("connection failed"))
		}
	} else {
		fmt.Fprintf(r.Out, "  %s\n", Warn("DATABASE_PASSWORD not set"))
	}

}

func (r *StatusRunner) selinuxStatus(port string) {
	// SELinux
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "SELinux")
	geOut, _, geErr := r.Exec.Run("getenforce")
	if geErr == nil && strings.TrimSpace(geOut) != "" {
		mode := strings.TrimSpace(geOut)
		switch mode {
		case "Enforcing":
			fmt.Fprintf(r.Out, "  %s\n", Ok("Enforcing"))
		case "Permissive":
			fmt.Fprintf(r.Out, "  %s\n", Warn("Permissive"))
		default:
			fmt.Fprintf(r.Out, "  %s\n", Skip("Disabled"))
		}

		// Policy module
		modOut, _, _ := r.Exec.Run("semodule", "-l")
		if strings.Contains(modOut, "heimdall_server") {
			fmt.Fprintf(r.Out, "  %s\n", Ok("heimdall_server policy module loaded"))
		} else {
			fmt.Fprintf(r.Out, "  %s\n", Fail("heimdall_server policy module NOT loaded"))
		}

		// Port registration
		portOut, code, err := r.Exec.RunWithEnv(map[string]string{"LC_ALL": "C"}, "semanage", "port", "-l")
		compatible, parseErr := selinuxPortCompatible(portOut, selinuxPort{"heimdall_server_port_t", port})
		if err != nil || code != 0 || parseErr != nil {
			fmt.Fprintf(r.Out, "  %s\n", Warn(fmt.Sprintf("unable to check port %s registration", port)))
		} else if compatible {
			fmt.Fprintf(r.Out, "  %s\n", Ok("port type: heimdall_server_port_t"))
		} else {
			fmt.Fprintf(r.Out, "  %s\n", Fail(fmt.Sprintf("port %s not registered with SELinux", port)))
		}
	} else {
		fmt.Fprintf(r.Out, "  %s\n", Skip("not available"))
	}

}

func (r *StatusRunner) fapolicydStatus() {
	// fapolicyd
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "fapolicyd")
	fapActive, _ := r.Systemd.IsActive("fapolicyd")
	if fapActive {
		fmt.Fprintf(r.Out, "  %s\n", Ok("running"))
		trustFile := "/etc/fapolicyd/trust.d/heimdall-server"
		data, err := r.FS.ReadFile(trustFile)
		if err == nil {
			count := 0
			for _, line := range strings.Split(string(data), "\n") {
				line = strings.TrimSpace(line)
				if line != "" && !strings.HasPrefix(line, "#") {
					count++
				}
			}
			fmt.Fprintf(r.Out, "  %s\n", Ok(fmt.Sprintf("%d trusted file(s)", count)))
		} else {
			fmt.Fprintf(r.Out, "  %s\n", Warn("no trust file"))
		}
	} else {
		fmt.Fprintf(r.Out, "  %s\n", Skip("not installed"))
	}

}

func (r *StatusRunner) firewalldStatus(port, mode, externalURL string) {
	// firewalld
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "firewalld")
	fwActive, _ := r.Systemd.IsActive("firewalld")
	if fwActive {
		fmt.Fprintf(r.Out, "  %s\n", Ok("running"))

		zoneOut, code, err := r.Exec.Run(firewallCommand, "--get-default-zone")
		zone := strings.TrimSpace(zoneOut)
		if err != nil || code != 0 || !firewallZone.MatchString(zone) {
			fmt.Fprintf(r.Out, "  %s\n", Warn("unable to determine firewalld default zone"))
			return
		}
		fmt.Fprintf(r.Out, "  Zone: %s\n", zone)
		kind, value, err := firewallEndpoint(port, mode, externalURL)
		if err != nil {
			fmt.Fprintf(r.Out, "  %s\n", Warn("unable to determine configured firewall endpoint"))
			return
		}
		for _, scope := range []string{"runtime", "permanent"} {
			rule := firewallRule{scope, zone, kind, value}
			_, code, err := r.Exec.Run(firewallCommand, rule.args("query")...)
			label := scope + " " + value + " " + kind
			switch {
			case err != nil || (code != 0 && code != 1):
				fmt.Fprintf(r.Out, "  %s\n", Warn("unable to query "+label))
			case code == 0:
				fmt.Fprintf(r.Out, "  %s\n", Ok(label+" enabled"))
			default:
				fmt.Fprintf(r.Out, "  %s\n", Warn(label+" not enabled"))
			}
		}
	} else {
		fmt.Fprintf(r.Out, "  %s\n", Skip("not installed"))
	}

}

func (r *StatusRunner) configStatus(env map[string]string) {
	// Config
	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "Config")
	fmt.Fprintf(r.Out, "  File: %s\n", r.Env.GetEnvFilePath())

	// Auth providers
	providers := []string{"Local"}
	if strings.EqualFold(env["LOCAL_LOGIN_DISABLED"], "true") {
		providers[0] = "Local (disabled)"
	}
	if env["OKTA_CLIENTID"] != "" {
		providers = append(providers, "Okta")
	}
	if env["GITHUB_CLIENTID"] != "" {
		providers = append(providers, "GitHub")
	}
	if env["GITLAB_CLIENTID"] != "" {
		providers = append(providers, "GitLab")
	}
	if env["GOOGLE_CLIENTID"] != "" {
		providers = append(providers, "Google")
	}
	if env["OIDC_CLIENTID"] != "" {
		name := env["OIDC_NAME"]
		if name == "" {
			name = "unnamed"
		}
		providers = append(providers, fmt.Sprintf("OIDC (%s)", name))
	}
	if strings.EqualFold(env["LDAP_ENABLED"], "true") {
		providers = append(providers, "LDAP")
	}
	fmt.Fprintf(r.Out, "  Auth: %s\n", strings.Join(providers, ", "))

}

func (r *StatusRunner) runtimeStatus(deployment Deployment, bundledRuntime bool) (map[string]string, map[string]bool, error) {
	runtimes := map[string]string{}
	var err error
	if bundledRuntime {
		runtimes, err = r.runtimeInventory()
		if err != nil {
			return nil, nil, err
		}
	}
	units := map[string]bool{}
	if bundledRuntime {
		for _, item := range []struct{ mode, selected, unit string }{{deployment.DatabaseMode, "bundled", bundledPGService}, {deployment.ProxyMode, "bundled", bundledCaddyService}, {deployment.ProxyMode, "nginx", bundledNginxService}} {
			if item.mode == item.selected {
				active, err := r.Systemd.IsActive(item.unit)
				if err != nil {
					return nil, nil, err
				}
				units[item.unit] = active
			}
		}
	}

	return runtimes, units, nil
}

func (r *StatusRunner) localDatabaseStatus() {
	pgFound := false
	for ver := 18; ver >= 13; ver-- {
		svc := fmt.Sprintf("postgresql-%d", ver)
		if a, _ := r.Systemd.IsActive(svc); a {
			fmt.Fprintf(r.Out, "  %s\n", Ok(svc+" running"))
			pgFound = true
			break
		}
	}
	if !pgFound {
		if a, _ := r.Systemd.IsActive("postgresql"); a {
			fmt.Fprintf(r.Out, "  %s\n", Ok("postgresql running"))
		} else {
			fmt.Fprintf(r.Out, "  %s\n", Fail("no local PostgreSQL service running"))
		}
	}
}

func (r *StatusRunner) runtimeSummary(version string, deployment Deployment, bundledRuntime bool, externalURL string, runtimes map[string]string, units map[string]bool) {
	fmt.Fprintf(r.Out, "Heimdall Server v%s\n", version)
	if bundledRuntime {
		for _, name := range []string{"node", "postgresql", "caddy", "nginx"} {
			if version, ok := runtimes[name]; ok {
				fmt.Fprintf(r.Out, "  Bundled %s: %s\n", name, version)
			}
		}
		fmt.Fprintf(r.Out, "  Proxy: %s (%s)\n", deployment.ProxyMode, externalURL)
		for _, unit := range []string{bundledCaddyService, bundledNginxService} {
			if active, selected := units[unit]; selected {
				fmt.Fprintf(r.Out, "  %s running: %t\n", unit, active)
			}
		}
	}

}

func (r *StatusRunner) runtimeInventory() (map[string]string, error) {
	runtimes := map[string]string{}
	data, err := r.FS.ReadFile(r.Paths.AppDir + "/runtime-manifest.json")
	if err != nil {
		return nil, err
	}
	var manifest struct {
		Runtimes map[string]struct {
			Version string `json:"version"`
		} `json:"runtimes"`
	}
	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("reading runtime inventory: %w", err)
	}
	for name, item := range manifest.Runtimes {
		runtimes[name] = item.Version
	}
	return runtimes, nil
}
