#!/bin/bash
set -euo pipefail
if [[ $# -eq 0 && -t 0 && -t 1 ]]; then
  exec /usr/bin/heimdall-cli setup --interactive
fi
exec /usr/bin/heimdall-cli setup "$@"
