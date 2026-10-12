#!/usr/bin/env bash
# Artifact acquisition belongs to the host; every test target starts disconnected.
set -euo pipefail
[[ $# == 3 || $# == 4 ]] || { echo 'Usage: run-offline.sh PLATFORM IMAGE INITIAL_BUNDLE [UPGRADE_BUNDLE]' >&2; exit 64; }
platform=$1
image=$2
[[ $platform == linux/arm64 || $platform == linux/amd64 ]] || exit 64
name="heimdall-offline-${platform##*/}-$$-$RANDOM"
root=$(cd "$(dirname "$0")/../../.." && pwd -P)
tests=$root/packaging/rpm/tests
logdir=$root/packaging/rpm/dist/offline/evidence/$name
mkdir -p "$logdir"
exec > >(tee "$logdir/output.log") 2>&1
work=$(mktemp -d)
container=''
installed_image=''
state_volume=''
config_volume=''
cleanup() {
  result=$?
  if [[ -n $container ]]; then
    docker inspect "$container" > "$logdir/last-container.json" 2>/dev/null || true
    mkdir -p "$logdir/last-target"
    docker cp "$container:/tmp/rpm-after-setup.verify" "$logdir/" 2>/dev/null || true
    docker cp "$container:/tmp/rpm-lifecycle-installer-status.log" "$logdir/installer-status.log" 2>/dev/null || true
    docker cp "$container:/tmp/rpm-offline-evidence/." "$logdir/last-target/" 2>/dev/null || true
    if [[ $result -ne 0 ]]; then
      docker exec "$container" systemctl status --no-pager heimdall-postgresql heimdall-server heimdall-caddy || true
      docker exec "$container" journalctl --no-pager -u heimdall-postgresql -u heimdall-server -u heimdall-caddy -n 100 || true
    fi
    docker rm -f "$container" >/dev/null || result=1
  fi
  [[ -z $installed_image ]] || docker image rm "$installed_image" >/dev/null || result=1
  for volume in "$state_volume" "$config_volume"; do
    [[ -z $volume ]] || docker volume rm "$volume" >/dev/null || result=1
  done
  rm -rf -- "$work"
  printf 'exit_status=%s\n' "$result" | tee "$logdir/result.txt"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# Python keeps host commands bounded on Linux and macOS without another package.
step() {
  local result=0
  python3 -c '
import subprocess, sys
try:
    sys.exit(subprocess.call(sys.argv[1:], timeout=900))
except subprocess.TimeoutExpired:
    print("Timed out after 900 seconds: " + repr(sys.argv[1:]), file=sys.stderr)
    sys.exit(124)
' "$@" || result=$?
  { printf 'exit=%s ' "$result"; printf '%q ' "$@"; printf '\n'; } | tee -a "$logdir/command-status.log"
  return "$result"
}
extract() {
  python3 - "$1" "$2" <<'PY'
import hashlib, pathlib, re, sys, tarfile
archive = pathlib.Path(sys.argv[1]).resolve(strict=True)
line = pathlib.Path(str(archive) + '.sha256').read_text()
match = re.fullmatch(r'([0-9a-f]{64})  ([^\n/]+)\n?', line)
if not match or match[2] != archive.name:
    raise SystemExit('Sidecar must contain only the archive basename and SHA-256')
digest = hashlib.sha256()
with archive.open('rb') as source:
    for chunk in iter(lambda: source.read(1024 * 1024), b''):
        digest.update(chunk)
if digest.hexdigest() != match[1]:
    raise SystemExit('Archive checksum mismatch: ' + str(archive))
top = archive.name[:-7]
if not archive.name.endswith('.tar.gz'):
    raise SystemExit('Expected a .tar.gz bundle')
with tarfile.open(str(archive), 'r:gz') as source:
    seen = set()
    for member in source.getmembers():
        path = pathlib.PurePosixPath(member.name)
        if (path.is_absolute() or '..' in path.parts or not path.parts or
                path.parts[0] != top or path.as_posix() in seen or
                not (member.isfile() or member.isdir())):
            raise SystemExit('Unsafe or duplicate bundle archive entry: ' + member.name)
        seen.add(path.as_posix())
    source.extractall(sys.argv[2])
root = pathlib.Path(sys.argv[2]) / top
candidates = list((root / 'repo/Packages').glob('heimdall-server-*.rpm'))
if len(candidates) != 1:
    raise SystemExit('Expected one Heimdall candidate')
print(root)
PY
}
initial=$(extract "$3" "$work/initial")
upgrade=''
[[ $# != 4 ]] || upgrade=$(extract "$4" "$work/upgrade")
{
  date -u
  printf 'platform=%s\nimage=%s\nhost_arch=%s\npackaging_commit=' "$platform" "$image" "$(uname -m)"
  git -C "$root" rev-parse HEAD
  git -C "$root" status --short
  shasum -a 256 "$3" "${3}.sha256"
  [[ -z $upgrade ]] || shasum -a 256 "$4" "${4}.sha256"
  docker info --format 'daemon_arch={{.Architecture}} daemon_os={{.OperatingSystem}}'
} > "$logdir/inputs.txt"
cp "$0" "$logdir/run-offline.sh"
cp "$initial/target" "$initial/offline-manifest.json" "$initial/runtime-manifest.json" "$logdir/"
git -C "$root" diff -- .github/workflows/build-rpm.yml packaging/rpm/tests/lifecycle.sh packaging/rpm/tests/offline-install.sh > "$logdir/test-source.diff"
daemon_arch=$(docker info --format '{{.Architecture}}')
case "$platform/$daemon_arch" in linux/arm64/aarch64|linux/arm64/arm64|linux/amd64/x86_64|linux/amd64/amd64) ;; *) echo 'Native Docker daemon architecture must match PLATFORM.' >&2; exit 64 ;; esac
[[ $(docker image inspect --format '{{.Architecture}}' "$image") == "${platform##*/}" ]]
initial_rpms=("$initial"/repo/Packages/heimdall-server-*.rpm)
unsigned=$work/unsigned.rpm
if [[ -n ${HEIMDALL_OFFLINE_UNSIGNED_RPM:-} ]]; then
  cp -- "$HEIMDALL_OFFLINE_UNSIGNED_RPM" "$unsigned"
else
  command -v rpmsign >/dev/null || { echo 'Provide HEIMDALL_OFFLINE_UNSIGNED_RPM or install rpmsign on the outer host for the unsigned rejection fixture.' >&2; exit 64; }
  cp -- "${initial_rpms[0]}" "$unsigned"
  step rpmsign --delsign "$unsigned"
fi
fresh() {
  local phase=$1
  container="$name-$phase"
  step docker run -d --name "$container" --network=none --platform "$platform" --entrypoint /bin/bash \
    -e HEIMDALL_RPM_TEST=1 "$image" -c 'sleep infinity'
  [[ $(docker inspect --format '{{.HostConfig.NetworkMode}}' "$container") == none ]]
  docker inspect "$container" > "$logdir/$phase-container.json"
  step docker cp "$tests/." "$container:/tmp/rpm-tests"
  step docker cp "$initial" "$container:/tmp/offline bundle"
}
finish_target() {
  local phase=$1
  mkdir -p "$logdir/$phase"
  step docker cp "$container:/tmp/rpm-offline-evidence/." "$logdir/$phase/"
  step docker rm -f "$container"
  container=''
}
# Rejection fixtures never benefit from packages installed by a successful test.
for rejection in wrong-id wrong-major wrong-arch extra-target rpm metadata missing unlisted unrelated-key os-key-scope unsigned unsafe-path duplicate symlink nested-rpm special-file malformed-nevra comma-directory newline-directory trailing-newline-directory argument; do
  fresh "$rejection"
  [[ $rejection != unsigned ]] || step docker cp "$unsigned" "$container:/tmp/unsigned.rpm"
  step docker exec -e "HEIMDALL_OFFLINE_REJECTION=$rejection" -e HEIMDALL_OFFLINE_UNSIGNED_RPM=/tmp/unsigned.rpm \
    "$container" bash /tmp/rpm-tests/offline-install.sh '/tmp/offline bundle'
  finish_target "$rejection"
done
fresh closure
step docker exec "$container" bash /tmp/rpm-tests/offline-closure.sh '/tmp/offline bundle'
step docker rm -f "$container"
container=''
fresh install
step docker exec "$container" bash /tmp/rpm-tests/offline-install.sh '/tmp/offline bundle'
mkdir -p "$logdir/install"
step docker cp "$container:/tmp/rpm-offline-evidence/." "$logdir/install/"
installed_image="$name:installed"
step docker commit "$container" "$installed_image"
step docker rm -f "$container"
container="$name-services"
# Volumes preserve image contents and permit atomic restore of packaged directories.
state_volume="$name-state"
config_volume="$name-config"
step docker volume create "$state_volume"
step docker volume create "$config_volume"
printf 'state_volume=%s\nconfig_volume=%s\n' "$state_volume" "$config_volume" > "$logdir/volumes.txt"
step docker run -d --name "$container" --network=none --platform "$platform" --runtime=runc \
  --privileged --cgroupns=private --tmpfs /run --tmpfs /run/lock --entrypoint /sbin/init \
  --mount "type=volume,src=$state_volume,dst=/var/lib" \
  --mount "type=volume,src=$config_volume,dst=/etc/heimdall-server" \
  -e container=docker -e HEIMDALL_RPM_TEST=1 "$installed_image"
[[ $(docker inspect --format '{{.HostConfig.NetworkMode}}' "$container") == none ]]
docker inspect "$container" > "$logdir/services-container.json"
wait_bus() {
  for ((attempt=0; attempt<60; attempt++)); do
    if docker exec "$container" systemctl show-environment >/dev/null 2>&1; then return; fi
    sleep 1
  done
  echo 'Timed out waiting for disposable systemd host.' >&2
  return 1
}
wait_bus
step docker cp "${initial_rpms[0]}" "$container:/tmp/initial.rpm"
step docker exec -e 'RPM_TEST_OFFLINE_BUNDLE=/tmp/offline bundle' -e 'RPM_TEST_GPG_KEY=/tmp/offline bundle/keys/heimdall.asc' \
  "$container" bash /tmp/rpm-tests/lifecycle.sh install /tmp/initial.rpm
# Real setup and private runtime checks precede any test inspection prerequisites.
step docker exec "$container" heimdall-cli setup --non-interactive --database-mode bundled \
  --proxy-mode bundled --tls-mode internal --external-url https://heimdall.example.test
step docker exec -i "$container" bash -s <<'TARGET'
set -euo pipefail
runtime=/usr/libexec/heimdall-server/runtime
systemctl is-active heimdall-server heimdall-postgresql heimdall-caddy
timeout 60 "$runtime/node/bin/node" <<'JS'
const http = require('node:http');
function probe() {
  const req = http.get('http://127.0.0.1:3000/server', res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        if (res.statusCode !== 200) throw new Error('HTTP ' + res.statusCode);
        JSON.parse(body);
        console.log('HTTP200 JSON readiness passed');
      } catch { setTimeout(probe, 1000); }
    });
  });
  req.setTimeout(1000, () => req.destroy(new Error('timeout')));
  req.on('error', () => setTimeout(probe, 1000));
}
probe();
JS
expected=$(find /usr/share/heimdall-server/apps/backend/migrations -maxdepth 1 -name '*.js' -type f | wc -l)
actual=$(runuser -u heimdall-postgres -- "$runtime/postgresql/bin/psql" -h /run/heimdall-postgresql -p 55432 \
  -U heimdall-postgres -d heimdall-server-production -v ON_ERROR_STOP=1 -At -c 'SELECT count(*) FROM "SequelizeMeta";')
