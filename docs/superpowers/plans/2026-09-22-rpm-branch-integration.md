# RPM Branch Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify an RPM based on the richer deployment branch with the current RPM branch's source-consistency, configuration, migration, and lifecycle fixes.

**Architecture:** Start from `feature/fips-compliant-password-hashing` and port selected changes from `feat/rpm-build` by responsibility. Keep the target's explicit `heimdall-cli setup` workflow, optional local PostgreSQL, TLS integration, and host policies. Complete the separate CLI prerequisite plan before accepting a package, and keep application-upstream reconciliation out of this milestone.

**Tech Stack:** RPM, Bash, GNU Make, Python 3, Oracle Linux 8, systemd, PostgreSQL 18 acceptance fixtures, Node 22, Yarn Classic 1.22.22, Go 1.25.8, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-22-rpm-branch-integration-design.md`.

## Global Constraints

- Preserve the target branch's application and FIPS behavior; do not redesign, remove, or port cryptographic code in this milestone.
- Do not change logger setup, logger imports, logger formatters, log levels, transports, or existing log messages.
- Preserve the current checkout, existing local documents, and both source branches; implementation uses isolated worktrees.
- Keep `dnf install` noninteractive and free of database/configuration bootstrap; run setup explicitly through `heimdall-cli setup`.
- Keep PostgreSQL optional for remote deployments; use PGDG PostgreSQL 18 for the required local OL8 acceptance fixture.
- Require Node.js engine `>=22.18.0`, build with Node 22 and Yarn Classic `1.22.22`, and retain frozen dependency installation.
- Align VERSION, the RPM spec, and backend/frontend application versions at `2.13.1` for this milestone; retain existing library dependency versions and the lockfile unless a demonstrated integration failure requires a narrow correction.
- Mark candidate RPM releases `0.1.integration` and `0.2.integration`; do not publish these as stable releases or install them over 2.14.0.
- Pin the CLI to the exact tested commit, build with Go `1.25.8` or a deliberately pinned newer compatible toolchain, and never use mutable `main` for an accepted candidate.
- Keep TLS certificate verification and RPM signature verification enabled; corporate CA inputs remain outside the package payload.
- Preserve additional environment settings and existing credentials across configuration reruns and package upgrades.
- Require actual OL8 systemd/PostgreSQL/application lifecycle acceptance on `aarch64` and `x86_64`; do not infer native hardware, EL9, or enforcing-SELinux certification from those container runs.

---

## Starting point and integration method

Base: `6c69c3c2a8c015d4ab9c6fcea4cd9feab4723c72`.
Donor: `e5ded4aa67d95745a4da7c64b55e13e480e412d1`.

Use `using-git-worktrees` at execution time to create an isolated checkout from
the base, on `codex/rpm-integrated-install`. Keep the current `feat/rpm-build`
checkout intact. Copy this plan, its companion CLI plan, and the design into
that worktree; they must remain available to executors. Verify ancestry before
implementation:

```bash
git merge-base --is-ancestor 6c69c3c2a8c015d4ab9c6fcea4cd9feab4723c72 HEAD
git status --short --branch
```

Do not run `git merge feat/rpm-build`, blanket `git checkout --theirs`, or copy
the entire donor `packaging/rpm` tree. In particular, retain the target spec's
CLI/TLS/security sources and explicit setup model. Direct file imports below
are only for identified tests and the Docker exclusion list.

The CLI prerequisite is
`docs/superpowers/plans/2026-09-22-heimdall-cli-rpm-prerequisites.md`. Its tested
checkout supplies `CLI_WORKTREE`, an actual absolute path, in Task 2.

## File map

| Files | Responsibility |
|---|---|
| `apps/backend/package.json` | Correct only the application version to 2.13.1 |
| `packaging/rpm/Makefile`, `setup-rpm-build-env.sh` | One supported staging/build path; compatibility wrapper delegates to Make |
| `packaging/rpm/scripts/check-inputs.py` | Version, source-mode, topdir, and clean-input checks |
| `packaging/rpm/heimdall-cli.ref`, `heimdall-cli.repo` | Immutable tested CLI commit and the repository that actually contains it |
| `packaging/rpm/heimdall-server.spec` | Engine requirement, candidate releases, complete payload and man-page sources |
| `packaging/rpm/heimdall-configure.sh`, `heimdall-db-setup.sh`, `heimdall-setup.sh` | Preserve configuration, use compiled migrations, verify service operations |
| `packaging/rpm/heimdall-server.service` | Retain hardening and order startup after supported local PostgreSQL units |
| `packaging/rpm/Dockerfile.ol8`, `.dockerignore` companion, `scripts/setup-build-deps.sh` | Controlled build/test images and compatible toolchain |
| `packaging/rpm/tests/*` | Source checks, configuration, payload, real local/remote lifecycle, TLS and recovery |
| `.github/workflows/build-rpm.yml` | Build triggers, dependency bootstrap, artifact/install/lifecycle gates |
| `packaging/rpm/README.md`, `INSTALL.md` | Exact candidate build/install/upgrade commands and acceptance evidence |

## Task 1: Make version and source staging agree

**Files:** Modify `apps/backend/package.json`, `packaging/rpm/Makefile`, and
`packaging/rpm/heimdall-server.spec`; create `packaging/rpm/scripts/check-inputs.py`
and `packaging/rpm/tests/inputs.py`.

**Interfaces:** `check-inputs.py REPO TOPDIR MODE`, with MODE one of `check`,
`head`, `release`, `workspace`; exits zero after checks and prints the application
version. `head` archives committed HEAD, `release` additionally requires the
matching tag at HEAD, and `workspace` is the filtered Docker context.

- [ ] **Step 1: Create a regression that runs checks in a temporary fixture.**

```python
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

CHECK = Path(__file__).resolve().parents[1] / 'scripts/check-inputs.py'

class InputsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'source'
        for name in ('apps/backend', 'apps/frontend', 'packaging/rpm'):
            (self.root / name).mkdir(parents=True, exist_ok=True)
        (self.root / 'VERSION').write_text('v2.13.1\n')
        (self.root / 'packaging/rpm/heimdall-server.spec').write_text('Version: 2.13.1\n')
        for app in ('backend', 'frontend'):
            (self.root / f'apps/{app}/package.json').write_text(json.dumps({'version': '2.13.1'}))
        self.topdir = Path(self.tmp.name) / 'output'

    def check(self, mode='check'):
        return subprocess.run(['python3', str(CHECK), str(self.root), str(self.topdir), mode], capture_output=True, text=True)

    def test_matching_versions(self):
        self.assertEqual(self.check().returncode, 0)

    def test_backend_mismatch(self):
        (self.root / 'apps/backend/package.json').write_text('{"version":"2.13.0"}')
        result = self.check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('version mismatch', result.stderr)

    def test_symlinked_in_tree_topdir(self):
        link = Path(self.tmp.name) / 'source-link'
        link.symlink_to(self.root, target_is_directory=True)
        self.topdir = link / 'output'
        self.assertNotEqual(self.check('workspace').returncode, 0)

if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: Run `python3 packaging/rpm/tests/inputs.py`; confirm the missing checker fails.**

- [ ] **Step 3: Implement the checker.**

```python
#!/usr/bin/env python3
import json
from pathlib import Path
import re
import subprocess
import sys

repo, topdir = (Path(value).resolve() for value in sys.argv[1:3])
mode = sys.argv[3]
if mode not in ('check', 'head', 'release', 'workspace'):
    sys.exit('Unknown source mode')
version = (repo / 'VERSION').read_text().strip().lstrip('v')
spec = (repo / 'packaging/rpm/heimdall-server.spec').read_text()
match = re.search(r'^Version:\s+(\S+)', spec, re.MULTILINE)
versions = {'RPM': match.group(1) if match else ''}
for app in ('backend', 'frontend'):
    versions[app] = json.loads((repo / f'apps/{app}/package.json').read_text())['version']
if not version or any(value != version for value in versions.values()):
    sys.exit(f'version mismatch: VERSION={version}; {versions}')
if mode != 'check':
    if topdir == repo or repo in topdir.parents:
        sys.exit('RPM topdir must be outside the source tree')
    if mode != 'workspace':
        def git(*args):
            return subprocess.check_output(['git', '-C', str(repo), *args], text=True).strip()
        paths = ['VERSION', 'package.json', 'yarn.lock', 'lerna.json', 'tsconfig.json',
                 'postcss.config.js', 'apps', 'libs', 'packaging/rpm']
        if git('status', '--porcelain', '--untracked-files=all', '--', *paths):
            sys.exit('Uncommitted build inputs; commit them or use the Docker workspace build')
        if mode == 'release' and git('rev-parse', 'HEAD') != git('rev-parse', f'v{version}^{{commit}}'):
            sys.exit('Release build requires HEAD at the matching version tag')
print(version)
```

OL8's Python may be 3.6: do not introduce syntax or APIs newer than that into
this helper.

- [ ] **Step 4: Align backend metadata and wire the target Makefile to the checker.**

Set only backend `version` to `2.13.1`. Keep target VERSION/spec/frontend/library
dependencies as-is. Replace `check-version`'s recipe and add source-mode handling:

```make
TOPDIR ?= $(HOME)/rpmbuild-heimdall
SOURCE_MODE ?= $(if $(filter 1,$(DEV)),head,release)

check-version:
	python3 scripts/check-inputs.py ../.. "$(TOPDIR)" check

check-source: check-version
	python3 scripts/check-inputs.py ../.. "$(TOPDIR)" "$(SOURCE_MODE)"

sources: check-source
	mkdir -p "$(TOPDIR)/SOURCES"
ifeq ($(SOURCE_MODE),workspace)
	tar -C ../.. --exclude=.git --exclude=.beads --exclude=node_modules \
	  --exclude=dist --exclude=rpmbuild --exclude=.env --exclude='.env-*' \
	  --exclude='*.rpm' --exclude=certs --exclude=.cache --exclude=coverage \
	  --transform 's|^\.|heimdall2-$(VERSION)|' \
	  -czf "$(TOPDIR)/SOURCES/heimdall2-$(VERSION).tar.gz" .
else
	git -C ../.. archive --format=tar.gz --prefix=heimdall2-$(VERSION)/ HEAD \
	  -o "$(TOPDIR)/SOURCES/heimdall2-$(VERSION).tar.gz"
endif
```

Delete the old `TOPDIR :=` assignment and old `sources` recipe; do not create
duplicate targets. Keep the existing version-reading Make variables. Make
`stage` depend on `check-source` before it copies packaging assets, and keep
build invocation serial so prerequisite validation precedes CLI downloads.
Add `check-source` to `.PHONY` and make `cli-src` depend on `check-source`, so
validation also precedes acquisition under `make -j`. This does not create a
cycle: `check-source` depends only on `check-version`.

In the RPM spec, use:

```spec
%{!?heimdall_release:%global heimdall_release 0.1.integration}
Release:        %{heimdall_release}%{?dist}
BuildRequires:  nodejs(engine) >= 22.18.0
Requires:       nodejs(engine) >= 22.18.0
```

Replace the existing Node requirements; retain all other target requirements.
Pass `--define "heimdall_release $(HEIMDALL_RELEASE)"` from the Makefile's
`rpm` and `srpm` targets, with `HEIMDALL_RELEASE ?= 0.1.integration`.

- [ ] **Step 5: Extend fixture tests to committed, dirty, and linked-worktree cases.**

Use the same `InputsTest` fixture and this exact Git initialization:

```python
def commit_fixture(self):
    def git(*args):
        subprocess.run(['git', '-C', str(self.root), *args], check=True, capture_output=True)
    git('init', '-q')
    git('add', '.')
    git('-c', 'user.name=RPM Test', '-c', 'user.email=rpm-test@example.invalid', 'commit', '-qm', 'fixture')
    return git

def test_dirty_and_unrelated_inputs(self):
    self.commit_fixture()
    self.assertEqual(self.check('head').returncode, 0)
    (self.root / 'notes.txt').write_text('unrelated')
    self.assertEqual(self.check('head').returncode, 0)
    (self.root / 'apps/backend/new-file.txt').write_text('build input')
    self.assertNotEqual(self.check('head').returncode, 0)

def test_release_requires_matching_head(self):
    git = self.commit_fixture()
    self.assertNotEqual(self.check('release').returncode, 0)
    git('tag', 'v2.13.1')
    self.assertEqual(self.check('release').returncode, 0)

def test_linked_worktree(self):
    git = self.commit_fixture()
    linked = Path(self.tmp.name) / 'linked'
    git('worktree', 'add', '--detach', str(linked), 'HEAD')
    self.root = linked
    self.assertEqual(self.check('head').returncode, 0)
```

- [ ] **Step 6: Run tests, check versions, and commit.**

```bash
python3 packaging/rpm/tests/inputs.py
make -C packaging/rpm check-version
git diff --check
git add apps/backend/package.json packaging/rpm/Makefile packaging/rpm/heimdall-server.spec packaging/rpm/scripts/check-inputs.py packaging/rpm/tests/inputs.py
git commit -m "build(rpm): align integration metadata and validate source inputs"
```

## Task 2: Package the tested CLI and make SRPM man pages self-contained

**Files:** Create `packaging/rpm/heimdall-cli.ref` and `heimdall-cli.repo`; modify
`Makefile`, `heimdall-server.spec`, `setup-rpm-build-env.sh`; create
`packaging/rpm/tests/cli-inputs.sh`.

**Interfaces:** Consumes the completed CLI prerequisite plan and its actual
`CLI_WORKTREE` path. Produces Source15 (CLI binary), Source22 (man-page archive),
and a CLI whose version output identifies the pinned commit.

- [ ] **Step 1: Capture and test the dependency contract.**

```bash
test -n "$CLI_WORKTREE"
git -C "$CLI_WORKTREE" diff --quiet HEAD
git -C "$CLI_WORKTREE" rev-parse HEAD > packaging/rpm/heimdall-cli.ref
git -C "$CLI_WORKTREE" remote get-url origin > packaging/rpm/heimdall-cli.repo
```

The commit must be fetchable from the recorded repository. Confirm this by
cloning that repository into a temporary directory and checking out the recorded
SHA. Do not replace a missing published commit with `main`.

`cli-inputs.sh` runs after `make stage`, taking the absolute TOPDIR as `$1`:

```bash
#!/bin/bash
set -euo pipefail
topdir=$1
test -x "$topdir/SOURCES/heimdall-cli"
test -s "$topdir/SOURCES/heimdall-cli-man.tar.gz"
tar -tzf "$topdir/SOURCES/heimdall-cli-man.tar.gz" > "$topdir/man-members.txt"
grep -qx 'man1/heimdall-cli.1' "$topdir/man-members.txt"
grep -qx 'man1/heimdall-cli-setup.1' "$topdir/man-members.txt"
```

- [ ] **Step 2: Record the missing generator in a separate checkout of the old CLI.**

```bash
old_cli="$(mktemp -d)/heimdall-cli"
git clone https://github.com/mitre/heimdall-cli.git "$old_cli"
git -C "$old_cli" checkout --detach c7da1593c4ffa81d4457fa0757418842ae50bac0
(cd "$old_cli" && go run ./cmd/gen-manpages /tmp/heimdall-old-cli-man)
```

Expected: the generator directory is missing. Do not switch the completed
`CLI_WORKTREE` away from its tested commit. Subsequent staging uses that tested
commit through the new pin files.

- [ ] **Step 3: Update Makefile CLI acquisition and man staging.**

```make
HEIMDALL_CLI_REPO := $(shell cat heimdall-cli.repo)
HEIMDALL_CLI_REF := $(shell cat heimdall-cli.ref)
```

Before fetching, reject refs that are not exactly 40 hex characters:

```bash
printf '%s\n' "$(HEIMDALL_CLI_REF)" | grep -Eq '^[0-9a-f]{40}$$'
```

Keep clone/fetch/detached checkout, then assert the checked-out HEAD equals the
pin. Use the CLI commit's timestamp for the binary Date field:

```make
-X 'github.com/mitre/heimdall-cli/internal/version.Date=$$(git show -s --format=%cI HEAD)'
```

Generate and stage the archive under TOPDIR, not an untracked source-tree path:

```make
man: cli-src
	mkdir -p "$(TOPDIR)/cli-man/man1" "$(TOPDIR)/SOURCES"
	cd "$(CLI_DIR)" && go run ./cmd/gen-manpages "$(TOPDIR)/cli-man/man1"
	tar -C "$(TOPDIR)/cli-man" -czf "$(TOPDIR)/SOURCES/heimdall-cli-man.tar.gz" man1
```

Remove the old `BUILD/man/man1` staging and ignored copy failure. Add to the spec:

```spec
Source22:       heimdall-cli-man.tar.gz
```

After `%autosetup`, extract the archive inside the application source tree:

```spec
mkdir -p rpm-man
tar -xzf %{SOURCE22} -C rpm-man
```

Replace the old optional man-page installation block with:

```spec
install -d %{buildroot}%{_mandir}/man1
install -p -m 0644 rpm-man/man1/*.1 %{buildroot}%{_mandir}/man1/
```

- [ ] **Step 4: Replace the stale build helper with a delegating wrapper.**

The wrapper accepts `--build`, `--skip-deps`, `--topdir PATH`, and `--dev`.
Unrecognized legacy flags fail with usage instead of silently selecting different
sources. Update documentation with the replacement commands in Task 6.

```bash
#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
target=stage
deps=1
topdir="${HOME}/rpmbuild-heimdall"
dev=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --build) target=rpm; shift ;;
    --skip-deps) deps=0; shift ;;
    --dev) dev=1; shift ;;
    --topdir) [[ $# -ge 2 ]] || exit 64; topdir=$2; shift 2 ;;
    -h|--help) echo 'Usage: setup-rpm-build-env.sh [--build] [--skip-deps] [--dev] [--topdir PATH]'; exit 0 ;;
    *) echo "Unsupported option: $1" >&2; exit 64 ;;
  esac
done
topdir=$(python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "$topdir")
if [[ $deps -eq 1 ]]; then make deps; fi
exec make "$target" "TOPDIR=$topdir" "DEV=$dev"
```

- [ ] **Step 5: In a prepared Linux builder, stage and inspect the CLI/man payload.**

```bash
make -C packaging/rpm stage SOURCE_MODE=workspace TOPDIR=/rpmbuild
bash packaging/rpm/tests/cli-inputs.sh /rpmbuild
/rpmbuild/SOURCES/heimdall-cli --version
```

This check runs inside a disposable builder against its copied workspace. After
committing, also test `DEV=1` in a Git checkout. The full SRPM rebuild check is in
Task 4.

- [ ] **Step 6: Commit only the CLI integration files.**

```bash
git add packaging/rpm/heimdall-cli.ref packaging/rpm/heimdall-cli.repo packaging/rpm/Makefile packaging/rpm/heimdall-server.spec packaging/rpm/setup-rpm-build-env.sh packaging/rpm/tests/cli-inputs.sh
git commit -m "build(rpm): pin the CLI and include man pages in source packages"
```

## Task 3: Port runtime fixes without reverting the explicit setup model

**Files:** Modify `packaging/rpm/heimdall-configure.sh`, `heimdall-db-setup.sh`,
`heimdall-setup.sh`, `heimdall-server.service`, and `heimdall-server.spec`; create
`packaging/rpm/tests/configure.sh` and `database.sh` from the donor.

**Interfaces:** Preserve `heimdall-server-db-setup [--skip-seed]` and the target's
shell setup flags. The normal administrator interface remains `heimdall-cli setup`.
Do not restore donor `%post` automation or hard PostgreSQL-18 Requires.

- [ ] **Step 1: Import the two focused donor tests.**

```bash
mkdir -p packaging/rpm/tests
git show e5ded4aa67d95745a4da7c64b55e13e480e412d1:packaging/rpm/tests/configure.sh > packaging/rpm/tests/configure.sh
git show e5ded4aa67d95745a4da7c64b55e13e480e412d1:packaging/rpm/tests/database.sh > packaging/rpm/tests/database.sh
```

Add `OIDC_NAME='Corporate Login'` to the configure fixture and assert
`[[ $OIDC_NAME == 'Corporate Login' ]]` after configuration. Keep the existing
disposable-container guard. Run configure.sh in an OL8 scratch container with
the source copied to `/workspace`; expect the additional-setting assertion to
fail before modifying the configurator. Run database.sh against a disposable
installed target RPM when available; otherwise use the first candidate in Task
4 and record that the baseline installed reproduction was unavailable.

- [ ] **Step 2: Apply the preservation change while retaining EXTERNAL_URL support.**

Replace the generated-header overwrite with:

```bash
if [[ -f "$ENV_FILE" ]]; then
  awk '!/^[[:space:]]*(export[[:space:]]+)?(NODE_ENV|PORT|DATABASE_HOST|DATABASE_PORT|DATABASE_USERNAME|DATABASE_PASSWORD|DATABASE_NAME|JWT_SECRET|JWT_EXPIRE_TIME|API_KEY_SECRET|NGINX_HOST|EXTERNAL_URL|ADMIN_EMAIL|ADMIN_PASSWORD)=/' \
    "$ENV_FILE" > "$TMP_FILE"
else
  printf '# Generated by heimdall-server-setup\n' > "$TMP_FILE"
fi
```

Keep all existing `write_key` calls. Change the password prompt default to
`"${DATABASE_PASSWORD}"`; keep the target's external URL argument and other
prompts. Verify blank input retains a configured password in an OL8 pseudo-TTY
session; do not merely grep for the new default.

- [ ] **Step 3: Apply the donor migration launcher fix.**

Delete `TSX_BIN`, preserve the existing missing-executable message, and use:

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

Keep `db:create`'s existing-database handling and `--skip-seed` semantics. In the
spec's `%build`, add these assertions after frontend/backend compilation:

```bash
test -s apps/backend/dist/src/main.js
test -s apps/backend/dist/db/database.js
test -s dist/frontend/index.html
test -x apps/backend/node_modules/.bin/sequelize
```

- [ ] **Step 4: Adapt the shell service guard/restart fix and preserve unit hardening.**

After shell setup has parsed flags/root checks, before changing configuration,
require systemd unless `RECONFIGURE_ONLY=1`:

```bash
if [[ $RECONFIGURE_ONLY -eq 0 ]] &&
   { [[ ! -d /run/systemd/system ]] || ! systemctl show-environment >/dev/null 2>&1; }; then
  echo 'Heimdall setup requires a running systemd service manager.' >&2
  exit 1
fi
```

In its final service step, replace `enable --now` with:

```bash
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl is-active --quiet "$SERVICE_NAME"
```

Retain existing output strings. Add ordering for PGDG units without requiring a
local database or weakening hardening:

```ini
After=network-online.target postgresql.service postgresql-13.service postgresql-14.service postgresql-15.service postgresql-16.service postgresql-17.service postgresql-18.service
```

Keep CLI validation, `UV_THREADPOOL_SIZE`, all security directives, and logger
settings. Add ordinary runtime `Requires: tar` because the bundled CLI's backup
and restore invoke it; retain existing optional PostgreSQL/Caddy recommendations.

- [ ] **Step 5: Run configure/database tests, shell syntax checks, and commit.**

```bash
for script in packaging/rpm/*.sh packaging/rpm/tests/*.sh; do bash -n "$script"; done
git diff --check
git add packaging/rpm/heimdall-configure.sh packaging/rpm/heimdall-db-setup.sh packaging/rpm/heimdall-setup.sh packaging/rpm/heimdall-server.service packaging/rpm/heimdall-server.spec packaging/rpm/tests/configure.sh packaging/rpm/tests/database.sh
git commit -m "fix(rpm): preserve runtime settings and use packaged database tools"
```

Do not claim database acceptance until the real installed-package test in Task 5
passes. Static syntax and an edited helper alone are insufficient.

## Task 4: Build complete candidate RPMs on OL8

**Files:** Create `packaging/rpm/Dockerfile.ol8`,
`packaging/rpm/Dockerfile.ol8.dockerignore`, `packaging/rpm/tests/payload.sh`;
modify `packaging/rpm/scripts/setup-build-deps.sh` and `.gitignore`.

**Interfaces:** Docker targets `builder`, `test-host`, and `artifacts`;
`HEIMDALL_RELEASE` selects `0.1.integration` or `0.2.integration`.
Outputs are `RPMS/<arch>/*.rpm` and `SRPMS/*.src.rpm` under the chosen destination.

- [ ] **Step 1: Import the donor payload test and adapt its assertions.**

```bash
git show e5ded4aa67d95745a4da7c64b55e13e480e412d1:packaging/rpm/tests/payload.sh > packaging/rpm/tests/payload.sh
git show e5ded4aa67d95745a4da7c64b55e13e480e412d1:packaging/rpm/Dockerfile.ol8.dockerignore > packaging/rpm/Dockerfile.ol8.dockerignore
```

Read expected version from argument 2 (`expected_version=${2:?expected version}`)
instead of hardcoded 2.14.0. Retain all file/link/dependency checks. Add:

```bash
test -x "$scratch/usr/bin/heimdall-cli"
find "$scratch/usr/share/man/man1" -name 'heimdall-cli-setup.1*' | grep -q .
test -s "$scratch/usr/libexec/heimdall-server/heimdall-Caddyfile"
test -s "$scratch/usr/share/selinux/packages/heimdall-server.pp"
```

Append `**/rpmbuild`, `**/man/man1`, and `**/cli-man` to the Docker exclusion
file, and `dist/` to `packaging/rpm/.gitignore`.

- [ ] **Step 2: Repair compatible dependency bootstrap.**

Remove the unconditional `curl` RPM from the target build-package list. Add
`command -v curl >/dev/null` before repository downloads; OL8/EL9 curl-minimal
satisfies it. Do not erase curl-minimal. Replace the Go install block with a version-aware install
of the selected `GO_VERSION` (default `1.25.8`) and a final check:

```bash
GO_VERSION=${GO_VERSION:-1.25.8}
installed_go=$(go version 2>/dev/null | awk '{sub(/^go/, "", $3); print $3}' || true)
if [[ "$installed_go" != "$GO_VERSION" ]]; then
  arch_suffix=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')
  go_archive=$(mktemp)
  curl --fail --location "https://go.dev/dl/go${GO_VERSION}.linux-${arch_suffix}.tar.gz" -o "$go_archive"
  ${SUDO} install -d "/opt/heimdall-build/go-${GO_VERSION}"
  ${SUDO} tar -C "/opt/heimdall-build/go-${GO_VERSION}" --strip-components=1 -xzf "$go_archive"
  rm -f "$go_archive"
  export PATH="/opt/heimdall-build/go-${GO_VERSION}/bin:$PATH"
