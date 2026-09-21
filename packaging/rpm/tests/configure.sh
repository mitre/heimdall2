#!/bin/bash
set -euo pipefail

[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || {
  echo 'Run only in a disposable RPM test container with HEIMDALL_RPM_TEST=1.' >&2
  exit 64
}

getent group heimdall >/dev/null || groupadd -r heimdall
install -d /etc/heimdall-server
cat > /etc/heimdall-server/backend.env <<'ENV'
NODE_ENV=production
DATABASE_PASSWORD='Rpm-Test-$-Password!'
JWT_SECRET=existing-jwt
API_KEY_SECRET=existing-api
EXTERNAL_URL=https://heimdall.example.test
LOCAL_LOGIN_DISABLED=true
ENV
bash /workspace/packaging/rpm/heimdall-configure.sh --non-interactive
set -a
source /etc/heimdall-server/backend.env
set +a
[[ $DATABASE_PASSWORD == 'Rpm-Test-$-Password!' ]]
[[ $JWT_SECRET == existing-jwt && $API_KEY_SECRET == existing-api ]]
[[ ${EXTERNAL_URL:-} == https://heimdall.example.test ]]
[[ ${LOCAL_LOGIN_DISABLED:-} == true ]]
[[ $(stat -c '%a %U:%G' /etc/heimdall-server/backend.env) == '640 root:heimdall' ]]
sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-config-before.sha256
bash /workspace/packaging/rpm/heimdall-configure.sh --non-interactive
sha256sum --check /tmp/rpm-config-before.sha256

cp /workspace/packaging/rpm/heimdall-backend.env /etc/heimdall-server/backend.env
env -i PATH=/usr/sbin:/usr/bin:/sbin:/bin bash -c '
  set -euo pipefail
  bash /workspace/packaging/rpm/heimdall-configure.sh --non-interactive
  source /etc/heimdall-server/backend.env
  [[ -n "$DATABASE_PASSWORD" && -n "$JWT_SECRET" && -n "$API_KEY_SECRET" ]]
'
