# Heimdall Server OL8 RPM Continuation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a correctly versioned Heimdall Server RPM and verify its install, database setup, service startup, upgrade, and removal in Oracle Linux 8 Docker containers.

**Architecture:** Continue the existing `packaging/rpm/` scaffold, bundled production dependencies, local PostgreSQL 18, and systemd service. Add a filtered Docker build context and real package lifecycle tests; fix source/version drift, the obsolete migration launcher, and configuration loss. Keep application behavior and logging unchanged.

**Tech Stack:** Oracle Linux 8.10, Docker/BuildKit, RPM 4.14, Bash, Node 22, Yarn Classic 1.22.22, NestJS/Vue, PostgreSQL 18, systemd 239.

**Spec:** `docs/superpowers/specs/2026-09-21-ol8-rpm-continuation-design.md`

## Global Constraints

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

---

## Starting point and baseline

Read the spec before executing. HEAD was `889234346` when this plan was
written. The last RPM edit was `4ccabcaf3` on February 26. This checkout
contains the older RPM scaffold, not the release 7/8 implementation described
in `.beads/recovery-context.md` for another repository.

Verified in disposable `oraclelinux:8` containers:

- Source staging succeeds but labels the current 2.14.0 application as 2.12.6.
- DNF bootstrap succeeds with normal signature checks after adding the
  network's existing trusted CA. Installed versions: Node 22.23.2, Yarn
  1.22.22, RPM 4.14.3, PostgreSQL 18.6.
- Yarn's frozen production install succeeds when Node also receives the CA
  through `NODE_EXTRA_CA_CERTS`.
- The production tree contains Sequelize CLI and does not contain `tsx`.
- Noninteractive configuration demonstrably deletes `EXTERNAL_URL` and
  `LOCAL_LOGIN_DISABLED`.
- Real OL8 systemd works with the `runc` recipe in Task 5. The tested Sysbox
  recipe does not provide a usable system bus on this host.

The unmodified full RPM build passed on OL8 ARM64 after providing the trusted
CA. It produced a 36,415,692-byte binary RPM and a 55,586,830-byte source RPM,
both labeled `2.12.6-2.el8`. These are diagnostic baseline artifacts, not release
candidates. Build logs and both RPMs are saved under the ignored
`packaging/rpm/dist/baseline-2026-09-21/` directory. Treat unsupported or unrun
checks as outstanding, not passes.

Installing that baseline RPM in a systemd-enabled OL8 container with its
dependencies already present reproduces the startup failure: PostgreSQL
initializes and is active, but the migration helper reports missing required
executables, `%post` reports migration/seed failure, and Heimdall remains
inactive. DNF returns success despite that failure. The log is saved as
`packaging/rpm/dist/baseline-2026-09-21/install.log`. This isolates the stale
helper; it is not a clean-host dependency-resolution or successful-install test.

## File map and ownership

| File | Responsibility |
| --- | --- |
| `packaging/rpm/setup-rpm-build-env.sh` | Dependency bootstrap and consistent source staging |
| `packaging/rpm/heimdall-server.spec` | Version, dependency contract, payload, scriptlets, package lifecycle |
| `packaging/rpm/Dockerfile.ol8` | OL8 builder, fresh runtime test host, and exported RPM artifacts |
| `packaging/rpm/Dockerfile.ol8.dockerignore` | Exclude local dependencies, secrets, Git metadata, and generated artifacts |
| `packaging/rpm/heimdall-db-setup.sh` | Run compiled Sequelize configuration using Node |
| `packaging/rpm/heimdall-configure.sh` | Preserve settings while filling missing values |
| `packaging/rpm/heimdall-setup.sh` | Explicit setup and accurate service failure reporting |
| `packaging/rpm/tests/staging.sh` | Source/version/dirty-tree regression tests |
| `packaging/rpm/tests/payload.sh` | Inspect the produced RPM and extracted runtime files |
| `packaging/rpm/tests/database.sh` | Real migrations, seeding, and rerun tests |
| `packaging/rpm/tests/configure.sh` | Settings/secrets/permissions preservation tests |
| `packaging/rpm/tests/lifecycle.sh` | Install, login, upgrade, restart, and removal checks |
| `packaging/rpm/README.md` | Reproducible build, install, and recovery instructions |

All new test scripts use Bash with `set -euo pipefail`. Scripts that modify
`/etc`, users, services, or databases must begin with this guard:

```bash
[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || {
  echo 'Run only in a disposable RPM test container with HEIMDALL_RPM_TEST=1.' >&2
  exit 64
}
```

Do not create a general packaging abstraction, rewrite application modules,
import historical TLS work, publish packages, or stage unrelated local files.
Use narrow commits after each task's relevant tests pass.

### Task 1: Make source staging and RPM metadata agree

**Files:**
- Modify: `packaging/rpm/heimdall-server.spec:1-42`
- Modify: `packaging/rpm/setup-rpm-build-env.sh:190-243`
- Create: `packaging/rpm/tests/staging.sh`

