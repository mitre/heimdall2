# Offline RPM Bundles Implementation Plan

> Superseded on 2026-10-13 by [direct RPM installation](../plans/2026-10-13-direct-rpm-install.md). The user chose DNF installation of a single application RPM with OS prerequisites already installed. This document records the previous design.

## Execution status (2026-10-12)

All four implementation tasks are committed. Native Oracle Linux 8/aarch64
passed the complete disconnected two-bundle lifecycle, 21 fresh-target
rejection cases, independent dependency closure, and a genuine vendor
dependency added during upgrade. The six Rocky CI entries are defined but
have not run here. Other native vendor/platform combinations, enforcing
SELinux, actual VM reboot and enabled-host fapolicyd acceptance remain
unrun. See [BUILD.md](../../../packaging/rpm/BUILD.md) for exact evidence
and acceptance limits. The checklist below records the original plan; it
does not certify unrun release checks.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Heimdall with every required runtime dependency for verified offline installation on EL8, EL9 and EL10, on x86_64 and aarch64.

**Architecture:** Keep the existing Heimdall RPM and collect its complete dependency closure with DNF in an empty installroot. Ship a signed-package local repository and a small installer in a distribution-specific archive; validate it with networking disabled before the initial installation. Reuse the existing runtime and lifecycle checks without treating their previous online installation as offline evidence.

**Tech Stack:** Existing RPM spec, DNF4, RPM/rpmkeys, createrepo_c, Bash, Python standard library compatible with EL8's Python 3.6, GNU tar/coreutils, Docker, GitHub Actions and booted EL VMs. No application dependency additions.

**Spec:** [Offline RPM bundles design](../specs/2026-10-12-offline-rpm-bundles-design.md). Read it before executing this plan.

## Global Constraints

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

---

## Starting evidence and scope

- `packaging/rpm/heimdall-server.spec:49-51` intentionally retains OS ELF requirements; line 203 enables PostgreSQL ICU. Keep them.
- The spec's `Requires` block starts at line 89. Installation/removal uses `semanage` around lines 489, 503 and 575. Keep SELinux tooling.
- `packaging/rpm/tests/payload.sh:73-79` already verifies ICU, libc, libstdc++, OpenSSL and zlib requirements.
- `packaging/rpm/Makefile:64-94` fetches the pinned separate CLI source. Inspect this exact checkout when auditing external commands; it is not tracked in this repository.
- `.github/workflows/build-rpm.yml:59-64` is the six-entry Rocky matrix. Signing occurs before checksums at lines 120-136. Dependencies must be collected after signing and outside `RPMS/` and `SRPMS/`.
- The smoke job installs tools and then the RPM online. `tests/run-lifecycle.sh:68-74` disconnects only after initial installation. Neither proves offline installation.
- The release job merges similarly named manifests and uploads only RPMs. Add uniquely named archives without introducing manifest collisions or publishing vendor RPMs as individual Heimdall release assets.
- At plan creation, `CONTEXT.md` and `docs/` contain pre-existing untracked work. Stage only explicitly named files; preserve unrelated documents.

This is one packaging feature, implemented in four independently reviewable tasks.
Do not rebuild PostgreSQL without ICU, redesign the CLI, or make optional services
mandatory to solve missing repository access.

## File structure and interfaces

| File | Responsibility |
| --- | --- |
| Create `packaging/rpm/scripts/stage-offline.py` | Collect and verify dependency RPMs; generate a local repository, target metadata and package inventory. |
| Create `packaging/rpm/offline/install.sh` | Verify the bundle and install the exact Heimdall candidate from its local repository. |
| Create `packaging/rpm/offline/README.txt` | Short instructions shipped inside every archive. |
| Create `packaging/rpm/tests/offline-inputs.py` | Standard-library tests for target metadata, inventory and invalid producer inputs. |
| Create `packaging/rpm/tests/offline-closure.sh` | Real empty-rpmdb dependency/signature transaction with no network. |
| Create `packaging/rpm/tests/offline-install.sh` | Fresh-target installation and preflight rejection checks; no online bootstrap. |
| Create `packaging/rpm/tests/run-offline.sh` | Disposable disconnected Docker install and systemd lifecycle harness. |
| Modify `packaging/rpm/Makefile` | Explicit post-signing offline target; no implicit application rebuild. |
| Modify `.github/workflows/build-rpm.yml` | Collect, archive, upload and test all six public platform bundles. |
| Modify `packaging/rpm/tests/lifecycle.sh` | Accept the shipped installer for install, upgrade and recovery while retaining existing state checks and guards. |
| Modify `packaging/rpm/README.md`, `packaging/rpm/BUILD.md` | Offline operator/producer instructions, vendor scope and acceptance evidence. |
| Conditional `packaging/rpm/heimdall-server.spec` | Add only a demonstrated missing runtime/scriptlet requirement discovered by disconnected execution; retain current requirements. |

The producer CLI contract is:

```sh
python3 packaging/rpm/scripts/stage-offline.py \
  --rpm /tmp/heimdall-rpmbuild/RPMS/x86_64/heimdall-server-2.14.0-0.4.integration.el8.x86_64.rpm \
  --runtime-manifest /tmp/heimdall-rpmbuild/SOURCES/runtime-manifest.json \
  --reposdir /tmp/heimdall-offline-sources \
  --varsdir /tmp/heimdall-offline-vars \
  --repo baseos --repo appstream \
  --releasever 8 \
  --os-key /etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-8 \
  --heimdall-key /tmp/heimdall-rpmbuild/RPM-TEST-GPG-KEY \
  --output /tmp/heimdall-rpmbuild/offline-bundle
```

