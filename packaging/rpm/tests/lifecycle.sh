#!/bin/bash
set -euo pipefail
[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
runtime=/usr/libexec/heimdall-server/runtime
node="$runtime/node/bin/node"
units=(heimdall-server heimdall-caddy heimdall-postgresql)
diagnostics() {
  systemctl status --no-pager "${units[@]}" >&2 || true
  journalctl --no-pager -u heimdall-postgresql -u heimdall-server -u heimdall-caddy -n 100 >&2 || true
}
trap diagnostics ERR
query() {
  runuser -u heimdall-postgres -- "$runtime/postgresql/bin/psql" \
    -h /run/heimdall-postgresql -p 55432 -U heimdall-postgres \
    -v ON_ERROR_STOP=1 -At -d "$DATABASE_NAME" -c "$1"
}
verify() {
  mapfile -t roots < <(find /var/lib/heimdall-caddy -name root.crt -type f)
  [[ ${#roots[@]} == 1 ]]
  curl --fail --silent --show-error --retry 30 --retry-connrefused \
    --retry-delay 1 --retry-max-time 60 --connect-timeout 2 --max-time 5 \
    --noproxy '*' --cacert "${roots[0]}" --resolve heimdall.example.test:443:127.0.0.1 \
    https://heimdall.example.test/health/ready -o /tmp/rpm-ready.json
  "$node" -e 'if(require("/tmp/rpm-ready.json").status!=="ok") process.exit(1)'
  for unit in "${units[@]}"; do systemctl is-active --quiet "$unit"; done
  test "$(readlink -f "/proc/$(systemctl show -p MainPID --value heimdall-server)/exe")" = "$node"
  test "$(readlink -f "/proc/$(systemctl show -p MainPID --value heimdall-postgresql)/exe")" = "$runtime/postgresql/bin/postgres"
  test "$(readlink -f "/proc/$(systemctl show -p MainPID --value heimdall-caddy)/exe")" = "$runtime/caddy/caddy"
  [[ $(systemctl show -p User --value heimdall-server) == heimdall ]]
  curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3000/health -o /tmp/rpm-health.json
  "$node" -e 'if(require("/tmp/rpm-health.json").version!==process.argv[1]) process.exit(1)' "$(rpm -q --qf '%{VERSION}' heimdall-server)"
  curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3000/ -o /tmp/rpm-index.html
  grep -qi '<html' /tmp/rpm-index.html
  curl --fail --silent --show-error --max-time 10 -H 'Content-Type: application/json' \
    --data '{"email":"rpm-test@example.invalid","password":"Rpm-Smoke-Only-2026!"}' \
    http://127.0.0.1:3000/authn/login -o /tmp/rpm-login.json
  "$node" -e 'const v=require("/tmp/rpm-login.json"); if(!v.accessToken || !v.userID) process.exit(1)'
  rm /tmp/rpm-login.json
}
verify_state() {
  verify
  sha256sum --check /tmp/rpm-lifecycle-env.sha256
  sha256sum --check /tmp/rpm-lifecycle-ca.sha256
  source /etc/heimdall-server/backend.env
  [[ $HEIMDALL_DATABASE_MODE == bundled && $HEIMDALL_PROXY_MODE == bundled ]]
  [[ $(query 'SELECT id FROM rpm_test_sentinel') == 1 ]]
  expected=$(find /usr/share/heimdall-server/apps/backend/migrations -maxdepth 1 -name '*.js' -type f | wc -l)
  [[ $(query 'SELECT COUNT(*) FROM "SequelizeMeta"') -eq $expected ]]
}
check_signature() {
  test -s "${RPM_TEST_GPG_KEY:?public test signing key required}"
  rpm --import "$RPM_TEST_GPG_KEY"
  rpmkeys --checksig --verbose "$1" | tee /tmp/rpm-signature.log
  grep -Eq 'Signature.*: OK' /tmp/rpm-signature.log
  sha256sum "$1"
}
upgrade() {
  timeout 300 dnf upgrade -y --disablerepo='*' --setopt=install_weak_deps=False \
    --setopt=localpkg_gpgcheck=1 "$1"
}
refuse_upgrade() {
  before=$(rpm -q --qf '%{NEVRA}' heimdall-server)
  if upgrade "$1" > /tmp/rpm-refused-upgrade.log 2>&1; then
    cat /tmp/rpm-refused-upgrade.log
    echo 'Upgrade unexpectedly accepted an unsafe fixture.' >&2
    exit 1
  fi
  cat /tmp/rpm-refused-upgrade.log
  [[ $(rpm -q --qf '%{NEVRA}' heimdall-server) == "$before" ]]
  for unit in "${units[@]}"; do systemctl is-active --quiet "$unit"; done
  test ! -e /etc/heimdall-server/upgrade-pending
}
case ${1:-} in
  install)
    check_signature "${2:?RPM}"
    install -d /etc/heimdall-server
    cat > /etc/heimdall-server/backend.env <<'ENV'
NODE_ENV=production
ADMIN_EMAIL=rpm-test@example.invalid
ADMIN_PASSWORD=Rpm-Smoke-Only-2026!
LOCAL_LOGIN_DISABLED=false
OIDC_NAME='RPM fixture login'
ENV
    sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-before-install.sha256
    timeout 300 dnf install -y --setopt=install_weak_deps=False --setopt=localpkg_gpgcheck=1 "$2"
    [[ $(rpm -q --qf '%{NEVRA}' heimdall-server) == "$(rpm -qp --qf '%{NEVRA}' "$2")" ]]
    sha256sum --check /tmp/rpm-before-install.sha256
    for unit in "${units[@]}"; do if systemctl is-active --quiet "$unit"; then exit 1; fi; done
    test ! -e /var/lib/heimdall-postgresql/18/data/PG_VERSION
    ;;
  setup)
    # The host runner disconnects networking before this full setup.
    bash /tmp/rpm-tests/topology.sh bundled bundled
    source /etc/heimdall-server/backend.env
    printf '%s\0' "$DATABASE_PASSWORD" "$JWT_SECRET" "$API_KEY_SECRET" | sha256sum > /tmp/rpm-secrets.sha256
    bash /tmp/rpm-tests/database.sh
    # Missing systemd must fail without touching configuration; reconfigure works.
    sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-shell-env.sha256
    unshare --mount --propagation private bash -s <<'SHELL'
set -euo pipefail
mount -t tmpfs tmpfs /run
if heimdall-server-setup --non-interactive --skip-db --skip-tls > /tmp/rpm-shell-no-manager.log 2>&1; then exit 1; fi
sha256sum --check /tmp/rpm-shell-env.sha256
heimdall-server-setup --non-interactive --reconfigure
SHELL
    heimdall-server-setup --non-interactive
    install -d /run/systemd/system/heimdall-server.service.d
    printf '[Service]\nExecStartPre=/usr/bin/false\nRestart=no\n' > /run/systemd/system/heimdall-server.service.d/rpm-test-failure.conf
    systemctl daemon-reload
    result=0
    heimdall-server-setup --non-interactive > /tmp/rpm-shell-failure.log 2>&1 || result=$?
    cat /tmp/rpm-shell-failure.log
    [[ $result -ne 0 ]]
    rm /run/systemd/system/heimdall-server.service.d/rpm-test-failure.conf
    systemctl daemon-reload
    systemctl reset-failed heimdall-server
    heimdall-cli setup --non-interactive
    source /etc/heimdall-server/backend.env
    [[ $(printf '%s\0' "$DATABASE_PASSWORD" "$JWT_SECRET" "$API_KEY_SECRET" | sha256sum) == "$(cat /tmp/rpm-secrets.sha256)" ]]
    [[ $OIDC_NAME == 'RPM fixture login' && $LOCAL_LOGIN_DISABLED == false ]]
    sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-lifecycle-env.sha256
    find /var/lib/heimdall-caddy -name root.crt -type f -exec sha256sum {} \; > /tmp/rpm-lifecycle-ca.sha256
    test -s /tmp/rpm-lifecycle-ca.sha256
    cat /etc/os-release
    uname -m
    rpm -q heimdall-server systemd
    "$node" --version
    heimdall-cli --version
    verify_state
    ;;
  upgrade)
    check_signature "${2:?RPM}"
    source /etc/heimdall-server/backend.env
    version_file=/var/lib/heimdall-postgresql/18/data/PG_VERSION
    cp -p "$version_file" /tmp/rpm-pg-version
    printf '17\n' > "$version_file"
    refuse_upgrade "$2"
    [[ $(cat "$version_file") == 17 ]]
    cp -p /tmp/rpm-pg-version "$version_file"
    # Force a backup connection refusal while all services remain alive.
    cp -p /etc/heimdall-server/backend.env /tmp/rpm-before-backup-failure.env
    sed -i 's/^DATABASE_PASSWORD=.*/DATABASE_PASSWORD=invalid-backup-fixture/' /etc/heimdall-server/backend.env
    refuse_upgrade "$2"
    cp -p /tmp/rpm-before-backup-failure.env /etc/heimdall-server/backend.env
    upgrade "$2"
    [[ $(rpm -q --qf '%{NEVRA}' heimdall-server) == "$(rpm -qp --qf '%{NEVRA}' "$2")" ]]
    for unit in "${units[@]}"; do if systemctl is-active --quiet "$unit"; then exit 1; fi; done
    test -e /etc/heimdall-server/upgrade-pending
    sha256sum --check /tmp/rpm-lifecycle-env.sha256
    test -n "$(find /var/lib/heimdall-server/backups -name '*.tar.gz' -print -quit)"
    heimdall-cli setup --non-interactive --reconfigure
    test -e /etc/heimdall-server/upgrade-pending
    heimdall-cli setup --non-interactive --skip-db || true
    test -e /etc/heimdall-server/upgrade-pending
    if systemctl is-active --quiet heimdall-server; then exit 1; fi
    migration=/usr/share/heimdall-server/apps/backend/migrations/99999999999999-rpm-failure.js
    printf 'module.exports = { up: async () => { throw new Error("RPM migration failure fixture"); }, down: async () => {} };\n' > "$migration"
    if heimdall-cli setup --non-interactive > /tmp/rpm-migration-failure.log 2>&1; then exit 1; fi
    cat /tmp/rpm-migration-failure.log
    test -e /etc/heimdall-server/upgrade-pending
    if systemctl is-active --quiet heimdall-server; then exit 1; fi
    rm "$migration"
    heimdall-cli setup --non-interactive
    test ! -e /etc/heimdall-server/upgrade-pending
    verify_state
    ;;
  verify) verify_state ;;
  remove)
    source /etc/heimdall-server/backend.env
    [[ $(query 'SELECT id FROM rpm_test_sentinel') == 1 ]]
    cp -p /etc/heimdall-server/backend.env /tmp/rpm-retained.env
    sha256sum /var/lib/heimdall-postgresql/18/data/PG_VERSION > /tmp/rpm-retained-pg.sha256
    dnf remove -y --noautoremove heimdall-server
    if rpm -q heimdall-server; then exit 1; fi
    for unit in "${units[@]}"; do if systemctl is-active --quiet "$unit"; then exit 1; fi; done
    retained=/etc/heimdall-server/backend.env
    [[ -f $retained ]] || retained+=.rpmsave
    cmp /tmp/rpm-retained.env "$retained"
    sha256sum --check /tmp/rpm-retained-pg.sha256 /tmp/rpm-lifecycle-ca.sha256
    for account in heimdall heimdall-postgres heimdall-caddy; do getent passwd "$account"; done
    ;;
  recover)
    check_signature "${2:?RPM}"
    dnf install -y --disablerepo='*' --setopt=localpkg_gpgcheck=1 --setopt=install_weak_deps=False "$2"
    cp -p /tmp/rpm-retained.env /etc/heimdall-server/backend.env
    heimdall-cli setup --non-interactive
    verify_state
    ;;
  *) echo 'Usage: lifecycle.sh install RPM | setup | upgrade RPM | verify | remove | recover RPM' >&2; exit 64 ;;
esac
