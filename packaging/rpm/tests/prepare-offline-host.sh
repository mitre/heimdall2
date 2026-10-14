#!/bin/bash
# Provision only the recorded OS baseline; bundled additions stay uninstalled.
set -euo pipefail
[[ ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 && $# == 1 ]] || exit 64
manifest=$1
helper="$(dirname "$0")/offline-baseline.py"
python=python3
command -v "$python" >/dev/null || python=/usr/libexec/platform-python
packages=$(mktemp)
trap 'rm -f "$packages"' EXIT
"$python" "$helper" packages "$manifest" > "$packages"
declare -A exact
baseline=()
while IFS=$'\t' read -r name nevra; do
  exact["$name"]=$nevra
  baseline+=("$nevra")
done < "$packages"
dnf_options=(-y --setopt=install_weak_deps=False --setopt=tsflags= \
  --setopt=clean_requirements_on_remove=False)
# Minimal container variants conflict with the regular Core packages.
for pair in coreutils-single:coreutils curl-minimal:curl libcurl-minimal:libcurl; do
  minimal=${pair%%:*}
  regular=${pair#*:}
  if [[ -n ${exact[$regular]:-} ]] && rpm -q "$minimal" >/dev/null 2>&1; then
    dnf "${dnf_options[@]}" swap "$minimal" "${exact[$regular]}"
  fi
done
if ! dnf "${dnf_options[@]}" install "${baseline[@]}"; then
  echo 'Unable to install the exact recorded Core baseline. Check the DNF error above; the recorded repository snapshot must remain available.' >&2
  exit 1
fi
"$python" "$helper" dependencies "$manifest" > "$packages"
present=()
while IFS= read -r name; do
  if rpm -q "$name" >/dev/null 2>&1; then present+=("$name"); fi
done < "$packages"
# Container images may supply extras such as tar even when lean Core does not.
if [[ ${#present[@]} -gt 0 ]]; then
  dnf "${dnf_options[@]}" remove "${present[@]}"
fi
"$python" "$helper" record "$manifest"
dnf clean all
