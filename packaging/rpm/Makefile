SPEC     := heimdall-server.spec
TOPDIR   ?= $(HOME)/rpmbuild-heimdall
SOURCE_MODE ?= workspace
HEIMDALL_RELEASE ?= 0.1.integration

# Version resolution is deliberately POSIX sed, not `rpmspec`.
#
# rpmspec only exists on RHEL-family hosts, which made every version-dependent
# target unusable on a developer laptop and produced misleading errors ("tag v
# not found") rather than an honest one.
#
# The repository VERSION file is canonical — it is what the release process and
# release-drafter work from. The spec's own Version: field is read separately
# and checked against it, so the two cannot silently drift. That drift is not
# hypothetical: the copy of this spec on feat/rpm-build sat at 2.12.6 while the
# shipped one tracked to 2.13.1.
NAME         := $(shell sed -n 's/^Name:[[:space:]]*//p' $(SPEC) | head -1)
SPEC_VERSION := $(shell sed -n 's/^Version:[[:space:]]*//p' $(SPEC) | head -1)
VERSION      := $(shell sed -e 's/^v//' -e 's/[[:space:]]//g' ../../VERSION 2>/dev/null)

# Fail fast when the spec and the repository disagree about the version.
# Every version-dependent target depends on this.
check-version:
	python3 scripts/check-inputs.py ../.. "$(TOPDIR)" check

check-source: check-version
	python3 scripts/check-inputs.py ../.. "$(TOPDIR)" "$(SOURCE_MODE)"

# Target architecture for cross-compilation (default: host arch)
GOARCH   ?= $(shell go env GOARCH)
RPM_ARCH ?= $(shell rpm --eval '%{_arch}')

.PHONY: srpm rpm rpm-install rpm-package clean lint lint-rpm check-version check-source sources cli-src heimdall-cli man runtimes stage deps check-upstream bump-version

# Upstream repo for `make check-upstream` (override for forks/mirrors).
UPSTREAM_REPO ?= mitre/heimdall2

# Yarn cache for fast local rebuilds. Off by default so `make rpm`
# matches CI/mock/COPR (clean stateless build, deterministic).
# Enable with `make rpm CACHE=1` — yarn keeps its disk cache between
# builds so `yarn install` skips re-downloading every dep from npm.
CACHE      ?= 0
YARN_CACHE ?= $(HOME)/.cache/yarn-heimdall
ifeq ($(CACHE),1)
  RPMBUILD_PREFIX := YARN_CACHE_FOLDER="$(YARN_CACHE)"
else
  RPMBUILD_PREFIX :=
endif

# Build current files by default, including downloaded sources without Git metadata.
# Explicit head/release modes archive validated HEAD.
sources: check-source
	@mkdir -p "$(TOPDIR)/SOURCES"
ifeq ($(SOURCE_MODE),workspace)
	tar -C ../.. --exclude=.git --exclude=.beads --exclude=.superpowers \
	  --exclude=node_modules --exclude=dist --exclude=rpmbuild \
	  --exclude=.env --exclude='.env-*' --exclude='.env.*' \
	  --exclude='*.rpm' --exclude=certs --exclude=.cache --exclude=coverage \
	  --transform 's|^\.|heimdall2-$(VERSION)|' \
	  -czf "$(TOPDIR)/SOURCES/heimdall2-$(VERSION).tar.gz" .
else
	@git -C ../.. archive --format=tar.gz \
	  --prefix=heimdall2-$(VERSION)/ HEAD \
	  > "$(TOPDIR)/SOURCES/heimdall2-$(VERSION).tar.gz"
endif

# The pin files identify the tested CLI. Read them in the shell so
# malformed file contents cannot become shell syntax through Make expansion.
override CLI_DIR := $(TOPDIR)/heimdall-cli-src

