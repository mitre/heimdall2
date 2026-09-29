# Bundled RPM runtime acceptance — 2026-09-29

**Status: INCOMPLETE.** This living report records implementation and partial
verification evidence. It does not certify a finished release or a successful
integrated deployment. Both full native OL8 ARM64 Make builds, their disposable
test signatures/checksums, both fresh installed-file checks, the clean SRPM
rebuild and the actual Docker artifacts build passed. Live lifecycle,
enforcement, remaining native platforms and Actions acceptance are still open.

Named evidence reports below are retained locally under
`.superpowers/sdd/2026-09-29-bundled-rpm-runtime/`, which is ignored by Git. They
are not published repository files or CI artifacts.

## Provenance and intended candidates

| Input | Recorded state |
| --- | --- |
| Application version | `2.13.1` |
| Exact application source used for final Make builds | `999daab0c6c7f8d51df612c7f93b369d6a929ac8` |
| Built application tree | `8cd7845f40a0283c7505ec2903e08830e6fbdba1` |
| Task 2 payload implementation | `72cdd37b2b3d0e546a29885d9076d6eac408bf59` |
| Task 2 extraction guard fix | `5bdeb9917621f5e93bfa9a426f4e9ccffc35f3aa` |
| Task 5 application upgrade/security, reviewed through pending-ledger cleanup | `461f434e649a42f07dffd6c434402af384d73943` |
| Application setup delegate | `b6e7437eaa20de73c5834368fd7ce76bc61022ae` |
| Delivery/harness implementation and reviewed fix | `026a1d88cd9206111a4bc128426f2e0f946fa590`, `b0e9d4ed6a96c664b3c7c7991d18ad14ec3765c0` |
| Reviewed optional Docker build-resource hook | `531379538fb609e0bfa489d8ab8db0310519a28c` |
| CLI resolver after reviewed fixes | `d56ba4826bfcda6049615542ad2742abcfdfbc09` |
| CLI private-service implementation, Task 4 approved | `01cc812bb48c5bfaf92c1f99eb68a8bc746076c4` |
| CLI recovery/security round 2, committed, tested and independently approved | `d92ed3550e87d73db083827a8c38d22cff47765f` |
| Published CLI and current immutable package pin | `d92ed3550e87d73db083827a8c38d22cff47765f` |
| Historical Task 2 artifact CLI pin | `eb386bfedd56beb40462dbfb405afa3efd08f5e7` |
| Node.js / PostgreSQL / Caddy | `22.23.3` / `18.6` / `2.11.4` |
| Final intended lifecycle release pair | `2.13.1-0.3.integration` → `2.13.1-0.4.integration` |

Task 4 and both Task 5 CLI round 2 reviews are approved. The controller published
the reviewed CLI to `seanlongcc/heimdall-cli`, branch `codex/bundled-rpm-runtime`,
and `git ls-remote` confirmed the exact SHA above. Application commit
`2bf9d488bc056ffd254fc9c7cec2b6d23f94bc03` pins that full SHA; the repository URL
is unchanged. Full Make builds for both releases passed from the exact application
source above; later report-only commits do not change their provenance. See `task-4-rereview-1.md`,
`task-5-recovery-rereview-2.md`, `task-5-cli-security-rereview-2.md` and
`task-5-cli-publication-pin.md`.
A higher RPM release does not make application 2.13.1 an upgrade for 2.14.0.

Runtime archive URLs, full SHA-256 digests and license-file inventory are committed in
[`runtime-lock.json`](../../../packaging/rpm/runtime-lock.json). All six selected
archive records across aarch64/x86_64 were downloaded and rehashed during Task 1.
Extraction checks on x86_64 archives do not establish native x86_64 execution.

## Environment and evidence retention

Observed runtime environment: Oracle Linux 8.10, native Linux aarch64 containers
on Docker Desktop running on an ARM64 Mac; systemd 239 was available for unit-file
validation. Local x86_64 execution would be emulated. A bounded native ARM64
Rocky EL9 policy/context/scriptlet preflight passed; no native x86_64 or full EL9
bundled-runtime build/install result has been recorded. `task-5-el9-preflight.md`