**Interfaces:**
- Consumes: the backend/frontend package manifests, current spec, and existing `--skip-deps --topdir PATH` CLI.
- Produces: one consistent `heimdall2-2.14.0.tar.gz` source tree plus corresponding `SPECS/` and `SOURCES/`; nonzero exit for version mismatch or relevant dirty Git input.
- Docker builds consume a source directory without `.git`; release staging from Git consumes committed HEAD.

- [x] **Step 1: Add a source-staging regression script.** Use a small temporary fixture; never modify this checkout to simulate an error. Start with this complete core test:

```bash
#!/bin/bash
set -euo pipefail
repo=$(cd "$(dirname "$0")/../../.." && pwd)
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
fixture="$scratch/source"
mkdir -p "$fixture/packaging" "$fixture/apps/backend" "$fixture/apps/frontend"
cp -a "$repo/packaging/rpm" "$fixture/packaging/rpm"
printf '{"version":"2.14.0"}\n' > "$fixture/apps/backend/package.json"
printf '{"version":"2.14.0"}\n' > "$fixture/apps/frontend/package.json"
stage() {
  bash "$fixture/packaging/rpm/setup-rpm-build-env.sh" \
    --skip-deps --topdir "$scratch/output"
}
stage
tar -xOf "$scratch/output/SOURCES/heimdall2-2.14.0.tar.gz" \
  heimdall2-2.14.0/./apps/backend/package.json > "$scratch/backend.json"
python3 -c 'import json,sys; assert json.load(open(sys.argv[1]))["version"] == "2.14.0"' \
  "$scratch/backend.json"
printf '{"version":"0.0.1"}\n' > "$fixture/apps/backend/package.json"
if stage > "$scratch/mismatch.log" 2>&1; then
  echo 'Mismatched versions were accepted.' >&2
  exit 1
fi
grep -q 'version mismatch' "$scratch/mismatch.log"
```

The tar fallback currently retains `./` inside its prefix; keep that spelling
in this case. Add Git and linked-worktree cases after fixing the first test:

```bash
printf '{"version":"2.14.0"}\n' > "$fixture/apps/backend/package.json"
git -C "$fixture" init -q
git -C "$fixture" add .
git -C "$fixture" -c user.name=RPM-Test -c user.email=rpm-test@example.invalid \
  commit -qm fixture
stage
printf '\n# local change\n' >> "$fixture/packaging/rpm/heimdall-server.sh"
if stage > "$scratch/dirty.log" 2>&1; then exit 1; fi
grep -q 'uncommitted' "$scratch/dirty.log"
git -C "$fixture" checkout -- packaging/rpm/heimdall-server.sh
git -C "$fixture" worktree add --detach "$scratch/linked" HEAD
bash "$scratch/linked/packaging/rpm/setup-rpm-build-env.sh" \
  --skip-deps --topdir "$scratch/linked-output"
tar -tzf "$scratch/linked-output/SOURCES/heimdall2-2.14.0.tar.gz" \
  > "$scratch/members"
if grep -Eq '(^|/)\.git(/|$)' "$scratch/members"; then exit 1; fi
```

- [x] **Step 2: Run the test in OL8 and observe the version failure.** Copy current packaging into a disposable OL8 container with the installed build prerequisites. Run `bash packaging/rpm/tests/staging.sh` from its source tree. Expected baseline failure: the requested `heimdall2-2.14.0.tar.gz` does not exist.

- [x] **Step 3: Update metadata and reject inconsistent inputs.** Use these spec lines:

```spec
Version:        2.14.0
%{!?heimdall_release:%global heimdall_release 1}
Release:        %{heimdall_release}%{?dist}
BuildRequires:  nodejs(engine) >= 22.18.0
Requires:       nodejs(engine) >= 22.18.0
```

Replace the existing Node version requirements; keep the other build requirements.
The `heimdall_release` override is also the interface used by the upgrade test.
Add a September 21 `2.14.0-1` changelog entry describing the final packaging
changes without editing historical entries.

Before staging files, require `python3` and validate manifest versions:

```bash
require_cmd python3
for manifest in apps/backend/package.json apps/frontend/package.json; do
  app_version=$(python3 -c \
    'import json,sys; print(json.load(open(sys.argv[1]))["version"])' \
    "${REPO_ROOT}/${manifest}")
  if [[ "$app_version" != "$version" ]]; then
    echo "RPM/application version mismatch: ${version} != ${app_version} (${manifest})" >&2
    exit 1
  fi
done
```

Replace the `.git` directory test with Git's own checkout detection. Before
`git archive`, reject tracked or untracked source changes in the packaging and
application paths that affect the build:

```bash
if command -v git >/dev/null 2>&1 &&
   git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  source_paths=(package.json yarn.lock lerna.json tsconfig.json postcss.config.js apps libs packaging/rpm)
  if ! git -C "$REPO_ROOT" diff --quiet HEAD -- "${source_paths[@]}" ||
     [[ -n "$(git -C "$REPO_ROOT" ls-files --others --exclude-standard -- "${source_paths[@]}")" ]]; then
    echo 'Source has uncommitted build inputs; commit them or use the OL8 Docker build for current edits.' >&2
    exit 1
  fi
  git -C "$REPO_ROOT" archive --format=tar.gz \
    --prefix="heimdall2-${version}/" HEAD > "$source_archive"
else
  tar -C "$REPO_ROOT" --exclude='.git' --exclude='.beads' \
    --exclude='node_modules' --exclude='dist' --exclude='.env' \
    --exclude='.env-prod' --exclude='.env-dev' --exclude='*.rpm' \
    --transform "s|^|heimdall2-${version}/|" -czf "$source_archive" .
fi
```

Run this validation before copying `SPECS/` or helpers. Reject a `TOPDIR`
inside the source tree using canonical paths so tar cannot recursively archive
its own output. `realpath -m` is available through OL8 coreutils:

```bash
case "$(realpath -m "$TOPDIR")/" in
  "${REPO_ROOT}/"*) echo 'RPM topdir must be outside the source tree.' >&2; exit 1 ;;
esac
```

- [x] **Step 4: Run the staging tests, including mismatch, dirty files, and linked worktrees.** Expected: all pass. Inspect the archive manifest and confirm that package metadata and staged spec agree. Existing unrelated dirty documentation must not block release staging.
- [x] **Step 5: Commit only this task's files.**

```bash
git add packaging/rpm/heimdall-server.spec packaging/rpm/setup-rpm-build-env.sh packaging/rpm/tests/staging.sh
git commit -m "fix(rpm): keep package metadata and source staging consistent"
```

### Task 2: Add a repeatable OL8 Docker build and payload checks

**Files:**
- Create: `packaging/rpm/Dockerfile.ol8`
- Create: `packaging/rpm/Dockerfile.ol8.dockerignore`
- Create: `packaging/rpm/tests/payload.sh`
- Modify: `packaging/rpm/heimdall-server.spec:51-102`
- Modify: `packaging/rpm/README.md`

**Interfaces:**
- Consumes: Task 1's consistent source staging and `heimdall_release` macro.
- Produces: Docker targets `builder`, `test-host`, and `artifacts`; `RPMS/` and `SRPMS/` exported beneath a caller-selected directory.
- Optional BuildKit secret `corp_ca` is a PEM CA file. Build argument `HEIMDALL_RELEASE` defaults to `1`.

- [x] **Step 1: Add a payload regression script.** The argument is an absolute RPM path. Run inside OL8 with `rpm`, `rpm2cpio`, `cpio`, `node`, and `find` installed:

```bash
#!/bin/bash
set -euo pipefail
rpm_file=$(realpath "$1")
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
[[ $(rpm -qp --qf '%{VERSION}' "$rpm_file") == 2.14.0 ]]
[[ $(rpm -qp --qf '%{ARCH}' "$rpm_file") == "$(rpm -E '%{_arch}')" ]]
(cd "$scratch" && rpm2cpio "$rpm_file" | cpio -idm --quiet)
app="$scratch/usr/share/heimdall-server"
test -s "$app/apps/backend/dist/src/main.js"
test -s "$app/apps/backend/dist/db/database.js"
test -s "$app/dist/frontend/index.html"
test -x "$app/apps/backend/node_modules/.bin/sequelize"
test -e "$app/libs/password-complexity/index.js"
[[ $(node -p "require(process.argv[1]).version" "$app/apps/backend/package.json") == 2.14.0 ]]
find "$app/apps/backend/node_modules" -xtype l > "$scratch/broken-links"
test ! -s "$scratch/broken-links"
rpm -qp --requires "$rpm_file" > "$scratch/requires"
grep -q 'nodejs(engine) >= 22.18.0' "$scratch/requires"
```

- [x] **Step 2: Run against the baseline RPM when available.** Expected first failure: version `2.12.6`, not `2.14.0`. If a later baseline build step failed, retain its log and use the first newly built artifact for the payload test; do not claim a baseline RPM exists until verified.

- [x] **Step 3: Add the Docker build definition.** This uses the existing setup helper for the builder and independently configures a clean test host that has no Heimdall installation or development dependencies:

```dockerfile
# syntax=docker/dockerfile:1
FROM oraclelinux:8 AS trusted-base
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN --mount=type=secret,id=corp_ca \
    if [[ -s /run/secrets/corp_ca ]]; then \
      install -m 0644 /run/secrets/corp_ca /etc/pki/ca-trust/source/anchors/rpm-test-ca.crt; \
      update-ca-trust; \
    fi
ENV NODE_EXTRA_CA_CERTS=/etc/pki/tls/certs/ca-bundle.crt

FROM trusted-base AS test-host
RUN curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - && \
    dnf install -y "https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-$(rpm -E '%{_arch}')/pgdg-redhat-repo-latest.noarch.rpm" && \
    dnf -qy module disable postgresql && \
    dnf install -y procps-ng && dnf clean all
CMD ["/sbin/init"]

FROM trusted-base AS builder
ARG HEIMDALL_RELEASE=1
WORKDIR /workspace
COPY . .
RUN bash packaging/rpm/setup-rpm-build-env.sh --skip-update --topdir /rpmbuild && \
    rpmbuild --define '_topdir /rpmbuild' \
      --define "heimdall_release ${HEIMDALL_RELEASE}" \
      -ba /rpmbuild/SPECS/heimdall-server.spec

FROM scratch AS artifacts
COPY --from=builder /rpmbuild/RPMS /RPMS
COPY --from=builder /rpmbuild/SRPMS /SRPMS
```

