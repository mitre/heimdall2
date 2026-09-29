# Bundled RPM runtime acceptance — 2026-09-29

**Status: INCOMPLETE.** This living report records implementation and partial
verification evidence. It does not certify a finished release or a successful
integrated deployment. No final signed artifacts or completed Actions run exist
for the bundled-runtime change yet.

Named evidence reports below are retained locally under
`.superpowers/sdd/2026-09-29-bundled-rpm-runtime/`, which is ignored by Git. They
are not published repository files or CI artifacts.

## Provenance and intended candidates

| Input | Recorded state |
| --- | --- |
| Application version | `2.13.1` |
| Application snapshot before this report commit | `2bf9d488bc056ffd254fc9c7cec2b6d23f94bc03` |
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
is unchanged. Final builds have not occurred. See `task-4-rereview-1.md`,
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
- Ordinary OL8 trust smoke container `heimdall-native-trust-smoke-20260929`,
  retained through independent review with sleep as PID 1 and no daemon. Its
  real addon is an explicitly non-RPM fixture. `task-5-native-trust-smoke.md`
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
check for this report. Recheck before final builds and preserve required evidence
and input caches. `task-5-el9-preflight.md`, `task-5-native-trust-smoke.md`

## Observed results and limits

| Check | Observed result | Evidence / limit |
| --- | --- | --- |
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
| Published CLI pin checks | Input 12/12, runtime-input 7/7, acquisition fixture and committed-head input validation passed | `task-5-cli-publication-pin.md`; acquisition fixture uses a local test repository; fetching/building the real published CLI and matching man pages remain final-build work |
| CLI recovery/security failure boundaries | Focused filesystem/archive, CA round-trip, migration-marker, port-ledger and trust regressions passed; both fresh reviews approved | `task-5-recovery-rereview-2.md`, `task-5-cli-security-rereview-2.md`; real local files and independent failure probes, with service/database boundaries substituted |
| Native scratch backup/SQL | Actual URL-only credentials, private PostgreSQL 18.6 dump, cross-filesystem archive publication and SQL replay passed; configuration and disposable CA/key bytes matched | `task-5-native-backup-smoke.md`; non-root-owned `/dev/shm` output (`heimdall-backup-smoke`), protected `/tmp` staging, archive root:root0600/single-link; direct scratch `pg_ctl`, not CLI restore or systemd lifecycle |
| Public shell setup delegate | PTY defaults, exact argument forwarding, exit propagation and retired-installer refusal passed | Task 4 report; scratch recording executable, no host setup performed |
| Delivery orchestration regression | Delayed authenticated TCP, misleading failed output, wrong result and timeout cleanup passed | `task-6-report.md`; actual host runner with Docker/sleep stubs, no containers |
| SRPM supplied sources | Actual iteration SRPM Sources 23–28 extracted and compared to staged inputs | `task-2-final-artifacts.log`; this is source completeness inspection, **not a clean SRPM rebuild** |
| Docker build-resource hook/export | Optional heap/worker arguments passed nine native configuration cases and BuildKit parser validation; source review approved | `task-6-docker-memory-review.md`; production minification/type checking retained; full compilation, measured peak memory and artifacts export pending |
| Upgrade/removal scriptlet decisions | Expanded native OL8 fixture passed, including real root/setgid ledger metadata and canonical/pending cleanup | `task-5-app-rereview-1.md`, `task-5-app-pending-ledger-review.md`; command boundaries stubbed, no RPM transaction or live systemd test |
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
Signing changes RPM bytes; final artifact hashes must be calculated after their
actual disposable signatures. No private signing material is to be distributed.

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
  scoped re-review approved both fixes. Docker manifest export is now source
  complete in Task 2, with actual artifacts-stage execution still pending.
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
| Final clean committed `SOURCE_MODE=head` native builds, releases 0.3 and 0.4 | Pending |
| Final signed RPM/SRPM bundles, matching CLI/man provenance, post-sign hashes | Pending |
| Empty-tree SRPM rebuild on all four native Rocky targets | Pending |
| Four native Rocky EL8/EL9 × x86_64/aarch64 installed-package checks | Pending |
| Native OL8 ARM64 and x86_64 live systemd lifecycle runs | Pending privilege authorization and final candidates |
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

Follow the retained `final-build-handoff.md`: validate final clean HEAD on the
host, transfer a standard Git bundle to the retained builder, clone it into its
task-owned workspace and verify the identical HEAD. Use a normal Make build with
`SOURCE_MODE=head`, external TOPDIR, retained verified runtime/Yarn inputs and the
recorded worker/memory settings. Do not fabricate a snapshot commit or present
metadata-only repackaging as a final build. Refresh only task-owned build paths
after review no longer needs them; preserve unrelated host/container resources.
The reviewed optional Docker `NODE_OPTIONS` and `VUE_BUILD_WORKERS` arguments
support the recorded resource limits; they have not yet been used for a complete
artifacts-stage build. `task-6-docker-memory-report.md`

As final builds and authorized acceptance checks run, record exact source commits,
commands, platform identities, signed hashes and pass/fail outcomes for each gate.
Keep the old unsigned artifact table as historical evidence, clearly separate
from final signed outputs. The existing workflow retains its four artifact names
and release guard; a workflow definition is not a successful Actions run.
