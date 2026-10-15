# RPM remediation acceptance — 2026-10-15

All eleven audit findings are fixed, with task reviews and a clean scoped final review. Release qualification is incomplete: no new RPM or SRPM was produced, remote CI requires approval, and the host/browser gates below remain open.

## Candidate and scope

- Branch: `codex/rpm-audit-remediation`, isolated from `feat/rpm-packaging` at `885d04dd5e94208f2d0b4795d320d8d8baf76f42`.
- Audited source candidate before the CI follow-up below: `44c5ed66033a3986da92aa8ff0098b28bf1fa934`. The subsequent acceptance commit changes documentation only.
- Application version: `2.14.0`. No application dependency or runtime service was added.
- CLI base: `ea29e299ca0206519dd324c9543c74cba80c1963`.
- Audited CLI patch SHA-256: `d2229fa541a1cee48e1c2148dbe6048dbd940daa32b5a7fba52201a76452c582`.
- Requirements: [implementation plan](../plans/2026-10-15-rpm-branch-audit-remediation.md) and [design](../specs/2026-10-15-rpm-branch-audit-remediation-design.md).

The full review covered the remediation range from the base through `638665b46`. Its two minor findings—changed-block lint and unconditional public-port-443 documentation—were corrected at `44c5ed660` and independently re-reviewed. No functional blocker remains from that source review. This conclusion does not certify a release artifact.

## Corrected findings

| Finding | Implemented behavior and evidence |
| --- | --- |
| F1: Registry credentials in build inputs | Workspace tar and Docker context exclude root/nested `.npmrc` and `.yarnrc.yml`. Synthetic archive and actual Docker-context checks passed. |
| F2: Unsafe cleanup paths | Validation precedes deletion and version parsing. Protected paths, TOPDIR symlinks and unknown directory entries are refused. All 27 input tests passed. |
| F3: Deselected proxy survives restore | Changed managed proxies are disabled and stopped before restored configuration replaces their selection. Same-mode restore stops the unit; failures abort before replacement and SQL. |
| F4: Shared rate-limit bucket behind managed proxies | Both managed modes trust loopback forwarding independently of sessions. Express IPv4/IPv6/spoofing tests and real HTTP checks passed. |
| F5: Fresh backend port conflicts with stock SELinux | Fresh RPM template/default is 3002. Saved, explicit, standalone and configured legacy choices remain intact; listener/SELinux conflicts still fail before mutation. |
| F6: Custom Caddy public port remains blocked | Both callers use the configured public endpoint. Exact owned rules, administrator rules, backend privacy and rollback are preserved. Set-port shares endpoint-collision preflight. |
| F7: Password reset sends invalid psql variable syntax | SQL uses stdin with connection environment, `-X` and `ON_ERROR_STOP=1`. Actual PostgreSQL reset/login passed in both database modes. |
| F8: Configured upload limit is ineffective | Nest Multer module applies validated MiB and file-count limits. Real multipart tests and an authenticated HTTP 413/no-persistence check passed. |
| F9: Departing administrator becomes replacement owner | Both replacement searches exclude the departing identity. Owner-to-owner updates avoid replacement. Real removal, demotion and whole-user-deletion checks passed. |
| F10: Tag deletion is not awaited in the transaction | Promise.all receives the deletion promises directly. Deferred/rejected tests and a real PostgreSQL trigger-induced rollback passed. |
| F11: Failed trust update reports success | Checked update-ca-trust failures stop success output and environment mutation. Exit-status and execution-error regressions passed. |

The lifecycle workflow now runs its existing guard, host-argument and remote-readiness fixtures immediately after checkout. The real password-reset/login fixture is committed and called by topology acceptance.

## Verification results

Results identify the tested source surface. Later formatting/documentation corrections were followed by the affected tests, build, lint comparison and scoped review; unchanged suites were not repeated.

