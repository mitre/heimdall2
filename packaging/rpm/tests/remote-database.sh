#!/bin/bash
set -euo pipefail
[[ -n ${RPM_TEST_GPG_KEY:-} && -s $RPM_TEST_GPG_KEY ]] || {
  echo 'RPM_TEST_GPG_KEY must name the public key used to sign these test RPMs.' >&2
  exit 64
}
platform=${1:?platform}
[[ $platform == linux/arm64 || $platform == linux/amd64 ]] || exit 64
artifact=$(python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "${2:?rpm}")
test -s "$artifact"
suffix="${platform##*/}-$$-$RANDOM"
network="heimdall-remote-$suffix"
database="heimdall-remote-db-$suffix"
app="heimdall-remote-app-$suffix"
image="heimdall-integration-test:${platform##*/}"
logdir="packaging/rpm/dist/integration/evidence/$app"
mkdir -p "$logdir"
exec > >(tee "$logdir/output.log") 2>&1
network_id=''
database_id=''
app_id=''
cleanup() {
  result=$?
  if [[ -n $app_id ]]; then
    docker inspect "$app_id" > "$logdir/app.json" 2>/dev/null || true
    if [[ $result -ne 0 ]]; then docker exec "$app_id" journalctl --no-pager -u heimdall-server -n 100 || true; fi
    docker rm -f "$app_id" >/dev/null || result=1
  fi
  if [[ -n $database_id ]]; then
    docker inspect "$database_id" > "$logdir/database.json" 2>/dev/null || true
    if [[ $result -ne 0 ]]; then docker logs "$database_id" || true; fi
    docker rm -fv "$database_id" >/dev/null || result=1
  fi
  if [[ -n $network_id ]]; then docker network rm "$network_id" >/dev/null || result=1; fi
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
  git status --short
  shasum -a 256 "$artifact" "$RPM_TEST_GPG_KEY"
  docker info --format 'daemon_arch={{.Architecture}} daemon_os={{.OperatingSystem}}'
} > "$logdir/inputs.txt"
# The local lifecycle runner creates this trusted test-host image first.
docker image inspect "$image" > "$logdir/image.json"
network_id=$(docker network create "$network")
database_id=$(docker create --platform "$platform" --name "$database" \
  --network "$network_id" --network-alias rpm-external-db \
  -e POSTGRES_PASSWORD=Rpm-External-Fixture-2026 \
  -e POSTGRES_DB=heimdall-server-production postgres:18)
step docker start "$database_id"
docker image inspect postgres:18 > "$logdir/database-image.json"
app_id=$(docker create --platform "$platform" --name "$app" --network "$network_id" \
  --runtime=runc --privileged --cgroupns=private --tmpfs /run --tmpfs /run/lock \
  -e container=docker -e HEIMDALL_RPM_TEST=1 "$image")
step docker start "$app_id"
for attempt in $(seq 1 60); do
  if docker exec "$app_id" systemctl show-environment >/dev/null 2>&1 &&
     docker exec "$database_id" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
  [[ $attempt -lt 60 ]]
done
docker cp "$artifact" "$app_id:/tmp/candidate.rpm"
docker cp "$RPM_TEST_GPG_KEY" "$app_id:/tmp/rpm-test-signing.asc"
step docker exec -i "$app_id" bash -s <<'HOST'
set -euo pipefail
[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
rpm --import /tmp/rpm-test-signing.asc
rpmkeys --checksig --verbose /tmp/candidate.rpm | tee /tmp/rpm-signature.log
grep -Eq 'Signature.*: OK' /tmp/rpm-signature.log
sha256sum /tmp/candidate.rpm
dnf makecache
dnf install -y --setopt=install_weak_deps=False --setopt=localpkg_gpgcheck=1 /tmp/candidate.rpm
if systemctl is-active --quiet heimdall-server; then exit 1; fi
dnf install -y --setopt=install_weak_deps=False postgresql18
test -x /usr/bin/psql
test -x /usr/bin/pg_dump
cat > /etc/heimdall-server/backend.env <<'ENV'
NODE_ENV=production
ADMIN_EMAIL=rpm-test@example.invalid
ADMIN_PASSWORD=Rpm-Smoke-Only-2026!
LOCAL_LOGIN_DISABLED=false
ENV
heimdall-cli setup --non-interactive --skip-tls \
  --db-host rpm-external-db --db-port 5432 --db-user postgres \
  --db-password Rpm-External-Fixture-2026 --db-name heimdall-server-production \
  --external-url http://localhost:3000
sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-remote-env.sha256
before_pid=$(systemctl show -p MainPID --value heimdall-server)
[[ $before_pid -gt 0 ]]
heimdall-cli setup --non-interactive --skip-tls
[[ $(systemctl show -p MainPID --value heimdall-server) != "$before_pid" ]]
sha256sum --check /tmp/rpm-remote-env.sha256
source /etc/heimdall-server/backend.env
[[ $DATABASE_HOST == rpm-external-db ]]
test ! -e /var/lib/pgsql/18/data/PG_VERSION
if rpm -q postgresql18-server; then exit 1; fi
systemctl is-active --quiet heimdall-server
curl --fail --silent --show-error --retry 30 --retry-connrefused \
  --retry-delay 1 --retry-max-time 60 --max-time 10 \
  http://127.0.0.1:3000/health/ready -o /tmp/rpm-ready.json
node -e 'if(require("/tmp/rpm-ready.json").status!=="ok") process.exit(1)'
curl --fail --silent --show-error --max-time 10 -H 'Content-Type: application/json' \
  --data '{"email":"rpm-test@example.invalid","password":"Rpm-Smoke-Only-2026!"}' \
  http://127.0.0.1:3000/authn/login -o /tmp/login.json
node -e 'const v=require("/tmp/login.json"); if(!v.accessToken || !v.userID) process.exit(1)'
rm /tmp/login.json
cat /etc/os-release
uname -m
rpm -q heimdall-server postgresql18 nodejs systemd
heimdall-cli --version
HOST
