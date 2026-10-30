#!/bin/bash
# Exercise root-owned log rotation and reject writes from the service account.
set -euo pipefail
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
chmod 0755 "$scratch"
install -d -m 0750 -o root -g heimdall "$scratch/logs"
for name in heimdall-server heimdall-cli; do
  printf 'old log entry\n' > "$scratch/logs/$name.log"
  chown root:heimdall "$scratch/logs/$name.log"
  chmod 0640 "$scratch/logs/$name.log"
done
if runuser -u heimdall -- ln -s /etc/shadow "$scratch/logs/attacker.log"; then exit 1; fi
if runuser -u heimdall -- sh -c 'printf malicious >> "$1"' sh "$scratch/logs/heimdall-server.log"; then exit 1; fi
sed -e "s|/var/log/heimdall-server-journal|$scratch/logs|g" \
  -e '/^[[:space:]]*postrotate$/,/^[[:space:]]*endscript$/d' \
  /etc/logrotate.d/heimdall-server > "$scratch/logrotate.conf"
for rotation in 1 2; do
  logrotate --force --state "$scratch/state" "$scratch/logrotate.conf"
  for name in heimdall-server heimdall-cli; do
    [[ $(stat -c '%U:%G:%a' "$scratch/logs/$name.log") == root:heimdall:640 ]]
    printf 'new log entry\n' >> "$scratch/logs/$name.log"
  done
done
gzip -dc "$scratch/logs/heimdall-server.log.2.gz" | grep -Fxq 'old log entry'
gzip -dc "$scratch/logs/heimdall-cli.log.2.gz" | grep -Fxq 'old log entry'
