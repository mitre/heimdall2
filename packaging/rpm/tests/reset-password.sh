#!/bin/bash
set -euo pipefail
[[ ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
[[ -e /.dockerenv ]] || exit 64
umask 077
source /etc/heimdall-server/backend.env
runtime=/usr/libexec/heimdall-server/runtime
scratch=$(mktemp -d)
export PGPASSWORD="$DATABASE_PASSWORD" PGCONNECT_TIMEOUT=5
pg=("$runtime/postgresql/bin/psql" -X -v ON_ERROR_STOP=1 -At
  -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USERNAME" -d "$DATABASE_NAME")
query() {
  local sql=$1
  "${pg[@]}" -c "$sql"
}
email=rpm-test@example.invalid
before=$(query "SELECT \"encryptedPassword\" FROM \"Users\" WHERE email='$email'")
[[ -n $before ]]
others=$(query "SELECT md5(COALESCE(string_agg(\"encryptedPassword\", ',' ORDER BY id), '')) FROM \"Users\" WHERE email <> '$email'")
restore_hash() {
  result=$?
  "${pg[@]}" -v old_hash="$before" <<'SQL' >/dev/null || result=1
UPDATE "Users" SET "encryptedPassword" = :'old_hash' WHERE email = 'rpm-test@example.invalid';
SQL
  rm -rf "$scratch"
  exit "$result"
}
trap restore_hash EXIT
if heimdall-cli reset-password missing-reset-user@example.invalid </dev/null >"$scratch/missing.log" 2>&1; then exit 1; fi
if grep -q 'New password:' "$scratch/missing.log"; then exit 1; fi
if PGOPTIONS='-c default_transaction_read_only=on' heimdall-cli reset-password "$email" </dev/null >"$scratch/readonly.log" 2>&1; then exit 1; fi
if grep -q 'New password:' "$scratch/readonly.log"; then exit 1; fi
[[ $(query "SELECT \"encryptedPassword\" FROM \"Users\" WHERE email='$email'") == "$before" ]]
heimdall-cli reset-password "$email" --password 'aB1!cD2@eF3#gH4$' </dev/null >"$scratch/reset.log" 2>&1
[[ $(query "SELECT \"encryptedPassword\" FROM \"Users\" WHERE email='$email'") != "$before" ]]
[[ $(query "SELECT (NOT \"forcePasswordChange\" AND \"passwordChangedAt\" IS NOT NULL AND \"updatedAt\" IS NOT NULL) FROM \"Users\" WHERE email='$email'") == t ]]
[[ $(query "SELECT md5(COALESCE(string_agg(\"encryptedPassword\", ',' ORDER BY id), '')) FROM \"Users\" WHERE email <> '$email'") == "$others" ]]
curl --fail --silent --show-error --noproxy '*' -H 'Content-Type: application/json' \
  --data '{"email":"rpm-test@example.invalid","password":"aB1!cD2@eF3#gH4$"}' \
  "http://127.0.0.1:$PORT/authn/login" >"$scratch/login.json"
"$runtime/node/bin/node" - "$scratch/login.json" <<'NODE'
const assert = require('node:assert/strict');
const login = require(process.argv[2]);
assert.equal(typeof login.accessToken, 'string');
assert.ok(login.accessToken.length > 0);
assert.ok(login.userID);
NODE
printf 'PASS actual reset-password, SQL failures, and application login\n'
