#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
SPEC_FILE="${SCRIPT_DIR}/heimdall-server.spec"

TOPDIR="${HOME}/rpmbuild"
RUN_BUILD=0
INSTALL_DEPS=1
RUN_DNF_UPDATE=1
ENABLE_NODESOURCE=1
ENABLE_PGDG=1
ENABLE_YARN_REPO=1
NO_GPG_CHECK=0
SOURCE_DIR=""
VERSION_OVERRIDE=""

usage() {
  cat <<'EOF'
Usage: setup-rpm-build-env.sh [options]

Sets up an OL/EL RPM build environment for heimdall-server, stages rpmbuild
inputs, and optionally runs rpmbuild.

Source tarball options (pick one):
  --source-dir <path>   Path to a local heimdall2 git checkout (creates tarball
                        via git archive or tar)
  --version <ver>       Download source tarball from GitHub release (e.g. 2.12.6)

If neither is given, the version is read from the spec file and downloaded
from GitHub.

Options:
  --topdir <path>         RPM topdir (default: ~/rpmbuild)
  --build                 Run rpmbuild -ba after setup
  --skip-deps             Skip dependency/repository installation
  --skip-update           Skip dnf update
  --skip-nodesource       Skip NodeSource setup_22.x repo bootstrap
  --skip-pgdg             Skip PGDG repository setup
  --skip-yarn-repo        Skip Yarn repository setup
  --no-gpg-check          Disable package and repo metadata GPG checks in dnf
  -h, --help              Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --topdir)
      if [[ $# -lt 2 ]]; then
        echo "--topdir requires a value" >&2
        exit 1
      fi
      TOPDIR="$2"
      shift 2
      ;;
    --source-dir)
      if [[ $# -lt 2 ]]; then
        echo "--source-dir requires a value" >&2
        exit 1
      fi
      SOURCE_DIR="$2"
      shift 2
      ;;
    --version)
      if [[ $# -lt 2 ]]; then
        echo "--version requires a value" >&2
        exit 1
      fi
      VERSION_OVERRIDE="$2"
      shift 2
      ;;
    --build)
      RUN_BUILD=1
      shift
      ;;
    --skip-deps)
      INSTALL_DEPS=0
      shift
      ;;
    --skip-update)
      RUN_DNF_UPDATE=0
      shift
      ;;
    --skip-nodesource)
      ENABLE_NODESOURCE=0
      shift
      ;;
    --skip-pgdg)
      ENABLE_PGDG=0
      shift
      ;;
    --skip-yarn-repo)
      ENABLE_YARN_REPO=0
      shift
      ;;
    --no-gpg-check)
      NO_GPG_CHECK=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

ensure_arch_specific_spec() {
  local spec_path="$1"
  if grep -Eiq '^[[:space:]]*BuildArch:[[:space:]]*noarch([[:space:]]|$)' "${spec_path}"; then
    echo "Refusing to stage a noarch spec for heimdall-server." >&2
    echo "Remove 'BuildArch: noarch' from ${spec_path} and retry." >&2
    exit 1
  fi
}

SUDO=""
if [[ "${EUID}" -ne 0 ]]; then
  SUDO="sudo"
fi

if [[ "${NO_GPG_CHECK}" -eq 1 ]]; then
  DNF_INSTALL_ARGS=(-y --nogpgcheck --setopt=*.gpgcheck=0 --setopt=*.repo_gpgcheck=0)
  DNF_UPDATE_ARGS=(-y --nogpgcheck --setopt=*.gpgcheck=0 --setopt=*.repo_gpgcheck=0)
  DNF_MODULE_ARGS=(-qy --setopt=*.gpgcheck=0 --setopt=*.repo_gpgcheck=0)
else
  DNF_INSTALL_ARGS=(-y)
  DNF_UPDATE_ARGS=(-y)
  DNF_MODULE_ARGS=(-qy)
fi

