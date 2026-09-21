#!/bin/bash
set -euo pipefail

repo=$(cd "$(dirname "$0")/../../.." && pwd)
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
fixture="$scratch/source"
mkdir -p "$fixture/packaging" "$fixture/apps/backend" "$fixture/apps/frontend"
cp -a "$repo/packaging/rpm" "$fixture/packaging/rpm"
printf '{"version":"2.14.0"}\n' > "$fixture/apps/backend/package.json"
printf '{"version":"2.14.0"}\n' > "$fixture/apps/frontend/package.json"

stage() {
  bash "$fixture/packaging/rpm/setup-rpm-build-env.sh" \
    --skip-deps --topdir "$scratch/output"
}

stage
tar -xOf "$scratch/output/SOURCES/heimdall2-2.14.0.tar.gz" \
  heimdall2-2.14.0/./apps/backend/package.json > "$scratch/backend.json"
python3 -c 'import json,sys; assert json.load(open(sys.argv[1]))["version"] == "2.14.0"' \
  "$scratch/backend.json"

printf '{"version":"0.0.1"}\n' > "$fixture/apps/backend/package.json"
if stage > "$scratch/mismatch.log" 2>&1; then
  echo 'Mismatched versions were accepted.' >&2
  exit 1
fi
grep -q 'version mismatch' "$scratch/mismatch.log"

printf '{"version":"2.14.0"}\n' > "$fixture/apps/backend/package.json"
git -C "$fixture" init -q
git -C "$fixture" add .
git -C "$fixture" -c user.name=RPM-Test -c user.email=rpm-test@example.invalid \
  commit -qm fixture
stage
printf '\n# local change\n' >> "$fixture/packaging/rpm/heimdall-server.sh"
if stage > "$scratch/dirty.log" 2>&1; then
  echo 'Uncommitted build input was accepted.' >&2
  exit 1
fi
grep -q 'uncommitted' "$scratch/dirty.log"
git -C "$fixture" checkout -- packaging/rpm/heimdall-server.sh
git -C "$fixture" worktree add --detach "$scratch/linked" HEAD
bash "$scratch/linked/packaging/rpm/setup-rpm-build-env.sh" \
  --skip-deps --topdir "$scratch/linked-output"
tar -tzf "$scratch/linked-output/SOURCES/heimdall2-2.14.0.tar.gz" \
  > "$scratch/members"
if grep -Eq '(^|/)\.git(/|$)' "$scratch/members"; then
  echo 'Source archive contains Git metadata.' >&2
  exit 1
fi