This is an EL8 example. Derive candidate names from `VERSION` and RPM queries in
automation. Resolve actual key paths from the installed distribution-release
package, and actual repository IDs from its clean repository configuration.
Repeat `--repo` and `--os-key` for multiple approved repositories/keys. `--varsdir`
is an isolated copy of the selected distribution's non-secret DNF variable files;
an empty directory is valid when its repositories need no additional variables.
Inputs are
absolute paths; output must not already exist. Stage next to output and rename
only on success. Failure must leave neither a partial output nor modified inputs.

The output contract is:

```text
offline-bundle/
  repo/Packages/*.rpm
  repo/repodata/*
  keys/os/*.asc
  keys/heimdall.asc
  target
  heimdall-nevra
  offline-manifest.json
  runtime-manifest.json
  install.sh
  README.txt
  SHA256SUMS
```

`target` contains `rocky 8 x86_64\n` for the example. `heimdall-nevra` contains the
literal output of `rpm -qp --qf '%{NEVRA}\n'` for the signed candidate. The manifest
schema is fixed for this feature:

```json
{
  "schema": 1,
  "target": {"id": "rocky", "el_major": "8", "architecture": "x86_64"},
  "producer_version_id": "8.10",
  "releasever": "8",
  "heimdall_nevra": "heimdall-server-2.14.0-0.4.integration.el8.x86_64",
  "install_weak_deps": true,
  "repositories": [],
  "keys": [],
  "packages": []
}
```

Arrays are populated from actual inputs: repositories contain `id` and the
downloaded `repomd_sha256`; keys contain `path`, `fingerprint` and `sha256`;
packages contain `path`, `nevra`, `name`, `architecture`, `vendor`, `source_rpm`
and `sha256`. Do not put repository URLs or absolute producer paths in this file.
An empty repositories/keys/packages array is invalid output. Record the set of
source repositories rather than guessing a per-package origin from its filename.

### Task 1: Collect and prove the complete dependency closure

**Files:** Create `scripts/stage-offline.py`, `tests/offline-inputs.py` and
`tests/offline-closure.sh` under `packaging/rpm/`.

**Interfaces:** Consumes the producer CLI above and a signed candidate. Produces
the output directory contract, initially without the installer/README added in
Task 2. Python interfaces are `read_target(path: Path) -> dict`,
`package_record(path: Path, root: Path) -> dict`,
`verify_signature(path: Path, dbpath: Path) -> None`, and
`stage(args: argparse.Namespace) -> Path`. `main()` parses the documented flags
and calls `stage`; importing the module performs no work.

- [ ] **Step 1: Add real target and path validation tests.** Use the existing
  `unittest`/temporary-directory/importlib pattern in `tests/runtime-inputs.py`.
  `read_target` parses os-release as data, never shell code; require `ID`,
  `VERSION_ID`, `PLATFORM_ID=platform:el8/9/10`, and an allowed native architecture
  queried separately with RPM. Cover `rhel`, `rocky`, `almalinux`, and `ol`.

```python
def test_reads_major_without_pinning_minor(self):
    release = self.root / 'os-release'
    release.write_text('ID="rhel"\nVERSION_ID="8.6"\nPLATFORM_ID="platform:el8"\n')
    self.assertEqual(self.module.read_target(release),
                     {'id': 'rhel', 'el_major': '8', 'version_id': '8.6'})

def test_rejects_conflicting_platform(self):
    release = self.root / 'os-release'
    release.write_text('ID=rocky\nVERSION_ID=9.6\nPLATFORM_ID=platform:el8\n')
    with self.assertRaises(ValueError):
        self.module.read_target(release)

def test_rejects_shell_content_without_executing_it(self):
    marker = self.root / 'executed'
    release = self.root / 'os-release'
    release.write_text('ID=$(touch {})\nVERSION_ID=8\nPLATFORM_ID=platform:el8\n'.format(marker))
    with self.assertRaises(ValueError):
        self.module.read_target(release)
    self.assertFalse(marker.exists())
```

Give the test class a complete `setUp` using the repository's existing pattern:

```python
def setUp(self):
    spec = importlib.util.spec_from_file_location(
        'stage_offline', Path(__file__).resolve().parents[1] / 'scripts/stage-offline.py')
    self.module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(self.module)
    self.tmp = tempfile.TemporaryDirectory()
    self.addCleanup(self.tmp.cleanup)
    self.root = Path(self.tmp.name)
```

Import `importlib.util`, `tempfile`, `unittest` and `Path`, put the methods in
`OfflineInputsTest(unittest.TestCase)`, and finish with the usual guarded
`unittest.main()` entrypoint. Use `shlex.split` for single os-release values, require exactly one value, then
validate allowed IDs and numeric versions. Reject symlinked/non-regular RPM,
manifest and key inputs, missing repos, mismatched RPM arch/EL release, source
RPM input, unsigned candidate, pre-existing output and unsupported platform.
Validate the runtime inventory architecture and retain its exact bytes.

- [ ] **Step 2: Run the tests before adding the collector.**

```sh
python3 packaging/rpm/tests/offline-inputs.py
```

Expected: missing `stage-offline.py` or missing functions. On subsequent passes,
each deliberately invalid input must fail before DNF or any output publication.

- [ ] **Step 3: Implement isolated source resolution.** Use `subprocess.run`
  argument lists with `check=True`, not shell interpolation. Require root on
  the connected producer. Derive target distribution/major/native architecture;
  reject an RPM for another platform. Create fresh temporary installroot,
  download and publication directories. Generate a minimal DNF config and use
  only the explicit repository IDs in the supplied isolated reposdir.

Before relying on the spec's dependency declarations, audit the pinned CLI's
host-command calls and the installed scriptlets. Run on the connected builder:

```sh
rg -n 'exec\.Command|CommandContext|LookPath|initdb|semanage|curl|wget' "$TOPDIR/heimdall-cli-src"
rpm -qp --requires "$SIGNED_HEIMDALL_RPM"
rpm -qp --scripts "$SIGNED_HEIMDALL_RPM"
```