fi
test "$(go env GOVERSION)" = "go${GO_VERSION}"
test "$(yarn --version)" = 1.22.22
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a!==22 || b<18) process.exit(1)'
```

Build environments set the same Go path for subsequent Make invocations;
printing an `export` in a child script does not change the parent shell.
If the available Yarn RPM is not 1.22.22, install that exact Yarn Classic RPM
from the configured Yarn repository and repeat the check; never substitute
Corepack or a floating major version silently.

- [ ] **Step 3: Add the adapted OL8 Docker definition.**

```dockerfile
# syntax=docker/dockerfile:1
FROM golang:1.25.8 AS go-toolchain
FROM oraclelinux:8 AS trusted-base
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN --mount=type=secret,id=corp_ca \
    if [[ -s /run/secrets/corp_ca ]]; then \
      install -m 0644 /run/secrets/corp_ca /etc/pki/ca-trust/source/anchors/rpm-test-ca.crt; \
      update-ca-trust; \
    fi
ENV NODE_EXTRA_CA_CERTS=/etc/pki/tls/certs/ca-bundle.crt

FROM trusted-base AS test-host
RUN mkdir -p /usr/share/man/man1 && \
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - && \
    dnf install -y "https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-$(rpm -E '%{_arch}')/pgdg-redhat-repo-latest.noarch.rpm" && \
    dnf -qy module disable postgresql && \
    dnf install -y systemd procps-ng && dnf clean all
