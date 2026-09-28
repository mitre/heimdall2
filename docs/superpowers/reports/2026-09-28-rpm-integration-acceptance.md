# RPM integration acceptance — September 28, 2026

The 2.13.1 packaging milestone passed all required acceptance checks. Both
native OL8 architectures and the complete Rocky build/install matrix passed;
local ARM64 builds, a fresh SRPM rebuild and runtime fixtures also passed.

## Candidate identity

- Branch: `feat/rpm-integrated-install`.
- Tested Heimdall source: `c540d7ac89f0b2fed16622d6af33a5d5177afffe`.
- Application base: `6c69c3c2a8c015d4ab9c6fcea4cd9feab4723c72`.
- Selected packaging donor: `e5ded4aa67d95745a4da7c64b55e13e480e412d1`.
- CLI: [`eb386bfedd56beb40462dbfb405afa3efd08f5e7`](https://github.com/seanlongcc/heimdall-cli/commit/eb386bfedd56beb40462dbfb405afa3efd08f5e7),
  published in the authorized fork on `codex/rpm-integration-prerequisites`.
- Version `2.13.1`; candidate releases `0.1.integration` and `0.2.integration`.

The user directed execution in the existing checkout and an ordinary CLI clone.
The original branches remain preserved. The donor branch's existing tip,
`1bc114429568e7e4267ca575829dadd75fdf21f4`, is the recorded donor's planning-document
child. Documentation added after acceptance does not change the tested source
identified above.

## Verification

| Check | Result |
|---|---|
| Source/version checks | 12 fixtures passed locally and on OL8 Python 3.6.8 |
| CLI acquisition/staging | Immutable pin, clean checkout, fresh man staging and wrapper fixtures passed; actual OL8 `DEV=1` staging and a fresh remote fetch passed |
| CLI prerequisites | Full Go suite, binary build and deterministic generation of 21 man pages passed with Go 1.25.8 |
| Application regression | Frozen install, 437 backend tests, 66 frontend tests and both production builds passed with Node 22.18.0 and Yarn 1.22.22 |
| Corrected local OL8 builds | Both ARM64 releases passed full binary payload and CLI provenance checks |
| Fresh SRPM rebuild | Passed from an empty `/tmp/srpm-rebuild` after deleting the original BUILD tree; rebuilt payload/man pages and release identity passed |
| Package scriptlets | Inspected from the rebuilt RPM; installation does not invoke setup or database bootstrap |
| Local OL8 lifecycle | Install, explicit setup, frontend/API/health/login, rerun, database helper, shell service checks, controlled upgrade, reboot and removal all exited 0 |
| Local recovery/TLS | Backup, rejected invalid SQL, full clean-database restore, restored configuration/ownership/mode, and trusted private-hostname Caddy HTTPS all passed |
| Local remote PostgreSQL | Separate PostgreSQL server, client-only app host, repeated setup, preserved configuration, restart, readiness and login all passed; owned resources removed |
| Rocky CI | All four EL8/EL9 × x86_64/aarch64 builds and all four signed-install checks passed |
| Native OL8 CI | Both aarch64 and x86_64 passed full lifecycle, TLS/recovery and remote fixtures |

The local lifecycle asserted preserved credentials, extra OIDC settings,
configuration checksums, migration counts and a database sentinel. Upgrade kept
the running PID unchanged until explicit setup/migrations. Removal preserved
the configuration as `.rpmsave` and left PostgreSQL and the sentinel intact.
Recovery restored a deliberately modified environment file with
`root:heimdall` ownership and mode `0640`. The expected failing-service and
invalid-SQL probes failed as required; their enclosing tests passed.

## Local artifacts and environment

These are the corrected local ARM64 artifacts, under
`packaging/rpm/dist/integration/`. Signatures and digests passed before installed
acceptance; the fresh-rebuild binary was inspected separately and is unsigned.

| Artifact | SHA-256 |
|---|---|
| Signed release 0.1 binary | `281232f0608b67603a0f02ce4fce29ff675b6459eca731cbcbb25f3a6ff6f989` |
| Signed release 0.2 binary | `0f397c8c6bdacfda7534eca5691f4402893a533ca7a823bb401a360aadb3c450` |
| Signed release 0.1 SRPM | `f7295f2824d0b0802e42105a940e2fc2b59b78e28a80fde4b25c89a7d83243b9` |
| Signed release 0.2 SRPM | `b23afe93984e51e5e297f69f286a48c2e5f124da5d8313b4a91ace49edd29f77` |
| Fresh release 0.1 rebuilt binary | `ca89783f9d2ae576f9a262f2929b3e40b56037db6d760d3ee01141d6fca00d9c` |
| Disposable public key | `e1f462f1383541ee8efa9b7bc1d26abe569b0abc27c42b1c9c3ef633a6247631` |

The signing key ID was `def685dd`; the disposable signer and private key were
removed. Separate negative signing fixtures rejected unsigned and corrupted
packages and verified private-key cleanup on failure. Repository TLS/GPG and
candidate signature checks remained enabled.

Local execution used Docker Desktop on ARM64, with OL8 8.10 ARM64 containers,
Node 22.23.3, Yarn 1.22.22, Go 1.25.8, PostgreSQL 18.6,
systemd `239-82.0.13.el8_10.19` and Caddy `2.6.4-2.el8` from
`ol8_developer_EPEL`. The build used 5 GiB RAM plus 1 GiB swap, a 2-GiB Node
heap and one frontend worker, retaining production minification/type checking.
The exact committed Git archive replaced the prepared builder's workspace.

| Local image | ID/digest |
|---|---|
| ARM64 builder | `sha256:e8a856f32add2409f596e67a7d24b35c579b59fee9d9f406db244822f5b43331` |
| ARM64 OL8 test host | `sha256:78265f7adfa7fee8eea46200617f394843cde9ffb8b7396d7db366f1a1c75d55` |
| Remote PostgreSQL image | `sha256:d8a40176c29aa0c7a20a19f85ddddc47f72d8d6789a7a86a21f3713e71fb4ad6` |
| Remote PostgreSQL repository digest | `postgres@sha256:5a5a84b19854a9ffaa54082c166ff4ec27473a361e496e5ea167f298f2da9722` |

## Native CI artifacts

The [aarch64 job](https://github.com/mitre/heimdall2/actions/runs/36477971745/job/109116340204)
and [x86_64 job](https://github.com/mitre/heimdall2/actions/runs/36477971745/job/109116340685)
ran on Ubuntu 24.04.5 LTS with matching host/daemon architectures. Their OL8
runtime package versions match those listed above. Every recorded fixture
command and all four local/remote runners exited 0, including cleanup.

| Architecture | Signed release | SHA-256 |
|---|---|---|
| aarch64 | `0.1.integration` | `232fd947a75cda42f25722e02e3ca0d85f538489249af569bacec832302f1c64` |
| aarch64 | `0.2.integration` | `c1667cc87c3e1a92a5c108260f64a443e32507d823aace9775e5f18c4d0aa57c` |
| x86_64 | `0.1.integration` | `3d649b71b98830969a45f3ca429c53a99a27f1f47e95c195b8a3ce5e05a80fa9` |
| x86_64 | `0.2.integration` | `e162a2e03265c9824242b3943cf22d610134f818494b2eda1ef0d499850497a7` |

| CI input | SHA-256/image ID |
|---|---|
| ARM64 public signing key | `8a0afda985642075912aa1d0cf1ac30748d3e6ed2a11527ee77cbc9de87f8b9f` |
| x86_64 public signing key | `8c91eed7ab7705b68df150b680dc5f710ff61b76dcafd98b6216601640cccc51` |
| ARM64 OL8 test host | `sha256:bb7534653a4042a90aa55e6fd911a8f14058cccfb3fa81758f0abd3e597dc8d5` |
| x86_64 OL8 test host | `sha256:a290998e4060568be70bc6e28f1921b448b83c122859acc39d6afa374502f94f` |
| ARM64 remote PostgreSQL | `sha256:d8a40176c29aa0c7a20a19f85ddddc47f72d8d6789a7a86a21f3713e71fb4ad6` |
| x86_64 remote PostgreSQL | `sha256:662db3da228c2ea2649b3ae04db4b4479e85fea5979f6a917a7f6d5cb1e7ec39` |

Both PostgreSQL images record the repository digest in the local table above.

## Evidence locations

[CI run 36477971745](https://github.com/mitre/heimdall2/actions/runs/36477971745)
completed successfully at the tested source above. All ten required jobs passed;
the release publication job was skipped for this workflow dispatch.
CI builds separate Rocky and OL8 artifacts;
Rocky install checks do not imply OL8 runtime certification of those artifacts.
Native CI provides both architecture results without a duplicate local
emulated x86_64 run. Workflow diagnostics have seven-day artifact retention.
All six diagnostics/lifecycle artifacts were downloaded and retained locally
with the final job status and artifact manifest before expiry.

Local raw evidence is retained outside Git:

- `.superpowers/sdd/2026-09-22-rpm-branch-integration/final-arm64-{build,signing,lifecycle,remote}.log`.
- `packaging/rpm/dist/integration/evidence/heimdall-final-build-arm64-75248/`.
- `packaging/rpm/dist/integration/evidence/heimdall-integration-arm64-83694-5082/`.
- `packaging/rpm/dist/integration/evidence/heimdall-remote-app-arm64-84002-32109/`.
- `.superpowers/sdd/2026-09-22-rpm-branch-integration/ci-36477971745-artifacts/`.
- `.superpowers/sdd/2026-09-22-rpm-branch-integration/ci-36477971745-{status,artifact-manifest}.json`.

The evidence includes source/artifact identities, image/container inspections,
command exit statuses, OS/package versions and assertion output. Build,
signing, local lifecycle and remote fixture drivers all exited 0.

## Corrected failures and scope

The first candidate, `913535a0c85dacfbb9af1625cb052814b71fa769`, exposed a real
frontend 404. The service now supplies the existing `HEIMDALL_STATIC_ROOT`
option; the compiled-resolver payload check catches the old path. EL8 CI also
exposed missing `findutils` in its smoke image. Both fixes are in the corrected
candidate. Bash 3.2 optional-CA argument handling passed an eight-case fixture.

The first fresh SRPM attempt hit its 4-GiB cgroup limit, with an OOM kill
recorded. The successful retry increased that limit to 5 GiB without disabling
build checks. Failed-attempt logs and artifacts remain under the local
`attempt-913535a0/` directories and
[CI run 36474508394](https://github.com/mitre/heimdall2/actions/runs/36474508394).

The application/dependency diff from the base contains only the backend version
correction from 2.13.0 to 2.13.1. Application, FIPS and logger source and the
lockfile are unchanged. EL8 systemd 239 ignores `ProtectClock`, `ProtectHostname`,
`ProtectKernelLogs` and `ProtectProc`; CI reported those four warnings explicitly and rejected
unexpected warnings. Container acceptance does not certify enforcing SELinux,
host FIPS mode, EL9 runtime operation, every PostgreSQL version or migration
from a real 2.14.0 database. No stable release or deployment was performed;
these candidates must not replace an installed 2.14.0 system.
