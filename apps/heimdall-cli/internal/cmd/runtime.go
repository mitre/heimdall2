package cmd

import (
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"charm.land/huh/v2"
	"github.com/spf13/cobra"
	"golang.org/x/term"
)

// execRunner implements ExecRunner using os/exec.
type execRunner struct{}

func (r *execRunner) Run(name string, args ...string) (string, int, error) {
	return r.RunWithEnv(nil, name, args...)
}

func (r *execRunner) RunWithEnvAndStdin(env map[string]string, stdin, name string, args ...string) (string, int, error) {
	prepared, cleanup, err := preparePGEnv(env)
	if err != nil {
		return "", 1, err
	}
	defer cleanup()
	env = prepared
	c := exec.Command(name, args...)
	c.Stdin = strings.NewReader(stdin)
	if env != nil {
		c.Env = os.Environ()
		for k, v := range env {
			c.Env = append(c.Env, k+"="+v)
		}
	}
	out, err := c.CombinedOutput()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return string(out), exitErr.ExitCode(), nil
		}
		return string(out), 1, err
	}
	return string(out), 0, nil
}

func (r *execRunner) RunWithEnv(env map[string]string, name string, args ...string) (string, int, error) {
	return r.RunWithEnvAndStdin(env, "", name, args...)
}

func (r *execRunner) RunWithStdin(stdin, name string, args ...string) (string, int, error) {
	return r.RunWithEnvAndStdin(nil, stdin, name, args...)
}

// systemdRunner implements SystemdRunner using systemctl.
type systemdRunner struct{}

func (r *systemdRunner) IsActive(service string) (bool, error) {
	c := exec.Command("systemctl", "is-active", service)
	out, err := c.Output()
	state := strings.TrimSpace(string(out))
	if err == nil && state == "active" {
		return true, nil
	}
	if exit, ok := err.(*exec.ExitError); ok && exit.ExitCode() == 3 && (state == "inactive" || state == "failed") {
		return false, nil
	}
	// Newer systemd returns 4 for an absent unit, which is also inactive.
	if exit, ok := err.(*exec.ExitError); ok && exit.ExitCode() == 4 && state == "inactive" {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return false, fmt.Errorf("unexpected systemctl is-active state %q for %s", state, service)
}
func (r *systemdRunner) Start(service string) error {
	return exec.Command("systemctl", "start", service).Run()
}
func (r *systemdRunner) Stop(service string) error {
	return exec.Command("systemctl", "stop", service).Run()
}
func (r *systemdRunner) Restart(service string) error {
	return exec.Command("systemctl", "restart", service).Run()
}
func (r *systemdRunner) Enable(service string) error {
	return exec.Command("systemctl", "enable", service).Run()
}
func (r *systemdRunner) EnableNow(service string) error {
	return exec.Command("systemctl", "enable", "--now", service).Run()
}
func (r *systemdRunner) Reload(service string) error {
	return exec.Command("systemctl", "reload", service).Run()
}
func (r *systemdRunner) ShowProperty(service, property string) (string, error) {
	c := exec.Command("systemctl", "show", "-p", property, "--value", service)
	out, err := c.Output()
	return strings.TrimSpace(string(out)), err
}

// osFileSystem implements FileSystem using real OS operations.
type osFileSystem struct{}

func (r *osFileSystem) ReadFile(path string) ([]byte, error) { return os.ReadFile(path) }
func (r *osFileSystem) WriteFile(path string, data []byte, perm os.FileMode) error {
	return os.WriteFile(path, data, perm)
}
func (r *osFileSystem) EvalSymlinks(path string) (string, error)   { return filepath.EvalSymlinks(path) }
func (r *osFileSystem) Lstat(path string) (os.FileInfo, error)     { return os.Lstat(path) }
func (r *osFileSystem) ReadDir(path string) ([]os.DirEntry, error) { return os.ReadDir(path) }
func (r *osFileSystem) Rename(old, new string) error               { return os.Rename(old, new) }
func (r *osFileSystem) Stat(path string) (os.FileInfo, error)      { return os.Stat(path) }
func (r *osFileSystem) CopyFile(src, dst string) error {
	info, err := os.Stat(src)
	if err != nil {
		return err
	}
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, info.Mode())
}
func (r *osFileSystem) MkdirAll(path string, perm os.FileMode) error {
	return os.MkdirAll(path, perm)
}
func (r *osFileSystem) TempDir(prefix string) (string, error) {
	return os.MkdirTemp("", prefix)
}
func (r *osFileSystem) RemoveAll(path string) error { return os.RemoveAll(path) }
func (r *osFileSystem) Exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func (r *osFileSystem) FindFiles(root, namePattern string) ([]string, error) {
	var matches []string
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			if path == root && os.IsNotExist(err) {
				return nil
			}
			// A partial inventory must not be reported as successful.
			return err
		}
		if d.IsDir() {
			return nil
		}
		ok, matchErr := filepath.Match(namePattern, d.Name())
		if matchErr != nil {
			return matchErr
		}
		if ok {
			matches = append(matches, path)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return matches, nil
}

