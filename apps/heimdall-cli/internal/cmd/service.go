package cmd

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"

	"github.com/spf13/cobra"
)

// ServiceRunner holds dependencies for service commands.
type ServiceRunner struct {
	Systemd   SystemdRunner
	Exec      ExecRunner
	Env       EnvManager
	Out       io.Writer
	ErrOut    io.Writer
	Paths     Paths
	CheckRoot func() error
}

func (r *ServiceRunner) Start() error {
	if r.CheckRoot != nil {
		if err := r.CheckRoot(); err != nil {
			return err
		}
	}
	if err := r.Systemd.Start(ServiceName); err != nil {
		return fmt.Errorf("failed to start service: %w", err)
	}
	fmt.Fprintln(r.Out, "Service started.")
	return nil
}

func (r *ServiceRunner) Stop() error {
	if r.CheckRoot != nil {
		if err := r.CheckRoot(); err != nil {
			return err
		}
	}
	if err := r.Systemd.Stop(ServiceName); err != nil {
		return fmt.Errorf("failed to stop service: %w", err)
	}
	fmt.Fprintln(r.Out, "Service stopped. Database and proxy services remain running.")
	return nil
}

func (r *ServiceRunner) Restart() error {
	if r.CheckRoot != nil {
		if err := r.CheckRoot(); err != nil {
			return err
		}
	}
	if err := r.Systemd.Restart(ServiceName); err != nil {
		return fmt.Errorf("failed to restart service: %w", err)
	}
	fmt.Fprintln(r.Out, "Service restarted.")
	return nil
}

func (r *ServiceRunner) Logs(lines int, follow bool) error {
	if follow {
		// For --follow, exec into journalctl (replaces the process)
		args := []string{"journalctl", "-u", ServiceName, "--no-pager", "-n", fmt.Sprintf("%d", lines), "-f"}
		return execvp(args[0], args)
	}
	stdout, _, err := r.Exec.Run("journalctl", "-u", ServiceName, "--no-pager", "-n", fmt.Sprintf("%d", lines))
	if err != nil {
		return fmt.Errorf("failed to read logs: %w", err)
	}
	fmt.Fprint(r.Out, stdout)
	return nil
}

