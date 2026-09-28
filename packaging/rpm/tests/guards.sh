#!/bin/bash
# Refuse destructive fixture entry points without an explicit container opt-in.
set -euo pipefail
tests=$(cd "$(dirname "$0")" && pwd)
unset HEIMDALL_RPM_TEST RPM_TEST_GPG_KEY
reject() {
  local result=0
  bash "$tests/$1" "${@:2}" >/dev/null 2>&1 || result=$?
  [[ $result == 64 ]] || {
    echo "$1 returned $result instead of refusing the unsafe invocation (64)." >&2
    exit 1
  }
}
reject lifecycle.sh verify
reject features.sh
reject sign-rpms.sh --container /tmp/unused-key /tmp/unused.rpm
reject run-lifecycle.sh linux/arm64 /tmp/unused.rpm /tmp/unused.rpm
reject remote-database.sh linux/arm64 /tmp/unused.rpm
echo 'RPM test entry point guards: PASS'
