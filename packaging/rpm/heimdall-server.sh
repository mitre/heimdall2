#!/bin/bash
set -euo pipefail

if [[ -e /etc/heimdall-server/upgrade-pending || -L /etc/heimdall-server/upgrade-pending ]]; then
  echo 'Upgrade requires successful migrations: sudo heimdall-cli setup --non-interactive' >&2
  exit 1
fi

APP_ROOT="/usr/share/heimdall-server"
APP_DIR="${APP_ROOT}/apps/backend"
ENV_FILE="/etc/heimdall-server/backend.env"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

NODE_BIN=/usr/libexec/heimdall-server/runtime/node/bin/node
test -x "$NODE_BIN"

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
  exec "$NODE_BIN" dist/src/main.js >> "${LOG_FILE}" 2>&1
else
  exec "$NODE_BIN" dist/src/main.js
fi
