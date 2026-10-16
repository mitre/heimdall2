SPEC     := heimdall-server.spec
TOPDIR   ?= $(HOME)/rpmbuild-heimdall
SOURCE_MODE ?= workspace
HEIMDALL_RELEASE ?= 0.1.integration

# VERSION is canonical; command-line/environment overrides cannot change it.
# Resolve without rpmspec so source staging also works on developer laptops.
override VERSION := $(shell sed -e 's/[[:space:]]//g' -e 's/^v//' ../../VERSION 2>/dev/null)

# Validate VERSION, the application manifests and the spec template before use.
check-version:
	python3 scripts/check-inputs.py ../.. "$(TOPDIR)" check

check-source: check-version
	python3 scripts/check-inputs.py ../.. "$(TOPDIR)" "$(SOURCE_MODE)"

# Target architecture for cross-compilation (default: host arch)
GOARCH   ?= $(shell go env GOARCH)
RPM_ARCH ?= $(shell rpm --eval '%{_arch}')

.PHONY: srpm rpm rpm-install rpm-package clean lint lint-rpm check-version check-source sources cli-build-src heimdall-cli man runtimes render-spec stage deps check-upstream

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
	  --exclude=.npmrc --exclude=.yarnrc.yml \
	  --exclude=.env --exclude='.env-*' --exclude='.env.*' \
	  --exclude=manifest.yml \
	  --exclude='*.rpm' --exclude=certs --exclude=.cache --exclude=coverage --exclude=./data \
	  --transform 's|^\.|heimdall2-$(VERSION)|' \
	  -czf "$(TOPDIR)/SOURCES/heimdall2-$(VERSION).tar.gz" .
else
	@git -C ../.. archive --format=tar.gz \
	  --prefix=heimdall2-$(VERSION)/ HEAD \
	  > "$(TOPDIR)/SOURCES/heimdall2-$(VERSION).tar.gz"
endif

override CLI_BUILD_DIR := $(TOPDIR)/heimdall-cli-build

cli-build-src: sources
	rm -rf "$(CLI_BUILD_DIR)"
	mkdir -p "$(CLI_BUILD_DIR)"
	tar -xzf "$(TOPDIR)/SOURCES/heimdall2-$(VERSION).tar.gz" \
	  -C "$(CLI_BUILD_DIR)" --strip-components=3 \
	  "heimdall2-$(VERSION)/apps/heimdall-cli"
	test -s "$(CLI_BUILD_DIR)/go.mod"
	test -s "$(CLI_BUILD_DIR)/VERSION"

# Build Source15 from the CLI module in the server source archive.
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

# Generate man pages from the CLI command tree.
# Generated from the same extracted source as the binary, so the pages can never
# drift from the commands they document.
man: cli-build-src
	rm -rf "$(TOPDIR)/cli-man"
	rm -f "$(TOPDIR)/SOURCES/heimdall-cli-man.tar.gz"
	mkdir -p "$(TOPDIR)/cli-man/man1" "$(TOPDIR)/SOURCES"
	output=$$(cd "$(TOPDIR)/cli-man/man1" && pwd) && \
	cd "$(CLI_BUILD_DIR)" && GOOS=$$(go env GOHOSTOS) GOARCH=$$(go env GOHOSTARCH) \
	  go run -mod=readonly ./cmd/gen-manpages "$$output"
	test -s "$(TOPDIR)/cli-man/man1/heimdall-cli.1"
	test -s "$(TOPDIR)/cli-man/man1/heimdall-cli-setup.1"
	tar -C "$(TOPDIR)/cli-man" -czf "$(TOPDIR)/SOURCES/heimdall-cli-man.tar.gz" man1

# Install build dependencies (delegates to setup script).
deps:
	scripts/setup-build-deps.sh

runtimes: check-source
	@mkdir -p "$(TOPDIR)/SOURCES"
	cd "$(TOPDIR)/SOURCES" && python3 "$(CURDIR)/scripts/stage-runtimes.py" "$(RPM_ARCH)"

