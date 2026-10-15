#!/bin/bash
# Run inside a fresh disposable host after RPM installation and fixture preparation.
set -euo pipefail
[[ ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
db_mode=${1:?database mode}
proxy_mode=${2:?proxy mode}
backend_port=${3:-3002}
[[ $db_mode == bundled || $db_mode == external ]] || exit 64
[[ $proxy_mode == nginx || $proxy_mode == bundled || $proxy_mode == external ]] || exit 64
runtime=/usr/libexec/heimdall-server/runtime
args=(setup --non-interactive --database-mode "$db_mode" --proxy-mode "$proxy_mode"
  --external-url https://heimdall.example.test --tls-mode internal)
if [[ $proxy_mode == nginx ]]; then
  # Require the same privileged-port capability as a normal host.
  sysctl -q -w net.ipv4.ip_unprivileged_port_start=1024
  [[ $(sysctl -n net.ipv4.ip_unprivileged_port_start) == 1024 ]]
  # Omitting proxy and TLS flags exercises the new-install defaults.
  args=(setup --non-interactive --database-mode "$db_mode" --external-url heimdall.example.test)
fi
if [[ $db_mode == external ]]; then
  args+=(--db-host "${RPM_TEST_DB_HOST:?}" --db-port "${RPM_TEST_DB_PORT:?}"
    --db-user "${RPM_TEST_DB_USER:?}" --db-password "${RPM_TEST_DB_PASSWORD:?}"
    --db-name "${RPM_TEST_DB_NAME:?}")
fi
if [[ $# -ge 3 ]]; then args+=(--port "$backend_port"); fi
if [[ ${RPM_TEST_COEXIST:-0} == 0 ]]; then
  rpm -qa --qf '%{NAME}\n' > /tmp/heimdall-installed-packages.txt
  if grep -Eq '^(nodejs([0-9]+)?|postgresql([0-9]+)?(-.*)?|caddy|nginx)$' /tmp/heimdall-installed-packages.txt; then exit 1; fi
fi
heimdall-cli "${args[@]}"
[[ "$(heimdall-cli config get PORT | sed -n 's/^PORT=//p')" == "$backend_port" ]]
[[ "$(heimdall-cli config get HEIMDALL_DATABASE_MODE | sed -n 's/^HEIMDALL_DATABASE_MODE=//p')" == "$db_mode" ]]
[[ "$(heimdall-cli config get HEIMDALL_PROXY_MODE | sed -n 's/^HEIMDALL_PROXY_MODE=//p')" == "$proxy_mode" ]]
private_process() {
  local unit=$1 executable=$2
  systemctl is-active --quiet "$unit"
  for attempt in $(seq 1 30); do
    if [[ $(readlink -f "/proc/$(systemctl show -p MainPID --value "$unit")/exe") == "$executable" ]]; then return; fi
    sleep 1
  done
  echo "Unexpected executable for $unit" >&2
  return 1
}
private_process heimdall-server "$runtime/node/bin/node"
if [[ $db_mode == bundled ]]; then
  private_process heimdall-postgresql "$runtime/postgresql/bin/postgres"
else
  if systemctl is-active --quiet heimdall-postgresql; then exit 1; fi
  [[ ! -e /var/lib/heimdall-postgresql/18/data/PG_VERSION ]]
fi
if [[ $proxy_mode == nginx ]]; then
  private_process heimdall-nginx "$runtime/nginx/sbin/nginx"
  if systemctl is-active --quiet heimdall-caddy; then exit 1; fi
  ca=/etc/heimdall-server/nginx/certs/server.crt
  key=/etc/heimdall-server/nginx/certs/server.key
  [[ $(stat -c '%U:%G:%a' "$key") == root:heimdall-nginx:640 ]]
  openssl verify -CAfile "$ca" -verify_hostname heimdall.example.test "$ca"
  sha256sum "$ca" "$key" > /tmp/rpm-topology-cert.sha256
  address=127.0.0.1
elif [[ $proxy_mode == bundled ]]; then
  private_process heimdall-caddy "$runtime/caddy/caddy"
  for attempt in $(seq 1 30); do
    mapfile -t certs < <(find /var/lib/heimdall-caddy -name root.crt -type f)
    [[ ${#certs[@]} == 0 ]] || break
    sleep 1
  done
  [[ "${#certs[@]}" -eq 1 ]]
  ca=${certs[0]}
  address=127.0.0.1
else
  if systemctl is-active --quiet heimdall-caddy; then exit 1; fi
  ca=${RPM_TEST_PROXY_CA:?external proxy CA}
  address=${RPM_TEST_PROXY_ADDRESS:?external proxy IP}
fi
curl_args=(--cacert "$ca" --resolve "heimdall.example.test:443:$address")
bash /tmp/rpm-tests/application-ready.sh "http://127.0.0.1:$backend_port"
bash /tmp/rpm-tests/application-ready.sh https://heimdall.example.test "${curl_args[@]}"
sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-topology-env.sha256
# The shipped CLI must reject an invalid override without changing live settings.
if heimdall-cli setup --non-interactive --port 0 > /tmp/rpm-invalid-port.log 2>&1; then exit 1; fi
grep -Eq 'port|PORT' /tmp/rpm-invalid-port.log
sha256sum --check /tmp/rpm-topology-env.sha256
heimdall-cli setup --non-interactive
sha256sum --check /tmp/rpm-topology-env.sha256
if [[ $proxy_mode == nginx ]]; then sha256sum --check /tmp/rpm-topology-cert.sha256; fi
bash /tmp/rpm-tests/application-ready.sh https://heimdall.example.test "${curl_args[@]}"
printf 'PASS topology database=%s proxy=%s\n' "$db_mode" "$proxy_mode"
