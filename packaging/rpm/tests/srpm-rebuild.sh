#!/bin/bash
# Rebuild from the SRPM alone; no original SOURCES/BUILD paths are supplied.
set -euo pipefail
srpm=$(realpath "${1:?source RPM}")
topdir=$(realpath -m "${2:?empty rebuild TOPDIR}")
[[ ! -e $topdir ]] || { echo 'SRPM rebuild TOPDIR must not exist.' >&2; exit 64; }
mkdir -p "$topdir"/{SOURCES,SPECS,BUILD,BUILDROOT,RPMS,SRPMS}
rpm -ivh --define "_topdir $topdir" "$srpm"
spec="$topdir/SPECS/heimdall-server.spec"
# Each private archive, inventory and service must be present in the SRPM.
for source in node-runtime.tar.xz postgresql-runtime.tar.bz2 caddy-runtime.tar.gz \
  runtime-manifest.json heimdall-postgresql.service heimdall-caddy.service; do
  test -s "$topdir/SOURCES/$source"
done
python3 - "$topdir/SOURCES" <<'PY'
import hashlib, json, pathlib, sys
sources = pathlib.Path(sys.argv[1])
manifest = json.loads((sources / 'runtime-manifest.json').read_text())
for item in manifest['runtimes'].values():
    assert hashlib.sha256((sources / item['archive']).read_bytes()).hexdigest() == item['sha256']
PY
# BuildRequires remain RPM-resolved, even when the original builder had more tools.
dnf builddep -y "$spec"
# Reject runtime acquisition in the rebuild stages. Yarn's application dependencies
# still need network; this is not an offline application build.
if sed -n '/^%prep/,/^%install/p' "$spec" | grep -Eq 'stage-runtimes|curl|wget|urlopen'; then
  echo 'Runtime fetch found in SRPM build stages.' >&2
  exit 1
fi
rpmbuild --rebuild --define "_topdir $topdir" "$srpm"
version=$(rpm -qp --qf '%{VERSION}' "$srpm")
mapfile -t rebuilt < <(find "$topdir/RPMS" -name 'heimdall-server-*.rpm')
test "${#rebuilt[@]}" -eq 1
bash "$(dirname "$0")/payload.sh" "${rebuilt[0]}" "$version"
