#!/usr/bin/env bash
# Verify a trusted archive, then install only its exact Heimdall candidate.
set -euo pipefail
export LC_ALL=C
fail() { echo "Offline installation failed: $*" >&2; exit 1; }
[[ $EUID == 0 ]] || fail 'Run this installer as root.'
answer_args=()
if [[ $# == 1 && $1 == --assumeyes ]]; then
  answer_args=(-y)
elif [[ $# != 0 ]]; then
  fail 'Usage: install.sh [--assumeyes]'
fi
[[ ${BASH_SOURCE[0]} != *$'\n'* ]] || fail 'Bundle directory must not contain a newline or comma.'
# The suffix prevents command substitution from stripping directory newlines.
bundle=$(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && printf '%s/.' "$PWD")
bundle=${bundle%/.}
[[ $bundle != *$'\n'* && $bundle != *','* ]] || fail 'Bundle directory must not contain a newline or comma.'
cd -- "$bundle"

# Treat every bundle file as an input, including keys, metadata and this script.
declare -A files=() checked=()
while IFS= read -r -d '' path; do
  [[ ! -L $path && ( -d $path || -f $path ) ]] || fail "Symlink or special file: $path"
  name=${path#./}
  [[ $name =~ ^[A-Za-z0-9_./+:~-]+$ && /$name/ != *'/../'* && /$name/ != *'/./'* ]] || fail "Unsafe bundle path: $name"
  if [[ $name == *.rpm && ! $name =~ ^repo/Packages/[A-Za-z0-9_.+:~-]+\.rpm$ ]]; then fail "Unexpected RPM path: $name"; fi
  [[ ! -f $path || $name == SHA256SUMS ]] || files["$name"]=1
done < <(find . -mindepth 1 -print0)
[[ -f SHA256SUMS ]] || fail 'Missing SHA256SUMS.'
while IFS= read -r line || [[ -n $line ]]; do
  [[ $line =~ ^([0-9a-f]{64})\ \ ([A-Za-z0-9_./+:~-]+)$ ]] || fail 'Malformed checksum entry.'
  name=${BASH_REMATCH[2]}
  [[ $name != /* && /$name/ != *'/../'* && /$name/ != *'/./'* && $name != *'//'* ]] || fail "Unsafe checksum path: $name"
  [[ ${files[$name]:-} == 1 && -z ${checked[$name]:-} ]] || fail "Missing, duplicate or unexpected checksum file: $name"
  checked["$name"]=1
done < SHA256SUMS
[[ ${#files[@]} == ${#checked[@]} ]] || fail 'Checksum inventory omits bundle files.'
for required in target heimdall-nevra offline-manifest.json runtime-manifest.json install.sh README.txt keys/heimdall.asc repo/repodata/repomd.xml; do
  [[ ${checked[$required]:-} == 1 ]] || fail "Missing bundle file: $required"
done
sha256sum --check --strict SHA256SUMS || fail 'Bundle checksum verification failed.'

mapfile -t target < target
[[ ${#target[@]} == 1 && ${target[0]} =~ ^(rhel|rocky|almalinux|ol)\ (8|9|10)\ (x86_64|aarch64)$ ]] || fail 'Invalid target record.'
distribution=${BASH_REMATCH[1]} major=${BASH_REMATCH[2]} arch=${BASH_REMATCH[3]}
# Parse installed OS metadata as data; never execute an os-release or bundle file.
declare -A os=()
while IFS= read -r line || [[ -n $line ]]; do
  [[ -n $line && $line != \#* ]] || continue
  [[ $line =~ ^([A-Z_][A-Z_0-9]*)=(.*)$ ]] || fail 'Malformed installed os-release assignment.'
  name=${BASH_REMATCH[1]} value=${BASH_REMATCH[2]}
  [[ -z ${os[$name]+present} ]] || fail 'Duplicate installed os-release assignment.'
  if [[ $value == \"*\" || $value == \'*\' ]]; then
    value=${value:1:${#value}-2}
  else
    [[ $value =~ ^[A-Za-z0-9._:/+-]+$ ]] || fail 'Malformed installed os-release value.'
  fi
  os["$name"]=$value
done < /etc/os-release
[[ ${os[ID]:-} == "$distribution" && ${os[VERSION_ID]:-} =~ ^$major(\.[0-9]+)*$ && ${os[PLATFORM_ID]:-} == "platform:el$major" ]] || fail 'Bundle distribution or EL major does not match this host.'
[[ $(rpm --eval '%{_arch}') == "$arch" ]] || fail 'Bundle architecture does not match this host.'
mapfile -t candidates < heimdall-nevra
[[ ${#candidates[@]} == 1 && ${candidates[0]} =~ ^heimdall-server-[A-Za-z0-9._+:~-]+$ ]] || fail 'Invalid Heimdall NEVRA record.'
nevra=${candidates[0]}

work=$(mktemp -d /tmp/heimdall-offline.XXXXXX)
trap 'rm -rf -- "$work"' EXIT
mkdir -p "$work/os-db" "$work/heimdall-db" "$work/repos" "$work/vars" "$work/cache" "$work/log"
shopt -s nullglob
os_keys=("$bundle"/keys/os/*.asc)
packages=("$bundle"/repo/Packages/*.rpm)
[[ ${#os_keys[@]} -gt 0 && ${#packages[@]} -gt 1 ]] || fail 'Missing distribution keys or dependency packages.'
rpm --dbpath "$work/os-db" --initdb
rpm --dbpath "$work/heimdall-db" --initdb
for key in "${os_keys[@]}"; do rpm --dbpath "$work/os-db" --import "$key"; done
rpm --dbpath "$work/heimdall-db" --import "$bundle/keys/heimdall.asc"
count=0
for package in "${packages[@]}"; do
  record=$(rpm --dbpath "$work/os-db" -qp --qf '%{NAME}\t%{NEVRA}\t%{ARCH}' "$package" 2>/dev/null) || fail "Invalid RPM: ${package##*/}"
  IFS=$'\t' read -r name package_nevra package_arch <<< "$record"
  [[ $package_arch == "$arch" || $package_arch == noarch ]] || fail "RPM architecture mismatch: ${package##*/}"
  db=$work/os-db
  if [[ $name == heimdall-server ]]; then
    [[ $package_nevra == "$nevra" && $package_arch == "$arch" ]] || fail 'Unexpected Heimdall RPM.'
    db=$work/heimdall-db
    count=$((count + 1))
  fi
  signature=$(rpmkeys --dbpath "$db" --checksig --verbose "$package" 2>&1) || fail "RPM signature verification failed: ${package##*/}"
  [[ $signature =~ Signature.*:\ OK ]] || fail "Unsigned RPM: ${package##*/}"
done
[[ $count == 1 ]] || fail 'Expected exactly one signed Heimdall candidate.'

cat > "$work/dnf.conf" <<CONF
[main]
gpgcheck=1
localpkg_gpgcheck=1
install_weak_deps=1
best=1
skip_if_unavailable=0
reposdir=$work/repos
varsdir=$work/vars
cachedir=$work/cache
logdir=$work/log
CONF
dnf_args=(--noplugins --config "$work/dnf.conf" --disablerepo='*'
  --repofrompath="heimdall-offline,$bundle/repo" --enablerepo=heimdall-offline
  --setopt=heimdall-offline.gpgcheck=True --setopt=heimdall-offline.gpgkey=
  --setopt=heimdall-offline.module_hotfixes=True
  --setopt=localpkg_gpgcheck=True --setopt=install_weak_deps=True)
action=install
installed=$(rpm -q --qf '%{NEVRA}' heimdall-server 2>/dev/null || true)
if rpm -q heimdall-server >/dev/null 2>&1; then action=upgrade; fi
if [[ $installed != "$nevra" ]]; then
  for key in "${os_keys[@]}" "$bundle/keys/heimdall.asc"; do rpm --import "$key"; done
  dnf "${dnf_args[@]}" -y --setopt=tsflags=test "$action" "$nevra"
  # RPM can report a failed scriptlet while DNF returns zero.
  dnf "${dnf_args[@]}" "${answer_args[@]}" --setopt=tsflags= "$action" "$nevra" 2>&1 | tee "$work/transaction.log"
  if grep -Eqi '^(warning|error): %[^ ]+ scriptlet failed(,|$)|^Error in [A-Z]+ scriptlet in rpm package( |$)' "$work/transaction.log"; then fail 'RPM scriptlet failure; inspect the transaction above.'; fi
fi
[[ $(rpm -q --qf '%{NEVRA}' heimdall-server) == "$nevra" ]] || fail 'Installed Heimdall NEVRA does not match the bundle; downgrades are not supported.'
echo "Installed and verified $nevra. Run heimdall-cli setup to configure the application."