Task-owned resources retained for review/reuse include:

- Builder `heimdall-task2-build-20260929`, image
  `sha256:e8a856f32add2409f596e67a7d24b35c579b59fee9d9f406db244822f5b43331`.
- Clean OL8 test image `heimdall-task2-test:arm64`, image
  `sha256:00db6f20ab3ebaecace7ebda7fbedfa1b695408550d87ae4ca204957fbf1a994`.
- Unprivileged installed host `heimdall-task2-install-files-20260929`, with a
  sleep process as PID 1; this is not a live systemd acceptance host.
- Evidence from ordinary OL8 trust smoke container
  `heimdall-native-trust-smoke-20260929`, retired after its synthetic backup was
  exported, hash-verified and protected as mode 0600. It used sleep as PID 1 and
  an explicitly non-RPM addon fixture. Reports/logs remain retained.
  `task-5-native-trust-smoke.md`, `task-6-final-sign-install.md`
- Original evidence under `.superpowers/sdd/2026-09-29-bundled-rpm-runtime/`,
  runtime archive caches, exported iteration artifacts, and reported CLI test
  logs under `/private/tmp/`. These are retained local evidence, not published
  CI artifacts. Do not remove them as part of final build preparation.

Task 2 used a cached builder limited to 5 GiB RAM plus 1 GiB swap, a 2 GiB Node
heap and a one-worker Vue override. The complete application/runtime compilation
succeeded, followed by explicitly recorded metadata-only RPM packaging iterations.
Those iterations are not clean final-source build evidence.

On 2026-09-29, the EL9 preflight recorded 24 GiB available in the 63 GiB Docker VM
and about 76 GiB host free space. The later OL8 trust smoke recorded 24 GiB free
initially and 23 GiB afterward. These are dated observations, not a fresh capacity
check for this report. Required evidence and input caches remain preserved.
`task-5-el9-preflight.md`, `task-5-native-trust-smoke.md`

## Observed results and limits

