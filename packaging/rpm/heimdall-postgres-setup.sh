#!/bin/bash
set -euo pipefail
printf '%s\n' 'This installer is retired. Run sudo heimdall-cli setup --database-mode bundled or --database-mode external. No system PostgreSQL service is configured by this helper.' >&2
exit 64
