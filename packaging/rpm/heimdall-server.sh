#!/bin/bash
set -euo pipefail

APP_ROOT="/usr/share/heimdall-server"
APP_DIR="${APP_ROOT}/apps/backend"
ENV_FILE="/etc/heimdall-server/backend.env"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

if [[ -z "${DATABASE_PASSWORD:-}" ]]; then
  echo "DATABASE_PASSWORD is not set in ${ENV_FILE}." >&2
  echo "Run /usr/bin/heimdall-server-setup --non-interactive to generate and apply a secure password." >&2
  exit 1
fi

cd "${APP_DIR}"

# If LOG_FILE is set, redirect stdout/stderr to the log file.
# Default (unset): logs go to journald via systemd.
# Example: LOG_FILE=/var/log/heimdall-server/server.log
if [[ -n "${LOG_FILE:-}" ]]; then
  LOG_DIR="$(dirname "${LOG_FILE}")"
  if [[ ! -d "${LOG_DIR}" ]]; then
    mkdir -p "${LOG_DIR}"
    chown heimdall:heimdall "${LOG_DIR}" 2>/dev/null || true
  fi
  exec /usr/bin/node dist/src/main.js >> "${LOG_FILE}" 2>&1
else
  exec /usr/bin/node dist/src/main.js
fi