| Check | Observed result | Evidence / limit |
| --- | --- | --- |
| Final full native Make builds | Both releases 0.3 and 0.4 passed normal `rpmbuild -ba` in `SOURCE_MODE=head` on OL8 ARM64 | `task-6-final-native-execution.md`, `task-6-final-make-0.3.log`, `task-6-final-make-0.4.log`; clean exact-source bundle clone, no metadata-only or short-circuit build |
| Final Make payload and provenance | Both releases passed clean input guards, payload/dependency checks, exact CLI source/binary commit and generated-man provenance; fresh compiled watcher addon loaded under private Node 22.23.3 | `task-6-final-check-0.3.log`, `task-6-final-check-0.4.log`; addon check uses the build tree, not an installed addon claim |
| Final Make test signing | All four RPM/SRPM signatures passed; six post-sign checksum entries verified after export and independently by the controller | `task-6-final-sign-install.md`, `final-sign-install/signing.log`; disposable test key, not a production signature |
| Fresh final-package installation | Both releases passed normal GPG-checked DNF installation, payload/provenance/man checks, installed runtimes/linkage, ownership and unit-file checks; the untrusted-key negative gate rejected 0.3 before installation | `final-sign-install/check-03.log`, `final-sign-install/check-04.log`, `task-6-final-sign-install.md`; separate ordinary OL8 ARM64 containers, no live systemd/enforcement |
| Clean SRPM rebuild | Full 0.4 rebuild in a previously nonexistent TOPDIR passed supplied-source hash and rebuilt-payload checks | `task-6-final-srpm-rebuild.log`; native OL8 ARM64, separately exported unsigned result |
| Actual runtime archive acquisition | Both architecture selections verified | Task 1 report and selected manifests; no executable x86_64 claim |
| Build toolchain | Native ARM64 complete build succeeded | `task-2-build-final.log`; Python 3.9 fixed node-gyp 12 incompatibility, cleared Make recursion state fixed PostgreSQL generated headers |
| Exact Node/addon use | Private Node 22.23.3 built and loaded native addon | `task-2-addon-python39.log`, `task-2-addon-load.log`; actual Yarn process executable also inspected |
| Payload/ELF metadata/notices | Passed for unsigned Task 2 iteration RPM | `task-2-payload-green.log`, `task-2-notices.log`, `task-2-final-artifacts.log`; private provides/self-requires filtered narrowly, normal OS requirements retained |
| Clean OL8 installation | DNF installed RPM plus ordinary OS dependencies | `task-2-installed-green.log`, `task-2-final-installed.log`; no system runtime RPMs/global aliases or NodeSource/PGDG runtime-host setup |
| Installed runtimes and libraries | Node, PostgreSQL tools and Caddy versions executed; private PostgreSQL executable/shared-library `ldd` checks resolved | `task-2-installed-green.log`, `task-2-ldd.log`; installed runtime paths, not relocated extracted PostgreSQL |
| Installed ownership/permissions | Dedicated state/socket owners; Caddy traverses its config and cannot read backend.env | `task-2-installed-green.log`; corrected an initial test's hyphenated-group false match |
| Unit files | All three units verified; private units disabled on disk | Only EL8 warnings for `ProtectClock`, `ProtectHostname`, `ProtectKernelLogs`, `ProtectProc`; no live start/stop/reboot evidence |
| Scratch PostgreSQL | Private initdb/pg_ctl/psql/pg_dump succeeded on socket and port 55432 | Returned `heimdall-postgres\|18.6`, found ICU collations, produced SQL dump and stopped cleanly; not CLI-owned application setup |
| Actual CLI initdb options | Private initdb succeeded with UTF8, C.UTF-8, peer local/SCRAM host authentication | Task 4 report/tool transcript; scratch cluster only, no PostgreSQL service started in this smoke |
| Actual generated Caddy forms | Internal, ACME and custom forms passed canonical formatting and private-account validation | `task-4-rereview-1.md`; no formatting warnings after correction; disposable certificate near-expiry warning expected; no listener or service activation |
| Runtime extraction guard | Seven maintained regression cases passed on host and actual OL8 Python 3.6.8 after red reproduction | `task-2-extraction-round1-*-{red,green}.log`; pinned archive extraction/hash checks passed for both host selections and native OL8 aarch64 input |
| Current CLI Go/functional checks | Full Go and functional suites passed on unchanged source committed as `d92ed3550e87d73db083827a8c38d22cff47765f` | `task-5-recovery-round2.md`; command package 16.349s, functional 15.085s; both source reviews passed, no installed-host acceptance |
| Current CLI Linux cross-builds | `CGO_ENABLED=0` builds passed for amd64 and arm64 | `task-5-recovery-round2.md`; static ELF outputs checked; compile evidence, not native x86_64 execution |
| Published CLI pin checks | Input 12/12, runtime-input 7/7, acquisition fixture and committed-head input validation passed | `task-5-cli-publication-pin.md`; local fixture evidence is now supplemented by real published-CLI acquisition/build and matching man-page checks in both final Make runs |
| CLI recovery/security failure boundaries | Focused filesystem/archive, CA round-trip, migration-marker, port-ledger and trust regressions passed; both fresh reviews approved | `task-5-recovery-rereview-2.md`, `task-5-cli-security-rereview-2.md`; real local files and independent failure probes, with service/database boundaries substituted |
| Native scratch backup/SQL | Actual URL-only credentials, private PostgreSQL 18.6 dump, cross-filesystem archive publication and SQL replay passed; configuration and disposable CA/key bytes matched | `task-5-native-backup-smoke.md`; non-root-owned `/dev/shm` output (`heimdall-backup-smoke`), protected `/tmp` staging, archive root:root0600/single-link; direct scratch `pg_ctl`, not CLI restore or systemd lifecycle |
| Public shell setup delegate | PTY defaults, exact argument forwarding, exit propagation and retired-installer refusal passed | Task 4 report; scratch recording executable, no host setup performed |
| Delivery orchestration regression | Delayed authenticated TCP, misleading failed output, wrong result and timeout cleanup passed | `task-6-report.md`; actual host runner with Docker/sleep stubs, no containers |
| SRPM supplied sources | Actual iteration SRPM Sources 23–28 extracted and compared to staged inputs | `task-2-final-artifacts.log`; this is source completeness inspection, **not a clean SRPM rebuild** |
| Docker build-resource hook/export | Reviewed optional heap/worker settings passed bounded configuration checks, then the full actual artifacts target, CLI/payload checks and all three exports passed | `task-6-docker-memory-review.md`, `task-6-final-docker-artifacts.log`; clean exact-commit export in workspace mode; unsigned outputs, no peak-memory measurement |
| Upgrade/removal scriptlet decisions | Expanded native OL8 fixture passed, including real root/setgid ledger metadata and canonical/pending cleanup | `task-5-app-rereview-1.md`, `task-5-app-pending-ledger-review.md`; command boundaries stubbed, no upgrade/removal transaction or live systemd test |
| SELinux policy development | Policy compiled and 12 selected contexts matched on native OL8 | `task-5-app-report.md`; SELinux **Disabled**, no policy load or enforcement claim |
| Bounded native EL9 preflight | Policy compiled; 19 contexts, 14 stock types, RPM expansion, scriptlet syntax and upgrade fixture passed; Python 3.9 available | `task-5-el9-preflight.md`; native ARM64, SELinux **Disabled**; not a full build, installed-runtime or enforcement check |
| Native fapolicyd file compatibility | Actual OL8 tool passed first/repeated refresh, changed hashes, stale-row removal, spaces, administrator preservation and owned remove/re-add | `task-5-native-trust-smoke.md`; **69 packaged runtime records**, eight verified aliases, zero packaged `.node` files; **70 only with the non-RPM watcher fixture**; daemon inactive |