CMD ["/sbin/init"]

FROM trusted-base AS builder
COPY --from=go-toolchain /usr/local/go /usr/local/go
ENV PATH=/usr/local/go/bin:$PATH
ENV GOTOOLCHAIN=local
ARG HEIMDALL_RELEASE=0.1.integration
ARG QEMU_GUEST_BASE
WORKDIR /workspace
COPY . .
RUN bash packaging/rpm/scripts/setup-build-deps.sh --skip-update
RUN make -C packaging/rpm rpm SOURCE_MODE=workspace TOPDIR=/rpmbuild \
      HEIMDALL_RELEASE="$HEIMDALL_RELEASE" && \
    bash packaging/rpm/tests/cli-inputs.sh /rpmbuild && \
    bash packaging/rpm/tests/payload.sh \
      /rpmbuild/RPMS/$(rpm -E '%{_arch}')/heimdall-server-*.rpm 2.13.1

FROM scratch AS artifacts
COPY --from=builder /rpmbuild/RPMS /RPMS
COPY --from=builder /rpmbuild/SRPMS /SRPMS
```

Run configure.sh using `docker run` on the builder image, not during Docker
build: its guard checks `/.dockerenv`, which is not a portable BuildKit RUN
assumption. Do not set the opt-in variable in the application package/service.

- [ ] **Step 4: Build candidates on each architecture, one at a time.**

```bash
docker build --platform linux/arm64 -f packaging/rpm/Dockerfile.ol8 \
  --target builder -t heimdall-integration-builder:arm64 .
