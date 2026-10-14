# Heimdall Server RPM installation

## Install an RPM

Download the Actions artifact for the intended commit that matches the host's
EL major and CPU architecture:
`heimdall-server-rpm-bundle-el{8,9,10}-{x86_64,aarch64}`. For example,
`heimdall-server-rpm-bundle-el10-x86_64` targets Enterprise Linux 10 on Intel/AMD
64-bit CPUs; `aarch64` identifies ARM64. The bundle contains the installable RPM
and the supporting files described in [artifact layout](#artifact-layout).
Extract it into a fresh directory and run the commands below from that directory.
The package does not require Rocky's distribution ID; DNF checks the actual RPM
dependencies on the host.
RHEL and historical minor releases still need candidate-specific validation.

Obtain the artifact and public key from the same trusted workflow run. Each
artifact contains one binary RPM, so the install command works across versions,
EL majors and architectures without editing the filename:

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
├── RPM-TEST-GPG-KEY
├── runtime-manifest.json
└── SHA256SUMS
```

| Path | Purpose |
| --- | --- |
| `RPMS/<arch>/*.rpm` | Signed installable package containing Heimdall and its bundled runtimes. |
| `SRPMS/*.src.rpm` | Signed source package containing sources and the RPM build recipe for rebuilding; not needed for installation. |
| `RPM-TEST-GPG-KEY` | Public test signing key to import before DNF verifies the RPM signature. |
| `runtime-manifest.json` | Inventory of the bundled application runtimes. |
| `SHA256SUMS` | Checksums for both RPMs, the public key and the runtime inventory, calculated after signing. |

Run `sha256sum --check SHA256SUMS` from the extracted artifact's root directory
before installation. Host dependency RPMs are not included.

## Disconnected installation

Provision the [host prerequisites](#requirements) before disconnecting the host,
then transfer the signed RPM and trusted public key. Use the same DNF installation
with repositories disabled to prevent metadata requests:

```sh
sudo rpm --import RPM-TEST-GPG-KEY
sudo dnf --disablerepo='*' install --setopt=localpkg_gpgcheck=1 \
  --setopt=install_weak_deps=False \
  ./RPMS/*/heimdall-server-*.rpm
sudo heimdall-cli setup --interactive
```

DNF reports missing host dependencies; the RPM does not download or install
nested packages. OS dependency RPMs are not included in the artifact.

For a fully disconnected deployment, choose bundled database and proxy services
with internal or custom TLS. This deterministic setup uses internal TLS:

```sh
sudo heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode bundled --tls-mode internal \
  --external-url https://heimdall.example.test
```

Arrange local name resolution and trust the generated public CA certificate at
`/var/lib/heimdall-caddy/data/caddy/pki/authorities/local/root.crt` on clients.
Default bundled-service configuration and internal/custom TLS need no package
downloads. ACME and external services retain their connectivity requirements.

## Requirements

Use a booted EL8/EL9/EL10 systemd host on x86_64 or aarch64 with root/sudo access.
The RPM bundles Node.js 22.23.3, PostgreSQL 18.6, PostgreSQL's ICU libraries, and
Caddy 2.11.4. No NodeSource, PGDG or Caddy repository is needed on the runtime
host. Runtime updates, including private ICU security fixes, arrive in a new
Heimdall RPM.

The host supplies glibc, libgcc, libstdc++, OpenSSL (libraries and command), zlib,
systemd, `policycoreutils-python-utils`, `selinux-policy-targeted`, `tar`,
`gzip`, `util-linux`, `iproute`, `logrotate`, `shadow-utils`, `coreutils`,
`findutils`, `gawk`, `diffutils`, and the standard shell/text utilities. On connected hosts,
DNF can resolve missing prerequisites from approved OS repositories. On
disconnected hosts, these and their dependencies must already be installed at
versions satisfying the candidate RPM. Inspect the exact requirements with
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
| bundled | bundled | Private PostgreSQL and private Caddy |
| bundled | external | Private PostgreSQL and your HTTPS proxy |
| external | bundled | Your database and private Caddy |
| external | external | Your database and HTTPS proxy |

New installations default to bundled/bundled. Explicit flags override saved
values, and saved values override defaults. Configured installations without mode
keys default to external/external and preserve endpoints. Hostname never implies
ownership: `--database-mode external --db-host localhost` is supported.

```sh
# Bundled database and private HTTPS proxy using an internal CA.
sudo heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode bundled --tls-mode internal \
  --external-url https://heimdall.example.com

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

A normal `sudo heimdall-cli setup --non-interactive` rerun preserves credentials,
selections, comments and additional configuration. `--reconfigure` writes config
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
| Caddy | `heimdall-caddy` | `heimdall-caddy` | `/var/lib/heimdall-caddy` |

Runtime executables live under `/usr/libexec/heimdall-server/runtime/`. There
are no global Node, PostgreSQL or Caddy aliases. The inventory is
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
sudo journalctl -u heimdall-server -u heimdall-postgresql -u heimdall-caddy -n 100
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

Use the CLI to change the backend port, for example to port 3003:

```sh
sudo heimdall-cli set-port 3003
sudo heimdall-cli status
```

`set-port` updates the application configuration and selected private proxy
upstream along with host port integration. With bundled Caddy, browser access
continues to use HTTPS on port 443; this command changes the backend port.
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
the fixed RPM runtime or PostgreSQL/Caddy state.

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
backup. New archives also contain `caddy-config/` and `caddy-state/` when present,
including managed certificates/CA state with private permissions. They do not
archive live PostgreSQL data files. Archives are mode `0600`.

Before restoring, securely review the saved configuration and prepare an empty
target database and required role. Restore uses the archived database endpoint;
copying an archive to another host does not redirect that connection. It replays
logical SQL and does not empty an existing database. Older backups without Caddy
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
The CLI restores only Heimdall-owned Caddy resources, never an external proxy.

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
Removal stops/disables only Heimdall's three units and removes its package files
and host integration. It retains application data, private PostgreSQL data,
private Caddy state, backups and accounts. Modified configuration may be renamed
to `.rpmsave`; keep the verified backup rather than relying on a pathname.
System PostgreSQL and external proxies remain operator-owned.

To recover, reinstall a compatible signed RPM, restore retained configuration
from backup or reviewed `.rpmsave`, and follow the restore/setup sequence above.
Do not initialize over retained database files. Keep data and accounts until
recovery is verified.
