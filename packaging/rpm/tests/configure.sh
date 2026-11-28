#!/bin/bash
# Retired installers must reject every invocation before any installer work.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
for helper in heimdall-configure.sh heimdall-postgres-setup.sh; do
  result=0
  output=$(bash "$root/$helper" --help 2>&1) || result=$?
  [[ $result -eq 64 ]]
  [[ $output == *'heimdall-cli setup'* ]]
done
printf '%s\n' 'retired installers: actionable refusal passed'
