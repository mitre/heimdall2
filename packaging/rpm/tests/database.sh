#!/bin/bash
set -euo pipefail

[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || {
  echo 'Run only in a disposable RPM test container with HEIMDALL_RPM_TEST=1.' >&2
  exit 64
}

/usr/bin/heimdall-cli setup --non-interactive
set -a
source /etc/heimdall-server/backend.env
set +a
query() {
  runuser -u heimdall-postgres -- /usr/libexec/heimdall-server/runtime/postgresql/bin/psql \
    -h /run/heimdall-postgresql -p 55432 -U heimdall-postgres \
    -v ON_ERROR_STOP=1 -At -d "$DATABASE_NAME" -c "$1"
}
expected=$(find /usr/share/heimdall-server/apps/backend/migrations \
  -maxdepth 1 -name '*.js' -type f | wc -l)
[[ $(query 'SELECT COUNT(*) FROM "SequelizeMeta"') -eq $expected ]]
[[ $(query "SELECT COUNT(*) FROM \"Users\" WHERE role = 'admin'") -eq 1 ]]
query 'CREATE TABLE IF NOT EXISTS rpm_test_sentinel (id integer PRIMARY KEY)'
query 'INSERT INTO rpm_test_sentinel VALUES (1) ON CONFLICT DO NOTHING'
/usr/bin/heimdall-server-db-setup
/usr/bin/heimdall-server-db-setup --skip-seed
[[ $(query 'SELECT COUNT(*) FROM rpm_test_sentinel') -eq 1 ]]
[[ $(query "SELECT COUNT(*) FROM \"Users\" WHERE role = 'admin'") -eq 1 ]]
