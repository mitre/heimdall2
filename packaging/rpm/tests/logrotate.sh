#!/bin/bash
# Exercise rotation as the service user, including an existing root-owned CLI log.
set -euo pipefail
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
chmod 0755 "$scratch"
install -d -m 0750 -o heimdall -g heimdall "$scratch/logs"
for name in heimdall-server heimdall-cli; do
  printf 'old log entry\n' > "$scratch/logs/$name.log"
  chown root:heimdall "$scratch/logs/$name.log"
  chmod 0640 "$scratch/logs/$name.log"
done
sed -e "s|/var/log/heimdall-server|$scratch/logs|g" \
  -e '/^[[:space:]]*postrotate$/,/^[[:space:]]*endscript$/d' \
  /etc/logrotate.d/heimdall-server > "$scratch/logrotate.conf"
for rotation in 1 2; do
  logrotate --force --state "$scratch/state" "$scratch/logrotate.conf"
  for name in heimdall-server heimdall-cli; do
    [[ $(stat -c '%U:%G:%a' "$scratch/logs/$name.log") == heimdall:heimdall:640 ]]
    printf 'new log entry\n' >> "$scratch/logs/$name.log"
  done
done
for name in heimdall-server heimdall-cli; do
  gzip -dc "$scratch/logs/$name.log.2.gz" | grep -Fxq 'old log entry'
done
