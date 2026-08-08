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
#   --no-gpg-check      Disable GPG checks (air-gapped environments)
#   -h, --help          Show this help

set -euo pipefail

SCRIPT_NAME="$(basename "$0")"
RUN_DNF_UPDATE=1
ENABLE_PGDG=0
NO_GPG_CHECK=0

usage() {
    cat <<EOF
Usage: $SCRIPT_NAME [options]

Install repositories and packages needed to build heimdall-server RPMs.
Does NOT build anything, fetch source, or run rpmbuild.

Supported: RHEL, Oracle Linux, CentOS Stream, Rocky Linux, AlmaLinux (EL8, EL9)

Options:
  --skip-update       Skip 'dnf update' (faster on pre-configured hosts)
  --with-pgdg         Also install PGDG PostgreSQL repository
  --no-gpg-check      Disable GPG checks (air-gapped/mirror environments)
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
        --no-gpg-check)  NO_GPG_CHECK=1; shift ;;
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
if [[ -z "${el_major}" ]]; then
    echo "Error: cannot determine EL major version." >&2
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
if [[ "${NO_GPG_CHECK}" -eq 1 ]]; then
    DNF_ARGS+=("--nogpgcheck" "--setopt=*.gpgcheck=0" "--setopt=*.repo_gpgcheck=0")
fi

# ---------------------------------------------------------------------------
# Step 1: Enable required repositories
# ---------------------------------------------------------------------------
echo ""
echo "=== Step 1/5: Repositories ==="

# --- EPEL ---
# EPEL is needed for yarnpkg and other build deps.
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
    ${SUDO} dnf install "${DNF_ARGS[@]}" "${pgdg_url}" 2>/dev/null || true
    ${SUDO} dnf module disable postgresql "${DNF_ARGS[@]}" 2>/dev/null || true
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
${SUDO} dnf install "${DNF_ARGS[@]}" \
    gcc-c++ \
    make \
    git \
    nodejs \
    python3 \
    openssl \
    rpm-build \
    rpmdevtools \
    rpmlint \
    redhat-rpm-config \
    selinux-policy-devel \
    systemd-rpm-macros \
    tar \
    curl \
    util-linux

# ---------------------------------------------------------------------------
# Step 4: Yarn
# ---------------------------------------------------------------------------
# The spec uses BuildRequires: /usr/bin/yarn. This must be satisfied by an RPM
# package (not corepack), because rpmbuild checks the RPM database, not $PATH.
#
# Priority: yarnpkg from EPEL > yarn from Yarn's own repo
echo ""
echo "=== Step 4/5: Yarn ==="
if command -v yarn >/dev/null 2>&1 && rpm -qf "$(command -v yarn)" >/dev/null 2>&1; then
    echo "  Yarn: $(yarn --version) ($(rpm -qf "$(command -v yarn)"))"
else
    # Try yarnpkg from EPEL first
    if ${SUDO} dnf install "${DNF_ARGS[@]}" yarnpkg 2>/dev/null; then
        echo "  Yarn: $(yarn --version) (yarnpkg from EPEL)"
    else
        # Fall back to Yarn's own RPM repo
        echo "  yarnpkg not in EPEL; adding Yarn repo..."
        ${SUDO} curl -fsSL https://dl.yarnpkg.com/rpm/yarn.repo \
            -o /etc/yum.repos.d/yarn.repo
        ${SUDO} dnf install "${DNF_ARGS[@]}" yarn
        echo "  Yarn: $(yarn --version) (yarn from dl.yarnpkg.com)"
    fi
fi

# ---------------------------------------------------------------------------
# Step 5/5: Go (required for building heimdall-cli)
# ---------------------------------------------------------------------------
# Distro Go packages are typically too old (1.20-1.21). We install the
# official Go tarball from go.dev which works on all EL variants.
GO_VERSION="${GO_VERSION:-1.24.4}"
echo ""
echo "=== Step 5/5: Go ==="
if command -v go >/dev/null 2>&1; then
    installed_go="$(go version | grep -oP 'go\K[0-9]+\.[0-9]+')"
    echo "  Go: $(go version) (already installed)"
else
    arch_suffix="$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')"
    go_tarball="go${GO_VERSION}.linux-${arch_suffix}.tar.gz"
    echo "  Installing Go ${GO_VERSION}..."
    curl -fsSL "https://go.dev/dl/${go_tarball}" | ${SUDO} tar -C /usr/local -xzf -
    if [[ ! -f /etc/profile.d/golang.sh ]]; then
        echo 'export PATH=$PATH:/usr/local/go/bin' | ${SUDO} tee /etc/profile.d/golang.sh >/dev/null
    fi
    export PATH="$PATH:/usr/local/go/bin"
    echo "  Go: $(go version)"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=========================================="
echo " Build dependencies installed."
echo ""
echo " Build the RPM:"
echo "   cd heimdall-server"
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