install_build_deps() {
  require_cmd dnf
  require_cmd curl

  if [[ "${RUN_DNF_UPDATE}" -eq 1 ]]; then
    ${SUDO} dnf "${DNF_UPDATE_ARGS[@]}" update
  fi

  if [[ "${ENABLE_NODESOURCE}" -eq 1 ]]; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | ${SUDO} bash -
  fi

  if [[ "${ENABLE_YARN_REPO}" -eq 1 ]]; then
    ${SUDO} curl -fsSL https://dl.yarnpkg.com/rpm/yarn.repo \
      -o /etc/yum.repos.d/yarn.repo
  fi

  # Defensive: NodeSource's Node 22 ships corepack, which can install a
  # yarn shim at /usr/bin/yarn that shadows the real yarn rpm. The shim
  # intercepts `yarn install` with bogus packageManager checks (caught
  # while building heimdall2 v2.13.1 — corepack invented a packageManager
  # value the project does not declare). RPM builds need the deterministic
  # /usr/bin/yarn from the yarn.repo, with no network calls at %build
  # time, so disable corepack's shims before installing the real rpm.
  if command -v corepack >/dev/null 2>&1; then
    ${SUDO} corepack disable yarn 2>/dev/null || true
    ${SUDO} corepack disable pnpm 2>/dev/null || true
  fi

  if [[ "${ENABLE_PGDG}" -eq 1 ]]; then
    local el_major=""
    local rpm_arch=""
    if command -v rpm >/dev/null 2>&1; then
      el_major="$(rpm -E '%{?rhel}')"
      rpm_arch="$(rpm -E '%{_arch}')"
    fi
    if [[ -z "${el_major}" ]]; then
      el_major="$(. /etc/os-release && printf '%s' "${VERSION_ID%%.*}")"
    fi
    if [[ -z "${el_major}" ]]; then
      echo "Unable to determine EL major version for PGDG repo URL." >&2
      exit 1
    fi

    if [[ -z "${rpm_arch}" || "${rpm_arch}" == "%{_arch}" ]]; then
      rpm_arch="$(uname -m)"
    fi

    local pgdg_arch=""
    case "${rpm_arch}" in
      x86_64|aarch64|ppc64le|s390x)
        pgdg_arch="${rpm_arch}"
        ;;
      *)
        echo "Unsupported architecture '${rpm_arch}' for PGDG repo bootstrap." >&2
        exit 1
        ;;
    esac

    local pgdg_repo_url="https://download.postgresql.org/pub/repos/yum/reporpms/EL-${el_major}-${pgdg_arch}/pgdg-redhat-repo-latest.noarch.rpm"
    ${SUDO} dnf install "${DNF_INSTALL_ARGS[@]}" "${pgdg_repo_url}"
    ${SUDO} dnf "${DNF_MODULE_ARGS[@]}" module disable postgresql || true
  fi

  ${SUDO} dnf install "${DNF_INSTALL_ARGS[@]}" \
    gcc-c++ \
    git \
    make \
    nodejs \
    openssl \
    python3 \
    redhat-rpm-config \
    selinux-policy-devel \
    rpm-build \
    rpmdevtools \
    systemd-rpm-macros \
    tar \
    util-linux \
    yarn

  if [[ "${ENABLE_PGDG}" -eq 1 ]]; then
    ${SUDO} dnf install "${DNF_INSTALL_ARGS[@]}" postgresql18 postgresql18-server
  fi
}

# Build the Go heimdall-cli binary for the target platform.
# Produces a static binary (CGO_ENABLED=0) with no runtime dependencies.
build_cli_binary() {
  local dest="$1"
  local cli_src="${REPO_ROOT}/heimdall-cli"
  require_cmd go

  if [[ ! -d "${cli_src}" ]]; then
    echo "heimdall-cli/ directory not found at ${cli_src}" >&2
    exit 1
  fi

  # Default to host arch; override with GOARCH env var
  local goarch="${GOARCH:-$(go env GOARCH)}"

  cd "${cli_src}"
  GOOS=linux GOARCH="${goarch}" CGO_ENABLED=0 \
    go build -trimpath \
    -ldflags="-s -w" \
    -o "${dest}" \
    ./cmd/heimdall-cli
  cd - >/dev/null

  echo "  Built heimdall-cli (linux/${goarch})"
}

# Fetch the upstream source tarball.
# Uses --source-dir (local git repo) or downloads from GitHub.
fetch_source_tarball() {
  local version="$1"
  local dest="$2"

  if [[ -n "${SOURCE_DIR}" ]]; then
    # Local heimdall2 checkout — use git archive or tar
    if [[ ! -d "${SOURCE_DIR}" ]]; then
      echo "Source directory not found: ${SOURCE_DIR}" >&2
      exit 1
    fi
    echo "  Creating source tarball from local checkout: ${SOURCE_DIR}"
    if command -v git >/dev/null 2>&1 && [[ -d "${SOURCE_DIR}/.git" ]]; then
      git -C "${SOURCE_DIR}" archive \
        --format=tar.gz \
        --prefix="heimdall2-${version}/" \
        HEAD \
        > "${dest}"
    else
      tar -C "${SOURCE_DIR}" \
        --exclude=".git" \
        --exclude="node_modules" \
        --exclude="apps/backend/node_modules" \
        --exclude="apps/frontend/node_modules" \
        --exclude="dist" \
        --exclude="apps/backend/dist" \
        --exclude="apps/frontend/dist" \
        --transform "s|^\.|heimdall2-${version}|" \
        -czf "${dest}" \
        .
    fi
  else
    # Download from GitHub
    local tag="v${version#v}"
    local url="https://github.com/mitre/heimdall2/archive/refs/tags/${tag}.tar.gz"
    echo "  Downloading source from ${url}"

    # Try scripts/fetch-source.sh first (if available in the repo)
    local fetch_script="${REPO_ROOT}/scripts/fetch-source.sh"
    if [[ -x "${fetch_script}" ]]; then
      "${fetch_script}" \
        --package heimdall-server \
        --version "${version}" \
        --output-dir "$(dirname "${dest}")"
      # fetch-source.sh names it heimdall-server-VERSION.tar.gz, rename to match spec
      local fetched="$(dirname "${dest}")/heimdall-server-${version}.tar.gz"
      if [[ -f "${fetched}" && "${fetched}" != "${dest}" ]]; then
        mv "${fetched}" "${dest}"
      fi
    elif command -v gh &>/dev/null; then
      gh release download "${tag}" \
        --repo mitre/heimdall2 \
        --archive tar.gz \
        --output "${dest}" || \
      curl -fsSL -o "${dest}" "${url}"
    else
      curl -fsSL -o "${dest}" "${url}"
    fi
  fi

  if [[ ! -f "${dest}" ]]; then
    echo "Failed to create/download source tarball" >&2
    exit 1
  fi
  echo "  Source tarball: ${dest}"
}

