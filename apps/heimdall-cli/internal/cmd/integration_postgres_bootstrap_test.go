//go:build integration

package cmd

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/moby/moby/api/types/container"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcexec "github.com/testcontainers/testcontainers-go/exec"
	"github.com/testcontainers/testcontainers-go/wait"
)

const (
	integPGUser = "heimdall"
	integPGPass = "integ-test-pass-12345"
	integPGDB   = "heimdall-server-production"
)

// TestPostgresBootstrap_FullFlow_RealRHEL is the end-to-end integration
// test for the heimdall-postgres-setup.sh Go port. It cross-compiles the
// heimdall-cli binary, copies it into a UBI8/9-init container with
// postgresql-server installed, runs the binary's setup (which invokes
// PostgresBootstrapRunner natively), and asserts the database end-state
// matches what the bash script would have produced:
//
//   - application role exists with a SCRAM-SHA-256 password
//   - application database exists
//   - password login over the scram-sha-256 pg_hba rule actually works
//   - pg_hba.conf carries the Heimdall marker block
//
// Setup eventually fails at later steps (migrations need Node.js,
// security policies need fapolicyd, service start needs the unit file).
// We tolerate non-zero exit and verify state via psql exec — that is
// what proves the bootstrap step did its job.
func TestPostgresBootstrap_FullFlow_RealRHEL(t *testing.T) {
	// AlmaLinux: ships systemd in the base image AND has postgresql-server
	// in default repos (UBI lacks the latter, Rocky's base lacks the
	// former). Multi-arch covers amd64 (CI) and arm64 (Apple Silicon dev).
	// UBI9-init has systemd; postgresql-server installed via PGDG repo
	// (UBI's default repos lack it). PGDG is what enterprises ship in
	// production, so this also exercises the PGDG-preferred detection
	// branch in PostgresBootstrapRunner.detectPG.
	//
	// EL8 not currently in the matrix: PGDG stopped shipping aarch64 for
	// EL8, so UBI8-init + PGDG only works on amd64. Add an amd64-only
	// EL8 case once we have CI matrix support.
	cases := []struct {
		name  string
		image string
	}{
		{"UBI9", ubi9InitImage},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			ensureDockerHost(t)
			ctx := context.Background()

			binPath := buildLinuxHeimdallCLI(t)

			ctr := startSystemdContainer(t, ctx, tc.image)
			t.Cleanup(func() {
				if err := testcontainers.TerminateContainer(ctr); err != nil {
					t.Logf("terminate container: %s", err)
				}
			})

			execCtr := containerExecFor(ctx, ctr)

			installPostgresViaPGDG(t, execCtr)

			require.NoError(t,
				ctr.CopyFileToContainer(ctx, binPath, "/usr/local/bin/heimdall-cli", 0o755),
				"copy heimdall-cli into container")

			// setup expects /etc/heimdall-server to exist (the RPM creates
			// it; we don't have the RPM here, just the binary).
			out, code, err := execCtr("mkdir", "-p", "/etc/heimdall-server")
			require.NoError(t, err)
			require.Equal(t, 0, code, "mkdir /etc/heimdall-server: %s", out)

			// Run setup. Bootstrap (step 2) must succeed; later steps
			// (migrations, security policies, service start) will fail in
			// this minimal container — we tolerate the non-zero exit and
			// verify state via psql afterward.
			out, _, err = execCtr("heimdall-cli", "setup",
				"--non-interactive",
				"--skip-tls",
				"--db-host", "127.0.0.1",
				"--db-user", integPGUser,
				"--db-password", integPGPass,
			)
			require.NoError(t, err, "exec heimdall-cli setup: %s", out)
			t.Logf("setup output:\n%s", out)

			// Bootstrap must have produced a completion line in stdout.
			require.Contains(t, out, "PostgreSQL bootstrap complete",
				"bootstrap step must have run to completion")

			// --- Assert end-state via psql ---

			// Role password must be SCRAM-SHA-256.
			rolPass := psqlAsPostgres(t, execCtr,
				"SELECT rolpassword FROM pg_authid WHERE rolname='"+integPGUser+"'")
			require.True(t,
				strings.HasPrefix(strings.TrimSpace(rolPass), "SCRAM-SHA-256"),
				"role password must be SCRAM-SHA-256, got %q", rolPass)

			// Database must exist.
			exists := psqlAsPostgres(t, execCtr,
				"SELECT 1 FROM pg_database WHERE datname='"+integPGDB+"'")
			require.Equal(t, "1", strings.TrimSpace(exists),
				"database %q must exist", integPGDB)

			// Password login via the scram pg_hba rule must work.
			loginOut, code, err := execCtr("/bin/sh", "-c", fmt.Sprintf(
				"PGPASSWORD=%s psql 'postgresql://%s@127.0.0.1:5432/%s' -c 'SELECT 1' -tA",
				integPGPass, integPGUser, integPGDB,
			))
			require.NoError(t, err)
			require.Equal(t, 0, code, "password login failed: %s", loginOut)
			require.Contains(t, loginOut, "1",
				"SELECT 1 over password login must return 1")

			// pg_hba.conf must carry the Heimdall marker block. PGDG
			// installs under /var/lib/pgsql/<major>/data — the binary
			// logged which version it detected; we probe both plausible
			// paths for robustness across EL versions.
			hba, _, _ := execCtr("/bin/sh", "-c",
				"cat /var/lib/pgsql/*/data/pg_hba.conf 2>/dev/null || cat /var/lib/pgsql/data/pg_hba.conf")
			require.Contains(t, hba, "# Heimdall",
				"pg_hba.conf must contain the Heimdall marker after bootstrap")
			require.Contains(t, hba, "scram-sha-256",
				"pg_hba.conf must contain a scram-sha-256 rule")
		})
	}
}

