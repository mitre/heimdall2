# Heimdall Server — RPM Installation Guide

This guide covers the **2.13.1 integration candidate** on
`feat/rpm-integrated-install`, not a stable release. Do not install it over
2.14.0. See [README.md acceptance status](README.md#acceptance-status) for
completed checks, tested source and acceptance limits.

## Build and Install Matrix

| OS | Architectures |
|---|---|
| RHEL 8 / Oracle Linux 8 / Rocky 8 / Alma 8 | x86_64, aarch64 |
| RHEL 9 / Oracle Linux 9 / Rocky 9 / Alma 9 | x86_64, aarch64 |

## Prerequisites

- Root or sudo access
- PostgreSQL 13+ (local or remote)
- Node.js 22, version >=22.18.0, from a configured repository (not bundled)
- A booted systemd host for normal setup and service operations
- 2 GB RAM minimum (4 GB recommended)
- 1 GB free disk space

### Node.js Repository

Configure NodeSource on the runtime host before installing the RPM. The builder's
repository configuration is not inherited by another host or clean container.

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
```

DNF then installs the Node.js RPM required by Heimdall. Keep TLS and repository
signature verification enabled. For mirrored or inspected networks, configure
trusted mirrors, RPM keys and your organization's CA instead of bypassing checks.

### PostgreSQL Setup (if not already installed)

The RPM recommends PostgreSQL but does not hard-require it, so you can
bring your own (local or remote). For a local install using PGDG packages:

**EL8:**
```bash
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo dnf -qy module disable postgresql
sudo dnf install -y postgresql18-server postgresql18
```

**EL9:**
```bash
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo dnf install -y postgresql18-server postgresql18
```

For aarch64, replace `x86_64` with `aarch64` in the repo URL.

The setup scripts detect PGDG versions 13–18. The required local acceptance
fixture uses PostgreSQL 18; this is not evidence for every version combination.
For a remote deployment, install the selected compatible client package (for
example `postgresql18`) without `postgresql18-server`. The CLI uses `psql` and
`pg_dump` for connection checks, backup and recovery.

## Install

Integration candidates are built locally or downloaded from the integration CI
artifacts. They are not published as stable GitHub releases. Select the exact
version, distribution and architecture; do not use a wildcard that can select
multiple candidate versions.

In a disposable acceptance host, verify the test public key came from the same
trusted CI run or local signing invocation as the RPM, then install:

```bash
sudo rpm --import ./RPM-TEST-GPG-KEY
sudo dnf install --setopt=localpkg_gpgcheck=1 ./heimdall-server-2.13.1-0.1.integration.el8.x86_64.rpm
```

The key is ephemeral acceptance-test material, not a production release key.
Do not disable signature checks for unsigned local builds; see
[acceptance signing](README.md#acceptance-signing).

The transaction creates the service account and installs files. It does not
initialize a database, generate credentials, run migrations or start Heimdall.
For remote deployments, use `--setopt=install_weak_deps=False` to avoid optional
server recommendations and install the required client tools separately.

### Building from Source RPM

A candidate SRPM includes the application archive, packaging inputs, the pinned
CLI binary and its generated man pages. Rebuild on the same architecture as the
candidate CLI binary. Install the full build prerequisites first:

```bash
sudo bash packaging/rpm/scripts/setup-build-deps.sh --skip-update
export PATH="/opt/heimdall-build/go-1.25.8/bin:$PATH"
mkdir -p "$HOME/rpmbuild-heimdall-rebuild"
rpmbuild --rebuild --define "_topdir $HOME/rpmbuild-heimdall-rebuild" \
  ./heimdall-server-2.13.1-0.1.integration.el8.src.rpm
```

This uses Node 22 >=22.18.0, Yarn Classic 1.22.22 and the declared RPM build
dependencies. The output is under `~/rpmbuild-heimdall-rebuild/RPMS/<arch>/`.
Use an empty external build directory to verify the SRPM has everything it needs;
old generated man pages must not supply missing inputs. Independently sign the
rebuilt RPM before acceptance installation. See [README.md](README.md) for
committed Git versus filtered Docker sources and the CLI pin contract.

## Setup

After installing a local PostgreSQL server or configuring a remote database, run:

```bash
sudo heimdall-cli setup --non-interactive --skip-tls
```

Normal CLI setup configures the environment, bootstraps a local database when
needed, tests the connection, runs packaged migrations/seeds, configures TLS when
requested, applies available host security integrations, and enables/restarts
Heimdall. Service failures propagate to the command's exit status. Setup requires
a live systemd manager before making changes for service operations.

`--skip-tls` leaves TLS to your existing proxy or acceptance environment; use the
TLS options below for a deployed HTTPS endpoint. The shell entry point
`heimdall-server-setup` remains available, but new operator workflows use the CLI.

### Setup Options

```bash
# Prompt for values; blank passwords retain existing configured credentials.
sudo heimdall-cli setup --interactive

# Configuration only, without migrations or service changes.
sudo heimdall-cli setup --non-interactive --reconfigure

# Skip all DB work only when provisioning/migrations are managed separately.
sudo heimdall-cli setup --non-interactive --skip-db --skip-tls

# Use an existing TLS proxy.
sudo heimdall-cli setup --non-interactive \
  --external-url https://heimdall.example.com --skip-tls
```

Both configurators retain extra login/OIDC assignments and existing secrets on
rerun. The CLI also preserves comments and unchanged assignment text. Use
single-line configuration values, keep `backend.env` root-owned and mode `0640`,
and back it up before intentional credential changes. `--reconfigure` works
without changing services; run a normal setup or explicit restart afterward when
you want the new configuration active.

### Remote Database

Install compatible PostgreSQL client tools, provision the database role and
network access, and configure the remote credentials in
`/etc/heimdall-server/backend.env`. Then run:

```bash
sudo heimdall-cli setup --non-interactive --skip-tls
```

The resolved `DATABASE_HOST` determines topology. A remote hostname skips local
PostgreSQL bootstrap but still performs connection checks and migrations. Do not
use `--skip-db` merely because the database is remote: that option skips these
checks and migrations too. TLS and least-privilege settings for the remote server
are described below.

## PostgreSQL Security

### Local Database (default)

The setup script automatically configures PostgreSQL with:

- **scram-sha-256** password authentication (not md5 or trust)
- Password-authenticated connections for the `heimdall-server-production` database
  in `pg_hba.conf`
- `password_encryption = scram-sha-256` in `postgresql.conf`
- Peer authentication retained for the `postgres` superuser (admin tasks only)
- Verification that the database role password is stored as SCRAM-SHA-256
  (setup exits with an error if not)

### FIPS Hosts and md5 Password Verifiers

A FIPS-mode host cannot complete md5 password authentication, so a database
role whose stored verifier is still md5 makes the Heimdall server **fail to
connect** the moment FIPS mode is enabled. This bites pre-existing databases:
`password_encryption = scram-sha-256` only affects passwords set *after* the
change — existing roles keep their old `md5...` verifier in `pg_authid`.

Setup checks this automatically (for remote databases too) and prints a
warning with the remediation. To run the check on its own:

```bash
sudo /usr/libexec/heimdall-server/postgres-setup.sh --check-auth
```

Reading `pg_authid` requires superuser; when the configured role cannot read
it, the check prints the manual query to run as a superuser instead:

```sql
SELECT rolname, left(rolpassword, 14) FROM pg_authid WHERE rolname = 'heimdall';
```

If the result starts with `md5`, remediate as a PostgreSQL superuser (this
rewrites the role's stored credential — schedule accordingly):

```sql
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
SELECT pg_reload_conf();
ALTER ROLE heimdall WITH PASSWORD '<same or new>';   -- rewrites the verifier
-- then change any md5 rules in pg_hba.conf to scram-sha-256 and reload
```

Setup never modifies your database's authentication configuration itself —
the warning and this runbook are the intended remediation path.

### External Database (RDS, Azure DB, etc.)

When using an external database, ensure:

- TLS is enabled for all connections (`sslmode=require` or `verify-full`)
- The database user has minimal privileges (CONNECT, CREATE on the target database)
- Network access is restricted to the Heimdall server's IP/subnet
- Password meets your organization's complexity requirements

Configure external database in `/etc/heimdall-server/backend.env`:

```text
DATABASE_HOST=your-rds-endpoint.region.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USERNAME=heimdall
DATABASE_PASSWORD=<strong-password>
DATABASE_NAME=heimdall-server-production
DATABASE_SSL=true
```

## Post-Install Smoke Check

Verify the service is actually serving before logging in. Both endpoints are
unauthenticated by design so probes and load balancers can reach them.

```bash
# 1. Liveness — is the process up and serving? (no dependency checks)
curl -fsS http://localhost:3000/health
```

```json
{"status":"ok","version":"2.13.1"}
```

```bash
# 2. Readiness — is the database reachable? (the one hard dependency)
curl -fsS http://localhost:3000/health/ready
```

```json
{"status":"ok","info":{"database":{"status":"up"}},"error":{},"details":{"database":{"status":"up"}}}
```

Both commands exit `0` on success. Interpreting failures:

- **`curl: (7) Failed to connect`** — the service is not listening; check
  `systemctl status heimdall-server`.
- **`/health` succeeds but `/health/ready` returns 503** — the app is up but
  the database is unreachable; check the `DATABASE_*` settings in
  `/etc/heimdall-server/backend.env`.
- **Both succeed** — the install is serving; proceed to Initial Login.

If you changed the listen port (see _Changing the Listen Port_), substitute it
for `3000` above.

> **Note:** probe only these two endpoints. The migration report at
> `/admin/migration-status` is authenticated and runs full table scans — it is
> an operator report, never a health probe (ADR-006 §17).

## Initial Login

After setup completes, the admin credentials are printed to the terminal:

```text
New administrator email is: admin@heimdall.local
New administrator password is: <random-password>
```

**Change this password on first login.**

Access Heimdall at `https://<your-host>` (if Caddy is configured) or
`http://localhost:3000` (direct, no TLS).

## Logging

By default, logs go to **journald** (the standard RHEL approach):

```bash
# View recent logs
sudo journalctl -u heimdall-server -n 100

# Follow live
sudo journalctl -u heimdall-server -f

# Or use heimdall-cli
heimdall-cli logs --lines 100
heimdall-cli logs --follow
```

To write logs to a file instead, set `LOG_FILE` in `backend.env`:

```bash
# Edit config
sudo vi /etc/heimdall-server/backend.env
# Add: LOG_FILE=/var/log/heimdall-server/server.log

# Restart to apply
sudo systemctl restart heimdall-server
```

The directory `/var/log/heimdall-server/` is created automatically and
owned by the `heimdall` user. You can set `LOG_FILE` to any writable
path. Log rotation is your responsibility when using file-based logging
(configure via `/etc/logrotate.d/`).

When `LOG_FILE` is unset (the default), journald handles log storage,
rotation, and cleanup automatically.

## Service Management

```bash
# Check status
sudo systemctl status heimdall-server

# View logs
sudo journalctl -u heimdall-server -f

# Stop
sudo systemctl stop heimdall-server

# Start
sudo systemctl start heimdall-server

# Restart (after config changes)
sudo systemctl restart heimdall-server

# Disable (prevent start on boot)
sudo systemctl disable heimdall-server
```

## Configuration

All configuration is in `/etc/heimdall-server/backend.env`. This file is
owned by `root:heimdall` with mode `0640` (not world-readable since it
contains secrets).

For the complete list of environment variables, run `heimdall-cli config list`
or see the [Heimdall2 repository](https://github.com/mitre/heimdall2).

### Key Settings

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP listen port |
| `DATABASE_HOST` | `localhost` | PostgreSQL host |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_USERNAME` | `postgres` | Database role |
| `DATABASE_PASSWORD` | (auto-generated) | Database password |
| `DATABASE_NAME` | `heimdall-server-production` | Database name |
| `JWT_SECRET` | (auto-generated) | JWT signing key |
| `JWT_EXPIRE_TIME` | `1d` | JWT token lifetime |
| `API_KEY_SECRET` | (auto-generated) | API key signing secret |
| `EXTERNAL_URL` | `https://${NGINX_HOST}` | Public URL (required for HTTPS and OAuth) |
| `NGINX_HOST` | `localhost` | Public hostname / FQDN |
| `ADMIN_EMAIL` | `admin@heimdall.local` | Initial admin email |

After editing, restart the service:
```bash
sudo systemctl restart heimdall-server
```

### Changing the Listen Port

Edit `/etc/heimdall-server/backend.env`:
```bash
PORT=8443
```
Then:
```bash
sudo systemctl restart heimdall-server
```

## TLS Reverse Proxy (Caddy)

Heimdall requires HTTPS in production (the app's security headers enforce it).
The setup script configures [Caddy](https://caddyserver.com) as a TLS reverse
proxy on port 443, proxying to the Node.js backend on localhost:3000.

### Installing Caddy

Caddy is provided through EPEL. On **Oracle Linux 8**, the following repository
setup was used by the passing RPM acceptance fixtures:

```bash
sudo dnf install -y oracle-epel-release-el8 dnf-plugins-core
sudo dnf config-manager --set-enabled ol8_codeready_builder ol8_developer_EPEL
sudo dnf install -y caddy
```

For other EL8/EL9 hosts, configure their EPEL repository:

```bash
# EL8
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm
sudo dnf install -y caddy

# EL9
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm
sudo dnf install -y caddy
```

Then re-run setup to configure TLS:
```bash
sudo heimdall-cli setup --skip-db
```

### TLS Certificate Strategies

| Scenario | What happens |
|---|---|
| **Public hostname** (e.g., `heimdall.agency.mil`) | Caddy auto-provisions Let's Encrypt certs |
| **Private hostname** (`.internal`, `.local`, `.lan`, etc.) | Setup adds `tls internal` — Caddy issues cert from its internal CA |
| **Air-gapped** (private hostname, no internet) | Same as above — internal CA works without internet |
| **IP address** | Setup generates a self-signed cert with IP SAN |
| **BYO cert** | Edit Caddyfile: `tls /path/to/cert.pem /path/to/key.pem` |

Caddy's internal CA root cert is at:
```text
/var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt
```
Import this into client trust stores to avoid browser warnings.

### Private Hostname Deployments

When using a private hostname (e.g., `heimdall.internal`, `heimdall.local`), clients
must be able to resolve the hostname. Options:

#### Option 1: DNS (recommended)
Add an A record in your internal DNS pointing the hostname to the server IP.

#### Option 2: Client /etc/hosts
Add to each client's `/etc/hosts`:
```text
192.168.1.100  heimdall.internal
```

#### Option 3: Use IP directly
Re-run setup with the server IP:
```bash
sudo heimdall-cli setup --external-url https://192.168.1.100 --skip-db
```
This generates a self-signed certificate with the IP as SAN.

#### Trusting the Caddy Internal CA

For private hostname deployments, Caddy uses its internal CA. Import the root
certificate into client browsers:

```bash
# Copy from server
scp server:/var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt ./caddy-root.crt

# Import into system trust store (RHEL/Fedora)
sudo cp caddy-root.crt /etc/pki/ca-trust/source/anchors/
sudo update-ca-trust

# macOS
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain caddy-root.crt
```

Self-signed certs (IP-based) are stored at:
```text
/etc/pki/heimdall-server/server.crt
/etc/pki/heimdall-server/server.key
```

## Enterprise Deployment Patterns

### Behind a Load Balancer (AWS ALB, F5, HAProxy)

When TLS is terminated at the load balancer, the app receives plain HTTP.
Skip Caddy and let the LB handle certificates:

```bash
sudo heimdall-cli setup \
  --external-url https://heimdall.agency.mil \
  --skip-tls
```

The app listens on port 3000 (configurable via `PORT` in `backend.env`).
Point the LB target group at port 3000. The setup script opens this port
in firewalld instead of 443.

`EXTERNAL_URL` is still required — it's used for OAuth callback URLs,
email links, and the app's security headers.

### Corporate PKI Certificates

If your organization issues certificates from an internal CA:

```bash
sudo heimdall-cli setup \
  --external-url https://heimdall.agency.mil \
  --tls-cert /etc/pki/tls/certs/heimdall.pem \
  --tls-key /etc/pki/tls/private/heimdall.key
```

Caddy uses these certificates directly — no Let's Encrypt, no self-signed.
When certs are renewed, reload Caddy: `sudo systemctl reload caddy`.

### Behind an Existing Reverse Proxy (nginx, Apache, HAProxy)

If your organization has a standard reverse proxy stack:

```bash
sudo heimdall-cli setup \
  --external-url https://heimdall.agency.mil \
  --skip-tls
```

Then configure your existing proxy to forward to `http://127.0.0.1:3000`.

### Alternative: nginx

If you prefer nginx, run setup with `--skip-tls` and configure manually:

```nginx
server {
    listen 443 ssl;
    server_name heimdall.example.com;

    ssl_certificate     /etc/pki/tls/certs/heimdall.crt;
    ssl_certificate_key /etc/pki/tls/private/heimdall.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the SELinux boolean for proxy connections:
```bash
sudo setsebool -P httpd_can_network_connect on
```

Set `EXTERNAL_URL` in `backend.env` to match your public hostname.
`EXTERNAL_URL` is required for OAuth/OIDC callback URLs to work.

## Firewall

The setup script opens HTTPS (443) in firewalld automatically when Caddy
is configured. For manual setup:

```bash
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

When using a reverse proxy, avoid exposing port 3000 directly — restrict
access via firewalld or security groups so only the proxy reaches it.

### Cloud Environments

The setup script detects AWS EC2, Azure, and GCP VMs and prints hints
about opening external firewall ports (Security Groups, NSGs, VPC rules).
These cannot be configured from inside the VM.

## Single Sign-On (SSO) and External Authentication

Heimdall supports multiple authentication providers. Each is auto-enabled
when its client ID is configured in `/etc/heimdall-server/backend.env`.

Edit the env file and restart the service to enable any provider:
```bash
sudo vi /etc/heimdall-server/backend.env
sudo systemctl restart heimdall-server
```

**Important:** All OAuth/OIDC providers require `EXTERNAL_URL` to be set
to the public URL users access Heimdall at (e.g., `https://heimdall.example.com`).
This is used to construct callback URLs. HTTPS is required for production
OAuth deployments.

### Okta

1. In Okta Admin Console, create a new **Web** application
2. Set the sign-in redirect URI to: `{EXTERNAL_URL}/authn/okta_callback`
3. Note the Client ID, Client Secret, and your Okta domain

```bash
EXTERNAL_URL=https://heimdall.example.com
OKTA_DOMAIN=your-domain.okta.com
OKTA_CLIENTID=<client-id>
OKTA_CLIENTSECRET=<client-secret>
```

Endpoints are auto-discovered from `OKTA_DOMAIN`. Override if needed:
```bash
OKTA_ISSUER_URL=https://your-domain.okta.com
OKTA_AUTHORIZATION_URL=https://your-domain.okta.com/oauth2/v1/authorize
OKTA_TOKEN_URL=https://your-domain.okta.com/oauth2/v1/token
OKTA_USER_INFO_URL=https://your-domain.okta.com/oauth2/v1/userinfo
```

### GitHub OAuth

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New
2. Set the callback URL to: `{EXTERNAL_URL}/authn/github/callback`

```bash
EXTERNAL_URL=https://heimdall.example.com
GITHUB_CLIENTID=<client-id>
GITHUB_CLIENTSECRET=<client-secret>
```

For GitHub Enterprise:
```bash
GITHUB_ENTERPRISE_INSTANCE_BASE_URL=https://github.company.com/
GITHUB_ENTERPRISE_INSTANCE_API_URL=https://github.company.com/api/v3/
```

### GitLab OAuth

1. In GitLab, go to Admin → Applications → New Application
2. Set the callback URL to: `{EXTERNAL_URL}/authn/gitlab/callback`
3. Select scopes: `read_user`

```bash
EXTERNAL_URL=https://heimdall.example.com
GITLAB_CLIENTID=<client-id>
GITLAB_SECRET=<client-secret>
GITLAB_BASEURL=https://gitlab.com    # or your self-hosted GitLab URL
```

### Google OAuth

1. Go to Google Cloud Console → APIs & Services → Credentials → Create OAuth Client ID
2. Set authorized redirect URI to: `{EXTERNAL_URL}/authn/google/callback`

```bash
EXTERNAL_URL=https://heimdall.example.com
GOOGLE_CLIENTID=<client-id>.apps.googleusercontent.com
GOOGLE_CLIENTSECRET=<client-secret>
```

### Generic OIDC

For any OpenID Connect provider (Keycloak, Azure AD, Auth0, etc.):

1. Create an application/client in your OIDC provider
2. Set the callback URL to: `{EXTERNAL_URL}/authn/oidc_callback`
3. Note the issuer URL, client ID, client secret, and endpoint URLs

```bash
EXTERNAL_URL=https://heimdall.example.com
OIDC_NAME=My Identity Provider
OIDC_ISSUER=https://auth.example.com
OIDC_AUTHORIZATION_URL=https://auth.example.com/authorize
OIDC_TOKEN_URL=https://auth.example.com/token
OIDC_USER_INFO_URL=https://auth.example.com/userinfo
OIDC_CLIENTID=<client-id>
OIDC_CLIENT_SECRET=<client-secret>
```

### LDAP / Active Directory

```bash
LDAP_ENABLED=true
LDAP_HOST=ldap.example.com
LDAP_PORT=389
LDAP_BINDDN=cn=admin,dc=example,dc=com
LDAP_PASSWORD=<bind-password>
LDAP_SEARCHBASE=OU=Users,DC=example,DC=com
LDAP_SEARCHFILTER=(sAMAccountName={{username}})
```

For LDAPS (TLS):
```bash
LDAP_SSL=true
LDAP_SSL_CA=/etc/pki/tls/certs/ldap-ca.pem
# LDAP_SSL_INSECURE=true    # Skip cert verification (not recommended)
```

### Disabling Local Login

Once SSO is configured, you can disable local password login and
public registration:

```bash
LOCAL_LOGIN_DISABLED=true
REGISTRATION_DISABLED=true
```

The initial admin account still works for emergency access.

## SELinux

The RPM ships a custom SELinux policy module (`heimdall_server_t`) that is
automatically loaded on install and removed on uninstall. No manual SELinux
configuration is needed for the default setup (port 3000, local PostgreSQL).

### Custom Port

If you change `PORT` in `backend.env` to something other than 3000, register
the new port with SELinux:

```bash
sudo semanage port -a -t heimdall_server_port_t -p tcp 8443
```

The setup command does this automatically.

### Troubleshooting SELinux

Check for denials:
```bash
sudo ausearch -m avc -ts recent | grep heimdall
```

Temporarily set the domain to permissive for debugging:
```bash
sudo semanage permissive -a heimdall_server_t
# Test, then re-enforce:
sudo semanage permissive -d heimdall_server_t
```

### PostgreSQL Connection

The policy includes a tunable for PostgreSQL access (enabled by default):
```bash
# Verify:
getsebool heimdall_server_connect_postgresql
# Toggle:
sudo setsebool -P heimdall_server_connect_postgresql on
```

## fapolicyd

The RPM registers its CLI and bundled native addons with fapolicyd's trust
database at `/etc/fapolicyd/trust.d/heimdall-server` when fapolicyd is installed.
Node.js is a separate RPM dependency. Full removal drops the package's trust
entries before its CLI and payload are deleted.

If you reinstall or upgrade and fapolicyd blocks execution:
```bash
sudo heimdall-cli fapolicyd add
```

## Firewall

The RPM ships a firewalld service definition. To open the Heimdall port:

```bash
sudo firewall-cmd --permanent --add-service=heimdall-server
sudo firewall-cmd --reload
```

For a custom port (not 3000):
```bash
sudo firewall-cmd --permanent --add-port=8443/tcp
sudo firewall-cmd --reload
```

## Admin CLI

The RPM includes `heimdall-cli`, a command-line tool for common admin tasks:

```bash
# Service status, database, SELinux, fapolicyd, firewalld overview
sudo heimdall-cli status

# View all config grouped by category with descriptions
heimdall-cli config list

# Get/set individual config values (validates types)
heimdall-cli config get PORT
sudo heimdall-cli config set PORT 8443

# Reset admin password
sudo heimdall-cli reset-password admin@heimdall.local

# Change listen port (updates config, SELinux, firewalld, restarts service)
sudo heimdall-cli set-port 8443

# Add organizational CA certificate
sudo heimdall-cli add-cert /path/to/ca.pem

# Backup database + config to a timestamped archive
sudo heimdall-cli backup -o /root

# Restore from archive
sudo heimdall-cli restore /root/heimdall-backup-20260226-143000.tar.gz

# View logs
heimdall-cli logs --lines 100
heimdall-cli logs --follow

# Full diagnostic dump (for support tickets)
sudo heimdall-cli diag

# Service control
sudo heimdall-cli restart
sudo heimdall-cli stop
sudo heimdall-cli start
```

Tab completion is available in bash (installed to `/etc/bash_completion.d/`).

## Backup and Restore

The CLI backs up configuration and, when `DATABASE_PASSWORD` is configured,
the database to a timestamped archive:

```bash
sudo heimdall-cli backup -o /root
```

Use the exact archive path printed by the command. Verify that it contains
`backend.env` and `database.sql`, and keep a secure copy outside the package's
data directory. Without a database password, the archive contains configuration
only; a successful command then does not establish a database backup.

Before restoring, review the archived `backend.env` securely and prepare an
**empty target database** with the required role. Restore first replaces the live
configuration, then connects using the host, database name and credentials from
that archived file. Moving an archive to another host does not redirect a remote
database connection. For recovery to a different database, use the manual restore
procedure below and configure its connection settings explicitly.

The CLI replays SQL; it does not drop, recreate or empty the database. Do not run
setup/migrations against the empty recovery database before restoring. Stop the
application during recovery and restart only after restore succeeds. Replace the
example archive timestamp below with the actual backup filename:

```bash
sudo systemctl stop heimdall-server &&
  sudo heimdall-cli restore /root/heimdall-backup-YYYYMMDD-HHMMSS.tar.gz &&
  sudo systemctl start heimdall-server &&
  curl -fsS --retry 30 --retry-connrefused --retry-delay 1 \
    --retry-max-time 60 --max-time 5 http://localhost:3000/health/ready
```

SQL errors stop the command and return a failure. A failed restore can leave
configuration changed and SQL partially applied; keep the service stopped and
resolve the failure before retrying against an empty recovery database. Verify
restored users/data and login before resuming use. Use your configured port or
trusted HTTPS endpoint for the health check when it differs from the example.

Alternatively, back up and restore the database and configuration separately:

### Database Backup

```bash
sudo -u postgres pg_dump heimdall-server-production > heimdall-backup-$(date +%Y%m%d).sql
```

### Database Restore

```bash
# Use a newly created empty recovery database, not an already populated schema.
sudo -u postgres createdb heimdall-recovery
sudo -u postgres psql -v ON_ERROR_STOP=1 -d heimdall-recovery < heimdall-backup-YYYYMMDD.sql
```

### Configuration Backup

```bash
sudo cp /etc/heimdall-server/backend.env /root/heimdall-backend.env.bak
```

## User Management

### Creating Additional Users

Users register through the web interface at `/signup`, or an admin can
create accounts via the API:

```bash
# Get admin JWT token
TOKEN=$(curl -s -X POST http://localhost:3000/authn/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@heimdall.local","password":"<admin-password>"}' \
  | jq -r '.accessToken')

# Create a new user
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "passwordConfirmation": "SecurePassword123!",
    "role": "user",
    "firstName": "First",
    "lastName": "Last"
  }'
```

### Changing the Admin Password

Log in to the web interface and change it under account settings, or use
the API:

```bash
curl -X PUT http://localhost:3000/users/<user-id> \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{
    "currentPassword": "<current>",
    "password": "<new-password>",
    "passwordConfirmation": "<new-password>"
  }'
```

## Upgrading

Only the development transition from `2.13.1-0.1.integration` to
`2.13.1-0.2.integration` is covered by this candidate's fixtures. It is not an
upgrade from 2.14.0.

Before replacing the package, edit `/etc/sysconfig/heimdall-server` and set:

```bash
RESTART_ON_UPGRADE=false
```

The shipped default is true. Keep it false until explicit migrations finish so
the package transaction does not restart the application early. Verify an explicit
backup, upgrade, then run setup to migrate and restart:

```bash
sudo heimdall-cli backup
sudo dnf upgrade --setopt=localpkg_gpgcheck=1 ./heimdall-server-2.13.1-0.2.integration.el8.x86_64.rpm
sudo heimdall-cli setup --non-interactive --skip-tls
sudo heimdall-cli status
curl -fsS http://localhost:3000/health/ready
```

For a TLS deployment, retain its configured TLS options instead of copying the
acceptance-only `--skip-tls` choice. The RPM also attempts an automatic backup,
but a failure is nonfatal to the transaction; it does not replace the verified
manual backup.

`backend.env` and sysconfig are `%config(noreplace)`, so modified settings survive
upgrades. Review any `.rpmnew` templates without replacing existing secrets.
Normal setup reruns preserve additional settings and credentials.

## Uninstall and Recovery

Back up the database and configuration before removal:

```bash
sudo heimdall-cli backup -o /root
sudo systemctl stop heimdall-server
sudo dnf remove heimdall-server
```

The package removes its application files and host integration. It does not drop
the PostgreSQL database or delete backup archives. RPM may move modified config
files to `.rpmsave`; unchanged packaged templates can be removed. Do not rely on
`backend.env` remaining at its original pathname.

For recovery, reinstall the same signed candidate with its prerequisites, recover
configuration from the verified backup or reviewed `.rpmsave`, and restore the
backup through `heimdall-cli restore`. Check database contents and health before
resuming use. Retain database files, backups and the service account until recovery
has been verified. The acceptance recovery fixture uses a disposable database and
requires SQL errors to propagate; it is not evidence for migration from 2.14.0.

## Troubleshooting

### Service won't start

```bash
sudo journalctl -u heimdall-server -n 50 --no-pager
```

Common causes:
- `DATABASE_PASSWORD` not set → run `sudo heimdall-cli setup`
- PostgreSQL not running → `sudo systemctl start postgresql-18`
- Port already in use → change `PORT` in `backend.env`

### Database connection refused

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql-18

# Test connection
PGPASSWORD=<password> psql -h localhost -U postgres -d heimdall-server-production -c "SELECT 1;"
```

### Re-run setup while preserving configuration

```bash
sudo heimdall-cli setup --non-interactive
```

### Reset admin password

```bash
sudo heimdall-cli reset-password admin@heimdall.local
```
