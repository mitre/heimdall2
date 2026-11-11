#!/usr/bin/env bash
set -euo pipefail

image="$1"
MAX_RETRIES=5
RETRY_DELAY=0.5 # in seconds
RETRY_COUNT=0
SUCCESS=false

while [ "$RETRY_COUNT" -lt "$MAX_RETRIES" ]; do
  if docker pull "$image"; then
    SUCCESS=true
    break
  else
    RETRY_COUNT="$((RETRY_COUNT + 1))"
    echo "Retry $RETRY_COUNT/$MAX_RETRIES: Docker pull failed. Retrying in $RETRY_DELAY seconds..."
    sleep "$RETRY_DELAY"
  fi
done

if [ "$SUCCESS" = true ]; then
  amd64="$(docker buildx imagetools inspect "$image" --format '{{range .Manifest.Manifests}}{{if and (eq .Platform.OS "linux") (eq .Platform.Architecture "amd64")}}{{.Digest}}{{end}}{{end}}')"
  arm64="$(docker buildx imagetools inspect "$image" --format '{{range .Manifest.Manifests}}{{if and (eq .Platform.OS "linux") (eq .Platform.Architecture "arm64")}}{{.Digest}}{{end}}{{end}}')"
  echo "amd64=$amd64" >> "$GITHUB_OUTPUT"
  echo "arm64=$arm64" >> "$GITHUB_OUTPUT"
else
  echo "Docker pull failed after $MAX_RETRIES attempts."
  exit 1
fi
