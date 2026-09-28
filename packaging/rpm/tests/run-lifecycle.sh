#!/bin/bash
set -euo pipefail
[[ -n ${RPM_TEST_GPG_KEY:-} && -s $RPM_TEST_GPG_KEY ]] || {
  echo 'RPM_TEST_GPG_KEY must name the public key used to sign these test RPMs.' >&2
  exit 64
}
platform=${1:?platform}
[[ $platform == linux/arm64 || $platform == linux/amd64 ]] || exit 64
initial=$(python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "${2:?initial rpm}")
upgrade=$(python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "${3:?upgrade rpm}")
test -s "$initial"
test -s "$upgrade"
name="heimdall-integration-${platform##*/}-$$-$RANDOM"
image="heimdall-integration-test:${platform##*/}"
logdir="packaging/rpm/dist/integration/evidence/$name"
mkdir -p "$logdir"
exec > >(tee "$logdir/output.log") 2>&1
container=''
cleanup() {
  result=$?
  if [[ -n $container ]]; then
    docker inspect "$container" > "$logdir/container.json" 2>/dev/null || true
    if [[ $result -ne 0 ]]; then
      docker exec "$container" systemctl status --no-pager postgresql-18 heimdall-server caddy || true
      docker exec "$container" journalctl --no-pager -u postgresql-18 -u heimdall-server -u caddy -n 100 || true
    fi
    docker rm -f "$container" >/dev/null || result=1
  fi
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
wait_bus() {
  for attempt in $(seq 1 60); do
    if docker exec "$container" systemctl show-environment >/dev/null 2>&1; then return; fi
    sleep 1
  done
  echo 'Timed out waiting for disposable systemd host.' >&2
  return 1
}
{
  date -u
  printf 'platform=%s\nhost_arch=%s\napplication_commit=' "$platform" "$(uname -m)"
  git rev-parse HEAD
  git status --short
  shasum -a 256 "$initial" "$upgrade" "$RPM_TEST_GPG_KEY"
  docker info --format 'daemon_arch={{.Architecture}} daemon_os={{.OperatingSystem}}'
} > "$logdir/inputs.txt"
ca_args=()
if [[ -n ${RPM_TEST_CA:-} ]]; then ca_args=(--secret "id=corp_ca,src=$RPM_TEST_CA"); fi
step docker build --platform "$platform" "${ca_args[@]}" \
  -f packaging/rpm/Dockerfile.ol8 --target test-host -t "$image" .
docker image inspect "$image" > "$logdir/image.json"
container=$(docker create --name "$name" --platform "$platform" --runtime=runc \
  --privileged --cgroupns=private --tmpfs /run --tmpfs /run/lock \
  -e container=docker -e HEIMDALL_RPM_TEST=1 \
  -e RPM_TEST_GPG_KEY=/tmp/rpm-test-signing.asc "$image")
step docker start "$container"
wait_bus
step docker exec "$container" dnf makecache
docker cp packaging/rpm/tests/. "$container:/tmp/rpm-tests"
docker cp "$RPM_TEST_GPG_KEY" "$container:/tmp/rpm-test-signing.asc"
docker cp "$initial" "$container:/tmp/initial.rpm"
docker cp "$upgrade" "$container:/tmp/upgrade.rpm"
step docker exec "$container" bash /tmp/rpm-tests/lifecycle.sh install /tmp/initial.rpm
step docker exec "$container" bash /tmp/rpm-tests/lifecycle.sh upgrade /tmp/upgrade.rpm
step docker restart "$container"
wait_bus
step docker exec "$container" bash /tmp/rpm-tests/lifecycle.sh verify
step docker exec "$container" bash /tmp/rpm-tests/features.sh
step docker exec "$container" bash /tmp/rpm-tests/lifecycle.sh remove
