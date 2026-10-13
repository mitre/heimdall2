# Heimdall Server RPM

```sh
sudo dnf install ./heimdall-server-*.rpm
sudo heimdall-cli setup --interactive
```

Select one RPM matching the host's EL major and architecture. The RPM contains
Heimdall, its CLI, Node.js 22.23.3, PostgreSQL 18.6, and Caddy 2.11.4. DNF resolves
ordinary OS libraries and systemd from your configured OS repositories. Setup
configures the included runtimes; it does not download runtime packages.

The application version comes from the root [`VERSION`](../../VERSION) file.
Releases `0.3.integration` and `0.4.integration` exercise bundled-runtime upgrades
within that version. This standalone packaging branch has no completed runtime
acceptance yet. Use disposable hosts until the [acceptance checks](#acceptance-status)
have passed for the exact candidate source and artifacts.

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

- Root `VERSION` is the application version source, with an optional leading `v`
  removed for RPMs. The backend and frontend manifests must match it. Make,
  Docker and CI derive the package version automatically; do not edit the spec
  version or pass a separate version override. `make -C packaging/rpm render-spec`
  writes a resolved spec under `TOPDIR/SPECS`; staging preserves both the version
  and release in the SRPM for standalone rebuilds. Increase `VERSION` and the
  matching application manifests for application upgrades; a higher RPM release
  cannot make an older application version an upgrade.
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
heimdall_version=$(sed -e 's/[[:space:]]//g' -e 's/^v//' VERSION)
bash packaging/rpm/tests/srpm-rebuild.sh \
  "$HOME/rpmbuild-heimdall/SRPMS/heimdall-server-${heimdall_version}-0.3.integration.el8.src.rpm" \
  /tmp/heimdall-clean-srpm-rebuild
```

Run this example from the repository root and adjust the release and distribution
tag to match your SRPM. The second path must not exist. Run with privileges to
install declared BuildRequires via `dnf builddep`. The helper verifies supplied runtime hashes,
rebuilds in the empty tree and checks the resulting binary payload. Rebuilt
binaries need their own signature.

## CI artifacts and test signatures

The Build RPM workflow defines builds and install checks for Rocky Linux 8, 9
and 10 on x86_64 and aarch64. It uses the maintained
`rockylinux/rockylinux:{8,9,10}` images. Its six artifacts use
`rpm-{el8,el9,el10}-{x86_64,aarch64}` names. Oracle Linux 8 lifecycle jobs publish
`rpm-ol-el8-{x86_64,aarch64}` artifacts. Each contains one complete installation
archive and its `.sha256` sidecar. The archive includes the signed application
RPM, dependency RPMs, public keys, `runtime-manifest.json`, installer, and
internal `SHA256SUMS`. Checksums are computed **after** test signing changes the
RPM bytes. The earlier Oracle candidate remains an internal lifecycle fixture.

Open the repository's **Actions → Build RPM**, select a completed successful run
for the intended commit, and download the matching artifact. With GitHub CLI:

```sh
gh run download RUN_ID --repo mitre/heimdall2 \
  --name rpm-el8-x86_64 --dir /tmp/heimdall-candidate
cd /tmp/heimdall-candidate
sha256sum --check heimdall-rocky-el8-x86_64-*.tar.gz.sha256
tar -xzf heimdall-rocky-el8-x86_64-*.tar.gz
cd heimdall-rocky-el8-x86_64-*/
sha256sum --check SHA256SUMS
sudo bash ./install.sh
sudo heimdall-cli setup --interactive
```

Replace `RUN_ID` with the verified run ID and use a fresh download directory.
This example targets Rocky Linux 8 x86_64. Artifact retention is seven days.
The public key must come from that same trusted run. The signer uses disposable
acceptance keys and deletes its private key. These are not durable distribution
signatures. The configured RPM repository remains disabled; repository hosting
and production signing are separate release work. The existing publication guard
rejects integration RPMs.

### Producing an offline archive

Run collection as root on a connected native EL8, EL9 or EL10 producer with
DNF4, RPM/rpmkeys, Python 3.6 or newer, GnuPG, `createrepo_c`, Bash, GNU tar and
coreutils. Build and finally sign the Heimdall RPM first. Collection verifies
that signature and retains the original signatures of the OS dependency RPMs;
never send those dependency packages through the Heimdall signing script.
The same empty-root solve includes DNF and RPM so the archive supplies matching
installer libraries and Python RPM bindings when dependency updates require them.
The target installer still requests only the exact Heimdall candidate; DNF selects
the necessary dependency updates from the local repository.
The target architecture comes from the native producer and must match the RPM
and `SOURCES/runtime-manifest.json` created by the application build.

Before installing build tools that add repositories, preserve the distribution's
approved BaseOS/AppStream repository definitions, required non-secret files from
`/etc/dnf/vars` or `/etc/yum/vars`, and the public signing keys owned by its release
packages. Use isolated directories containing only these selected inputs. An
empty variables directory is valid. Record the exact enabled repository IDs;
the collector disables every repository before enabling this explicit list.
Do not enable EPEL, NodeSource or another vendor to repair a failed solve.
CI captures Rocky inputs before `make deps` and builds Oracle Linux bundles in
a separate matching Oracle producer after the candidates have been signed.

For example, run from the repository root, with the exact signed candidate
and approved source directories selected by the operator:

```sh
make -C packaging/rpm offline TOPDIR=/tmp/heimdall-rpmbuild \
  OFFLINE_RPM=/tmp/heimdall-rpmbuild/RPMS/x86_64/heimdall-server-2.14.0-0.4.integration.el8.x86_64.rpm \
  OFFLINE_REPOSDIR=/tmp/heimdall-offline-sources \
  OFFLINE_VARSDIR=/tmp/heimdall-offline-vars \
  OFFLINE_REPOS='baseos appstream' OFFLINE_RELEASEVER=8 \
  OFFLINE_OS_KEY_DIR=/tmp/heimdall-offline-os-keys \
  OFFLINE_HEIMDALL_KEY=/tmp/heimdall-rpmbuild/RPM-TEST-GPG-KEY
```

All paths are absolute, and `TOPDIR` must remain outside the source tree so
source packaging cannot include staged offline artifacts. `OFFLINE_RPM` is one
finally signed binary RPM, never a glob. `OFFLINE_OS_KEY_DIR` contains only
approved OS public-key regular files. Collection passes each as a separate
`--os-key` argument, so paths with spaces work. `OFFLINE_REPOS` is a
whitespace-separated list of repository IDs. Use the explicit EL major or a
matching minor release value required by an approved repository snapshot as
`OFFLINE_RELEASEVER`. No application build or signing target runs here.

The equivalent direct collector invocation uses a fresh, absent output path
with an existing parent:

```sh
python3 packaging/rpm/scripts/stage-offline.py \
  --rpm /tmp/heimdall-rpmbuild/RPMS/x86_64/heimdall-server-2.14.0-0.4.integration.el8.x86_64.rpm \
  --runtime-manifest /tmp/heimdall-rpmbuild/SOURCES/runtime-manifest.json \
  --reposdir /tmp/heimdall-offline-sources --varsdir /tmp/heimdall-offline-vars \
  --repo baseos --repo appstream --releasever 8 \
  --os-key /tmp/heimdall-offline-os-keys/RPM-GPG-KEY-Rocky-8 \
  --heimdall-key /tmp/heimdall-rpmbuild/RPM-TEST-GPG-KEY \
  --output /tmp/heimdall-rpmbuild/offline-bundle
```

Repeat `--repo` and `--os-key` for each approved input. Compare the full primary
fingerprints shown by `gpg --show-keys --with-fingerprint KEY_FILE` with the
trusted distribution authority and Heimdall release authority before collecting.
The manifest records these fingerprints, public-key hashes, downloaded
`repomd.xml` hashes, the producer version and every package's NEVRA, vendor,
source RPM and SHA-256. This identifies the actual source snapshot without
shipping its URLs or credentials.

Make emits one archive path under `TOPDIR/OFFLINE`, named
`heimdall-DISTRO-elMAJOR-ARCH-VERSION-RELEASE.tar.gz`, and a same-name
`.sha256` sidecar. Existing names are refused; use a fresh build tree for another
collection. The archive contains exactly one matching top-level directory with
`repo/Packages`, `repo/repodata`, exported public keys, `target`, `heimdall-nevra`,
`offline-manifest.json`, the unchanged `runtime-manifest.json`, `install.sh`,
`README.txt` and internal `SHA256SUMS`. It contains no producer repository
configuration, subscription certificates, authentication material or private keys.
The application RPM retains runtime license notices. The SRPM is built and
rebuilt in CI for validation and remains under `TOPDIR/SRPMS`; it is not uploaded.

```sh
python3 packaging/rpm/tests/offline-inputs.py
git diff --check
tar -tzf "$OFFLINE_ARCHIVE"
(cd "$(dirname "$OFFLINE_ARCHIVE")" && sha256sum -c "$(basename "$OFFLINE_ARCHIVE").sha256")
```

Set `OFFLINE_ARCHIVE` to the single path emitted by Make. Extract into a fresh
inspection directory, check the internal `SHA256SUMS`, public-key fingerprints
and inventory, and query all RPM architectures to confirm they match the target
or are `noarch`. Use the same distribution and a compatible vendor/repository
snapshot on the target. Current major-version repositories can contain newer
packages than historical minor images; arbitrary historical minor or RHEL EUS
compatibility is not established. Collection or installation failures require a
matching approved source snapshot; do not force conflicting package replacements.

RHEL installation media or approved internal mirrors can supply the required
packages without registering the disconnected target. On RHEL, Oracle Linux or
AlmaLinux, supply that distribution's own repositories, variables and keys.
Rocky archives are labelled `rocky` and cannot establish RHEL compatibility.
Use the vendor's existing approved artifact destination; never automatically
publish protected vendor RPMs or archives to a public release.

CI uploads only the complete archives and sidecars under the `rpm-*` artifact
names above, with seven-day retention. Release handling checks their sidecars
and rejects integration releases by inspecting the bundled Heimdall RPM. It
attests and attaches whole archives and sidecars; it never publishes OS
dependencies as individual release assets. Test logs remain in the workflow
output; evidence directories are not uploaded as artifacts.
Stable publication still requires durable signing and candidate-specific offline
and enforcing-SELinux acceptance evidence; attestations are not RPM signatures.

### Disconnected native acceptance driver

Pull a matching maintained base image on the connected outer host, then supply
one archive and its adjacent `.sha256` sidecar. A second complete bundle from a
newer candidate enables the upgrade, removal and recovery assertions:

```sh
docker pull --platform linux/arm64 oraclelinux:8
bash packaging/rpm/tests/run-offline.sh linux/arm64 oraclelinux:8 \
  /approved/heimdall-ol-el8-aarch64-VERSION-FIRST-RELEASE.tar.gz \
  /approved/heimdall-ol-el8-aarch64-VERSION-SECOND-RELEASE.tar.gz
```

The host needs Bash, Python 3.6+, Git, Docker and `shasum`. For the unsigned
rejection fixture, install `rpmsign` on the outer host or set
`HEIMDALL_OFFLINE_UNSIGNED_RPM` to an unsigned copy prepared by the connected
producer. No target bootstrap runs. The driver requires a native matching Docker
daemon and an already pulled image, verifies archive sidecars, rejects unsafe
archive entries, and copies files with `docker cp` so host bind-mount policy
cannot alter the proof.

Every negative case starts in its own fresh `--network=none` target. Closure
verification runs separately from installation. The pristine installed target
must pass `rpm -V`, runtime execution and installer idempotence before it is
committed and booted with systemd. The lifecycle fixture seeds its known test
administrator before the first real setup. Bundled Node then checks HTTP200 JSON
within 60 seconds; private psql verifies every migration, and the target loader
checks its native ELF files before authenticated inspection. The maintained
Rocky 8/9/10 and Oracle 8 images already provide curl and ldd. A future image
missing curl fails with a test prerequisite after unassisted setup; supply a
separate signed test-only local repository at that point, never add it to the
shipped bundle.

Evidence under `packaging/rpm/dist/offline/evidence/` records input hashes,
source status, OS/architecture, network mode, initial/final RPM inventories,
transaction statuses/logs, readiness, migrations, loader checks and service
journals. Cleanup removes only the driver's containers, temporary files and
committed test image and its two owned volumes. Systemd uses image-populated
volumes at `/var/lib` and `/etc/heimdall-server` so the existing restore's atomic
directory renames share a filesystem; Docker overlayfs lower directories reject
those renames with `EXDEV`. Volume names and mounts are recorded. A Docker
restart checks container persistence; it cannot
establish full host reboot or enforcing SELinux acceptance.

`RPM_TEST_OFFLINE_BUNDLE` is the optional absolute bundle directory inside the
existing lifecycle target. It must match the candidate RPM's NEVRA. Initial
installation uses the first bundle and signing key; upgrade and recovery use
the second bundle and its signing key. The original signature, unsafe-upgrade,
backup, migration-gate, sentinel, secrets and private-CA assertions still run.
The Oracle lane also builds a separate disposable candidate pair whose second
spec requires `tree`. Its fresh disconnected target proves tree absent before
and after the first install, then installs the genuinely Oracle-signed package
from the second complete closure. Those fixtures never alter the application
spec or become release assets.

The six public Rocky offline jobs cover initial installation, internal TLS,
authenticated readiness, database, backup/restore and container restart. They
receive one release each and therefore do **not** establish offline upgrade or
removal/recovery acceptance for Rocky. The two native Oracle 8 jobs receive both
bundles and run those additional checks. The public release depends on all
these jobs; their workflow definitions alone do not show a successful run.

### Acceptance signing

For locally built candidates, run from the repository root to sign the binaries
and any SRPMs you distribute:

```sh
heimdall_version=$(sed -e 's/[[:space:]]//g' -e 's/^v//' VERSION)
base=packaging/rpm/dist/bundled-arm64
bash packaging/rpm/tests/sign-rpms.sh linux/arm64 "$base/RPM-TEST-GPG-KEY" \
  "$base/0.3.integration/RPMS/aarch64/heimdall-server-${heimdall_version}-0.3.integration.el8.aarch64.rpm" \
  "$base/0.4.integration/RPMS/aarch64/heimdall-server-${heimdall_version}-0.4.integration.el8.aarch64.rpm" \
  "$base/0.3.integration/SRPMS/heimdall-server-${heimdall_version}-0.3.integration.el8.src.rpm" \
  "$base/0.4.integration/SRPMS/heimdall-server-${heimdall_version}-0.4.integration.el8.src.rpm"
export RPM_TEST_GPG_KEY="$PWD/$base/RPM-TEST-GPG-KEY"
bash packaging/rpm/tests/run-lifecycle.sh linux/arm64 \
  "$base/0.3.integration/RPMS/aarch64/heimdall-server-${heimdall_version}-0.3.integration.el8.aarch64.rpm" \
  "$base/0.4.integration/RPMS/aarch64/heimdall-server-${heimdall_version}-0.4.integration.el8.aarch64.rpm"
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

## Acceptance status

The [historical bundled-runtime report](https://github.com/mitre/heimdall2/blob/5486a8b7f26da3ea90635f970e8b983142cdb0b8/docs/superpowers/reports/2026-09-29-bundled-rpm-acceptance.md)
records acceptance of earlier source and artifacts. It does not certify this
standalone branch or packages built from the current `VERSION`.

The 2026-10-12 native Oracle Linux 8.10/aarch64 disconnected run passed for
actual Heimdall 2.14.0 application source
`0c87a76c55981d035aa61e58c9f27e55a78468c4`, with releases
`0.4.integration.el8` and `0.5.integration.el8`. Both archives contain 191 RPMs.
Their SHA-256 values are, respectively:

```text
9840ebef94de7ede645a9bc810ba4e2657d5fd65c08813f68da16652ddc2ef7f
35786c0bd6bddef01c03e23a7564e1ef00ff823d208b27685ba0fb9512fe8067
```

The local [run result](dist/offline/evidence/heimdall-offline-arm64-67063-23066/result.txt),
[input record](dist/offline/evidence/heimdall-offline-arm64-67063-23066/inputs.txt),
[transaction/lifecycle log](dist/offline/evidence/heimdall-offline-arm64-67063-23066/output.log),
[command statuses](dist/offline/evidence/heimdall-offline-arm64-67063-23066/command-status.log)
and [systemd target](dist/offline/evidence/heimdall-offline-arm64-67063-23066/services-container.json)
record the executed proof. It includes all 21 rejection cases on fresh targets,
empty-root closure, pristine install and idempotence, unassisted internal TLS,
HTTP200 JSON, 28 migrations, 69 native ELF loader checks, authenticated access,
unsafe-upgrade/backup refusal, migration failure gating, real upgrade, container
restart, backup/restore, removal and sentinel/secrets/private-CA recovery. No
inspection tools were added to the targets. The separate
[new-dependency result](dist/offline/evidence/dependency/output.log) proves the
second 18-RPM fixture bundle supplies original Oracle
`tree-1.7.0-15.el8.aarch64`, absent from the first 17-RPM closure and its target.
These evidence paths are local generated output; CI does not upload evidence
artifacts. Preserve candidate evidence in an approved durable store before
claiming release acceptance.

The [post-setup RPM verification](dist/offline/evidence/heimdall-offline-arm64-67063-23066/rpm-after-setup.verify)
contains only changed `backend.env` content/time and mode changes for
`/var/lib/heimdall-server` and `/var/log/heimdall-server`. The pinned CLI
`d92ed3550e87d73db083827a8c38d22cff47765f` hardens those directories to
`heimdall:heimdall:0750`; the existing unit's `StateDirectory` and `LogsDirectory`
defaults set them to `0755` when services start. The driver verifies both mode
properties, actual `heimdall:heimdall:755` metadata and
`root:heimdall:640` for `backend.env`, and fails on all other verification lines.

| Candidate-specific case | Executed status |
| --- | --- |
| Oracle 8.10/aarch64 two-bundle Docker lifecycle and real vendor dependency | Passed for the exact local artifacts above. |
| Oracle 8/x86_64 two-bundle lifecycle | Unrun here; native CI lane defined. |
| Rocky 8/9/10 on x86_64 and aarch64 | All six native initial-install/service jobs defined; unrun here. |
| Rocky two-release offline upgrade/removal/recovery | Unrun; the six jobs receive only one candidate each. |
| RHEL, AlmaLinux, other Oracle majors and historical minor/EUS targets | Unrun; require matching approved vendor/snapshot artifacts. |
| Enforcing SELinux, enabled host fapolicyd, AVC inspection and full VM reboot | Unrun on every vendor/platform here; Docker results cannot substitute. |

Before release, record candidate-specific build, signed-install and clean SRPM
rebuild evidence for the target distribution and architecture. Run both native
OL8 lifecycle suites, all four database/proxy deployment combinations, offline
setup, coexistence, backup/restore, a real preceding-package upgrade and a full
host reboot. The `/server` response verifies the application endpoint; database
queries, migrations and authenticated application access need separate checks.
The workflow definition, including its EL10 jobs, is not a completed run.

SELinux/fapolicyd runtime acceptance requires an actual enforcing OL8 host.
Privileged containers and policy compilation cannot establish it. Stock bundled
runtimes do not establish FIPS validation. EL8 systemd ignores four newer
hardening directives (`ProtectClock`, `ProtectHostname`, `ProtectKernelLogs`,
`ProtectProc`); CI exposes those warnings and rejects other unit diagnostics.
