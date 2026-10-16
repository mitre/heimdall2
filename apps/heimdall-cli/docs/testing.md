# heimdall-cli Testing Guide

Four layers, each with a Makefile target; non-unit layers use build tags.
Run these commands from `apps/heimdall-cli` using Go 1.26.9 and
`GOTOOLCHAIN=local`.

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

## Native CI checks

`Heimdall CLI CI` runs on every pull request and pushes to `master`, with
native Linux jobs named `CLI / amd64` and `CLI / arm64`. It also accepts an
optional reusable-workflow `ref` input for validating an exact release commit;
release validation disables Actions cache reuse. Both jobs use Go 1.26.9 with
`GOTOOLCHAIN=local`, read-only repository permissions, and no publishing secrets.
After the first successful hosted run, maintainers should add these stable check
names to repository rules while preserving existing required checks.

Run the same checks locally from this module directory:

```bash
export GOTOOLCHAIN=local
test "$(go env GOVERSION)" = go1.26.9
test -z "$(gofmt -l .)"
go mod download
go mod verify
go mod tidy -diff
go vet ./...
go test -race -count=1 -coverprofile=coverage.out ./...
go test -count=1 -tags functional ./internal/cmd/
python3 tests/test_release.py
GOBIN="${TMPDIR:-/tmp}/heimdall-cli-tools" go install golang.org/x/vuln/cmd/govulncheck@v1.1.4
"${TMPDIR:-/tmp}/heimdall-cli-tools/govulncheck" ./...
```

Race tests require CGO and a C compiler; do not globally disable CGO for these
checks. CI uploads each architecture's `coverage.out` for seven days. The amd64
job runs the vulnerability gate and fails on reachable vulnerabilities or scanner
errors. Fix findings in the supported toolchain or affected dependencies before
merging; the gate must not be suppressed or converted to a warning.

Run the packaging fixtures from the repository root:

```bash
python3 packaging/rpm/tests/inputs.py
python3 packaging/rpm/tests/cli-acquisition.py
```

Privileged integration and optional VM end-to-end suites remain separate from
native CI. The existing Build RPM workflow supplies installation and disconnected
lifecycle coverage across EL8/EL9/EL10 on x86_64 and aarch64.

## Release archive verification

From the repository root on Linux, build the archive with the packaging commands
in `.github/workflows/heimdall-cli-release.yml`. Use Go 1.26.9 with
`GOTOOLCHAIN=local`; run only `--version`, `--help`, and `setup --help` for the
binary smoke check. No administrative setup is needed. The workflow generates
manuals from the same module and checks exact version/commit/date metadata.

Run this same archive validator locally, replacing the path with the archive
you built or downloaded:

```sh
python3 - /tmp/heimdall-cli_0.9.0_linux_arm64.tar.gz <<'PY'
import sys
import tarfile
from pathlib import PurePosixPath
with tarfile.open(sys.argv[1]) as archive:
    files = {}
    for member in archive.getmembers():
        path = PurePosixPath(member.name)
        assert not path.is_absolute() and ".." not in path.parts, member.name
        assert member.isfile() or member.isdir(), member.name
        if member.isfile():
            files[str(path)] = member
    required = {"heimdall-cli", "LICENSE.md", "README.md", "COMPAT.md",
                "man/man1/heimdall-cli.1", "man/man1/heimdall-cli-setup.1"}
    assert required <= set(files), required - set(files)
    assert all(name in required or name.startswith("man/man1/") for name in files)
    assert files["heimdall-cli"].mode & 0o111
PY
```

From a directory containing downloaded manual-run artifacts, run
`sha256sum --check heimdall-cli_0.9.0_linux_arm64.tar.gz.sha256` for arm64
(and the corresponding amd64 file). The draft contains the combined
`heimdall-cli_0.9.0_SHA256SUMS`; verify it with `sha256sum --check` after downloading
both archives. Confirm a corrupted copy fails checksum verification and a
tarball missing `LICENSE.md` fails the validator. Keep negative fixtures outside
upload directories. Extract a verified archive into an empty directory, inspect
the manuals and docs, and run its binary's `--version` on the matching native
Linux architecture.

Local smoke checks and actionlint do not validate GitHub permissions, native
hosted ARM availability, artifact upload, attestations, or draft behavior. The
[release runbook](../CONTRIBUTING.md#release-process) requires a successful hosted
manual artifact run before release readiness, plus the existing full RPM matrix
before marking a CLI/server pair tested. Attestation/draft behavior remains a
first-release acceptance check.

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

Run a Docker-compatible daemon with permission to start privileged Linux
containers and pull the PostgreSQL and UBI init images. Systemd tests require
privileged containers; merely having a Docker socket is insufficient. The
auto-detected OrbStack socket can support macOS development.

### Linux (CI runners, dev VMs)

GitHub Actions Linux runners ship Docker. Privileged containers (needed for systemd) work natively. The OrbStack auto-detect is skipped (no socket file at the OrbStack path), and standard Docker socket discovery applies.

The daemon must allow privileged containers and have access to the required
images. Integration tests exercise real PostgreSQL and systemd and are separate
from the server RPM installation and disconnected lifecycle matrix.

### Windows

Native Windows is not a supported CLI runtime or integration-test host. Use
a Linux environment for runtime validation.

## Runtime and Optional End-to-End Tests

Linux is the supported runtime, with releases for `linux/amd64` and
`linux/arm64`. macOS can be a development host for builds, unit/functional
tests, and Docker-backed integration tests. Tests that assert OS-specific
behavior should use `runtime.GOOS` checks or build tags.

OrbStack end-to-end tests are optional and require an existing arm64 Linux VM,
working `orb` CLI access, SSH access via `<vm>@orb`, and the VM's administrative
prerequisites. Run
`make test-e2e VM=oracle` with the intended VM name. They are not part of
`make test-all` and do not replace the EL8/9/10 × x86_64/aarch64 RPM matrix.
