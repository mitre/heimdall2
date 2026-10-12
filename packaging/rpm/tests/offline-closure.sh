#!/usr/bin/env bash
# The caller must disable networking (for example Docker --network=none).
set -euo pipefail
[[ ${HEIMDALL_RPM_TEST:-} == 1 ]] || { echo 'Set HEIMDALL_RPM_TEST=1 on a disposable native EL host.' >&2; exit 1; }
[[ $EUID == 0 ]] || { echo 'Closure verification requires root.' >&2; exit 1; }
[[ $# == 1 && -d $1 && ! -L $1 ]] || { echo 'Usage: offline-closure.sh BUNDLE_DIRECTORY' >&2; exit 1; }
bundle=$(cd -- "$1" && pwd -P)

if command -v python3 >/dev/null 2>&1; then
  python=python3
elif [[ -x /usr/libexec/platform-python ]]; then
  python=/usr/libexec/platform-python
else
  echo 'Closure verification requires python3 or /usr/libexec/platform-python.' >&2
  exit 1
fi
"$python" - "$bundle" <<'PY'
import hashlib
import json
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
files = {}
for path in root.rglob('*'):
    if path.is_symlink() or not (path.is_file() or path.is_dir()):
        raise ValueError('Bundle contains a symlink or special file')
    if path.is_file() and path.name != 'SHA256SUMS':
        files[str(path.relative_to(root))] = path
entries = {}
for line in (root / 'SHA256SUMS').read_text().splitlines():
    match = re.fullmatch(r'([0-9a-f]{64})  (.+)', line)
    if not match or match[2] not in files or match[2] in entries:
        raise ValueError('Invalid checksum inventory')
    entries[match[2]] = match[1]
if entries.keys() != files.keys():
    raise ValueError('Checksum inventory omits bundle files')
for name, path in files.items():
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    if entries[name] != digest.hexdigest():
        raise ValueError('Checksum mismatch: ' + name)
manifest = json.loads((root / 'offline-manifest.json').read_text())
if manifest.get('schema') != 1 or manifest.get('install_weak_deps') is not True:
    raise ValueError('Unsupported offline inventory')
for kind, suffix in [('packages', '.rpm'), ('keys', '.asc')]:
    records = manifest.get(kind, [])
    expected = {name for name in files if name.endswith(suffix)}
    if not records or len(records) != len(expected) or {record['path'] for record in records} != expected:
        raise ValueError('Incomplete package or key inventory')
    for record in records:
        if record['sha256'] != entries[record['path']]:
            raise ValueError('Inventory digest mismatch')
if not manifest.get('repositories'):
    raise ValueError('Missing source repository inventory')
target = (root / 'target').read_text().splitlines()
if len(target) != 1 or len(target[0].split()) != 3:
    raise ValueError('Invalid target record')
distribution, major, architecture = target[0].split()
if distribution not in ('rhel', 'rocky', 'almalinux', 'ol') or major not in ('8', '9', '10') or architecture not in ('x86_64', 'aarch64'):
    raise ValueError('Unsupported target')
if manifest['target'] != dict(id=distribution, el_major=major, architecture=architecture):
    raise ValueError('Target inventory mismatch')
nevra = (root / 'heimdall-nevra').read_text().splitlines()
if len(nevra) != 1 or not re.fullmatch(r'heimdall-server-[A-Za-z0-9._+:~-]+', nevra[0]) or manifest['heimdall_nevra'] != nevra[0]:
    raise ValueError('Invalid Heimdall NEVRA')
PY

read -r distribution major arch < "$bundle/target"
read -r nevra < "$bundle/heimdall-nevra"
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
verification_root=$work/root
empty_repos=$work/repos
os_db=$work/os-db
heimdall_db=$work/heimdall-db
mkdir -p "$verification_root" "$empty_repos" "$os_db" "$heimdall_db" "$work/vars"
config=$work/dnf.conf
cat > "$config" <<EOF
[main]
gpgcheck=1
localpkg_gpgcheck=1
install_weak_deps=1
best=1
skip_if_unavailable=0
EOF
rpm --root "$verification_root" --initdb
rpm --dbpath "$os_db" --initdb
rpm --dbpath "$heimdall_db" --initdb
shopt -s nullglob
os_keys=("$bundle"/keys/os/*.asc)
[[ ${#os_keys[@]} -gt 0 && -f $bundle/keys/heimdall.asc ]]
for key in "${os_keys[@]}"; do
  rpm --root "$verification_root" --import "$key"
  rpm --dbpath "$os_db" --import "$key"
done
rpm --root "$verification_root" --import "$bundle/keys/heimdall.asc"
rpm --dbpath "$heimdall_db" --import "$bundle/keys/heimdall.asc"
packages=("$bundle"/repo/Packages/*.rpm)
[[ ${#packages[@]} -gt 1 ]]
candidates=0
for package in "${packages[@]}"; do
  package_nevra=$(rpm -qp --qf '%{NEVRA}' "$package")
  package_arch=$(rpm -qp --qf '%{ARCH}' "$package")
  [[ $package_arch == "$arch" || $package_arch == noarch ]] || { echo 'RPM architecture mismatch.' >&2; exit 1; }
  db=$os_db
  if [[ $package_nevra == "$nevra" ]]; then
    db=$heimdall_db
    candidates=$((candidates + 1))
  fi
  signature=$(LC_ALL=C rpmkeys --dbpath "$db" --checksig --verbose "$package") || { echo "RPM signature verification failed: ${package##*/}" >&2; exit 1; }
  grep -Eq 'Signature.*: OK' <<< "$signature" || { echo "Unsigned RPM: ${package##*/}" >&2; exit 1; }
done
[[ $candidates == 1 ]] || { echo 'Expected exactly one signed Heimdall candidate.' >&2; exit 1; }
dnf -y --noplugins --config "$config" \
  --installroot "$verification_root" --releasever "$major" \
  --forcearch "$arch" --setopt=reposdir="$empty_repos" \
  --setopt=varsdir="$work/vars" \
  --setopt=module_platform_id="platform:el$major" \
  --setopt=install_weak_deps=True --disablerepo='*' \
  --repofrompath="heimdall-offline,$bundle/repo" \
  --enablerepo=heimdall-offline \
  --setopt=heimdall-offline.gpgcheck=True \
  --setopt=heimdall-offline.gpgkey= \
  --setopt=heimdall-offline.module_hotfixes=True \
  --setopt=tsflags=test install "$nevra"
installed=$(rpm --root "$verification_root" -qa --qf '%{NAME}\n')
while IFS= read -r package; do
  [[ $package == gpg-pubkey ]] || { echo "Transaction installed unexpected package: $package" >&2; exit 1; }
done <<< "$installed"
echo 'Offline closure transaction passed without installing packages.'
