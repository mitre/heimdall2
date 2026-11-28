#!/bin/bash
set -euo pipefail
printf '%s\n' 'This installer is retired. Run sudo heimdall-cli setup --reconfigure to edit configuration, or sudo heimdall-cli setup --interactive for full setup.' >&2
exit 64
