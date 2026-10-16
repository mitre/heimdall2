package cmd

import (
	"fmt"
	"io"
	"path/filepath"

	"github.com/spf13/cobra"
)

// AddCertRunner holds dependencies for the add-cert command.
type AddCertRunner struct {
	Exec      ExecRunner
	Env       EnvManager
	FS        FileSystem
	Out       io.Writer
	CheckRoot func() error
}

// Run executes the add-cert logic.
func (r *AddCertRunner) Run(certPath string) error {
	if r.CheckRoot != nil {
		if err := r.CheckRoot(); err != nil {
			return err
		}
	}
	if !r.FS.Exists(certPath) {
		return fmt.Errorf("file not found: %s", certPath)
	}

	basename := filepath.Base(certPath)
	// These paths are OS-level CA trust store locations (RHEL/CentOS/Fedora),
	// not Heimdall-specific paths. They are not configurable via Paths.
	dest := filepath.Join("/etc/pki/ca-trust/source/anchors", basename)

	if err := r.FS.CopyFile(certPath, dest); err != nil {
		return fmt.Errorf("failed to copy certificate: %w", err)
	}
	fmt.Fprintf(r.Out, "Copied %s to %s\n", basename, dest)

	if err := runChecked(r.Exec, "update-ca-trust"); err != nil {
		return fmt.Errorf("updating system trust store: %w", err)
	}
	fmt.Fprintln(r.Out, "System trust store updated.")

	// OS-level consolidated CA bundle path — see comment above.
	caBundle := "/etc/pki/tls/certs/ca-bundle.crt"
	env, _ := r.Env.ReadEnv()
	if env["NODE_EXTRA_CA_CERTS"] != caBundle {
		if err := r.Env.WriteEnvKey("NODE_EXTRA_CA_CERTS", caBundle); err != nil {
			return fmt.Errorf("failed to update env: %w", err)
		}
		fmt.Fprintf(r.Out, "Set NODE_EXTRA_CA_CERTS=%s in backend.env\n", caBundle)
	}

	fmt.Fprintln(r.Out)
	fmt.Fprintln(r.Out, "Restart the service to pick up the new certificate:")
	fmt.Fprintf(r.Out, "  sudo systemctl restart %s\n", ServiceName)

	return nil
}

// NewAddCertCmd creates the add-cert command.
func NewAddCertCmd(runner *AddCertRunner) *cobra.Command {
	if runner == nil {
		runner = &AddCertRunner{
			Exec:      &execRunner{},
			Env:       NewFileEnvManager(),
			FS:        &osFileSystem{},
			CheckRoot: requireRoot,
		}
	}
	return &cobra.Command{
		Use:   "add-cert <cert-path>",
		Short: "Add an organizational CA certificate to the system trust store",
		Long: `Install an organizational or internal CA certificate into the system
trust store so that Heimdall Server can make outgoing HTTPS connections
to services signed by that CA (e.g., LDAP, OIDC providers, or API
endpoints behind a corporate proxy).

The certificate file (PEM format) is copied to
/etc/pki/ca-trust/source/anchors/ and update-ca-trust is run to
rebuild the system CA bundle. The NODE_EXTRA_CA_CERTS environment
variable is set in backend.env to point at the consolidated bundle.

After adding the certificate, restart the service for it to take effect.
Requires root privileges.`,
		Example: `  # Add an internal CA certificate
  sudo heimdall-cli add-cert /tmp/corporate-ca.pem

  # Add a certificate and restart in one step
  sudo heimdall-cli add-cert /tmp/my-ca.crt && sudo systemctl restart heimdall-server`,
		Args: cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			initIO(&runner.Out, nil, cmd)
			return runner.Run(args[0])
		},
	}
}
