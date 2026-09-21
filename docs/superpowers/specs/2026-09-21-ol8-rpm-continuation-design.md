# Heimdall Server OL8 RPM Continuation

This is the proposed next milestone for `feat/rpm-build`, reconstructed on
2026-09-21 from the current checkout and disposable OL8 Docker probes. It is
the design input for the accompanying implementation plan, not a claim that
the RPM is ready to release.

## Where work stopped

- Current HEAD is `889234346`, the September 21 merge of upstream master.
- The last commit changing this branch's RPM files is `4ccabcaf3`, dated
  February 26. The spec remains `heimdall-server-2.12.6-2`; backend, frontend,
  and Lerna manifests now report `2.14.0`.
- `packaging/rpm/` already contains the spec, systemd service, environment
  template, source staging/build helper, and configure/database/setup commands.
- There is no RPM Docker build definition or RPM regression suite here.
- `.beads/recovery-context.md` describes later release 7/8, Caddy, CLI, and
  enterprise work in a separate `saf-packaging` checkout on another machine.
  That checkout is absent at both the recorded path and the adjacent local
  project path. Those historical claims do not establish this branch's status.
- Existing local edits to `AGENTS.md`, `CONTEXT.md`, and the earlier plan in
  `docs/` belong to the user.

## Goal and scope

Produce a correctly versioned Heimdall Server RPM from this branch and verify
its installation, database initialization, service startup, configuration
preservation, package upgrade, and removal on Oracle Linux 8 in Docker.

The user confirmed this scope on September 21: finish this branch's OL8 RPM
first and defer recovery of the later TLS/Caddy work.

Continue the existing package layout and local PostgreSQL 18 deployment.
Keep frontend assets bundled with the backend and retain the unprivileged
`heimdall` service account. Use real RPM transactions, PostgreSQL, and systemd
for acceptance tests. Fast shell tests cover source staging and configuration
regressions separately.

Caddy/TLS automation, importing another repository, publishing/signing RPMs,
COPR, OL9/RHEL9 certification, DEB/APK packages, and a general setup-framework
rewrite are outside this milestone. Existing externally managed TLS remains
possible through normal application settings; this is not an Internet-facing
deployment certification.

## Global constraints

- Use Oracle Linux 8 Docker containers for builds and runtime verification.
- Package version must equal `apps/backend/package.json` and `apps/frontend/package.json`; the current version is `2.14.0`.
- Require Node.js engine `>= 22.18.0` and use the Node 22 release line in the OL8 test environment.
- Use Yarn Classic `1.22.22` with `yarn.lock` and `--frozen-lockfile`.
- Retain PostgreSQL 18 through PGDG for this milestone.
- Retain `ExclusiveArch: aarch64 x86_64`; verify each architecture separately before claiming support for it.
- Keep TLS certificate verification and RPM signature verification enabled by default.
- Preserve existing configuration values, additional application settings, credentials, and database contents across setup reruns and RPM upgrades.
- Do not change logger setup, logger imports, logger formatters, log levels, transports, or existing log messages.
- Preserve the user's existing changes to `AGENTS.md`, `CONTEXT.md`, and earlier documents.

## Evidence gathered in Docker

The baseline image is `oraclelinux:8`, manifest digest
`sha256:21916d0f9527aa5d0b84034dcb3f6d2f01b59e633e31221b49855032ce41069a`.
The native test container reports Oracle Linux 8.10 and `aarch64`.

1. Unmodified source staging succeeds but names the archive `2.12.6` while
   its application manifests say `2.14.0`.
2. The initial dependency bootstrap fails with curl error 60 because this
   network's CA is missing from the container. Importing the existing host
   trust certificate fixes curl/DNF; no verification bypass is necessary.
3. Build prerequisites install successfully, including Node `22.23.2`, Yarn
   `1.22.22`, RPM `4.14.3`, and PostgreSQL `18.6`. Node's RPM exposes
   `nodejs(engine) = 22.23.2`, which avoids package-epoch ambiguity when
   expressing the JavaScript engine minimum.
4. Yarn also requires `NODE_EXTRA_CA_CERTS=/etc/pki/tls/certs/ca-bundle.crt`
   in this environment. With that setting, the frozen production dependency
   install, frontend/backend compilation, and binary/source RPM build all
   succeed. The result is still mislabeled `2.12.6-2.el8`; build success does
   not establish successful installation.
5. `heimdall-db-setup.sh` requires `.bin/tsx`, but the installed production
   dependency tree has no `tsx`. Its Sequelize binary exists. The current
   `.sequelizerc` loads `dist/db/database.js`, so Node can execute Sequelize
   directly without adding a TypeScript runner.