`SIGNED_HEIMDALL_RPM` is the `--rpm` input. Map required non-bundled executables
to their owning RPM with `rpm -qf` on the matching producer; distinguish
optional guarded integrations such as fapolicyd from unconditional setup calls.
Add a spec requirement only for an actual uncovered runtime command, together
with a clean-target regression. Keep build dependencies and test tools out of
the runtime dependency set.

```python
command = [
    'dnf', '-y', '--noplugins', '--config', str(config),
    '--installroot', str(installroot), '--releasever', args.releasever,
    '--forcearch', architecture,
    '--setopt=reposdir=' + str(args.reposdir),
    '--setopt=varsdir=' + str(args.varsdir),
    '--setopt=module_platform_id=platform:el' + target['el_major'],
    '--setopt=install_weak_deps=True', '--setopt=localpkg_gpgcheck=True',
    '--setopt=*.gpgcheck=True', '--setopt=*.gpgkey=',
    '--setopt=*.skip_if_unavailable=False',
    '--setopt=sslverify=True', '--setopt=*.sslverify=True',
    '--disablerepo=*',
]
command.extend('--enablerepo=' + repo for repo in args.repo)
command.extend(['install', '--downloadonly', '--downloaddir',
                str(downloads), str(args.rpm)])
subprocess.run(command, check=True)
```

Here `config`, `installroot`, `downloads`, `architecture`, `target` and `args`
are locals in `stage`, with directories allocated by `tempfile`. Set config
`[main]` values `gpgcheck=1`, `localpkg_gpgcheck=1`, `install_weak_deps=1`,
`keepcache=1`, `best=1`, `skip_if_unavailable=0`; clear inherited package excludes
and transaction flags by using this new configuration. Keep normal source
module filtering. Validate `releasever` starts with the selected major.

Initialize the installroot RPM database and import only the supplied approved OS
and Heimdall keys. Also create separate verification databases for OS keys and
the Heimdall key. Use `rpm --root` for the solver root and absolute `--dbpath`
for signature-only databases; confirm their operation on each matrix RPM version.
Explicitly setting empty repository `gpgkey` prevents opportunistic key imports.
Source credentials remain producer-only; redact authenticated URLs in retained
failure diagnostics. The public CI configuration has no credentials.

- [ ] **Step 4: Copy, inventory and verify every RPM.** Immediately copy downloads
  out of DNF's cache, then explicitly copy the already signed local Heimdall RPM.
  Verify the candidate with the Heimdall database and every other RPM with the OS
  database. Require a real signature, not merely successful digest verification:

```python
def verify_signature(path, dbpath):
    result = subprocess.run(
        ['rpmkeys', '--dbpath', str(dbpath), '--checksig', '--verbose', str(path)],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        universal_newlines=True, env=dict(os.environ, LC_ALL='C'))
    if result.returncode or not re.search(r'Signature.*: OK', result.stdout):
        raise ValueError('RPM signature verification failed: ' + path.name)

def package_record(path, root):
    output = subprocess.check_output(
        ['rpm', '-qp', '--qf', '%{NEVRA}\t%{NAME}\t%{ARCH}\t%{VENDOR}\t%{SOURCERPM}',
         str(path)], universal_newlines=True)
    nevra, name, architecture, vendor, source_rpm = output.split('\t')
    return dict(path=str(path.relative_to(root)), nevra=nevra, name=name,
                architecture=architecture, vendor=vendor, source_rpm=source_rpm,
                sha256=hashlib.sha256(path.read_bytes()).hexdigest())
```

Reject duplicate NEVRAs with different bytes and RPMs outside the native/noarch
architectures. Do not rewrite vendor signatures. Copy only public keys using
controlled `.asc` names, obtain fingerprints with producer-side GnuPG, and require
the operator to verify them against the distribution/release authority. Record
repo IDs and cached repomd hashes; reject missing/ambiguous metadata rather than
writing a fabricated snapshot identity. No cached credentials go in staging.

- [ ] **Step 5: Generate local metadata and deterministic inventories.**

```python
subprocess.run(['createrepo_c', str(staging / 'repo')], check=True)
(staging / 'target').write_text('{} {} {}\n'.format(
    target['id'], target['el_major'], architecture))
(staging / 'heimdall-nevra').write_text(heimdall_nevra + '\n')
(staging / 'offline-manifest.json').write_text(
    json.dumps(manifest, indent=2, sort_keys=True) + '\n')
with (staging / 'SHA256SUMS').open('w') as sums:
    for path in sorted(staging.rglob('*')):
        if path.is_symlink():
            raise ValueError('Bundle must not contain symbolic links')
        if path.is_file() and path.name != 'SHA256SUMS':
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            sums.write('{}  {}\n'.format(digest, path.relative_to(staging)))
```

`manifest` uses the schema above; sort packages by NEVRA and key/repository
records by name. Read bytes in chunks for hashing large files in the final
implementation. Preserve source reproducibility through the inventory, not a
claim that mutable upstream repositories will return identical bytes tomorrow.

- [ ] **Step 6: Implement the real closure test.** Its contract is
  `bash tests/offline-closure.sh BUNDLE_DIRECTORY`. Require root and
  `HEIMDALL_RPM_TEST=1`. Use a fresh installroot, empty reposdir and isolated
  configuration with only bundle keys imported. Read the three target fields
  without sourcing the file; reject extra fields. Use the exact NEVRA file.

```sh
dnf -y --noplugins --config "$config" \
  --installroot "$verification_root" --releasever "$major" \
  --forcearch "$arch" --setopt=reposdir="$empty_repos" \
  --setopt=module_platform_id="platform:el$major" \
  --setopt=install_weak_deps=True --disablerepo='*' \
  --repofrompath="heimdall-offline,$bundle/repo" \
  --enablerepo=heimdall-offline \
  --setopt=heimdall-offline.gpgcheck=True \
  --setopt=heimdall-offline.gpgkey= \
  --setopt=heimdall-offline.module_hotfixes=True \
  --setopt=tsflags=test install "$nevra"
```

