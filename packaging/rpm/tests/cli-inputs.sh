#!/bin/bash
set -euo pipefail
topdir=${1:?Usage: cli-inputs.sh ABSOLUTE_TOPDIR}
[[ "$topdir" = /* ]] || { echo 'TOPDIR must be absolute' >&2; exit 64; }
test -x "$topdir/SOURCES/heimdall-cli"
test -s "$topdir/SOURCES/heimdall-cli-man.tar.gz"
members=$(tar -tzf "$topdir/SOURCES/heimdall-cli-man.tar.gz")
grep -qx 'man1/heimdall-cli.1' <<< "$members"
grep -qx 'man1/heimdall-cli-setup.1' <<< "$members"
