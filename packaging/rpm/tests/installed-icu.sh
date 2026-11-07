#!/bin/bash
# Verify direct and indirect ICU dependencies use the installed private runtime.
set -euo pipefail
runtime=/usr/libexec/heimdall-server/runtime
dependencies=$(env -u LD_LIBRARY_PATH -u LD_PRELOAD ldd "$runtime/postgresql/bin/postgres")
printf '%s\n' "$dependencies"
! grep -Fq 'not found' <<< "$dependencies"
for library in libicudata libicui18n libicuuc; do
  grep -Eq "^[[:space:]]*$library[.]so[.][0-9]+ => $runtime/postgresql/lib/$library[.]so[.][0-9]+ " <<< "$dependencies"
done
env -u LD_LIBRARY_PATH -u LD_PRELOAD "$runtime/postgresql/bin/postgres" --version
