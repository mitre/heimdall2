#!/bin/bash
# setup-build-deps.sh — Install repositories and packages needed to build
# heimdall-server RPMs on RHEL-family systems.
#
# Supported: RHEL, Oracle Linux, CentOS Stream, Rocky Linux, AlmaLinux (EL8, EL9)
#
# Does NOT build anything, fetch source, or run rpmbuild.
# After running this script, build with: cd heimdall-server && make rpm
#
# Usage:
#   sudo ./scripts/setup-build-deps.sh [options]
#
# Options:
#   --skip-update       Skip dnf update
#   --with-pgdg         Also install PGDG PostgreSQL repo
#   -h, --help          Show this help

set -euo pipefail

SCRIPT_NAME="$(basename "$0")"
RUN_DNF_UPDATE=1
ENABLE_PGDG=0

usage() {
    cat <<EOF
Usage: $SCRIPT_NAME [options]

Install repositories and packages needed to build heimdall-server RPMs.
Does NOT build anything, fetch source, or run rpmbuild.

Supported: RHEL, Oracle Linux, CentOS Stream, Rocky Linux, AlmaLinux (EL8, EL9)

Options:
  --skip-update       Skip 'dnf update' (faster on pre-configured hosts)
  --with-pgdg         Also install PGDG PostgreSQL repository
  -h, --help          Show this help

After running, build with:
  cd heimdall-server && make rpm GOARCH=amd64
EOF
    exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-update)   RUN_DNF_UPDATE=0; shift ;;
        --with-pgdg)     ENABLE_PGDG=1; shift ;;
        -h|--help)       usage 0 ;;
        *)               echo "Error: unknown option '$1'" >&2; usage 1 ;;
    esac
done

# ---------------------------------------------------------------------------
# Detect platform
# ---------------------------------------------------------------------------
el_major=""
if command -v rpm >/dev/null 2>&1; then
    el_major="$(rpm -E '%{?rhel}')"
fi
if [[ -z "${el_major}" || "${el_major}" == "%{?rhel}" ]]; then
    el_major="$(. /etc/os-release 2>/dev/null && printf '%s' "${VERSION_ID%%.*}")"
fi
if [[ "${el_major}" != 8 && "${el_major}" != 9 ]]; then
    echo "Error: unsupported EL major version '${el_major}'." >&2
    echo "This script supports RHEL, Oracle Linux, CentOS Stream, Rocky, and Alma (EL8/EL9)." >&2
    exit 1
fi

distro_name="EL${el_major}"
if [[ -f /etc/os-release ]]; then
    distro_name="$(. /etc/os-release && echo "${NAME} ${VERSION_ID}")"
fi
echo "Platform: ${distro_name} ($(uname -m))"

# Sudo detection (skip if already root, e.g. inside a container)
SUDO=""
if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    SUDO="sudo"
fi

# DNF args
DNF_ARGS=(-y)
command -v curl >/dev/null
${SUDO} dnf install "${DNF_ARGS[@]}" dnf-plugins-core

# ---------------------------------------------------------------------------
# Step 1: Enable required repositories
# ---------------------------------------------------------------------------
echo ""
echo "=== Step 1/5: Repositories ==="

# --- EPEL ---
# EPEL is needed for RPM build tools on some supported distributions.
# Package name varies: epel-release (CentOS/Rocky/Alma), oracle-epel-release-el* (OL)
if ! rpm -q epel-release >/dev/null 2>&1 && \
   ! rpm -q oracle-epel-release-el${el_major} >/dev/null 2>&1; then
    echo "  Installing EPEL..."
    ${SUDO} dnf install "${DNF_ARGS[@]}" epel-release 2>/dev/null \
        || ${SUDO} dnf install "${DNF_ARGS[@]}" \
            "https://dl.fedoraproject.org/pub/epel/epel-release-latest-${el_major}.noarch.rpm" \
        || echo "  Warning: EPEL install failed (may need manual setup on RHEL with subscription-manager)"
else
    echo "  EPEL: already installed"
fi

# --- CRB / PowerTools / CodeReady Builder ---
# Name varies across distros. Try all known names; at least one should work.
echo "  Enabling CRB/PowerTools..."
enabled_crb=0
for repo_name in crb powertools PowerTools \
    "ol${el_major}_codeready_builder" \
    "codeready-builder-for-rhel-${el_major}-$(uname -m)-rpms"; do
    if ${SUDO} dnf config-manager --set-enabled "${repo_name}" 2>/dev/null; then
        echo "  Enabled: ${repo_name}"
        enabled_crb=1
        break
    fi
done
if [[ "${enabled_crb}" -eq 0 ]]; then
    echo "  Warning: could not enable CRB/PowerTools (may already be enabled or not available)"
fi

# --- NodeSource (Node.js 22) ---
# We use NodeSource on ALL platforms for consistency. AppStream modules
# may not have Node.js 22 on all EL8/EL9 minor versions and distro variants.
if ! rpm -q nodesource-release >/dev/null 2>&1; then
    echo "  Installing NodeSource repo for Node.js 22..."
    curl -fsSL https://rpm.nodesource.com/setup_22.x | ${SUDO} bash -
else
    echo "  NodeSource: already installed"
fi

