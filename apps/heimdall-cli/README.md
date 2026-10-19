# heimdall-cli

Admin CLI for Heimdall Server installations on Linux. Handles install-time setup (PostgreSQL bootstrap, fapolicyd trust, firewalld, SELinux), day-2 admin (status, reconfigure, backup), and is invoked from `heimdall-server` RPM scriptlets.

## Versioning

heimdall-cli uses independent semver, decoupled from `heimdall-server`. Its
canonical version is [`VERSION`](./VERSION), initially `v0.9.0`. CLI release
tags use `apps/heimdall-cli/vX.Y.Z`; server tags retain `vX.Y.Z`. CLI tags do not
publish server packages, images, Pages, or Iron Bank updates. This release
contract accepts stable versions only. See [`COMPAT.md`](./COMPAT.md) for
server compatibility and pending validation. Maintainers should follow the
[release runbook](./CONTRIBUTING.md#release-process) for verified archives and
independent release drafts.

The server RPM builds this module and its man pages from the same source tree.
Runtime updates ship through a rebuilt server RPM. Standalone archives do not
automatically upgrade an RPM-owned executable.

## Build

From the repository root, using Go 1.26.9:

```sh
make -C apps/heimdall-cli build
make -C apps/heimdall-cli man
```

The binary is written to `apps/heimdall-cli/heimdall-cli`. Within the module,
`make build` uses the same build contract. To select a target and record caller-supplied
provenance:

```sh
make -C apps/heimdall-cli build OUTPUT=/tmp/heimdall-cli \
  GOOS=linux GOARCH=amd64 COMMIT='<revision>' DATE='<ISO-date>'
```

`VERSION` always comes from the module's version file, even if a command-line
variable attempts to override it. `COMMIT` defaults to `development` and `DATE`
to `unknown`; source builds never infer the parent repository's identity.
`heimdall-cli --version` reports the version and provenance. Direct `go run`
uses `dev (commit none, built unknown)`.

Release binaries support `linux/amd64` and `linux/arm64` with `CGO_ENABLED=0`.
macOS can be a development host; Linux is the supported runtime. The optional
`make build-fips` target uses boringcrypto and is outside the release matrix;
it does not establish FIPS certification.

Before a release, validate the scoped tag at the checked-out commit:

```sh
python3 apps/heimdall-cli/scripts/check-release.py apps/heimdall-cli/v0.9.0
```

The validator requires a matching canonical CLI version, a tag pointing to
`HEAD`, and clean CLI source. It prints the version without `v` on success.

## Tests

See [`docs/testing.md`](./docs/testing.md) for the unit / functional / integration / e2e pyramid.

## Bundled RPM setup

The architecture-specific `heimdall-server` RPM includes this CLI, Node.js 22.23.3,
PostgreSQL 18.6 server/client tools, Nginx, and Caddy 2.11.4. Setup does not install or
download runtimes. Base OS libraries and systemd remain prerequisites.

```sh
sudo dnf install ./heimdall-server-*.rpm
sudo heimdall-cli setup --interactive
```

Choose database and proxy ownership independently. Fresh installations default
to `--database-mode bundled --proxy-mode nginx --tls-mode self-signed`.
Database and proxy choices remain independent; an existing database on localhost is still external
when explicitly selected. Managed Nginx serves HTTPS on port 443 with a generated
RSA-4096 certificate. `--proxy-mode bundled` retains Caddy, and `--proxy-mode none`
supports HTTP-only development. Older runtimes retain the Caddy default.
Bundled Caddy supports `--tls-mode acme`, `internal`, or `custom`; custom mode
uses `--tls-cert` and `--tls-key`. External PostgreSQL majors **13–18** are
supported, using the private version-18 clients. Newer servers require a newer
compatible RPM/client; setup and backup refuse them.

Interactive setup displays each backend port, public URL, JWT expiration, and local
certificate lifetime default. **Backend port** uses saved `PORT`, otherwise `3000`.
Set `--port 3456` to override it non-interactively; an explicit
`--port 3000` also overrides a saved custom value. Listener conflicts, incompatible
SELinux assignments, and ports selected for the managed proxy or database are
rejected before any configuration or service changes, including `--reconfigure`.
Interactive setup asks again so you can choose another backend port. Other services
are never stopped or relabeled. Setup reruns and upgrades preserve the accepted
port, and managed proxy upstreams follow it while public HTTPS stays on port 443.

The public URL uses the supplied or saved `EXTERNAL_URL`, then
saved `NGINX_HOST`, and finally `localhost`. Enter accepts the displayed value.
Bare hostnames, IP addresses, and host/port values become HTTPS URLs; the no-TLS
choice uses HTTP. Supplied full HTTP/HTTPS URLs are preserved. JWT expiration (`JWT_EXPIRE_TIME`) defaults to `1d` and
accepts durations such as `25m`; Heimdall caps the effective lifetime at two days.

For locally issued HTTPS certificates, setup asks for the requested lifetime in
whole days (1–365, default `7`) and saves `HEIMDALL_TLS_CERT_DAYS`. ACME, supplied
certificates, external proxies, HTTP, and `--skip-tls` omit this question. Existing
valid matching certificates and CA state are preserved; changes apply to new issuance.
Nginx refuses incomplete, invalid, expired, or hostname-mismatched certificate pairs;
replace both managed certificate files before running setup again. Bundled
Caddy configures its intermediate CA lifetime to allow the requested leaf lifetime
during normal renewal. An existing intermediate CA can temporarily shorten newly
issued certificates until it renews. Standalone Caddy keeps its administrator's
CA configuration, which may likewise limit the requested lifetime. Use interactive
setup again to change the saved lifetime; non-interactive reruns preserve it.

```sh
sudo heimdall-cli setup --non-interactive \
  --database-mode external --proxy-mode nginx --tls-mode self-signed \
  --db-host db.example.com --db-port 5432 --db-user heimdall \
  --db-name heimdall --db-password 'replace-me' \
  --external-url https://heimdall.example.test
```

Saved selections and secrets are reused. Explicit flags override saved settings;
a configured installation without ownership keys defaults to external/external.
`--skip-db` and `--skip-tls` skip work temporarily without changing ownership.
`--dry-run` makes no changes; `--reconfigure` writes settings only. Apply topology
changes with a subsequent full setup. Database ownership changes do not transfer
data. A conflicting listener or SELinux service label requires another port or
an administrator change; the CLI does not stop or relabel its owner.

| Component | Private paths and identity |
| --- | --- |
| Runtime inventory | `/usr/share/heimdall-server/runtime-manifest.json` |
| Node.js | `/usr/libexec/heimdall-server/runtime/node/bin/node` |
| PostgreSQL | `/usr/libexec/heimdall-server/runtime/postgresql/{bin,lib,share}` |
| PostgreSQL state/socket | `/var/lib/heimdall-postgresql/18/data`, `/run/heimdall-postgresql`; account `heimdall-postgres`, default `127.0.0.1:55432` |
| Nginx | `/usr/libexec/heimdall-server/runtime/nginx/sbin/nginx`; account `heimdall-nginx` |
| Nginx config/certificates | `/etc/heimdall-server/nginx/nginx.conf`, `/etc/heimdall-server/nginx/certs/server.crt`, `server.key` |
| Nginx state | `/var/lib/heimdall-nginx`, `/run/heimdall-nginx` |
| Caddy | `/usr/libexec/heimdall-server/runtime/caddy/caddy`; account `heimdall-caddy` |
| Caddy config/state/socket | `/etc/heimdall-server/caddy/Caddyfile`, `/var/lib/heimdall-caddy`, `/run/heimdall-caddy/admin.sock` |
| Saved setup | `/etc/heimdall-server/backend.env` |

Only `heimdall-server`, `heimdall-postgresql`, and `heimdall-caddy` are managed.
`heimdall-cli stop` stops the application only, leaving selected private database
and proxy services running. External services are never administered. Moving
away from a bundled service disables its private unit and preserves its state.
Without the runtime manifest, standalone CLI behavior remains available. An RPM
installation never substitutes ambient clients for missing private executables.

## Upgrade and recovery

Before replacement, the RPM checks the PostgreSQL data major and requires a
successful backup for an active configured installation. An operator who has
made and verified a separate backup can explicitly set
`SKIP_PREUPGRADE_BACKUP=true` in `/etc/sysconfig/heimdall-server`; the default is
`false`. The RPM stops owned services and leaves an `upgrade-pending` marker.
It does not migrate the database or restart the application automatically.

```sh
sudo dnf upgrade ./heimdall-server-*.rpm
sudo heimdall-cli setup --non-interactive
```

Full setup uses saved selections, starts the selected database, applies
migrations, clears `/etc/heimdall-server/upgrade-pending`, and starts the selected
services. Failed migrations, `--skip-db`, and `--reconfigure` retain the marker
and leave the application stopped. Failed application activation stops the app
and restores an upgrade marker if setup removed one. PostgreSQL major upgrades require a separate
planned migration. RPM uninstall retains application/database state, CA keys,
certificates, and service accounts; normal RPM `.rpmsave` rules apply to config.

`heimdall-cli backup` creates a private mode-0600 archive containing a logical
SQL dump and configuration, plus optional `caddy-config/` and `caddy-state/`
entries for owned Caddy configuration and CA/certificate state. It never archives
live PostgreSQL data files. RPM database backups require resolved connection
credentials, including a password from `DATABASE_PASSWORD` or `DATABASE_URL`.
Restore validates the archive before writes, accepts
older archives without Caddy entries, preserves dedicated ownership, and requires
successful setup/migrations before application startup. Restore overwrites the
selected configuration/database; retain a verified backup before recovery.

SELinux relabeling and fapolicyd trust refresh run before private service
activation. Trust covers immutable private executables/libraries and application
native addons, not mutable state. Only newly added TCP labels are recorded in
root-owned mode-0600 `/etc/heimdall-server/selinux-ports`; compatible preexisting
labels stay unowned. Failed ledger updates retain successful additions in
`selinux-ports.pending`; setup reconciles exact matching local labels on retry,
and RPM removal checks both ledgers. Removal affects only owned trust and port records. The
policy uses the existing Heimdall domain and stock PostgreSQL/HTTP domains.
Actual enforcing-host support must be validated on the deployment platform;
stock bundled runtimes do not establish FIPS validation.
