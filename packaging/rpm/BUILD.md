# Heimdall Server RPM

```sh
sudo dnf install ./heimdall-server-*.rpm
sudo heimdall-cli setup --interactive
```

Select one RPM matching the host's EL major and architecture. The RPM contains
Heimdall, its CLI, Node.js 22.23.3, PostgreSQL 18.6, Caddy 2.11.4, Nginx 1.30.6,
and private ICU libraries. The host must meet the
[installation requirements](README.md#requirements). DNF resolves OS dependencies
from an approved source: RHEL repositories, an internal mirror or local media.
OS dependency RPMs are not included in the Heimdall bundle. Setup configures the
included runtimes; it does not download runtime packages.

The application version comes from the root [`VERSION`](../../VERSION) file.
Releases `0.3.integration` and `0.4.integration` exercise bundled-runtime upgrades
within that version. Release acceptance for this packaging branch is incomplete. Use disposable hosts until the [acceptance checks](#acceptance-status)
have passed for the exact candidate source and artifacts.

## Installation choices

The wizard independently asks which database and HTTPS proxy to use:

| Database mode | Proxy mode | Services managed by Heimdall |
| --- | --- | --- |
| `bundled` | `nginx` | Private PostgreSQL, application, private Nginx with self-signed TLS |
| `bundled` | `bundled` | Private PostgreSQL, application, private Caddy |
| `bundled` | `external` | Private PostgreSQL and application |
| `external` | `nginx` | Application and private Nginx with self-signed TLS |
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
operation. Managed Nginx (`--proxy-mode nginx`) automatically creates a
self-signed certificate and works offline; clients must trust its public
certificate. Bundled Caddy supports `--tls-mode acme`, `internal`, or `custom`;
custom mode also takes `--tls-cert` and `--tls-key`. Internal CA operation does not
need internet after the RPM and OS dependencies are installed; clients must trust
its root certificate. ACME requires the appropriate public connectivity.

Flags override saved selections; saved selections override fresh defaults
(`bundled`/`nginx`). Existing configured installations without mode keys default
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
1.26.9. Yarn must be installed as an RPM to satisfy the RPM build requirements;
an npm-global or Corepack installation alone is insufficient. The script handles
root versus sudo automatically.

After dependency installation succeeds, build the RPM from the current files.
A clone or downloaded source archive works; no Git commits or tags are required:

```sh
export PATH="/opt/heimdall-build/go-1.26.9/bin:$PATH"
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
Run `make -C packaging/rpm clean TOPDIR="$HOME/rpmbuild-heimdall"` to remove its
build output. Cleanup is limited to a non-symlink directory outside the source
tree and its ancestors, and refuses the home directory itself. Its top-level
entries must be the known RPM build outputs; unrelated files prevent deletion.
A missing TOPDIR is harmless, and cleanup works when `VERSION` is missing. Local
builds are unsigned until explicitly signed.

To build the current files using Docker:

```sh
for release in 0.3.integration 0.4.integration; do
  docker build --platform linux/arm64 -f packaging/rpm/Dockerfile.ol8 \
    --build-arg BASE_IMAGE=rockylinux/rockylinux:8 \
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

Workspace source archives and Docker build contexts exclude local `.npmrc` and
`.yarnrc.yml` files. Authenticate package downloads through the build environment;
do not put credentials into distributable sources.

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
  excludes Git metadata, environment files, certificates, caches, build outputs,
  and the root `data/` directory used by Docker's PostgreSQL service.
  Git history is not required for the downloaded Heimdall source tree.
- For an explicit build from Git, `SOURCE_MODE=head` archives clean committed
  inputs. `SOURCE_MODE=release` additionally requires HEAD at the version tag.
  CI selects these stricter modes explicitly.
- The CLI and its manuals are built from `apps/heimdall-cli` extracted from the
  server's Source0 archive into `TOPDIR/heimdall-cli-build`. No separate CLI
  repository is fetched or patched. `apps/heimdall-cli/VERSION` governs the CLI
  version independently of the server package version.
- CLI provenance in workspace mode is `source.<SHA-256 of Source0>` with build
  date `unknown`. HEAD and server release modes record the full Heimdall commit
  and its commit date; server release mode requires the root `vX.Y.Z` tag.
- Building from a checkout needs network access for Go modules, Yarn dependencies
  and pinned runtime archives unless they are already cached. Installing the RPM
  needs no Go toolchain, CLI source fetch, or application runtime download;
  DNF still resolves OS dependencies from the host's configured repositories.
- `runtime-lock.json` records runtime versions, archive URLs, SHA-256 digests and
  notices. Runtime patch updates change the lock and ship in a new server RPM.
- Go 1.26.9 builds the CLI; Yarn Classic 1.22.22 installs frozen application
  dependencies. Native addons use the exact private Node executable being shipped.
- Source23–30 contain the runtime archives, selected manifest and private units.
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
binaries need their own signature. An optional third argument overrides the
release for local upgrade fixtures.

## CI artifacts and test signatures

The Build RPM workflow defines native builds for Rocky Linux 8, 9 and 10 on
x86_64 and aarch64, using `rockylinux/rockylinux:{8,9,10}`. Its only uploaded
artifacts are the six
`heimdall-server-rpm-bundle-{el8,el9,el10}-{x86_64,aarch64}` combinations. The name
identifies the product, RPM bundle, target EL major and CPU architecture. Each has
build, signed-install and systemd lifecycle checks; there are no dedicated
Oracle Linux jobs. Test diagnostics are recorded in workflow logs.
Each installable artifact contains:

- `RPMS/<arch>/`: signed binary RPM.
- `SRPMS/`: signed source RPM.
- `RPM-TEST-GPG-KEY`: disposable acceptance public key.
- `runtime-manifest.json`: inventory of the pinned application runtimes.
- `SHA256SUMS`: checksums calculated after signing.

Each of the six native build jobs rebuilds its SRPM in an empty tree, retaining
the candidate release. These rebuilds are checked locally within the build job
and do not create additional uploaded artifacts.

The RPM also records the build distribution's ICU package and private library
hashes in `/usr/share/heimdall-server/icu-manifest.json`, with its notices under
`/usr/share/licenses/heimdall-server/`. An SRPM rebuild uses the target builder's
`libicu-devel` and records that builder's ICU package; it does not fetch a second
ICU runtime at installation time. Keep the RPM `%check` stage enabled: it records
the packaged library hashes after RPM strips ELF metadata.

Open **Actions → Build RPM**, select a successful run for the intended commit,
and download the artifact matching the host's EL major and architecture. With
GitHub CLI:

```sh
gh run download RUN_ID --repo mitre/heimdall2 \
  --name heimdall-server-rpm-bundle-el8-x86_64 --dir /tmp/heimdall-candidate
cd /tmp/heimdall-candidate
sha256sum --check SHA256SUMS
sudo rpm --import RPM-TEST-GPG-KEY
sudo dnf install --setopt=localpkg_gpgcheck=1 \
  ./RPMS/*/heimdall-server-*.rpm
sudo heimdall-cli setup --interactive
```

Use a fresh directory and a public key from that same trusted run. Artifact
retention is seven days. These keys are not durable distribution signatures;
production signing and repository hosting remain release work. Publication
rejects integration RPMs and selects canonical Rocky builds, keeping artifacts
separate during verification so architecture-specific manifests and signing
keys cannot overwrite each other.

Releases publish individual binary and source RPMs, public signing keys, runtime
manifests and checksums. Installations and upgrades resolve OS dependencies
through the host's configured approved source.

### DNF and systemd acceptance

The artifact contains the application RPM and its private runtimes. There is no
separate installer. The target must satisfy the
[documented host requirements](README.md#requirements). Signed-install smoke
tests use DNF with the distribution's repositories enabled to resolve OS
dependencies. Local RPM signature checks remain enabled.

The systemd lifecycle fixture installs OS prerequisites from the distribution's
repositories before disabling networking. It then installs the signed Heimdall
RPM and tests setup and restart without runtime downloads. System ICU and
separate application runtime packages are absent from that fixture.

The native Rocky lanes test direct installation, setup and restart for each EL
major and architecture. The manual lifecycle runner remains available for
upgrade, backup/restore, removal, recovery, external services and coexistence;
its installation helper always invokes DNF. A workflow definition is not evidence
of a completed run; preserve results for the exact candidate before release.

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
existing secrets. Backup includes logical SQL, configuration and private proxy
certificate/CA state. PostgreSQL major upgrades require a separate migration;
package upgrades reject a mismatched retained cluster major. Removal retains
application, database and certificate state and accounts. See
[backup and restore](README.md#backup-and-restore) before recovering.

## Acceptance status

The [2026-10-15 remediation report](../../docs/superpowers/reports/2026-10-15-rpm-remediation-acceptance.md)
records eleven reviewed fixes and source-level verification for candidate
`44c5ed66033a3986da92aa8ff0098b28bf1fa934`. Package qualification remains
incomplete: the local OL8/aarch64 build failed during dependency linking and
produced no RPM/SRPM. Remote CI awaits explicit approval, and the report lists
the remaining browser, TLS, lifecycle and enforcing-host gates.

The [historical bundled-runtime report](https://github.com/mitre/heimdall2/blob/5486a8b7f26da3ea90635f970e8b983142cdb0b8/docs/superpowers/reports/2026-09-29-bundled-rpm-acceptance.md)
records acceptance of earlier source and artifacts. It does not certify this
standalone branch or packages built from the current `VERSION`.

The 2026-10-12 offline-bundle results apply to the retired dependency-repository
installer. They do not certify this direct-RPM delivery model or its private ICU
libraries. The prior design is retained in
[the historical bundle design](../../docs/superpowers/specs/2026-10-12-offline-rpm-bundles-design.md).

The [2026-10-13 direct-RPM validation](../../docs/superpowers/plans/2026-10-13-direct-rpm-install.md#verification-result)
built and signed a native Oracle Linux 8/aarch64 candidate, then verified DNF
installation, setup, private ICU loading, application readiness and restart with
networking disabled. The plan records the exact candidate and remaining limits.
That test preinstalled OS dependencies; it does not certify later candidates or
repository availability on other target hosts.

The workflow defines Rocky EL8/9/10 native build, install and systemd lifecycle
lanes. RHEL, Oracle Linux, historical minor/EUS targets, enforcing SELinux,
enabled host fapolicyd, AVC inspection, and full VM reboot require separate
candidate-specific validation. Docker tests cannot establish those host properties.

Before release, record candidate-specific build, signed-install and clean SRPM
rebuild evidence for the target distribution and architecture. Run the manual
lifecycle suites, all six database/proxy deployment combinations, offline setup,
coexistence, backup/restore, a real preceding-package upgrade and a full
host reboot. The `/server` response verifies the application endpoint; database
queries, migrations and authenticated application access need separate checks.
The workflow definition, including its EL10 jobs, is not a completed run.

SELinux/fapolicyd runtime acceptance requires an actual enforcing OL8 host.
Privileged containers and policy compilation cannot establish it. Stock bundled
runtimes do not establish FIPS validation. EL8 systemd ignores four newer
hardening directives (`ProtectClock`, `ProtectHostname`, `ProtectKernelLogs`,
`ProtectProc`); CI exposes those warnings and rejects other unit diagnostics.