func (r *ServiceRunner) Diag() error {
	fmt.Fprintln(r.Out, "=== Heimdall Server Diagnostic Report ===")
	fmt.Fprintln(r.Out)

	// OS info
	fmt.Fprintln(r.Out, "--- OS ---")
	if out, _, err := r.Exec.Run("cat", "/etc/os-release"); err == nil {
		for _, line := range strings.Split(out, "\n") {
			if strings.HasPrefix(line, "NAME=") || strings.HasPrefix(line, "VERSION=") || strings.HasPrefix(line, "ID=") {
				fmt.Fprintf(r.Out, "  %s\n", line)
			}
		}
	}
	if out, _, err := r.Exec.Run("uname", "-rm"); err == nil {
		fmt.Fprintf(r.Out, "  Kernel: %s\n", strings.TrimSpace(out))
	}
	fmt.Fprintln(r.Out)

	// Service status
	fmt.Fprintln(r.Out, "--- Service ---")
	active, _ := r.Systemd.IsActive(ServiceName)
	if active {
		fmt.Fprintln(r.Out, "  running")
	} else {
		fmt.Fprintln(r.Out, "  stopped")
	}
	fmt.Fprintln(r.Out)

	env, err := r.Env.ReadEnv()
	if err == nil {
		fmt.Fprintf(r.Out, "  Database: %s (%s:%s)\n  Proxy: %s (%s)\n", env["HEIMDALL_DATABASE_MODE"], env["DATABASE_HOST"], env["DATABASE_PORT"], env["HEIMDALL_PROXY_MODE"], env["EXTERNAL_URL"])
		for _, item := range []struct{ key, mode, unit string }{{"HEIMDALL_DATABASE_MODE", "bundled", bundledPGService}, {"HEIMDALL_PROXY_MODE", "bundled", bundledCaddyService}, {"HEIMDALL_PROXY_MODE", "nginx", bundledNginxService}} {
			if env[item.key] == item.mode {
				active, _ := r.Systemd.IsActive(item.unit)
				fmt.Fprintf(r.Out, "  %s running: %t (journalctl -u %s)\n", item.unit, active, item.unit)
			}
		}
	}
	// SELinux denials
	fmt.Fprintln(r.Out, "--- SELinux Denials ---")
	out, _, _ := r.Exec.Run("ausearch", "-m", "avc", "-ts", "recent")
	if strings.Contains(out, "heimdall") {
		fmt.Fprintln(r.Out, out)
	} else {
		fmt.Fprintln(r.Out, "  (no heimdall-related denials)")
	}
	fmt.Fprintln(r.Out)

	// systemd security score
	fmt.Fprintln(r.Out, "--- systemd Security Score ---")
	out, _, _ = r.Exec.Run("systemd-analyze", "security", ServiceName)
	for _, line := range strings.Split(out, "\n") {
		if strings.Contains(line, "Overall") || strings.Contains(line, "OVERALL") {
			fmt.Fprintf(r.Out, "  %s\n", strings.TrimSpace(line))
			break
		}
	}
	fmt.Fprintln(r.Out)

	// Disk usage
	fmt.Fprintln(r.Out, "--- Disk Usage ---")
	for _, d := range []string{r.Paths.AppDir, r.Paths.DataDir, r.Paths.ConfigDir} {
		out, _, _ := r.Exec.Run("du", "-sh", d)
		if out != "" {
			fmt.Fprintf(r.Out, "  %s\n", strings.TrimSpace(out))
		}
	}
	fmt.Fprintln(r.Out)

	// Memory
	fmt.Fprintln(r.Out, "--- Memory ---")
	out, _, _ = r.Exec.Run("free", "-h")
	for i, line := range strings.Split(out, "\n") {
		if i < 2 {
			fmt.Fprintf(r.Out, "  %s\n", line)
		}
	}
	fmt.Fprintln(r.Out)

	// Listening ports
	fmt.Fprintln(r.Out, "--- Listening Ports ---")
	out, _, _ = r.Exec.Run("ss", "-tlnp")
	for _, line := range strings.Split(out, "\n") {
		fields := strings.Fields(line)
		selectedPort := len(fields) >= 4 && (strings.HasSuffix(fields[3], ":"+envDefault(env, "PORT", DefaultAppPort)) || strings.HasSuffix(fields[3], ":"+envDefault(env, "DATABASE_PORT", "5432")) || strings.HasSuffix(fields[3], ":443"))
		if strings.Contains(line, "heimdall") || selectedPort {
			fmt.Fprintf(r.Out, "  %s\n", line)
		}
	}

	return nil
}

// execvp replaces the current process with the given command.
// In production this calls syscall.Exec; it's a var for testing.
var execvp = defaultExecvp

func defaultExecvp(name string, args []string) error {
	path, err := exec.LookPath(name)
	if err != nil {
		return err
	}
	return execSyscall(path, args, os.Environ())
}

// execSyscall is the actual syscall.Exec call, separated for testability.
// On Unix, this defaults to syscall.Exec. Tests can override it.
var execSyscall = defaultExecSyscall

func requireRoot() error {
	if os.Geteuid() != 0 {
		return fmt.Errorf("this command requires root — use sudo")
	}
	return nil
}

func newDefaultServiceRunner(out, errOut io.Writer) *ServiceRunner {
	return &ServiceRunner{
		Systemd:   &systemdRunner{},
		Exec:      &execRunner{},
		Env:       NewFileEnvManager(),
		Out:       out,
		ErrOut:    errOut,
		Paths:     DefaultPaths(),
		CheckRoot: requireRoot,
	}
}

// NewStartCmd creates the start command.
func NewStartCmd(runner *ServiceRunner) *cobra.Command {
	if runner == nil {
		runner = newDefaultServiceRunner(nil, nil)
	}
	return &cobra.Command{
		Use:   "start",
		Short: "Start the Heimdall server service",
		Long: `Start the heimdall-server systemd service. This is equivalent to running
'systemctl start heimdall-server'. The service must have been previously
set up with 'heimdall-cli setup'. Requires root privileges.`,
		Example: `  # Start the Heimdall server
  sudo heimdall-cli start`,
		RunE: func(cmd *cobra.Command, args []string) error {
			initIO(&runner.Out, &runner.ErrOut, cmd)
			return runner.Start()
		},
	}
}

