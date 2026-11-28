package cmd

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
)

func commandAvailable(exec ExecRunner, name string) (bool, error) {
	_, code, err := exec.Run("sh", "-c", `command -v "$1"`, "sh", name)
	if err != nil || (code != 0 && code != 1) {
		return false, fmt.Errorf("checking %s availability (exit %d): %v", name, code, err)
	}
	return code == 0, nil
}

func selinuxEnabled(fs FileSystem) (bool, error) {
	data, err := fs.ReadFile("/sys/fs/selinux/enforce")
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	switch strings.TrimSpace(string(data)) {
	case "0", "1":
		return true, nil
	}
	return false, fmt.Errorf("invalid SELinux enforce status")
}

// Validate root-controlled ancestors and a private, single-link regular leaf.
func rootManagedFile(fs FileSystem, path string) error {
	if err := safeManagedPath(fs, path); err != nil {
		return err
	}
	for current := path; current != "/"; current = filepath.Dir(current) {
		info, err := fs.Lstat(current)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return err
		}
		if err := validateRootManagedInfo(info, current, path); err != nil {
			return err
		}
	}
	return nil
}

type selinuxPort struct{ kind, port string }

func validSELinuxPort(p selinuxPort) bool {
	n, err := strconv.Atoi(p.port)
	return strings.Trim(p.port, "0123456789") == "" && err == nil && n >= 1 && n <= 65535 && (p.kind == "heimdall_server_port_t" || p.kind == "postgresql_port_t" || p.kind == "http_port_t")
}

// Native semanage output contains comma lists and inclusive ranges. Broad
// unreserved defaults do not reserve a port for another service.
func selinuxPortCompatible(output string, wanted selinuxPort) (bool, error) {
	return matchSELinuxPort(output, wanted, false)
}

func matchSELinuxPort(output string, wanted selinuxPort, exactLocal bool) (bool, error) {
	compatible := false
	for _, line := range strings.Split(output, "\n") {
		f := strings.Fields(line)
		if len(f) == 0 || strings.HasPrefix(line, "SELinux Port Type") {
			continue
		}
		if len(f) < 3 || (f[1] != "tcp" && f[1] != "udp" && f[1] != "sctp" && f[1] != "dccp") {
			return false, fmt.Errorf("unexpected SELinux port listing: %q", line)
		}
		if f[1] != "tcp" {
			continue
		}
		matched, err := matchSELinuxPortSpans(f, wanted, exactLocal)
		if err != nil {
			return false, err
		}
		compatible = compatible || matched
	}
	return compatible, nil
}

func readPortLedger(fs FileSystem, path string) ([]byte, error) {
	if err := rootManagedFile(fs, path); err != nil {
		return nil, err
	}
	data, err := fs.ReadFile(path)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	for _, line := range strings.Split(strings.TrimSpace(string(data)), "\n") {
		if line == "" {
			continue
		}
		f := strings.Fields(line)
		if len(f) != 3 || f[1] != "tcp" || !validSELinuxPort(selinuxPort{f[0], f[2]}) {
			return nil, fmt.Errorf("invalid SELinux port ownership ledger")
		}
	}
	return data, nil
}

func configureSELinuxPorts(exec ExecRunner, fs FileSystem, configDir string, ports []selinuxPort, apply bool) error {
	enabled, err := selinuxEnabled(fs)
	if err != nil || !enabled {
		return err
	}
	available, err := commandAvailable(exec, "semanage")
	if err != nil {
		return err
	}
	if !available {
		return fmt.Errorf("SELinux is enabled but semanage is missing; install policycoreutils-python-utils")
	}
	out, code, err := exec.RunWithEnv(map[string]string{"LC_ALL": "C"}, "semanage", "port", "-l")
	if err != nil || code != 0 {
		return fmt.Errorf("listing SELinux ports (exit %d): %s: %v", code, strings.TrimSpace(out), err)
	}
	additions, err := missingSELinuxPorts(out, ports)
	if err != nil {
		return err
	}
	ledger := configDir + "/selinux-ports"
	pending := ledger + ".pending"
	data, err := readPortLedger(fs, ledger)
	if err != nil {
		return err
	}
	interrupted, err := readPortLedger(fs, pending)
	if err != nil {
		return err
	}
	data, err = reconcileSELinuxLedger(exec, fs, ledger, pending, data, interrupted, apply)
	if err != nil {
		return err
	}
	if len(additions) == 0 {
		return nil
	}
	if !apply {
		return nil
	}
	if err := fs.MkdirAll(configDir, 0751); err != nil {
		return err
	}
	for _, p := range additions {
		if err := runChecked(exec, "semanage", "port", "-a", "-t", p.kind, "-p", "tcp", p.port); err != nil {
			return fmt.Errorf("registering SELinux %s TCP %s: %w", p.kind, p.port, err)
		}
		data = appendPortRecord(data, p)
		if saveErr := savePortLedger(exec, fs, ledger, pending, data); saveErr != nil {
			cleanupErr := rollbackSELinuxPort(exec, p)
			if cleanupErr == nil {
				cleanupErr = fs.RemoveAll(pending)
			}
			return fmt.Errorf("saving ownership of SELinux %s TCP %s; retry setup to reconcile %s: %w", p.kind, p.port, pending, errors.Join(saveErr, cleanupErr))
		}
	}
	return nil
}

