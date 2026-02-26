#!/bin/bash
set -euo pipefail

APP_ROOT="/usr/share/heimdall-server"
APP_DIR="${APP_ROOT}/apps/backend"
ENV_FILE="/etc/heimdall-server/backend.env"
TSX_BIN="${APP_DIR}/node_modules/.bin/tsx"
SEQUELIZE_BIN="${APP_DIR}/node_modules/.bin/sequelize"

usage() {
  echo "Usage: $0 [--skip-seed]" >&2
}

SKIP_SEED=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-seed)
      SKIP_SEED=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 64
      ;;
  esac
done

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1091
  if ! source "${ENV_FILE}"; then
    set +a
    echo "Failed to parse ${ENV_FILE}" >&2
    exit 1
  fi
  set +a
fi

export NODE_ENV="${NODE_ENV:-production}"

if [[ ! -d "${APP_DIR}" ]]; then
  echo "Application directory not found: ${APP_DIR}" >&2
  exit 1
fi

if [[ ! -x "${TSX_BIN}" || ! -x "${SEQUELIZE_BIN}" ]]; then
  echo "Missing required executables in ${APP_DIR}/node_modules/.bin" >&2
  exit 1
fi

run_sequelize() {
  "${TSX_BIN}" "${SEQUELIZE_BIN}" "$@"
}

cd "${APP_DIR}"

run_sequelize db:create
run_sequelize db:migrate

if [[ "${SKIP_SEED}" -eq 0 ]]; then
  run_sequelize db:seed:all
fi
