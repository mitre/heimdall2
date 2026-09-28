#!/bin/bash
set -euo pipefail
rpm_file=$(realpath "${1:?RPM file}")
expected_version=${2:?expected version}
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
[[ $(rpm -qp --qf '%{VERSION}' "$rpm_file") == "$expected_version" ]]
[[ $(rpm -qp --qf '%{ARCH}' "$rpm_file") == "$(rpm -E '%{_arch}')" ]]
(cd "$scratch" && rpm2cpio "$rpm_file" | cpio -idm --quiet)
app="$scratch/usr/share/heimdall-server"
test -s "$app/apps/backend/dist/src/main.js"
test -s "$app/apps/backend/dist/db/database.js"
test -s "$app/dist/frontend/index.html"
test -x "$app/apps/backend/node_modules/.bin/sequelize"
test -e "$app/libs/password-complexity/index.js"
[[ $(node -p "require(process.argv[1]).version" "$app/apps/backend/package.json") == "$expected_version" ]]
find "$app/apps/backend/node_modules" -xtype l > "$scratch/broken-links"
test ! -s "$scratch/broken-links"
test -s "$app/apps/backend/seed-support/demo-seed-helpers.js"
static_root=$(sed -n 's/^Environment=HEIMDALL_STATIC_ROOT=//p' "$scratch/usr/lib/systemd/system/heimdall-server.service")
test -n "$static_root"
HEIMDALL_STATIC_ROOT="$scratch$static_root" NODE_ENV=production node - "$app/apps/backend" <<'NODE'
const fs = require('fs');
const path = require('path');
const backend = process.argv[2];
const {frontendRoot} = require(path.join(backend, 'dist/src/config/static-paths.js'));
require('assert').ok(fs.statSync(path.join(frontendRoot(), 'index.html')).size > 0);
require(path.join(backend, 'seed-support/demo-seed-helpers.js'));
for (const file of fs.readdirSync(path.join(backend, 'seeders'))) {
  if (file.endsWith('.js')) require(path.join(backend, 'seeders', file));
}
NODE
test -x "$scratch/usr/bin/heimdall-cli"
find "$scratch/usr/share/man/man1" -name 'heimdall-cli-setup.1*' | grep -q .
test -s "$scratch/usr/libexec/heimdall-server/heimdall-Caddyfile"
test -s "$scratch/usr/share/selinux/packages/heimdall-server.pp"
rpm -qp --requires "$rpm_file" > "$scratch/requires"
grep -q 'nodejs(engine) >= 22.18.0' "$scratch/requires"
