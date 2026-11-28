//go:build integration

package cmd

import (
	"context"
	"io"
	"os"
	"testing"
	"time"

	"github.com/moby/moby/api/types/container"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcexec "github.com/testcontainers/testcontainers-go/exec"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

// PostgreSQL container constants. Tests build their own DSN from these.
const (
	pgImage    = "postgres:16-alpine"
	pgDB       = "heimdall_test"
	pgUser     = "heimdall_test"
	pgPassword = "heimdall_test_password"
)

// Init container image constants — Red Hat Universal Base Image with
// systemd as PID 1. UBI is the official RH base; multi-arch (amd64 +
// arm64); reliable mirror infrastructure on registry.access.redhat.com.
//
// UBI's default repos lack postgresql-server (subscription-only), so
// integration tests that need postgres install it via PGDG (see
// integration_postgres_bootstrap_test.go for the install pattern).
//
// Add new constants here when supporting new EL major versions.
// Keep newInitContainer generic — image is a parameter, not per-image
// helper functions.
const (
	ubi8InitImage  = "registry.access.redhat.com/ubi8-init:latest"
	ubi9InitImage  = "registry.access.redhat.com/ubi9-init:latest"
	ubi10InitImage = "registry.access.redhat.com/ubi10-init:latest"
)

// newPGContainer starts a PostgreSQL container and returns the host, the
// mapped port for 5432/tcp, and a cleanup func. Tests construct their own
// DSN using pgUser/pgPassword/pgDB.
//
// Uses the postgres testcontainers module with BasicWaitStrategies, which
// combines log-based and connection-based readiness checks.
func newPGContainer(t *testing.T) (host string, port int, cleanup func()) {
	t.Helper()

	ensureDockerHost(t)
	unsetPGGSSEncMode(t)

	ctx := context.Background()

	ctr, err := postgres.Run(ctx,
		pgImage,
		postgres.WithDatabase(pgDB),
		postgres.WithUsername(pgUser),
		postgres.WithPassword(pgPassword),
		postgres.BasicWaitStrategies(),
	)
	require.NoError(t, err, "postgres.Run must succeed")

	cleanup = func() {
		if err := testcontainers.TerminateContainer(ctr); err != nil {
			t.Logf("warning: failed to terminate postgres container: %s", err)
		}
	}

	host, err = ctr.Host(ctx)
	if err != nil {
		cleanup()
		t.Fatalf("Host() failed: %s", err)
	}

	mappedPort, err := ctr.MappedPort(ctx, "5432/tcp")
	if err != nil {
		cleanup()
		t.Fatalf("MappedPort() failed: %s", err)
	}
	port = int(mappedPort.Num())

	return host, port, cleanup
}

// containerExec runs a command inside a started container and returns its
// combined stdout+stderr, exit code, and any transport error.
type containerExec func(cmd ...string) (stdout string, exitCode int, err error)

// newInitContainer starts a privileged container with systemd as PID 1.
// The image parameter selects the distro/major version (use one of the
// init image constants, e.g. ubi9InitImage). Returns an exec wrapper for
// running commands inside the container plus a cleanup func.
//
// Readiness: waits until `systemctl is-system-running --wait` exits with
// code 0 (running) or 1 (degraded — common in containers, still booted).
func newInitContainer(t *testing.T, image string) (exec containerExec, cleanup func()) {
	t.Helper()

	ensureDockerHost(t)

	ctx := context.Background()

	req := testcontainers.ContainerRequest{
		Image: image,
		Cmd:   []string{"/usr/sbin/init"},
		HostConfigModifier: func(hc *container.HostConfig) {
			hc.Privileged = true
			hc.CgroupnsMode = container.CgroupnsModePrivate
			hc.Tmpfs = map[string]string{
				"/tmp": "",
				"/run": "",
			}
		},
		WaitingFor: wait.ForExec([]string{"systemctl", "is-system-running", "--wait"}).
			WithExitCodeMatcher(func(c int) bool { return c <= 1 }).
			WithStartupTimeout(2 * time.Minute),
	}

	ctr, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	require.NoError(t, err, "GenericContainer must start systemd init container for image %s", image)

	cleanup = func() {
		if err := testcontainers.TerminateContainer(ctr); err != nil {
			t.Logf("warning: failed to terminate init container: %s", err)
		}
	}

	exec = func(cmd ...string) (string, int, error) {
		code, reader, err := ctr.Exec(ctx, cmd, tcexec.Multiplexed())
		if err != nil {
			return "", code, err
		}
		out, err := io.ReadAll(reader)
		if err != nil {
			return string(out), code, err
		}
		return string(out), code, nil
	}

	return exec, cleanup
}

// ensureDockerHost auto-detects OrbStack on macOS when DOCKER_HOST is unset.
// CI and Linux dev environments are unaffected.
func ensureDockerHost(t *testing.T) {
	t.Helper()

	if os.Getenv("DOCKER_HOST") != "" {
		return
	}

	home, err := os.UserHomeDir()
	if err != nil {
		return
	}

	orbSock := home + "/.orbstack/run/docker.sock"
	if _, err := os.Stat(orbSock); err == nil {
		os.Setenv("DOCKER_HOST", "unix://"+orbSock)
		t.Cleanup(func() { os.Unsetenv("DOCKER_HOST") })
	}
}

// unsetPGGSSEncMode removes PGGSSENCMODE for the test process. macOS
// Homebrew sets it for libpq; lib/pq does not recognize it and errors.
// Original value is restored via t.Cleanup.
func unsetPGGSSEncMode(t *testing.T) {
	t.Helper()

	if v, ok := os.LookupEnv("PGGSSENCMODE"); ok {
		os.Unsetenv("PGGSSENCMODE")
		t.Cleanup(func() { os.Setenv("PGGSSENCMODE", v) })
	}
}