func appendPortRecord(data []byte, p selinuxPort) []byte {
	record := p.kind + " tcp " + p.port + "\n"
	if len(data) > 0 && data[len(data)-1] != '\n' {
		data = append(data, '\n')
	}
	if !strings.Contains("\n"+string(data), "\n"+record) {
		data = append(data, []byte(record)...)
	}
	return data
}

func savePortLedger(exec ExecRunner, fs FileSystem, ledger, pending string, data []byte) error {
	if err := rootManagedFile(fs, pending); err != nil {
		return err
	}
	if err := fs.WriteFile(pending, data, 0600); err != nil {
		return err
	}
	if err := runChecked(exec, "chown", "root:root", pending); err != nil {
		return err
	}
	if err := runChecked(exec, "chmod", "0600", pending); err != nil {
		return err
	}
	if err := rootManagedFile(fs, ledger); err != nil {
		return err
	}
	return fs.Rename(pending, ledger)
}

func localSELinuxPorts(exec ExecRunner) (string, error) {
	out, code, err := exec.RunWithEnv(map[string]string{"LC_ALL": "C"}, "semanage", "port", "-l", "-C")
	if err != nil || code != 0 {
		return "", fmt.Errorf("listing local SELinux ports (exit %d): %s: %v", code, strings.TrimSpace(out), err)
	}
	return out, nil
}

func rollbackSELinuxPort(exec ExecRunner, p selinuxPort) error {
	local, err := localSELinuxPorts(exec)
	if err != nil {
		return err
	}
	exact, err := matchSELinuxPort(local, p, true)
	if err != nil {
		return err
	}
	if !exact {
		// Absent or changed by an administrator: never delete it.
		return nil
	}
	return runChecked(exec, "semanage", "port", "-d", "-p", "tcp", p.port)
}

// Only exact product roots are relabeled; never broad /etc, /var/lib or /run.
func restoreSELinuxPaths(exec ExecRunner, fs FileSystem, paths ...string) error {
	enabled, err := selinuxEnabled(fs)
	if err != nil || !enabled {
		return err
	}
	available, err := commandAvailable(exec, "restorecon")
	if err != nil {
		return err
	}
	if !available {
		return fmt.Errorf("SELinux is enabled but restorecon is missing")
	}
	var existing []string
	for _, path := range paths {
		info, err := fs.Lstat(path)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return err
		}
		check := path
		if info.IsDir() {
			check = filepath.Join(path, ".heimdall-label-check")
		}
		if err := safeManagedPath(fs, check); err != nil {
			return err
		}
		existing = append(existing, path)
	}
	if len(existing) == 0 {
		return nil
	}
	return runChecked(exec, "restorecon", append([]string{"-R"}, existing...)...)
}

func (r *SetupRunner) selectedSELinuxPorts(env map[string]string) ([]selinuxPort, error) {
	ports := []selinuxPort{{"heimdall_server_port_t", envDefault(env, "PORT", DefaultAppPort)}}
	if !r.SkipDB && (r.DatabaseMode == "bundled" || r.DatabaseMode == "external") {
		port := r.DBPort
		tcp := true
		if r.DatabaseMode == "external" {
			cfg, err := resolveDBConfig(env)
			if err != nil {
				return nil, err
			}
			port = cfg.Port
			tcp = !strings.HasPrefix(cfg.Host, "/")
		}
		if tcp {
			ports = append(ports, selinuxPort{"postgresql_port_t", strconv.Itoa(port)})
		}
	}
	if !r.SkipTLS && r.ProxyMode == "nginx" {
		ports = append(ports, selinuxPort{"http_port_t", "443"})
	}
	if !r.SkipTLS && r.ProxyMode == "bundled" {
		u, err := validatePublicURL(env["EXTERNAL_URL"])
		if err != nil {
			return nil, err
		}
		port := "80"
		if u.Scheme == "https" {
			port = "443"
			ports = append(ports, selinuxPort{"http_port_t", "80"})
		}
		if u.Port() != "" {
			port = u.Port()
		}
		ports = append(ports, selinuxPort{"http_port_t", port})
	}
	return ports, nil
}