[[ $actual -eq $expected ]]
printf 'Verified migrations: %s\n' "$actual"
"$runtime/node/bin/node" <<'JS'
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
let count = 0;
const machine = process.arch === 'arm64' ? 183 : 62;
function visit(dir) {
  for (const item of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) { visit(file); continue; }
    if (!item.isFile()) continue;
    const fd = fs.openSync(file, 'r');
    const header = Buffer.alloc(20);
    const bytes = fs.readSync(fd, header, 0, 20, 0);
    fs.closeSync(fd);
    // Optional prebuilts for other CPUs are not loadable on this native target.
    if (bytes < 20 || header.toString('hex', 0, 4) !== '7f454c46' ||
        header[4] !== 2 || header[5] !== 1 || header.readUInt16LE(18) !== machine) continue;
    const result = cp.spawnSync('/usr/bin/ldd', [file], {encoding: 'utf8'});
    const output = (result.stdout || '') + (result.stderr || '');
    if (result.error || /not found/.test(output) ||
        (result.status !== 0 && !/not a dynamic executable|statically linked/.test(output))) {
      throw new Error(file + '\n' + output);
    }
    count++;
  }
}
visit('/usr/share/heimdall-server');
visit('/usr/libexec/heimdall-server/runtime');
if (count === 0) throw new Error('No native ELF files checked');
console.log('Verified native ELF loader dependencies:', count);
JS
rpm -V heimdall-server > /tmp/rpm-after-setup.verify || {
  cat /tmp/rpm-after-setup.verify
  # systemd's StateDirectory/LogsDirectory defaults reset the CLI's 0750 to 0755.
  [[ $(systemctl show -p StateDirectoryMode --value heimdall-server) == 0755 ]]
  [[ $(systemctl show -p LogsDirectoryMode --value heimdall-server) == 0755 ]]
  for directory in /var/lib/heimdall-server /var/log/heimdall-server; do
    [[ $(stat -c '%U:%G:%a' "$directory") == heimdall:heimdall:755 ]]
  done
  [[ $(stat -c '%U:%G:%a' /etc/heimdall-server/backend.env) == root:heimdall:640 ]]
  awk '
    $2 == "c" && $3 == "/etc/heimdall-server/backend.env" && $1 ~ /^[S.]\.[5.]\.\.\.\.[T.]\.$/ { next }
    $1 == ".M......." && ($2 == "/var/lib/heimdall-server" || $2 == "/var/log/heimdall-server") { next }
    { bad=1 }
    END { exit bad }
  ' /tmp/rpm-after-setup.verify
}
command -v curl >/dev/null || { echo 'Authenticated fixture needs curl: supply a separate signed test-tools repository only after unassisted setup.' >&2; exit 1; }
TARGET
step docker exec "$container" bash /tmp/rpm-tests/lifecycle.sh setup
if [[ -n $upgrade ]]; then
  step docker cp "$upgrade" "$container:/tmp/upgrade bundle"
  upgrade_rpms=("$upgrade"/repo/Packages/heimdall-server-*.rpm)
  step docker cp "${upgrade_rpms[0]}" "$container:/tmp/upgrade.rpm"
  step docker exec -e 'RPM_TEST_OFFLINE_BUNDLE=/tmp/upgrade bundle' -e 'RPM_TEST_GPG_KEY=/tmp/upgrade bundle/keys/heimdall.asc' \
    "$container" bash /tmp/rpm-tests/lifecycle.sh upgrade /tmp/upgrade.rpm
