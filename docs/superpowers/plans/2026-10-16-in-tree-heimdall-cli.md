# In-tree Heimdall CLI and Independent CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the complete patched administration CLI into Heimdall's repository and add independent, isolated CLI CI and releases.

**Architecture:** Import a normal Go module at `apps/heimdall-cli` and build the server RPM's CLI from Source0. Give the CLI its own `VERSION` and scoped tags, reuse its Makefile for all binary builds, and isolate CLI releases from every existing server publisher.

**Tech Stack:** Go 1.25.8, GNU Make/tar, Python 3 standard library, Bash, GitHub Actions, GitHub CLI, existing RPM tests.

**Spec:** [In-tree Heimdall CLI design](../specs/2026-10-16-in-tree-heimdall-cli-design.md). Read it before executing. The user selected independent versions/releases; this document is a proposed implementation plan, not authorization to publish.

## Global Constraints

- Import commit `ea29e299ca0206519dd324c9543c74cba80c1963` plus the tracked RPM patch; preserve all patched behavior and tests.
- Module path: `github.com/mitre/heimdall2/apps/heimdall-cli`.
- CLI version file: `apps/heimdall-cli/VERSION`; initial value: `v0.9.0`.
- CLI release tags: `apps/heimdall-cli/vX.Y.Z`; server release tags retain `vX.Y.Z`.
- Go toolchain: `1.25.8` with `GOTOOLCHAIN=local`; dependency upgrades are separate unless a demonstrated blocking vulnerability requires a reviewed fix.
- Supported release targets: `linux/amd64` and `linux/arm64`; distributable binaries use `CGO_ENABLED=0`.
- Preserve the existing EL8/EL9/EL10 × x86_64/aarch64 RPM build, installation, and disconnected lifecycle checks.
- Preserve the existing integration-RPM publication rejection and temporary-signing restrictions.
- Preserve unrelated local changes, including the untracked root setup-prompts patch.
- CI pull requests use read-only permissions and no publishing credentials.
- Every CLI release validates its exact tag, CLI version, commit, binary metadata, archive contents, and checksums before upload.
- CLI releases must not trigger server publishers, alter the server release draft, or replace the server's latest-release designation.
- Release automation creates a populated draft; a maintainer publishes it after review. Manual workflow runs produce artifacts without creating or changing releases.

---

## Starting state and execution order

The inspected HEAD was `2c32374c1dadc5612ae3097c9d45317e745944a0` on `feat/rpm-packaging`. Recheck differences before execution. The working tree already contained unrelated modified/untracked documents and `heimdall-cli-setup-prompts.patch`. Do not stage them. Use `using-git-worktrees` at implementation time if isolation is needed; use the current feature branch as the starting ref so the RPM work is present.

The import source is a **commit export plus the tracked patch**, not a cached working directory. Inspection found a dirty cached CLI checkout; it is suitable only as a Git object source. Keep a pristine patched export in a temporary directory for parity checks throughout Task 1.

Run Tasks 1–6 in order. Task 5 adds release-routing coverage to Task 4's workflow, and Task 6 consumes both. Do not create a release tag or publish while implementing the plan.

## File map

| Files | Responsibility |
| --- | --- |
| `apps/heimdall-cli/{cmd,internal,go.mod,go.sum,LICENSE.md}` | Imported application, tests, dependencies, and license. |
| `apps/heimdall-cli/{VERSION,Makefile,UPSTREAM.md,COMPAT.md}` | Independent version, common build commands, origin, tested server compatibility. |
| `apps/heimdall-cli/{README.md,CONTRIBUTING.md,SECURITY.md,docs/testing.md,.gitignore}` | Current development/release instructions and generated-file exclusions. |
| `apps/heimdall-cli/scripts/check-release.py` and `tests/test_release.py` | Exact CLI tag/version/commit validation and isolated Git fixtures. |
| `packaging/rpm/{Makefile,BUILD.md,heimdall-server.spec}` | Extract CLI from Source0, use CLI version, retain installed payload layout. |
| `packaging/rpm/tests/{cli-acquisition.py,inputs.py}` | Snapshot, provenance, cross-build, failure-cleanup, and source-mode regressions. |
| `.github/workflows/heimdall-cli-ci.yml` | Reusable native CI for pull requests, master, and release tags. |
| `.github/workflows/heimdall-cli-release.yml` | Validate tag, build archives, verify them, attest, populate CLI draft. |
| Five existing release workflows, `.github/release-drafter.yml`, `packaging/rpm/tests/release-routing.py` | Keep independent release streams isolated. |
| `.github/dependabot.yml` and root `README.md` | Go dependency maintenance and discovery. |

Delete `packaging/rpm/heimdall-cli.repo`, `heimdall-cli.ref`, and `heimdall-cli-nginx.patch` only after parity is established. Retire the imported `.goreleaser.yaml`, `.rpmlintrc`, and Makefile targets that solely invoke the retired release tool. Preserve historical changelogs and plans as history.

## Task 1: Import the effective CLI without changing behavior

**Files:** Create the complete `apps/heimdall-cli` source tree and `UPSTREAM.md`. Update its module/import paths. Retain all imported tests.

**Interfaces:**
- Consumes: the external commit and current tracked RPM patch.
- Produces: module `github.com/mitre/heimdall2/apps/heimdall-cli`; entry points `./cmd/heimdall-cli` and `./cmd/gen-manpages`; existing `internal/version.{Version,Commit,Date}` string variables.

- [ ] **Step 1: Establish a clean reference export and verify provenance.**

Run from repository root:

~~~bash
cli_import_dir=$(mktemp -d /tmp/heimdall-cli-import.XXXXXX)
git clone --no-checkout https://github.com/seanlongcc/heimdall-cli.git "$cli_import_dir/upstream"
git -C "$cli_import_dir/upstream" cat-file -e ea29e299ca0206519dd324c9543c74cba80c1963^{commit}
mkdir "$cli_import_dir/reference"
git -C "$cli_import_dir/upstream" archive ea29e299ca0206519dd324c9543c74cba80c1963 |
  tar -xf - -C "$cli_import_dir/reference"
python3 - <<'PY'
import hashlib
from pathlib import Path
p = Path("packaging/rpm/heimdall-cli-nginx.patch")
assert hashlib.sha256(p.read_bytes()).hexdigest() == "29993da844f52c65fb7334a3bf7b1d4a3408efbc156ffba461f43c25fdc968f1"
PY
git -C "$cli_import_dir/reference" apply --check "$PWD/packaging/rpm/heimdall-cli-nginx.patch"
git -C "$cli_import_dir/reference" apply "$PWD/packaging/rpm/heimdall-cli-nginx.patch"
~~~

