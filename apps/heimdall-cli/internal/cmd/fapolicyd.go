package cmd

// fapolicyd is RHEL/Fedora-specific. The runner stays cross-platform
// compileable so unit tests with fakes work on any host; on non-Linux
// the runtime checks (no fapolicyd-cli in PATH, no /usr/share/heimdall-server)
// make every operation a no-op. Cobra wiring may gate command visibility
// per platform later (see saf-packaging-alk).

import (
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/spf13/cobra"
)

// fapolicydTrustFile is the name of the trust list under /etc/fapolicyd/trust.d/.
// It uses the native fapolicyd.trust(5) PATH SIZE SHA256 format.
const fapolicydTrustFile = "heimdall-server"

// fapolicydAppDir contains application native .node addons.
const fapolicydAppDir = "/usr/share/heimdall-server"

// fapolicydService is the systemd unit name we check before reloading.
const fapolicydService = "fapolicyd"

// FapolicydRunner replaces heimdall-fapolicyd-trust.sh. It registers the
// bundled Node.js binary and native .node addon files with the fapolicyd
// trust database (and removes them on uninstall). All operations are
// skipped when the tool is absent; other failures are returned.
type FapolicydRunner struct {
	Exec    ExecRunner
	FS      FileSystem
	Systemd SystemdRunner
	Out     io.Writer
}

// Add rebuilds only our dedicated trust file, atomically refreshing hashes and
// dropping stale records. No mutable configuration or state tree is trusted.
func (r *FapolicydRunner) Add() error {
	available, err := commandAvailable(r.Exec, "fapolicyd-cli")
	if err != nil {
		return err
	}
	if !available {
		if r.Out != nil {
			fmt.Fprintln(r.Out, "fapolicyd: not installed (skipped)")
		}
		return nil
	}
	var files, aliases []string
	for _, root := range []string{
		"/usr/libexec/heimdall-server/runtime/node/bin",
		"/usr/libexec/heimdall-server/runtime/postgresql/bin",
		"/usr/libexec/heimdall-server/runtime/postgresql/lib",
		"/usr/libexec/heimdall-server/runtime/caddy",
		"/usr/libexec/heimdall-server/runtime/nginx",
	} {
		if err := safeManagedPath(r.FS, root+"/.heimdall-trust-check"); err != nil {
			return err
		}
		found, err := r.FS.FindFiles(root, "*")
		if err != nil {
			return err
		}
		for _, path := range found {
			info, err := r.FS.Lstat(path)
			if err != nil {
				return err
			}
			if info.Mode()&os.ModeSymlink != 0 {
				aliases = append(aliases, path)
				continue
			}
			if strings.HasSuffix(root, "/lib") && !strings.Contains(filepath.Base(path), ".so") {
				continue
			}
			files = append(files, path)
		}
	}
	if err := safeManagedPath(r.FS, fapolicydAppDir+"/.heimdall-trust-check"); err != nil {
		return err
	}
	addons, err := r.FS.FindFiles(fapolicydAppDir, "*.node")
	if err != nil {
		return err
	}
	files = append(files, addons...)
	// Older standalone installations put Node here; RPM installs use private roots.
	if !r.FS.Exists(fapolicydAppDir+"/runtime-manifest.json") && r.FS.Exists(fapolicydAppDir+"/node") {
		files = append(files, fapolicydAppDir+"/node")
	}
	sort.Strings(files)
	trustPath := "/etc/fapolicyd/trust.d/" + fapolicydTrustFile
	pending := trustPath + ".pending"
	if len(files) == 0 && len(aliases) == 0 && !r.FS.Exists(trustPath) {
		return r.reloadIfActive()
	}
	for _, path := range []string{trustPath, pending} {
		if err := safeManagedPath(r.FS, path); err != nil {
			return err
		}
	}
	validated := make(map[string]bool, len(files))
	for _, path := range files {
		if strings.IndexFunc(path, func(c rune) bool { return c < 0x20 || c == 0x7f }) >= 0 {
			return fmt.Errorf("control character in fapolicyd trust path: %q", path)
		}
		if err := requireRegular(r.FS, path); err != nil {
			return err
		}
		validated[path] = true
	}
	for _, alias := range aliases {
		target, err := r.FS.EvalSymlinks(alias)
		if err != nil {
			return fmt.Errorf("resolving private runtime alias %s: %w", alias, err)
		}
		if !validated[target] {
			return fmt.Errorf("private runtime alias %s targets an unlisted immutable file: %s", alias, target)
		}
	}
	// Native --file add deduplicates across all trust files, including the
	// previous owned snapshot. Build actual hashes before publishing instead.
	var records strings.Builder
	for _, path := range files {
		data, err := r.FS.ReadFile(path)
		if err != nil {
			return fmt.Errorf("hashing fapolicyd trust path %s: %w", path, err)
		}
		fmt.Fprintf(&records, "%s %d %x\n", path, len(data), sha256.Sum256(data))
	}
	previous, err := snapshotFile(r.FS, trustPath)
	if err != nil {
		return err
	}
	if err := r.FS.MkdirAll("/etc/fapolicyd/trust.d", 0755); err != nil {
		return err
	}
	if err := r.FS.RemoveAll(pending); err != nil {
		return err
	}
	defer r.FS.RemoveAll(pending)
	if err := r.publishTrustSnapshot(pending, trustPath, []byte(records.String())); err != nil {
		return err
	}
	if err := r.reloadIfActive(); err != nil {
		var rollback error
		if previous.exists {
			rollback = r.publishTrustSnapshot(pending, trustPath, previous.data)
		} else {
			rollback = r.FS.RemoveAll(trustPath)
		}
		if rollback == nil {
			rollback = r.reloadIfActive()
		}
		return errors.Join(err, rollback)
	}
	if r.Out != nil {
		fmt.Fprintln(r.Out, "fapolicyd: trust entries added (hashes refreshed)")
	}
	return nil
}

