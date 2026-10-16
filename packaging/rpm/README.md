# Heimdall Server RPM installation

Install the RPM, then choose interactive or manual configuration. The package
includes private PostgreSQL, Nginx, Caddy and Node.js runtimes; external databases
and HTTPS proxies are also supported.

## Contents

### Installation

- [Requirements](#requirements)
- [Install an RPM](#install-an-rpm)
- [Disconnected installation](#disconnected-installation)
- [Manual installation](#manual-installation)
- [Setup](#setup)

### Configuration and operation

- [Verify and operate](#verify-and-operate)
- [Change configuration](#change-configuration)
- [TLS and external proxies](#tls-and-external-proxies)
- [Authentication](#authentication)

### Maintenance and recovery

- [Backup and restore](#backup-and-restore)
- [Upgrading](#upgrading)
- [Uninstall and recover](#uninstall-and-recover)

### Reference material

- [Private services and data](#private-services-and-data)
- [Host security](#host-security)
- [Artifact layout](#artifact-layout)

## Requirements

- A booted EL8/EL9/EL10 host with systemd running as PID 1, root/sudo access, and
  x86_64 or aarch64 architecture. Match the RPM to the host's EL major and architecture.
- At least 2 GB RAM; 4 GB is preferable for a small deployment. Allow disk space
  for application data, PostgreSQL and backups.
- DNF configured with an approved OS package source for the host's distribution,
  release and architecture: RHEL repositories, an internal mirror or local media.
  The host supplies its kernel, systemd, RPM/DNF, glibc, foundational libraries
  and SELinux policy. OS dependency RPMs are not included in the Heimdall bundle.
- For an external database: PostgreSQL 13–18 and a role permitted to create the
  application schema and run migrations. External services remain operator-managed.

CI tests Rocky Linux. RHEL and older minor/EUS releases need separate
qualification; see [acceptance status](BUILD.md#acceptance-status). DNF resolves
dependencies from the host's configured approved OS source. Inspect exact
requirements with `rpm -qp --requires ./RPMS/*/heimdall-server-*.rpm`.

## Install an RPM

Download `heimdall-server-rpm-bundle-el{8,9,10}-{x86_64,aarch64}` for the intended
commit and host. See [artifact downloads and contents](BUILD.md#ci-artifacts-and-test-signatures).
Extract only that bundle into a fresh directory and run these commands there:

```sh
sha256sum --check SHA256SUMS &&
sudo rpm --import RPM-TEST-GPG-KEY &&
sudo dnf install --setopt=localpkg_gpgcheck=1 \
  ./RPMS/*/heimdall-server-*.rpm &&
rpm -q heimdall-server
```

Obtain the bundle and public key from the same trusted workflow run. Test signing
keys are disposable; production delivery requires a durable signing key. The
shipped repository definition is disabled.

Installation creates accounts and files but does not launch the wizard,
initialize the database or start services. After a successful install, continue
with [setup](#setup) or [manual installation](#manual-installation).

## Disconnected installation

Configure DNF to use an approved internal mirror reachable from the host or a
local-media repository containing the OS dependencies. Use packages for the
host's distribution, release and architecture. Transfer the Heimdall bundle from
a trusted workflow run, then follow [Install an RPM](#install-an-rpm); keep the
configured OS source enabled during installation and upgrades.

Do not proceed after a failed installation or bypass dependency checks with
`rpm --nodeps`.

Then use [setup](#setup) or [manual installation](#manual-installation). Bundled
PostgreSQL with Nginx self-signed TLS, or Caddy internal/custom TLS, requires no
network downloads after installation. Arrange local hostname resolution and
[certificate trust](#tls-and-external-proxies). ACME and external services retain
their connectivity requirements.

## Manual installation

After installing the RPM, edit its template, or create the file at the same path:

```sh
sudoedit /etc/heimdall-server/backend.env
```

For a **new** bundled PostgreSQL/Nginx installation, use the following values,
replacing the hostname:

```dotenv
NODE_ENV=production
PORT=3002
EXTERNAL_URL=https://heimdall.example.com
HEIMDALL_DATABASE_MODE=bundled
HEIMDALL_PROXY_MODE=nginx
HEIMDALL_TLS_MODE=self-signed
DATABASE_HOST=127.0.0.1
DATABASE_PORT=55432
DATABASE_USERNAME=heimdall
DATABASE_NAME=heimdall-server-production
DATABASE_PASSWORD=
JWT_SECRET=
API_KEY_SECRET=
ADMIN_EMAIL=admin@heimdall.local
```

Keep the mode settings explicit. Setup generates the blank secrets; preserve
existing secrets on configured installations. For an external database, supply
its actual endpoint and credentials and select `external` database mode.

Protect the file and apply it without prompts:

```sh
sudo chown root:heimdall /etc/heimdall-server/backend.env
sudo chmod 0640 /etc/heimdall-server/backend.env
sudo heimdall-cli setup --non-interactive
```

Creating the file alone does not initialize the database or start services.
After setup, [verify the service and obtain administrator access](#verify-and-operate).

## Setup

| Command                                     | Behavior                                                       |
| ------------------------------------------- | -------------------------------------------------------------- |
| `sudo heimdall-cli setup --interactive`     | Ask for configuration values in the wizard.                    |
| `sudo heimdall-cli setup --non-interactive` | Use saved values, explicit flags and defaults without prompts. |
| `sudo heimdall-cli setup`                   | Same behavior as non-interactive setup.                        |

All three perform full setup: generate missing secrets, check the database,
run migrations/seeding, configure TLS and host security, and enable/start the
selected services. For a file you edit yourself, use [manual installation](#manual-installation).

Database and proxy ownership are independent:

| Setting           | Choices                                                                             |
| ----------------- | ----------------------------------------------------------------------------------- |
| `--database-mode` | `bundled` (private PostgreSQL, default) or `external`                               |
| `--proxy-mode`    | `nginx` (default), `bundled` (Caddy), `external`, or `none` (HTTP-only development) |
| `--tls-mode`      | `self-signed` for Nginx; `internal`, `acme`, or `custom` for Caddy                  |

For a new installation without prompts:

```sh
sudo heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode nginx --tls-mode self-signed \
  --external-url https://heimdall.example.com
```

Replace the hostname with the address clients use. Fresh RPM installations default
to backend port **3002**; saved and legacy ports remain unchanged. Nginx listens on
**443**; Caddy uses its configured public HTTPS endpoint. Setup rejects listener
or SELinux port conflicts; choose another available backend port if needed.
The selected public HTTPS port must also be available for a managed proxy.

Explicit flags override saved values, which override defaults. Normal reruns
preserve credentials, comments and extra settings. Existing configured files
without mode keys default to external/external; a localhost database is not
assumed to be owned by Heimdall. See [external service examples](BUILD.md#installation-choices).

Use `--dry-run` to preview changes. `--reconfigure` writes configuration only;
full setup is required to apply service changes. `--skip-db` and `--skip-tls`
skip work for that invocation without changing saved ownership.

## Verify and operate

The CLI runs individual commands. `heimdall-cli --help` lists them without
opening setup; the wizard requires `setup --interactive`.

```sh
sudo heimdall-cli status
sudo systemctl status heimdall-server --no-pager
curl -fsS --retry 30 --retry-connrefused --retry-delay 1 \
  --retry-max-time 60 --max-time 5 http://localhost:3002/server
```

`active` means running; `enabled` means configured to start at boot. Successful
setup enables the selected services. `/server` returns startup settings, not
database readiness. Use your configured port if different, then log in and open
stored data to verify database access.

The CLI currently hides the generated administrator password from seeding.
Generate and display a replacement (use your configured email if different):

```sh
sudo heimdall-cli reset-password admin@heimdall.local
```

After initial setup, start a stopped application without the wizard:

```sh
sudo heimdall-cli start
sudo heimdall-cli status
```

`start` is equivalent to `sudo systemctl start heimdall-server`; it does not run
setup or migrations. If the proxy was stopped separately, start it too, for
example with `sudo systemctl start heimdall-nginx`.

For troubleshooting:

```sh
sudo heimdall-cli logs --lines 100
sudo heimdall-cli diag
sudo journalctl -u heimdall-server -u heimdall-postgresql -u heimdall-nginx -u heimdall-caddy -n 100
```

## Change configuration

For application and authentication settings:

```sh
sudoedit /etc/heimdall-server/backend.env
sudo heimdall-cli validate && sudo systemctl restart heimdall-server
```

Keep the file `root:heimdall`, mode `0640`. See the
[configuration reference](man/heimdall-server-backend.env.5.md) for available keys.

To set the backend port, use `sudo heimdall-cli set-port 3002`. This updates host
port integration and the managed proxy's upstream; Nginx remains on 443 and
Caddy retains its configured public HTTPS endpoint.
An external proxy's operator must update its upstream separately.

Change database/proxy ownership through full `setup` with mode flags, not
`config set`. A database mode change does not copy data. CLI path overrides also
require matching systemd configuration; they do not relocate private runtime state.

## TLS and external proxies

Set `EXTERNAL_URL` to the public URL clients use; it also controls login callbacks
and email links. Clients must resolve that hostname and trust its issuing CA.

- **Nginx (default):** generates a self-signed certificate, valid for seven days
  by default (adjustable during interactive setup). Trust
  `/etc/heimdall-server/nginx/certs/server.crt` on clients.
  Setup preserves valid certificates; replace both `server.crt` and `server.key`
  in that directory to renew an expired certificate or change its hostname.
- **Caddy (`--proxy-mode bundled`):** `--tls-mode internal` uses a private CA;
  trust `/var/lib/heimdall-caddy/data/caddy/pki/authorities/local/root.crt` on
  clients. `--tls-mode acme` requires public issuance prerequisites.
  `--tls-mode custom --tls-cert /path/cert.pem --tls-key /path/key.pem` copies
  supplied files into managed storage; rerun with renewed files when replacing them.
- **External proxy:** use `--proxy-mode external`. Forward HTTPS traffic to the
  configured HTTP backend port, preserving host and forwarded protocol/address
  headers. Configure certificates, firewall and upstream yourself, and restrict
  backend network access to the proxy.

Distribute only public certificates, never private keys. For an external database,
configure `DATABASE_SSL` and `DATABASE_SSL_CA` as required and keep certificate
verification enabled.

## Authentication

Configure provider values in `backend.env`, then validate and restart as above.
The configuration reference covers credentials and callback URLs for
[Okta](man/heimdall-server-backend.env.5.md#okta-oidc),
[GitHub](man/heimdall-server-backend.env.5.md#github-oauth),
[GitLab](man/heimdall-server-backend.env.5.md#gitlab-oauth) (request `read_user` scope),
[Google](man/heimdall-server-backend.env.5.md#google-oauth),
[OIDC](man/heimdall-server-backend.env.5.md#generic-oidc) and
[LDAP/Active Directory](man/heimdall-server-backend.env.5.md#ldap).
Use a public HTTPS `EXTERNAL_URL` for production OAuth/OIDC.

Verify external administrator access before setting `LOCAL_LOGIN_DISABLED=true`;
this also disables the initial administrator's password login. Set
`REGISTRATION_DISABLED=true` to disable public registration.

## Backup and restore

```sh
sudo heimdall-cli backup -o /root
```

Store the printed archive securely off-host. Confirm it contains `database.sql`
and `backend.env`; configuration-only output is not a database backup. Archives
are mode `0600` and include private proxy configuration and certificate/state
files when present, not live PostgreSQL data files.

Before restoring, review the archived configuration and prepare an **empty target
database** and required role. Restore uses the **archived database endpoint**;
copying the archive to another host does not redirect it or empty an existing database.

```sh
sudo systemctl stop heimdall-server &&
sudo heimdall-cli restore /root/heimdall-backup-YYYYMMDD-HHMMSS.tar.gz &&
sudo heimdall-cli setup --non-interactive &&
sudo heimdall-cli status
```

Use the actual archive filename. Restore leaves the app stopped until setup
succeeds. Verify data, HTTPS and login before resuming use. On failure, leave
services stopped and repair the cause before retrying against an empty database;
partially applied SQL is not rolled back wholesale. External proxies remain
operator-managed.

## Upgrading

Verify your backup first. From a fresh, verified bundle, select exactly one RPM
with a newer application version or, for the same version, a higher RPM release:

```sh
sudo heimdall-cli backup -o /root &&
sha256sum --check SHA256SUMS &&
sudo rpm --import RPM-TEST-GPG-KEY &&
sudo dnf upgrade --setopt=localpkg_gpgcheck=1 ./RPMS/*/heimdall-server-*.rpm &&
sudo heimdall-cli setup --non-interactive &&
sudo heimdall-cli status
```

An active installation requires the automatic pre-upgrade backup to succeed.
The transaction stops owned services and records `upgrade-pending`; full setup
runs migrations and restarts services. `--skip-db`, `--reconfigure` or failed
migrations leave the marker in place.

Review `.rpmnew` files while preserving existing secrets. PostgreSQL major
migration is a separate operation; an incompatible retained cluster blocks the
upgrade. See [upgrade details](BUILD.md#upgrading-and-recovery) and
[sysconfig controls](man/heimdall-server-sysconfig.5.md).

## Uninstall and recover

Create and verify a backup before removing the package:

```sh
sudo heimdall-cli backup -o /root &&
sudo dnf remove --noautoremove heimdall-server
```

Removal stops/disables Heimdall's services but retains data, private database and
proxy state, backups and accounts. `--noautoremove` retains OS dependencies.
Modified configuration may become `.rpmsave`; rely on your verified backup.
System PostgreSQL and external proxies remain operator-owned.

To recover, reinstall a compatible signed RPM, restore configuration from backup
or reviewed `.rpmsave`, and follow [backup and restore](#backup-and-restore).
Do not initialize over retained database files or delete state before recovery
is verified.

## Reference

### Private services and data

| Component   | Unit                  | State                                  |
| ----------- | --------------------- | -------------------------------------- |
| Application | `heimdall-server`     | `/var/lib/heimdall-server`             |
| PostgreSQL  | `heimdall-postgresql` | `/var/lib/heimdall-postgresql/18/data` |
| Nginx       | `heimdall-nginx`      | `/var/lib/heimdall-nginx`              |
| Caddy       | `heimdall-caddy`      | `/var/lib/heimdall-caddy`              |

Bundled PostgreSQL listens on `127.0.0.1:55432`, with its private socket at
`/run/heimdall-postgresql`. Runtime executables are under
`/usr/libexec/heimdall-server/runtime/`; update them through new Heimdall RPMs.
See the [server manual](man/heimdall-server.8.md#files) for accounts and file paths.

### Host security

Keep SELinux and fapolicyd enabled. Diagnose failures through service logs and
`sudo ausearch -m avc -ts recent`; refresh owned fapolicyd entries with
`sudo heimdall-cli fapolicyd add` when applicable. Stock bundled runtimes do not
establish FIPS validation, and privileged containers do not establish SELinux
acceptance. See [security configuration](security/SECURITY.md) and
[acceptance limits](BUILD.md#acceptance-status).

### Artifact layout

See [bundle contents and downloads](BUILD.md#ci-artifacts-and-test-signatures)
for RPMs, signing keys and manifests. The installed runtime inventory is
`/usr/share/heimdall-server/runtime-manifest.json`. Build instructions and
validation details are in the [build guide](BUILD.md).
