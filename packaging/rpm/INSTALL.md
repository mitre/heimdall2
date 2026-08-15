# Heimdall Server — RPM Installation Guide

## Supported Platforms

| OS | Architectures |
|---|---|
| RHEL 8 / Oracle Linux 8 / Rocky 8 / Alma 8 | x86_64, aarch64 |
| RHEL 9 / Oracle Linux 9 / Rocky 9 / Alma 9 | x86_64, aarch64 |

## Prerequisites

- Root or sudo access
- PostgreSQL 13+ (local or remote)
- Node.js 22 (bundled in the RPM — no separate install needed)
- 2 GB RAM minimum (4 GB recommended)
- 1 GB free disk space

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

Any PostgreSQL version 13–18 from PGDG is supported. The setup scripts
auto-detect the installed version.

## Install

Download the RPM for your OS and architecture from the
[GitHub Releases](https://github.com/mitre/heimdall2/releases) page.

```bash
sudo dnf install -y ./heimdall-server-*.rpm
```

### Building from Source RPM

Each release also publishes a source RPM (`.src.rpm`) so you can rebuild
on your own infrastructure, apply local patches, or build for an
architecture not covered by the release binaries:

```bash
# Install build dependencies and rebuild
sudo dnf install -y rpm-build
rpmbuild --rebuild ./heimdall-server-*.src.rpm

# The binary RPM is produced in ~/rpmbuild/RPMS/$(uname -m)/
sudo dnf install -y ~/rpmbuild/RPMS/$(uname -m)/heimdall-server-*.rpm
```

You will need Node.js 22 (NodeSource), Yarn, and a C++ compiler
installed. See [`setup-rpm-build-env.sh`](setup-rpm-build-env.sh)
for the full dependency list, or run it with `--skip-deps` if you already
have everything.

## Setup

After install, run the setup command:

```bash
sudo heimdall-server-setup
```

This runs six steps:

1. **Configuration** — generates `/etc/heimdall-server/backend.env` with
   database credentials, JWT secrets, API key secrets, and EXTERNAL_URL.
   Missing values are auto-generated securely.
2. **PostgreSQL bootstrap** — initializes the database cluster, starts
   PostgreSQL, creates the database role with SCRAM-SHA-256 authentication.
   Skipped automatically if `DATABASE_HOST` is not localhost.
3. **Database migrations** — creates the database, runs all schema
   migrations, and seeds the initial admin user.
4. **TLS reverse proxy** — configures Caddy as an HTTPS reverse proxy on
   port 443, proxying to the backend on localhost:3000. For hostname-based
   deployments, Caddy can auto-provision Let's Encrypt certificates. For
   IP-based or air-gapped deployments, a self-signed certificate is
   generated automatically. Skipped if Caddy is not installed.
5. **Security policies** — registers the Heimdall port with SELinux, sets
   `httpd_can_network_connect` for the reverse proxy, adds bundled binaries
   to fapolicyd trust, and opens HTTPS (443) in firewalld. Each subsystem
   is skipped if its tools are not installed.
6. **Service start** — enables and starts `heimdall-server.service`.
   Detects cloud environments (EC2, Azure, GCP) and prints helpful
   firewall hints.

### Setup Options

```bash
# Interactive (default when run from a terminal)
sudo heimdall-server-setup --interactive

# Non-interactive (for automation — accepts all defaults)
sudo heimdall-server-setup --non-interactive

# Reconfigure only (re-run step 1, then restart service)
sudo heimdall-server-setup --reconfigure

# Skip database steps (for remote database setups)
sudo heimdall-server-setup --skip-db

# Skip TLS proxy setup (if you manage your own reverse proxy)
sudo heimdall-server-setup --skip-tls
```

### Remote Database

To use an existing PostgreSQL server instead of a local one:

1. Run `sudo heimdall-server-setup --interactive`
2. Set `DATABASE_HOST` to your server's hostname or IP
3. Set `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` as needed
4. The PostgreSQL bootstrap step is automatically skipped

Or edit `/etc/heimdall-server/backend.env` directly and run:
```bash
sudo heimdall-server-setup --skip-db
sudo heimdall-server-db-setup
```

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

### External Database (RDS, Azure DB, etc.)

When using an external database, ensure:

- TLS is enabled for all connections (`sslmode=require` or `verify-full`)
- The database user has minimal privileges (CONNECT, CREATE on the target database)
- Network access is restricted to the Heimdall server's IP/subnet
- Password meets your organization's complexity requirements

Configure external database in `/etc/heimdall-server/backend.env`:

```
DATABASE_HOST=your-rds-endpoint.region.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USERNAME=heimdall
DATABASE_PASSWORD=<strong-password>
DATABASE_NAME=heimdall-server-production
DATABASE_SSL=true
```

## Initial Login

After setup completes, the admin credentials are printed to the terminal:

```
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

Caddy is in EPEL:
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
sudo heimdall-server-setup --skip-db
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
```
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
```
192.168.1.100  heimdall.internal
```

#### Option 3: Use IP directly
Re-run setup with the server IP:
```bash
sudo heimdall-server-setup --external-url https://192.168.1.100 --skip-db
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
```
/etc/pki/heimdall-server/server.crt
/etc/pki/heimdall-server/server.key
```

## Enterprise Deployment Patterns

### Behind a Load Balancer (AWS ALB, F5, HAProxy)

When TLS is terminated at the load balancer, the app receives plain HTTP.
Skip Caddy and let the LB handle certificates:

```bash
sudo heimdall-server-setup \
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
sudo heimdall-server-setup \
  --external-url https://heimdall.agency.mil \
  --tls-cert /etc/pki/tls/certs/heimdall.pem \
  --tls-key /etc/pki/tls/private/heimdall.key
```

Caddy uses these certificates directly — no Let's Encrypt, no self-signed.
When certs are renewed, reload Caddy: `sudo systemctl reload caddy`.

### Behind an Existing Reverse Proxy (nginx, Apache, HAProxy)

If your organization has a standard reverse proxy stack:

```bash
sudo heimdall-server-setup \
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

The setup script (`heimdall-server-setup`) does this automatically.

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

The RPM automatically registers bundled binaries (Node.js and native addons)
with fapolicyd's trust database at `/etc/fapolicyd/trust.d/heimdall-server`
on install. Entries are removed on uninstall. No manual configuration needed.

If you reinstall or upgrade and fapolicyd blocks execution:
```bash
sudo /usr/libexec/heimdall-server/fapolicyd-trust.sh add
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
sudo heimdall-cli reset_password admin@heimdall.local

# Change listen port (updates config, SELinux, firewalld, restarts service)
sudo heimdall-cli set_port 8443

# Add organizational CA certificate
sudo heimdall-cli add_cert /path/to/ca.pem

# Backup database + config to a timestamped archive
sudo heimdall-cli backup /root

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

Using `heimdall-cli` (backs up both database and config to a single archive):

```bash
sudo heimdall-cli backup /root
sudo heimdall-cli restore /root/heimdall-backup-20260226-143000.tar.gz
```

Or manually:

### Database Backup

```bash
sudo -u postgres pg_dump heimdall-server-production > heimdall-backup-$(date +%Y%m%d).sql
```

### Database Restore

```bash
sudo -u postgres psql -d heimdall-server-production < heimdall-backup-YYYYMMDD.sql
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

Back up before upgrading:
```bash
sudo heimdall-cli backup /root
```

Then upgrade:
```bash
sudo dnf upgrade -y ./heimdall-server-<new-version>.rpm
sudo heimdall-server-db-setup    # Run new migrations
sudo systemctl restart heimdall-server
```

The config file (`backend.env`) is preserved across upgrades
(`%config(noreplace)`).

## Uninstall

```bash
sudo systemctl stop heimdall-server
sudo dnf remove heimdall-server
```

This removes the application files but preserves:
- `/etc/heimdall-server/backend.env` (marked as config)
- The PostgreSQL database and data

To fully clean up:
```bash
sudo rm -rf /etc/heimdall-server
sudo userdel heimdall
sudo groupdel heimdall
# Optionally drop the database:
sudo -u postgres psql -c "DROP DATABASE \"heimdall-server-production\";"
```

## Troubleshooting

### Service won't start

```bash
sudo journalctl -u heimdall-server -n 50 --no-pager
```

Common causes:
- `DATABASE_PASSWORD` not set → run `sudo heimdall-server-setup`
- PostgreSQL not running → `sudo systemctl start postgresql-18`
- Port already in use → change `PORT` in `backend.env`

### Database connection refused

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql-18

# Test connection
PGPASSWORD=<password> psql -h localhost -U postgres -d heimdall-server-production -c "SELECT 1;"
```

### Re-run setup from scratch

```bash
sudo heimdall-server-setup --non-interactive
```

### Reset admin password

```bash
# Using heimdall-cli (recommended)
sudo heimdall-cli reset_password admin@heimdall.local

# Or manually
sudo -u postgres psql -d heimdall-server-production -c "
  UPDATE \"Users\" SET \"encryptedPassword\" = '' WHERE email = 'admin@heimdall.local';
"
sudo heimdall-server-db-setup  # Re-seeds admin with new random password
```