func (r *FapolicydRunner) publishTrustSnapshot(pending, trustPath string, records []byte) error {
	if err := r.FS.WriteFile(pending, records, 0600); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chown", "root:root", pending); err != nil {
		return err
	}
	if err := runChecked(r.Exec, "chmod", "0600", pending); err != nil {
		return err
	}
	return r.FS.Rename(pending, trustPath)
}

// Remove touches only the Heimdall trust file, preserving administrator lists.
func (r *FapolicydRunner) Remove() error {
	trustPath := "/etc/fapolicyd/trust.d/" + fapolicydTrustFile
	if err := safeManagedPath(r.FS, trustPath); err != nil {
		return err
	}
	if err := r.FS.RemoveAll(trustPath); err != nil {
		return err
	}
	available, err := commandAvailable(r.Exec, "fapolicyd-cli")
	if err != nil {
		return err
	}
	if !available {
		if r.Out != nil {
			fmt.Fprintln(r.Out, "fapolicyd: not installed (skipped)")
		}
		return nil
	}
	if err := r.reloadIfActive(); err != nil {
		return err
	}
	if r.Out != nil {
		fmt.Fprintln(r.Out, "fapolicyd: trust entries removed")
	}
	return nil
}

func (r *FapolicydRunner) reloadIfActive() error {
	active, err := r.Systemd.IsActive(fapolicydService)
	if err != nil {
		return err
	}
	if !active {
		return nil
	}
	return runChecked(r.Exec, "fapolicyd-cli", "--update")
}

// NewFapolicydCmd builds the `fapolicyd` parent command with `add` and
// `remove` subcommands. Designed to be invoked from RPM scriptlets
// (%post / %postun) — not a daily admin tool.
func NewFapolicydCmd(runner *FapolicydRunner) *cobra.Command {
	if runner == nil {
		runner = &FapolicydRunner{
			Exec:    &execRunner{},
			FS:      &osFileSystem{},
			Systemd: &systemdRunner{},
		}
	}

	cmd := &cobra.Command{
		Use:   "fapolicyd",
		Short: "Manage fapolicyd trust for the private runtimes and native addons",
		Long: `Register private Node.js, PostgreSQL, Caddy executables/libraries and .node addons with
the fapolicyd trust database. Invoked from RPM %post / %postun
scriptlets; usually you do not run this by hand.

The trust list is written to /etc/fapolicyd/trust.d/heimdall-server.
If the fapolicyd service is running, it is reloaded after changes so
the new trust entries take effect immediately.

This command is a safe no-op on systems without fapolicyd installed.`,
	}

	cmd.AddCommand(&cobra.Command{
		Use:          "add",
		Short:        "Trust the bundled binary and addons",
		SilenceUsage: true,
		RunE: func(c *cobra.Command, _ []string) error {
			runner.Out = c.OutOrStdout()
			if err := runner.Add(); err != nil {
				return err
			}
			return nil
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:          "remove",
		Short:        "Remove trust entries (called on RPM uninstall)",
		SilenceUsage: true,
		RunE: func(c *cobra.Command, _ []string) error {
			runner.Out = c.OutOrStdout()
			if err := runner.Remove(); err != nil {
				return err
			}
			return nil
		},
	})

	return cmd
}