docker run --rm --platform linux/arm64 -e HEIMDALL_RPM_TEST=1 \
  heimdall-integration-builder:arm64 bash /workspace/packaging/rpm/tests/configure.sh
docker build --platform linux/arm64 -f packaging/rpm/Dockerfile.ol8 \
  --target artifacts --output type=local,dest=packaging/rpm/dist/integration/arm64-release1 .
docker build --platform linux/arm64 -f packaging/rpm/Dockerfile.ol8 \
  --build-arg HEIMDALL_RELEASE=0.2.integration --target artifacts \
  --output type=local,dest=packaging/rpm/dist/integration/arm64-release2 .
docker build --platform linux/amd64 -f packaging/rpm/Dockerfile.ol8 \
  --build-arg QEMU_GUEST_BASE=0x800000000000 --target builder \
  -t heimdall-integration-builder:amd64 .
docker run --rm --platform linux/amd64 -e HEIMDALL_RPM_TEST=1 \
  heimdall-integration-builder:amd64 bash /workspace/packaging/rpm/tests/configure.sh
docker build --platform linux/amd64 -f packaging/rpm/Dockerfile.ol8 \
  --build-arg QEMU_GUEST_BASE=0x800000000000 --target artifacts \
  --output type=local,dest=packaging/rpm/dist/integration/amd64-release1 .