If the tracked patch changed after planning, reconcile its new content and record its actual digest before importing. Do not silently use an older patch. Never apply the untracked root prompt patch: it is already in the pin.

- [ ] **Step 2: Run the import contract before copying.**

~~~bash
test -f apps/heimdall-cli/go.mod
~~~

Expected: failure because the module does not exist. Then copy the effective tree:

~~~bash
mkdir -p apps/heimdall-cli
cp -R "$cli_import_dir/reference/." apps/heimdall-cli/
diff -qr "$cli_import_dir/reference" apps/heimdall-cli
~~~

Expected: no differences, including dotfiles, license, and tests. Record the successful comparison before adapting files.

- [ ] **Step 3: Rename only the module and its current references.**

~~~python
from pathlib import Path
root = Path("apps/heimdall-cli")
old = "github.com/mitre/heimdall-cli"
new = "github.com/mitre/heimdall2/apps/heimdall-cli"
for name in ("go.mod", "Makefile", ".goreleaser.yaml",
             "cmd/heimdall-cli/main.go", "cmd/gen-manpages/main.go",
             "internal/cmd/root.go", "internal/cmd/config_types.go"):
    path = root / name
    path.write_text(path.read_text().replace(old, new))
~~~

Keep `go.sum` and dependency requirements unchanged. Add `UPSTREAM.md` with the source URL, full pin, patch SHA-256, import date, 84 upstream files plus eight patch-added files, Apache license attribution, and the prompt patch's already-merged status. Explain that these URLs are attribution and are not future build inputs.

- [ ] **Step 4: Verify source parity after normalizing the intentional path changes.**

~~~bash
python3 - "$cli_import_dir/reference" <<'PY'
from pathlib import Path
import sys
before, after = Path(sys.argv[1]), Path("apps/heimdall-cli")
for source in before.rglob("*"):
    if source.is_file():
        target = after / source.relative_to(before)
        actual = target.read_bytes().replace(
            b"github.com/mitre/heimdall2/apps/heimdall-cli",
            b"github.com/mitre/heimdall-cli")
        assert actual == source.read_bytes(), str(target)
assert len(list(after.rglob("*.go"))) == 79
assert len(list(after.rglob("*_test.go"))) == 47
PY
(cd apps/heimdall-cli && GOTOOLCHAIN=local go test ./...)
(cd apps/heimdall-cli && GOTOOLCHAIN=local go test -tags functional ./internal/cmd/)
~~~

Expected: parity and both suites pass. Preserve the 47 tests rather than replacing behavior coverage with import-count assertions.

- [ ] **Step 5: Commit the import.**

~~~bash
git add apps/heimdall-cli
git commit -m "feat(cli): import patched Heimdall administration CLI"
~~~

## Task 2: Establish independent versioning and a shared build contract

