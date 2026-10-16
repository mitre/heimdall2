# heimdall-cli Testing Guide

Three layers, each with a build tag and a Makefile target.

| Layer | Tag | Target | What it covers | Speed |
|---|---|---|---|---|
| Unit | (none) | `make test` | Logic, branching, error paths via fakes | ms |
| Functional | `functional` | `make test-functional` | Built binary's CLI surface (`--help`, flags, exit codes) | seconds |
| Integration | `integration` | `make test-integration` | Real PostgreSQL + real systemd via containers | ~3-30 sec |
| End-to-end | `e2e` | `make test-e2e VM=oracle` | Cross-compiled binary on a real OrbStack VM | minutes |

## Running

```bash
make test               # default, no external deps
make test-functional    # builds the binary, exercises CLI
make test-integration   # spins up Docker containers (testcontainers-go)
make test-e2e VM=oracle # SSH to OrbStack VM, run binary there
make test-all           # test + test-functional
```

## Integration Tests — Container Helpers

The integration layer (`//go:build integration`) provides two reusable container helpers in `internal/cmd/integration_helper_test.go`:

### `newPGContainer(t)`

Starts a PostgreSQL 16 container (postgres:16-alpine). Returns the host, mapped port, and a cleanup function. The test constructs its own DSN using the package-private credential constants (`pgUser`, `pgPassword`, `pgDB`).

```go
host, port, cleanup := newPGContainer(t)
defer cleanup()

dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
    host, port, pgUser, pgPassword, pgDB)
db, err := sql.Open("postgres", dsn)
```

Use this for tests that exercise database state (stepConfigure, reset-password, backup/restore, postgres-setup port).

### `newInitContainer(t, image)`

Starts a privileged container running systemd as PID 1. The image parameter selects the distro/version. Returns an `exec` function for running commands inside the container and a cleanup function.

```go
exec, cleanup := newInitContainer(t, ubi9InitImage)
defer cleanup()

stdout, code, err := exec("systemctl", "is-active", "polkit.service")
```

Use this for tests that need a real systemd (postgres-setup port verification, service unit testing, RPM scriptlet behavior).

### Image constants

Defined in `integration_helper_test.go`:

```go
const (
    ubi8InitImage  = "registry.access.redhat.com/ubi8-init:latest"  // EL8 family
    ubi9InitImage  = "registry.access.redhat.com/ubi9-init:latest"  // EL9 family
    ubi10InitImage = "registry.access.redhat.com/ubi10-init:latest" // EL10 family
)
```

Add new constants alongside these when supporting new distros (Rocky, Alma, Oracle Linux, Ubuntu, Debian, Alpine). Keep the helper signature `newInitContainer(t, image)` — generic, reusable, no per-image helpers.

For RPM-test scenarios that span EL versions, prefer table-driven tests:

```go
func TestSomething_AcrossEL(t *testing.T) {
    for _, image := range []string{ubi8InitImage, ubi9InitImage} {
        t.Run(image, func(t *testing.T) {
            exec, cleanup := newInitContainer(t, image)
            defer cleanup()
            // ... assertions ...
        })
    }
}
```

## Environment Requirements

### macOS (developer laptops)

Integration tests need a Docker-compatible socket. The helper auto-detects [OrbStack](https://orbstack.dev/) at `~/.orbstack/run/docker.sock` if `DOCKER_HOST` is unset.

`PGGSSENCMODE` (set by Homebrew for `libpq`) is unset for the test process — `lib/pq` does not recognize it. Original value is restored after the test via `t.Cleanup`.

No manual env vars required: `make test-integration` works out of the box on a Mac with OrbStack installed.

### Linux (CI runners, dev VMs)

GitHub Actions Linux runners ship Docker. Privileged containers (needed for systemd) work natively. The OrbStack auto-detect is skipped (no socket file at the OrbStack path), and standard Docker socket discovery applies.

For local testing on the OrbStack VMs (centos-arm64-9, oracle-9-x86) prefer running tests on the VM since podman is native there — the `/Users/alippold/...` shared mount makes the source tree available without copy.

### Windows

Integration tests are not supported on native Windows — use WSL2 with Docker Desktop, or skip and rely on CI for integration coverage.

## Cross-Platform CLI Considerations

The integration test layer runs on Linux (CI) and macOS (dev). The CLI itself targets Linux + macOS + Windows via build tags — see epic `saf-packaging-alk` for the platform-portability epic. Tests that assert OS-specific behavior should use `runtime.GOOS` checks or build tags to scope correctly.