| Check | Result | Provenance and limits |
| --- | --- | --- |
| Backend database suite | **Passed: 17 files, 233 tests** | Fresh migrated PostgreSQL 18.6; configuration suite excluded because it mocks the filesystem and expects no supplied DB environment. Includes all new regression suites. |
| Isolated configuration suite | **Passed: 10 tests** | Separate process without the database fixture environment. Combined backend total is 243 distinct tests. |
| Final affected backend suites | **Passed: 5 files, 36 tests** | Final polish: proxy, configuration, multipart, transaction and owner checks. These overlap the 243 above. |
| Backend build | **Passed** | Final `yarn backend build` includes all source changes at `44c5ed660`. |
| Full application build | **Passed: 4 projects** | Local installed dependencies, Node 26.4.0. Existing warnings remain. The build's two unrelated generated converter assets were restored. |
| Frontend | **Passed: 7 files, 33 tests** | Node 24.15.0. Node 26.4.0 initially failed one test because localStorage was unavailable in that test environment; no frontend source was changed. |
| InSpec | **Passed: 4 files, 6 tests** | Local installed dependencies. |
| Converters | **175/176 distinct tests passed** | Aggregate of an initial run and targeted harness corrections, not one clean full-suite invocation. Isolated SonarQube URL/expected fixtures used port 13001; candidate files were unchanged. Splunk failed with `ECONNREFUSED 127.0.0.1:8089`. |
| XML/browser prerequisites | **Partial** | Both XCCDF XML files are well formed; schema action was not run. Cypress executable smoke check and OIDC discovery passed; no browser specs or HTTPS session callback ran. |
| Strict lint | **No added diagnostics in ten compared changed backend files** | Baseline-aware comparison: 598 original diagnostics, 613 before polish, 574 final; all final diagnostics match the original baseline. Four new specs pass direct strict ESLint. Whole-file production lint remains nonzero; masked root `lint:ci` is not a pass certificate. |
| Packaging Python fixtures | **Passed: 54 unittest cases** | Linux input/build-shortcut/runtime/download/extraction/lifecycle-status suites. Upgrade, application readiness, version/SRPM 2.14.0 and synthetic 3.2.1 checks also passed. |
| Wrapper and host fixtures | **Passed** | Build-Python, setup/database/configure wrappers and guards passed. Host arguments/readiness passed on macOS and Linux; Linux needed Git metadata and perl-Digest-SHA in the disposable snapshot. |
| Syntax | **Passed: 28 shell, 15 Python files** | Shell parsing and Python AST parsing, not destructive lifecycle execution. |
| SELinux policy | **Passed: 8 tests** | Current policy compiled and installed in a disposable OL8 policy store. This is not enforcing-host evidence. |
| Final CLI export/acquisition | **Passed** | Clean pinned-source apply, immutable provenance, binary and fresh manuals; Linux aarch64 staging also built the final CLI and manuals. The freshly exported source passed `go test ./...` and `go test -tags functional ./internal/cmd` on native Linux/aarch64 with Go 1.25.8 (exit 0). |

### Real application and database behavior

For both `HEIMDALL_PROXY_MODE=nginx` and `bundled`, 21 distinct forwarded clients each reached authentication (401), while a single client reached 429 on its 21st request. An authenticated 2 MiB upload under a 1 MiB limit returned 413 without changing the evaluation row count. These checks used a disposable PostgreSQL database and the compiled backend; they did not exercise TLS session cookies or a complete RPM installation.

Actual compiled services and Sequelize models passed PostgreSQL owner preservation for member removal, owner demotion and whole-user deletion, including sole-administrator rejection. A database trigger rejected the second tag deletion: logs showed two DELETEs followed by ROLLBACK, preserving the evaluation and both tags. A subsequent successful deletion removed them.

The original packaged CLI failed reset; the equivalent original psql command reproduced the colon syntax error. The patched CLI passed missing-user/read-only rejection, changed hash/new-password login, preservation of other accounts, and restored-hash/original-password login in both configured database modes. Connections used password authentication without TLS. This reset CLI snapshot preceded the later port/firewall/trust edits; those changes do not substitute for final-package recovery acceptance.

## Local candidate build — unresolved

The attempted native OL8/aarch64 build used the exact source candidate, Node 22.23.3, Go 1.25.8, Python 3.9 and pinned runtime archives. Source came from `git archive 44c5ed660...`, mounted read-only. Main command:

```sh
make -C packaging/rpm rpm SOURCE_MODE=workspace TOPDIR=/rpmbuild \
  HEIMDALL_RELEASE=0.99.integration CACHE=1 YARN_CACHE=/yarn-cache
```

