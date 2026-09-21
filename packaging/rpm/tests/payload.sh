#!/bin/bash
set -euo pipefail
rpm_file=$(realpath "$1")
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
[[ $(rpm -qp --qf '%{VERSION}' "$rpm_file") == 2.14.0 ]]
[[ $(rpm -qp --qf '%{ARCH}' "$rpm_file") == "$(rpm -E '%{_arch}')" ]]
(cd "$scratch" && rpm2cpio "$rpm_file" | cpio -idm --quiet)
app="$scratch/usr/share/heimdall-server"
test -s "$app/apps/backend/dist/src/main.js"
test -s "$app/apps/backend/dist/db/database.js"
test -s "$app/dist/frontend/index.html"
test -x "$app/apps/backend/node_modules/.bin/sequelize"
test -e "$app/libs/password-complexity/index.js"
[[ $(node -p "require(process.argv[1]).version" "$app/apps/backend/package.json") == 2.14.0 ]]
find "$app/apps/backend/node_modules" -xtype l > "$scratch/broken-links"
test ! -s "$scratch/broken-links"
rpm -qp --requires "$rpm_file" > "$scratch/requires"
grep -q 'nodejs(engine) >= 22.18.0' "$scratch/requires"
