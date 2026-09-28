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
trap diagnostics ERR

query() {
  runuser -u postgres -- /usr/pgsql-18/bin/psql \
    -v ON_ERROR_STOP=1 -At -d "$DATABASE_NAME" -c "$1"
}

verify() {
  curl --fail --silent --show-error --retry 30 --retry-connrefused \
    --retry-delay 1 --retry-max-time 60 --connect-timeout 2 --max-time 5 \
    http://127.0.0.1:3000/server -o /tmp/rpm-server.json
  /usr/bin/node -e 'JSON.parse(require("fs").readFileSync("/tmp/rpm-server.json", "utf8"))'
  systemctl is-active --quiet postgresql-18
  systemctl is-active --quiet heimdall-server
  [[ $(systemctl show -p User --value heimdall-server) == heimdall ]]
  curl --fail --silent --show-error --max-time 10 \
    http://127.0.0.1:3000/health -o /tmp/rpm-health.json
  curl --fail --silent --show-error --max-time 10 \
    http://127.0.0.1:3000/health/ready -o /tmp/rpm-ready.json
  /usr/bin/node -e 'const fs=require("fs"); if(JSON.parse(fs.readFileSync("/tmp/rpm-health.json")).version!=="2.13.1") process.exit(1); if(JSON.parse(fs.readFileSync("/tmp/rpm-ready.json")).status!=="ok") process.exit(1)'
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
  [[ $(query 'SELECT id FROM rpm_test_sentinel') == 1 ]]
  expected=$(find /usr/share/heimdall-server/apps/backend/migrations \
    -maxdepth 1 -name '*.js' -type f | wc -l)
  [[ $(query 'SELECT COUNT(*) FROM "SequelizeMeta"') -eq $expected ]]
}

check_signature() {
  test -s "${RPM_TEST_GPG_KEY:?public test signing key required}"
  rpm --import "$RPM_TEST_GPG_KEY"
  rpmkeys --checksig --verbose "$1" | tee /tmp/rpm-signature.log
  grep -Eq 'Signature.*: OK' /tmp/rpm-signature.log
  sha256sum "$1"
}

shell_setup_checks() {
  before_pid=$(systemctl show -p MainPID --value heimdall-server)
  sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-shell-env.sha256
  # Hide only this child's systemd sockets; the disposable host keeps running.
  unshare --mount --propagation private bash -s <<'SHELL'
set -euo pipefail
mount -t tmpfs tmpfs /run
if /usr/bin/heimdall-server-setup --non-interactive --skip-db --skip-tls \
  --external-url http://changed.example.test > /tmp/rpm-shell-no-manager.log 2>&1; then
  echo 'Shell setup unexpectedly succeeded without systemd.' >&2
  exit 1
fi
cat /tmp/rpm-shell-no-manager.log
grep -q 'requires a running systemd service manager' /tmp/rpm-shell-no-manager.log
sha256sum --check /tmp/rpm-shell-env.sha256
/usr/bin/heimdall-server-setup --non-interactive --reconfigure \
  --external-url http://localhost:3000
SHELL
  [[ $(systemctl show -p MainPID --value heimdall-server) == "$before_pid" ]]
  /usr/bin/heimdall-server-setup --non-interactive --skip-db --skip-tls
  [[ $(systemctl show -p MainPID --value heimdall-server) != "$before_pid" ]]
  verify
  # A real failing service start must make the installed shell entry point fail.
  install -d /run/systemd/system/heimdall-server.service.d
  printf '[Service]\nExecStartPre=/usr/bin/false\nRestart=no\n' \
    > /run/systemd/system/heimdall-server.service.d/rpm-test-failure.conf
  systemctl daemon-reload
  result=0
  /usr/bin/heimdall-server-setup --non-interactive --skip-db --skip-tls \
    > /tmp/rpm-shell-restart.log 2>&1 || result=$?
  cat /tmp/rpm-shell-restart.log
  rm /run/systemd/system/heimdall-server.service.d/rpm-test-failure.conf
  systemctl daemon-reload
  systemctl reset-failed heimdall-server
  systemctl restart heimdall-server
  [[ $result -ne 0 ]]
  verify
}

case ${1:-} in
  install)
    test -f "${2:-}"
    check_signature "$2"
    install -d /etc/heimdall-server
    cat > /etc/heimdall-server/backend.env <<'ENV'
