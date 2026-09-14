#!/usr/bin/env bash
set -euo pipefail

container_id="$1"
scheme="${2:-https}"

wait_for_splunk() {
  curl --silent --show-error --fail --insecure \
    --retry 30 --retry-all-errors --retry-delay 2 --retry-max-time 180 --max-time 5 \
    --user 'admin:Valid_password!' \
    "${scheme}://127.0.0.1:8089/services/server/info" > /dev/null
}

# GitHub creates service containers before checkout, so repository files cannot
# be mounted into them at job creation time. Preserve the generated settings.
wait_for_splunk
docker exec --interactive --user root "$container_id" sh -c \
  'cat >> /opt/splunk/etc/system/local/server.conf' < "$(dirname "$0")/splunk.conf"
docker exec --user splunk "$container_id" /opt/splunk/bin/splunk restart
wait_for_splunk