**Files:** Create `apps/heimdall-cli/VERSION`, `scripts/check-release.py`, `tests/test_release.py`, and `COMPAT.md`. Modify its `Makefile`, `internal/version/version.go`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/testing.md`, and `.gitignore`. Remove `.goreleaser.yaml` and `.rpmlintrc`.

**Interfaces:**
- Consumes: Task 1 module and entry points.
- Produces: `make -C apps/heimdall-cli build OUTPUT=/absolute/path GOOS=linux GOARCH=amd64 COMMIT=<revision> DATE=<ISO-date>`; `make -C apps/heimdall-cli man`; `python3 apps/heimdall-cli/scripts/check-release.py <tag>` prints version without `v` on success.
- `COMMIT` defaults to `development` and `DATE` to `unknown`. Callers set provenance; source builds never guess a parent repository's identity.

- [ ] **Step 1: Add the release-validation regression fixture.**

Save this as `apps/heimdall-cli/tests/test_release.py`:

~~~python
import pathlib
import shutil
import subprocess
import tempfile
import unittest

CHECK = pathlib.Path(__file__).resolve().parents[1] / "scripts/check-release.py"

class ReleaseTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name)
        self.cli = self.root / "apps/heimdall-cli"
        (self.cli / "scripts").mkdir(parents=True)
        shutil.copy2(CHECK, self.cli / "scripts/check-release.py")
        (self.cli / "VERSION").write_text("v0.9.0\n")
        (self.root / "VERSION").write_text("v2.14.0\n")
        self.git("init", "-q")
        self.git("add", ".")
        self.git("-c", "user.name=Test", "-c", "user.email=test@example.invalid",
                 "commit", "-qm", "fixture")
        self.git("tag", "apps/heimdall-cli/v0.9.0")

    def git(self, *args):
        return subprocess.check_output(
            ["git", "-C", str(self.root), *args], text=True).strip()

    def check(self, tag):
        return subprocess.run(
            ["python3", str(self.cli / "scripts/check-release.py"), tag],
            capture_output=True, text=True)

    def test_independent_version(self):
        result = self.check("apps/heimdall-cli/v0.9.0")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, "0.9.0\n")

    def test_rejects_server_or_mismatched_tags(self):
        for tag in ("v2.14.0", "apps/heimdall-cli/v0.9.1",
                    "apps/heimdall-cli/v00.9.0", "main"):
            self.assertNotEqual(self.check(tag).returncode, 0, tag)

    def test_rejects_wrong_commit(self):
        (self.root / "another").write_text("new commit")
        self.git("add", ".")
        self.git("-c", "user.name=Test", "-c", "user.email=test@example.invalid",
                 "commit", "-qm", "after tag")
        self.assertNotEqual(self.check("apps/heimdall-cli/v0.9.0").returncode, 0)

    def test_rejects_dirty_cli(self):
        (self.cli / "untracked.go").write_text("package main\n")
        self.assertNotEqual(self.check("apps/heimdall-cli/v0.9.0").returncode, 0)

    def test_rejects_invalid_version_file(self):
        (self.cli / "VERSION").write_text("v0.9.0\nv0.9.1\n")
        self.assertNotEqual(self.check("apps/heimdall-cli/v0.9.0").returncode, 0)

if __name__ == "__main__":
    unittest.main()
~~~

Run `python3 apps/heimdall-cli/tests/test_release.py`. Expected: failure because the validator is missing.

- [ ] **Step 2: Add the canonical version and validator.**

Write `v0.9.0` followed by a newline to `apps/heimdall-cli/VERSION`. Save:

~~~python
#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

cli = Path(__file__).resolve().parents[1]
repo = cli.parents[1]
if len(sys.argv) != 2:
    sys.exit("Usage: check-release.py apps/heimdall-cli/vX.Y.Z")
version = (cli / "VERSION").read_text()
if not re.fullmatch(r"v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\n", version):
    sys.exit("CLI VERSION must contain one canonical vX.Y.Z line")
version = version.strip()
tag = sys.argv[1]
if tag != "apps/heimdall-cli/" + version:
    sys.exit("CLI release tag does not match CLI VERSION")
def git(*args):
    return subprocess.check_output(
        ["git", "-C", str(repo), *args], text=True,
        stderr=subprocess.PIPE).strip()
try:
    if git("rev-parse", "--verify", "refs/tags/" + tag + "^{commit}") != git("rev-parse", "HEAD"):
        sys.exit("CLI release tag does not point at HEAD")
    if git("status", "--porcelain", "--untracked-files=all", "--", "apps/heimdall-cli"):
        sys.exit("CLI release source is dirty")
except subprocess.CalledProcessError as error:
    sys.exit("Cannot validate CLI tag: " + error.stderr.strip())
print(version[1:])
~~~

This first release contract accepts stable `vX.Y.Z` tags. Do not silently add prerelease/versioning policy while implementing it.

- [ ] **Step 3: Adapt the imported Makefile.**

Replace its version/linker definitions and `build` target with:

~~~make
MODULE := github.com/mitre/heimdall2/apps/heimdall-cli
BIN := heimdall-cli
override VERSION := $(shell sed 's/^v//' VERSION)
COMMIT ?= development
DATE ?= unknown
OUTPUT ?= $(BIN)
LDFLAGS := -s -w \
	-X $(MODULE)/internal/version.Version=$(VERSION) \
	-X $(MODULE)/internal/version.Commit=$(COMMIT) \
	-X $(MODULE)/internal/version.Date=$(DATE)

.PHONY: check-version
check-version:
	@test "$$(wc -l < VERSION)" -eq 1
	@LC_ALL=C grep -Eq '^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$$' VERSION

build: check-version
	@mkdir -p "$$(dirname "$(OUTPUT)")"
	CGO_ENABLED=0 go build -mod=readonly -trimpath -buildvcs=false \
	  -ldflags "$(LDFLAGS)" -o "$(OUTPUT)" ./cmd/heimdall-cli
~~~

Keep existing test, functional, integration, e2e, coverage, lint, man, completion, and clean targets. Replace the alternate build recipes with:

~~~make
build-linux-amd64:
	$(MAKE) build GOOS=linux GOARCH=amd64 OUTPUT=$(BIN)-linux-amd64

build-linux-arm64:
	$(MAKE) build GOOS=linux GOARCH=arm64 OUTPUT=$(BIN)-linux-arm64

build-fips: check-version
	GOEXPERIMENT=boringcrypto CGO_ENABLED=1 go build -mod=readonly \
	  -trimpath -buildvcs=false -ldflags "$(LDFLAGS)" \
	  -o $(BIN)-fips ./cmd/heimdall-cli
~~~

The existing optional FIPS target remains outside the release matrix; retaining it is not a new FIPS certification promise.

Remove `snapshot` and `release-prep` and their .PHONY entries; remove the unused GoReleaser and nFPM configurations. Set the unlinked `internal/version.Version` default to `"dev"` so future version bumps do not leave a stale hardcoded release. Keep `Commit="none"` and `Date="unknown"` for direct `go run`.

Add `__pycache__/` to the module's ignore file; keep existing binary, manual, completion, coverage, and dist exclusions.

- [ ] **Step 4: Verify both build paths and document the version contract.**

~~~bash
python3 apps/heimdall-cli/tests/test_release.py
cli_build_dir=$(mktemp -d /tmp/heimdall-cli-build.XXXXXX)
make -C apps/heimdall-cli build OUTPUT="$cli_build_dir/heimdall-cli" \
  COMMIT=fixture-commit DATE=2026-10-16T00:00:00Z VERSION=99.99.99
"$cli_build_dir/heimdall-cli" --version
~~~

On a native development host, expected output contains `0.9.0 (commit fixture-commit, built 2026-10-16T00:00:00Z)`, never `2.14.0` or `99.99.99`. Cross-target checks belong in Task 3 and Linux CI.

In the CLI README replace external pin/go-install instructions with module-local `make build`, independent `VERSION`, and scoped tags. Update active repository/security links to `mitre/heimdall2`. Correct the Windows-support claim in `docs/testing.md`: Linux is the supported runtime; macOS can be a development host. Explain Docker/privileged integration prerequisites and optional OrbStack e2e tests.

Create `COMPAT.md` stating that CLI `0.9.0` and server `2.14.0` are the initial pair to validate on EL8/9/10 × x86_64/aarch64. Mark this as pending until the RPM matrix passes. Standalone archives do not upgrade an RPM-owned executable automatically.

- [ ] **Step 5: Commit.**

~~~bash
git add apps/heimdall-cli
git commit -m "feat(cli): add independent version and reproducible build inputs"
~~~

## Task 3: Build the RPM CLI and manuals from the in-tree source snapshot

**Files:** Modify `packaging/rpm/Makefile`, `tests/cli-acquisition.py`, `tests/inputs.py`, `BUILD.md`, `heimdall-server.spec`, and `.github/workflows/build-rpm.yml`. Delete the three external CLI input files. Add a CLI entry to root `README.md`.

**Interfaces:**
- Consumes: Task 2's Makefile and version file.
- Produces: unchanged `SOURCES/heimdall-cli` and `SOURCES/heimdall-cli-man.tar.gz`; extracted module at `TOPDIR/heimdall-cli-build`.
- `SOURCE_MODE=workspace` provenance is `source.<SHA-256 of Source0>` / `unknown`; `head` and server `release` use the full Heimdall commit / commit date.

- [ ] **Step 1: Convert the acquisition fixture to an in-tree module and demonstrate failure.**

In `cli-acquisition.py` retain the existing `run` helper, temporary directories, GNU tar selection, native/foreign architecture selection, wrapper tests, and CLI/man fixture source. Replace the external `upstream` directory with:

~~~python
upstream = source / "apps/heimdall-cli"
for name in ("cmd/heimdall-cli", "cmd/gen-manpages", "internal/version"):
    (upstream / name).mkdir(parents=True, exist_ok=True)
(upstream / "VERSION").write_text("v0.9.0\n")
shutil.copy2(str(RPM.parents[1] / "apps/heimdall-cli/Makefile"), str(upstream / "Makefile"))
(upstream / "go.mod").write_text(
    "module github.com/mitre/heimdall2/apps/heimdall-cli\n\ngo 1.20\n")
~~~

Change the fixture main's import to the new module path. Initialize/commit Git in `source`, with the existing fixed author/committer dates. Remove external clone/pin/patch setup and their obsolete rejection checks, including the temporary generator edit that constructed the old patch. Change `reject` to invoke `cli-build-src`. The unchanged generator now emits `fixture manual `; update its text expectation from `patched manual ` accordingly.

Immediately after `make('heimdall-cli', 'man')` succeeds, assert:

~~~python
assert (topdir / "heimdall-cli-build/go.mod").read_text() == (upstream / "go.mod").read_text()
assert not (topdir / "heimdall-cli-src").exists()
binary = topdir / "SOURCES/heimdall-cli"
archive = topdir / "SOURCES/heimdall2-2.13.1.tar.gz"
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
assert b"0.9.0\x00" in binary.read_bytes()
assert ("source." + digest).encode() + b"\x00" in binary.read_bytes()
assert b"unknown\x00" in binary.read_bytes()
with tarfile.open(str(archive)) as packed:
    assert "heimdall2-2.13.1/apps/heimdall-cli/go.mod" in packed.getnames()
metadata = run("go", "version", "-m", str(binary))
assert "GOOS=linux\n" in metadata
assert "GOARCH=" + target_arch + "\n" in metadata
assert "vcs.revision=" not in metadata
~~~

Run `python3 packaging/rpm/tests/cli-acquisition.py`. Expected: failure from the current external-acquisition Makefile.

- [ ] **Step 2: Replace external acquisition with Source0 extraction and the shared build.**

Remove `cli-src` from .PHONY and remove its recipe, `CLI_DIR`, fetch/pin/patch logic, and external linker-symbol recipe. Install:

~~~make
override CLI_BUILD_DIR := $(TOPDIR)/heimdall-cli-build

cli-build-src: sources
	rm -rf "$(CLI_BUILD_DIR)"
	mkdir -p "$(CLI_BUILD_DIR)"
	tar -xzf "$(TOPDIR)/SOURCES/heimdall2-$(VERSION).tar.gz" \
	  -C "$(CLI_BUILD_DIR)" --strip-components=3 \
	  "heimdall2-$(VERSION)/apps/heimdall-cli"
	test -s "$(CLI_BUILD_DIR)/go.mod"
	test -s "$(CLI_BUILD_DIR)/VERSION"

heimdall-cli: cli-build-src
	@mkdir -p "$(TOPDIR)/SOURCES"
	@set -eu; \
	output=$$(cd "$(TOPDIR)/SOURCES" && pwd); \
	rm -f "$$output/heimdall-cli"; \
	if [ "$(SOURCE_MODE)" = workspace ]; then \
	  digest=$$(python3 -c 'import hashlib,sys; print(hashlib.sha256(open(sys.argv[1], "rb").read()).hexdigest())' \
	    "$$output/heimdall2-$(VERSION).tar.gz"); \
	  commit="source.$$digest"; date=unknown; \
	else \
	  commit=$$(git -C ../.. rev-parse HEAD); \
	  date=$$(git -C ../.. show -s --format=%cI HEAD); \
	fi; \
	$(MAKE) -C "$(CLI_BUILD_DIR)" build GOOS=linux GOARCH="$(GOARCH)" \
	  OUTPUT="$$output/heimdall-cli" COMMIT="$$commit" DATE="$$date"
~~~

Keep `sources: check-source` so validation precedes extraction/deletion, including parallel Make runs. Keep the current `man` recipe's stale-directory/archive removal, native host architecture, root/setup page assertions, and Source22 archive.

Use `go run -mod=readonly ./cmd/gen-manpages` in the man recipe. Preserve the old `heimdall-cli-src` cleanup allowlist entry so users can clean pre-migration build directories.

- [ ] **Step 3: Finish behavioral regressions for source selection and cleanup.**

Use the fixture's existing `make` helper to add these checks before its wrapper-only section:

~~~python
# HEAD mode excludes ignored working-tree Go sources.
run("git", "-C", str(source), "add", ".")
run("git", "-C", str(source), "-c", "user.name=RPM Test",
    "-c", "user.email=rpm-test@example.invalid", "commit", "-qm", "In-tree CLI",
    env=commit_env)
pin = run("git", "-C", str(source), "rev-parse", "HEAD")
(source / ".git/info/exclude").write_text("apps/heimdall-cli/ignored.go\n")
(upstream / "ignored.go").write_text("this must never compile\n")
result = make("heimdall-cli", "man", "SOURCE_MODE=head")
assert result.returncode == 0, result.stdout + result.stderr
assert not (topdir / "heimdall-cli-build/ignored.go").exists()
assert pin.encode() + b"\x00" in binary.read_bytes()
(upstream / "ignored.go").unlink()

# Untracked input is accepted in workspace mode and rejected in HEAD mode.
(upstream / "new.go").write_text("package main\n")
result = make("cli-build-src", "SOURCE_MODE=head")
assert result.returncode != 0 and "Uncommitted build inputs" in result.stderr
result = make("cli-build-src", "SOURCE_MODE=workspace")
assert result.returncode == 0, result.stdout + result.stderr
assert (topdir / "heimdall-cli-build/new.go").exists()
(upstream / "new.go").unlink()

# Server release mode uses the server tag; the bundled CLI retains version 0.9.0.
result = make("cli-build-src", "SOURCE_MODE=release")
assert result.returncode != 0
run("git", "-C", str(source), "tag", "v2.13.1")
result = make("heimdall-cli", "man", "SOURCE_MODE=release")
assert result.returncode == 0, result.stdout + result.stderr
assert b"0.9.0\x00" in binary.read_bytes()

# A downloaded source archive needs no Git repository.
shutil.rmtree(str(source / ".git"))
result = make("heimdall-cli", "man", "SOURCE_MODE=workspace")
assert result.returncode == 0, result.stdout + result.stderr
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
assert ("source." + digest).encode() + b"\x00" in binary.read_bytes()
~~~

Preserve the existing foreign-target/native-manual check, spaced and relative TOPDIR checks, identical binary rebuild assertion, stale-man removal, clean protection, and wrapper argument/PATH cases. Replace its old generator-failure section with:

~~~python
generator = upstream / "cmd/gen-manpages/main.go"
generator.write_text('package main\nimport "os"\nfunc main() { os.Exit(1) }\n')
result = make("man", "SOURCE_MODE=workspace")
assert result.returncode != 0
assert not (topdir / "SOURCES/heimdall-cli-man.tar.gz").exists()
main = upstream / "cmd/heimdall-cli/main.go"
main.write_text("not valid Go source\n")
result = make("heimdall-cli", "SOURCE_MODE=workspace")
assert result.returncode != 0
assert not (topdir / "SOURCES/heimdall-cli").exists()
~~~

Add `apps/heimdall-cli/new.go` to `inputs.py`'s existing dirty-input path tuple. Run these failure cases after the successful mode checks and before clean/wrapper checks.

- [ ] **Step 4: Update RPM CI, docs, and remove obsolete inputs.**

Keep `go test ./...` in `TOPDIR/heimdall-cli-build`: it now tests the extracted packaged source. Replace the workflow's repository/ref printing with:

~~~bash
git rev-parse HEAD
cat apps/heimdall-cli/VERSION
~~~

In the installed CLI assertion step replace the server-version/external-pin/patch-hash assertions with:

~~~bash
cli_version=$(heimdall-cli --version)
version=$(sed 's/^v//' apps/heimdall-cli/VERSION)
commit=$(git rev-parse HEAD)
date=$(git show -s --format=%cI HEAD)
[[ "$cli_version" == *"$version (commit $commit, built $date)"* ]]
~~~

Root `VERSION` still governs server package checks. Keep the existing `apps/**` triggers and every RPM build/smoke/lifecycle job.

Change the spec's pinned-CLI manual comment to in-tree CLI. Replace `BUILD.md`'s pin/patch section with Source0 extraction, independent CLI version, both provenance formats, and build-versus-install network requirements. Add root README links to `apps/heimdall-cli/README.md` and `COMPAT.md`.

~~~bash
git rm packaging/rpm/heimdall-cli.repo packaging/rpm/heimdall-cli.ref \
  packaging/rpm/heimdall-cli-nginx.patch
python3 packaging/rpm/tests/inputs.py
python3 packaging/rpm/tests/cli-acquisition.py
python3 packaging/rpm/tests/version-srpm.py
~~~

Expected: all pass on the existing supported build environment. `version-srpm.py` needs RPM tooling; use the existing Linux builder when absent locally. Scan active build configuration for obsolete external acquisition:

~~~bash
rg -n 'heimdall-cli\.(repo|ref)|heimdall-cli-nginx\.patch|HEIMDALL_CLI_(REPO|REF)' \
  packaging .github apps/heimdall-cli
~~~

Expected: only historical attribution in `UPSTREAM.md`, if any. Historical plans need not be rewritten.

- [ ] **Step 5: Commit.**

~~~bash
git add packaging/rpm .github/workflows/build-rpm.yml README.md
git commit -m "build(rpm): compile bundled CLI from the Heimdall source archive"
~~~

## Task 4: Add reusable native Go CI and dependency updates

**Files:** Create `.github/workflows/heimdall-cli-ci.yml`. Modify `.github/dependabot.yml` and CLI `docs/testing.md`.

**Interfaces:**
- Consumes: the module, release-validator tests, and updated RPM source fixtures.
- Produces: reusable workflow input `ref: string` (empty for normal CI; exact commit for release validation), native checks on both architectures, and coverage artifacts.
- Required check names remain stable and run on every pull request. Configure those names in repository rules after their first successful run; do not silently replace existing required checks.

- [ ] **Step 1: Create this workflow.**

The action pins below were read from `mitre/hdf-libs` commit `84371a77aa7ed12a313705c545b2ae908b731343`. Keep pins and version comments together.

~~~yaml
name: Heimdall CLI CI
on:
  pull_request:
  push:
    branches: [master]
  workflow_call:
    inputs:
      ref:
        type: string
        required: false
        default: ""
permissions:
  contents: read
concurrency:
  group: cli-ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
env:
  GOTOOLCHAIN: local
jobs:
  test:
    name: CLI / ${{ matrix.arch }}
    runs-on: ${{ matrix.runner }}
    strategy:
      fail-fast: false
      matrix:
        include:
          - {arch: amd64, runner: ubuntu-24.04}
          - {arch: arm64, runner: ubuntu-24.04-arm}
    defaults:
      run:
        working-directory: apps/heimdall-cli
        shell: bash
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: ${{ inputs.ref || github.ref }}
          persist-credentials: false
      - uses: actions/setup-go@b7ad1dad31e06c5925ef5d2fc7ad053ef454303e # v7.0.0
        with:
          go-version-file: apps/heimdall-cli/go.mod
          cache-dependency-path: apps/heimdall-cli/go.sum
          cache: ${{ inputs.ref == '' }}
      - name: Verify toolchain, formatting and module metadata
        run: |
          test "$(go env GOVERSION)" = go1.25.8
          test -z "$(gofmt -l .)"
          go mod download
          go mod verify
          go mod tidy -diff
          go vet ./...
      - name: Run native unit and functional tests
        run: |
          go test -race -count=1 -coverprofile=coverage.out ./...
          go test -count=1 -tags functional ./internal/cmd/
          python3 tests/test_release.py
      - name: Check reachable dependency vulnerabilities
        if: matrix.arch == 'amd64'
        run: |
          GOBIN="$RUNNER_TEMP/cli-tools" go install golang.org/x/vuln/cmd/govulncheck@v1.1.4
          "$RUNNER_TEMP/cli-tools/govulncheck" ./...
      - name: Run packaging source and release-isolation fixtures
        if: matrix.arch == 'amd64'
        working-directory: .
        run: |
          python3 packaging/rpm/tests/inputs.py
          python3 packaging/rpm/tests/cli-acquisition.py
      - uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: heimdall-cli-coverage-${{ matrix.arch }}
          path: apps/heimdall-cli/coverage.out
          if-no-files-found: error
          retention-days: 7
~~~

Task 5 adds the release-routing test command to the packaging-fixture step. Race tests require the runner's normal CGO support; do not set `CGO_ENABLED=0` globally.

- [ ] **Step 2: Add Go and GitHub Actions dependency update entries.**

Append to the existing `updates` list, preserving npm/bundler settings:

~~~yaml
- package-ecosystem: gomod
  directory: /apps/heimdall-cli
  schedule:
    interval: weekly
- package-ecosystem: github-actions
  directory: /
  schedule:
    interval: weekly
~~~

Document the local equivalents of CI commands in `docs/testing.md`, including that the privileged integration/e2e suites are separate and the existing RPM workflow supplies lifecycle coverage.

- [ ] **Step 3: Validate the configuration and command sequence.**

~~~bash
actionlint .github/workflows/heimdall-cli-ci.yml
(cd apps/heimdall-cli && go mod tidy -diff && go vet ./...)
(cd apps/heimdall-cli && go test -race -count=1 -coverprofile=coverage.out ./...)
(cd apps/heimdall-cli && go test -count=1 -tags functional ./internal/cmd/)
~~~

Use a Linux runner/container for native Linux evidence. Confirm both Actions matrix jobs pass on the implementation PR, including a fork-style read-only token. Do not turn a failing security/test command into a warning to get a green result. Record an inherited blocker with its exact finding before deciding on a narrowly scoped fix.

- [ ] **Step 4: Commit.**

~~~bash
git add .github/workflows/heimdall-cli-ci.yml .github/dependabot.yml \
  apps/heimdall-cli/docs/testing.md
git commit -m "ci(cli): add native tests and dependency vulnerability checks"
~~~

## Task 5: Isolate CLI releases from server publication and drafts

**Files:** Modify `.github/workflows/push-to-npm.yml`, `release-server-to-docker.yml`, `release-lite-to-docker.yml`, `gh-pages.yml`, `build-rpm.yml`, `heimdall-cli-ci.yml`, and `.github/release-drafter.yml`. Create `packaging/rpm/tests/release-routing.py`.

**Interfaces:**
- Consumes: distinct root and `apps/heimdall-cli/` tag namespaces.
- Produces: release-event routing that permits current server events/manual dispatches and rejects CLI releases at every server publisher.

- [ ] **Step 1: Add a behavior test against the actual workflow job conditions.**

Save:

~~~python
#!/usr/bin/env python3
from pathlib import Path
import re
from types import SimpleNamespace

root = Path(__file__).resolve().parents[3]
workflows = root / ".github/workflows"
jobs = {
    "push-to-npm.yml": ("build-deploy", True),
    "release-server-to-docker.yml": ("docker", True),
    "release-lite-to-docker.yml": ("docker", True),
    "gh-pages.yml": ("build-deploy", False),
    "build-rpm.yml": ("build", True),
}
actual = {p.name for p in workflows.glob("*.yml")
          if re.search(r"^  release:\s*$", p.read_text(), re.M)}
assert actual == set(jobs), "Review guards for changed release consumers: " + repr(actual)

def condition(filename, job):
    source = (workflows / filename).read_text()
    block = re.search(r"^  " + re.escape(job) +
                      r":\n(.*?)(?=^  [A-Za-z_][A-Za-z0-9_-]*:|\Z)",
                      source, re.M | re.S)
    assert block, (filename, job)
    guard = re.search(r"^    if: (.+)$", block.group(1), re.M)
    assert guard, (filename, job, "missing release guard")
    return guard.group(1)

def accepts(expression, event, tag):
    github = SimpleNamespace(event_name=event,
        event=SimpleNamespace(release=SimpleNamespace(tag_name=tag)))
    # Evaluate this repository's simple job guards against synthetic event data.
    return bool(eval(expression.replace("&&", " and ").replace("||", " or "),
                     {"__builtins__": {}},
                     {"github": github, "startsWith": str.startswith}))

for filename, (job, manual) in jobs.items():
    expr = condition(filename, job)
    assert accepts(expr, "release", "v2.14.0"), filename
    assert not accepts(expr, "release", "apps/heimdall-cli/v0.9.0"), filename
    assert not accepts(expr, "release", "another-component/v1.0.0"), filename
    if manual:
        assert accepts(expr, "workflow_dispatch", ""), filename
for event in ("push", "pull_request"):
    assert accepts(condition("build-rpm.yml", "build"), event, "")
publish = condition("build-rpm.yml", "publish")
assert accepts(publish, "release", "v2.14.0")
assert not accepts(publish, "release", "apps/heimdall-cli/v0.9.0")
assert not accepts(publish, "workflow_dispatch", "")
print("Server publication is isolated from CLI release events")
~~~

Run `python3 packaging/rpm/tests/release-routing.py`. Expected: failure on a missing release guard.

- [ ] **Step 2: Add job-level guards before any checkout/login/publication steps.**

For npm `build-deploy`, both Docker `docker` jobs, and RPM `build`:

~~~yaml
if: github.event_name != 'release' || startsWith(github.event.release.tag_name, 'v')
~~~

For GitHub Pages `build-deploy`:

~~~yaml
if: startsWith(github.event.release.tag_name, 'v')
~~~

For RPM `publish`, replace its current release-only condition:

~~~yaml
if: github.event_name == 'release' && startsWith(github.event.release.tag_name, 'v')
~~~

RPM smoke/lifecycle jobs retain their dependency on `build` and skip when it skips. Preserve the integration-artifact rejection and the existing manual-dispatch contracts. Do not change root tag/version handling in this task.

- [ ] **Step 3: Scope the existing Release Drafter.**

Add to `.github/release-drafter.yml`:

~~~yaml
tag-prefix: "v"
~~~

Keep `name-template` and `tag-template` unchanged. This filters both drafts and published releases before Release Drafter selects them, as verified in the reference implementation. Commitish filtering cannot separate two components on the same branch.

Add `python3 packaging/rpm/tests/release-routing.py` to the CLI CI packaging-fixture step and the RPM workflow's source-fixture step. Add one release note in CLI README: tags under `apps/heimdall-cli/` do not publish server packages, images, Pages, or Iron Bank updates.

- [ ] **Step 4: Verify routing and YAML, then commit.**

~~~bash
python3 packaging/rpm/tests/release-routing.py
actionlint .github/workflows/push-to-npm.yml \
  .github/workflows/release-server-to-docker.yml \
  .github/workflows/release-lite-to-docker.yml \
  .github/workflows/gh-pages.yml .github/workflows/build-rpm.yml \
  .github/workflows/heimdall-cli-ci.yml
git add .github/workflows .github/release-drafter.yml \
  packaging/rpm/tests/release-routing.py apps/heimdall-cli/README.md
git commit -m "ci: isolate CLI releases from Heimdall server publishers"
~~~

Expected: root release and manual-server cases stay enabled; scoped CLI release cases all skip. Review the staged diff so only this task's workflow changes are included.

## Task 6: Build verified CLI archives and populate independent release drafts

**Files:** Create `.github/workflows/heimdall-cli-release.yml`. Update CLI `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `COMPAT.md`.

**Interfaces:**
- Consumes: reusable CI, CLI Makefile, exact-tag validator, and release-isolation guards.
- Produces: two Linux archives, per-archive verification in CI, a combined versioned checksum file, build attestations, and a CLI draft release.
- Tag pushes create/update drafts only. Manual runs accept a commit/branch/tag `ref` and build artifacts only; they require no release tag and have no publication path.

- [ ] **Step 1: Exercise the packaging commands locally before writing the workflow.**

On Linux, from repository root:

~~~bash
cli_package_dir=$(mktemp -d /tmp/heimdall-cli-package.XXXXXX)
cli_package_stage="$cli_package_dir/stage"
mkdir -p "$cli_package_stage"
cli_package_sha=$(git rev-parse HEAD)
cli_package_date=$(git show -s --format=%cI HEAD)
make -C apps/heimdall-cli build GOOS=linux GOARCH="$(go env GOHOSTARCH)" \
  OUTPUT="$cli_package_stage/heimdall-cli" \
  COMMIT="$cli_package_sha" DATE="$cli_package_date"
(cd apps/heimdall-cli && go run -mod=readonly ./cmd/gen-manpages "$cli_package_stage/man/man1")
cp apps/heimdall-cli/{LICENSE.md,README.md,COMPAT.md} "$cli_package_stage/"
"$cli_package_stage/heimdall-cli" --version
"$cli_package_stage/heimdall-cli" setup --help
tar -C "$cli_package_stage" -czf "$cli_package_dir/cli.tar.gz" .
tar -tzf "$cli_package_dir/cli.tar.gz"
~~~

Expected: the CLI version, exact commit/date, executable, license, documentation, and current setup manual are present. No administrative command is executed by this smoke check.

- [ ] **Step 2: Create the release workflow using the same commands.**

~~~yaml
name: Release Heimdall CLI
on:
  push:
    tags: ['apps/heimdall-cli/v*']
  workflow_dispatch:
    inputs:
      ref:
        description: 'Commit, branch, or tag to validate; manual runs never publish'
        type: string
        required: true
        default: master
permissions:
  contents: read
concurrency:
  group: cli-release-${{ github.event.inputs.ref || github.ref }}
  cancel-in-progress: false
env:
  GOTOOLCHAIN: local
jobs:
  prepare:
    runs-on: ubuntu-24.04
    outputs:
      tag: ${{ steps.source.outputs.tag }}
      version: ${{ steps.source.outputs.version }}
      sha: ${{ steps.source.outputs.sha }}
      date: ${{ steps.source.outputs.date }}
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: ${{ inputs.ref || github.ref }}
          fetch-depth: 0
          persist-credentials: false
      - name: Validate the selected source
        id: source
        env:
          EVENT_NAME: ${{ github.event_name }}
          RELEASE_TAG: ${{ github.ref_name }}
        run: |
          set -euo pipefail
          if [[ "$EVENT_NAME" == push ]]; then
            version=$(python3 apps/heimdall-cli/scripts/check-release.py "$RELEASE_TAG")
            tag=$RELEASE_TAG
          else
            make -C apps/heimdall-cli check-version
            version=$(sed 's/^v//' apps/heimdall-cli/VERSION)
            tag="apps/heimdall-cli/v$version"
          fi
          echo "tag=$tag" >> "$GITHUB_OUTPUT"
          echo "version=$version" >> "$GITHUB_OUTPUT"
          echo "sha=$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"
          echo "date=$(git show -s --format=%cI HEAD)" >> "$GITHUB_OUTPUT"

  checks:
    needs: prepare
    uses: ./.github/workflows/heimdall-cli-ci.yml
    with:
      ref: ${{ needs.prepare.outputs.sha }}

  build:
    needs: [prepare, checks]
    runs-on: ${{ matrix.runner }}
    strategy:
      fail-fast: false
      matrix:
        include:
          - {arch: amd64, runner: ubuntu-24.04}
          - {arch: arm64, runner: ubuntu-24.04-arm}
    env:
      CLI_VERSION: ${{ needs.prepare.outputs.version }}
      CLI_SHA: ${{ needs.prepare.outputs.sha }}
      CLI_DATE: ${{ needs.prepare.outputs.date }}
      CLI_ARCH: ${{ matrix.arch }}
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: ${{ needs.prepare.outputs.sha }}
          persist-credentials: false
      - uses: actions/setup-go@b7ad1dad31e06c5925ef5d2fc7ad053ef454303e # v7.0.0
        with:
          go-version-file: apps/heimdall-cli/go.mod
          cache: false
      - name: Build and verify native archive
        run: |
          set -euo pipefail
          test "$(go env GOHOSTARCH)" = "$CLI_ARCH"
          test "$(git rev-parse HEAD)" = "$CLI_SHA"
          stage="$RUNNER_TEMP/cli-package"
          mkdir -p "$stage" artifacts
          make -C apps/heimdall-cli build GOOS=linux GOARCH="$CLI_ARCH" \
            OUTPUT="$stage/heimdall-cli" COMMIT="$CLI_SHA" DATE="$CLI_DATE"
          version=$("$stage/heimdall-cli" --version)
          [[ "$version" == *"$CLI_VERSION (commit $CLI_SHA, built $CLI_DATE)"* ]]
          "$stage/heimdall-cli" --help > "$RUNNER_TEMP/cli-help.txt"
          "$stage/heimdall-cli" setup --help > "$RUNNER_TEMP/cli-setup-help.txt"
          (cd apps/heimdall-cli && go mod verify &&
            go run -mod=readonly ./cmd/gen-manpages "$stage/man/man1")
          cp apps/heimdall-cli/{LICENSE.md,README.md,COMPAT.md} "$stage/"
          test -s "$stage/man/man1/heimdall-cli.1"
          test -s "$stage/man/man1/heimdall-cli-setup.1"
          archive="heimdall-cli_${CLI_VERSION}_linux_${CLI_ARCH}.tar.gz"
          tar -C "$stage" -czf "artifacts/$archive" .
          (cd artifacts && sha256sum "$archive" > "$archive.sha256" &&
            sha256sum --check "$archive.sha256")
          mkdir "$RUNNER_TEMP/cli-unpacked"
          tar -xzf "artifacts/$archive" -C "$RUNNER_TEMP/cli-unpacked"
          cmp "$stage/heimdall-cli" "$RUNNER_TEMP/cli-unpacked/heimdall-cli"
          cmp "$stage/LICENSE.md" "$RUNNER_TEMP/cli-unpacked/LICENSE.md"
          "$RUNNER_TEMP/cli-unpacked/heimdall-cli" --version
          git diff --exit-code -- apps/heimdall-cli/go.mod apps/heimdall-cli/go.sum
      - uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: heimdall-cli-release-${{ matrix.arch }}
          path: artifacts/*
          if-no-files-found: error
          retention-days: 7

  publish:
    needs: [prepare, checks, build]
    if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/apps/heimdall-cli/v')
    runs-on: ubuntu-24.04
    permissions:
      contents: write
      id-token: write
      attestations: write
    env:
      CLI_TAG: ${{ needs.prepare.outputs.tag }}
      CLI_VERSION: ${{ needs.prepare.outputs.version }}
      CLI_SHA: ${{ needs.prepare.outputs.sha }}
      GH_REPO: ${{ github.repository }}
    steps:
      - uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1
        with:
          pattern: heimdall-cli-release-*
          merge-multiple: true
          path: downloaded
      - name: Verify exact assets and assemble release checksums
        run: |
          set -euo pipefail
          mkdir release
          test "$(find downloaded -maxdepth 1 -type f | wc -l)" -eq 4
          for arch in amd64 arm64; do
            archive="heimdall-cli_${CLI_VERSION}_linux_${arch}.tar.gz"
            (cd downloaded && sha256sum --check "$archive.sha256")
            cp "downloaded/$archive" release/
            cat "downloaded/$archive.sha256" >> "release/heimdall-cli_${CLI_VERSION}_SHA256SUMS"
          done
          (cd release && sha256sum --check "heimdall-cli_${CLI_VERSION}_SHA256SUMS")
      - uses: actions/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8 # v4.2.2
        with:
          subject-path: release/*
      - name: Populate an independent CLI draft
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          set -euo pipefail
          if draft=$(gh release view "$CLI_TAG" --json isDraft --jq .isDraft); then
            test "$draft" = true || { echo 'Refusing to replace a published CLI release' >&2; exit 1; }
          else
            gh release create "$CLI_TAG" --verify-tag --draft --latest=false \
              --title "heimdall-cli v$CLI_VERSION" \
              --notes "Independent Heimdall administration CLI. Source: $CLI_SHA. Compatibility and release notes: https://github.com/$GH_REPO/tree/$CLI_SHA/apps/heimdall-cli"
          fi
          gh release upload "$CLI_TAG" release/* --clobber
~~~

Release builds download Go dependencies, but use no restored Go cache, persisted checkout credential, npm package, GoReleaser, or separate RPM. Artifact download is scoped to the current workflow run. A failed tag/version check, either CI matrix failure, packaging failure, or checksum failure prevents the draft upload.

- [ ] **Step 3: Strengthen archive checks before accepting the workflow.**

Add this standard-library check after archive creation in the build step, passing the archive path as its argument. Keep the same check in a small local verification command in `docs/testing.md` rather than creating a second packaging implementation:

~~~python
import sys
import tarfile
from pathlib import PurePosixPath
with tarfile.open(sys.argv[1]) as archive:
    files = {}
    for member in archive.getmembers():
        path = PurePosixPath(member.name)
        assert not path.is_absolute() and ".." not in path.parts, member.name
        assert member.isfile() or member.isdir(), member.name
        if member.isfile():
            files[str(path)] = member
    required = {"heimdall-cli", "LICENSE.md", "README.md", "COMPAT.md",
                "man/man1/heimdall-cli.1", "man/man1/heimdall-cli-setup.1"}
    assert required <= set(files), required - set(files)
    assert all(name in required or name.startswith("man/man1/") for name in files)
    assert files["heimdall-cli"].mode & 0o111
~~~

Invoke it through `python3 - "artifacts/$archive" <<'PY'`. Indent the here-document with the YAML block so the extracted shell sees its closing `PY` at column zero. Test a corrupted copy of the tarball with `sha256sum --check` and confirm failure; test a tarball missing `LICENSE.md` and confirm this validator fails. Do not upload those negative fixtures.

- [ ] **Step 4: Finish the contributor release runbook.**

Document this sequence in `apps/heimdall-cli/CONTRIBUTING.md`:

1. Change CLI `VERSION`, CLI changelog, and tested pairs in `COMPAT.md`; leave root `VERSION` and application manifests unchanged.
2. Merge after CLI CI and the existing RPM matrix pass. Record actual platform results; do not change compatibility from pending to tested without those results.
3. Run the manual `Release Heimdall CLI` workflow with that commit SHA. Download and inspect both archives, version metadata, manuals, license, and checksums. The manual run cannot publish.
4. Once approved, create/push `apps/heimdall-cli/v0.9.0` at that exact commit. The workflow validates the tag and creates a populated draft with `--latest=false`.
5. Review the draft and publish it in GitHub, retaining the “not latest” setting. Verify the server publishing jobs are skipped and the server draft remains intact.
6. Verify a downloaded artifact with `sha256sum --check heimdall-cli_0.9.0_SHA256SUMS` and `gh attestation verify heimdall-cli_0.9.0_linux_amd64.tar.gz --repo mitre/heimdall2`.
7. If draft generation fails, rerun after fixing the underlying workflow/build failure. An existing draft may receive corrected assets; published CLI assets are not overwritten by this workflow. Use a new patch release for a published defect.

Explain that CLI and server versions can advance independently, but each server RPM includes the CLI source/version from its own source commit. A standalone CLI release does not modify existing server installations. Link the runbook from CLI README and add its initial import entry to the CLI changelog.

The implementation itself does not perform steps 4–5: creating a public release tag and publishing are later release operations. Do not use a production tag as a workflow test.

- [ ] **Step 5: Run final checks and inspect the implementation PR's evidence.**

~~~bash
python3 apps/heimdall-cli/tests/test_release.py
python3 packaging/rpm/tests/release-routing.py
python3 packaging/rpm/tests/inputs.py
python3 packaging/rpm/tests/cli-acquisition.py
actionlint .github/workflows/heimdall-cli-ci.yml .github/workflows/heimdall-cli-release.yml
git diff --check
~~~

Run the existing full RPM workflow for all six combinations. Confirm source extraction, installed independent CLI version/provenance, manpages, SRPM rebuild, and offline lifecycle checks. The workflow's stable RPM publication gate must remain unchanged.

Before calling CI/CD ready, obtain a successful manual artifact-only release run after the workflow is available on the default branch. Local YAML validation proves syntax, not GitHub permissions, hosted ARM runner availability, or artifact attestation behavior. Actual attestation/draft creation remains a first-release acceptance check; report that limitation until exercised.

- [ ] **Step 6: Commit.**

~~~bash
git add .github/workflows/heimdall-cli-release.yml apps/heimdall-cli
git commit -m "ci(cli): build verified archives and independent release drafts"
~~~

## Acceptance matrix and handoff

| Requirement | Implementing tasks | Evidence |
| --- | --- | --- |
| Fully patched in-tree source and license | 1 | Export parity, 47 preserved Go tests, provenance document. |
| Independent CLI version/module/tag | 2 | Validator Git fixtures, native binary metadata, separate VERSION. |
| No external CLI fetch in RPM builds | 3 | No-Git/workspace/HEAD/release fixtures and active-config search. |
| Binary/manual/source consistency | 3 | Source0 extraction and cross-target/native-generator regressions. |
| Fast CI and maintenance | 4 | Two native Go jobs, race tests, coverage artifact, vulnerability gate, Dependabot. |
| No cross-component publication | 5 | Actual-workflow guard evaluation and server drafter prefix. |
| Verified independent delivery | 6 | Manual artifact run, two archives, metadata, checksums, draft/attestation acceptance. |
| Existing RPM behavior preserved | 3, 6 | EL8/9/10 × x86_64/aarch64 build, payload, SRPM, disconnected lifecycle evidence. |

No server deployment, standalone CLI RPM, new Node workspace, dependency migration, Windows/macOS runtime port, or production RPM-signing project is included. The existing integration RPM restriction remains a separate release-readiness issue.

This plan was self-reviewed against the design for coverage, concrete steps, and path/interface consistency. During planning, the five release-validator tests passed in a temporary fixture and both proposed complete workflow blocks passed actionlint 1.7.12. The release-routing fixture failed on current unguarded workflow copies and passed after applying the proposed guards to those temporary copies. All Python blocks parsed and Bash blocks passed `bash -n`. Execution must still validate the actual application, RPM builds, and hosted workflow behavior.