Use temporary directories and traps in this script. Recompute no checksums:
validate the supplied inventory before solving. `tsflags=test` tests an RPM
transaction; `--assumeno` alone is not a substitute. The outer runner must disable
networking, not merely trust DNF flags. Assert the root still contains no installed
packages other than imported `gpg-pubkey` entries after the test.

- [ ] **Step 7: Prove omissions and signature errors are detected.** After a
  successful real collection, assert the inventory contains `libicu`,
  `policycoreutils-python-utils` and `firewalld-filesystem` (the current weak
  recommendation). The collector's builder already contains ICU development
  dependencies, so this directly guards against host-RPM-database omission.
  For a closure-negative fixture, copy the bundle, remove its `libicu` RPM,
  regenerate repo metadata/checksums, and require the empty-root transaction to
  fail. For the signature-negative fixture remove an RPM signature with
  `rpm --delsign` in a disposable copy and require signature verification to fail
  even after recalculating checksums. A freshly generated unrelated signing key
  must also fail verification. Keep fixture modifications outside the real output.

```sh
python3 packaging/rpm/tests/offline-inputs.py
sudo env HEIMDALL_RPM_TEST=1 unshare --net \
  bash packaging/rpm/tests/offline-closure.sh "$OFFLINE_BUNDLE"
```

Expected: input tests and intact closure pass; each altered fixture fails.
`OFFLINE_BUNDLE` is the absolute output of the producer example. If the local
environment lacks native EL/DNF, run these on the matching CI/native host and
record that limitation instead of treating syntax checks as transaction proof.

- [ ] **Step 8: Commit the collector and checks.**

```sh
git add packaging/rpm/scripts/stage-offline.py packaging/rpm/tests/offline-inputs.py packaging/rpm/tests/offline-closure.sh
git commit -m "feat(rpm): collect complete signed offline dependency repositories"
```

### Task 2: Ship an installer that can use only the local bundle

**Files:** Create `packaging/rpm/offline/install.sh`, `offline/README.txt`,
`tests/offline-install.sh`; modify `scripts/stage-offline.py` and
`packaging/rpm/README.md`.

**Interfaces:** Consumes Task 1's directory. Produces `install.sh [--assumeyes]`,
which locates the bundle relative to itself, exits nonzero before the real DNF
transaction for invalid inputs, and leaves application configuration to the
existing `heimdall-cli setup`. `tests/offline-install.sh BUNDLE_DIRECTORY` runs
inside a fresh disposable target with `HEIMDALL_RPM_TEST=1`; the parent runner
provides network isolation.

- [ ] **Step 1: Write the initial-install test.** Keep the existing disposable
  container/root guard style from `tests/lifecycle.sh`. Record the initial RPM
  inventory, install, verify exact NEVRA, then rerun and verify idempotency.

```sh
set -euo pipefail
[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
bundle=$(realpath "${1:?bundle directory}")
rpm -qa --qf '%{NEVRA}\n' | sort > /tmp/offline-before.txt
bash "$bundle/install.sh" --assumeyes
IFS= read -r expected < "$bundle/heimdall-nevra"
[[ $(rpm -q --qf '%{NEVRA}' heimdall-server) == "$expected" ]]
rpm -V heimdall-server
rpm -qa --qf '%{NEVRA}\n' | sort > /tmp/offline-after.txt
bash "$bundle/install.sh" --assumeyes
rpm -qa --qf '%{NEVRA}\n' | sort > /tmp/offline-rerun.txt
cmp /tmp/offline-after.txt /tmp/offline-rerun.txt
runtime=/usr/libexec/heimdall-server/runtime
"$runtime/node/bin/node" --version
"$runtime/postgresql/bin/postgres" --version
"$runtime/postgresql/bin/psql" --version
"$runtime/caddy/caddy" version
heimdall-cli --version
```

Expected before implementation: missing installer. Keep test-only tools outside
the target until after successful install. Do not install git/cpio/curl/systemd
online to prepare this test.

- [ ] **Step 2: Implement installer preflight before host key imports.** Require
  root and accept only no argument or `--assumeyes`; reject all other arguments.
  Parse the installed `/etc/os-release` and bundle `target`, check ID/major/arch,
  reject malformed/extra fields, and check that exactly one signed Heimdall RPM
  matches `heimdall-nevra`. Check every manifest-listed file with `sha256sum` and
  ensure every repository package, metadata file, key and shipped script appears
  exactly once. Reject absolute/parent-traversal checksum paths, symbolic links,
  special files, missing entries and unlisted extra RPMs. Package and metadata
  paths generated by the producer use only safe ASCII filename characters.

Use a temporary RPM database to verify all candidate signatures before importing
keys into the host database. Keep OS and Heimdall key scopes separate, as in the
producer. A matching filename or checksum cannot substitute for a trusted
signature. The README tells the operator to obtain the archive and external
digest from a trusted channel before executing its script.

```sh
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
bundle=$script_dir
work=$(mktemp -d /tmp/heimdall-offline.XXXXXX)
trap 'rm -rf -- "$work"' EXIT
mkdir -p "$work/repos" "$work/cache" "$work/log"
cat > "$work/dnf.conf" <<EOF
[main]
gpgcheck=1
localpkg_gpgcheck=1
install_weak_deps=1
best=1
skip_if_unavailable=0
reposdir=$work/repos
cachedir=$work/cache
logdir=$work/log
EOF
```

Use Bash arrays and quoted arguments throughout. The input directory can contain
spaces. Validate raw path delimiters before constructing `--repofrompath`; reject
newline/comma paths with a useful error instead of interpreting another repo.
Do not source any data file from the bundle. Do not copy a `.repo` file into
`/etc/yum.repos.d` or modify configured repositories.

- [ ] **Step 3: Install the exact Heimdall NEVRA using the local repo.** Import
  verified public keys, then use a test transaction followed by the real
  transaction. Both must have exactly the same solver configuration.

