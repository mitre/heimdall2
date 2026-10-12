#!/bin/bash
# /server is metadata, so also verify the migrated database and an authenticated read.
set -euo pipefail
base_url=${1:?application URL}
shift
runtime=/usr/libexec/heimdall-server/runtime
node="$runtime/node/bin/node"
source /etc/heimdall-server/backend.env
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
curl_args=(--fail --silent --show-error --retry 30 --retry-connrefused
  --retry-delay 1 --retry-max-time 90 --connect-timeout 2 --max-time 10 --noproxy '*' "$@")
curl "${curl_args[@]}" "$base_url/server" -o "$scratch/server.json"
"$node" - "$scratch/server.json" "$EXTERNAL_URL" <<'NODE'
const assert = require('assert');
const settings = require(process.argv[2]);
assert.strictEqual(settings.localLoginEnabled, true);
assert.strictEqual(settings.externalUrl, process.argv[3]);
NODE
query() {
  PGPASSWORD="$DATABASE_PASSWORD" PGCONNECT_TIMEOUT=5 "$runtime/postgresql/bin/psql" \
    -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USERNAME" \
    -v ON_ERROR_STOP=1 -At -d "$DATABASE_NAME" -c "$1"
}
expected=$(find /usr/share/heimdall-server/apps/backend/migrations -maxdepth 1 -name '*.js' -type f | wc -l)
migrations=$(query 'SELECT COUNT(*) FROM "SequelizeMeta"')
[[ $migrations -eq $expected ]]
user_id=$(query "SELECT id FROM \"Users\" WHERE email = 'rpm-test@example.invalid' AND role = 'admin' AND \"creationMethod\" = 'local'")
[[ $user_id =~ ^[0-9]+$ ]]
curl "${curl_args[@]}" -H 'Content-Type: application/json' \
  --data '{"email":"rpm-test@example.invalid","password":"Rpm-Smoke-Only-2026!"}' \
  "$base_url/authn/login" -o "$scratch/login.json"
token=$("$node" - "$scratch/login.json" "$user_id" <<'NODE'
const assert = require('assert');
const login = require(process.argv[2]);
assert.strictEqual(login.userID, process.argv[3]);
assert.ok(typeof login.accessToken === 'string' && login.accessToken.length > 0);
process.stdout.write(login.accessToken);
NODE
)
# Master can return the first token before persisting its per-user JWT secret.
for attempt in {1..10}; do
  result=0
  status=$(curl "${curl_args[@]}" -H "Authorization: Bearer $token" --write-out '%{http_code}' \
    "$base_url/users/$user_id" -o "$scratch/user.json") || result=$?
  [[ $result != 0 ]] || break
  if [[ $result != 22 || $status != 401 || $attempt == 10 ]]; then exit "$result"; fi
  sleep 1
done
"$node" - "$scratch/user.json" "$user_id" <<'NODE'
const assert = require('assert');
const user = require(process.argv[2]);
assert.strictEqual(user.id, process.argv[3]);
assert.strictEqual(user.email, 'rpm-test@example.invalid');
assert.strictEqual(user.role, 'admin');
NODE
