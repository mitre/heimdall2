#!/bin/bash
set -euo pipefail

APP_ROOT="/usr/share/heimdall-server"
APP_DIR="${APP_ROOT}/apps/backend"
ENV_FILE="/etc/heimdall-server/backend.env"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ENV_FILE}"
  set +a
fi

cd "${APP_DIR}"
exec /usr/bin/node dist/src/main.js
