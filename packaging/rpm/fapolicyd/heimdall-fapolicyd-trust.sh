#!/bin/bash
# Manage fapolicyd trust entries for heimdall-server bundled binaries.
# The RPM backend filters /usr/share from the trust database, so the
# bundled Node.js binary and native .node addons must be explicitly trusted.
#
# Usage: heimdall-fapolicyd-trust.sh {add|remove}

set -euo pipefail

TRUST_FILE="heimdall-server"
APP_DIR="/usr/share/heimdall-server"

add_trust() {
  # Add the main node binary
  if [[ -x "${APP_DIR}/node" ]]; then
    fapolicyd-cli --file add "${APP_DIR}/node" --trust-file "${TRUST_FILE}" 2>/dev/null || true
  fi

  # Add all native .node addon files (ELF shared objects loaded via dlopen)
  find "${APP_DIR}" -name '*.node' -type f 2>/dev/null | while IFS= read -r addon; do
    fapolicyd-cli --file add "${addon}" --trust-file "${TRUST_FILE}" 2>/dev/null || true
  done

  # Reload fapolicyd if running
  if systemctl is-active --quiet fapolicyd 2>/dev/null; then
    fapolicyd-cli --update 2>/dev/null || true
  fi
}

remove_trust() {
  # Remove the trust file
  rm -f "/etc/fapolicyd/trust.d/${TRUST_FILE}" 2>/dev/null || true

  # Reload fapolicyd if running
  if systemctl is-active --quiet fapolicyd 2>/dev/null; then
    fapolicyd-cli --update 2>/dev/null || true
  fi
}

case "${1:-}" in
  add)    add_trust ;;
  remove) remove_trust ;;
  *)
    echo "Usage: $0 {add|remove}" >&2
    exit 1
    ;;
esac