cli-src: check-source
	@test "$(origin HEIMDALL_CLI_REPO)" = undefined && test "$(origin HEIMDALL_CLI_REF)" = undefined || { \
	  echo 'ERROR: CLI pin overrides are unsupported; update heimdall-cli.repo and heimdall-cli.ref' >&2; exit 1; }
	@set -eu; \
	cli_repo=$$(cat heimdall-cli.repo); cli_ref=$$(cat heimdall-cli.ref); \
	test "$${#cli_ref}" -eq 40 && printf '%s\n' "$$cli_ref" | LC_ALL=C grep -Eq '^[0-9a-f]{40}$$' || { \
	  echo 'ERROR: heimdall-cli.ref must contain exactly 40 lowercase hex characters' >&2; exit 1; }; \
	test -n "$$cli_repo" && test "$$(printf '%s\n' "$$cli_repo" | wc -l)" -eq 1 || { \
	  echo 'ERROR: heimdall-cli.repo must contain one repository URL' >&2; exit 1; }; \
	mkdir -p "$(TOPDIR)"; \
	if [ -e "$(CLI_DIR)" ]; then \
	  test -d "$(CLI_DIR)/.git" && test ! -L "$(CLI_DIR)" || { \
	    echo 'ERROR: CLI source path is not an owned Git checkout' >&2; exit 1; }; \
	  test "$$(git -C "$(CLI_DIR)" remote get-url origin)" = "$$cli_repo" || { \
	    echo 'ERROR: CLI repository mismatch' >&2; exit 1; }; \
	  test -z "$$(git -C "$(CLI_DIR)" status --porcelain --untracked-files=all --ignored)" || { \
	    echo 'ERROR: Uncommitted CLI inputs; use a clean checkout' >&2; exit 1; }; \
	else \
	  git clone --quiet --no-checkout -- "$$cli_repo" "$(CLI_DIR)"; \
	fi; \
	git -C "$(CLI_DIR)" fetch --quiet origin "$$cli_ref"; \
	git -C "$(CLI_DIR)" checkout --quiet --detach "$$cli_ref"; \
	test "$$(git -C "$(CLI_DIR)" rev-parse HEAD)" = "$$cli_ref"; \
	test -z "$$(git -C "$(CLI_DIR)" status --porcelain --untracked-files=all --ignored)"; \
	echo "heimdall-cli source at $$cli_ref"

# Build Go CLI binary for the target platform (static, no CGO).
# Produces a flat binary at rpmbuild/SOURCES/heimdall-cli (spec Source15).
# All three version fields (Version/Commit/Date) are injected so
# `heimdall-cli --version` shows real provenance.
#
# CLI_COMMIT is resolved from the CLI checkout, not from heimdall2. The previous
# `git rev-parse HEAD` ran in the packaging repo and stamped the wrong commit
# into the binary's version output.
heimdall-cli: cli-src
	@mkdir -p "$(TOPDIR)/SOURCES"
	output=$$(cd "$(TOPDIR)/SOURCES" && pwd) && \
	cd "$(CLI_DIR)" && GOOS=linux GOARCH="$(GOARCH)" CGO_ENABLED=0 \
	  go build -trimpath \
	  -ldflags="-s -w \
	    -X 'github.com/mitre/heimdall-cli/internal/version.Version=$(VERSION)' \
	    -X 'github.com/mitre/heimdall-cli/internal/version.Commit=$$(git rev-parse HEAD)' \
	    -X 'github.com/mitre/heimdall-cli/internal/version.Date=$$(git show -s --format=%cI HEAD)'" \
	  -o "$$output/heimdall-cli" \
	  ./cmd/heimdall-cli
	@echo "Built: $(TOPDIR)/SOURCES/heimdall-cli (linux/$(GOARCH))"