// preparePGEnv materializes inline PEM only at the execution boundary. This
// keeps dry-run read-only and removes private material as soon as the child exits.
func preparePGEnv(env map[string]string) (map[string]string, func(), error) {
	var files []string
	cleanup := func() {
		for _, path := range files {
			_ = os.Remove(path)
		}
	}
	result := make(map[string]string, len(env))
	for key, value := range env {
		result[key] = value
	}
	for _, key := range []string{"PGSSLROOTCERT", "PGSSLCERT", "PGSSLKEY"} {
		if !strings.Contains(result[key], "-----BEGIN ") {
			continue
		}
		f, err := os.CreateTemp("", "heimdall-pg-tls-*")
		if err != nil {
			cleanup()
			return nil, func() {}, fmt.Errorf("preparing PostgreSQL TLS material: %w", err)
		}
		files = append(files, f.Name())
		_, writeErr := f.WriteString(result[key])
		closeErr := f.Close()
		if writeErr != nil || closeErr != nil {
			cleanup()
			return nil, func() {}, fmt.Errorf("writing PostgreSQL TLS material")
		}
		result[key] = f.Name()
	}
	return result, cleanup, nil
}

// psqlConnector implements DBConnector using the installation's selected client.
type psqlConnector struct {
	Binary string
	Env    map[string]string
}

func (r *psqlConnector) query(host string, port int, user, password, dbName string, args ...string) (string, error) {
	binary := r.Binary
	if binary == "" {
		binary = "psql"
	}
	env := make(map[string]string, len(r.Env)+1)
	for key, value := range r.Env {
		env[key] = value
	}
	env["PGPASSWORD"] = password
	argv := append([]string{"-X", "-h", host, "-p", strconv.Itoa(port), "-U", user, "-d", dbName}, args...)
	out, code, err := (&execRunner{}).RunWithEnv(env, binary, argv...)
	if err != nil {
		return "", fmt.Errorf("running PostgreSQL client %s: %w", binary, err)
	}
	if code != 0 {
		return "", fmt.Errorf("PostgreSQL client failed (exit %d): %s", code, strings.TrimSpace(out))
	}
	return out, nil
}

func (r *psqlConnector) TestConnection(host string, port int, user, password, dbName string) error {
	_, err := r.query(host, port, user, password, dbName, "-c", "SELECT 1")
	return err
}

func (r *psqlConnector) TableCount(host string, port int, user, password, dbName string) (int, error) {
	out, err := r.query(host, port, user, password, dbName, "-t", "-A", "-c", "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
	if err != nil {
		return 0, err
	}
	count, err := strconv.Atoi(strings.TrimSpace(out))
	if err != nil {
		return 0, fmt.Errorf("unexpected output: %s", out)
	}
	return count, nil
}

// initIO sets Out and ErrOut from the Cobra command if they are nil.
// This eliminates the repeated nil-check boilerplate in every RunE closure.
func initIO(out, errOut *io.Writer, cmd *cobra.Command) {
	if *out == nil {
		*out = cmd.OutOrStdout()
	}
	if errOut != nil && *errOut == nil {
		*errOut = cmd.ErrOrStderr()
	}
}

// envDefault returns the value of key from env map, or fallback if not present/empty.
func envDefault(env map[string]string, key, fallback string) string {
	if v, ok := env[key]; ok && v != "" {
		return v
	}
	return fallback
}

// huhPrompter implements Prompter using charm.land/huh/v2.
// Falls back to accessible mode (plain text stdin/stdout) when not a TTY.
type huhPrompter struct{}

func (p *huhPrompter) newForm(groups ...*huh.Group) *huh.Form {
	f := huh.NewForm(groups...)
	if !term.IsTerminal(int(os.Stdin.Fd())) {
		f = f.WithAccessible(true)
	}
	return f
}

func (p *huhPrompter) Input(prompt string, defaultValue string) (string, error) {
	if defaultValue != "" {
		prompt += fmt.Sprintf(" (default: %s)", defaultValue)
	}
	var result string
	err := p.newForm(
		huh.NewGroup(
			huh.NewInput().Title(prompt).Value(&result),
		),
	).Run()
	if err == nil && result == "" {
		result = defaultValue
	}
	return result, err
}

func (p *huhPrompter) Password(prompt string) (string, error) {
	var result string
	err := p.newForm(
		huh.NewGroup(
			huh.NewInput().Title(prompt).EchoMode(huh.EchoModePassword).Value(&result),
		),
	).Run()
	return result, err
}

func (p *huhPrompter) Confirm(prompt string, defaultValue bool) (bool, error) {
	result := defaultValue
	err := p.newForm(
		huh.NewGroup(
			huh.NewConfirm().Title(prompt).Value(&result),
		),
	).Run()
	return result, err
}

func (p *huhPrompter) Select(prompt string, defaultValue string, options []string) (int, error) {
	opts := make([]huh.Option[int], len(options))
	for i, o := range options {
		opts[i] = huh.NewOption(o, i)
	}
	var result int
	for i, option := range options {
		if option == defaultValue {
			result = i
			break
		}
	}
	err := p.newForm(
		huh.NewGroup(
			huh.NewSelect[int]().Title(prompt).Options(opts...).Value(&result),
		),
	).Run()
	return result, err
}

func (p *huhPrompter) CanPrompt() bool {
	return term.IsTerminal(int(os.Stdin.Fd()))
}

// stdioDetector checks if stdin is a real terminal.
type stdioDetector struct{}

func (r *stdioDetector) IsTerminal() bool {
	return term.IsTerminal(int(os.Stdin.Fd()))
}
