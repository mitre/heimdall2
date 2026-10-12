# Offline RPM bundles design

## Approved objective

The user requested every installation dependency in the deliverable so that an
offline installation is possible, then clarified the scope to all EL8, EL9 and
EL10 targets rather than the particular RHEL 8.6 troubleshooting VM. This design
records the offline dependency bundle approach accepted in the conversation.

## Requirements

- Cover EL8, EL9 and EL10 on x86_64 and aarch64.
- Each bundle targets one distribution ID, EL major, architecture and recorded repository snapshot; distribution compatibility is explicit.
- Include the complete recursive RPM dependency closure of Heimdall, including scriptlet requirements and DNF-selected Recommends/Supplements, independently of packages installed on the producer.
- Preserve ICU, PostgreSQL features, SELinux enforcement, existing setup behavior and RPM upgrade safeguards.
- Verify checksums and RPM signatures; retain original distribution package signatures and sign Heimdall before bundling.
- Install using only bundled files, with external repositories and DNF plugins disabled, without target registration, network access or a populated package cache.
- Install only the selected Heimdall package explicitly; let DNF select necessary dependencies without forcing installation of every bundled OS RPM.
- Keep existing signed RPM and SRPM artifacts available alongside uniquely named offline archives.
- Run genuine disconnected initial installation, setup, upgrade and recovery checks; record separate enforcing-SELinux VM acceptance.
- Keep repository credentials, subscription certificates, private keys and producer configuration out of artifacts and public logs.
- Release publication retains the existing integration-artifact rejection and stable-signing restrictions.

## Meaning of complete

An offline bundle contains all RPMs needed to satisfy the selected Heimdall
transaction from an otherwise empty RPM database. The producer uses DNF's actual
solver rather than a hand-maintained list of the four missing requirements in
the report. Alternatives are resolved to a consistent package set; this does not
mean downloading every alternative provider, every optional integration or an
entire distribution mirror.

Installation starts on an installed matching EL operating system with a running
kernel and the normal Bash, coreutils, RPM and DNF bootstrap tools. Starting
services also requires booted systemd. This is an application installer, not OS
installation media. The dependency closure still includes base packages required
by the application, even where the test image already contains them. Building,
dependency acquisition and signing happen on a connected producer.

Offline setup uses the bundled PostgreSQL and Caddy with internal CA or supplied
certificates. ACME, OAuth providers and external data sources still require their
own connectivity; downloading OS packages is never a setup fallback.

## Distribution and release boundary

The public workflow currently builds Rocky Linux 8/9/10 for both architectures.
Those jobs produce **Rocky-specific** dependency bundles. The same producer
command supports RHEL, AlmaLinux and Oracle Linux when run on the matching
distribution with its own repositories and public keys; Oracle Linux 8 has an
existing separate lifecycle lane. RHEL bundles require accessible RHEL content
on the producer or mounted matching installation media. They must not silently
contain Rocky or Oracle replacements for RHEL system packages.

The installer checks distribution ID, major and architecture before modifying
the system. The manifest additionally records the producer's VERSION_ID,
repository release selection and metadata hashes. A major-version label does
not certify every historical minor release, EUS lock or third-party package mix.
Use ordinary install/upgrade transactions without forcing downgrades or erasing
conflicting packages. Publish tested
baselines and let DNF reject incompatible hosts rather than changing them into a
different distribution. Additional vendor acceptance uses the same six platform
combinations where that vendor supports them; it is not implied by Rocky CI.

## Bundle design

Use a directory containing `repo/Packages/`, `repo/repodata/`, `keys/os/`,
`keys/heimdall.asc`, `target`, `heimdall-nevra`, `offline-manifest.json`,
`runtime-manifest.json`, `install.sh`, `README.txt` and `SHA256SUMS`.

`target` is one whitespace-separated line: distribution ID, EL major,
architecture. `heimdall-nevra` is one exact NEVRA line queried from the signed RPM.
These simple data files let the installer work without adding a Python bootstrap
dependency. The JSON inventory records packages, hashes, vendor/source RPM
metadata, public keys and source repository IDs/metadata hashes. It contains no
private repository configuration or authenticated URLs.

Resolve against a fresh installroot with explicit repository configuration,
release selection, architecture, module platform and approved keys. Include weak
dependencies. Copy the downloaded files out of DNF's cache into staging, add the
already signed Heimdall RPM, verify every signature with isolated key databases,
then generate a local repository with `createrepo_c`. EL8 source resolution keeps
normal module filtering; the curated local snapshot uses `module_hotfixes=1`
because its generated metadata does not contain AppStream module metadata.

Validate a second empty-root transaction using only this local repository and
`tsflags=test` with networking disabled. Checksums are generated after signing,
repository generation and installer copying. Create a uniquely named tar.gz
archive plus an external SHA-256 sidecar; publish the digest through the trusted
artifact channel. Checksums inside an archive detect damage but do not establish
the authenticity of an installer obtained from an untrusted source.

## Acceptance

Every public matrix entry must pass closure validation and initial installation
on a fresh target with `--network=none`, before any payload inspection tools are
installed. Test corrupted files, missing dependencies, wrong keys and mismatched
targets. Run services on a disposable booted host while disconnected, verify
database migrations and authenticated access, preserve data across upgrade,
remove/reinstall, and reboot an actual VM for final host acceptance. Containers
do not certify enforcing SELinux or fapolicyd behavior.

The connected build, fresh disconnected target and enforcing VM are separate
evidence levels. A written workflow or successful dependency download is not
evidence of a completed offline installation.
