#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: sh scripts/test-container.sh IMAGE" >&2
  exit 2
fi

image=$1
script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
test_dir=$(mktemp -d /tmp/heimdall-image-test.XXXXXX)
test_name=$(basename "$test_dir")
database_name=$test_name-db
server_name=$test_name-server

cleanup() {
  result=$?
  trap - EXIT
  if [ "$result" -ne 0 ]; then
    docker logs "$server_name" >&2 2>/dev/null || true
  fi
  docker rm -f "$server_name" "$database_name" >/dev/null 2>&1 || true
  docker network rm "$test_name" >/dev/null 2>&1 || true
  rmdir "$test_dir"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

docker network create "$test_name" >/dev/null
docker run -d --name "$database_name" --network "$test_name" \
  --network-alias database --env POSTGRES_PASSWORD=container-smoke-only \
  --env POSTGRES_DB=heimdall-server-production \
  --tmpfs /var/lib/postgresql/data postgres:17 >/dev/null

attempt=0
until docker exec "$database_name" pg_isready -U postgres >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    docker logs "$database_name" >&2
    exit 1
  fi
  sleep 1
done

docker run -d --name "$server_name" --network "$test_name" \
  --network-alias heimdall --env NODE_ENV=production \
  --env DATABASE_HOST=database --env DATABASE_PASSWORD=container-smoke-only \
  --env JWT_SECRET=container-smoke-only-never-use-in-production \
  --env EXTERNAL_URL=http://heimdall:3000 "$image" >/dev/null

docker run --rm --network "$test_name" --entrypoint node \
  --env HEIMDALL_TEST_URL=http://heimdall:3000 \
  --mount "type=bind,src=$script_dir/container-smoke.cjs,dst=/container-smoke.cjs,readonly" \
  "$image" --test /container-smoke.cjs

test "$(docker inspect --format '{{.RestartCount}}' "$server_name")" -eq 0
test "$(docker inspect --format '{{.State.Running}}' "$server_name")" = true