NODE_ENV=production
ADMIN_EMAIL=rpm-test@example.invalid
ADMIN_PASSWORD=Rpm-Smoke-Only-2026!
EXTERNAL_URL=http://localhost:3000
LOCAL_LOGIN_DISABLED=false
OIDC_NAME='RPM fixture login'
ENV
    sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-before-install.sha256
    timeout 300 dnf install -y --setopt=install_weak_deps=False \
      --setopt=localpkg_gpgcheck=1 "$2"
    [[ $(rpm -q --qf '%{VERSION}-%{RELEASE}' heimdall-server) == 2.13.1-0.1.integration.el8 ]]
    sha256sum --check /tmp/rpm-before-install.sha256
    if systemctl is-active --quiet heimdall-server; then exit 1; fi
    test ! -e /var/lib/pgsql/18/data/PG_VERSION
    if rpm -q postgresql18-server; then exit 1; fi
    dnf install -y postgresql18 postgresql18-server
    /usr/bin/heimdall-cli setup --non-interactive --skip-tls
    verify
    sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-cli-rerun.sha256
    source /etc/heimdall-server/backend.env
    printf '%s\0' "$DATABASE_PASSWORD" "$JWT_SECRET" "$API_KEY_SECRET" | sha256sum > /tmp/rpm-secrets.sha256
    before_pid=$(systemctl show -p MainPID --value heimdall-server)
    /usr/bin/heimdall-cli setup --non-interactive --skip-tls
    [[ $(systemctl show -p MainPID --value heimdall-server) != "$before_pid" ]]
    sha256sum --check /tmp/rpm-cli-rerun.sha256
    verify
    bash /tmp/rpm-tests/database.sh
    shell_setup_checks
    unset OIDC_NAME LOCAL_LOGIN_DISABLED DATABASE_PASSWORD JWT_SECRET API_KEY_SECRET
    source /etc/heimdall-server/backend.env
    [[ $(printf '%s\0' "$DATABASE_PASSWORD" "$JWT_SECRET" "$API_KEY_SECRET" | sha256sum) == "$(cat /tmp/rpm-secrets.sha256)" ]]
    [[ $OIDC_NAME == 'RPM fixture login' && $LOCAL_LOGIN_DISABLED == false ]]
    sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-lifecycle-env.sha256
    cat /etc/os-release
    uname -m
    rpm -q heimdall-server postgresql18 postgresql18-server nodejs systemd
    node --version
    /usr/bin/heimdall-cli --version
    verify_state
    ;;
  upgrade)
    test -f "${2:-}"
    check_signature "$2"
    sed -i 's/^RESTART_ON_UPGRADE=.*/RESTART_ON_UPGRADE=false/' /etc/sysconfig/heimdall-server
    grep -qx 'RESTART_ON_UPGRADE=false' /etc/sysconfig/heimdall-server
    before_pid=$(systemctl show -p MainPID --value heimdall-server)
    [[ $before_pid -gt 0 ]]
    timeout 300 dnf upgrade -y --setopt=install_weak_deps=False \
      --setopt=localpkg_gpgcheck=1 "$2"
    [[ $(rpm -q --qf '%{RELEASE}' heimdall-server) == 0.2.integration.el8 ]]
    [[ $(systemctl show -p MainPID --value heimdall-server) == "$before_pid" ]]
    sha256sum --check /tmp/rpm-lifecycle-env.sha256
    test -n "$(find /var/lib/heimdall-server/backups -name '*.tar.gz' -print -quit)"
    /usr/bin/heimdall-cli setup --non-interactive --skip-tls
    [[ $(systemctl show -p MainPID --value heimdall-server) != "$before_pid" ]]
    verify_state
    ;;
  verify) verify_state ;;
  remove)
    sha256sum /etc/heimdall-server/backend.env | cut -d ' ' -f 1 > /tmp/rpm-before-remove.sha256
    dnf remove -y --noautoremove heimdall-server
    if rpm -q heimdall-server; then exit 1; fi
    if systemctl is-active --quiet heimdall-server; then exit 1; fi
    test -s /etc/heimdall-server/backend.env.rpmsave
    [[ $(sha256sum /etc/heimdall-server/backend.env.rpmsave | cut -d ' ' -f 1) == "$(cat /tmp/rpm-before-remove.sha256)" ]]
    systemctl is-active --quiet postgresql-18
    source /etc/heimdall-server/backend.env.rpmsave
    [[ $(query 'SELECT id FROM rpm_test_sentinel') == 1 ]]
    ;;
  *)
    echo 'Usage: lifecycle.sh install RPM | upgrade RPM | verify | remove' >&2
    exit 64
    ;;
esac
