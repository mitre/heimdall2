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
[[ -x "$runtime/node/bin/node" ]]
[[ -x "$runtime/postgresql/bin/postgres" ]]
[[ -x "$runtime/postgresql/bin/initdb" ]]
[[ -x "$runtime/postgresql/bin/psql" ]]
[[ -x "$runtime/postgresql/bin/pg_dump" ]]
[[ -x "$runtime/caddy/caddy" ]]
[[ -s "$app/runtime-manifest.json" ]]
[[ $("$runtime/node/bin/node" --version) == v22.23.3 ]]
"$runtime/caddy/caddy" version
[[ ! -e "$scratch/usr/bin/node" ]]
[[ ! -e "$scratch/usr/bin/psql" ]]
[[ ! -e "$scratch/usr/bin/caddy" ]]
[[ -s "$scratch/usr/lib/systemd/system/heimdall-postgresql.service" ]]
[[ -s "$scratch/usr/lib/systemd/system/heimdall-caddy.service" ]]
for notice in node/LICENSE postgresql/COPYRIGHT caddy/LICENSE; do
  [[ -s "$scratch/usr/share/licenses/heimdall-server/$notice" ]]
done
[[ -s "$app/apps/backend/dist/src/main.js" ]]
[[ -s "$app/apps/backend/dist/db/database.js" ]]
[[ -s "$app/dist/frontend/index.html" ]]
[[ -x "$app/apps/backend/node_modules/.bin/sequelize" ]]
find "$app/apps/backend/node_modules" -type f \( -name '*.json' -o -name '*.map' \) -perm /111 > "$scratch/executable-data"
[[ ! -s "$scratch/executable-data" ]]
bcrypt_cli="$app/apps/backend/node_modules/ldapauth-fork/node_modules/bcryptjs/bin/bcrypt"
[[ -x "$bcrypt_cli" ]]
! LC_ALL=C grep -q $'\r' "$bcrypt_cli" || exit 1
"$runtime/node/bin/node" --check "$bcrypt_cli"
[[ -e "$app/libs/password-complexity/index.js" ]]
[[ $("$runtime/node/bin/node" -p "require(process.argv[1]).version" "$app/apps/backend/package.json") == "$expected_version" ]]
find "$app/apps/backend/node_modules" -xtype l > "$scratch/broken-links"
[[ ! -s "$scratch/broken-links" ]]
NODE_ENV=production "$runtime/node/bin/node" - "$app/apps/backend" <<'NODE'
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const backend = process.argv[2];
const modulePath = path.join(backend, 'dist/src/app.module.js');
let staticRoot;
// Capture the compiled module's static root without initializing its database.
vm.runInNewContext(fs.readFileSync(modulePath, 'utf8'), {
  exports: {}, __dirname: path.dirname(modulePath),
  require(name) {
    if (name === 'path') return path;
    if (name === '@nestjs/common') return {Module: () => () => {}};
    if (name === '@nestjs/serve-static') return {
      ServeStaticModule: {forRoot(options) { staticRoot = options.rootPath; }}
    };
    return {};
  }
}, {filename: modulePath});
assert.strictEqual(staticRoot, path.resolve(backend, '../../dist/frontend'));
assert.ok(fs.statSync(path.join(staticRoot, 'index.html')).size > 0);
for (const file of fs.readdirSync(path.join(backend, 'seeders'))) {
  if (file.endsWith('.js')) require(path.join(backend, 'seeders', file));
}
NODE
[[ -x "$scratch/usr/bin/heimdall-cli" ]]
find "$scratch/usr/share/man/man1" -name 'heimdall-cli-setup.1*' | grep -q .
[[ -s "$scratch/usr/libexec/heimdall-server/heimdall-Caddyfile" ]]
[[ -s "$scratch/usr/share/selinux/packages/heimdall-server.pp" ]]
rpm -qp --requires "$rpm_file" > "$scratch/requires"
grep -Fxq logrotate "$scratch/requires"
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
