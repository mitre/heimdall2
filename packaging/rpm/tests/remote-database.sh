#!/bin/bash
# Fresh topology hosts share the existing lifecycle image and evidence convention.
set -euo pipefail
[[ -n ${RPM_TEST_GPG_KEY:-} && -s $RPM_TEST_GPG_KEY ]] || exit 64
platform=${1:?platform}
[[ $platform == linux/arm64 || $platform == linux/amd64 ]] || exit 64
artifact=$(python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "${2:?rpm}")
test -s "$artifact"
db_mode=${3:-external}
proxy_mode=${4:-bundled}
[[ $db_mode == bundled || $db_mode == external || $db_mode == coexist ]] || exit 64
[[ $proxy_mode == bundled || $proxy_mode == external ]] || exit 64
name="heimdall-topology-${platform##*/}-${db_mode}-${proxy_mode}-$$-$RANDOM"
image="heimdall-integration-test:${platform##*/}"
logdir="packaging/rpm/dist/integration/evidence/$name"
mkdir -p "$logdir"
exec > >(tee "$logdir/output.log") 2>&1
network_id=''; database_id=''; proxy_id=''; app_id=''
cleanup() {
  result=$?
  for owned in "$app_id" "$database_id" "$proxy_id"; do
    [[ -n $owned ]] || continue
    docker inspect "$owned" > "$logdir/$owned.json" 2>/dev/null || true
    if [[ $result -ne 0 ]]; then docker logs "$owned" || true; fi
  done
  if [[ $result -ne 0 && -n $app_id ]]; then
    docker exec "$app_id" journalctl --no-pager -u heimdall-server -u heimdall-postgresql -u heimdall-caddy -u postgresql -u nginx -n 150 || true
  fi
  for owned in "$proxy_id" "$database_id" "$app_id"; do
    [[ -z $owned ]] || docker rm -fv "$owned" >/dev/null || result=1
  done
  [[ -z $network_id ]] || docker network rm "$network_id" >/dev/null || result=1
  printf 'exit_status=%s\n' "$result" | tee "$logdir/result.txt"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
step() {
  local result=0
  "$@" || result=$?
  { printf 'exit=%s ' "$result"; printf '%q ' "$@"; printf '\n'; } | tee -a "$logdir/command-status.log"
  return "$result"
}
{
  date -u
  printf 'platform=%s\nhost_arch=%s\napplication_commit=' "$platform" "$(uname -m)"
  git rev-parse HEAD
  shasum -a 256 "$artifact" "$RPM_TEST_GPG_KEY"
  docker info --format 'daemon_arch={{.Architecture}} daemon_os={{.OperatingSystem}}'
} > "$logdir/inputs.txt"
docker image inspect "$image" > "$logdir/image.json"
# Fetch fixtures before creating the isolated, no-egress test network.
if [[ $db_mode == external ]]; then step docker pull --platform "$platform" postgres:18; fi
if [[ $proxy_mode == external && $db_mode != coexist ]]; then step docker pull --platform "$platform" nginx:stable-alpine; fi
network_id=$(docker network create --internal "$name")
app_id=$(docker create --platform "$platform" --name "$name" \
  --runtime=runc --privileged --cgroupns=private --tmpfs /run --tmpfs /run/lock \
  -e container=docker -e HEIMDALL_RPM_TEST=1 -e RPM_TEST_GPG_KEY=/tmp/rpm-test-signing.asc "$image")
step docker start "$app_id"
for attempt in $(seq 1 60); do
  if docker exec "$app_id" systemctl show-environment >/dev/null 2>&1; then break; fi
  sleep 1
  [[ $attempt -lt 60 ]]
done
docker cp "$artifact" "$app_id:/tmp/candidate.rpm"
docker cp "$RPM_TEST_GPG_KEY" "$app_id:/tmp/rpm-test-signing.asc"
docker cp packaging/rpm/tests/. "$app_id:/tmp/rpm-tests"
step docker exec "$app_id" bash /tmp/rpm-tests/lifecycle.sh install /tmp/candidate.rpm
if [[ $db_mode == coexist ]]; then
  step docker exec "$app_id" bash /tmp/rpm-tests/coexistence.sh prepare
fi
step docker network disconnect bridge "$app_id"
step docker network connect --alias rpm-app "$network_id" "$app_id"
if [[ $db_mode == coexist ]]; then
  step docker exec "$app_id" bash /tmp/rpm-tests/coexistence.sh verify
  exit 0
fi
fixture_env=(-e HEIMDALL_RPM_TEST=1)
if [[ $db_mode == external ]]; then
  database_id=$(docker create --platform "$platform" --name "$name-db" \
    --network "$network_id" --network-alias rpm-external-db \
    -e POSTGRES_PASSWORD=Rpm-External-Fixture-2026 \
    -e POSTGRES_DB=heimdall-server-production postgres:18)
  step docker start "$database_id"
  docker image inspect postgres:18 > "$logdir/database-image.json"
  # The image's initialization server is socket-only. Require the final TCP
  # server, authenticated access and the requested database before setup.
  for attempt in $(seq 1 60); do
    if ready=$(docker exec -e PGPASSWORD=Rpm-External-Fixture-2026 -e PGCONNECT_TIMEOUT=2 \
      "$database_id" psql -h 127.0.0.1 -p 5432 -U postgres \
      -d heimdall-server-production -v ON_ERROR_STOP=1 -Atqc 'SELECT 1' \
      2> "$logdir/database-readiness.log") && [[ $ready == 1 ]]; then break; fi
    if [[ $attempt -eq 60 ]]; then
      cat "$logdir/database-readiness.log" >&2
      echo 'Timed out waiting for authenticated PostgreSQL TCP readiness.' >&2
      exit 1
    fi
    sleep 1
  done
  fixture_env+=(-e RPM_TEST_DB_HOST=rpm-external-db -e RPM_TEST_DB_PORT=5432
    -e RPM_TEST_DB_USER=postgres -e RPM_TEST_DB_PASSWORD=Rpm-External-Fixture-2026
    -e RPM_TEST_DB_NAME=heimdall-server-production)
fi
if [[ $proxy_mode == external ]]; then
  # Generated test key stays inside disposable containers; only the CA is trusted.
  step docker exec "$app_id" openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout /tmp/proxy.key -out /tmp/proxy.crt -days 1 \
    -subj /CN=heimdall.example.test -addext subjectAltName=DNS:heimdall.example.test
  proxy_id=$(docker create --platform "$platform" --name "$name-proxy" --network "$network_id" nginx:stable-alpine)
  docker exec "$app_id" tar -C /tmp -cf - proxy.crt proxy.key | docker cp - "$proxy_id:/etc/nginx/"
  # docker cp accepts tar streams, so stage only this public fixture configuration locally.
  cat > "$logdir/nginx.conf" <<'NGINX'
events {}
http {
  server {
    listen 443 ssl;
    server_name heimdall.example.test;
    ssl_certificate /etc/nginx/proxy.crt;
    ssl_certificate_key /etc/nginx/proxy.key;
    location / {
      proxy_pass http://rpm-app:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-Proto https;
    }
  }
}
NGINX
  docker cp "$logdir/nginx.conf" "$proxy_id:/etc/nginx/nginx.conf"
  step docker start "$proxy_id"
  docker image inspect nginx:stable-alpine > "$logdir/proxy-image.json"
  address=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$proxy_id")
  fixture_env+=(-e RPM_TEST_PROXY_CA=/tmp/proxy.crt -e "RPM_TEST_PROXY_ADDRESS=$address")
fi
step docker exec "${fixture_env[@]}" "$app_id" bash /tmp/rpm-tests/topology.sh "$db_mode" "$proxy_mode"
