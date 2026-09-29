#!/bin/bash
# Legacy prerequisites belong only to this optional preceding-package fixture.
set -euo pipefail
[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
previous=${1:?preceding RPM}
upgrade=${2:?new RPM}
rpm --import "${RPM_TEST_GPG_KEY:?}"
for artifact in "$previous" "$upgrade"; do
  rpmkeys --checksig --verbose "$artifact" | tee /tmp/rpm-previous-signature.log
  grep -Eq 'Signature.*: OK' /tmp/rpm-previous-signature.log
done
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf module reset -y postgresql
dnf module enable -y postgresql:13
dnf install -y --setopt=install_weak_deps=False --setopt=localpkg_gpgcheck=1 "$previous" postgresql-server
cat > /etc/heimdall-server/backend.env <<'ENV'
NODE_ENV=production
ADMIN_EMAIL=rpm-test@example.invalid
ADMIN_PASSWORD=Rpm-Smoke-Only-2026!
EXTERNAL_URL=https://heimdall.example.test
LOCAL_LOGIN_DISABLED=false
ENV
heimdall-cli setup --non-interactive --skip-tls
if grep -q '^HEIMDALL_DATABASE_MODE=' /etc/heimdall-server/backend.env; then exit 1; fi
source /etc/heimdall-server/backend.env
printf '%s\0' "$DATABASE_HOST" "$DATABASE_PORT" "$DATABASE_PASSWORD" "$JWT_SECRET" "$API_KEY_SECRET" | sha256sum > /tmp/rpm-previous-secrets.sha256
runuser -u postgres -- psql -v ON_ERROR_STOP=1 -d "$DATABASE_NAME" -c \
  'CREATE TABLE rpm_previous_sentinel(id integer); INSERT INTO rpm_previous_sentinel VALUES (7)'
systemctl show -p MainPID --value postgresql > /tmp/rpm-previous-pg.pid
sha256sum /var/lib/pgsql/data/postgresql.conf /var/lib/pgsql/data/pg_hba.conf > /tmp/rpm-previous-pg.sha256
# Preserve the preceding package's default true restart preference: the new marker
# must protect against its real postun scriptlet, not a fixture that disables it.
sed -i 's/^RESTART_ON_UPGRADE=.*/RESTART_ON_UPGRADE=true/' /etc/sysconfig/heimdall-server
dnf upgrade -y --setopt=install_weak_deps=False --setopt=localpkg_gpgcheck=1 "$upgrade"
[[ $(rpm -q --qf '%{NEVRA}' heimdall-server) == "$(rpm -qp --qf '%{NEVRA}' "$upgrade")" ]]
test -e /etc/heimdall-server/upgrade-pending
if systemctl is-active --quiet heimdall-server; then exit 1; fi
systemctl is-active --quiet postgresql
[[ $(systemctl show -p MainPID --value postgresql) == "$(cat /tmp/rpm-previous-pg.pid)" ]]
sha256sum --check /tmp/rpm-previous-pg.sha256
heimdall-cli setup --non-interactive
source /etc/heimdall-server/backend.env
[[ $HEIMDALL_DATABASE_MODE == external && $HEIMDALL_PROXY_MODE == external ]]
[[ $(printf '%s\0' "$DATABASE_HOST" "$DATABASE_PORT" "$DATABASE_PASSWORD" "$JWT_SECRET" "$API_KEY_SECRET" | sha256sum) == "$(cat /tmp/rpm-previous-secrets.sha256)" ]]
test ! -e /var/lib/heimdall-postgresql/18/data/PG_VERSION
[[ $(runuser -u postgres -- psql -At -d "$DATABASE_NAME" -c 'SELECT id FROM rpm_previous_sentinel') == 7 ]]
curl --fail --silent --show-error --retry 30 --retry-connrefused --retry-delay 1 \
  --retry-max-time 60 --max-time 5 http://localhost:3000/health/ready -o /tmp/rpm-previous-ready.json
/usr/libexec/heimdall-server/runtime/node/bin/node \
  -e 'if(require("/tmp/rpm-previous-ready.json").status!=="ok") process.exit(1)'