# Retain the resolved version and release in independent SRPM rebuilds.
render-spec: check-source
	@mkdir -p "$(TOPDIR)/SPECS"
	sed -e 's/@HEIMDALL_VERSION@/$(VERSION)/' \
	  -e 's/%global heimdall_release [^}]*/%global heimdall_release $(HEIMDALL_RELEASE)/' \
	  "$(SPEC)" > "$(TOPDIR)/SPECS/$(SPEC)"

# Stage all source files into rpmbuild tree (Sources 0-30).
# Single source of truth for which files go into the RPM.
stage: check-source sources heimdall-cli man runtimes render-spec
	@mkdir -p "$(TOPDIR)/BUILD" "$(TOPDIR)/RPMS" "$(TOPDIR)/SRPMS"
	@# Source 9-11: SELinux policy
	cp selinux/* "$(TOPDIR)/SOURCES/"
	@# (fapolicyd helper script retired — handled by `heimdall-cli fapolicyd`)
	@# Source 13: firewalld service definition
	cp firewalld/* "$(TOPDIR)/SOURCES/"
	@# Sources 1-8, 14, 16-19: service, config, scripts
	cp heimdall-backend.env heimdall-server.service heimdall-server.sh \
	   heimdall-postgresql.service heimdall-caddy.service heimdall-nginx.service \
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

# Reuse a prior BUILD tree: run %install + %check, then package the files.
# Shortcut RPMs retain RPM's unsatisfiable dependency for local testing only.
rpm-install: render-spec
	rpmbuild --short-circuit -bi --define "_topdir $(TOPDIR)" "$(TOPDIR)/SPECS/$(SPEC)"
	rpmbuild --short-circuit -bb --define "_topdir $(TOPDIR)" "$(TOPDIR)/SPECS/$(SPEC)"
	@echo "RPMs: $$(ls "$(TOPDIR)"/RPMS/*/*.rpm)"

# Package an existing BUILDROOT without rerunning %install or %check.
# If BUILDROOT was cleaned, restore it with rpm-install before packaging.
rpm-package: render-spec
	@buildroot_dir="$(TOPDIR)/BUILDROOT"; \
	if [ ! -d "$$buildroot_dir" ] || [ -z "$$(ls -A "$$buildroot_dir" 2>/dev/null)" ]; then \
		echo "BUILDROOT empty (cleaned by previous build) — running rpm-install first"; \
		$(MAKE) rpm-install; \
	else \
		rpmbuild --short-circuit -bb --define "_topdir $(TOPDIR)" "$(TOPDIR)/SPECS/$(SPEC)" && \
		echo "RPMs: $$(ls "$(TOPDIR)"/RPMS/*/*.rpm)"; \
	fi

# The shared filters cover different distro versions and source/binary checks.
# Only rpmlint 2 supports disabling errors for filters unused in a given run.
RPMLINT_FLAGS = --file .rpmlintrc $(shell rpmlint --help 2>/dev/null | grep -o -- --ignore-unused-rpmlintrc | head -1)

lint: render-spec
	rpmlint $(RPMLINT_FLAGS) "$(TOPDIR)/SPECS/$(SPEC)"

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
	python3 scripts/check-inputs.py ../.. "$(TOPDIR)" clean
	rm -rf "$(TOPDIR)"

# Compare VERSION against the latest GitHub release on UPSTREAM_REPO.
# Read-only: never changes the application version.
# Uses gh CLI if available, otherwise falls back to curl (always present on RHEL).
check-upstream: check-version
	@source_ver="$(VERSION)"; \
	if command -v gh >/dev/null 2>&1; then \
		gh_tag=$$(gh release view --repo $(UPSTREAM_REPO) --json tagName -q '.tagName' 2>/dev/null); \
	else \
		gh_tag=$$(curl --proto '=https' --proto-redir '=https' -sfL -o /dev/null -w '%{url_effective}\n' \
			https://github.com/$(UPSTREAM_REPO)/releases/latest \
			| sed 's|.*/tag/||'); \
	fi; \
	gh_ver=$${gh_tag#v}; \
	echo "source: $$source_ver"; \
	echo "github: $$gh_ver  ($(UPSTREAM_REPO))"; \
	if [ "$$source_ver" = "$$gh_ver" ]; then \
		echo "✓ in sync"; \
	else \
		echo "✗ versions differ — update VERSION and the application manifests together"; \
		exit 1; \
	fi
