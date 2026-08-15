# Heimdall Server RPM Package

RPM packaging for [Heimdall Server](https://github.com/mitre/heimdall2) on RHEL, Oracle Linux, Rocky Linux, and AlmaLinux (EL8 and EL9).

## Quick Start

```bash
# 1. Build the RPM (installs all build deps, fetches source, runs rpmbuild)
./setup-rpm-build-env.sh --build

# 2. Install
sudo dnf install -y ~/rpmbuild/RPMS/$(uname -m)/heimdall-server-*.rpm

# 3. Run post-install setup
sudo heimdall-cli setup

# 4. Verify
sudo heimdall-cli status
```

## Building the RPM

### Option A: Automated (recommended)

The `setup-rpm-build-env.sh` script handles everything — repos, build deps, source download, and rpmbuild:

```bash
# Full automated build
./setup-rpm-build-env.sh --build

# Specify a version
./setup-rpm-build-env.sh --version 2.13.1 --build

# Skip dependency installation (already set up)
./setup-rpm-build-env.sh --skip-deps --build

# Air-gapped / mirror environments
./setup-rpm-build-env.sh --no-gpg-check --build
```

### Option B: Manual step-by-step

#### 1. Install build dependencies

**EL9 (Oracle Linux, RHEL, Rocky, Alma):**

```bash
# Enable EPEL (provides yarnpkg)
sudo dnf install -y epel-release

# Enable CodeReady Builder / CRB (provides selinux-policy-devel)
sudo dnf config-manager --set-enabled crb  # RHEL/Rocky/Alma
# or: sudo dnf config-manager --set-enabled ol9_codeready_builder  # Oracle Linux

# Install Node.js 22 from NodeSource
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -

# Install build tools
sudo dnf install -y \
  gcc-c++ make git rpm-build rpmdevtools rpmlint \
  selinux-policy-devel systemd-rpm-macros \
  python3 curl openssl tar util-linux \
  nodejs yarnpkg

# Install Go (for building heimdall-cli)
GO_VERSION=1.24.4
curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" \
  | sudo tar -C /usr/local -xzf -
echo 'export PATH=$PATH:/usr/local/go/bin' | sudo tee /etc/profile.d/golang.sh
export PATH=$PATH:/usr/local/go/bin
```

**EL8 (Oracle Linux, RHEL, Rocky, Alma):**

```bash
# Enable EPEL
sudo dnf install -y epel-release

# Enable PowerTools / CRB
sudo dnf config-manager --set-enabled powertools  # CentOS/Rocky/Alma
# or: sudo dnf config-manager --set-enabled ol8_codeready_builder  # Oracle Linux

# Install Node.js 22 from NodeSource
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -

# Install build tools (same as EL9)
sudo dnf install -y \
  gcc-c++ make git rpm-build rpmdevtools rpmlint \
  selinux-policy-devel systemd-rpm-macros \
  python3 curl openssl tar util-linux \
  nodejs yarnpkg

# Install Go (same as EL9)
GO_VERSION=1.24.4
curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" \
  | sudo tar -C /usr/local -xzf -
echo 'export PATH=$PATH:/usr/local/go/bin' | sudo tee /etc/profile.d/golang.sh
export PATH=$PATH:/usr/local/go/bin
```

#### 2. Build

```bash
cd heimdall-server

# Build just the Go CLI binary
make heimdall-cli GOARCH=amd64

# Build the full RPM (downloads upstream source, builds CLI, runs rpmbuild)
make rpm GOARCH=amd64

# Build source RPM only
make srpm GOARCH=amd64

# Lint the spec file
make lint
```

The RPM appears at `rpmbuild/RPMS/x86_64/heimdall-server-*.rpm`.

### Build environment notes

- **EPEL is required** for `yarnpkg`. The spec uses `BuildRequires: /usr/bin/yarn` which is satisfied by EPEL's `yarnpkg` package.
- **NodeSource is required** for Node.js >= 22. The distro-provided Node.js (16-20) is too old.
- **Go is required** to compile `heimdall-cli`. The Go binary is bundled into the RPM as a static binary — Go is NOT needed on the target install host.
- **Cross-compilation**: Set `GOARCH=amd64` or `GOARCH=arm64` to build the CLI for a different architecture. The Node.js app is architecture-independent.

## Installing the RPM

```bash
# Install (creates heimdall user, installs files, prints setup instructions)
sudo dnf install -y ./heimdall-server-2.13.1-1.el9.x86_64.rpm

# Run post-install setup
sudo heimdall-cli setup
```

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

# Skip database and TLS (config + service start only)
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
7. **Start service** — `systemctl enable --now heimdall-server`

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
sudo heimdall-cli reset-password --email admin@example.com

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

```bash
# Upgrade the package (pre-upgrade backup runs automatically)
sudo dnf upgrade -y ./heimdall-server-2.12.7-1.el9.x86_64.rpm

# Run database migrations
sudo heimdall-cli setup --skip-tls

# Verify
sudo heimdall-cli status
```

The RPM's `%pre` scriptlet automatically attempts a backup before upgrade. Backups are saved to `/var/lib/heimdall-server/backups/`.

To control whether the service restarts automatically on upgrade, edit `/etc/sysconfig/heimdall-server`:

```bash
RESTART_ON_UPGRADE=false  # default: true
```

## Customizing Paths

All paths follow FHS defaults and can be overridden without rebuilding the RPM.

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

On systems with fapolicyd enabled, the RPM registers bundled Node.js binaries in the trust database so they can execute under fapolicyd enforcement.

### firewalld

The RPM ships a firewalld service definition. The setup command opens HTTPS (443) when using Caddy, or port 3000 when using `--skip-tls`.

### systemd hardening

The service runs with comprehensive systemd sandboxing:
- `ProtectSystem=strict` with explicit `ReadWritePaths`
- `NoNewPrivileges`, `PrivateTmp`, `PrivateDevices`
- `ProtectHome`, `ProtectKernelTunables`, `ProtectKernelModules`
- `ProtectClock`, `ProtectHostname`, `ProtectKernelLogs`
- `RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6`
- `SystemCallArchitectures=native`
- `CapabilityBoundingSet=` (empty — no capabilities)

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
| `heimdall-setup.sh` | Source7 | Legacy setup script (called by CLI) |
| `heimdall-server-tmpfiles.conf` | Source8 | tmpfiles.d for `/run` |
| `selinux/heimdall_server.te` | Source9 | SELinux type enforcement |
| `selinux/heimdall_server.fc` | Source10 | SELinux file contexts |
| `selinux/heimdall_server.if` | Source11 | SELinux interface |
| `fapolicyd/heimdall-fapolicyd-trust.sh` | Source12 | fapolicyd trust script |
| `firewalld/heimdall-server.xml` | Source13 | firewalld service |
| `heimdall-server.repo` | Source14 | COPR repo file |
| `heimdall-cli` (built) | Source15 | Go admin CLI binary |
| `heimdall-Caddyfile` | Source16 | Caddy reverse proxy template |
| `heimdall-sysconfig` | Source17 | Service path overrides |
| `heimdall-rsyslog.conf` | Source18 | rsyslog routing to log files |
| `heimdall-logrotate.conf` | Source19 | Log rotation (90-day FedRAMP) |
| `security/40-heimdall.rules` | Source20 | auditd rules (sample) |
| `security/SECURITY.md` | Source21 | Security documentation |
| `setup-rpm-build-env.sh` | — | Build environment setup |
