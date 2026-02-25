#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
SPEC_FILE="${SCRIPT_DIR}/heimdall-server.spec"

TOPDIR="${HOME}/rpmbuild"
RUN_BUILD=0
INSTALL_DEPS=1
RUN_DNF_UPDATE=1
ENABLE_NODESOURCE=1
ENABLE_PGDG=1
ENABLE_YARN_REPO=1
NO_GPG_CHECK=0

usage() {
  cat <<'EOF'
Usage: setup-rpm-build-env.sh [options]

Sets up an OL/EL RPM build environment for heimdall-server, stages rpmbuild
inputs, and optionally runs rpmbuild.

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

  if [[ "${ENABLE_PGDG}" -eq 1 ]]; then
    local el_major=""
    if command -v rpm >/dev/null 2>&1; then
      el_major="$(rpm -E '%{?rhel}')"
    fi
    if [[ -z "${el_major}" ]]; then
      el_major="$(. /etc/os-release && printf '%s' "${VERSION_ID%%.*}")"
    fi
    if [[ -z "${el_major}" ]]; then
      echo "Unable to determine EL major version for PGDG repo URL." >&2
      exit 1
    fi
    local pgdg_repo_url="https://download.postgresql.org/pub/repos/yum/reporpms/EL-${el_major}-x86_64/pgdg-redhat-repo-latest.noarch.rpm"
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
  version="$(awk '/^Version:/ {print $2; exit}' "${SPEC_FILE}")"
  if [[ -z "${version}" ]]; then
    echo "Unable to parse Version from ${SPEC_FILE}" >&2
    exit 1
  fi

  mkdir -p "${TOPDIR}"/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}

  cp -f "${SPEC_FILE}" "${TOPDIR}/SPECS/heimdall-server.spec"
  cp -f "${SCRIPT_DIR}/heimdall-server.service" "${TOPDIR}/SOURCES/"
  cp -f "${SCRIPT_DIR}/heimdall-backend.env" "${TOPDIR}/SOURCES/"
  cp -f "${SCRIPT_DIR}/heimdall-server.sh" "${TOPDIR}/SOURCES/"
  cp -f "${SCRIPT_DIR}/heimdall-db-setup.sh" "${TOPDIR}/SOURCES/"
  cp -f "${SCRIPT_DIR}/heimdall-configure.sh" "${TOPDIR}/SOURCES/"
  cp -f "${SCRIPT_DIR}/heimdall-postgres-setup.sh" "${TOPDIR}/SOURCES/"
  cp -f "${SCRIPT_DIR}/heimdall-setup.sh" "${TOPDIR}/SOURCES/"

  local source_archive="${TOPDIR}/SOURCES/heimdall2-${version}.tar.gz"
  if command -v git >/dev/null 2>&1 && [[ -d "${REPO_ROOT}/.git" ]]; then
    git -C "${REPO_ROOT}" archive \
      --format=tar.gz \
      --prefix="heimdall2-${version}/" \
      HEAD \
      > "${source_archive}"
  else
    tar -C "${REPO_ROOT}" \
      --exclude=".git" \
      --exclude="node_modules" \
      --exclude="apps/backend/node_modules" \
      --exclude="apps/frontend/node_modules" \
      --exclude="dist" \
      --exclude="apps/backend/dist" \
      --exclude="apps/frontend/dist" \
      --transform "s|^|heimdall2-${version}/|" \
      -czf "${source_archive}" \
      .
  fi

  echo "Staged rpmbuild inputs in ${TOPDIR}"
  echo "Spec: ${TOPDIR}/SPECS/heimdall-server.spec"
  echo "Spec arch tags:"
  grep -E '^(BuildArch|ExclusiveArch):' "${TOPDIR}/SPECS/heimdall-server.spec" \
    || echo "  (BuildArch unset, package will be built for target CPU)"
  echo "Source: ${source_archive}"
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
