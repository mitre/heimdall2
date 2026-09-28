#!/bin/bash
set -euo pipefail

[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || {
  echo 'Run only in a disposable RPM test container with HEIMDALL_RPM_TEST=1.' >&2
  exit 64
}
[[ ! -d /run/systemd/system ]] || {
  echo 'Run this preflight check in a container without systemd.' >&2
  exit 64
}

getent group heimdall >/dev/null || groupadd -r heimdall
install -d /etc/heimdall-server /usr/libexec/heimdall-server
install -m 0755 /workspace/packaging/rpm/heimdall-configure.sh \
  /usr/libexec/heimdall-server/configure.sh
cat > /etc/heimdall-server/backend.env <<'ENV'
DATABASE_PASSWORD=keep-existing-password
EXTERNAL_URL=https://before.example.test
ENV
sha256sum /etc/heimdall-server/backend.env > /tmp/rpm-setup-before.sha256

reject_setup() {
  if bash /workspace/packaging/rpm/heimdall-setup.sh \
    --non-interactive --skip-db --skip-tls \
    --external-url https://after.example.test > /tmp/rpm-setup.log 2>&1; then
    echo 'Setup unexpectedly succeeded without systemd.' >&2
    exit 1
  fi
  grep -q 'Heimdall setup requires a running systemd service manager.' /tmp/rpm-setup.log
  sha256sum --check /tmp/rpm-setup-before.sha256
}

reject_setup
mkdir -p /run/systemd/system
trap 'rmdir /run/systemd/system' EXIT
if systemctl show-environment >/dev/null 2>&1; then
  echo 'Run this preflight check without a reachable systemd manager.' >&2
  exit 64
fi
reject_setup

bash /workspace/packaging/rpm/heimdall-setup.sh --non-interactive --reconfigure \
  --external-url https://after.example.test
source /etc/heimdall-server/backend.env
[[ $DATABASE_PASSWORD == keep-existing-password ]]
[[ $EXTERNAL_URL == https://after.example.test ]]
rmdir /run/systemd/system
trap - EXIT
bash /workspace/packaging/rpm/heimdall-setup.sh --non-interactive --reconfigure \
  --external-url https://without-systemd.example.test
source /etc/heimdall-server/backend.env
[[ $EXTERNAL_URL == https://without-systemd.example.test ]]