docker build --platform linux/amd64 -f packaging/rpm/Dockerfile.ol8 \
  --build-arg QEMU_GUEST_BASE=0x800000000000 \
  --build-arg HEIMDALL_RELEASE=0.2.integration --target artifacts \
  --output type=local,dest=packaging/rpm/dist/integration/amd64-release2 .
```

Use the optional `--secret id=corp_ca,src=/etc/ssl/certs/mitre-ca-certificates.crt`
only if that real host trust file exists and is needed. On constrained ARM Macs,
reuse the donor README's measured 4-GiB/one-worker build procedure with paths
changed to `heimdall2-2.13.1`; do not change frontend behavior or disable checks
to hide build-resource failures. Report unrelated logger failures separately.

- [ ] **Step 5: Rebuild an SRPM in a fresh build directory.**

Use a builder with the same dependencies but an empty `/tmp/srpm-rebuild`:

```bash
mkdir -p /tmp/srpm-rebuild
rpmbuild --rebuild --define '_topdir /tmp/srpm-rebuild' \
  /rpmbuild/SRPMS/heimdall-server-2.13.1-0.1.integration.el8.src.rpm
bash /workspace/packaging/rpm/tests/payload.sh \
  /tmp/srpm-rebuild/RPMS/$(rpm -E '%{_arch}')/heimdall-server-*.rpm 2.13.1
```

Expected: man pages install from Source22 despite the empty BUILD tree. Also
check `rpm -qp --scripts` to ensure installation never calls configuration or
database setup. A passing build alone does not establish a working installation.

- [ ] **Step 6: Commit Docker, payload, and bootstrap changes.**

```bash
git add packaging/rpm/Dockerfile.ol8 packaging/rpm/Dockerfile.ol8.dockerignore packaging/rpm/tests/payload.sh packaging/rpm/scripts/setup-build-deps.sh packaging/rpm/.gitignore
git commit -m "build(rpm): adapt OL8 builders to the integrated package"
```

## Task 5: Prove the package lifecycle through the CLI

**Files:** Create `packaging/rpm/tests/lifecycle.sh` from the donor; create
`packaging/rpm/tests/features.sh` and `packaging/rpm/tests/run-lifecycle.sh`.

**Interfaces:** `lifecycle.sh install RPM`, `upgrade RPM`, `verify`, and `remove`
run only inside an opted-in disposable systemd container. The host runner takes
`PLATFORM RELEASE1_RPM RELEASE2_RPM`; it creates dedicated named containers,
copies exact artifacts/tests, and saves results under ignored `dist/integration`.

- [ ] **Step 1: Import lifecycle.sh and retain its real service/login/state assertions.**

```bash
git show e5ded4aa67d95745a4da7c64b55e13e480e412d1:packaging/rpm/tests/lifecycle.sh > packaging/rpm/tests/lifecycle.sh
```

In `install`, retain the synthetic admin/env fixture but use
`EXTERNAL_URL=http://localhost:3000` for the initial non-TLS fixture. Replace
the install and setup section with:

```bash
timeout 300 dnf install -y --setopt=install_weak_deps=False "$2"
if systemctl is-active --quiet heimdall-server; then exit 1; fi
test ! -e /var/lib/pgsql/18/data/PG_VERSION
dnf install -y postgresql18 postgresql18-server
/usr/bin/heimdall-cli setup --non-interactive --skip-tls
verify
before_pid=$(systemctl show -p MainPID --value heimdall-server)
/usr/bin/heimdall-cli setup --non-interactive --skip-tls
after_pid=$(systemctl show -p MainPID --value heimdall-server)
[[ $before_pid != "$after_pid" ]]
verify
bash /tmp/rpm-tests/database.sh
sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-lifecycle-env.sha256
```

Add both health endpoints to `verify`:

```bash
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3000/health -o /tmp/rpm-health.json
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3000/health/ready -o /tmp/rpm-ready.json
/usr/bin/node -e 'const fs=require("fs"); if(JSON.parse(fs.readFileSync("/tmp/rpm-health.json")).version!=="2.13.1") process.exit(1); if(JSON.parse(fs.readFileSync("/tmp/rpm-ready.json")).status!=="ok") process.exit(1)'
```

Use `SequelizeMeta` row counts and the existing sentinel from database.sh;
the helper does not change target migrations or seeds.

- [ ] **Step 2: Adapt upgrade testing to explicit migrations and administrator-controlled restart.**

Before upgrading, write `RESTART_ON_UPGRADE=false` into the existing sysconfig
assignment and record MainPID. Run:

```bash
sed -i 's/^RESTART_ON_UPGRADE=.*/RESTART_ON_UPGRADE=false/' /etc/sysconfig/heimdall-server
before_pid=$(systemctl show -p MainPID --value heimdall-server)
timeout 300 dnf upgrade -y "$2"
[[ $(rpm -q --qf '%{RELEASE}' heimdall-server) == 0.2.integration.el8 ]]
[[ $(systemctl show -p MainPID --value heimdall-server) == "$before_pid" ]]
sha256sum --check /tmp/rpm-lifecycle-env.sha256
test -n "$(find /var/lib/heimdall-server/backups -name '*.tar.gz' -print -quit)"
/usr/bin/heimdall-cli setup --non-interactive --skip-tls
verify_state
```

Retain reboot verification and removal assertions. Before removal, explicitly
remove package-managed fapolicyd trust entries while the CLI still exists:
the target `%postun` currently invokes the CLI after its file may have been
removed. Move that existing cleanup invocation into the `$1 == 0` path of
`%preun` and remove the obsolete `%postun` copy; retain messages and SELinux
cleanup. Verify removal leaves database/sentinel and `backend.env.rpmsave`.

- [ ] **Step 3: Add the host runner using the verified disposable-systemd launch.**

Core of `run-lifecycle.sh` (run from repository root):

```bash
#!/bin/bash
set -euo pipefail
platform=${1:?platform}
initial=$(python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "${2:?initial rpm}")
upgrade=$(python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "${3:?upgrade rpm}")
name="heimdall-integration-${platform##*/}-$$"
image="heimdall-integration-test:${platform##*/}"
logdir="packaging/rpm/dist/integration/evidence/$name"
mkdir -p "$logdir"
exec > >(tee "$logdir/output.log") 2>&1
ca_args=()
if [[ -n ${RPM_TEST_CA:-} ]]; then ca_args=(--secret "id=corp_ca,src=$RPM_TEST_CA"); fi
docker build --platform "$platform" "${ca_args[@]}" -f packaging/rpm/Dockerfile.ol8 --target test-host -t "$image" .
docker run -d --name "$name" --platform "$platform" --runtime=runc \
  --privileged --cgroupns=private --tmpfs /run --tmpfs /run/lock \
  -e container=docker -e HEIMDALL_RPM_TEST=1 "$image"
cleanup() {
  result=$?
  docker inspect "$name" > "$logdir/container.json" 2>/dev/null || true
  if [[ $result -ne 0 ]]; then
    docker exec "$name" systemctl status --no-pager postgresql-18 heimdall-server caddy || true
    docker exec "$name" journalctl --no-pager -u postgresql-18 -u heimdall-server -u caddy -n 100 || true
  fi
  docker rm -f "$name" >/dev/null 2>&1 || true
  exit "$result"
}
trap cleanup EXIT
wait_bus() {
  for attempt in $(seq 1 60); do
    if docker exec "$name" systemctl show-environment >/dev/null 2>&1; then return; fi
    sleep 1
  done
  return 1
}
wait_bus
docker exec "$name" dnf makecache
docker cp packaging/rpm/tests/. "$name:/tmp/rpm-tests"
docker cp "$initial" "$name:/tmp/initial.rpm"
docker cp "$upgrade" "$name:/tmp/upgrade.rpm"
docker exec "$name" bash /tmp/rpm-tests/lifecycle.sh install /tmp/initial.rpm
docker exec "$name" bash /tmp/rpm-tests/lifecycle.sh upgrade /tmp/upgrade.rpm
docker restart "$name"
wait_bus
docker exec "$name" bash /tmp/rpm-tests/lifecycle.sh verify
docker exec "$name" bash /tmp/rpm-tests/features.sh
docker exec "$name" bash /tmp/rpm-tests/lifecycle.sh remove
```

Set `RPM_TEST_CA` to an actual corporate CA path only when needed. Never bind
mount the host checkout or publish application ports. The runner saves output
and container inspection before cleanup; record RPM and image versions with the
artifact evidence.

- [ ] **Step 4: Add real TLS and backup/restore checks in features.sh.**

Use the same container/root/HEIMDALL_RPM_TEST guard as lifecycle.sh. Run these
after reboot verification and before removal:

```bash
#!/bin/bash
set -euo pipefail
[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
source /etc/heimdall-server/backend.env
query() { runuser -u postgres -- /usr/pgsql-18/bin/psql -v ON_ERROR_STOP=1 -At -d "$DATABASE_NAME" -c "$1"; }
mkdir -p /tmp/heimdall-recovery
heimdall-cli backup --output /tmp/heimdall-recovery
archive=$(find /tmp/heimdall-recovery -maxdepth 1 -name '*.tar.gz' -print -quit)
test -s "$archive"
tar -tzf "$archive" | grep -q '/database.sql$'
systemctl stop heimdall-server
query 'DROP TABLE rpm_test_sentinel'
heimdall-cli restore "$archive"
[[ $(query 'SELECT COUNT(*) FROM rpm_test_sentinel') == 1 ]]
systemctl restart heimdall-server

dnf install -y oracle-epel-release-el8
dnf install -y caddy
heimdall-cli setup --non-interactive --external-url https://rpm.example.test
systemctl is-active --quiet caddy heimdall-server
ca=/var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt
test -s "$ca"
curl --fail --silent --show-error --retry 10 --retry-connrefused \
  --cacert "$ca" --resolve rpm.example.test:443:127.0.0.1 \
  https://rpm.example.test/health/ready
```

This fixture is specifically Oracle Linux 8. Use its existing repository
selection in setup-build-deps.sh if installing oracle-epel-release-el8 alone does
not enable the Caddy repository. Record the actual repository used. Inspect restore's SQL exit/result and sentinel contents, not
only the CLI exit code. Keep the test inside its disposable host.

- [ ] **Step 5: Add a separate external-database acceptance fixture.**

Create a dedicated Docker network and PostgreSQL 18 container with synthetic
credentials; the systemd application host must have no PostgreSQL server package.
Install the candidate with `install_weak_deps=False`, then configure it with:

```bash
heimdall-cli setup --non-interactive --skip-tls \
  --db-host rpm-external-db --db-port 5432 --db-user postgres \
  --db-password Rpm-External-Fixture-2026 --db-name heimdall-server-production \
  --external-url http://localhost:3000
heimdall-cli setup --non-interactive --skip-tls
test ! -e /var/lib/pgsql/18/data/PG_VERSION
if rpm -q postgresql18-server; then exit 1; fi
curl --fail --silent --show-error http://127.0.0.1:3000/health/ready
```

The second call deliberately omits DB flags: it must reuse the saved remote
host. Create `packaging/rpm/tests/remote-database.sh` with this host runner:

```bash
#!/bin/bash
set -euo pipefail
platform=${1:?platform}
artifact=$(python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "${2:?rpm}")
network="heimdall-remote-$$"
database="heimdall-remote-db-$$"
app="heimdall-remote-app-$$"
image="heimdall-integration-test:${platform##*/}"
logdir="packaging/rpm/dist/integration/evidence/$app"
mkdir -p "$logdir"
exec > >(tee "$logdir/output.log") 2>&1
cleanup() {
  result=$?
  docker inspect "$app" "$database" > "$logdir/containers.json" 2>/dev/null || true
  if [[ $result -ne 0 ]]; then
    docker exec "$app" journalctl --no-pager -u heimdall-server -n 100 || true
    docker logs "$database" || true
  fi
  docker rm -f "$app" "$database" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
  exit "$result"
}
trap cleanup EXIT
docker network create "$network"
docker run -d --platform "$platform" --name "$database" --network "$network" --network-alias rpm-external-db \
  -e POSTGRES_PASSWORD=Rpm-External-Fixture-2026 \
  -e POSTGRES_DB=heimdall-server-production postgres:18
docker run -d --platform "$platform" --name "$app" --network "$network" \
  --runtime=runc --privileged --cgroupns=private --tmpfs /run --tmpfs /run/lock \
  -e container=docker -e HEIMDALL_RPM_TEST=1 "$image"
for attempt in $(seq 1 60); do
  if docker exec "$app" systemctl show-environment >/dev/null 2>&1 &&
     docker exec "$database" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
  [[ $attempt -lt 60 ]]
done
docker cp "$artifact" "$app:/tmp/candidate.rpm"
docker exec -i "$app" bash -s <<'HOST'
set -euo pipefail
dnf makecache
dnf install -y --setopt=install_weak_deps=False /tmp/candidate.rpm
cat > /etc/heimdall-server/backend.env <<'ENV'
NODE_ENV=production
ADMIN_EMAIL=rpm-test@example.invalid
ADMIN_PASSWORD=Rpm-Smoke-Only-2026!
LOCAL_LOGIN_DISABLED=false
ENV
heimdall-cli setup --non-interactive --skip-tls \
  --db-host rpm-external-db --db-port 5432 --db-user postgres \
  --db-password Rpm-External-Fixture-2026 --db-name heimdall-server-production \
  --external-url http://localhost:3000
heimdall-cli setup --non-interactive --skip-tls
test ! -e /var/lib/pgsql/18/data/PG_VERSION
if rpm -q postgresql18-server; then exit 1; fi
curl --fail --silent --show-error --retry 30 --retry-connrefused \
  --retry-delay 1 --retry-max-time 60 http://127.0.0.1:3000/health/ready
curl --fail --silent --show-error -H 'Content-Type: application/json' \
  --data '{"email":"rpm-test@example.invalid","password":"Rpm-Smoke-Only-2026!"}' \
  http://127.0.0.1:3000/authn/login -o /tmp/login.json
node -e 'const v=require("/tmp/login.json"); if(!v.accessToken || !v.userID) process.exit(1)'
rm /tmp/login.json
HOST
```

The test-host image is produced by the local lifecycle runner first. No host
ports or volumes are needed. Container inspection records the actual database
image ID, not only its test-image tag.

- [ ] **Step 6: Run both architectures and retain new acceptance evidence.**

```bash
bash packaging/rpm/tests/run-lifecycle.sh linux/arm64 \
  packaging/rpm/dist/integration/arm64-release1/RPMS/aarch64/heimdall-server-2.13.1-0.1.integration.el8.aarch64.rpm \
  packaging/rpm/dist/integration/arm64-release2/RPMS/aarch64/heimdall-server-2.13.1-0.2.integration.el8.aarch64.rpm
bash packaging/rpm/tests/run-lifecycle.sh linux/amd64 \
  packaging/rpm/dist/integration/amd64-release1/RPMS/x86_64/heimdall-server-2.13.1-0.1.integration.el8.x86_64.rpm \
  packaging/rpm/dist/integration/amd64-release2/RPMS/x86_64/heimdall-server-2.13.1-0.2.integration.el8.x86_64.rpm
```

Run remote-database.sh with each platform and its release-2 RPM. Record hashes,
application/CLI commits, OS/package versions, architecture/emulation, image
digests, each command's exit status, and preserved-state assertions. A failure
is a blocker with its diagnostic output; do not relax checks or label it passed.

- [ ] **Step 7: Commit tests and scriptlet cleanup after the targeted checks pass.**

```bash
git add packaging/rpm/tests/lifecycle.sh packaging/rpm/tests/features.sh packaging/rpm/tests/run-lifecycle.sh packaging/rpm/tests/remote-database.sh packaging/rpm/heimdall-server.spec
git commit -m "test(rpm): verify CLI setup and integrated package lifecycle"
```

## Task 6: Gate the combined package in CI and document its operating contract

**Files:** Modify `.github/workflows/build-rpm.yml`, `packaging/rpm/README.md`,
and `packaging/rpm/INSTALL.md`.

**Interfaces:** Retain the EL8/EL9 build/install matrix and existing release
publishing job. Accepted artifacts use the committed CLI pin. New OL8 lifecycle
jobs must succeed before the publishing job can run.

- [ ] **Step 1: Broaden build triggers to all package inputs.**

Add these paths to both existing pull-request/push path lists:

```yaml
- 'apps/**'
- 'libs/**'
- 'package.json'
- 'yarn.lock'
- 'lerna.json'
- 'tsconfig.json'
- 'postcss.config.js'
```

Remove the workflow's mutable `heimdall_cli_ref: main` override; Make reads the
committed pin. Remove the redundant distro `dnf install golang` step. Set Go's
known path for later steps after make deps, including `/opt/heimdall-build/go-1.25.8/bin`
if the helper installed it. Run `python3 packaging/rpm/tests/inputs.py` before
building. Keep candidate release values explicit in integration runs.

- [ ] **Step 2: Make install checks test the actual payload and prerequisites.**

Configure NodeSource 22 in the clean smoke-test container before installing the
RPM; the builder's repository configuration is not inherited. Run payload.sh
against the downloaded artifact and require CLI version/man pages. Remove the
blanket `|| true` from `systemd-analyze verify`; EL8-only unsupported directives
must be reported accurately and evaluated without weakening supported hardening.
Do not use `rpm -V || true` as proof of content correctness.

- [ ] **Step 3: Add a host-runner OL8 lifecycle matrix.**

Use native GitHub runners with Docker, not the unprivileged Rocky job container:

```yaml
lifecycle-ol8:
  strategy:
    fail-fast: false
    matrix:
      include:
        - {runner: ubuntu-latest, platform: linux/amd64, arch: x86_64, output: amd64}
        - {runner: ubuntu-24.04-arm, platform: linux/arm64, arch: aarch64, output: arm64}
  runs-on: ${{ matrix.runner }}
  permissions:
    contents: read
  steps:
    - uses: actions/checkout@v6
    - name: Build two OL8 candidate releases
      run: |
        docker build --platform '${{ matrix.platform }}' -f packaging/rpm/Dockerfile.ol8 --target artifacts --output type=local,dest=artifacts/first .
        docker build --platform '${{ matrix.platform }}' -f packaging/rpm/Dockerfile.ol8 --build-arg HEIMDALL_RELEASE=0.2.integration --target artifacts --output type=local,dest=artifacts/second .
    - name: Verify real package lifecycle
      run: |
        bash packaging/rpm/tests/run-lifecycle.sh '${{ matrix.platform }}' artifacts/first/RPMS/${{ matrix.arch }}/heimdall-server-2.13.1-0.1.integration.el8.${{ matrix.arch }}.rpm artifacts/second/RPMS/${{ matrix.arch }}/heimdall-server-2.13.1-0.2.integration.el8.${{ matrix.arch }}.rpm
        bash packaging/rpm/tests/remote-database.sh '${{ matrix.platform }}' artifacts/second/RPMS/${{ matrix.arch }}/heimdall-server-2.13.1-0.2.integration.el8.${{ matrix.arch }}.rpm
```

Add `lifecycle-ol8` to the publish job's `needs`. Before stable publication in a
future release milestone, parameterize these candidate filenames/releases from
the verified release metadata; this milestone must not publish integration
releases or claim the Rocky matrix artifacts received OL8 runtime certification.
Upload failure diagnostics with `if: always()` using the existing artifact
action. The host runners clean up their own named containers.

Add a fail-closed check after artifacts are downloaded in the publishing job and
before attestations/uploads. On its Ubuntu runner install the RPM query tool,
then reject any binary or source package whose release contains `integration`:

```bash
sudo apt-get update
sudo apt-get install -y rpm
while IFS= read -r -d '' artifact; do
  release=$(rpm -qp --qf '%{RELEASE}' "$artifact")
  case "$release" in
    *integration*) echo "Refusing to publish integration artifact: $artifact" >&2; exit 1 ;;
  esac
done < <(find rpms -name '*.rpm' -print0)
```

This check makes the candidate status enforceable; a release event cannot
accidentally upload packages carrying the development release number.

- [ ] **Step 4: Replace stale quick-start and upgrade instructions.**

Document these concrete contracts:

```bash
# Development candidate from committed integration HEAD
./packaging/rpm/setup-rpm-build-env.sh --dev --build

# Runtime: configure NodeSource 22 and the selected database repository first.
sudo dnf install ./heimdall-server-2.13.1-0.1.integration.el8.x86_64.rpm
sudo heimdall-cli setup --non-interactive --skip-tls

# Controlled upgrade: retain RESTART_ON_UPGRADE=false until migrations finish.
sudo heimdall-cli backup
sudo dnf upgrade ./heimdall-server-2.13.1-0.2.integration.el8.x86_64.rpm
sudo heimdall-cli setup --non-interactive --skip-tls
```

Explain local database prerequisites versus remote deployment, CLI pin/Go
requirements, filtered Docker edits versus committed Git builds, TLS options,
configuration preservation, removal recovery, and the exact acceptance results.
Remove documentation recommending `--no-gpg-check` for air-gapped builds or
referring to a nonexistent sibling CLI directory. Keep logger instructions
unchanged. State clearly that this candidate is not an upgrade from 2.14.0.

- [ ] **Step 5: Review, validate, and commit the integrated result.**

```bash
git diff --check
python3 packaging/rpm/tests/inputs.py
make -C packaging/rpm check-version
git diff --stat 6c69c3c2a8c015d4ab9c6fcea4cd9feab4723c72 HEAD
git diff 6c69c3c2a8c015d4ab9c6fcea4cd9feab4723c72 -- apps/backend/package.json
git add .github/workflows/build-rpm.yml packaging/rpm/README.md packaging/rpm/INSTALL.md
git commit -m "ci(rpm): gate integrated packaging on OL8 lifecycle acceptance"
```

Use the repository's workflow linter if available and inspect the resulting CI
run; a parsed YAML file alone does not prove a working matrix. Run the target
backend tests and production frontend/backend builds as regression checks. Do
not autofix unrelated application or logger code. Rebuild candidates after any
payload-changing fix and rerun the affected lifecycle checks.

```bash
yarn install --frozen-lockfile
yarn backend test:ci
yarn frontend test:ci
yarn frontend build
yarn backend build
```

## Acceptance and later application reconciliation

Completion requires the following evidence, with failing/unrun checks reported
as such: source/version fixture tests; configuration preservation in both paths;
CLI unit/man tests; binary payload and fresh SRPM rebuild; both OL8 architectures'
install/setup/login/rerun/upgrade/reboot/removal; remote DB, TLS, and recovery
fixtures; CI build/install results. The complete application tests must remain
green or have specifically identified baseline failures unrelated to this work.

This milestone does not merge the newer application history. Keep
`feat/rpm-build` at its recorded donor commit as the recoverable comparison
point. A separate application plan should reconcile its newer upstream commits
with the target's refactors, login and Tenable changes, establish the intended
release version, and test migrations from a real 2.14.0 database fixture. Until
then the integrated 2.13.1 candidate is a development artifact only.

## Self-review coverage

| Spec requirement | Plan coverage |
|---|---|
| R1 preserve richer base/install model | Starting point; Tasks 2–3 |
| R2 consistent source snapshot | Task 1; Docker context in Task 4 |
| R3 metadata/runtime/payload/SRPM | Tasks 1, 2, 4 |
| R4 preserve settings/credentials | CLI Task 2; main Task 3; lifecycle reruns |
| R5 migrations/service/topology | CLI Task 3; main Tasks 3 and 5 |
| R6 pinned CLI/man generator | CLI Task 1; main Task 2 |
| R7 local package lifecycle | Task 5 |
| R8 remote DB/TLS/recovery | Task 5 |
| R9 CI and publication gate | Task 6 |

No implementation has been performed by writing this plan. Execution requires
choosing inline execution or the subagent-driven workflow; the source branches
and existing checkout remain available throughout.

Plan drafting checks on September 22: the six source-checker fixture tests
extracted from this document passed in a temporary directory. Python and Bash
examples passed syntax checks, code fences are balanced, and both plans carry
the design's exact global constraints. The Go examples, RPM builds, and runtime
acceptance are implementation work and have not been run for this candidate.

Repository tracking note: `bd ready --json` currently fails because database
`heimdall2` is absent on the configured local Dolt server. This did not prevent
writing the requested plans. Recover the existing tracker before using it to
claim execution tasks; do not initialize a replacement database as part of RPM
integration.
