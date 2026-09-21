#!/bin/bash
set -euo pipefail

[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || {
  echo 'Run only in a disposable RPM test container with HEIMDALL_RPM_TEST=1.' >&2
  exit 64
}

diagnostics() {
  systemctl status --no-pager postgresql-18 heimdall-server >&2 || true
  journalctl --no-pager -u postgresql-18 -u heimdall-server -n 100 >&2 || true
}

verify() {
  if ! curl --fail --silent --show-error --retry 30 --retry-connrefused \
    --retry-delay 1 --retry-max-time 60 --connect-timeout 2 --max-time 5 \
    http://127.0.0.1:3000/server \
    -o /tmp/rpm-server.json; then
    diagnostics
    return 1
  fi
  /usr/bin/node -e 'JSON.parse(require("fs").readFileSync("/tmp/rpm-server.json", "utf8"))'
  systemctl is-active --quiet postgresql-18 heimdall-server
  [[ $(systemctl show -p User --value heimdall-server) == heimdall ]]
  curl --fail --silent --show-error --connect-timeout 2 --max-time 10 \
    http://127.0.0.1:3000/ -o /tmp/rpm-index.html
  grep -qi '<html' /tmp/rpm-index.html
  curl --fail --silent --show-error --connect-timeout 2 --max-time 10 \
    -H 'Content-Type: application/json' \
    --data '{"email":"rpm-test@example.invalid","password":"Rpm-Smoke-Only-2026!"}' \
    http://127.0.0.1:3000/authn/login -o /tmp/rpm-login.json
  /usr/bin/node -e 'const v=JSON.parse(require("fs").readFileSync("/tmp/rpm-login.json", "utf8")); if (!v.accessToken || !v.userID) process.exit(1)'
  rm -f /tmp/rpm-login.json
}

verify_state() {
  verify
  sha256sum --check /tmp/rpm-lifecycle-env.sha256
  source /etc/heimdall-server/backend.env
  count=$(runuser -u postgres -- /usr/pgsql-18/bin/psql \
    -v ON_ERROR_STOP=1 -At -d "$DATABASE_NAME" \
    -c 'SELECT COUNT(*) FROM rpm_test_sentinel')
  [[ $count -eq 1 ]]
}

case ${1:-} in
  install)
    test -f "${2:-}"
    install -d /etc/heimdall-server
    cat > /etc/heimdall-server/backend.env <<'ENV'
NODE_ENV=production
ADMIN_EMAIL=rpm-test@example.invalid
ADMIN_PASSWORD=Rpm-Smoke-Only-2026!
EXTERNAL_URL=https://heimdall.example.test
LOCAL_LOGIN_DISABLED=false
ENV
    timeout 300 dnf install -y "$2"
    verify
    /usr/bin/heimdall-server-setup --non-interactive
    verify
    bash /tmp/rpm-tests/database.sh
    sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-lifecycle-env.sha256
    ;;
  upgrade)
    test -f "${2:-}"
    timeout 300 dnf upgrade -y "$2"
    [[ $(rpm -q --qf '%{RELEASE}' heimdall-server) == 2.el8 ]]
    verify_state
    ;;
  verify)
    verify_state
    ;;
  remove)
    dnf remove -y --noautoremove heimdall-server
    if rpm -q heimdall-server; then exit 1; fi
    if systemctl is-active --quiet heimdall-server; then exit 1; fi
    test -s /etc/heimdall-server/backend.env.rpmsave
    systemctl is-active --quiet postgresql-18
    source /etc/heimdall-server/backend.env.rpmsave
    count=$(runuser -u postgres -- /usr/pgsql-18/bin/psql \
      -v ON_ERROR_STOP=1 -At -d "$DATABASE_NAME" \
      -c 'SELECT COUNT(*) FROM rpm_test_sentinel')
    [[ $count -eq 1 ]]
    ;;
  *)
    echo 'Usage: lifecycle.sh install RPM | upgrade RPM | verify | remove' >&2
    exit 64
    ;;
esac