Use this Dockerfile-specific ignore file, leaving the application's existing
Docker build behavior alone:

```gitignore
.git
.beads
**/node_modules
**/dist
**/coverage
**/.cache
**/*.tsbuildinfo
**/.env
**/.env-*
**/*.log
**/*.rpm
certs
nginx/certs
.DS_Store
```

- [x] **Step 4: Add minimal build-output checks to the spec.** After the two existing build commands, assert the outputs that the package and migration launcher need:

```bash
test -s apps/backend/dist/src/main.js
test -s apps/backend/dist/db/database.js
test -s dist/frontend/index.html
test -x apps/backend/node_modules/.bin/sequelize
```

Set a cleanup trap for `YARN_CACHE_FOLDER` immediately after creating it, so
failed builds do not retain the temporary cache. Keep the existing frozen
production install and frontend/backend build commands unless the real OL8
build demonstrates another packaging defect. Do not suppress compiler errors,
disable engine checks, regenerate the lockfile, or edit logger code to obtain
a green artifact.

- [x] **Step 5: Build, export, and inspect the RPM on native ARM64.** On this host the optional CA is available at `/etc/ssl/certs/mitre-ca-certificates.crt`; omit the secret option on a network using public trust only.

```bash
docker build --platform linux/arm64 --progress plain \
  --secret id=corp_ca,src=/etc/ssl/certs/mitre-ca-certificates.crt \
  -f packaging/rpm/Dockerfile.ol8 --target builder -t heimdall-rpm-builder:ol8 .
docker build --platform linux/arm64 \
  --secret id=corp_ca,src=/etc/ssl/certs/mitre-ca-certificates.crt \
  -f packaging/rpm/Dockerfile.ol8 --target artifacts \
  --output type=local,dest=packaging/rpm/dist/arm64 .
docker run --rm --entrypoint bash heimdall-rpm-builder:ol8 -lc \
  'bash packaging/rpm/tests/staging.sh && bash packaging/rpm/tests/payload.sh /rpmbuild/RPMS/aarch64/heimdall-server-2.14.0-1.el8.aarch64.rpm'
```

Expected: binary and source RPMs exported, checks pass, no source dependencies
are taken from macOS. Record the base image digest, `node --version`,
`yarn --version`, and `rpm -q` output in the build evidence. Repeat with
`linux/amd64` and `x86_64` before marking that architecture verified.

- [x] **Step 6: Document these exact commands and commit this task.** Explain the optional trusted CA, output paths, and the distinction between Git release staging and Docker builds of current edits.

```bash
git add packaging/rpm/Dockerfile.ol8 packaging/rpm/Dockerfile.ol8.dockerignore packaging/rpm/tests/payload.sh packaging/rpm/heimdall-server.spec packaging/rpm/README.md
git commit -m "build(rpm): add reproducible Oracle Linux 8 Docker builds"
```

### Task 3: Repair the installed migration command

**Files:**
- Modify: `packaging/rpm/heimdall-db-setup.sh:7-58`
- Modify: `packaging/rpm/heimdall-server.spec:37-42`
- Create: `packaging/rpm/tests/database.sh`

**Interfaces:**
- Consumes: an installed RPM from Task 2, PostgreSQL 18, and `/etc/heimdall-server/backend.env`.
- Produces: working `heimdall-server-db-setup [--skip-seed]`, using `.sequelizerc` and `dist/db/database.js`; existing database handling remains idempotent.

- [x] **Step 1: Add a real database test.** Add the destructive-test guard from the file map, then this body. Run only against a dedicated container with the RPM installed; its database is disposable.

```bash
/usr/libexec/heimdall-server/configure.sh --non-interactive
/usr/libexec/heimdall-server/postgres-setup.sh
/usr/bin/heimdall-server-db-setup
set -a
source /etc/heimdall-server/backend.env
set +a
query() {
  runuser -u postgres -- /usr/pgsql-18/bin/psql \
    -v ON_ERROR_STOP=1 -At -d "$DATABASE_NAME" -c "$1"
}
expected=$(find /usr/share/heimdall-server/apps/backend/migrations \
  -maxdepth 1 -name '*.js' -type f | wc -l)
[[ $(query 'SELECT COUNT(*) FROM "SequelizeMeta"') -eq $expected ]]
[[ $(query "SELECT COUNT(*) FROM \"Users\" WHERE role = 'admin'") -eq 1 ]]
query 'CREATE TABLE IF NOT EXISTS rpm_test_sentinel (id integer PRIMARY KEY)'
query 'INSERT INTO rpm_test_sentinel VALUES (1) ON CONFLICT DO NOTHING'
/usr/bin/heimdall-server-db-setup
/usr/bin/heimdall-server-db-setup --skip-seed
[[ $(query 'SELECT COUNT(*) FROM rpm_test_sentinel') -eq 1 ]]
[[ $(query "SELECT COUNT(*) FROM \"Users\" WHERE role = 'admin'") -eq 1 ]]
```