// buildLinuxHeimdallCLI cross-compiles heimdall-cli for linux/<host-arch>
// (matches the container's arch on Apple Silicon + Linux CI). Returns the
// binary path under t.TempDir().
func buildLinuxHeimdallCLI(t *testing.T) string {
	t.Helper()

	// internal/cmd → repo's heimdall-cli root is two levels up.
	repoRoot, err := filepath.Abs("../..")
	require.NoError(t, err)

	binPath := filepath.Join(t.TempDir(), "heimdall-cli")

	cmd := exec.Command("go", "build", "-o", binPath, "./cmd/heimdall-cli")
	cmd.Dir = repoRoot
	cmd.Env = append(os.Environ(),
		"GOOS=linux",
		"GOARCH="+runtime.GOARCH,
		"CGO_ENABLED=0",
	)

	out, err := cmd.CombinedOutput()
	require.NoError(t, err, "cross-compile heimdall-cli for linux/%s failed: %s",
		runtime.GOARCH, out)

	return binPath
}

// startSystemdContainer starts a privileged init container with systemd
// as PID 1 and returns the container reference. Caller is responsible
// for terminating it.
func startSystemdContainer(t *testing.T, ctx context.Context, image string) testcontainers.Container {
	t.Helper()

	req := testcontainers.ContainerRequest{
		Image: image,
		Cmd:   []string{"/usr/sbin/init"},
		HostConfigModifier: func(hc *container.HostConfig) {
			hc.Privileged = true
			hc.CgroupnsMode = container.CgroupnsModePrivate
			hc.Tmpfs = map[string]string{"/tmp": "", "/run": ""}
		},
		WaitingFor: wait.ForExec([]string{"systemctl", "is-system-running", "--wait"}).
			WithExitCodeMatcher(func(c int) bool { return c <= 1 }).
			WithStartupTimeout(2 * time.Minute),
	}

	ctr, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	require.NoError(t, err, "start systemd container for %s", image)

	return ctr
}

// containerExecFor returns a containerExec wrapper bound to ctr+ctx.
func containerExecFor(ctx context.Context, ctr testcontainers.Container) containerExec {
	return func(cmd ...string) (string, int, error) {
		code, reader, err := ctr.Exec(ctx, cmd, tcexec.Multiplexed())
		if err != nil {
			return "", code, err
		}
		var buf bytes.Buffer
		_, _ = io.Copy(&buf, reader)
		return buf.String(), code, nil
	}
}

// installPostgresViaPGDG installs PostgreSQL 16 inside a UBI container
// using the official PGDG repository. UBI's default repos do not include
// postgresql-server (subscription-only). PGDG is also what enterprises
// deploy in production, so this exercises our PGDG-preferred detection
// branch in PostgresBootstrapRunner.detectPG.
//
// SSL verify is disabled for downloads. Rationale: this is an ephemeral
// test container; some Docker hosts (notably OrbStack's NAT) intercept
// HTTPS in ways that break the container's CA bundle for third-party
// CDNs. We are not testing TLS here — we are testing PG bootstrap.
func installPostgresViaPGDG(t *testing.T, execCtr containerExec) {
	t.Helper()

	// Disable SSL verify globally for dnf in this ephemeral test container.
	// See function doc for rationale.
	out, code, err := execCtr("/bin/sh", "-c",
		"echo 'sslverify=false' >> /etc/dnf/dnf.conf")
	require.NoError(t, err)
	require.Equal(t, 0, code, "set dnf sslverify failed: %s", out)

	arch := pgdgArchForGOARCH()
	repoURL := "https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-" +
		arch + "/pgdg-redhat-repo-latest.noarch.rpm"

	out, code, err = execCtr("dnf", "install", "-y", repoURL)
	require.NoError(t, err)
	require.Equal(t, 0, code, "install pgdg-redhat-repo exited %d: %s", code, out)

	// Best-effort: disable the stub postgresql module if present so dnf
	// prefers PGDG packages. UBI's AppStream lacks this module, so a
	// failure here is fine — PGDG packages are namespaced (postgresql16-*)
	// and won't conflict regardless.
	_, _, _ = execCtr("dnf", "-qy", "module", "disable", "postgresql")

	out, code, err = execCtr("dnf", "install", "-y",
		"postgresql16-server", "postgresql16")
	require.NoError(t, err)
	require.Equal(t, 0, code, "install postgresql16-server exited %d: %s", code, out)
}

// pgdgArchForGOARCH maps Go's runtime arch to PGDG's repo arch path.
func pgdgArchForGOARCH() string {
	switch runtime.GOARCH {
	case "amd64":
		return "x86_64"
	case "arm64":
		return "aarch64"
	default:
		return runtime.GOARCH
	}
}

// psqlAsPostgres runs a single -tA psql query inside the container as
// the postgres OS user and returns trimmed stdout. Fails the test on
// any error or non-zero exit.
func psqlAsPostgres(t *testing.T, execCtr containerExec, query string) string {
	t.Helper()
	stdout, code, err := execCtr("runuser", "-u", "postgres", "--",
		"psql", "-tA", "-d", "postgres", "-c", query)
	require.NoError(t, err, "psql exec error")
	require.Equal(t, 0, code, "psql query %q exited %d: %s", query, code, stdout)
	return stdout
}
