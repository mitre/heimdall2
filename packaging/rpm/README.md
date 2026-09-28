# Heimdall Server RPM Package

RPM packaging for [Heimdall Server](https://github.com/mitre/heimdall2), with
EL8/EL9 build and install checks for x86_64 and aarch64 and separate OL8 lifecycle
fixtures. This branch, `feat/rpm-integrated-install`, produces **2.13.1 development
candidates**, with releases `0.1.integration` and `0.2.integration`. These are not
stable releases or an upgrade path from an installed 2.14.0 system.

## Quick Start

Run build commands from the repository root on an EL build host:

```bash
# Build the current clean, committed integration HEAD.
./packaging/rpm/setup-rpm-build-env.sh --dev --build
```

The default output directory is `~/rpmbuild-heimdall`, outside the checkout.
Builds are unsigned until explicitly signed. CI attaches signed test candidates
and their public key; the ephemeral key is only for disposable acceptance hosts,
not production trust. See [acceptance signing](#acceptance-signing) for local tests.

On a disposable OL8 runtime host, configure NodeSource 22 and the selected
PostgreSQL repository first, as described in [INSTALL.md](INSTALL.md). Import the
public key supplied with the signed candidate, then install and set up explicitly:

```bash
sudo rpm --import ./RPM-TEST-GPG-KEY
sudo dnf install --setopt=localpkg_gpgcheck=1 ./heimdall-server-2.13.1-0.1.integration.el8.x86_64.rpm
sudo heimdall-cli setup --non-interactive --skip-tls
sudo heimdall-cli status
```

Installation does not configure credentials, initialize PostgreSQL, migrate the
database, or start Heimdall. `--skip-tls` is appropriate for an acceptance host or
an existing TLS proxy; configure a trusted HTTPS endpoint for deployment.

## Building the RPM

The wrapper delegates source validation, CLI acquisition, staging and RPM builds
to the Makefile. It no longer downloads a different application snapshot.

```bash
# Install build prerequisites, stage committed HEAD, and build a candidate.
./packaging/rpm/setup-rpm-build-env.sh --dev --build

# Reuse an already provisioned EL build host and an explicit external directory.
./packaging/rpm/setup-rpm-build-env.sh --dev --skip-deps \
  --topdir "$HOME/rpmbuild-heimdall" --build

# Equivalent Make invocation after dependencies are installed.
export PATH="/opt/heimdall-build/go-1.25.8/bin:$PATH"
make -C packaging/rpm rpm DEV=1 TOPDIR="$HOME/rpmbuild-heimdall" \
  HEIMDALL_RELEASE=0.1.integration
```

Use the same `TOPDIR` for `rpm`, `srpm`, `lint-rpm`, checks and artifact inspection.
Binary RPMs are in `RPMS/<arch>/`; source RPMs are in `SRPMS/`. The staged spec
retains the selected release so an independent SRPM rebuild cannot silently
fall back from `0.2.integration` to `0.1.integration`.

### Source and toolchain contract

- `VERSION`, the spec, backend and frontend manifests must agree at `2.13.1`.
- A Git build archives committed HEAD, including packaging and CLI pin files.
  Dirty relevant application, dependency, test or packaging inputs fail before
  staging. Release mode additionally requires HEAD to equal the matching version
  tag; it does not authorize publishing an integration candidate.
- The CLI is a separate repository. `heimdall-cli.repo` records its fetchable
  repository and `heimdall-cli.ref` its immutable full tested commit. These
  committed files are the authority; accepted builds cannot override the pin
  with a mutable branch or environment variable. The current integration work
  targets [seanlongcc/heimdall-cli](https://github.com/seanlongcc/heimdall-cli).
- The CLI binary and generated man pages use that same clean checkout. Generated
  pages are Source22 in the SRPM and do not depend on the original BUILD tree.
- Use Go **1.25.8**, Node **22 >=22.18.0**, and Yarn Classic **1.22.22**.
  `make deps` provisions the build host; preserve the Go path shown above for
  later commands. Frozen dependency installation remains required.
- The package contains a native CLI and native Node addons. Build on the target
  architecture; setting `GOARCH` alone does not cross-build the whole RPM.
- Node.js is an external RPM requirement, not bundled. PostgreSQL server remains
  optional; remote hosts need compatible client tools, not a local server.

### Docker workspace builds

Docker uses an explicit filtered workspace snapshot, so relevant uncommitted
edits can be tested before committing. Local secrets, environment files, caches,
build outputs, Git data and execution scratch are excluded. Git-based accepted
builds still require clean committed inputs.

```bash
docker build --platform linux/arm64 -f packaging/rpm/Dockerfile.ol8 \
  --build-arg HEIMDALL_RELEASE=0.1.integration --target artifacts \
  --output type=local,dest=artifacts/first .
docker build --platform linux/arm64 -f packaging/rpm/Dockerfile.ol8 \
  --build-arg HEIMDALL_RELEASE=0.2.integration --target artifacts \
  --output type=local,dest=artifacts/second .
```

Use `linux/amd64` for x86_64. Native architecture runners are used in CI.
For a corporate TLS proxy, pass your existing CA through
`--secret id=corp_ca,src=/path/to/ca-bundle.crt`; it is not an RPM payload input.
Keep repository TLS and signature verification enabled. Mirror environments must
supply trusted repositories and keys instead of disabling verification.

### Acceptance signing

The test signer generates one ephemeral key, signs the selected candidates, exports
only its public key, and deletes private key material. It runs in a disposable
container and does not use production signing keys:

```bash
bash packaging/rpm/tests/sign-rpms.sh linux/arm64 artifacts/RPM-TEST-GPG-KEY \
  artifacts/first/RPMS/aarch64/heimdall-server-2.13.1-0.1.integration.el8.aarch64.rpm \
  artifacts/second/RPMS/aarch64/heimdall-server-2.13.1-0.2.integration.el8.aarch64.rpm
export RPM_TEST_GPG_KEY="$PWD/artifacts/RPM-TEST-GPG-KEY"
bash packaging/rpm/tests/run-lifecycle.sh linux/arm64 \
  artifacts/first/RPMS/aarch64/heimdall-server-2.13.1-0.1.integration.el8.aarch64.rpm \
  artifacts/second/RPMS/aarch64/heimdall-server-2.13.1-0.2.integration.el8.aarch64.rpm
bash packaging/rpm/tests/remote-database.sh linux/arm64 \
  artifacts/second/RPMS/aarch64/heimdall-server-2.13.1-0.2.integration.el8.aarch64.rpm
```

Set `RPM_TEST_CA=/path/to/ca-bundle.crt` before signing or running fixtures if a
corporate CA is needed. Runners require `RPM_TEST_GPG_KEY` and install/upgrade
with `localpkg_gpgcheck=1`. CI's Rocky job containers call the same signing core
with `HEIMDALL_RPM_TEST=1` and `--container`; no nested Docker engine is required.
Test evidence is written under `packaging/rpm/dist/integration/evidence/` and
uploaded even on lifecycle failure. Each runner cleans up its own containers.

## Installing the RPM

See [INSTALL.md](INSTALL.md) for database prerequisites, remote topology, TLS,
configuration preservation and recovery. The packaged CLI is the primary setup
entry point; the retained shell entry point is `heimdall-server-setup`.

### Setup options

```bash
# Interactive (prompts for all values)
sudo heimdall-cli setup --interactive

# Non-interactive (auto-generate secrets, accept defaults)
sudo heimdall-cli setup --non-interactive

# External database (skip local PostgreSQL bootstrap)
sudo heimdall-cli setup \
  --db-host db.example.com \
  --db-port 5432 \
  --db-user heimdall \
  --db-password "secretpassword" \
  --skip-tls

# Behind a load balancer (skip Caddy TLS proxy)
sudo heimdall-cli setup \
  --external-url https://heimdall.example.com \
  --skip-tls

# Bring your own TLS certificates
sudo heimdall-cli setup \
  --tls-cert /path/to/cert.pem \
  --tls-key /path/to/key.pem

# Re-run configuration only (preserve database)
sudo heimdall-cli setup --reconfigure

# Skip database and TLS (config + service restart only)
sudo heimdall-cli setup --skip-db --skip-tls
```

### Setup steps

The `heimdall-cli setup` command runs 7 steps:

1. **Configuration** — generates `/etc/heimdall-server/backend.env` with DB credentials and secrets
2. **PostgreSQL bootstrap** — init, start, create role (skipped for remote DB or `--skip-db`)
3. **Connection test** — verifies database is reachable
4. **Database migrations** — create schema, run Sequelize migrations and seeds
5. **TLS reverse proxy** — configures Caddy on port 443 (skipped with `--skip-tls`)
6. **Security policies** — SELinux port registration, fapolicyd trust, firewalld rules
7. **Enable and restart service** — enables `heimdall-server`, restarts it even if already running, and verifies it is active

## Managing the Service

```bash
# Status (service, database, SELinux, config overview)
sudo heimdall-cli status

# Validate configuration (checks required env vars, DB connectivity)
sudo heimdall-cli validate

# Start / stop / restart
sudo heimdall-cli start
sudo heimdall-cli stop
sudo heimdall-cli restart

# View logs
sudo heimdall-cli logs
sudo heimdall-cli logs --lines 100

# Full diagnostic dump
sudo heimdall-cli diag

# Backup database and config
sudo heimdall-cli backup -o /var/lib/heimdall-server/backups

# Restore from backup
sudo heimdall-cli restore /path/to/backup.tar.gz

# Reset a user's password
sudo heimdall-cli reset-password admin@example.com

# View/modify configuration
sudo heimdall-cli config list
sudo heimdall-cli config get DATABASE_HOST
sudo heimdall-cli config set PORT 8080

# Change the listen port (updates config, SELinux, firewalld)
sudo heimdall-cli set-port 8443

# Add an organizational CA certificate to the system trust store
sudo heimdall-cli add-cert /path/to/internal-ca.pem
```

## Upgrading

This candidate supports testing `0.1.integration` → `0.2.integration` at version
2.13.1. Do not install it over 2.14.0; newer application reconciliation and real
2.14.0 migration testing are separate work.

Set `RESTART_ON_UPGRADE=false` in `/etc/sysconfig/heimdall-server` **before** the
upgrade and leave it false until migrations and checks finish. The shipped
default is true, so this step is necessary to control restart timing.

```bash
sudo heimdall-cli backup
sudo dnf upgrade --setopt=localpkg_gpgcheck=1 ./heimdall-server-2.13.1-0.2.integration.el8.x86_64.rpm
sudo heimdall-cli setup --non-interactive --skip-tls
sudo heimdall-cli status
```

The RPM also attempts a pre-upgrade backup, but backup failure does not stop the
RPM transaction. Verify your explicit backup before upgrading. Normal setup runs
migrations and restarts the service; `--reconfigure` changes configuration only.
Both configuration paths preserve existing secrets and additional settings.
`backend.env` and sysconfig use `%config(noreplace)`; review `.rpmnew` files.

## Customizing Paths

The CLI accepts path overrides, while the packaged systemd unit and RPM-owned
files use the FHS paths below. Relocating a running service also requires matching
systemd overrides; changing CLI paths alone does not relocate the installation.

**Via `/etc/sysconfig/heimdall-server`** (persists across reboots and upgrades):

```bash
HEIMDALL_APP_DIR=/opt/heimdall
HEIMDALL_DATA_DIR=/opt/heimdall/data
HEIMDALL_CONFIG_DIR=/opt/heimdall/config
HEIMDALL_LIBEXEC_DIR=/opt/heimdall/libexec
HEIMDALL_LOG_DIR=/opt/heimdall/logs
HEIMDALL_CERT_DIR=/opt/heimdall/certs
HEIMDALL_ENV_FILE=/opt/heimdall/config/backend.env
```

**Via environment variables** (same names as above, with `HEIMDALL_` prefix).

**Via CLI flags** (one-time override):

```bash
heimdall-cli status --app-dir=/opt/heimdall --data-dir=/opt/heimdall/data
```

**Priority**: CLI flag > environment variable > config file > compile-time default.

### Default paths

| Path | Purpose |
|------|---------|
| `/usr/share/heimdall-server/` | Application files (Node.js app) |
| `/etc/heimdall-server/backend.env` | Application configuration (secrets, DB) |
| `/etc/sysconfig/heimdall-server` | Service configuration (paths, restart behavior) |
| `/usr/bin/heimdall-cli` | Admin CLI tool (Go static binary) |
| `/usr/bin/heimdall-server` | Service entrypoint script |
| `/usr/lib/systemd/system/heimdall-server.service` | systemd unit |
| `/usr/libexec/heimdall-server/` | Helper scripts (configure, postgres-setup, fapolicyd, Caddyfile) |
| `/usr/share/selinux/packages/heimdall-server.pp` | SELinux policy module |
| `/usr/lib/firewalld/services/heimdall-server.xml` | firewalld service definition |
| `/var/lib/heimdall-server/` | Variable data (backups) |
| `/var/lib/heimdall-server/backups/` | Backup archives |
| `/var/log/heimdall-server/` | Log files |
| `/etc/pki/heimdall-server/` | TLS certificates |

## Security

### SELinux

The RPM ships a custom SELinux policy module (`heimdall_server_t`) that:
- Confines the Node.js process to a dedicated domain
- Registers port 3000 as `heimdall_server_port_t`
- Sets file contexts for all application directories

The policy is loaded automatically on install and removed on uninstall.

### fapolicyd

On systems with fapolicyd enabled, the RPM registers its native CLI and bundled
native addons in the trust database. Node.js is supplied by the external Node RPM.
Full removal drops package trust entries before the packaged CLI is removed.

### firewalld

The RPM ships a firewalld service definition. The setup command opens HTTPS (443) when using Caddy, or port 3000 when using `--skip-tls`.

### systemd hardening

The unit requests the following systemd sandboxing:
- `ProtectSystem=strict` with explicit `ReadWritePaths`
- `NoNewPrivileges`, `PrivateTmp`, `PrivateDevices`
- `ProtectHome`, `ProtectKernelTunables`, `ProtectKernelModules`
- `ProtectClock`, `ProtectHostname`, `ProtectKernelLogs`
- `RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6`
- `SystemCallArchitectures=native`
- `CapabilityBoundingSet=` (empty — no capabilities)

EL8 systemd 239 ignores `ProtectClock`, `ProtectHostname`, `ProtectKernelLogs`
and `ProtectProc`. CI reports these exact unsupported-directive warnings and
fails on other diagnostics or a nonzero verification result. EL9 must verify
without diagnostics. These checks do not establish enforcing-SELinux or fapolicyd
certification.

### Configuration file permissions

- `/etc/heimdall-server/backend.env` — `root:heimdall 0640` (`%config(noreplace)`)
- `/etc/sysconfig/heimdall-server` — `root:root 0640` (`%config(noreplace)`)

## PostgreSQL compatibility

The setup scripts auto-detect PGDG installations of PostgreSQL 13 through 18, as well as system-packaged PostgreSQL. For remote databases, the local PostgreSQL package is optional (`Recommends:`, not `Requires:`).

## Source files

| File | Spec Source | Purpose |
|------|------------|---------|
| `heimdall-server.spec` | — | RPM spec file |
| `heimdall-server.service` | Source1 | systemd unit |
| `heimdall-backend.env` | Source2 | Environment template |
| `heimdall-server.sh` | Source3 | Service entrypoint |
| `heimdall-db-setup.sh` | Source4 | Database migration script |
| `heimdall-configure.sh` | Source5 | Config generator |
| `heimdall-postgres-setup.sh` | Source6 | PostgreSQL bootstrap |
| `heimdall-setup.sh` | Source7 | Retained shell setup entry point |
| `heimdall-server-tmpfiles.conf` | Source8 | tmpfiles.d for `/run` |
| `selinux/heimdall_server.te` | Source9 | SELinux type enforcement |
| `selinux/heimdall_server.fc` | Source10 | SELinux file contexts |
| `selinux/heimdall_server.if` | Source11 | SELinux interface |
| `firewalld/heimdall-server.xml` | Source13 | firewalld service |
| `heimdall-server.repo` | Source14 | COPR repo file |
| `heimdall-cli` (built) | Source15 | Go admin CLI binary |
| `heimdall-Caddyfile` | Source16 | Caddy reverse proxy template |
| `heimdall-sysconfig` | Source17 | Service path overrides |
| `heimdall-rsyslog.conf` | Source18 | rsyslog routing to log files |
| `heimdall-logrotate.conf` | Source19 | Log rotation (90-day FedRAMP) |
| `security/40-heimdall.rules` | Source20 | auditd rules (sample) |
| `security/SECURITY.md` | Source21 | Security documentation |
| Generated CLI man archive | Source22 | Man pages from the pinned CLI checkout |
| `heimdall-cli.repo`, `heimdall-cli.ref` | In Source0 | CLI repository and immutable commit |
| `setup-rpm-build-env.sh` | — | Make-based build environment wrapper |

## Acceptance status

Acceptance passed on September 28, 2026, for source
`c540d7ac89f0b2fed16622d6af33a5d5177afffe`, version `2.13.1`, releases
`0.1.integration` and `0.2.integration`. See the
[acceptance report](../../docs/superpowers/reports/2026-09-28-rpm-integration-acceptance.md)
for artifact hashes, environments, preserved-state assertions and evidence.

| Check | Result |
|---|---|
| Source/version fixtures | 12 passed locally and on OL8 Python 3.6.8 |
| Configuration, CLI acquisition, bootstrap, signing and host-wrapper fixtures | Passed, including Bash 3.2 and signature rejection/cleanup cases |
| Application baseline | Backend 437/437, frontend 66/66; both production builds passed with Node 22.18.0 and Yarn 1.22.22 |
| CLI pin, unit/man tests | `eb386bfedd56beb40462dbfb405afa3efd08f5e7`; full unit suite, build and deterministic man-page generation passed with Go 1.25.8; fresh fetch and OL8 staging verified |
| Integrated binary payload | Both candidate releases passed on OL8 aarch64 and x86_64 |
| Fresh SRPM rebuild | Passed on OL8 aarch64 with the original BUILD tree removed; payload, Source22 man pages and scriptlets verified |
| OL8 install/setup/login/rerun/upgrade/reboot/removal | Passed on native aarch64 and x86_64 CI; also passed locally on ARM64 |
| Remote PostgreSQL, trusted Caddy HTTPS and database recovery | Passed on both OL8 architectures; also passed locally on ARM64 |
| CI EL8/EL9 build/install matrix | All eight jobs passed in [run 36477971745](https://github.com/mitre/heimdall2/actions/runs/36477971745); both native OL8 lifecycle jobs passed; publication skipped |

The OL8 lifecycle gate builds its own candidates; it does not certify the Rocky
matrix artifacts for OL8 runtime operation. Emulated local results must be
identified separately from native CI results. Container tests do not prove EL9
runtime or enforcing-SELinux behavior. No stable publication is authorized by
these checks: the publishing job rejects any binary or source RPM whose release
contains `integration` before attestation or release upload. Provenance
attestations are not RPM signatures. A later stable milestone must replace test
signing and parameterize lifecycle versions/releases from verified release
metadata before publication can be enabled.