```sh
dnf_args=(--noplugins --config "$work/dnf.conf" --disablerepo='*'
  --repofrompath="heimdall-offline,$bundle/repo"
  --enablerepo=heimdall-offline
  --setopt=heimdall-offline.gpgcheck=True
  --setopt=heimdall-offline.gpgkey=
  --setopt=heimdall-offline.module_hotfixes=True
  --setopt=localpkg_gpgcheck=True --setopt=install_weak_deps=True)
action=install
if rpm -q heimdall-server >/dev/null 2>&1; then action=upgrade; fi
if [[ $(rpm -q --qf '%{NEVRA}' heimdall-server 2>/dev/null || true) != "$nevra" ]]; then
  dnf "${dnf_args[@]}" -y --setopt=tsflags=test "$action" "$nevra"
  dnf "${dnf_args[@]}" "${answer_args[@]}" --setopt=tsflags= "$action" "$nevra"
fi
[[ $(rpm -q --qf '%{NEVRA}' heimdall-server) == "$nevra" ]]
```

`answer_args=()` by default and `answer_args=(-y)` only for `--assumeyes`. Do not
pass all RPM filenames, `--allowerasing`, `--skip-broken`, `--nogpgcheck` or
`--nobest`. Use `upgrade` when Heimdall is already installed so the installer does
not request a downgrade; verify the exact installed NEVRA before returning
success, including when DNF reports no work. Test that offering an older bundle
to a newer installed Heimdall fails and leaves it unchanged. Test a target with
newer compatible OS dependencies and confirm they are retained. Ordinary DNF
dependency updates remain visible for operator review; never force replacement
of a conflicting package to obtain a successful result.

Keep the transaction visible so the default invocation asks the operator to
confirm dependency updates. Return DNF's failure; never print success or run
setup after failure. A package scriptlet failure is reported as installation
failure, not an offline fallback opportunity.

- [ ] **Step 4: Add adversarial and portability fixtures.** Each rejection case
  runs in a fresh target and compares before/after RPM inventories, including
  imported keys. Cases: wrong ID, wrong major, wrong architecture, modified RPM,
  modified repo metadata, missing package, unlisted package, unrelated signer,
  unsigned RPM, unsafe checksum path and symlink. Recalculate fixture checksums
  where necessary to isolate the signature/target check rather than merely
  triggering the first checksum failure. Also pass the same intact bundle from a
  directory named `/tmp/offline bundle`.

```sh
rpm -qa --qf '%{NEVRA}\n' | sort > /tmp/rejected-before.txt
if bash "$bad_bundle/install.sh" --assumeyes; then
  echo 'Invalid offline bundle was accepted' >&2
  exit 1
fi
rpm -qa --qf '%{NEVRA}\n' | sort > /tmp/rejected-after.txt
cmp /tmp/rejected-before.txt /tmp/rejected-after.txt
```

`bad_bundle` is a disposable mutated copy made by the test case. Checks that
depend on an absent OS package use a clean target known to lack that package;
the empty-root test separately covers omissions masked by a base image.

- [ ] **Step 5: Include the installer and concise operator instructions before
  hashing.** Extend the collector to copy `offline/install.sh` and
  `offline/README.txt` into staging before generating `SHA256SUMS`. The shipped
  instructions and README's offline section show:

```sh
sha256sum --check SHA256SUMS
sudo bash ./install.sh
sudo heimdall-cli setup --interactive
```

State that the interactive setup must use bundled services and internal/custom
TLS for a fully disconnected deployment. Also provide the deterministic command:

```sh
sudo heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode bundled --tls-mode internal \
  --external-url https://heimdall.example.test
```

Explain local name resolution and trusting the generated public CA certificate.
Explicitly state that default/custom TLS configuration needs no package download;
ACME and external services retain their connectivity requirements.

- [ ] **Step 6: Run unit, closure and actual installation checks, then commit.**

```sh
python3 packaging/rpm/tests/offline-inputs.py
bash -n packaging/rpm/offline/install.sh packaging/rpm/tests/offline-install.sh
git add packaging/rpm/offline packaging/rpm/scripts/stage-offline.py packaging/rpm/tests/offline-install.sh packaging/rpm/README.md
git commit -m "feat(rpm): install verified dependency bundles without repositories"
```

The real disconnected test is executed with the Task 4 harness or an equivalent
fresh `docker run --network=none` target during this task; syntax checks alone
are insufficient to mark the task complete.

### Task 3: Produce complete offline artifacts for every existing platform

**Files:** Modify `packaging/rpm/Makefile`, `.github/workflows/build-rpm.yml`,
`packaging/rpm/BUILD.md`; extend `tests/offline-inputs.py` for Make staging.

**Interfaces:** Consumes a finally signed RPM and explicit source/key inputs.
Produces `heimdall-offline-DISTRO-elMAJOR-ARCH-VERSION-RELEASE.tar.gz` and its
same-name `.sha256` sidecar under `TOPDIR/OFFLINE/`. Each tar has one top-level
directory matching the archive basename. Existing standalone artifacts remain.

- [ ] **Step 1: Add a Make invocation regression test.** Following
  `test_make_stages_in_custom_topdir` in `tests/runtime-inputs.py`, copy the
  Makefile and a recording stub collector into a temporary tree with spaces.
  Invoke the target with all required paths, assert exact arguments, and assert
  no `rpm`, `deps` or signing target was run. A missing required variable fails
  before creating an output directory.

```python
result = subprocess.run(
    ['make', '-C', str(packaging), 'offline',
     'OFFLINE_RPM=' + str(rpm), 'OFFLINE_REPOSDIR=' + str(repos),
     'OFFLINE_VARSDIR=' + str(variables),
     'OFFLINE_REPOS=baseos appstream', 'OFFLINE_RELEASEVER=8',
     'OFFLINE_OS_KEY_DIR=' + str(os_key_dir), 'OFFLINE_HEIMDALL_KEY=' + str(app_key),
     'TOPDIR=' + str(topdir)],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
self.assertEqual(result.returncode, 0, result.stderr)
```

