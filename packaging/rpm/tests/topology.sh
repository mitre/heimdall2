#!/bin/bash
# Run inside a fresh disposable host after RPM installation and fixture preparation.
set -euo pipefail
[[ ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
db_mode=${1:?database mode}
proxy_mode=${2:?proxy mode}
[[ $db_mode == bundled || $db_mode == external ]] || exit 64
[[ $proxy_mode == bundled || $proxy_mode == external ]] || exit 64
runtime=/usr/libexec/heimdall-server/runtime
args=(setup --non-interactive --database-mode "$db_mode" --proxy-mode "$proxy_mode"
  --external-url https://heimdall.example.test --tls-mode internal)
if [[ $db_mode == external ]]; then
  args+=(--db-host "${RPM_TEST_DB_HOST:?}" --db-port "${RPM_TEST_DB_PORT:?}"
    --db-user "${RPM_TEST_DB_USER:?}" --db-password "${RPM_TEST_DB_PASSWORD:?}"
    --db-name "${RPM_TEST_DB_NAME:?}")
fi
if [[ ${RPM_TEST_COEXIST:-0} == 0 ]]; then
  rpm -qa --qf '%{NAME}\n' > /tmp/heimdall-installed-packages.txt
  if grep -Eq '^(nodejs([0-9]+)?|postgresql([0-9]+)?(-.*)?|caddy)$' /tmp/heimdall-installed-packages.txt; then exit 1; fi
fi
heimdall-cli "${args[@]}"
test "$(heimdall-cli config get HEIMDALL_DATABASE_MODE | sed -n 's/^HEIMDALL_DATABASE_MODE=//p')" = "$db_mode"
test "$(heimdall-cli config get HEIMDALL_PROXY_MODE | sed -n 's/^HEIMDALL_PROXY_MODE=//p')" = "$proxy_mode"
private_process() {
  systemctl is-active --quiet "$1"
  for attempt in $(seq 1 30); do
    if [[ $(readlink -f "/proc/$(systemctl show -p MainPID --value "$1")/exe") == "$2" ]]; then return; fi
    sleep 1
  done
  echo "Unexpected executable for $1" >&2
  return 1
}
private_process heimdall-server "$runtime/node/bin/node"
if [[ $db_mode == bundled ]]; then
  private_process heimdall-postgresql "$runtime/postgresql/bin/postgres"
else
  if systemctl is-active --quiet heimdall-postgresql; then exit 1; fi
  test ! -e /var/lib/heimdall-postgresql/18/data/PG_VERSION
fi
if [[ $proxy_mode == bundled ]]; then
  private_process heimdall-caddy "$runtime/caddy/caddy"
  for attempt in $(seq 1 30); do
    mapfile -t certs < <(find /var/lib/heimdall-caddy -name root.crt -type f)
    [[ ${#certs[@]} == 0 ]] || break
    sleep 1
  done
  test "${#certs[@]}" -eq 1
  ca=${certs[0]}
  address=127.0.0.1
else
  if systemctl is-active --quiet heimdall-caddy; then exit 1; fi
  ca=${RPM_TEST_PROXY_CA:?external proxy CA}
  address=${RPM_TEST_PROXY_ADDRESS:?external proxy IP}
fi
curl_args=(--fail --silent --show-error --retry 30 --retry-connrefused
  --retry-delay 1 --retry-max-time 90 --connect-timeout 2 --max-time 10
  --noproxy '*' --cacert "$ca" --resolve "heimdall.example.test:443:$address")
curl "${curl_args[@]}" https://heimdall.example.test/health/ready -o /tmp/rpm-topology-ready.json
"$runtime/node/bin/node" -e 'if(require("/tmp/rpm-topology-ready.json").status!=="ok") process.exit(1)'
curl "${curl_args[@]}" -H 'Content-Type: application/json' \
  --data '{"email":"rpm-test@example.invalid","password":"Rpm-Smoke-Only-2026!"}' \
  https://heimdall.example.test/authn/login -o /tmp/rpm-topology-login.json
"$runtime/node/bin/node" -e 'const v=require("/tmp/rpm-topology-login.json"); if(!v.accessToken || !v.userID) process.exit(1)'
rm /tmp/rpm-topology-login.json
sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-topology-env.sha256
heimdall-cli setup --non-interactive
sha256sum --check /tmp/rpm-topology-env.sha256
curl "${curl_args[@]}" https://heimdall.example.test/health/ready -o /tmp/rpm-topology-ready.json
"$runtime/node/bin/node" -e 'if(require("/tmp/rpm-topology-ready.json").status!=="ok") process.exit(1)'
printf 'PASS topology database=%s proxy=%s\n' "$db_mode" "$proxy_mode"
