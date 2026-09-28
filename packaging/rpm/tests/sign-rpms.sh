#!/bin/bash
# Disposable test signatures only; never use a release signing key here.
set -euo pipefail

if [[ ${1:-} == --container ]]; then
  [[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || {
    echo 'Run only in a disposable RPM test container with HEIMDALL_RPM_TEST=1.' >&2
    exit 64
  }
  public=${2:?public key output}
  shift 2
  [[ $# -gt 0 ]] || exit 64
  for artifact in "$@"; do test -s "$artifact"; done
  dnf install -y rpm-sign gnupg2
  export GNUPGHOME
  GNUPGHOME=$(mktemp -d /tmp/heimdall-rpm-sign.XXXXXX)
  cleanup() {
    result=$?
    gpgconf --kill gpg-agent || true
    rm -rf "$GNUPGHOME"
    if [[ $result -ne 0 ]]; then rm -f "$public"; fi
    exit "$result"
  }
  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  gpg --batch --pinentry-mode loopback --passphrase '' --quick-generate-key \
    'Heimdall disposable RPM test <rpm-test@example.invalid>' rsa2048 sign 1d
  fingerprint=$(gpg --batch --with-colons --list-secret-keys | awk -F: '$1 == "fpr" {print $10; exit}')
  test -n "$fingerprint"
  gpg --batch --armor --export "$fingerprint" > "$public"
  test -s "$public"
  rpm --import "$public"
  for artifact in "$@"; do
    # EL8's signing macro passes filenames to GPG without quoting them.
    cp -p "$artifact" "$GNUPGHOME/package.rpm"
    rpmsign --define "_gpg_name $fingerprint" --define "_gpg_path $GNUPGHOME" \
      --define '__gpg /usr/bin/gpg2' --define '_gpg_digest_algo sha256' --addsign "$GNUPGHOME/package.rpm"
    rpmkeys --checksig --verbose "$GNUPGHOME/package.rpm" | tee "$GNUPGHOME/checksig.log"
    grep -Eq 'Signature.*: OK' "$GNUPGHOME/checksig.log"
    mv "$GNUPGHOME/package.rpm" "$artifact"
    sha256sum "$artifact"
  done
  exit
fi

platform=${1:?platform or --container}
[[ $platform == linux/arm64 || $platform == linux/amd64 ]] || exit 64
public=${2:?public key output}
shift 2
[[ $# -gt 0 ]] || exit 64
for artifact in "$@"; do test -s "$artifact"; done
name="heimdall-rpm-signer-${platform##*/}-$$-$RANDOM"
image="heimdall-integration-test:${platform##*/}"
ca_args=()
if [[ -n ${RPM_TEST_CA:-} ]]; then ca_args=(--secret "id=corp_ca,src=$RPM_TEST_CA"); fi
docker build --platform "$platform" "${ca_args[@]}" \
  -f packaging/rpm/Dockerfile.ol8 --target test-host -t "$image" .
signer=''
cleanup() {
  result=$?
  if [[ -n $signer ]]; then docker rm -fv "$signer" >/dev/null || result=1; fi
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
signer=$(docker create --name "$name" --platform "$platform" \
  -e HEIMDALL_RPM_TEST=1 "$image" sleep infinity)
docker start "$signer"
docker cp packaging/rpm/tests/sign-rpms.sh "$signer:/tmp/sign-rpms.sh"
inputs=()
index=0
for artifact in "$@"; do
  inputs+=("/tmp/artifact-$index.rpm")
  docker cp "$artifact" "$signer:${inputs[$index]}"
  index=$((index + 1))
done
docker exec "$signer" bash /tmp/sign-rpms.sh --container /tmp/test-key.asc "${inputs[@]}"
docker cp "$signer:/tmp/test-key.asc" "$public"
index=0
for artifact in "$@"; do
  docker cp "$signer:${inputs[$index]}" "$artifact"
  index=$((index + 1))
done