6. Running `heimdall-configure.sh --non-interactive` removes existing
   `EXTERNAL_URL` and `LOCAL_LOGIN_DISABLED` settings. The resulting file has
   correct `0640 root:heimdall` permissions and retains generated known values
   on a subsequent rerun, but unknown settings are already lost.
7. An OL8 systemd container launched with the requested `--runtime=runc
   --privileged --cgroupns=private --tmpfs /run --tmpfs /run/lock
   -e container=docker`. Later inspection reported the effective runtime as
   `sysbox-runc`, despite the explicit request. Its system bus responds and
   real PostgreSQL and Heimdall units pass lifecycle acceptance. Three
   container-related kernel units fail, so acceptance checks the specific
   application and database units rather than requiring a globally
   non-degraded OS.
8. Earlier Sysbox probes did not expose a usable system bus, but those results
   do not identify the effective runtime of the final working containers.
   The final evidence records both the requested and inspected runtime and
   relies on actual system-bus and application behavior. Bind mounting the
   macOS checkout failed; Docker build contexts and `docker cp` work.
9. Installing the baseline RPM in an OL8 systemd container with dependencies
   present initializes PostgreSQL successfully but fails database migration
   with `Missing required executables ...`. PostgreSQL is active and Heimdall
   is inactive afterward. DNF nevertheless returns success because the
   scriptlet intentionally treats setup failure as recoverable. This verifies
   the stale migration-helper defect in the real installed package.

## Behavioral requirements

R1. An RPM's spec, helper files, and application code must describe the same
source snapshot. Git-based release staging must refuse relevant dirty files
instead of mixing HEAD application sources with working-copy packaging.
Docker development builds must include current edits through a filtered build
context, with no host `node_modules`, `.git`, secrets, or prior RPM outputs.
Linked Git worktrees must be recognized as Git checkouts.

R2. A documented Docker command must produce architecture-specific binary
and source RPMs under the already ignored `packaging/rpm/dist/` directory.
Optional corporate CA input belongs to the test/build environment, not the
RPM or repository. A clean default build must never require `--no-gpg-check`.

R3. The package must contain a compiled backend entry point, compiled database
configuration, frontend index/assets, production backend dependencies, and
the workspace dependencies needed by the installed backend. Package checks
must detect missing outputs and broken workspace links before publishing an
artifact. Build failures in unchanged logger code are reported separately.

R4. Database setup must use the installed Node/Sequelize CLI and compiled
configuration. Initial creation, reruns, migrations, seeding, and
`--skip-seed` must work without `tsx` or a checkout outside the RPM.

R5. Noninteractive configuration must retain additional settings and existing
secrets. Interactive blank answers must retain existing configured values.
Fresh installs still generate missing secrets. Keep environment ownership
`root:heimdall` and mode `0640`.

R6. RPM scriptlets must not prompt. With a running systemd instance they must
retain the existing local database/bootstrap/start behavior. Without a running
service manager, configure the package and give an actionable setup command,
then defer service-dependent initialization. The explicit setup command must
report failure if required services cannot run. Keep `%config(noreplace)`.
Runtime dependencies needed by the installed setup commands must remain
ordinary RPM requirements as well as respecting installation ordering.

R7. In a fresh OL8 systemd container, `dnf install` must initialize the database
and start Heimdall as `heimdall`. Verify `/`, `/server`, and real local login.
Rerun setup, upgrade to a higher RPM release of the same application version,
restart the container, and verify settings, credentials, database rows, and
service availability. Removing Heimdall must stop it and retain PostgreSQL
data and a recoverable configuration file. This tests package lifecycle;
migration from a historical deployed application version needs its own real
fixture before making a compatibility claim.

## Alternatives considered

Continue this branch's scaffold: smallest path to a reviewable working RPM,
with concrete local failures to fix. Recommended for this milestone.

Recover `saf-packaging`: potentially recovers more features, but the recorded
checkout is unavailable and the notes concern different source/package
versions. Revisit as a separate integration task if the user requests it.

Rebuild packaging around another distribution system: adds migration work
without resolving the immediate stale-helper and validation gaps.

## References

- Current repository sources and the disposable Docker results above are the
  primary evidence for this design.
- [PostgreSQL packages for the Red Hat family](https://www.postgresql.org/download/linux/redhat/)
  documents repository selection and the need to initialize/start the server.
- [RPM dependency documentation](https://rpm.org/docs/latest/manual/more_dependencies.html)
  distinguishes installation scriptlet dependencies from runtime dependencies.
- [Oracle Linux Node.js packages](https://yum.oracle.com/oracle-linux-nodejs.html)
  documents Oracle's own alternative Node.js repository route. This milestone
  retains the existing NodeSource route rather than changing providers.