// NewStopCmd creates the stop command.
func NewStopCmd(runner *ServiceRunner) *cobra.Command {
	if runner == nil {
		runner = newDefaultServiceRunner(nil, nil)
	}
	return &cobra.Command{
		Use:   "stop",
		Short: "Stop the Heimdall server service",
		Long: `Stop the heimdall-server systemd service. Selected database and proxy services remain running. This gracefully shuts down the
Node.js backend process. The service can be restarted later with
'heimdall-cli start' or 'systemctl start heimdall-server'. Requires
root privileges.`,
		Example: `  # Stop the Heimdall server
  sudo heimdall-cli stop`,
		RunE: func(cmd *cobra.Command, args []string) error {
			initIO(&runner.Out, &runner.ErrOut, cmd)
			return runner.Stop()
		},
	}
}

// NewRestartCmd creates the restart command.
func NewRestartCmd(runner *ServiceRunner) *cobra.Command {
	if runner == nil {
		runner = newDefaultServiceRunner(nil, nil)
	}
	return &cobra.Command{
		Use:   "restart",
		Short: "Restart the Heimdall server service",
		Long: `Restart the heimdall-server systemd service. This performs a stop followed
by a start, which is necessary after configuration changes (e.g., after
running 'heimdall-cli config set'). Requires root privileges.`,
		Example: `  # Restart after a configuration change
  sudo heimdall-cli config set EXTERNAL_URL https://new.example.com
  sudo heimdall-cli restart`,
		RunE: func(cmd *cobra.Command, args []string) error {
			initIO(&runner.Out, &runner.ErrOut, cmd)
			return runner.Restart()
		},
	}
}

// NewLogsCmd creates the logs command.
func NewLogsCmd(runner *ServiceRunner) *cobra.Command {
	if runner == nil {
		runner = newDefaultServiceRunner(nil, nil)
	}
	var lines int
	var follow bool

	cmd := &cobra.Command{
		Use:   "logs",
		Short: "View Heimdall server logs",
		Long: `View the Heimdall Server logs from the systemd journal. By default, shows
the last 50 lines. Use --lines to control the number of lines shown.
Use --follow to stream new log entries in real time (this replaces the
current process with journalctl, similar to 'tail -f').`,
		Example: `  # View the last 50 log lines
  sudo heimdall-cli logs

  # View the last 200 log lines
  sudo heimdall-cli logs --lines 200

  # Follow log output in real time
  sudo heimdall-cli logs --follow`,
		RunE: func(cmd *cobra.Command, args []string) error {
			initIO(&runner.Out, &runner.ErrOut, cmd)
			return runner.Logs(lines, follow)
		},
	}

	cmd.Flags().IntVarP(&lines, "lines", "n", 50, "Number of lines to show")
	cmd.Flags().BoolVarP(&follow, "follow", "f", false, "Follow log output")
	return cmd
}

// NewDiagCmd creates the diag command.
func NewDiagCmd(runner *ServiceRunner) *cobra.Command {
	if runner == nil {
		runner = newDefaultServiceRunner(nil, nil)
	}
	return &cobra.Command{
		Use:   "diag",
		Short: "Full diagnostic dump for troubleshooting",
		Long: `Generate a comprehensive diagnostic report for troubleshooting Heimdall
Server issues. The report includes:

  - OS:              Distribution name, version, kernel, and architecture
  - Service:         Whether heimdall-server is running or stopped
  - SELinux denials: Recent AVC denials related to heimdall from ausearch
  - Security score:  systemd-analyze security rating for the service unit
  - Disk usage:      Size of application, data, and configuration directories
  - Memory:          System memory usage from free(1)
  - Listening ports: Configured backend and database ports, plus HTTPS (443)

This output is suitable for attaching to bug reports or support tickets.`,
		Example: `  # Print diagnostic report to terminal
  sudo heimdall-cli diag

  # Save diagnostic report to a file
  sudo heimdall-cli diag > /tmp/heimdall-diag-$(date +%Y%m%d).txt`,
		RunE: func(cmd *cobra.Command, args []string) error {
			initIO(&runner.Out, &runner.ErrOut, cmd)
			return runner.Diag()
		},
	}
}
