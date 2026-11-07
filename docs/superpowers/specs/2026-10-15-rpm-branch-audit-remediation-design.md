# RPM branch audit remediation design

Date: 2026-10-15. Reviewed branch: `feat/rpm-packaging`, commit `885d04dd5`.

## Purpose and scope

Repair the concrete defects found while auditing the RPM branch and the application paths it deploys. Preserve the current packaging design: direct RPM installation, private runtimes, an external pinned CLI with a repository-owned patch, and optional external database/proxy services. The accompanying implementation plan is `../plans/2026-10-15-rpm-branch-audit-remediation.md`.

The requested deliverable is a plan. No production fixes have been applied. Temporary reproduction tests are evidence, not shipped changes. The existing untracked authentication notes and patches belong to the user and must remain untouched.

The work has three independently reviewable areas: package construction, CLI operations, and backend correctness. Keep them as separate tasks and commits within one ordered plan. The original six audit findings retain their numbers; additional findings are numbered F7 onward.

## Global constraints

- Keep application version `2.14.0`; `VERSION` remains authoritative.
- Support EL8, EL9, and EL10 on `x86_64` and `aarch64`.
- Keep PostgreSQL support at `13–18`.
- Keep the Node.js build floor at `>=22.18.0` and the pinned Go build toolchain at `1.25.8`.
- Add no application dependencies and no new runtime service.
- Preserve saved configuration, credentials, comments, explicit port choices, and externally owned services.
- Keep the backend port private when using a managed HTTPS proxy.
- Keep SELinux and fapolicyd enabled during host acceptance; containers do not prove their enforcement.
- Preserve the migration gate, failed-upgrade backups, retained data, SQL error handling, and private-file permissions.
- Use disposable test databases, containers, and VMs; never run destructive fixtures against an existing installation.
- Record evidence for the exact candidate commit and package hashes; historical packages do not certify new source.

## Confirmed defects and required outcomes

| ID | Defect and evidence | Required outcome |
|---|---|---|
| F1 | `packaging/rpm/Makefile` workspace archive includes local `.npmrc`; a synthetic registry token survived actual source staging. The Docker context has the same omission. | Registry authentication files cannot enter the workspace source archive or Docker build context. Source files and non-secret application fixtures remain included. |
| F2 | `make clean TOPDIR=<checkout>` deletes the checkout; reproduced only in a disposable copied fixture. | Reject source-tree, ancestor, home, root, empty, and symlink-resolved unsafe cleanup paths before deletion. Valid external build directories remain removable even if source version metadata is invalid. |
| F3 | Restore from Caddy to archived Nginx configuration stops but never disables Caddy; subsequent setup has lost the previous selection. | Disable a deselected managed proxy before replacing its selection. Same-mode restores retain enablement. Failed service commands stop recovery without a false success. |
| F4 | Local-only authentication leaves Express proxy trust disabled. Twenty-one distinct forwarded clients share `127.0.0.1` and the last receives HTTP 429. | Managed RPM proxies use a bounded loopback trust rule independently of OAuth/Tenable sessions. Separate client addresses have separate login limits; one address still exhausts its own limit. |
| F5 | Fresh setup defaults to `3000`, reserved by the inspected stock OL8 policy as `ntop_port_t` for `3000–3001`. Current CLI rejects that default. | Use an RPM default available under supported stock policies. Preserve explicit and saved values; continue rejecting conflicting SELinux ownership rather than relabeling another service's port. |
| F6 | Caddy accepts `https://heimdall.example.test:8443`, but firewall setup opens only the `https` service on 443. | Open the selected public endpoint in runtime and permanent firewall configuration. Preserve ownership tracking, rollback, external ownership, and backend isolation. |
| F7 | Pinned CLI `reset_password.go` supplies `:'hash'` and `:'email'` in `psql -c`. Actual PostgreSQL 18.6 rejects the colon; the same SQL through stdin expands correctly. | Reset the intended account through stdin with `-X` and `ON_ERROR_STOP=1`, preserving environment-based database credentials and TLS handling. Report missing accounts and SQL failures accurately. |
| F8 | Actual multipart upload interceptor accepts a 2 MiB file with `MAX_FILE_UPLOAD_SIZE=1`. The standalone `multer(...)` call in `main.ts` is discarded and configures field size, not file size. | Enforce the configured byte limit in the interceptor that handles uploaded files, returning HTTP 413 for an oversized file before evaluation persistence. |
| F9 | The default administrator can be selected as their own replacement when leaving or being demoted from the last group-owner position. | A replacement owner must differ from the departing user. If no valid replacement exists, reject the membership change and retain the current owner. |
| F10 | Evaluation removal passes an array of promises as one element of `Promise.all`; a delayed tag deletion remains unresolved when the transaction commits. | Await every tag deletion before deleting the evaluation and committing. A tag failure must reject the operation and prevent a successful commit. |
| F11 | `add-cert` discards the exit code from `update-ca-trust` and prints success when it exits nonzero. | Return failure, avoid the success message, and leave application configuration unchanged when trust-store rebuilding fails. |