The cached build image initially lacked five declared native development packages; they were installed in the disposable builder. Docker's filesystem had roughly 480 MiB free, so build/cache directories were backed by the host. No existing images or user containers were pruned or reconfigured.

Two attempts stopped during Yarn extraction of `lerna-10.0.1.tgz` with ENOENT under the host-backed cache. An independent download matched the lockfile SHA-512 and contained the named files. Removing the incomplete entry and limiting fetch concurrency did not resolve it. A Linux-memory cache successfully extracted Lerna and completed fetching, but dependency linking then failed with:

```text
EEXIST: file already exists, mkdir '/rpmbuild/BUILD/heimdall2-2.14.0/node_modules/@inquirer/core'
```

The failures suggest a host-filesystem interaction, but the build is unresolved. They are not recorded as a successful native build or dismissed as proof that source is correct. **No RPM or SRPM was produced; hashes, signatures, payload verification, DNF installation and SRPM rebuild are unavailable.** The disposable builder was stopped. Native CI remains required.

## Remote CI and remaining gates

The existing Build RPM workflow is registered and active (ID `323905897`). The candidate branch was absent remotely. Automatic approval review rejected the proposed branch push and workflow dispatch because the user had not explicitly authorized source export and remote CI side effects. Neither action occurred. Explicit approval is required before retrying; another publication tool is not a substitute.

| Target | Candidate qualification |
| --- | --- |
| EL8 / aarch64 | Local build attempted and failed as described; remote lane unrun. |
| EL8 / x86_64 | Unrun. |
| EL9 / aarch64 and x86_64 | Both unrun. |
| EL10 / aarch64 and x86_64 | Both unrun. |

After approved remote CI, retain the exact run URL/head SHA, both RPM/SRPM files, their hashes and matching disposable public key for each target. Integration artifacts remain ineligible for release publication.

The following remain separate release gates:

- All six candidate builds, signed direct installation/payload/provenance checks and clean SRPM rebuilds.
- Both architectures' complete lifecycle suite with increasing initial/upgrade releases and a real supported predecessor; retained data, migration gates, failed-upgrade backups and recovery checks.
- All six database/proxy combinations, cross-proxy restore, custom public-port reachability, administrator-rule preservation and backend privacy.
- Enforcing SELinux and fapolicyd, AVC review and full reboot on dedicated supported hosts; container restart or compiled policy is insufficient.
- PostgreSQL 13 and 18 with verified TLS, wrong-CA/hostname rejection, reset, backup/restore and authenticated readiness.
- HTTPS OIDC/Tenable session callbacks and the full seeded Cypress stack with dedicated LDAP, Splunk and S3 fixtures. Existing local services occupied workflow ports 3000/3001 and were not used as fixtures.
- Real Splunk converter integration and the workflow's two XCCDF schema validations.

No dependency-advisory or penetration scan was performed. Existing lint/deprecation/build warnings remain explicitly outside the eleven scoped fixes.

## Decisions made during execution

1. Disjoint tasks ran in parallel while shared files, the CLI source and commits were serialized. This follows the parallel-delegation instructions; an incorrect overlap would cost integration rework.
2. The user's execution selection superseded the design's historical plan-only deliverable. Changes were isolated and reversible; a mistaken scope interpretation would require reverting that branch.
3. Local JavaScript checks reused installed dependency directories and pinned Go caches. This avoided reinstalling unrelated dependencies; clean CI must detect any environment dependence.
4. Cleanup was narrowed after automatic approval rejected arbitrary external-directory deletion. Only known build entries are accepted. Users must move unrelated logs/files before clean can proceed.
5. Firewall mutations retain runtime-before-permanent order instead of a planned lexical sort. This preserves existing rollback sequencing; host integration must verify order-dependent behavior.

## Local evidence

Raw evidence is local and temporary; copy it before OS cleanup if needed. It contains fixture results, not production credentials or database contents.