# --- PGDG (optional) ---
if [[ "${ENABLE_PGDG}" -eq 1 ]]; then
    echo "  Setting up PGDG PostgreSQL repo..."
    local_arch="$(uname -m)"
    pgdg_url="https://download.postgresql.org/pub/repos/yum/reporpms/EL-${el_major}-${local_arch}/pgdg-redhat-repo-latest.noarch.rpm"
    ${SUDO} dnf install "${DNF_ARGS[@]}" "${pgdg_url}"
    if [[ "${el_major}" == 8 ]]; then
        ${SUDO} dnf module disable postgresql "${DNF_ARGS[@]}"
    fi
fi

# ---------------------------------------------------------------------------
# Step 2: System update (optional)
# ---------------------------------------------------------------------------
if [[ "${RUN_DNF_UPDATE}" -eq 1 ]]; then
    echo ""
    echo "=== Step 2/5: System update ==="
    ${SUDO} dnf update "${DNF_ARGS[@]}"
else
    echo ""
    echo "=== Step 2/5: System update (skipped -- use --skip-update to suppress) ==="
fi

# ---------------------------------------------------------------------------
# Step 3: Install build packages
# ---------------------------------------------------------------------------
echo ""
echo "=== Step 3/5: Build packages ==="
# EL8's default Python 3.6 cannot run the application's node-gyp 12.
build_python=python3
if [[ "$el_major" == 8 ]]; then build_python=python39; fi
${SUDO} dnf install "${DNF_ARGS[@]}" \
    gcc \
    gcc-c++ \
    libicu-devel \
    openssl-devel \
    zlib-devel \
    bison \
    flex \
    pkgconfig \
    make \
    git \
    nodejs \
    python3 \
    "$build_python" \
    perl-interpreter \
    openssl \
    rpm-build \
    rpmdevtools \
    rpmlint \
    redhat-rpm-config \
    selinux-policy-devel \
    systemd-rpm-macros \
    tar \
    xz \
    bzip2 \
    util-linux

# ---------------------------------------------------------------------------
# Step 4: Yarn
# ---------------------------------------------------------------------------
# The spec uses BuildRequires: /usr/bin/yarn. This must be satisfied by an RPM
# package (not corepack), because rpmbuild checks the RPM database, not $PATH.
#
echo ""
echo "=== Step 4/5: Yarn ==="
# Remove only Corepack's shim; disabling it unconditionally removes real Yarn too.
if command -v corepack >/dev/null 2>&1 && command -v yarn >/dev/null 2>&1 && \
   [[ "$(readlink -f "$(command -v yarn)")" == */corepack/* ]]; then
    ${SUDO} corepack disable yarn
fi
if ! command -v yarn >/dev/null 2>&1 || \
   ! rpm -qf "$(command -v yarn)" >/dev/null 2>&1 || \
   [[ "$(yarn --version)" != 1.22.22 ]]; then
    ${SUDO} curl -fsSL https://dl.yarnpkg.com/rpm/yarn.repo \
        -o /etc/yum.repos.d/yarn.repo
    if rpm -q yarnpkg >/dev/null 2>&1; then
        ${SUDO} dnf swap "${DNF_ARGS[@]}" yarnpkg yarn-1.22.22
    elif rpm -q yarn-1.22.22 >/dev/null 2>&1; then
        ${SUDO} dnf reinstall "${DNF_ARGS[@]}" yarn-1.22.22
    else
        ${SUDO} dnf install "${DNF_ARGS[@]}" yarn-1.22.22
    fi
fi
test "$(yarn --version)" = 1.22.22
rpm -qf /usr/bin/yarn >/dev/null

# ---------------------------------------------------------------------------
# Step 5/5: Go (required for building heimdall-cli)
# ---------------------------------------------------------------------------
# Distro Go packages are typically too old (1.20-1.21). We install the
# official Go tarball from go.dev which works on all EL variants.
GO_VERSION="${GO_VERSION:-1.25.8}"
echo ""
echo "=== Step 5/5: Go ==="
installed_go=$(go version 2>/dev/null | awk '{sub(/^go/, "", $3); print $3}' || true)
if [[ "$installed_go" != "$GO_VERSION" ]]; then
    arch_suffix="$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')"
    go_archive=$(mktemp)
    trap 'rm -f "$go_archive"' EXIT
    echo "  Installing Go ${GO_VERSION}..."
    curl --fail --location "https://go.dev/dl/go${GO_VERSION}.linux-${arch_suffix}.tar.gz" -o "$go_archive"
    ${SUDO} install -d "/opt/heimdall-build/go-${GO_VERSION}"
    ${SUDO} tar -C "/opt/heimdall-build/go-${GO_VERSION}" --strip-components=1 -xzf "$go_archive"
    rm -f "$go_archive"
    export PATH="/opt/heimdall-build/go-${GO_VERSION}/bin:$PATH"
fi
test "$(go env GOVERSION)" = "go${GO_VERSION}"
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a!==22 || b<18) process.exit(1)'

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=========================================="
echo " Build dependencies installed."
echo ""
echo " Build the RPM:"
echo "   cd heimdall-server"
echo "   export PATH=/opt/heimdall-build/go-${GO_VERSION}/bin:\$PATH"
echo "   make rpm GOARCH=amd64"
echo ""
echo " Or step by step:"
echo "   make sources          # Download upstream source"
echo "   make heimdall-cli     # Build Go CLI binary"
echo "   make man              # Generate man pages"
echo "   make stage            # Stage all files for rpmbuild"
echo "   make rpm              # Run rpmbuild"
echo ""
echo " For build options: make -n rpm"
echo "=========================================="