The earlier report/workflow integration pass reran only
`python3 packaging/rpm/tests/runtime-extraction.py` (7 cases passed),
`python3 packaging/rpm/tests/upgrade-scriptlets.py` (passed against application
commit `7025fee735604bf93afc69a932588ff2600c52e8`), and the workflow YAML parser
(passed with four native build entries). Logs are retained as
`task-6-followup-{extraction,upgrade,yaml}.log` in the local evidence directory.
Both maintained regressions are now wired into the existing pre-build CI fixture
step. No Actions execution is implied.

Representative completed commands recorded in the task evidence include:

```sh
python3 packaging/rpm/tests/runtime-extraction.py
bash packaging/rpm/tests/payload.sh ITERATION_RPM 2.13.1
bash packaging/rpm/tests/cli-inputs.sh /rpmbuild
systemd-analyze verify /usr/lib/systemd/system/heimdall-{server,postgresql,caddy}.service
```

For current CLI commit `d92ed3550e87d73db083827a8c38d22cff47765f`, the stable
six-file diff matched the native-tested source before and after full/functional
checks, Linux cross-builds and staging. Go 1.25.8 ran `go test ./... -count=1` and
`go test -tags functional ./internal/cmd/ -count=1`, both exit 0. Logs are
`/private/tmp/task5-cli-round2-{full,functional,linux-builds}.log`.
The native trust candidate was built from that same unchanged source; its binary
SHA-256 is `d6662b420f1ee196de199e884c49955f610b2e1688cc9167c04c5c24bac788f4`.
These are recorded checks, not tests rerun for this documentation refresh.
`task-5-recovery-round2.md`, `task-5-native-trust-smoke.md`

## Final signed native Make candidates

Both actual builds used application `999daab0c6c7f8d51df612c7f93b369d6a929ac8`
and published CLI `d92ed3550e87d73db083827a8c38d22cff47765f`. A standard Git
bundle was verified, cloned to a clean detached checkout in the retained native
OL8 ARM64 builder, and checked again with the committed-input guard. The two
normal Make invocations used `SOURCE_MODE=head`, `TOPDIR=/rpmbuild`, releases
`0.3.integration` and `0.4.integration`, the retained Yarn cache,
`NODE_OPTIONS=--max-old-space-size=2048`, and the one-worker Vue override.
Production frontend, backend, PostgreSQL and addon compilation ran for each
release; neither build used metadata-only packaging or short-circuit macros.