- [x] **Step 2: Reproduce the failure with the old helper.** Use Task 5's systemd container recipe and install the Task 2 RPM. Execute the new database test with `HEIMDALL_RPM_TEST=1`. Expected failure: `Missing required executables ...` because `tsx` is absent.

- [x] **Step 3: Launch Sequelize with Node directly.** Remove only the `TSX_BIN` variable and its check. Keep the existing Sequelize path and error text. Add an explicit compiled-config existence check:

```bash
if [[ ! -x /usr/bin/node || ! -x "$SEQUELIZE_BIN" ]]; then
  echo "Missing required executables in ${APP_DIR}/node_modules/.bin" >&2
  exit 1
fi
if [[ ! -s "${APP_DIR}/dist/db/database.js" ]]; then
  echo "Missing compiled database configuration: ${APP_DIR}/dist/db/database.js" >&2
  exit 1
fi
run_sequelize() {
  /usr/bin/node "$SEQUELIZE_BIN" "$@"
}
```

Retain `run_db_create`, migration order, seed behavior, and `--skip-seed`.
Add ordinary runtime requirements for installed setup commands while keeping
the existing `Requires(post)` entries for ordering:

```spec
Requires:       postgresql18
Requires:       postgresql18-server
Requires:       util-linux
```

- [x] **Step 4: Test with the corrected installed helper.** Copy only this helper over the old one in the disposable test container for the short feedback cycle, then run `database.sh`. Expected: all migrations applied, exactly one admin, and the sentinel survives both reruns. After rebuilding, repeat with the packaged helper; a copied-file pass alone is insufficient.
- [x] **Step 5: Commit this task.**

```bash
git add packaging/rpm/heimdall-db-setup.sh packaging/rpm/heimdall-server.spec packaging/rpm/tests/database.sh
git commit -m "fix(rpm): run database setup with the packaged Node runtime"
```

### Task 4: Preserve configuration and make setup reliable in RPM transactions

**Files:**
- Modify: `packaging/rpm/heimdall-configure.sh:55-178`
- Modify: `packaging/rpm/heimdall-server.spec:110-142`
- Modify: `packaging/rpm/heimdall-setup.sh:47-68`
- Create: `packaging/rpm/tests/configure.sh`

**Interfaces:**
- Consumes: existing environment files, generated secrets, `--interactive`/`--non-interactive`, and a possibly unavailable systemd manager.
- Produces: stable environment settings on reruns; noninteractive RPM transactions; deferred initialization without systemd; explicit setup failures when service management is unavailable.

- [x] **Step 1: Add the configuration regression test.** Add the container guard, then this complete body. Run in a separate disposable container, not the lifecycle-test container whose database already uses its configured password.

```bash
getent group heimdall >/dev/null || groupadd -r heimdall
install -d /etc/heimdall-server
cat > /etc/heimdall-server/backend.env <<'ENV'
NODE_ENV=production
DATABASE_PASSWORD='Rpm-Test-$-Password!'
JWT_SECRET=existing-jwt
API_KEY_SECRET=existing-api
EXTERNAL_URL=https://heimdall.example.test
LOCAL_LOGIN_DISABLED=true
ENV
bash /workspace/packaging/rpm/heimdall-configure.sh --non-interactive
set -a
source /etc/heimdall-server/backend.env
set +a
[[ $DATABASE_PASSWORD == 'Rpm-Test-$-Password!' ]]
[[ $JWT_SECRET == existing-jwt && $API_KEY_SECRET == existing-api ]]
[[ ${EXTERNAL_URL:-} == https://heimdall.example.test ]]
[[ ${LOCAL_LOGIN_DISABLED:-} == true ]]
[[ $(stat -c '%a %U:%G' /etc/heimdall-server/backend.env) == '640 root:heimdall' ]]
sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-config-before.sha256
bash /workspace/packaging/rpm/heimdall-configure.sh --non-interactive
sha256sum --check /tmp/rpm-config-before.sha256
```

Also run this fresh-template case after the preservation assertions. This
uses a fresh environment so fixture variables cannot mask secret generation:

```bash
cp /workspace/packaging/rpm/heimdall-backend.env /etc/heimdall-server/backend.env
env -i PATH=/usr/sbin:/usr/bin:/sbin:/bin bash -c '
  set -euo pipefail
  bash /workspace/packaging/rpm/heimdall-configure.sh --non-interactive
  source /etc/heimdall-server/backend.env
  [[ -n "$DATABASE_PASSWORD" && -n "$JWT_SECRET" && -n "$API_KEY_SECRET" ]]
'
```

- [x] **Step 2: Verify the existing helper fails.** Expected failure: the
`EXTERNAL_URL` assertion. Record it before modifying configuration behavior.