# Generate man pages from the CLI command tree.
# Generated from the same pinned checkout as the binary, so the pages can never
# drift from the commands they document.
man: cli-src
	rm -rf "$(TOPDIR)/cli-man"
	rm -f "$(TOPDIR)/SOURCES/heimdall-cli-man.tar.gz"
	mkdir -p "$(TOPDIR)/cli-man/man1" "$(TOPDIR)/SOURCES"
	output=$$(cd "$(TOPDIR)/cli-man/man1" && pwd) && \
	cd "$(CLI_DIR)" && GOOS=$$(go env GOHOSTOS) GOARCH=$$(go env GOHOSTARCH) \
	  go run ./cmd/gen-manpages "$$output"
	test -s "$(TOPDIR)/cli-man/man1/heimdall-cli.1"
	test -s "$(TOPDIR)/cli-man/man1/heimdall-cli-setup.1"
	tar -C "$(TOPDIR)/cli-man" -czf "$(TOPDIR)/SOURCES/heimdall-cli-man.tar.gz" man1

# Install build dependencies (delegates to setup script).
deps:
	scripts/setup-build-deps.sh

runtimes: check-source
	python3 scripts/stage-runtimes.py runtime-lock.json "$(RPM_ARCH)" "$(TOPDIR)/SOURCES"

# Stage all source files into rpmbuild tree (Sources 0-28).
# Single source of truth for which files go into the RPM.
stage: check-source sources heimdall-cli man runtimes
	@mkdir -p "$(TOPDIR)/SPECS" "$(TOPDIR)/BUILD" "$(TOPDIR)/RPMS" "$(TOPDIR)/SRPMS"
	# Retain the selected release when the SRPM is rebuilt without Make macros.
	sed 's/%global heimdall_release [^}]*/%global heimdall_release $(HEIMDALL_RELEASE)/' \
	  "$(SPEC)" > "$(TOPDIR)/SPECS/$(SPEC)"
	@# Source 9-11: SELinux policy
	cp selinux/* "$(TOPDIR)/SOURCES/"
	@# (fapolicyd helper script retired — handled by `heimdall-cli fapolicyd`)
	@# Source 13: firewalld service definition
	cp firewalld/* "$(TOPDIR)/SOURCES/"
	@# Sources 1-8, 14, 16-19: service, config, scripts
	cp heimdall-backend.env heimdall-server.service heimdall-server.sh \
	   heimdall-postgresql.service heimdall-caddy.service \
	   heimdall-configure.sh heimdall-postgres-setup.sh heimdall-setup.sh \
	   heimdall-db-setup.sh heimdall-server-tmpfiles.conf heimdall-server.repo \
	   heimdall-Caddyfile heimdall-sysconfig \
	   heimdall-rsyslog.conf heimdall-logrotate.conf \
	   "$(TOPDIR)/SOURCES/"
	@# Sources 20-21: security samples
	cp security/40-heimdall.rules security/SECURITY.md "$(TOPDIR)/SOURCES/"

srpm: stage
	rpmbuild -bs --define "_topdir $(TOPDIR)" --define "heimdall_release $(HEIMDALL_RELEASE)" "$(TOPDIR)/SPECS/$(SPEC)"
	@echo "SRPM: $$(ls "$(TOPDIR)"/SRPMS/*.src.rpm)"

rpm: stage
	@$(if $(filter 1,$(CACHE)),mkdir -p "$(YARN_CACHE)",true)
	$(RPMBUILD_PREFIX) rpmbuild -ba --define "_topdir $(TOPDIR)" --define "heimdall_release $(HEIMDALL_RELEASE)" "$(TOPDIR)/SPECS/$(SPEC)"
	@echo "RPMs: $$(ls "$(TOPDIR)"/RPMS/*/*.rpm)"

# Iterate fast on spec edits — skips %prep + %build (no tarball
# extraction, no `yarn install`, no node build) and re-runs only
# %install + %check + %files + binary packaging against the BUILD
# tree from the previous `make rpm`. Use after editing %install,
# %files, %post/%postun scriptlets, or any spec metadata.
# Requires a prior successful `make rpm`.
rpm-install:
	rpmbuild --short-circuit -bi --define "_topdir $(TOPDIR)" "$(TOPDIR)/SPECS/$(SPEC)"
	@echo "RPMs: $$(ls "$(TOPDIR)"/RPMS/*/*.rpm)"