The four exported RPM/SRPM copies were signed with one disposable RSA/SHA256
test key, fingerprint `E8D883EA4F16EDCE576368D67993034CE81F97DB`. All four
signature checks passed. Only the public key was exported; the helper removed
its private key directory. This is a test signature with one-day validity, not a
production distribution signature. Non-TTY `GPG_TTY` warnings are retained in
`final-sign-install/signing.log` and did not prevent successful verification.

Base directory: `packaging/rpm/dist/bundled-final-arm64/`. These are the final
**post-signing** Make-bundle hashes. `SHA256SUMS` covers all six entries and passed
after export and again in the controller's independent check.

| Artifact | SHA-256 |
| --- | --- |
| `RPMS/aarch64/heimdall-server-2.13.1-0.3.integration.el8.aarch64.rpm` | `69ae834ce9477b957d751f9081378108e643068339ed08082336926d7fab5f16` |
| `SRPMS/heimdall-server-2.13.1-0.3.integration.el8.src.rpm` | `98443d9ad2e6f764c2ad0d9b2e26ce597de463351c1edaff77f739a2bfd62b94` |
| `RPMS/aarch64/heimdall-server-2.13.1-0.4.integration.el8.aarch64.rpm` | `cd9a0107c388644d8d040ac9f8fb4829833e7b626861f7e9dbac1ea2e769f5b0` |
| `SRPMS/heimdall-server-2.13.1-0.4.integration.el8.src.rpm` | `e28d3a2db17542d43b95d452ffc551c616c4c081bdf6c202b4b972e3b0334246` |
| `runtime-manifest.json` | `8fba6a7291092bd543792b9c9812ec670c5a15af2fac1300f5b88f1f2c301f83` |
| `RPM-TEST-GPG-KEY` | `d52defee1602b25d069cd87184e29f58b77d95b79ba1066f62415cf3622ce312` |

Unsigned builder originals and pre-sign hash evidence remain separate in
`task-6-final-native-execution.md` and `task-6-final-export-0.3.sha256` /
`task-6-final-export-0.4.sha256`. `BUILD-INFO.txt` in the ignored output directory
records this layout and the fixed source provenance. `task-6-final-sign-install.md`

## Fresh ordinary OL8 installation

Both releases passed normal DNF installation with `localpkg_gpgcheck=1` and
ordinary RPM scriptlets in separate fresh native ARM64 OL8 containers. Before
key import, the 0.3 host rejected the package with `GPG check FAILED` and confirmed
it remained uninstalled. After key import both installs and installed checks
exited zero. No service stub or scriptlet bypass was used. Checks passed for the
signed payload, installed CLI commit/date,
generated man pages, private runtime versions, PostgreSQL/Node shared-library
resolution, absent ambient runtime packages/global aliases, account permissions,
and disabled on-disk unit state. Neither fresh install created a PostgreSQL
cluster, generated Caddyfile or upgrade marker. The staged and installed CLI
report commit `d92ed3550e87d73db083827a8c38d22cff47765f`, built
`2026-09-29T15:32:03-04:00`.

An initial raw comparison of the SRPM-staged CLI with the installed ELF was a
fixture error: normal RPM build-root processing strips additional sections.
Replaying the exact recorded strip processing on a scratch copy produced the
installed/signed-payload SHA-256
`576566c1c1c22be9f857752893ac147714631152053ad1520b9b979721d79b92`;
source and installed binaries report the same pinned commit and build date.
No product change was required. The failed log and `final-sign-install/cli-strip-proof.log`
are retained.