- [x] **Step 3: Retain unmanaged assignments and stable defaults.** Before the
existing `write_key` calls, replace the unconditional generated-header write
with the following preservation block. The supported managed assignments are
one physical line, as emitted by `write_key`; retain all other lines verbatim.

```bash
if [[ -f "$ENV_FILE" ]]; then
  awk '!/^[[:space:]]*(export[[:space:]]+)?(NODE_ENV|PORT|DATABASE_HOST|DATABASE_PORT|DATABASE_USERNAME|DATABASE_PASSWORD|DATABASE_NAME|JWT_SECRET|JWT_EXPIRE_TIME|API_KEY_SECRET|NGINX_HOST|ADMIN_EMAIL|ADMIN_PASSWORD)=/' \
    "$ENV_FILE" >> "$TMP_FILE"
else
  printf '# Generated during heimdall-server RPM installation\n' >> "$TMP_FILE"
fi
```

Keep `write_key`'s escaping, the complete list of managed assignments, and
the final owner/mode operations. This preserves custom settings while avoiding
duplicate managed keys or an accumulating generated header.

Pass the loaded values as interactive defaults instead of hardcoded values:

```bash
prompt_with_default DATABASE_USERNAME "Enter DATABASE_USERNAME (leave blank to keep '${DATABASE_USERNAME}'): " "$DATABASE_USERNAME"
prompt_with_default DATABASE_PASSWORD 'Enter DATABASE_PASSWORD (leave blank to keep the current value or generate one if empty): ' "$DATABASE_PASSWORD"
prompt_with_default JWT_EXPIRE_TIME "Enter JWT_EXPIRE_TIME (leave blank to keep '${JWT_EXPIRE_TIME}'): " "$JWT_EXPIRE_TIME"
prompt_with_default NGINX_HOST "Enter FQDN/Hostname/IP (leave blank to keep '${NGINX_HOST}'): " "$NGINX_HOST"
```

Only probe for a TTY when `MODE` is not `non-interactive`, so unattended
installs do not emit the current `/dev/tty` error.

- [x] **Step 4: Make service-manager availability explicit.** Change `%post`
to call `configure.sh --non-interactive`. Immediately after its existing
configuration-failure handling, add:

```sh
if [ ! -d /run/systemd/system ] || ! systemctl show-environment >/dev/null 2>&1; then
  echo 'heimdall-server: service initialization deferred; run /usr/bin/heimdall-server-setup --non-interactive on the target host.' >&2
  exit 0
fi
```

Keep the existing bootstrap/migration error messages and recovery behavior.
In the explicit `heimdall-setup.sh`, before configuration or database changes,
require a running manager:

```bash
if [[ ! -d /run/systemd/system ]] || ! systemctl show-environment >/dev/null 2>&1; then
  echo 'Heimdall setup requires a running systemd service manager.' >&2
  exit 1
fi
```

At the end of explicit setup, enable the service and restart it so configuration
changes apply to an already running instance. Propagate failure under `set -e`:

```bash
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl is-active --quiet "$SERVICE_NAME"
```

Keep its existing successful-completion message. Check actual HTTP readiness
in lifecycle tests, since a just-spawned process can still fail afterward.

- [x] **Step 5: Verify preservation and both installation environments.** Run
`configure.sh` tests, then an interactive TTY run accepting all four defaults;
compare the existing secret hashes before/after without printing their values.
Install the rebuilt package without systemd and check it does not prompt or
report migrations completed. Install in a systemd container and run the real
database test. Check explicit setup returns nonzero without a system bus.
- [x] **Step 6: Commit this task.**

```bash
git add packaging/rpm/heimdall-configure.sh packaging/rpm/heimdall-server.spec packaging/rpm/heimdall-setup.sh packaging/rpm/tests/configure.sh
git commit -m "fix(rpm): preserve settings and make package setup noninteractive"
```

### Task 5: Verify the complete package lifecycle and finish the operator guide

**Files:**
- Create: `packaging/rpm/tests/lifecycle.sh`
- Modify: `packaging/rpm/README.md`
- Update evidence: this plan's final results section

**Interfaces:**
- Consumes: release `1` and release `2` RPMs of 2.14.0 for the same architecture, the `test-host` image, and Tasks 3–4's corrected setup helpers.
- Produces: reproducible pass/fail evidence for fresh install, login, rerun, upgrade, restart, and removal.
- `lifecycle.sh install RPM`, `lifecycle.sh upgrade RPM`, `lifecycle.sh verify`, and `lifecycle.sh remove` run inside a disposable test container.

- [x] **Step 1: Implement the shared readiness/login check in the lifecycle test.** Start with the container guard and `set -euo pipefail`. Define this function:

