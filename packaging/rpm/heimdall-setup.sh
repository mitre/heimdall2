#!/bin/bash
set -euo pipefail

CONFIGURE_BIN="/usr/libexec/heimdall-server/configure.sh"
POSTGRES_SETUP_BIN="/usr/libexec/heimdall-server/postgres-setup.sh"
DB_SETUP_BIN="/usr/bin/heimdall-server-db-setup"
SERVICE_NAME="heimdall-server.service"
SETUP_MODE="auto"

usage() {
  echo "Usage: $0 [--auto|--interactive|--non-interactive]" >&2
}

case "${1:-}" in
  "")
    ;;
  --auto)
    shift
    ;;
  --interactive)
    SETUP_MODE="interactive"
    shift
    ;;
  --non-interactive)
    SETUP_MODE="non-interactive"
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

if [[ $# -gt 0 ]]; then
  usage
  exit 64
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root (use sudo)." >&2
  exit 1
fi

case "${SETUP_MODE}" in
  interactive)
    "${CONFIGURE_BIN}" --interactive
    ;;
  non-interactive)
    "${CONFIGURE_BIN}" --non-interactive
    ;;
  auto)
    "${CONFIGURE_BIN}"
    ;;
esac

"${POSTGRES_SETUP_BIN}"
"${DB_SETUP_BIN}"

if command -v systemctl >/dev/null 2>&1; then
  systemctl enable --now "${SERVICE_NAME}"
fi

echo "Heimdall server setup completed."