fi
# Docker restart is container persistence evidence, never a full host reboot claim.
step docker restart "$container"
wait_bus
step docker exec "$container" bash /tmp/rpm-tests/lifecycle.sh verify
step docker exec "$container" bash /tmp/rpm-tests/features.sh
if [[ -n $upgrade ]]; then
  step docker exec "$container" bash /tmp/rpm-tests/lifecycle.sh remove
  step docker exec -e 'RPM_TEST_OFFLINE_BUNDLE=/tmp/upgrade bundle' -e 'RPM_TEST_GPG_KEY=/tmp/upgrade bundle/keys/heimdall.asc' \
    "$container" bash /tmp/rpm-tests/lifecycle.sh recover /tmp/upgrade.rpm
else
  echo 'Upgrade/remove/recovery not exercised: supply a second release bundle.'
fi
step docker exec "$container" bash -c 'rpm -qa --qf "%{NEVRA}\n" | LC_ALL=C sort > /tmp/rpm-final-inventory'
step docker cp "$container:/tmp/rpm-final-inventory" "$logdir/final-inventory.txt"
step docker cp "$container:/tmp/rpm-after-setup.verify" "$logdir/"
step docker cp "$container:/tmp/rpm-lifecycle-installer-status.log" "$logdir/installer-status.log"
step docker exec "$container" journalctl --no-pager -u heimdall-postgresql -u heimdall-server -u heimdall-caddy > "$logdir/services-journal.log"
[[ $(docker inspect --format '{{.HostConfig.NetworkMode}}' "$container") == none ]]
echo 'Disconnected native install, unassisted setup and available lifecycle checks passed.'
