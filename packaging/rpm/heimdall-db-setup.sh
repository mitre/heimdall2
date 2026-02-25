#!/bin/bash
set -euo pipefail

APP_ROOT="/usr/share/heimdall-server"
APP_DIR="${APP_ROOT}/apps/backend"
ENV_FILE="/etc/heimdall-server/backend.env"
TSX_BIN="${APP_DIR}/node_modules/.bin/tsx"
SEQUELIZE_BIN="${APP_DIR}/node_modules/.bin/sequelize"

SKIP_SEED=0
if [[ "${1:-}" == "--skip-seed" ]]; then
  SKIP_SEED=1
fi

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ENV_FILE}"
  set +a
fi

export NODE_ENV="${NODE_ENV:-production}"

cd "${APP_DIR}"

"${TSX_BIN}" "${SEQUELIZE_BIN}" db:create
"${TSX_BIN}" "${SEQUELIZE_BIN}" db:migrate

if [[ "${SKIP_SEED}" -eq 0 ]]; then
  "${TSX_BIN}" "${SEQUELIZE_BIN}" db:seed:all
fi
