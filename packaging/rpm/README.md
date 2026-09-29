# Heimdall Server RPM

```sh
sudo dnf install ./heimdall-server-*.rpm
sudo heimdall-cli setup --interactive
```

Select one RPM matching the host's EL major and architecture. The RPM contains
Heimdall, its CLI, Node.js 22.23.3, PostgreSQL 18.6, and Caddy 2.11.4. DNF resolves
ordinary OS libraries and systemd from your configured OS repositories. Setup
configures the included runtimes; it does not download runtime packages.

This branch produces **2.13.1 integration candidates**. Releases
`0.3.integration` and `0.4.integration` exercise bundled-runtime upgrades; neither
is an upgrade from application version 2.14.0. Use disposable acceptance hosts
until the [acceptance gates](#acceptance-status) have been completed.

## Installation choices

The wizard independently asks which database and HTTPS proxy to use:

| Database mode | Proxy mode | Services managed by Heimdall |
| --- | --- | --- |
| `bundled` | `bundled` | Private PostgreSQL, application, private Caddy |
| `bundled` | `external` | Private PostgreSQL and application |
| `external` | `bundled` | Application and private Caddy |
| `external` | `external` | Application |

An external PostgreSQL server may run on the same host, including localhost:5432.
Provide an existing database and a role authorized to apply application migrations.
Supported server majors are 13–18; the bundled version-18 clients serve both modes.
Heimdall does not initialize or manage an external server or proxy.

```sh
# Bundled database; HTTPS terminated by an existing proxy.
sudo heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode external \
  --external-url https://heimdall.example.com

# Both services are external. Use disposable/example credentials only as shown.
sudo heimdall-cli setup --non-interactive \
  --database-mode external --proxy-mode external \
  --db-host db.example.com --db-port 5432 --db-user heimdall \
  --db-password '<database-password>' --db-name heimdall-server-production \
  --external-url https://heimdall.example.com
```

Configure an external proxy to forward to the configured application port
(default `http://127.0.0.1:3000`). `--proxy-mode none` retains HTTP-only development
operation. Bundled Caddy supports `--tls-mode acme`, `internal`, or `custom`;
custom mode also takes `--tls-cert` and `--tls-key`. Internal CA operation does not
need internet after the RPM and OS dependencies are installed; clients must trust
its root certificate. ACME requires the appropriate public connectivity.

Flags override saved selections; saved selections override fresh defaults
(`bundled`/`bundled`). Existing configured installations without mode keys default
to `external`/`external`, preserving their endpoints. Reruns retain secrets,
selections and custom settings. `--skip-db` and `--skip-tls` skip work for that run;
they do not select ownership. `--reconfigure` only writes configuration. Apply
mode changes with a subsequent full setup, not `config set`. Switching databases
does not move data. See [INSTALL.md](INSTALL.md) for TLS, recovery and operations.

## Local builds

Run on native EL8 or EL9, x86_64 or aarch64, from the repository root:

```sh
make -C packaging/rpm deps TOPDIR="$HOME/rpmbuild-heimdall"
export PATH="/opt/heimdall-build/go-1.25.8/bin:$PATH"
make -C packaging/rpm rpm SOURCE_MODE=head TOPDIR="$HOME/rpmbuild-heimdall" \
  HEIMDALL_RELEASE=0.3.integration
bash packaging/rpm/tests/cli-inputs.sh "$HOME/rpmbuild-heimdall"
```

`RPMS/<arch>/` contains the binary and `SRPMS/` the source RPM under that TOPDIR.
Use the same TOPDIR for staging, lint and inspection. The wrapper
`./packaging/rpm/setup-rpm-build-env.sh --dev --build` provides the same Make path.
Local builds are unsigned until explicitly signed.

For a filtered workspace build, including relevant uncommitted changes:

```sh
for release in 0.3.integration 0.4.integration; do
  docker build --platform linux/arm64 -f packaging/rpm/Dockerfile.ol8 \
    --build-arg "HEIMDALL_RELEASE=$release" --target artifacts \
    --output "type=local,dest=packaging/rpm/dist/bundled-arm64/$release" .
done
```

On a memory-constrained builder, add
`--build-arg NODE_OPTIONS=--max-old-space-size=2048 --build-arg VUE_BUILD_WORKERS=1`
to each Docker command. This limits each Node process's V8 old-space heap to
2048 MiB and sets Vue's parallel worker count to one. `VUE_BUILD_WORKERS` accepts
positive integers. Both arguments are optional; omitting them preserves the
default build behavior. Production minification and type checking remain enabled.

Use `linux/amd64` and a separate output directory for x86_64. A platform flag on
a different host architecture uses emulation; CI uses native runners. Docker
exports `RPMS/`, `SRPMS/` and the runtime inventory. Its build-specific ignore file
excludes Git metadata, secrets, caches, execution scratch and prior outputs. If
needed, pass `--secret id=corp_ca,src=/path/to/ca-bundle.crt` for a corporate CA.
Keep TLS and signature verification enabled.

### Build inputs and updates

- `VERSION`, the spec and application manifests must agree. Increase the real
  application version for application upgrades; an RPM release cannot make
  2.13.1 newer than 2.14.0.
- `SOURCE_MODE=head` archives clean committed inputs. Relevant dirty files fail
  validation. `SOURCE_MODE=release` additionally requires HEAD at the version tag.
- `heimdall-cli.repo` and `heimdall-cli.ref` select a fetchable full immutable CLI
  commit. Binary and generated man pages come from that same clean checkout.
- `runtime-lock.json` records runtime versions, archive URLs, SHA-256 digests and
  notices. Runtime patch updates change the lock and ship in a new server RPM.
- Go 1.25.8 builds the CLI; Yarn Classic 1.22.22 installs frozen application
  dependencies. Native addons use the exact private Node executable being shipped.
- Source23–28 contain the runtime archives, selected manifest and private units.
  An SRPM rebuild uses these supplied runtime inputs. Yarn dependency downloads
  still require network. Build on the SRPM's target architecture.

To test an SRPM independently on a provisioned native EL build host:

```sh
bash packaging/rpm/tests/srpm-rebuild.sh \
  "$HOME/rpmbuild-heimdall/SRPMS/heimdall-server-2.13.1-0.3.integration.el8.src.rpm" \
  /tmp/heimdall-clean-srpm-rebuild
```

The second path must not exist. Run with privileges to install declared
BuildRequires via `dnf builddep`. The helper verifies supplied runtime hashes,
rebuilds in the empty tree and checks the resulting binary payload. Rebuilt
binaries need their own signature.

## CI artifacts and test signatures

The existing Build RPM workflow produces four native Rocky build/install bundles:
`rpm-el8-x86_64`, `rpm-el8-aarch64`, `rpm-el9-x86_64`, and `rpm-el9-aarch64`.
Each contains a binary RPM, SRPM, `RPM-TEST-GPG-KEY`, `runtime-manifest.json`, and
`SHA256SUMS`. Checksums are computed **after** test signing changes the RPM bytes.

Open the repository's **Actions → Build RPM**, select a completed successful run
for the intended commit, and download the matching artifact. With GitHub CLI:

```sh
gh run download RUN_ID --repo mitre/heimdall2 \
  --name rpm-el8-x86_64 --dir /tmp/heimdall-candidate
cd /tmp/heimdall-candidate
sha256sum --check SHA256SUMS
sudo rpm --import RPM-TEST-GPG-KEY
sudo dnf install --setopt=localpkg_gpgcheck=1 \
  ./RPMS/x86_64/heimdall-server-2.13.1-0.4.integration.el8.x86_64.rpm
sudo heimdall-cli setup --interactive
```

Replace `RUN_ID` with the verified run ID. Artifact retention is seven days.
The public key must come from that same trusted run. The signer uses disposable
acceptance keys and deletes its private key. These are not durable distribution
signatures. The configured RPM repository remains disabled; repository hosting
and production signing are separate release work. The existing publication guard
rejects integration RPMs.

### Acceptance signing

For locally built candidates, sign the binaries and any SRPMs you distribute:

```sh
base=packaging/rpm/dist/bundled-arm64
bash packaging/rpm/tests/sign-rpms.sh linux/arm64 "$base/RPM-TEST-GPG-KEY" \
  "$base/0.3.integration/RPMS/aarch64/heimdall-server-2.13.1-0.3.integration.el8.aarch64.rpm" \
  "$base/0.4.integration/RPMS/aarch64/heimdall-server-2.13.1-0.4.integration.el8.aarch64.rpm" \
  "$base/0.3.integration/SRPMS/heimdall-server-2.13.1-0.3.integration.el8.src.rpm" \
  "$base/0.4.integration/SRPMS/heimdall-server-2.13.1-0.4.integration.el8.src.rpm"
export RPM_TEST_GPG_KEY="$PWD/$base/RPM-TEST-GPG-KEY"
bash packaging/rpm/tests/run-lifecycle.sh linux/arm64 \
  "$base/0.3.integration/RPMS/aarch64/heimdall-server-2.13.1-0.3.integration.el8.aarch64.rpm" \
  "$base/0.4.integration/RPMS/aarch64/heimdall-server-2.13.1-0.4.integration.el8.aarch64.rpm"
```

Set `RPM_TEST_CA` to your corporate CA file if the fixture builder needs it.
The runner records evidence under `packaging/rpm/dist/integration/evidence/` and
cleans up its containers, including on failure. An optional `RPM_TEST_PREVIOUS_RPM`
adds a separate upgrade from a preceding package; its signature must verify
against `RPM_TEST_GPG_KEY` as well.

## Upgrading and recovery

```sh
sudo heimdall-cli backup
sudo dnf upgrade ./heimdall-server-*.rpm
sudo heimdall-cli setup --non-interactive
sudo heimdall-cli status
```

Verify the backup first and select exactly one upgrade RPM. The transaction
requires a successful pre-upgrade backup for an active installation, stops owned
services, and leaves the application stopped pending migrations. Full setup uses
saved selections and starts services only after migration succeeds.
`SKIP_PREUPGRADE_BACKUP=true` in sysconfig is an explicit override after a separate
verified backup. `RESTART_ON_UPGRADE` does not bypass the migration gate.

Configuration uses `%config(noreplace)`; review `.rpmnew` files without replacing
existing secrets. Backup includes logical SQL, configuration and private Caddy
certificate/CA state. PostgreSQL major upgrades require a separate migration;
package upgrades reject a mismatched retained cluster major. Removal retains
application, database and certificate state and accounts. See
[backup and restore](INSTALL.md#backup-and-restore) before recovering.

## Private paths

| Purpose | Path / service |
| --- | --- |
| Application | `/usr/share/heimdall-server`, `heimdall-server.service` |
| Node | `/usr/libexec/heimdall-server/runtime/node/bin/node` |
| PostgreSQL tools | `/usr/libexec/heimdall-server/runtime/postgresql/bin/` |
| PostgreSQL data / socket | `/var/lib/heimdall-postgresql/18/data`, `/run/heimdall-postgresql` |
| PostgreSQL listener / owner | `127.0.0.1:55432`, `heimdall-postgres`, `heimdall-postgresql.service` |
| Caddy | `/usr/libexec/heimdall-server/runtime/caddy/caddy`, `heimdall-caddy.service` |
| Caddy config / state | `/etc/heimdall-server/caddy/Caddyfile`, `/var/lib/heimdall-caddy` |
| Caddy admin | `/run/heimdall-caddy/admin.sock` |
| Inventory / notices | `/usr/share/heimdall-server/runtime-manifest.json`, `/usr/share/licenses/heimdall-server/` |
| App configuration | `/etc/heimdall-server/backend.env` (`root:heimdall`, `0640`) |
| Service configuration | `/etc/sysconfig/heimdall-server` (`root:root`, `0640`) |

No global `node`, `psql` or `caddy` alias is installed. RPM-owned runtime paths
are fixed; CLI path overrides alone do not relocate the installed units or data.

## Acceptance status

The [September 28 report](../../docs/superpowers/reports/2026-09-28-rpm-integration-acceptance.md)
applies to the preceding unbundled commit only. Bundled-runtime checks require
new candidates, native EL8/EL9 build/install/SRPM evidence, both native OL8 lifecycle
runs, four fresh deployment combinations, offline setup, coexistence and recovery.
Do not treat the workflow definition as a completed run.

SELinux/fapolicyd runtime acceptance requires an actual enforcing OL8 host.
Privileged containers and policy compilation cannot establish it. Stock bundled
runtimes do not establish FIPS validation. EL8 systemd ignores four newer
hardening directives (`ProtectClock`, `ProtectHostname`, `ProtectKernelLogs`,
`ProtectProc`); CI exposes those warnings and rejects other unit diagnostics.