For paths containing spaces use one repeatable argument per path when building
the shell array. `OFFLINE_OS_KEY_DIR` is one directory containing only the approved
OS public keys; enumerate its regular files into repeated `--os-key` arguments.
`OFFLINE_REPOS` is a whitespace-separated list of validated repository IDs, not
filesystem paths. `OFFLINE_VARSDIR` is an existing directory, possibly empty.
These Make variable names are final; the producer retains repeatable `--os-key`.

- [ ] **Step 2: Add the post-signing Make target and archive creation.** Add
  `offline` to `.PHONY`. Validate required inputs instead of guessing the first
  RPM in a glob. Use the same runtime-manifest path as existing artifacts.
  The target calls the collector, archives its finished directory with GNU tar,
  and hashes the final archive. Exclude staging outputs from subsequent source
  packaging using the existing `TOPDIR` outside-source convention.

```sh
tar -C "$bundle_parent" -czf "$archive" "$bundle_name"
(cd "$(dirname "$archive")" && sha256sum "$(basename "$archive")" > "$(basename "$archive").sha256")
```

Archive naming is derived from the validated target and queried RPM fields. It
is not a user-supplied arbitrary path. Do not sign the loose candidate again
after copying it into the bundle. Refuse stale output; use a fresh per-build
directory instead of deleting unspecified user paths.

- [ ] **Step 3: Preserve clean OS repository inputs before build setup.** In
  each Rocky build job, capture only its stock BaseOS/AppStream repository
  definitions and required `/etc/dnf/vars` or `/etc/yum/vars` values before
  `make deps` adds EPEL and NodeSource. Use the exact enabled
  repo IDs returned by the clean image, recording the allowlist in the build
  step. Copy public keys owned by the installed distribution release package,
  not every key later imported by build tools. Install `createrepo_c` and GnuPG
  as connected producer tooling. Pass native architecture and explicit major.

Use `--disablerepo='*'` plus the captured allowlist in the collector even if the
captured files contain other disabled repositories. On RHEL/OL/Alma producer
hosts the operator supplies the same inputs from that distribution. Never
automatically enable third-party repositories to complete a failed solve.

- [ ] **Step 4: Insert collection after signing and upload separately.** The
  sequence in each build job becomes build → sign Heimdall/SRPM → collect OS
  dependencies → validate inventory → archive → hash → upload. Keep dependency
  RPMs outside the sign script's `RPMS`/`SRPMS` search. Upload one additional
  artifact named `offline-rocky-${{ matrix.distro }}-${{ matrix.arch }}` containing
  only its uniquely named archive and sidecar. Upload failure must fail the job.

```yaml
- uses: actions/upload-artifact@v7
  with:
    name: offline-rocky-${{ matrix.distro }}-${{ matrix.arch }}
    path: |
      ${{ env.TOPDIR }}/OFFLINE/*.tar.gz
      ${{ env.TOPDIR }}/OFFLINE/*.tar.gz.sha256
    retention-days: 7
    if-no-files-found: error
```

Keep the existing `rpm-*` artifact intact. Add the new Python fixture checks to
the existing pre-build check step. Do not label the Rocky archives as universal
RHEL artifacts. The OL8 lane creates its own bundle after its existing external
signing step, using a connected matching Oracle container and OS keys.

- [ ] **Step 5: Extend release handling without losing the current gate.**
  Download `offline-*` artifacts into a separate directory; unique archive names
  make merging safe. Verify each sidecar and inspect the bundled Heimdall RPM
  using `rpm -qp`. Apply the existing `*integration*` rejection to it as well as
  standalone Heimdall RPMs. Attest and upload the archives and sidecars in
  addition to the existing RPMs. Do not individually publish OS dependency RPMs,
  and do not treat attestations as RPM signatures. Preserve the existing warning
  that stable publication needs durable signing and acceptance evidence.

```yaml
with:
  files: |
    rpms/**/*.rpm
    offline/**/*.tar.gz
    offline/**/*.tar.gz.sha256
  fail_on_unmatched_files: true
```

This is the release action's final `with` block; extend the preceding attestation
step with the same archive paths. Make `publish` depend on the new offline test
job defined in Task 4. Keep source/SRPM provenance and notices already present.

- [ ] **Step 6: Document producer commands and run artifact checks.** In
  `BUILD.md`, document the exact CLI/Make inputs, fresh signed-RPM prerequisite,
  vendor/source rules, required native producer tools, connected acquisition,
  key fingerprints and output contents. Explain that RHEL media/internal mirrors
  can supply packages without registering the target. Do not publish protected
  vendor artifacts to a public release automatically; use the existing approved
  artifact destination for that vendor's build.

```sh
python3 packaging/rpm/tests/offline-inputs.py
git diff --check
tar -tzf "$OFFLINE_ARCHIVE"
(cd "$(dirname "$OFFLINE_ARCHIVE")" && sha256sum -c "$(basename "$OFFLINE_ARCHIVE").sha256")
```

`OFFLINE_ARCHIVE` is the single path emitted by `make offline`. Inspect the
archive to confirm it contains no source repo configuration, auth material or
private keys and that all RPMs match target/noarch. Test all six workflow matrix
entries. Commit only the files for this task.

```sh
git add packaging/rpm/Makefile .github/workflows/build-rpm.yml packaging/rpm/BUILD.md packaging/rpm/tests/offline-inputs.py
git commit -m "build(rpm): publish offline bundles for all EL platforms"
```

### Task 4: Prove disconnected installation and full service operation