F4 and F8–F10 are existing backend defects exposed or made relevant by this deployment, rather than changes introduced in the RPM diff. F7 and F11 are defects in the pinned CLI shipped by this branch. Repair them through the existing RPM patch without silently changing the pinned revision.

## Approach

Use the existing Python source-input fixture for archive and cleanup regressions. Reuse the existing Go filesystem, firewall, restore, and process-runner fixtures for CLI regressions. Edit a disposable copy of the pinned CLI, then regenerate `heimdall-cli-nginx.patch`; the patch, tests, and generated manuals must describe the same source.

Keep backend changes in their existing ownership layers: HTTP trust policy at bootstrap, upload bounds at multipart configuration, membership invariants in the group service, and transaction sequencing in the evaluation service. Add focused regression tests that call real application code and replace only database or host boundaries.

Use runtime/permanent firewall ownership records for public custom ports as well as existing backend rules. Do not infer ownership of pre-existing administrator rules. A failed change must restore configuration and remove only rules added by that operation.

Default-port changes apply to RPM setup, templates, examples, and RPM fixtures. Leave existing Docker/development defaults and explicitly requested legacy port values intact. Existing configuration wins over a new installation default.

## Verification and acceptance contract

Every defect needs a regression that fails on the reviewed source for the stated reason and passes after the smallest fix. An unrelated setup/import failure is not a valid regression result.

Portable checks cover source staging, path safety, pinned CLI acquisition, runtime archives, shell/Python syntax, upgrade scriptlets, readiness probes, and the full patched CLI test suite. Add the existing guard/host-runner/readiness fixtures to CI where their required tools are present.

Linux package acceptance covers all six EL-major/architecture combinations: build, signature verification, direct DNF installation, clean SRPM rebuild, payload inventory, compiled SELinux policy, systemd-unit validation, setup, authenticated readiness, and restart.

Lifecycle acceptance additionally covers both database modes crossed with Nginx, Caddy, and external proxies; proxy mode `none`; custom public ports; failed setup rollback; backup/restore across managed proxy modes; upgrade from a preceding package; removal/reinstallation with retained state; and coexistence with independently managed services. Verify SQL data, credentials, service enablement, and certificate identity, not just HTTP status.

An enforcing VM must validate SELinux process domains and access denials, enabled fapolicyd, actual firewall reachability from another machine, and a full OS reboot. Preserve journal, audit, package, configuration-hash, and service-state evidence. A container restart is not a VM reboot.

Existing application suites and browser tests must be run with the dedicated PostgreSQL, LDAP/OIDC, SonarQube, Splunk, and S3 fixtures declared by their workflows. Missing fixtures and network restrictions remain explicit validation gaps, not application failures.

## Out of scope

No architecture rewrite, dependency replacement, new installer, automatic production rollout, or blanket code-style cleanup. Concurrent administrative command locking and hostile-filesystem races were inspected but are not confirmed defects; they do not justify speculative implementation tasks. Production signing remains an existing release prerequisite, not an instruction to create or distribute a signing key during this work.

## Completion criteria

All F1–F11 regressions pass, affected existing tests pass, and the patch applies cleanly to the pinned CLI revision. Each supported target has candidate-specific acceptance evidence or an explicitly unresolved release gate. The final report distinguishes completed fixes, passing tests, environment blocks, and remaining host qualification. No verification item may be called passed solely because its workflow exists.
