#!/bin/bash
set -euo pipefail
topdir=${1:?Usage: cli-inputs.sh ABSOLUTE_TOPDIR}
[[ "$topdir" = /* ]] || { echo 'TOPDIR must be absolute' >&2; exit 64; }
[[ -x "$topdir/SOURCES/heimdall-cli" ]] || exit 1
[[ -s "$topdir/SOURCES/heimdall-cli-man.tar.gz" ]] || exit 1
members=$(tar -tzf "$topdir/SOURCES/heimdall-cli-man.tar.gz")
grep -qx 'man1/heimdall-cli.1' <<< "$members"
grep -qx 'man1/heimdall-cli-setup.1' <<< "$members"