Unit verification exited zero on both hosts but older systemd ignores `ProtectClock`,
`ProtectHostname`, `ProtectKernelLogs` and `ProtectProc`; those protections are
unavailable on this host. The install also recorded the SELinux module-name
warning and absent fapolicyd. SELinux was Disabled and PID 1 was sleep; the real
systemd bus query failed. These checks establish files and executable runtimes,
not service startup, setup, upgrade, reboot, restore or enforcement.
`final-sign-install/check-03.log`, `final-sign-install/check-04.log`,
`final-sign-install/install-03-untrusted-key.log`,
`final-sign-install/install-03.log`, `final-sign-install/install-04.log`,
`final-sign-install/install-03-limits.log`, `final-sign-install/install-04-limits.log`

## Separate unsigned SRPM rebuild

The full `0.4.integration` SRPM rebuild passed in the previously nonexistent
`/tmp/heimdall-final-srpm-rebuild-999daab` TOPDIR. The committed helper used only
the SRPM's supplied sources, verified runtime hashes, installed declared build
requirements, performed normal `rpmbuild --rebuild`, and passed the actual rebuilt
payload check. Its log ends with `Final empty-tree SRPM rebuild: PASS`.

The controller exported the result separately beneath
`packaging/rpm/dist/bundled-final-arm64/`; it remains **unsigned** and is not
covered by the primary signed bundle's `SHA256SUMS`. Its own
`srpm-rebuild/SHA256SUMS` records this separate output.

| Artifact | SHA-256 |
| --- | --- |
| `srpm-rebuild/RPMS/aarch64/heimdall-server-2.13.1-0.4.integration.el8.aarch64.rpm` | `829225e1b4def06bec3ad3d422940fffebf2eb293d2218f41fb9317cb21b0fe1` |

The original build agent stopped after the completed rebuild with an automated
safety flag whose triggering operation was not identified. Read-only handoff
collected the completed sessions; no rejected operation was retried. The
controller continued the separately authorized ordinary Docker build.
`task-6-final-srpm-rebuild.log`, `task-6-final-native-execution.md`

## Separate unsigned Docker artifacts

The actual `artifacts` target completed with exit zero from a clean `git archive` export of
application `999daab0c6c7f8d51df612c7f93b369d6a929ac8`, using the committed
Dockerfile and ignore file, `SOURCE_MODE=workspace`, release `0.3.integration`,
the corporate CA secret and the reviewed 2048 MiB/one-worker arguments. The full
builder RUN completed Make, `cli-inputs.sh` and `payload.sh`, then exported RPMs,
SRPMs and the runtime manifest. It acquired the final pinned CLI `d92ed355`.
This was an ordinary native ARM64 Docker build, separate from the Make head-mode
outputs.

Base directory: `packaging/rpm/dist/bundled-final-arm64/docker-artifacts/`.
These artifacts are **unsigned**. Their local `SHA256SUMS` records these three
outputs; the controller confirmed the manifest is identical to the main bundle.

| Artifact | SHA-256 |
| --- | --- |
| `RPMS/aarch64/heimdall-server-2.13.1-0.3.integration.el8.aarch64.rpm` | `a0591f9b84cd8c5e861e3a60bbd865fd5cabdc5dc5e1c71141f261a096e9201c` |
| `SRPMS/heimdall-server-2.13.1-0.3.integration.el8.src.rpm` | `749ef3e250e0ce7ba4715369dcdb4365c2e51e68f273785eb040ba5a1c1457fc` |
| `runtime-manifest.json` | `8fba6a7291092bd543792b9c9812ec670c5a15af2fac1300f5b88f1f2c301f83` |

They remain outside the primary signed bundle's `SHA256SUMS` and were not the
packages used for the fresh installation checks. `task-6-final-docker-artifacts.log`,
`task-6-final-native-execution.md`

## PRE-FINAL unsigned Task 2 iteration artifacts

These hashes identify preserved development evidence only. The packages contain
the old CLI pin `eb386bfedd56beb40462dbfb405afa3efd08f5e7`, predate the extraction
review fix and final upgrade/security changes, and were built from an explicit
workspace snapshot with subsequent metadata-only iterations. They are not final
signed integration candidates or evidence for the current committed source.

Base directory: `packaging/rpm/dist/bundled-task2-arm64/`.

