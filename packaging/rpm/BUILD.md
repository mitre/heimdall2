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
until the [acceptance gates](../../docs/superpowers/reports/2026-09-29-bundled-rpm-acceptance.md)
have been completed.

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
does not move data. See [README.md](README.md) for TLS, recovery and operations.

## Local builds

Use a native EL8, EL9 or EL10 build host, x86_64 or aarch64, with Bash, DNF,
configured OS repositories, internet access, and root or sudo privileges.
Minimal containers may not include `make`. Install the bootstrap packages first
(omit `sudo` if already running as root):

```sh
sudo dnf install -y make curl ca-certificates python3
```

`make` is required to invoke the dependency target; `curl` and CA certificates
support HTTPS downloads. Python 3 is also needed by the build-environment wrapper.
If HTTPS downloads fail with `self signed certificate in certificate chain`,
follow [Corporate CA certificates](#corporate-ca-certificates) before continuing.
Then, from the repository root, install the remaining build dependencies:

```sh
make -C packaging/rpm deps TOPDIR="$HOME/rpmbuild-heimdall"
```

This runs [the dependency setup script](scripts/setup-build-deps.sh), which
configures build repositories, runs `dnf update`, and installs GCC/G++, development
libraries, Git, Python (including Python 3.9 on EL8), RPM build tools, SELinux and
systemd build macros, archive tools, Node.js 22, Yarn Classic 1.22.22, and Go
1.25.8. Yarn must be installed as an RPM to satisfy the RPM build requirements;
an npm-global or Corepack installation alone is insufficient. The script handles
root versus sudo automatically.

After dependency installation succeeds, build the RPM from the current files.
A clone or downloaded source archive works; no Git commits or tags are required:

```sh
export PATH="/opt/heimdall-build/go-1.25.8/bin:$PATH"
make -C packaging/rpm rpm TOPDIR="$HOME/rpmbuild-heimdall" \
  HEIMDALL_RELEASE=0.3.integration
```

Run the CLI artifact check only after the build succeeds. It checks generated
files; it does not install dependencies or build them:

```sh
bash packaging/rpm/tests/cli-inputs.sh "$HOME/rpmbuild-heimdall"
```

`RPMS/<arch>/` contains the binary and `SRPMS/` the source RPM under that TOPDIR.
Use the same TOPDIR for staging, lint and inspection. The wrapper
`./packaging/rpm/setup-rpm-build-env.sh --build` provides the same Make path.
Local builds are unsigned until explicitly signed.

To build the current files using Docker:

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

### x86_64 builds under QEMU

When building an x86_64 RPM in a container on an ARM host, QEMU can crash while
loading Nx's native module during `yarn install`. The failure reports `SIGSEGV`
in `node_modules/nx`, followed by RPM's `Bad exit status ... (%build)`.
For this emulation failure, set QEMU's guest base address before retrying inside
the build container:

```sh
export QEMU_GUEST_BASE=0x800000000000
make -C packaging/rpm rpm TOPDIR="$HOME/rpmbuild-heimdall" \
  HEIMDALL_RELEASE=0.3.integration
```

For `Dockerfile.ol8`, pass `--build-arg QEMU_GUEST_BASE=0x800000000000` to
`docker build`. Native builds do not need this workaround. Keep dependency
install scripts enabled; they also compile the application's native addons.

### Corporate CA certificates

To accept both public certificates and certificates signed by your organization's
CA, add the organization's CA to the existing system trust store. Obtain the CA
certificate or PEM CA bundle from your IT team. On the EL8/EL9 host or inside the
container where `make deps` runs (omit `sudo` when already root):

```sh
sudo install -m 0644 /path/to/organization-ca.crt \
  /etc/pki/ca-trust/source/anchors/heimdall-build-ca.crt
sudo update-ca-trust extract
curl -fsSL -o /dev/null https://rpm.nodesource.com/setup_22.x
make -C packaging/rpm deps TOPDIR="$HOME/rpmbuild-heimdall"
```

This adds trust alongside the public roots; it does not replace the CA bundle or
disable certificate verification. Curl, DNF, Git, Go and Python use the system
trust store by default on these hosts. The RPM build already configures Node/Yarn
to use this bundle through `NODE_EXTRA_CA_CERTS`.

For builds using `Dockerfile.ol8`, add the existing secret option to your
`docker build` command instead:

```sh
--secret id=corp_ca,src=/path/to/organization-ca.crt
```

The Dockerfile installs the CA before downloading dependencies. Trust configured
on the Docker host does not automatically carry into the build container. This
resolves trust for the supplied CA; unrelated self-signed certificates still fail
verification. See [Red Hat's shared system certificate documentation](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/8/pdf/securing_networks/securing-networks.pdf).

### Build inputs and updates

- `VERSION`, the spec and application manifests must agree. Increase the real
  application version for application upgrades; an RPM release cannot make
  2.13.1 newer than 2.14.0.
- `SOURCE_MODE=workspace` is the default. It includes local source changes and
  excludes Git metadata, environment files, certificates, caches and build outputs.
  Git history is not required for the downloaded Heimdall source tree.
- For an explicit build from Git, `SOURCE_MODE=head` archives clean committed
  inputs. `SOURCE_MODE=release` additionally requires HEAD at the version tag.
  CI selects these stricter modes explicitly.
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

The Build RPM workflow builds and install-checks Rocky Linux 8, 9 and 10 and
Oracle Linux 10 on x86_64 and aarch64. Its eight bundles use
`rpm-{el8,el9,el10,ol10}-{x86_64,aarch64}` names. Oracle Linux 10 packages use
the `.ol10` RPM distribution tag to keep their filenames distinct from Rocky's
`.el10` packages.
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
[backup and restore](README.md#backup-and-restore) before recovering.