**Files:** Create `packaging/rpm/tests/run-offline.sh`; modify
`.github/workflows/build-rpm.yml`, `tests/lifecycle.sh`, `tests/offline-install.sh`
and `packaging/rpm/BUILD.md`. Keep existing `run-lifecycle.sh`/legacy tests unless
an interface change demonstrably requires updating them.

**Interfaces:** `run-offline.sh PLATFORM IMAGE INITIAL_BUNDLE [UPGRADE_BUNDLE]`
runs native Docker targets. `IMAGE` is an already pulled matching OS image;
network access for artifact acquisition occurs on the outer host only. It writes
evidence under `packaging/rpm/dist/offline/evidence/` and cleans up only its own
containers. `RPM_TEST_OFFLINE_BUNDLE` is the optional absolute bundle directory
inside the target used by the existing lifecycle script.

- [ ] **Step 1: Add the fresh-target install and closure lane.** The host checks
  archive checksums and extracts into owned temporary directories. Create a
  completely fresh target before installing any test utilities:

```sh
docker run --rm --network=none --platform "$platform" \
  -e HEIMDALL_RPM_TEST=1 \
  -v "$bundle:/tmp/offline bundle:ro" \
  -v "$tests:/tmp/rpm-tests:ro" \
  "$image" bash /tmp/rpm-tests/offline-install.sh '/tmp/offline bundle'
```

Use `timeout` on the outer host and a trap to remove named containers on failure.
Capture OS release, native architecture, initial/final RPM inventories, all
transaction exit codes and logs. Assert `docker inspect` reports network mode
`none`. Run the Task 1 closure script in a separate disposable network-none
container so importing keys/test transactions cannot contaminate the install
target. Reuse the same unmodified bundle for both tests.

- [ ] **Step 2: Add the six-entry offline GitHub Actions job.** Reuse the build
  matrix's native runners and OS images; the job itself runs on the host so it
  can launch a network-none target. Download `offline-rocky-*`, verify/extract the
  one archive, pull the base image while connected, then invoke `run-offline.sh`.
  Do not run DNF bootstrap in the target. Upload logs with `if: always()` and
  make the public release depend on this job. Negative fixture cases run in
  separate targets, not after a successful installation has supplied missing
  dependencies.

- [ ] **Step 3: Exercise setup on a booted disconnected target.** First prepare
  a disposable writable image from the successful offline installation, commit
  that container, then start it with systemd as PID 1 and `--network=none`.
  Installation of systemd must have occurred from the bundle, not an online
  Dockerfile bootstrap. Verify the image contains no configured cluster or
  running Heimdall services before setup. Use the existing privileged/private
  cgroup/tmpfs options from `run-lifecycle.sh` and keep its timeout/diagnostic
  behavior.

First run the real setup before adding any inspection dependencies. Use bundled
Node for the initial HTTP readiness probe and bundled psql to check migrations.
This avoids requiring curl merely to prove that the application starts:

```sh
docker exec "$container" heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode bundled --tls-mode internal \
  --external-url https://heimdall.example.test
docker exec "$container" systemctl is-active \
  heimdall-server heimdall-postgresql heimdall-caddy
docker exec "$container" /usr/libexec/heimdall-server/runtime/node/bin/node -e '
const http = require("node:http");
const req = http.get("http://127.0.0.1:3000/server", res => {
  let body = "";
  res.on("data", chunk => body += chunk);
  res.on("end", () => {
    if (res.statusCode !== 200) process.exit(1);
    try { JSON.parse(body); } catch { process.exit(1); }
  });
});
req.setTimeout(10000, () => req.destroy(new Error("timeout")));
req.on("error", () => process.exit(1));'
docker exec "$container" runuser -u heimdall-postgres -- \
  /usr/libexec/heimdall-server/runtime/postgresql/bin/psql \
  -h /run/heimdall-postgresql -p 55432 -U heimdall-postgres \
  -d heimdall-server-production -v ON_ERROR_STOP=1 \
  -c 'SELECT count(*) FROM "SequelizeMeta";'
```

Bound readiness retries with the existing 60-second test timeout. After this
unassisted setup succeeds, reuse `tests/topology.sh bundled bundled` and
`tests/application-ready.sh` for authenticated/TLS checks on fixtures with their
inspection tools. Where curl is absent, the connected producer prepares a
separate signed test-tools local repository containing curl and its dependencies;
mount it read-only and install curl locally only at this point. Apply the same
OS key checks and empty-root collection as Task 1, with curl as the fixture root
package. Keep this test-only repository out of the shipped archive and report
which stage introduced its packages. The producer's production CLI still accepts
only a Heimdall candidate; fixture preparation uses the explicit DNF command in
Task 1 rather than adding a generic product option. Actual host-command auditing
determines runtime requirements; test utilities do not.

Scan trusted installed ELF/native addon files with the target's loader tools
and fail on missing libraries. Native addons are excluded from automatic RPM
requirements today; their successful loading and real application startup must
be checked. Report expected mutable configuration separately from unexpected
`rpm -V` failures after setup.

- [ ] **Step 4: Feed offline bundles into existing lifecycle assertions.** Add
  one function to `tests/lifecycle.sh` and call it only where the current script
  installs/upgrades/reinstalls the candidate. Preserve all existing signature,
  backup-refusal, retained-state, migration, service and recovery assertions.

```sh
install_candidate() {
  local rpm_path=$1 phase=$2 action=install
  local repo_args=()
  case "$phase" in
    install) ;;
    upgrade) action=upgrade; repo_args=(--disablerepo='*') ;;
    recover) repo_args=(--disablerepo='*') ;;
    *) return 64 ;;
  esac
  if [[ -n ${RPM_TEST_OFFLINE_BUNDLE:-} ]]; then
    [[ $(cat "$RPM_TEST_OFFLINE_BUNDLE/heimdall-nevra") == \
       "$(rpm -qp --qf '%{NEVRA}' "$rpm_path")" ]] || return 1
    timeout 300 bash "$RPM_TEST_OFFLINE_BUNDLE/install.sh" --assumeyes
  else
    timeout 300 dnf "$action" -y "${repo_args[@]}" --setopt=install_weak_deps=False \
      --setopt=localpkg_gpgcheck=1 "$rpm_path"
  fi
}
```