# Fastest possible iteration — skips %prep + %build + %install,
# re-runs only %check + %files selection + binary packaging against
# the existing BUILDROOT. Use after editing only %files / %changelog
# / metadata when the BUILDROOT contents themselves don't need to
# change. If BUILDROOT has been cleaned (a full `make rpm` does this
# at the end of packaging on most rpmbuild versions), falls back to
# `rpm-install` automatically so the target always works.
rpm-package:
	@buildroot_dir="$(TOPDIR)/BUILDROOT"; \
	if [ ! -d "$$buildroot_dir" ] || [ -z "$$(ls -A "$$buildroot_dir" 2>/dev/null)" ]; then \
		echo "BUILDROOT empty (cleaned by previous build) — running rpm-install first"; \
		$(MAKE) rpm-install; \
	else \
		rpmbuild --short-circuit -bb --define "_topdir $(TOPDIR)" "$(TOPDIR)/SPECS/$(SPEC)"; \
		echo "RPMs: $$(ls "$(TOPDIR)"/RPMS/*/*.rpm)"; \
	fi

# The shared filters cover different distro versions and source/binary checks.
# Only rpmlint 2 supports disabling errors for filters unused in a given run.
RPMLINT_FLAGS = --file .rpmlintrc $(shell rpmlint --help 2>/dev/null | grep -o -- --ignore-unused-rpmlintrc | head -1)

lint:
	rpmlint $(RPMLINT_FLAGS) $(SPEC)

# Lint built RPMs (run after 'make rpm')
lint-rpm:
	@if ls "$(TOPDIR)"/RPMS/*/*.rpm >/dev/null 2>&1; then \
		rpmlint $(RPMLINT_FLAGS) "$(TOPDIR)"/RPMS/*/*.rpm; \
	else \
		echo "No RPMs found — run 'make rpm' first"; exit 1; \
	fi
	@if ls "$(TOPDIR)"/SRPMS/*.src.rpm >/dev/null 2>&1; then \
		rpmlint $(RPMLINT_FLAGS) "$(TOPDIR)"/SRPMS/*.src.rpm; \
	fi

clean:
	rm -rf "$(TOPDIR)"

# Compare the spec's Version against the latest GitHub release on UPSTREAM_REPO.
# Read-only: never touches the spec. Useful before `make bump-version`.
# Uses gh CLI if available, otherwise falls back to curl (always present on RHEL).
check-upstream: check-version
	@spec_ver="$(VERSION)"; \
	if command -v gh >/dev/null 2>&1; then \
		gh_tag=$$(gh release view --repo $(UPSTREAM_REPO) --json tagName -q '.tagName' 2>/dev/null); \
	else \
		gh_tag=$$(curl -sfL -o /dev/null -w '%{url_effective}\n' \
			https://github.com/$(UPSTREAM_REPO)/releases/latest \
			| sed 's|.*/tag/||'); \
	fi; \
	gh_ver=$${gh_tag#v}; \
	echo "spec:   $$spec_ver"; \
	echo "github: $$gh_ver  ($(UPSTREAM_REPO))"; \
	if [ "$$spec_ver" = "$$gh_ver" ]; then \
		echo "✓ in sync"; \
	else \
		echo "✗ spec is behind — run: make bump-version VERSION=$$gh_ver"; \
		exit 1; \
	fi

# Bump the spec to a new upstream version using rpmdev-bumpspec.
# Sets new Version, resets Release to 1, prepends a dated changelog entry.
# Stages a single edit you commit; does NOT build.
bump-version:
	@command -v rpmdev-bumpspec >/dev/null 2>&1 || { echo "rpmdev-bumpspec required (rpmdevtools package)"; exit 1; }
	@test -n "$(VERSION)" || { echo "Usage: make bump-version VERSION=X.Y.Z"; exit 1; }
	rpmdev-bumpspec --new=$(VERSION) -c "Update to $(VERSION)" $(SPEC)
	@echo
	@echo "Spec bumped. Review: git diff $(SPEC)"