stage_rpm_inputs() {
  require_cmd awk
  require_cmd cp
  require_cmd tar

  if [[ ! -f "${SPEC_FILE}" ]]; then
    echo "Spec file not found: ${SPEC_FILE}" >&2
    exit 1
  fi
  ensure_arch_specific_spec "${SPEC_FILE}"

  local version
  if [[ -n "${VERSION_OVERRIDE}" ]]; then
    version="${VERSION_OVERRIDE}"
  else
    version="$(awk '/^Version:/ {print $2; exit}' "${SPEC_FILE}")"
  fi
  if [[ -z "${version}" ]]; then
    echo "Unable to determine version. Use --version or set Version in spec." >&2
    exit 1
  fi

  echo "Staging rpmbuild inputs for heimdall-server ${version}..."

  mkdir -p "${TOPDIR}"/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}

  # Spec file
  cp -f "${SPEC_FILE}" "${TOPDIR}/SPECS/heimdall-server.spec"

  # Flat source files (Source1–Source14 in the spec)
  echo "  Copying packaging files..."
  local source_files=(
    heimdall-server.service
    heimdall-backend.env
    heimdall-server.sh
    heimdall-db-setup.sh
    heimdall-configure.sh
    heimdall-postgres-setup.sh
    heimdall-setup.sh
    heimdall-server-tmpfiles.conf
    heimdall-server.repo
    heimdall-Caddyfile
    heimdall-sysconfig
    heimdall-rsyslog.conf
    heimdall-logrotate.conf
  )
  local source_file=""
  for source_file in "${source_files[@]}"; do
    cp -f "${SCRIPT_DIR}/${source_file}" "${TOPDIR}/SOURCES/"
  done

  # SELinux policy sources (Source9–Source11)
  for ext in te fc if; do
    cp -f "${SCRIPT_DIR}/selinux/"*."${ext}" "${TOPDIR}/SOURCES/" 2>/dev/null || true
  done

  # (fapolicyd helper script retired — handled by `heimdall-cli fapolicyd`)

  # firewalld service definition (Source13)
  cp -f "${SCRIPT_DIR}/firewalld/"*.xml "${TOPDIR}/SOURCES/" 2>/dev/null || true

  # Security samples (Source20-21)
  cp -f "${SCRIPT_DIR}/security/40-heimdall.rules" "${TOPDIR}/SOURCES/" 2>/dev/null || true
  cp -f "${SCRIPT_DIR}/security/SECURITY.md" "${TOPDIR}/SOURCES/" 2>/dev/null || true

  # heimdall-cli Go binary (Source15) — static binary, no runtime deps
  echo "  Building heimdall-cli binary..."
  build_cli_binary "${TOPDIR}/SOURCES/heimdall-cli"

  # Main source tarball (Source0)
  echo "  Fetching source tarball..."
  fetch_source_tarball "${version}" "${TOPDIR}/SOURCES/heimdall2-${version}.tar.gz"

  echo ""
  echo "Staged rpmbuild inputs in ${TOPDIR}"
  echo "  Spec: ${TOPDIR}/SPECS/heimdall-server.spec"
  echo "  Spec arch tags:"
  grep -E '^(BuildArch|ExclusiveArch):' "${TOPDIR}/SPECS/heimdall-server.spec" \
    || echo "    (BuildArch unset, package will be built for target CPU)"
}

run_rpmbuild() {
  require_cmd rpmbuild
  rpmbuild --define "_topdir ${TOPDIR}" -ba "${TOPDIR}/SPECS/heimdall-server.spec"
}

if [[ "${INSTALL_DEPS}" -eq 1 ]]; then
  install_build_deps
fi

stage_rpm_inputs

if [[ "${RUN_BUILD}" -eq 1 ]]; then
  run_rpmbuild
else
  echo
  echo "Next step:"
  echo "  rpmbuild --define \"_topdir ${TOPDIR}\" -ba ${TOPDIR}/SPECS/heimdall-server.spec"
fi