```bash
verify() {
  curl --fail --silent --show-error --retry 30 --retry-connrefused \
    --retry-delay 1 --retry-max-time 60 http://127.0.0.1:3000/server \
    -o /tmp/rpm-server.json
  /usr/bin/node -e 'JSON.parse(require("fs").readFileSync("/tmp/rpm-server.json", "utf8"))'
  systemctl is-active --quiet postgresql-18 heimdall-server
  [[ $(systemctl show -p User --value heimdall-server) == heimdall ]]
  curl --fail --silent --show-error http://127.0.0.1:3000/ -o /tmp/rpm-index.html
  grep -qi '<html' /tmp/rpm-index.html
  curl --fail --silent --show-error -H 'Content-Type: application/json' \
    --data '{"email":"rpm-test@example.invalid","password":"Rpm-Smoke-Only-2026!"}' \
    http://127.0.0.1:3000/authn/login -o /tmp/rpm-login.json
  /usr/bin/node -e 'const v=JSON.parse(require("fs").readFileSync("/tmp/rpm-login.json", "utf8")); if (!v.accessToken || !v.userID) process.exit(1)'
  rm -f /tmp/rpm-login.json
}
```

Use a bounded readiness check; on failure collect `systemctl status` and the
last 100 application/database journal lines for diagnosis. Keep test credentials
confined to disposable containers; do not print response tokens.

- [x] **Step 2: Add installation and verification commands.** Dispatch on
`$1`; validate the RPM argument with `test -f "$2"`. The install case is:

```bash
install -d /etc/heimdall-server
cat > /etc/heimdall-server/backend.env <<'ENV'
NODE_ENV=production
ADMIN_EMAIL=rpm-test@example.invalid
ADMIN_PASSWORD=Rpm-Smoke-Only-2026!
EXTERNAL_URL=https://heimdall.example.test
LOCAL_LOGIN_DISABLED=false
ENV
timeout 300 dnf install -y "$2"
verify
/usr/bin/heimdall-server-setup --non-interactive
verify
bash /tmp/rpm-tests/database.sh
sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-lifecycle-env.sha256
```

Define the state verification function explicitly:

```bash
verify_state() {
  verify
  sha256sum --check /tmp/rpm-lifecycle-env.sha256
  source /etc/heimdall-server/backend.env
  count=$(runuser -u postgres -- /usr/pgsql-18/bin/psql \
    -v ON_ERROR_STOP=1 -At -d "$DATABASE_NAME" \
    -c 'SELECT COUNT(*) FROM rpm_test_sentinel')
  [[ $count -eq 1 ]]
}
```

The `verify` command case calls `verify_state`.

- [x] **Step 3: Add upgrade and removal cases.** The upgrade command body is:

```bash
test -f "$2"
timeout 300 dnf upgrade -y "$2"
[[ $(rpm -q --qf '%{RELEASE}' heimdall-server) == 2.el8 ]]
verify_state
```

The removal command body is:

```bash
dnf remove -y --noautoremove heimdall-server
if rpm -q heimdall-server; then exit 1; fi
if systemctl is-active --quiet heimdall-server; then exit 1; fi
test -s /etc/heimdall-server/backend.env.rpmsave
systemctl is-active --quiet postgresql-18
source /etc/heimdall-server/backend.env.rpmsave
count=$(runuser -u postgres -- /usr/pgsql-18/bin/psql \
  -v ON_ERROR_STOP=1 -At -d "$DATABASE_NAME" \
  -c 'SELECT COUNT(*) FROM rpm_test_sentinel')
[[ $count -eq 1 ]]
```

Never drop the database or remove the PostgreSQL data directory. The default
case of the command dispatch is:

```bash
echo 'Usage: lifecycle.sh install RPM | upgrade RPM | verify | remove' >&2
exit 64
```

- [x] **Step 4: Build the final RPMs and a clean test host.** Repeat Task 2's
builder/artifact commands after all changes. Create the second release using
`--build-arg HEIMDALL_RELEASE=2` and export to
`packaging/rpm/dist/arm64-upgrade`. Build the test host:

```bash
docker build --platform linux/arm64 \
  --secret id=corp_ca,src=/etc/ssl/certs/mitre-ca-certificates.crt \
  -f packaging/rpm/Dockerfile.ol8 --target test-host -t heimdall-rpm-test:ol8 .
docker run -d --name heimdall-rpm-lifecycle-arm64 --runtime=runc \
  --privileged --cgroupns=private --tmpfs /run --tmpfs /run/lock \
  -e container=docker -e HEIMDALL_RPM_TEST=1 heimdall-rpm-test:ol8
docker exec heimdall-rpm-lifecycle-arm64 systemctl show-environment
docker cp packaging/rpm/tests heimdall-rpm-lifecycle-arm64:/tmp/rpm-tests
docker cp packaging/rpm/dist/arm64/RPMS/aarch64/heimdall-server-2.14.0-1.el8.aarch64.rpm heimdall-rpm-lifecycle-arm64:/tmp/initial.rpm
docker cp packaging/rpm/dist/arm64-upgrade/RPMS/aarch64/heimdall-server-2.14.0-2.el8.aarch64.rpm heimdall-rpm-lifecycle-arm64:/tmp/upgrade.rpm
```

This privilege setting is confined to a disposable container, with no host
directory mounts or exposed application ports. It is test infrastructure,
not the recommended production container deployment. A usable system bus is
a prerequisite; do not replace systemd with a stub and call that an install pass.

