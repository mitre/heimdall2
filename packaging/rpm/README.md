# Heimdall Server RPM installation

## Install an RPM

Download the Actions artifact for the intended commit that matches the host's
EL major and CPU architecture:
`heimdall-server-rpm-bundle-el{8,9,10}-{x86_64,aarch64}`. For example,
`heimdall-server-rpm-bundle-el10-x86_64` targets Enterprise Linux 10 on Intel/AMD
64-bit CPUs; `aarch64` identifies ARM64. The bundle contains the installable RPM,
additional OS dependency RPMs and the supporting files described in
[artifact layout](#artifact-layout).
Extract it into a fresh directory and run the commands below from that directory.
For connected installation, DNF resolves dependencies from the host's approved
repositories. The included OS dependency RPMs come from Rocky Linux and are only
for the matching Rocky baseline; do not install them on RHEL or another vendor's
distribution. See [disconnected installation](#disconnected-installation).
RHEL and historical minor releases still need candidate-specific validation.

Obtain the artifact and public key from the same trusted workflow run. Each
artifact contains one Heimdall binary RPM, so the install command works across
versions, EL majors and architectures without editing the filename:

```sh
sha256sum --check SHA256SUMS
sudo rpm --import RPM-TEST-GPG-KEY
sudo dnf install --setopt=localpkg_gpgcheck=1 \
  ./RPMS/*/heimdall-server-*.rpm
rpm -q heimdall-server
sudo heimdall-cli setup --interactive
```

Keep only the selected artifact in this directory so the glob matches exactly
one binary RPM. Installation uses DNF directly; no separate
installer is needed. Test keys are disposable, so production delivery requires
a durable signing key. The shipped repository definition is disabled. Once an
approved RPM repository is configured, the installation command is
`sudo dnf install heimdall-server`.

See [builds and artifact downloads](BUILD.md#ci-artifacts-and-test-signatures)
for download methods and [acceptance status](BUILD.md#acceptance-status) for
validation limits. The application version comes from the root `VERSION` file.
See [service status](#verify-and-operate) after setup and
[uninstall and recovery](#uninstall-and-recover) when removing the package.

## Artifact layout

The extracted Actions artifact has this structure; placeholders vary with the
application version, RPM release, EL major and CPU architecture:

```text
.
├── RPMS/
│   └── <arch>/
│       └── heimdall-server-<version>-<release>.el<major>.<arch>.rpm
├── SRPMS/
│   └── heimdall-server-<version>-<release>.el<major>.src.rpm
├── OS-RPMS/
│   └── <arch>/
│       └── <dependency>-<version>-<release>.<arch-or-noarch>.rpm
├── OS-GPG-KEYS/
│   └── <vendor-public-key>
├── RPM-TEST-GPG-KEY
├── runtime-manifest.json
├── os-dependencies.json
└── SHA256SUMS
```

| Path | Purpose |
| --- | --- |
| `RPMS/<arch>/*.rpm` | Signed installable package containing Heimdall and its bundled runtimes. |
| `SRPMS/*.src.rpm` | Signed source package containing sources and the RPM build recipe for rebuilding; not needed for installation. |
| `OS-RPMS/*/*.rpm` | Vendor-signed OS packages missing from the recorded Core baseline, including their additional dependencies. |
| `OS-GPG-KEYS/*` | Public OS vendor signing keys used to verify those dependency RPMs. |
| `RPM-TEST-GPG-KEY` | Public test signing key to import before DNF verifies the RPM signature. |
| `runtime-manifest.json` | Inventory of the bundled application runtimes. |
| `os-dependencies.json` | Target distribution, version and architecture, candidate RPM hash, exact Core baseline, and dependency RPM versions, hashes and source repositories. |
| `SHA256SUMS` | Checksums for the RPMs, public keys and manifests, calculated after signing. |

Run `sha256sum --check SHA256SUMS` from the extracted artifact's root directory
before installation. The OS RPM directories contain only the additions needed
by this candidate on its recorded baseline, not a complete operating system.

## Disconnected installation

Transfer the complete bundle for the host's EL major and CPU architecture from a
trusted workflow run. Run the commands from the extracted bundle's root directory.
Both options below configure bundled database and proxy services with internal
TLS. Replace `heimdall.example.test` with the hostname clients will use.

### OS dependencies already installed

If the host already has the [OS prerequisites](#requirements), use this shorter
block. It installs only the Heimdall RPM. Each step runs only if the previous one
succeeds:

```sh
sha256sum --check SHA256SUMS &&
sudo rpm --import RPM-TEST-GPG-KEY &&
sudo dnf --disablerepo='*' install \
  --setopt=localpkg_gpgcheck=1 --setopt=install_weak_deps=False \
  ./RPMS/*/heimdall-server-*.rpm &&
sudo heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode bundled --tls-mode internal \
  --external-url https://heimdall.example.test
```

If DNF reports missing OS dependencies, use the longer block below to install
them from the bundle on a matching host. Do not proceed to setup after a failed
installation.

### OS dependencies missing

When installing the included OS RPMs, the host must match the manifest's distribution,
version and architecture and satisfy its recorded package baseline. The dependency
collector currently supports Rocky Linux only. RHEL support requires adapting it
to approved RHEL repositories and validating a RHEL baseline; this is not yet
implemented. Matching the EL major alone does not make Rocky dependency RPMs
appropriate for RHEL. Connected RHEL installation can resolve the application
RPM's dependencies from approved RHEL repositories, subject to candidate validation.

The following block checks the target before importing keys, then installs the
application and additional OS RPMs in one DNF transaction. Repositories are
disabled to prevent metadata requests. A failed check stops the block:

```sh
(
set -e
sha256sum --check SHA256SUMS
. /etc/os-release
heimdall_python=python3
if [ -x /usr/libexec/platform-python ]; then
  heimdall_python=/usr/libexec/platform-python
fi
"$heimdall_python" - "$ID" "$VERSION_ID" "$(uname -m)" <<'PY'
import json
import sys

with open("os-dependencies.json") as stream:
    manifest = json.load(stream)
expected = (manifest["distribution"]["id"],
            manifest["distribution"]["version_id"], manifest["architecture"])
if tuple(sys.argv[1:]) != expected:
    raise SystemExit("Bundle target mismatch: expected " + " ".join(expected))
PY
sudo rpm --import RPM-TEST-GPG-KEY
sudo rpm --import ./OS-GPG-KEYS/*
sudo dnf --disablerepo='*' install --setopt=localpkg_gpgcheck=1 \
  --setopt=install_weak_deps=False \
  ./RPMS/*/heimdall-server-*.rpm ./OS-RPMS/*/*.rpm
sudo heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode bundled --tls-mode internal \
  --external-url https://heimdall.example.test
)
```

DNF checks dependencies and signatures for every package. The application RPM
does not download or install nested packages. If the transaction needs a core OS
update, first apply an approved offline update for that distribution or obtain a
bundle resolved for the host's baseline. Do not bypass dependency checks with
`rpm --nodeps` or mix packages from different distributions.

For guided setup, replace the final setup command in either block with
`sudo heimdall-cli setup --interactive`. Choose the bundled database and Nginx
with its automatic self-signed certificate, or bundled Caddy with internal or
custom TLS for a fully disconnected deployment.

Arrange local name resolution and trust the generated public certificate on
clients: `/etc/heimdall-server/nginx/certs/server.crt` for Nginx, or
`/var/lib/heimdall-caddy/data/caddy/pki/authorities/local/root.crt` for Caddy.
Nginx self-signed TLS and Caddy internal/custom TLS need no package
downloads. ACME and external services retain their connectivity requirements.

## Requirements

Use a booted EL8/EL9/EL10 systemd host on x86_64 or aarch64 with root/sudo access.
The included OS dependency RPMs assume a maintained Core installation, with the
exact package versions recorded in `os-dependencies.json`. The host supplies its kernel,
systemd, RPM/DNF, glibc, foundational libraries and utilities, and SELinux policy.
These core OS packages are not included as Heimdall dependencies to upgrade the
operating system. CI tests Rocky Linux; RHEL needs separate qualification.

The RPM bundles Node.js 22.23.3, PostgreSQL 18.6, PostgreSQL's ICU libraries,
Caddy 2.11.4 and Nginx 1.30.6. No NodeSource, PGDG, Caddy or Nginx repository is
needed on the runtime host. Runtime updates, including private ICU security fixes, arrive in a new
Heimdall RPM.

Runtime OS requirements are glibc, libgcc, libstdc++, OpenSSL (libraries and command), zlib,
systemd, `policycoreutils-python-utils`, `selinux-policy-targeted`, `tar`,
`gzip`, `util-linux`, `iproute`, `logrotate`, `shadow-utils`, `coreutils`,
`findutils`, `gawk`, `diffutils`, and the standard shell/text utilities. On connected
hosts, DNF can resolve missing prerequisites from approved OS repositories. The
offline bundle supplies the required additions to its recorded baseline. For the
assessed lean Rocky 8.10 Core baseline, these were `openssl`, `tar`,
`policycoreutils-python-utils`, `checkpolicy`, `python3-audit`,
`python3-libsemanage`, `python3-policycoreutils`, and `python3-setools`. The build
resolves the actual list for each candidate, EL version and architecture; it does
not assume these eight packages are sufficient for every host.

Inspect the exact application requirements with
`rpm -qp --requires ./RPMS/*/heimdall-server-*.rpm`.

Choose the RPM for the host's EL major; an EL8 RPM is not an EL10 build. Building
on a recent EL minor release can introduce requirements unavailable on an older
minor/EUS host. DNF's dependency checks remain enabled; forcing an incompatible
package is not the installation path.

Provision memory and disk for application data, database and backups; allow at
least 2 GB RAM, preferably 4 GB for a small deployment.

For an external database, provision PostgreSQL 13–18 and a database role with
permission to create the application schema and run migrations. For an external
proxy, provision HTTPS and forwarding to Heimdall's application port. Setup does
not administer either external service, including a database on localhost.

The install transaction creates accounts and files. It does not initialize a
cluster, migrate schemas or start the application/private services. Setup needs
systemd running as PID 1; an ordinary container can install and inspect the RPM,
while the CI lifecycle tests use a privileged container booted with systemd.

## Setup

The wizard independently selects the database and proxy:

| Database | Proxy | Result |
| --- | --- | --- |
| bundled | nginx | Private PostgreSQL and private Nginx with a self-signed certificate |
| bundled | bundled | Private PostgreSQL and private Caddy |
| bundled | external | Private PostgreSQL and your HTTPS proxy |
| external | nginx | Your database and private Nginx with a self-signed certificate |
| external | bundled | Your database and private Caddy |
| external | external | Your database and HTTPS proxy |

New installations default to bundled/nginx. The first proxy choice generates a
self-signed certificate automatically. Text fields start empty; pressing Enter
accepts the default shown in the question. The address default is `localhost`;
setup stores the complete HTTPS URL. Explicit flags override saved
values, and saved values override defaults. Configured installations without mode
keys default to external/external and preserve endpoints. Hostname never implies
ownership: `--database-mode external --db-host localhost` is supported.

```sh
# Bundled database and private Nginx with an automatic self-signed certificate.
sudo heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode nginx \
  --external-url heimdall.example.com --port 3003

# Bundled database; HTTPS terminated by an existing proxy.
sudo heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode external \
  --external-url https://heimdall.example.com

# Existing database on the same host and bundled Caddy.
sudo heimdall-cli setup --non-interactive \
  --database-mode external --proxy-mode bundled --tls-mode internal \
  --db-host 127.0.0.1 --db-port 5432 --db-user heimdall \
  --db-password '<database-password>' --db-name heimdall-server-production \
  --external-url https://heimdall.example.com

# HTTP-only development deployment.
sudo heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode none --external-url http://localhost:3000
```

Setup generates missing secrets, tests the database, migrates/seeds the schema,
applies available host security integrations and starts the selected services.
External database mode still runs connectivity checks and migrations.
`--skip-db` skips that work only for the current invocation; `--skip-tls` likewise
skips TLS work without changing saved proxy ownership.

Interactive setup asks for **Backend port** before displaying the configuration
summary, defaulting to the saved `PORT` or `3000` on a new installation. The
summary includes the selected port. Automated setup accepts `--port 3003`; an explicit
value replaces the saved port. Setup checks the range (1024–65535), listener ownership
and SELinux assignments before changing configuration or services. If a port
conflicts, interactive setup asks again; automated setup fails and names the
conflict. For example, if RHEL assigns `3000` to `ntop_port_t`, choose an available
port such as `3003`. Setup never replaces another service's SELinux assignment.
The selected port is registered during setup, not RPM installation.

The backend port is separate from public HTTPS. Managed Nginx and Caddy continue
to listen on port **443** and forward to the selected backend port. For QEMU user
networking, forward a host port to guest port 443, for example
`hostfwd=tcp::443-:443`, and browse to `https://localhost`. Changing the
backend port does not require changing that forwarding rule. Set `EXTERNAL_URL`
to the URL clients use; an external proxy's operator must update its upstream
when the backend port changes.

A normal `sudo heimdall-cli setup --non-interactive` rerun preserves credentials,
the backend port, selections, comments and additional configuration, including
after RPM upgrades. `--reconfigure` writes config
only; apply a topology change with a subsequent full setup. Moving away from a
bundled component stops/disables only its private service after replacement
settings validate, retaining state. A database mode change does not copy data.
Use setup's mode flags rather than generic `config set` to change ownership.
`--dry-run` makes no configuration, database or service changes.

## Private services and data

| Component | Unit | Account | State |
| --- | --- | --- | --- |
| Application | `heimdall-server` | `heimdall` | `/var/lib/heimdall-server` |
| PostgreSQL | `heimdall-postgresql` | `heimdall-postgres` | `/var/lib/heimdall-postgresql/18/data` |
| Nginx | `heimdall-nginx` | `heimdall-nginx` | `/var/lib/heimdall-nginx` |
| Caddy | `heimdall-caddy` | `heimdall-caddy` | `/var/lib/heimdall-caddy` |

Runtime executables live under `/usr/libexec/heimdall-server/runtime/`. There
are no global Node, PostgreSQL, Caddy or Nginx aliases. The inventory is
`/usr/share/heimdall-server/runtime-manifest.json`, with private ICU provenance in
`/usr/share/heimdall-server/icu-manifest.json`; runtime notices are in
`/usr/share/licenses/heimdall-server/`. Do not replace these RPM-owned files
independently. Runtime patches arrive in new server RPMs.

Bundled PostgreSQL listens on `127.0.0.1:55432` by default and uses the private
socket `/run/heimdall-postgresql`. Its application connections use SCRAM password
authentication. Administrative commands use its dedicated account and socket:

```sh
sudo -u heimdall-postgres /usr/libexec/heimdall-server/runtime/postgresql/bin/psql \
  -h /run/heimdall-postgresql -p 55432 -U heimdall-postgres \
  -d heimdall-server-production
```

For external database connections, configure the `DATABASE_*` settings and TLS
according to the server operator's policy. `DATABASE_SSL=true` enables TLS;
`DATABASE_SSL_CA` supplies its CA. Keep certificate verification enabled. The
bundled version-18 clients are used for both modes; newer server majors are
rejected with an upgrade instruction. SCRAM configuration does not by itself
establish FIPS validation of the bundled runtimes.

## TLS and external proxies

The default `--proxy-mode nginx` uses the private Nginx service and automatically
generates a self-signed certificate for the configured hostname or IP address.
It works without network access after installation. The configuration is
`/etc/heimdall-server/nginx/nginx.conf`; the certificate and private key are
`/etc/heimdall-server/nginx/certs/server.crt` and `server.key`. The certificate
lifetime defaults to seven days and can be set during interactive setup. Setup
preserves valid certificates on normal reruns; replace both files to renew an
expired certificate or change its hostname. Browsers require explicit trust in the public
certificate; distribute only `server.crt`, never the private key. Nginx listens
on HTTPS port 443 and forwards to the application port.

Bundled Caddy owns `/etc/heimdall-server/caddy/Caddyfile` and uses the private admin
socket `/run/heimdall-caddy/admin.sock`. It forwards to the configured `PORT`,
default 3000. Port 443 must be available. A conflict is an error; setup does not
stop the existing listener.

- `--tls-mode acme` uses public certificate issuance and requires its network/DNS
  prerequisites.
- `--tls-mode internal` uses Caddy's private CA, including when the runtime host
  has no network after installation. Distribute only the CA's public root to
  client trust stores: `/var/lib/heimdall-caddy/data/caddy/pki/authorities/local/root.crt`.
- `--tls-mode custom --tls-cert /path/cert.pem --tls-key /path/key.pem` copies
  supplied files into managed private storage and retains those paths on reruns.

```sh
sudo heimdall-cli setup --non-interactive --proxy-mode bundled --tls-mode custom \
  --external-url https://heimdall.example.com \
  --tls-cert /etc/pki/tls/certs/heimdall.pem \
  --tls-key /etc/pki/tls/private/heimdall.key
```

When renewing supplied certificates, rerun setup with the renewed paths. Clients
must resolve the public hostname and trust the issuing CA. Keep the private CA
key and custom private keys confidential.

For an existing proxy or load balancer, use `--proxy-mode external` and set
`--external-url` to the HTTPS URL users visit. Forward to the configured HTTP
port, preserving the host and forwarded protocol/address headers. Restrict backend
network access to the proxy. Configure the external proxy, its certificates,
firewall and cloud security groups yourself; Heimdall does not modify its service.
`EXTERNAL_URL` is also used for login callbacks and email links.

## Verify and operate

For a quick check of whether the application is running:

```sh
systemctl is-active heimdall-server
sudo systemctl status heimdall-server --no-pager
```

`active` means the service is running; `inactive` means it is stopped, and
`failed` means it failed. The detailed status includes recent logs. Check boot
startup separately with `systemctl is-enabled heimdall-server`; `enabled` does
not mean it is currently running.

For the application and its selected database/proxy services, use the CLI
summary, check the HTTP response and inspect logs:

```sh
sudo heimdall-cli status
curl -fsS --retry 30 --retry-connrefused --retry-delay 1 \
  --retry-max-time 60 --max-time 5 http://localhost:3000/server
sudo journalctl -u heimdall-server -u heimdall-postgresql -u heimdall-nginx -u heimdall-caddy -n 100
```

`/server` returns application startup settings; it does not test database
readiness. Use your configured port or trusted HTTPS endpoint when different.
Confirm full setup completed its database connectivity and migration checks,
then log in and open stored data to verify application database access.
Use the administrator credentials created during setup. The current CLI hides
the seeder output containing the generated administrator password. Generate a replacement and display it with:

```sh
sudo heimdall-cli reset-password admin@heimdall.local
```

Use the configured administrator email if different. The generated login password
is stored only as a hash in the database. Database credentials and application
secrets are stored in `/etc/heimdall-server/backend.env`.

Successful setup enables the selected systemd services to start at boot. In a
Docker test container, starting the container also starts these services. To
restart the container when Docker starts, run this on the Docker host:

```sh
docker update --restart unless-stopped ol8-systemd
```

Replace `ol8-systemd` with your container name. Docker must itself start after a
host reboot; a container you manually stop stays stopped with this policy.

```sh
sudo heimdall-cli logs --lines 100
sudo heimdall-cli diag
```

## Change configuration

For first-time setup, choose **Backend port** interactively or pass `setup --port`.
For an already running installation, use the CLI to change it, for example to port 3003:

```sh
sudo heimdall-cli set-port 3003
sudo heimdall-cli status
```

`set-port` updates the application configuration and selected private proxy
upstream along with host port integration. With a managed HTTPS proxy,
browser access continues to use HTTPS on port 443; this command changes the
backend port without opening it in firewalld. Setup's `--skip-tls` flag also
retains the managed proxy's firewall policy.
An external proxy must be updated by its operator.

For other application settings, edit `/etc/heimdall-server/backend.env`. It
controls database connections, authentication, logging, `EXTERNAL_URL` and other
application settings. Validate the changes before restarting:

```sh
sudoedit /etc/heimdall-server/backend.env
sudo heimdall-cli validate && sudo systemctl restart heimdall-server
sudo systemctl status heimdall-server --no-pager
```

List configuration with:

```sh
sudo heimdall-cli config list
```

See the [configuration reference](man/heimdall-server-backend.env.5.md) for
available settings.

`backend.env` is root-owned, group `heimdall`, mode `0640`. It contains secrets.
`HEIMDALL_DATABASE_MODE`, `HEIMDALL_PROXY_MODE` and `HEIMDALL_TLS_MODE` preserve
selections. Use [`heimdall-cli setup`](#setup) with the mode flags when switching
between bundled and external database/proxy services. Additional login/OIDC
settings and credentials survive normal setup reruns.

CLI path overrides require matching systemd configuration; they do not relocate
the fixed RPM runtime or PostgreSQL/Caddy/Nginx state.

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

Disabling local login also blocks the initial administrator's password login.
Verify external administrator access before enabling this setting; recovery
requires an operator to restore local login in the configuration.

## Host security

The RPM supplies SELinux policy, private file contexts and fapolicyd trust for its
executables/libraries and native addons. Use `heimdall-cli set-port` for port
changes. If fapolicyd is installed, `sudo heimdall-cli fapolicyd add` refreshes the
owned trust entries. Do not disable SELinux or fapolicyd to make setup succeed.
Inspect service logs and `sudo ausearch -m avc -ts recent` for failures.

An enforcing OL8 VM is required to verify security acceptance. Privileged
containers do not establish it, and stock bundled runtimes do not establish FIPS
validation. EL8 ignores `ProtectClock`, `ProtectHostname`, `ProtectKernelLogs`
and `ProtectProc`. See the [required acceptance checks](BUILD.md#acceptance-status).

## Backup and restore

```sh
sudo heimdall-cli backup -o /root
```

Retain the printed archive securely outside the server. Confirm it contains
`database.sql` and `backend.env`; configuration-only output is not a database
backup. Archives also contain private proxy configuration and certificate/state files
when present, retaining their private permissions. They do not
archive live PostgreSQL data files. Archives are mode `0600`.

Before restoring, securely review the saved configuration and prepare an empty
target database and required role. Restore uses the archived database endpoint;
copying an archive to another host does not redirect that connection. It replays
logical SQL and does not empty an existing database. Older backups without proxy
entries remain supported.

```sh
sudo systemctl stop heimdall-server
sudo heimdall-cli restore /root/heimdall-backup-YYYYMMDD-HHMMSS.tar.gz
sudo heimdall-cli setup --non-interactive
sudo heimdall-cli status
```

Use the actual archive filename. Restore keeps the application stopped pending
successful setup/migrations. Verify data, HTTPS and login before resuming use.
On failure, leave services stopped and repair the cause before retrying against
an empty recovery database; partially applied SQL is not rolled back wholesale.
The CLI restores only Heimdall-owned proxy resources, never an external proxy.

## Upgrading

```sh
sudo heimdall-cli backup
sudo dnf upgrade --setopt=localpkg_gpgcheck=1 ./RPMS/*/heimdall-server-*.rpm
sudo heimdall-cli setup --non-interactive
sudo heimdall-cli status
```

Run from the extracted artifact directory after checking its checksums and
importing its trusted signing key as in [installation](#install-an-rpm).
Select exactly one RPM with a newer application version or, for the same version,
a higher RPM release. The lifecycle tests compare releases `0.3.integration` and
`0.4.integration` of the application version in `VERSION`; a higher release cannot
make an older application version an upgrade. Verify your backup before the
transaction. An active configured installation requires the automatic pre-upgrade
backup to succeed. After a separate verified
backup, the explicit `SKIP_PREUPGRADE_BACKUP=true` sysconfig setting can override
that gate; reset it to false afterward.

The transaction stops only owned services in application/proxy/database order
and writes `/etc/heimdall-server/upgrade-pending`. It does not run schema
migrations or automatically restart the app. Full setup migrates using saved
selections, clears the marker after success and starts selected services.
`--skip-db`, `--reconfigure`, and migration failures leave the marker in place.
The legacy `RESTART_ON_UPGRADE` setting does not bypass this policy.

Configuration uses `%config(noreplace)`; review `.rpmnew` templates while keeping
existing secrets. Runtime patches ship through the next server RPM. A retained
PostgreSQL cluster with an incompatible major blocks the transaction before file
replacement. PostgreSQL major migration requires a separate planned operation.

## Uninstall and recover

Create and verify a backup using [backup and restore](#backup-and-restore), then
remove the installed package by name. The original RPM file is not required:

```sh
sudo heimdall-cli backup -o /root
sudo dnf remove --noautoremove heimdall-server
```

`--noautoremove` keeps dependencies that DNF might otherwise remove as unused.
Removal stops/disables only Heimdall's four units and removes its package files
and host integration. It retains application data, private PostgreSQL data,
private Caddy/Nginx state, backups and accounts. Modified configuration may be
renamed
to `.rpmsave`; keep the verified backup rather than relying on a pathname.
System PostgreSQL and external proxies remain operator-owned.

To recover, reinstall a compatible signed RPM, restore retained configuration
from backup or reviewed `.rpmsave`, and follow the restore/setup sequence above.
Do not initialize over retained database files. Keep data and accounts until
recovery is verified.