Replace the install DNF call with `install_candidate "$2" install`, the body of
the existing `upgrade` helper with `install_candidate "$1" upgrade`, and the
recovery DNF call with `install_candidate "$2" recover`. This preserves the
existing non-bundle upgrade/recovery repository restriction. Do not weaken
existing Docker/root test guards for VM convenience.
Pass the first bundle for initial install and the second bundle for upgrade and
recovery. The native OL8 lane already builds two releases; collect complete
Oracle bundles after signing both and run this sequence disconnected from the
start. For other majors, add a second candidate release to their lifecycle lane
or run the two-candidate test on the native acceptance host before claiming
offline upgrade acceptance for that target.

If an upgraded release needs an OS dependency absent from the first closure,
prove the second bundle supplies it. Add a disposable RPM fixture with an extra
runtime requirement to exercise that case; select a same-vendor signed package
known absent on the initial target, and assert its absence before the upgrade.
Remove/recover must still preserve database rows, secrets and internal CA state.

- [ ] **Step 5: Run required checks on actual enforcing VMs.** Use disposable
  native EL8/EL9/EL10 hosts for release acceptance of the claimed vendor/platform;
  retain the existing actual-host fapolicyd requirement when that service is
  enabled. Copy and verify the bundle first, then disconnect all network adapters
  through the VM console so losing SSH is expected. Verify no cache can mask an
  omission, and run the public installer and internal-TLS setup.

```sh
cat /etc/os-release
uname -m
getenforce
sudo dnf clean all
sudo bash ./install.sh
sudo heimdall-cli setup --non-interactive \
  --database-mode bundled --proxy-mode bundled --tls-mode internal \
  --external-url https://heimdall.example.test
sudo systemctl is-active heimdall-server heimdall-postgresql heimdall-caddy
sudo semanage port -l | grep -E 'heimdall_server_port_t|postgresql_port_t'
sudo journalctl -u heimdall-server -u heimdall-postgresql -u heimdall-caddy --no-pager
sudo reboot
```

After reboot, repeat readiness, database/migration and authenticated application
checks; inspect audit logs for service-related AVC denials since the test start.
Run backup/restore and the two-bundle upgrade/recovery with a database sentinel.
Use a local test client or VM console with the generated CA, not internet DNS or
public ACME. Save exact source commit, bundle SHA-256, OS build, SELinux state,
commands and results. VM results cannot be replaced by Docker restart results.

- [ ] **Step 6: Regress existing checks, update acceptance status and commit.**

```sh
python3 packaging/rpm/tests/offline-inputs.py
python3 packaging/rpm/tests/upgrade-scriptlets.py
python3 packaging/rpm/tests/host-build-args.py
bash -n packaging/rpm/offline/install.sh packaging/rpm/tests/offline-closure.sh packaging/rpm/tests/offline-install.sh packaging/rpm/tests/run-offline.sh packaging/rpm/tests/lifecycle.sh
git diff --check
```

Also run existing payload/signature/SRPM checks, all six disconnected initial
installs, and available two-candidate lifecycle lanes. Update `BUILD.md`'s
acceptance section with links to exact evidence. List unrun vendor/VM cases
explicitly; do not mark them passing because an image built or a workflow exists.

```sh
git add .github/workflows/build-rpm.yml packaging/rpm/tests/run-offline.sh packaging/rpm/tests/lifecycle.sh packaging/rpm/tests/offline-install.sh packaging/rpm/BUILD.md
git commit -m "test(rpm): verify offline installation and service lifecycle"
```

## Completion evidence

| Requirement | Implementation and proof |
| --- | --- |
| Every recursive dependency, independent of producer installs | Task 1 empty installroots; ICU omission and weak-dependency checks. |
| No target repositories, registration, cache or network | Tasks 2 and 4 shipped local-only installer and network-none first transaction. |
| EL8/9/10, both architectures | Tasks 3 and 4 six public Rocky entries plus matching-vendor producer procedure. |
| Preserve security and database behavior | Unchanged ICU/SELinux requirements, original signatures, Task 4 enforcing-host/lifecycle checks. |
| Prevent unsafe vendor/version replacement | Target guard, exact Heimdall request, upgrade semantics, no forced erasure, compatible-newer-package test. |
| Shippable complete artifacts | Task 3 signed-before-bundling archives, checksums, manifests and release gates. |
| Setup and ongoing lifecycle offline | Task 4 internal-TLS setup, sentinel-preserving upgrades, recovery and actual reboot. |
| Honest support claims | Per-target evidence and explicit unverified vendor/minor/VM cases in BUILD.md. |

## Self-review record

- Spec requirements map to the table above and the four tasks.
- The producer and installer share one directory/manifest/NEVRA contract.
- Distribution-specific bundles satisfy the offline requirement without claiming
  that one set of OS RPMs safely spans RHEL, Rocky, AlmaLinux and Oracle Linux.
- Existing `--with-icu`, SELinux integration, signing requirements and data
  preservation remain part of the supported installation.
- Code blocks are implementation guidance, not evidence of executed code. Plan
  creation performs no package builds, installs, signing or VM changes.

## Primary references

- [DNF command reference](https://dnf.readthedocs.io/en/stable/command_ref.html): empty installroot configuration, release selection and download-only cache behavior.
- [DNF configuration reference](https://dnf.readthedocs.io/en/stable/conf_ref.html): weak dependencies, signature settings and transaction-test flags.
- [DNF modularity](https://dnf.readthedocs.io/en/stable/modularity.html): curated local repositories and `module_hotfixes`.
- [RPM dependencies](https://rpm.org/docs/latest/manual/more_dependencies.html): declared interpreter, scriptlet and package requirements.
