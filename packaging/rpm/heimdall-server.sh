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

if [[ -z "${DATABASE_PASSWORD:-}" ]]; then
  echo "DATABASE_PASSWORD is not set in ${ENV_FILE}." >&2
  echo "Run /usr/bin/heimdall-server-setup --non-interactive to generate and apply a secure password." >&2
  exit 1
fi

cd "${APP_DIR}"
exec /usr/bin/node dist/src/main.js
