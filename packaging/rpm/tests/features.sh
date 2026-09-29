#!/bin/bash
set -euo pipefail
[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
runtime=/usr/libexec/heimdall-server/runtime
source /etc/heimdall-server/backend.env
[[ $DATABASE_NAME == heimdall-server-production ]]
pg=(runuser -u heimdall-postgres -- "$runtime/postgresql/bin/psql"
  -h /run/heimdall-postgresql -p 55432 -U heimdall-postgres -v ON_ERROR_STOP=1 -At)
query() { "${pg[@]}" -d "$DATABASE_NAME" -c "$1"; }
migrations=$(query 'SELECT COUNT(*) FROM "SequelizeMeta"')
tables=$(query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-recovery-env.sha256
find /var/lib/heimdall-caddy -type f \( -name root.crt -o -name root.key \) -exec sha256sum {} \; > /tmp/rpm-recovery-ca.sha256
find /etc/heimdall-server/caddy -type f -exec sha256sum {} \; > /tmp/rpm-recovery-caddy.sha256
mkdir -p /tmp/heimdall-recovery
heimdall-cli backup --output /tmp/heimdall-recovery
archive=$(find /tmp/heimdall-recovery -maxdepth 1 -name '*.tar.gz' -print -quit)
test -s "$archive"
[[ $(stat -c %a "$archive") == 600 ]]
tar -tzf "$archive" > /tmp/rpm-recovery-members
grep -q '/database.sql$' /tmp/rpm-recovery-members
grep -q '/caddy-config/' /tmp/rpm-recovery-members
grep -q '/caddy-state/' /tmp/rpm-recovery-members
if grep -Eq 'PG_VERSION|/base/[0-9]+/' /tmp/rpm-recovery-members; then exit 1; fi
systemctl stop heimdall-server heimdall-caddy
"${pg[@]}" -d postgres -c "DROP DATABASE \"$DATABASE_NAME\""
"${pg[@]}" -d postgres -c "CREATE DATABASE \"$DATABASE_NAME\" OWNER \"$DATABASE_USERNAME\""
[[ $(query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'") == 0 ]]
invalid=$(mktemp -d)
cp /etc/heimdall-server/backend.env "$invalid/backend.env"
printf 'SELECT rpm_test_missing_function();\nSELECT 1;\n' > "$invalid/database.sql"
tar -czf /tmp/rpm-invalid-recovery.tar.gz -C "$invalid" backend.env database.sql
if heimdall-cli restore /tmp/rpm-invalid-recovery.tar.gz > /tmp/rpm-invalid-restore.log 2>&1; then
  cat /tmp/rpm-invalid-restore.log
  echo 'Restore incorrectly accepted a SQL error.' >&2
  exit 1
fi
if systemctl is-active --quiet heimdall-server; then exit 1; fi
cat /tmp/rpm-invalid-restore.log
# The other entries are valid; only the escaping Caddy member must be rejected.
printf 'SELECT 1;\n' > "$invalid/database.sql"
printf 'must not escape\n' > "$invalid/payload"
tar -czf /tmp/rpm-traversal-recovery.tar.gz -C "$invalid" \
  --transform='s|^payload$|caddy-state/../../../tmp/rpm-escaped|' backend.env database.sql payload
if heimdall-cli restore /tmp/rpm-traversal-recovery.tar.gz > /tmp/rpm-traversal.log 2>&1; then
  echo 'Restore incorrectly accepted a traversal entry.' >&2
  exit 1
fi
test ! -e /tmp/rpm-escaped
rm -rf "$invalid"
# Prove private CA files return from the backup, not merely from retained state.
find /var/lib/heimdall-caddy -type f \( -name root.crt -o -name root.key \) -delete
printf '\nRPM_RECOVERY_FIXTURE=changed\n' >> /etc/heimdall-server/backend.env
heimdall-cli restore "$archive" 2>&1 | tee /tmp/rpm-restore.log
if systemctl is-active --quiet heimdall-server; then exit 1; fi
[[ $(query 'SELECT id FROM rpm_test_sentinel') == 1 ]]
[[ $(query 'SELECT COUNT(*) FROM "SequelizeMeta"') == "$migrations" ]]
[[ $(query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'") == "$tables" ]]
sha256sum --check /tmp/rpm-recovery-env.sha256 /tmp/rpm-recovery-ca.sha256 /tmp/rpm-recovery-caddy.sha256
[[ $(stat -c '%U:%G:%a' /etc/heimdall-server/backend.env) == root:heimdall:640 ]]
mapfile -t private_keys < <(find /var/lib/heimdall-caddy -type f -name root.key)
[[ ${#private_keys[@]} == 1 ]]
[[ $(stat -c '%U:%G:%a' "${private_keys[0]}") == heimdall-caddy:heimdall-caddy:600 ]]
heimdall-cli setup --non-interactive
bash /tmp/rpm-tests/lifecycle.sh verify
# Selected private proxy must follow port changes, retaining its CA and secrets.
heimdall-cli set-port 3001
mapfile -t roots < <(find /var/lib/heimdall-caddy -name root.crt -type f)
curl --fail --silent --show-error --retry 30 --retry-connrefused --retry-delay 1 \
  --retry-max-time 60 --max-time 5 --noproxy '*' --cacert "${roots[0]}" \
  --resolve heimdall.example.test:443:127.0.0.1 https://heimdall.example.test/health/ready \
  -o /tmp/rpm-port-ready.json
"$runtime/node/bin/node" -e 'if(require("/tmp/rpm-port-ready.json").status!=="ok") process.exit(1)'
heimdall-cli set-port 3000
bash /tmp/rpm-tests/lifecycle.sh verify