func validateRootManagedInfo(info os.FileInfo, current, path string) error {
	if info.Mode().Perm()&0022 != 0 {
		return fmt.Errorf("unsafe writable managed path: %s", current)
	}
	if stat, ok := info.Sys().(*syscall.Stat_t); ok {
		if stat.Uid != 0 || (current == path && (stat.Gid != 0 || stat.Nlink != 1)) {
			return fmt.Errorf("expected root-owned managed path: %s", current)
		}
	}
	if current == path && info.Mode().Perm() != 0600 {
		return fmt.Errorf("expected mode 0600: %s", current)
	}
	return nil
}

func matchSELinuxPortSpans(f []string, wanted selinuxPort, exactLocal bool) (bool, error) {
	compatible := false
	for _, span := range strings.Split(strings.Join(f[2:], ""), ",") {
		start, end, err := parseSELinuxPortSpan(span)
		if err != nil {
			return false, err
		}
		port, _ := strconv.Atoi(wanted.port)
		if port < start || port > end {
			continue
		}
		if exactLocal {
			if start == end && f[0] == wanted.kind {
				compatible = true
			}
			continue
		}
		if f[0] == "unreserved_port_t" || f[0] == "reserved_port_t" || f[0] == "ephemeral_port_t" || f[0] == "port_t" {
			continue
		}
		if f[0] != wanted.kind {
			return false, fmt.Errorf("SELinux TCP port %s belongs to %s; choose another port (requires %s)", wanted.port, f[0], wanted.kind)
		}
		compatible = true
	}
	return compatible, nil
}

func parseSELinuxPortSpan(span string) (int, int, error) {
	low, high, ranged := strings.Cut(span, "-")
	start, e1 := strconv.Atoi(low)
	end := start
	var e2 error
	if ranged {
		end, e2 = strconv.Atoi(high)
	}
	if e1 != nil || e2 != nil || start < 0 || end > 65535 || end < start {
		return 0, 0, fmt.Errorf("invalid SELinux port range: %q", span)
	}
	return start, end, nil
}

func missingSELinuxPorts(out string, ports []selinuxPort) ([]selinuxPort, error) {
	var additions []selinuxPort
	seen := map[string]string{}
	for _, p := range ports {
		if !validSELinuxPort(p) {
			return nil, fmt.Errorf("invalid selected SELinux port")
		}
		if kind, ok := seen[p.port]; ok {
			if kind != p.kind {
				return nil, fmt.Errorf("SELinux port %s selected for incompatible services", p.port)
			}
			continue
		}
		seen[p.port] = p.kind
		compatible, err := selinuxPortCompatible(out, p)
		if err != nil {
			return nil, err
		}
		if !compatible {
			additions = append(additions, p)
		}
	}
	return additions, nil
}

func reconcileSELinuxLedger(exec ExecRunner, fs FileSystem, ledger, pending string, data, interrupted []byte, apply bool) ([]byte, error) {
	if !fs.Exists(pending) {
		return data, nil
	}
	local, err := localSELinuxPorts(exec)
	if err != nil {
		return nil, err
	}
	for _, line := range strings.Split(strings.TrimSpace(string(interrupted)), "\n") {
		f := strings.Fields(line)
		if len(f) == 0 {
			continue
		}
		matches, err := matchSELinuxPort(local, selinuxPort{f[0], f[2]}, true)
		if err != nil {
			return nil, err
		}
		if matches {
			data = appendPortRecord(data, selinuxPort{f[0], f[2]})
		}
	}
	if apply {
		// Keep the original pending snapshot until its merged replacement is durable.
		if err := savePortLedger(exec, fs, ledger, ledger+".reconcile", data); err != nil {
			return nil, fmt.Errorf("reconciling %s; retained pending ownership: %w", pending, err)
		}
		if err := fs.RemoveAll(pending); err != nil {
			return nil, err
		}
	}
	return data, nil
}
