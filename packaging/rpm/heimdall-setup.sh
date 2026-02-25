#!/bin/bash
set -euo pipefail

CONFIGURE_BIN="/usr/libexec/heimdall-server/configure.sh"
POSTGRES_SETUP_BIN="/usr/libexec/heimdall-server/postgres-setup.sh"
DB_SETUP_BIN="/usr/bin/heimdall-server-db-setup"
SERVICE_NAME="heimdall-server.service"
SETUP_MODE="interactive"

if [[ "${1:-}" == "--non-interactive" ]]; then
  SETUP_MODE="non-interactive"
  shift
elif [[ "${1:-}" == "--interactive" ]]; then
  shift
fi

if [[ $# -gt 0 ]]; then
  echo "Usage: $0 [--interactive|--non-interactive]" >&2
  exit 64
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root (use sudo)." >&2
  exit 1
fi

if [[ "${SETUP_MODE}" == "interactive" ]]; then
  "${CONFIGURE_BIN}" --interactive
else
  "${CONFIGURE_BIN}" --non-interactive
fi
"${POSTGRES_SETUP_BIN}"
"${DB_SETUP_BIN}"

if command -v systemctl >/dev/null 2>&1; then
  systemctl enable --now "${SERVICE_NAME}"
fi

echo "Heimdall server setup completed."
