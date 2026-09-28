#!/bin/bash
set -euo pipefail

usage() {
  echo 'Usage: setup-rpm-build-env.sh [--build] [--skip-deps] [--dev] [--topdir PATH]'
}
target=stage
deps=1
topdir="${HOME}/rpmbuild-heimdall"
dev=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --build) target=rpm; shift ;;
    --skip-deps) deps=0; shift ;;
    --dev) dev=1; shift ;;
    --topdir)
      [[ $# -ge 2 && -n "$2" && "$2" != --* ]] || { usage >&2; exit 64; }
      topdir=$2; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unsupported option: $1" >&2; usage >&2; exit 64 ;;
  esac
done
topdir=$(python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "$topdir")
cd "$(dirname "$0")"
# Dependency installation runs in a child process; keep its selected Go on PATH.
export PATH="/opt/heimdall-build/go-${GO_VERSION:-1.25.8}/bin:$PATH"
if [[ $deps -eq 1 ]]; then make deps; fi
exec make "$target" "TOPDIR=$topdir" "DEV=$dev"
