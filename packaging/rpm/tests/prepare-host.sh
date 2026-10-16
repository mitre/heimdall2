#!/bin/bash
# CI fixture only: provision the documented OS baseline before disconnecting.
set -euo pipefail
# BuildKit does not create /.dockerenv during Dockerfile RUN steps.
[[ ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
mkdir -p /usr/share/man/man1
# Accept coreutils-single from minimal images through its provided install tool.
dnf install -y --setopt=install_weak_deps=False \
  bash /usr/bin/install findutils gawk grep sed diffutils shadow-utils \
  glibc libgcc libstdc++ openssl openssl-libs zlib \
  systemd policycoreutils-python-utils selinux-policy-targeted \
  tar util-linux iproute logrotate \
  /usr/bin/curl cpio procps-ng gzip
dnf clean all
rpm -qa --qf '%{NAME}\n' > /tmp/rpm-baseline-packages
if grep -Eq '^(libicu.*|nodejs.*|postgresql.*|caddy)$' /tmp/rpm-baseline-packages; then
  echo 'Fresh baseline must not supply system ICU or application runtimes.' >&2
  exit 1
fi
