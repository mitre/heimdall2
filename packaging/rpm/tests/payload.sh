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
runtime="$scratch/usr/libexec/heimdall-server/runtime"
test -x "$runtime/node/bin/node"
test -x "$runtime/postgresql/bin/postgres"
test -x "$runtime/postgresql/bin/initdb"
test -x "$runtime/postgresql/bin/psql"
test -x "$runtime/postgresql/bin/pg_dump"
test -x "$runtime/caddy/caddy"
test -s "$app/runtime-manifest.json"
[[ $("$runtime/node/bin/node" --version) == v22.23.3 ]]
"$runtime/caddy/caddy" version
test ! -e "$scratch/usr/bin/node"
test ! -e "$scratch/usr/bin/psql"
test ! -e "$scratch/usr/bin/caddy"
test -s "$scratch/usr/lib/systemd/system/heimdall-postgresql.service"
test -s "$scratch/usr/lib/systemd/system/heimdall-caddy.service"
for notice in node/LICENSE postgresql/COPYRIGHT caddy/LICENSE; do
  test -s "$scratch/usr/share/licenses/heimdall-server/$notice"
done
test -s "$app/apps/backend/dist/src/main.js"
test -s "$app/apps/backend/dist/db/database.js"
test -s "$app/dist/frontend/index.html"
test -x "$app/apps/backend/node_modules/.bin/sequelize"
test -e "$app/libs/password-complexity/index.js"
[[ $("$runtime/node/bin/node" -p "require(process.argv[1]).version" "$app/apps/backend/package.json") == "$expected_version" ]]
find "$app/apps/backend/node_modules" -xtype l > "$scratch/broken-links"
test ! -s "$scratch/broken-links"
test -s "$app/apps/backend/seed-support/demo-seed-helpers.js"
static_root=$(sed -n 's/^Environment=HEIMDALL_STATIC_ROOT=//p' "$scratch/usr/lib/systemd/system/heimdall-server.service")
test -n "$static_root"
HEIMDALL_STATIC_ROOT="$scratch$static_root" NODE_ENV=production "$runtime/node/bin/node" - "$app/apps/backend" <<'NODE'
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
! grep -Eq '^(nodejs|postgresql|caddy)([ (>=]|$)' "$scratch/requires" || exit 1
! grep -Eq '^lib(pq|ecpg|pgtypes)' "$scratch/requires" || exit 1
for library in libc libstdc++ libssl libcrypto libicuuc libz; do
  grep -Fq "$library.so." "$scratch/requires"
done
rpm -qp --provides "$rpm_file" > "$scratch/provides"
! grep -Eq '^(nodejs\(engine\)|lib(pq|ecpg|pgtypes))' "$scratch/provides" || exit 1
grep -Fxq 'bundled(nodejs) = 22.23.3' "$scratch/provides"
grep -Fxq 'bundled(postgresql) = 18.6' "$scratch/provides"
grep -Fxq 'bundled(caddy) = 2.11.4' "$scratch/provides"