| Artifact | SHA-256 |
| --- | --- |
| `RPMS/aarch64/heimdall-server-2.13.1-0.3.integration.el8.aarch64.rpm` | `5ccf08bd959e4d00a4fc4a0cadbb75d900268b3a22977d6216f871b654540a29` |
| `SRPMS/heimdall-server-2.13.1-0.3.integration.el8.src.rpm` | `a6db58969599e749c0744ed0b368f0abd13bb3ee14d7ee4b2787b6b14814bff4` |
| `runtime-manifest.json` | `8fba6a7291092bd543792b9c9812ec670c5a15af2fac1300f5b88f1f2c301f83` |

The recorded manifest identifies aarch64 and the literal runtime versions above.
These historical unsigned RPM hashes differ from the final post-signing Make
hashes recorded above. Only the final bundle's public test key is exported;
private signing material is not distributed.

## Review findings and correction state

- Task 2's original payload check failed on the preceding RPM's absent private
  Node. Native builds then exposed Python/node-gyp, Make recursion and private ELF
  metadata issues; fixes and failed logs are retained in `task-2-report.md`.
- Task 2 review reproduced a Python 3.6 archive hardlink-to-symlink relocation
  escape. Commit `5bdeb9917621f5e93bfa9a426f4e9ccffc35f3aa` rejects that source.
  Host/OL8 red-green and actual pinned extraction checks passed; scoped re-review
  found it addressed with no new Important/Critical breakage.
- Task 3 resolver/TLS/password review corrections passed scoped re-review at
  `d56ba4826bfcda6049615542ad2742abcfdfbc09`.
- Task 4's systemd inactive-state handling, replacement-endpoint ownership guard,
  service-command coverage and canonical Caddy formatting were corrected and
  approved at `01cc812bb48c5bfaf92c1f99eb68a8bc746076c4`. All findings were
  addressed with no new Critical/Important breakage. `task-4-rereview-1.md`
- Task 6's retired helper invocation and external PostgreSQL initialization-socket
  race were corrected in `b0e9d4ed6a96c664b3c7c7991d18ad14ec3765c0`. The new
  Docker-stub regression failed on the old race and passed after correction;
  scoped re-review approved both fixes. Task 2's Docker manifest export was
  source-reviewed and has now passed the actual artifacts-stage execution.
- Task 5 application backup/query guards and the root:root replacement-ledger
  correction are approved through `f446ea93eb91ca5ab0c39c1168dafc109ceb6152`.
  Canonical/pending SELinux-ledger cleanup passed a separate review at
  `461f434e649a42f07dffd6c434402af384d73943`. `task-5-app-rereview-1.md`,
  `task-5-app-pending-ledger-review.md`
- Cumulative application source review passed through `f446ea93e`; the later
  Docker build-resource hook passed its separate review at
  `531379538fb609e0bfa489d8ab8db0310519a28c`. These approvals do not establish a
  final artifact build or installed lifecycle. `app-integration-review.md`,
  `task-6-docker-memory-review.md`
- Final cross-repository contract review passed at application `999daab0c` and
  CLI `d92ed355` with no actionable findings. It checked scriptlet calls,
  upgrade/restore markers, private paths/accounts, dependency drop-in bytes,
  canonical/pending SELinux ledgers, fapolicyd calls and harness flags. This is
  source-contract evidence, not live lifecycle acceptance. `final-contract-review.md`
- Task 5 CLI round 1 corrected resolved URL credentials, confined Caddy recovery,
  startup-failure compensation, retained SELinux ownership evidence and alias
  target validation. Security re-review passed at `a7d89c9`; recovery re-review
  then reproduced a mutable backup-output boundary, and native fapolicyd testing
  found cross-file duplicate rejection on repeated refresh. Both received
  focused corrections in `d92ed3550e87d73db083827a8c38d22cff47765f`, followed by
  shared tests, cross-builds and corrective native trust checks. **Both fresh
  round 2 reviews passed with no actionable findings.** The separate native
  scratch backup/SQL check also passed. `task-5-recovery-rereview-2.md`,
  `task-5-cli-security-rereview-2.md`, `task-5-native-trust-smoke.md`,
  `task-5-native-backup-smoke.md`