- [x] **Step 5: Run fresh installation and capture failures before further fixes.**

```bash
docker exec heimdall-rpm-lifecycle-arm64 bash /tmp/rpm-tests/lifecycle.sh install /tmp/initial.rpm
docker exec heimdall-rpm-lifecycle-arm64 bash /tmp/rpm-tests/lifecycle.sh upgrade /tmp/upgrade.rpm
docker restart heimdall-rpm-lifecycle-arm64
docker exec heimdall-rpm-lifecycle-arm64 bash /tmp/rpm-tests/lifecycle.sh verify
docker exec heimdall-rpm-lifecycle-arm64 bash /tmp/rpm-tests/lifecycle.sh remove
```

Wait for the system bus after restart and use the bounded application readiness
check. If application startup exposes a missing packaged dependency, correct
the payload based on that exact failure and rerun this flow. Report existing
logger failures separately. A package transaction exit code by itself does not
prove application startup or database migration success.

- [x] **Step 6: Repeat on AMD64 and document the limits.** Use
`--platform linux/amd64`, independent image/container names, `x86_64` RPMs,
and a separate output directory. Verify `uname -m` and RPM architecture inside
the container before testing. If Docker cannot run that architecture, record
the concrete failure and leave AMD64 unverified; do not relabel an ARM package.
Document that Docker does not validate host SELinux enforcement, external TLS,
or database migrations from a historical deployed release.

- [x] **Step 7: Rewrite the RPM README around the completed workflow.** Include
the Docker commands, native Git staging's clean-input rule, version minimum,
PGDG setup using `$(rpm -E '%{_arch}')` instead of hardcoded x86_64, CA handling,
artifact locations, noninteractive installation, explicit interactive setup,
service status, initialization deferred without systemd, upgrades preserving
custom settings, and `.rpmsave`/database retention on removal. Remove stale
2.12.6 examples and claims that RPM transactions prompt. Retain the historical
`--no-gpg-check` option documentation as an explicit operator override, not the
recommended route for fixing TLS errors. Record tested architectures and image
digest from actual results, not assumptions.

- [x] **Step 8: Commit only the lifecycle test, guide, and evidence.**

```bash
git add packaging/rpm/tests/lifecycle.sh packaging/rpm/README.md docs/superpowers/plans/2026-09-21-ol8-rpm-continuation.md docs/superpowers/specs/2026-09-21-ol8-rpm-continuation-design.md
git commit -m "test(rpm): verify OL8 installation and package lifecycle"
```

## Self-review and completion criteria

Spec coverage: R1 → Task 1; R2–R3 → Task 2; R4 → Task 3; R5–R6 → Task 4;
R7 → Task 5. File interfaces use the existing installed paths and exported
RPM layout. The upgrade test explicitly covers RPM release changes within
2.14.0; it does not establish compatibility with a historical database snapshot.

Before claiming completion, verify the final artifact has the expected
version/architecture, the new shell tests pass, installation and upgrade use
the artifact actually produced from the final source, and the logger and
user-owned files have no edits from this work. Preserve failed-build logs
under the ignored output directory. Remove only the containers created for
this task after evidence is copied out. Do not push, publish, or sign as part
of this plan.

## Planning verification record

On September 21, all Bash examples in this plan passed `bash -n`; the spec and
plan global constraints match exactly. The placeholder scan and whitespace
checks passed. No tracked packaging or application source was changed during
planning. Only this plan and its design document were added; baseline artifacts
and logs are in the ignored output directory. The reusable local image
`heimdall-rpm-baseline:ol8` contains the baseline builder environment.

All five implementation tasks are complete. Final x86_64 and ARM64 package
artifacts passed source staging, payload, metadata, clean-host, installation,
login, setup rerun, upgrade, restart, removal, and retained-database acceptance.
The detailed command logs and artifact hashes are retained under the Task 5
evidence directory.

## Final implementation results

- Task 5 added the bounded lifecycle test. Clean-host, no-systemd, and real-systemd acceptance passed, including fresh installation, login, setup rerun, database/configuration preservation, release upgrade, restart, verification, and retention-safe removal on x86_64 and ARM64.
- Final x86_64 release-1/release-2 binary SHA-256 values are `f8b143133c7e9f8a84567567cfb8c15361a962c590ce2fbf9c87843031523325` and `a5d7bf4051eb6aaffef2f45784ae695b6bbf180d540296abb6552176ee5ef57a`. Final ARM64 values are `c2394636520fe010151f8802e5f3db34c52fbc0adbc38e0edd7d1556697f4940` and `a6d22f1dc49f53f1c54d032a4b769a72f5bb46c5e1ef59274162b7c609f79212`.
- Docker launches requested `runc`, but final container inspection reported effective `sysbox-runc`. Acceptance therefore rests on the working system bus, real PostgreSQL/Heimdall units, HTTP/login behavior, database sentinel, restart, and removal checks.
- Docker validation does not establish native x86_64 hardware, host SELinux enforcement, external TLS termination, or migrations from a historical deployed database.
