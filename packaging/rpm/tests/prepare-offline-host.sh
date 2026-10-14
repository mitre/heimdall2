#!/bin/bash
# Provision current Core packages; bundled additions stay uninstalled.
set -euo pipefail
[[ ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 && $# == 1 ]] || exit 64
manifest=$1
helper="$(dirname "$0")/offline-baseline.py"
python=python3
command -v "$python" >/dev/null || python=/usr/libexec/platform-python
packages=$(mktemp)
trap 'rm -f "$packages"' EXIT
"$python" "$helper" packages "$manifest" > "$packages"
baseline=()
while IFS= read -r package; do
  baseline+=("$package")
done < "$packages"
dnf_options=(-y --setopt=gpgcheck=1 --setopt=localpkg_gpgcheck=1 \
  --setopt=install_weak_deps=False --setopt=tsflags= \
  --setopt=clean_requirements_on_remove=False)
# Allow the regular Core packages to replace conflicting minimal image variants.
if ! dnf "${dnf_options[@]}" --allowerasing install "${baseline[@]}"; then
  echo 'Unable to install the Core baseline. Check the DNF error above.' >&2
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
