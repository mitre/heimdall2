#!/bin/bash
set -euo pipefail
[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || {
  echo 'Run only in a disposable RPM test container with HEIMDALL_RPM_TEST=1.' >&2
  exit 64
}
source /etc/heimdall-server/backend.env
[[ $DATABASE_NAME == heimdall-server-production ]]
query() {
  runuser -u postgres -- /usr/pgsql-18/bin/psql \
    -v ON_ERROR_STOP=1 -At -d "$DATABASE_NAME" -c "$1"
}
migrations=$(query 'SELECT COUNT(*) FROM "SequelizeMeta"')
tables=$(query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-recovery-env.sha256
mkdir -p /tmp/heimdall-recovery
heimdall-cli backup --output /tmp/heimdall-recovery
archive=$(find /tmp/heimdall-recovery -maxdepth 1 -name '*.tar.gz' -print -quit)
test -s "$archive"
tar -tzf "$archive" > /tmp/rpm-recovery-members
grep -q '/database.sql$' /tmp/rpm-recovery-members
systemctl stop heimdall-server
runuser -u postgres -- /usr/pgsql-18/bin/dropdb "$DATABASE_NAME"
runuser -u postgres -- /usr/pgsql-18/bin/createdb --owner "$DATABASE_USERNAME" "$DATABASE_NAME"
[[ $(query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'") == 0 ]]
# Ending with valid SQL catches psql's default of continuing after an error.
invalid=$(mktemp -d)
cp /etc/heimdall-server/backend.env "$invalid/backend.env"
printf 'SELECT rpm_test_missing_function();\nSELECT 1;\n' > "$invalid/database.sql"
tar -czf /tmp/rpm-invalid-recovery.tar.gz -C "$invalid" backend.env database.sql
rm -rf "$invalid"
if heimdall-cli restore /tmp/rpm-invalid-recovery.tar.gz > /tmp/rpm-invalid-restore.log 2>&1; then
  cat /tmp/rpm-invalid-restore.log
  echo 'Restore incorrectly accepted a SQL error.' >&2
  exit 1
fi
cat /tmp/rpm-invalid-restore.log
printf '\nRPM_RECOVERY_FIXTURE=changed\n' >> /etc/heimdall-server/backend.env
heimdall-cli restore "$archive" 2>&1 | tee /tmp/rpm-restore.log
if grep -Eq 'ERROR:|FAILED|restore failed' /tmp/rpm-restore.log; then exit 1; fi
[[ $(query 'SELECT id FROM rpm_test_sentinel') == 1 ]]
[[ $(query 'SELECT COUNT(*) FROM "SequelizeMeta"') == "$migrations" ]]
[[ $(query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'") == "$tables" ]]
sha256sum --check /tmp/rpm-recovery-env.sha256
systemctl restart heimdall-server
bash /tmp/rpm-tests/lifecycle.sh verify

# OL8's EPEL repository is ol8_developer_EPEL, not the Fedora epel repo ID.
dnf install -y oracle-epel-release-el8 dnf-plugins-core
dnf config-manager --set-enabled ol8_codeready_builder ol8_developer_EPEL
dnf repolist --enabled
dnf info --available caddy
dnf install -y caddy
rpm -q caddy
heimdall-cli setup --non-interactive --external-url https://rpm.example.test
systemctl is-active --quiet caddy
systemctl is-active --quiet heimdall-server
ca=/var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt
for attempt in $(seq 1 30); do
  [[ ! -s $ca ]] || break
  sleep 1
done
test -s "$ca"
curl --fail --silent --show-error --retry 10 --retry-connrefused \
  --retry-delay 1 --retry-max-time 60 --max-time 10 --noproxy rpm.example.test \
  --cacert "$ca" --resolve rpm.example.test:443:127.0.0.1 \
  https://rpm.example.test/health/ready -o /tmp/rpm-tls-ready.json
node -e 'if(require("/tmp/rpm-tls-ready.json").status!=="ok") process.exit(1)'
