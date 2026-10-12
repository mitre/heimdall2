#!/usr/bin/env bash
# Run only in a disposable target; the caller disables networking before copying files.
set -euo pipefail
[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || {
  echo 'Offline installation tests require a disposable root container and HEIMDALL_RPM_TEST=1.' >&2; exit 64;
}
[[ $# == 1 ]] || { echo 'Usage: offline-install.sh BUNDLE_DIRECTORY' >&2; exit 64; }
bundle=$(realpath -- "$1")
work=$(mktemp -d /tmp/offline-test.XXXXXX)
trap 'rm -rf -- "$work"' EXIT
inventory() { rpm -qa --qf '%{NEVRA}\n' | LC_ALL=C sort; }
rehash() { (cd -- "$1"; find . -type f ! -name SHA256SUMS -printf '%P\n' | LC_ALL=C sort | while IFS= read -r path; do sha256sum -- "$path"; done) > "$1/SHA256SUMS"; }

# Select one case per fresh container, keeping the original bundle untouched.
if [[ -n ${HEIMDALL_OFFLINE_REJECTION:-} ]]; then
  bad=$work/bundle
  cp -a -- "$bundle" "$bad"
  read -r id major arch < "$bad/target"
  candidate=("$bad"/repo/Packages/heimdall-server-*.rpm)
  case $HEIMDALL_OFFLINE_REJECTION in
    wrong-id) [[ $id == rocky ]] && id=ol || id=rocky; printf '%s %s %s\n' "$id" "$major" "$arch" > "$bad/target"; rehash "$bad" ;;
    wrong-major) [[ $major == 10 ]] && major=9 || major=10; printf '%s %s %s\n' "$id" "$major" "$arch" > "$bad/target"; rehash "$bad" ;;
    wrong-arch) [[ $arch == aarch64 ]] && arch=x86_64 || arch=aarch64; printf '%s %s %s\n' "$id" "$major" "$arch" > "$bad/target"; rehash "$bad" ;;
    extra-target) printf ' extra\n' >> "$bad/target"; rehash "$bad" ;;
    rpm) printf 'tamper' >> "${candidate[0]}" ;;
    metadata) printf 'tamper' >> "$bad/repo/repodata/repomd.xml" ;;
    missing) rm -- "${candidate[0]}" ;;
    unlisted) cp -- "${candidate[0]}" "$bad/repo/Packages/unlisted.rpm" ;;
    unrelated-key) os_keys=("$bad"/keys/os/*.asc); cp -- "${os_keys[0]}" "$bad/keys/heimdall.asc"; rehash "$bad" ;;
    os-key-scope) rm -- "$bad"/keys/os/*.asc; cp -- "$bad/keys/heimdall.asc" "$bad/keys/os/1.asc"; rehash "$bad" ;;
    unsigned) cp -- "${HEIMDALL_OFFLINE_UNSIGNED_RPM:?Provide an unsigned copy of the candidate RPM}" "${candidate[0]}"; rehash "$bad" ;;
    unsafe-path) printf '%064d  ../outside\n' 0 >> "$bad/SHA256SUMS" ;;
    duplicate) head -n 1 "$bad/SHA256SUMS" >> "$bad/SHA256SUMS" ;;
    symlink) mv -- "${candidate[0]}" "$work/candidate.rpm"; ln -s "$work/candidate.rpm" "${candidate[0]}" ;;
    nested-rpm) mkdir "$bad/repo/Packages/nested"; printf 'unsigned fixture\n' > "$bad/repo/Packages/nested/extra.rpm"; rehash "$bad" ;;
    special-file) mkfifo "$bad/repo/Packages/extra.rpm" ;;
    malformed-nevra) printf 'extra\n' >> "$bad/heimdall-nevra"; rehash "$bad" ;;
    comma-directory) mv -- "$bad" "$work/bundle,comma"; bad=$work/bundle,comma ;;
    newline-directory) renamed=$work/$'bundle\nline'; mv -- "$bad" "$renamed"; bad=$renamed ;;
    trailing-newline-directory) renamed=$work/$'bundle\n'; cp -a -- "$bad" "$renamed"; bad=$renamed ;;
    argument) ;;
    *) echo 'Unknown rejection case.' >&2; exit 64 ;;
  esac
  inventory > "$work/before"
  args=(--assumeyes)
  [[ $HEIMDALL_OFFLINE_REJECTION != argument ]] || args+=(--unexpected)
  if bash "$bad/install.sh" "${args[@]}"; then
    echo "Invalid offline bundle was accepted: $HEIMDALL_OFFLINE_REJECTION" >&2; exit 1
  fi
  inventory > "$work/after"
  [[ $(cat "$work/before") == $(cat "$work/after") ]]
  echo "Rejected $HEIMDALL_OFFLINE_REJECTION without changing RPM inventory."
  exit 0
fi

# A valid path containing diagnostic words must still install successfully.
cp -a -- "$bundle" "$work/scriptlet-failure bundle"
bundle=$work/'scriptlet-failure bundle'
inventory > "$work/before"
bash "$bundle/install.sh" --assumeyes
IFS= read -r expected < "$bundle/heimdall-nevra"
[[ $(rpm -q --qf '%{NEVRA}' heimdall-server) == "$expected" ]]
rpm -V heimdall-server
inventory > "$work/after"
bash "$bundle/install.sh" --assumeyes
inventory > "$work/rerun"
[[ $(cat "$work/after") == $(cat "$work/rerun") ]]
runtime=/usr/libexec/heimdall-server/runtime
"$runtime/node/bin/node" --version
"$runtime/postgresql/bin/postgres" --version
"$runtime/postgresql/bin/psql" --version
"$runtime/caddy/caddy" version
heimdall-cli --version
echo 'Disconnected initial installation, RPM verification, idempotence and runtimes passed.'