- The first native Task 5 fixture encountered a noexec temporary directory. The
  maintained test now directly executes its stub before scriptlets can run, so
  this environment error fails safely. The corrected unprivileged native fixture
  used an executable tmpfs and passed; no privileged workaround was used.

## Remaining acceptance gates

| Required gate | Status |
| --- | --- |
| Complete reviewed CLI, prerequisite push and verified immutable package pin | Passed at CLI `d92ed3550e87d73db083827a8c38d22cff47765f`; application pin commit `2bf9d488bc056ffd254fc9c7cec2b6d23f94bc03` |
| Final clean committed `SOURCE_MODE=head` native builds, releases 0.3 and 0.4 | Passed on native OL8 ARM64 from application `999daab0c` / CLI `d92ed355` |
| Final signed RPM/SRPM bundles, matching CLI/man provenance, post-sign hashes | Passed for both Make releases with the disposable test key; all six checksum entries verified |
| Fresh signed-package installation on native OL8 ARM64 | Both releases passed ordinary GPG-checked DNF/file/runtime checks; no live lifecycle claim |
| Empty-tree SRPM rebuild | Passed on native OL8 ARM64; all four native Rocky targets pending |
| Actual Docker artifacts target | Passed from the exact-source workspace context, including CLI/payload checks and all three exports; unsigned outputs remain separate |
| Four native Rocky EL8/EL9 × x86_64/aarch64 installed-package checks | Pending |
| Native OL8 ARM64 and x86_64 live systemd lifecycle runs | Signed candidates available; privilege authorization and native-platform execution remain pending |
| All four fresh database/proxy combinations, offline bundled setup, authenticated HTTPS | Pending |
| Same-host external PostgreSQL, system proxy coexistence, occupied-port refusal and ownership transitions | Pending |
| Saved reruns, skipped work, port changes, failed setup/migration and selected-service behavior | Focused/functional coverage passed; installed-host execution pending |
| Installed backup/CA round-trip, upgrade guards, two-release upgrade, reboot, removal/recovery | Local filesystem/CA fixtures, native scratch backup/SQL and scriptlet fixtures passed; CLI restore/integrated lifecycle pending |
| Real preceding-package transition using retained old artifact | Pending |
| Enforcing OL8 SELinux and fapolicyd, contexts, health/HTTPS and absence of relevant denials | Pending; no suitable authorized host identified |
| Completed Actions run and four downloadable artifact bundles | Pending; no run dispatched or uploaded for this implementation |

Automatic approval review rejected a proposed `--privileged --cgroupns=private`
container because it crosses a broad host security boundary and the exact
privilege scope lacked trusted user authorization. The controller asked for
explicit approval for disposable OL8 fixtures without host mounts; no answer has
been received. No privileged local retry or CI workaround is authorized. The
unprivileged runtime checks above do not close this gate.

Application-branch publication/Actions authorization still needs resolution after
concrete final code is ready. CLI prerequisite publication and the immutable pin
are complete under the separately authorized reviewed handoff. No application
push, CI dispatch or artifact upload occurred during this report refresh.

No enforcing OL8 VM has been identified. Policy compilation, context matching and
privileged containers cannot establish SELinux/fapolicyd enforcement. Stock
bundled runtimes do not establish FIPS validation.

## Final build and reporting handoff

The source transfer and both full Make builds described in
`final-build-handoff.md` have completed. Their fixed source provenance is
`999daab0c6c7f8d51df612c7f93b369d6a929ac8`; subsequent report-only commits must
not be substituted as the built source. Preserve the frozen bundle/context,
unsigned builder originals, final signed host copies, separate rebuild/Docker
outputs and original evidence. `task-6-final-native-execution.md`

As final builds and authorized acceptance checks run, record exact source commits,
commands, platform identities, signed hashes and pass/fail outcomes for each gate.
Keep the old unsigned artifact table as historical evidence, clearly separate
from final signed outputs. The existing workflow retains its four artifact names
and release guard; a workflow definition is not a successful Actions run.