| Evidence | Location |
| --- | --- |
| Backend/config/frontend/InSpec | `/tmp/heimdall-remediation-backend-full.log`, `/tmp/heimdall-remediation-config.log`, `/tmp/heimdall-remediation-frontend-node24.log`, `/tmp/heimdall-remediation-inspec.log` |
| Full build/final affected checks | `/tmp/heimdall-remediation-build.log`, `/tmp/heimdall-final-fixes-tests.log`, `/tmp/heimdall-final-fixes-build.log`, `/tmp/heimdall-final-fixes-spec-lint.log` |
| Lint baseline comparison/assertion | `/tmp/heimdall-remediation-lint-comparison.json`, `/tmp/heimdall-final-fixes-lint-assert.log` |
| Packaging Linux/policy/host fixtures | `/tmp/heimdall-remediation-linux-checks.log`, `/tmp/heimdall-remediation-linux-host-fixtures.log` |
| Final CLI acquisition/fresh Linux suites | `/tmp/heimdall-remediation-cli-acquisition.log`, `/tmp/heimdall-remediation-final-linux-cli.log` |
| Managed HTTP probes | `/var/folders/rr/lcgqr3hn5h71g3_f4fkgzg1w0000gp/T/rpm-remediation-http.y3uwij78` |
| Real database/reset checks | `/var/folders/rr/lcgqr3hn5h71g3_f4fkgzg1w0000gp/T/heimdall-task13-evidence.aoxujuel` |
| Converters and fixture probes | `/var/folders/rr/lcgqr3hn5h71g3_f4fkgzg1w0000gp/T/heimdall-application-gates.u7vugdz0` |
| Failed candidate builds | `/tmp/heimdall-remediation-rpm-build.log`, `/tmp/heimdall-remediation-rpm-build-retry.log`, `/tmp/heimdall-remediation-rpm-linux-cache.log` |
| Staged candidate inputs | `/Users/Shared/Docker/heimdall2/.superpowers/rpm-remediation-verification-lmfto4z5/candidate-rpmbuild` |


## CI follow-up — 2026-10-15

The published PR head `885d04dd5e94208f2d0b4795d320d8d8baf76f42` had two EL10 lifecycle failures in [Build RPM run 38771262302](https://github.com/mitre/heimdall2/actions/runs/38771262302). All six builds, six install checks and the other four lifecycle jobs passed. These are results for the old head, not the unpublished remediation.

The failures were reproduced with Rocky 10 systemd 257: an absent optional `firewalld` unit reports `inactive` with exit 4. Commit `90d189d69` makes the shared CLI adapter accept only that combination while retaining errors for unexpected states/statuses and manager failures. Five regression cases cover the accepted and rejected combinations. The original behavior failed the new regression; the fix passed focused, full and functional Go suites on native Linux/aarch64 with Go 1.25.8. Patch application, source formatting and independent scoped review passed. The new patch SHA-256 is `29993da844f52c65fb7334a3bf7b1d4a3408efbc156ffba461f43c25fdc968f1`. Full candidate RPM CI still needs to run after publication.

SonarCloud analyzed the published `885d04dd5` head at `2026-10-15T16:42:53Z`: quality gate OK, zero new bugs/vulnerabilities/code smells, zero unresolved issues and zero security hotspots. Both GitHub Sonar checks passed. The newer remediation candidate requires its own analysis.

GitGuardian check `116547355227` still reports three unique Generic Password incidents across 36 PR commits. Incidents [35530560](https://dashboard.gitguardian.com/workspace/788708/incidents/35530560), [35530559](https://dashboard.gitguardian.com/workspace/788708/incidents/35530559) and [29091197](https://dashboard.gitguardian.com/workspace/788708/incidents/29091197) cover eight effective dummy test inputs introduced in `ca42fc3de`. They flow through `FakePrompter` into a setup runner with fake command, filesystem, environment and database adapters; they are test credentials. No credential values are reproduced here.

GitGuardian scans every PR commit, so a source-only deletion does not clear these historical findings. An authorized workspace incident editor must classify them as test credentials, or use the supported test-credential check action if available. No configured GitGuardian credential or matching available plugin was found, so that classification remains externally blocked. See [GitGuardian's check behavior and supported actions](https://docs.gitguardian.com/internal-monitoring/prevent/detect-secrets-in-real-time-in-github). No history was rewritten or security check disabled.

The existing five-minute heartbeat was reactivated for this chat to follow the actual PR head, investigate new failures and report meaningful changes. It must not report completion while GitGuardian or any other applicable check remains failed. Local CI-fix evidence is in `/tmp/heimdall-el10-systemctl-reproduction.log`, `/tmp/heimdall-el10-isactive-red.log` and `/tmp/heimdall-el10-isactive-green.log`.
