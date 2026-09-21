# Heimdall Server RPM for Oracle Linux 8

This directory builds Heimdall Server 2.14.0 as an architecture-specific RPM. The package requires Node.js 22.18.0 or newer and PostgreSQL 18 from PGDG. Builds use Yarn Classic 1.22.22 with the committed `yarn.lock` and a frozen dependency install.

## Build on Oracle Linux 8

The native helper must run on an Oracle Linux 8 host from the repository root. Git-native staging accepts only clean, tracked release inputs, so commit the application and packaging changes that belong in the release first.

```bash
./packaging/rpm/setup-rpm-build-env.sh --build
```

On another host, including an ARM Mac, use the OL8 Docker builder from the repository root. Docker staging uses the current filtered workspace, including uncommitted edits, and excludes `.git`, local dependencies, secrets, and prior RPM output.

```bash
docker build --platform linux/amd64 --progress plain \
  --secret id=corp_ca,src=/etc/ssl/certs/mitre-ca-certificates.crt \
  --build-arg QEMU_GUEST_BASE=0x800000000000 \
  -f packaging/rpm/Dockerfile.ol8 --target builder \
  -t heimdall-rpm-builder:ol8-amd64 .
docker build --platform linux/amd64 \
  --secret id=corp_ca,src=/etc/ssl/certs/mitre-ca-certificates.crt \
  --build-arg QEMU_GUEST_BASE=0x800000000000 \
  -f packaging/rpm/Dockerfile.ol8 --target artifacts \
  --output type=local,dest=packaging/rpm/dist/amd64-release1 .
docker build --platform linux/amd64 \
  --secret id=corp_ca,src=/etc/ssl/certs/mitre-ca-certificates.crt \
  --build-arg QEMU_GUEST_BASE=0x800000000000 \
  --build-arg HEIMDALL_RELEASE=2 \
  -f packaging/rpm/Dockerfile.ol8 --target artifacts \
  --output type=local,dest=packaging/rpm/dist/amd64-release2 .

docker build --platform linux/arm64 --progress plain \
  --secret id=corp_ca,src=/etc/ssl/certs/mitre-ca-certificates.crt \
  -f packaging/rpm/Dockerfile.ol8 --target builder \
  -t heimdall-rpm-builder:ol8-arm64 .
docker build --platform linux/arm64 \
  --secret id=corp_ca,src=/etc/ssl/certs/mitre-ca-certificates.crt \
  -f packaging/rpm/Dockerfile.ol8 --target artifacts \
  --output type=local,dest=packaging/rpm/dist/arm64-release1 .
docker build --platform linux/arm64 \
  --secret id=corp_ca,src=/etc/ssl/certs/mitre-ca-certificates.crt \
  --build-arg HEIMDALL_RELEASE=2 \
  -f packaging/rpm/Dockerfile.ol8 --target artifacts \
  --output type=local,dest=packaging/rpm/dist/arm64-release2 .
```

Omit the optional `corp_ca` secret on networks using public trust. When provided, it is added to trusted builder and test-host image layers; it is not copied into the repository, source RPM, or binary RPM. Keep TLS and RPM signature verification enabled. `setup-rpm-build-env.sh --no-gpg-check` remains an explicit operator override; it does not fix missing CA trust. `QEMU_GUEST_BASE` is required when building the x86_64 target under emulation on the tested ARM Mac; omit it when the target architecture matches the host.

Binary RPMs are exported under `RPMS/<architecture>/` and source RPMs under `SRPMS/` in each requested destination. The September 21 acceptance artifacts are under `packaging/rpm/dist/task5-final/{amd64,arm64}-release{1,2}`; ordinary builds should use their own destination rather than overwrite those evidence artifacts.

The final repeated builds on the tested Docker Desktop host needed serialization and explicit resource bounds. Both successful rebuilds used 4 GiB RAM plus 1 GiB existing swap and a 2 GiB Node heap. The external Vue CLI build configuration selected one worker while retaining production minification and type checking; x86_64 emulation also used `QEMU_TB_SIZE=32`. These are resource controls for this constrained host, not RPM payload settings. Preserve at least 10 GiB of writable-layer disk space per full build and verify the actual cgroup limits before starting.

The accepted bounded x86_64 build produced release 1 from immutable release-2
builder image
`sha256:1872fd7dd67682f8ad304699febc2c6f341202a7c845b7c792489adccf679ba0`.
The following adapts that tested procedure to produce release 2 from the same
frozen builder input. Use the ARM64 platform and omit both QEMU variables for
native ARM64:

```bash
work_config=$(mktemp -d)
cat > "$work_config/config.cjs" <<'CONFIG'
const config = require('/rpmbuild/BUILD/heimdall2-2.14.0/apps/frontend/vue.config.js')
module.exports = { ...config, parallel: 1 }
CONFIG
printf '{"type":"commonjs"}\n' > "$work_config/package.json"
docker create --name heimdall-rpm-build-amd64-release2 \
  --platform linux/amd64 --memory 4g --memory-swap 5g \
  -e NODE_OPTIONS=--max-old-space-size=2048 \
  -e VUE_CLI_SERVICE_CONFIG_PATH=/tmp/heimdall-vue-build/config.cjs \
  -e QEMU_GUEST_BASE=0x800000000000 -e QEMU_TB_SIZE=32 \
  sha256:1872fd7dd67682f8ad304699febc2c6f341202a7c845b7c792489adccf679ba0 bash -lc \
  'test "$(cat /sys/fs/cgroup/memory.max)" = 4294967296 &&
   test "$(cat /sys/fs/cgroup/memory.swap.max)" = 1073741824 &&
   rpmbuild --define "_topdir /rpmbuild" --define "heimdall_release 2" \
     -ba /rpmbuild/SPECS/heimdall-server.spec'
docker cp "$work_config/." heimdall-rpm-build-amd64-release2:/tmp/heimdall-vue-build
docker start -a heimdall-rpm-build-amd64-release2
mkdir -p packaging/rpm/dist/amd64-release2/RPMS/x86_64 \
  packaging/rpm/dist/amd64-release2/SRPMS
docker cp heimdall-rpm-build-amd64-release2:/rpmbuild/RPMS/x86_64/heimdall-server-2.14.0-2.el8.x86_64.rpm packaging/rpm/dist/amd64-release2/RPMS/x86_64/
docker cp heimdall-rpm-build-amd64-release2:/rpmbuild/SRPMS/heimdall-server-2.14.0-2.el8.src.rpm packaging/rpm/dist/amd64-release2/SRPMS/
```


## Install and configure

Configure NodeSource 22 and PGDG 18 for the host architecture, disable the built-in PostgreSQL module, and install the RPM:

```bash
curl --fail --silent --show-error --location \
  https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y \
  "https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-$(rpm -E '%{_arch}')/pgdg-redhat-repo-latest.noarch.rpm"
sudo dnf -qy module disable postgresql
# To supply initial settings, create this file before the first install:
sudo install -d -m 0755 /etc/heimdall-server
sudo editor /etc/heimdall-server/backend.env
sudo dnf install -y ./heimdall-server-2.14.0-1.el8.$(rpm -E '%{_arch}').rpm
```

RPM transactions never prompt. On a running systemd host, installation preserves a precreated environment file or generates missing secrets, initializes local PostgreSQL, applies migrations and seeds, and enables and starts Heimdall. Rerun setup explicitly when needed:

```bash
sudo heimdall-server-setup --non-interactive
```

Use the explicit interactive command to review or change values:

```bash
sudo heimdall-server-setup --interactive
sudo systemctl status postgresql-18 heimdall-server
```

If systemd is unavailable during installation, the RPM writes configuration and defers database and service initialization. Run `sudo heimdall-server-setup --non-interactive` later on a systemd host; the command returns failure when required services cannot run.

## Upgrade and removal behavior

Install a newer RPM with `sudo dnf upgrade ./heimdall-server-*.rpm`. Setup reruns and upgrades preserve existing secrets, custom environment assignments, and the database. Remove Heimdall without dependency autoremove using:

```bash
sudo dnf remove -y --noautoremove heimdall-server
```

Removal stops Heimdall but leaves PostgreSQL and its data intact. RPM preserves the configuration as `/etc/heimdall-server/backend.env.rpmsave` for recovery.

## Reproduce lifecycle acceptance

Build a clean test host, start real systemd, and copy the test scripts and exact release artifacts. The privilege and private cgroup settings are confined to this disposable container; it has no host bind mounts or published application ports.

```bash
docker build --platform linux/amd64 \
  --secret id=corp_ca,src=/etc/ssl/certs/mitre-ca-certificates.crt \
  -f packaging/rpm/Dockerfile.ol8 --target test-host \
  -t heimdall-rpm-test:ol8-amd64-task5 .
docker run -d --name heimdall-rpm-lifecycle-amd64-task5 \
  --platform linux/amd64 --runtime=runc --privileged --cgroupns=private \
  --tmpfs /run --tmpfs /run/lock -e container=docker -e HEIMDALL_RPM_TEST=1 \
  heimdall-rpm-test:ol8-amd64-task5
for attempt in $(seq 1 60); do
  docker exec heimdall-rpm-lifecycle-amd64-task5 systemctl show-environment >/dev/null 2>&1 && break
  sleep 1
  test "$attempt" -lt 60
done
docker exec heimdall-rpm-lifecycle-amd64-task5 dnf makecache
docker cp packaging/rpm/tests/. heimdall-rpm-lifecycle-amd64-task5:/tmp/rpm-tests
docker cp packaging/rpm/dist/amd64-release1/RPMS/x86_64/heimdall-server-2.14.0-1.el8.x86_64.rpm heimdall-rpm-lifecycle-amd64-task5:/tmp/initial.rpm
docker cp packaging/rpm/dist/amd64-release2/RPMS/x86_64/heimdall-server-2.14.0-2.el8.x86_64.rpm heimdall-rpm-lifecycle-amd64-task5:/tmp/upgrade.rpm
docker exec heimdall-rpm-lifecycle-amd64-task5 bash /tmp/rpm-tests/lifecycle.sh install /tmp/initial.rpm
docker exec heimdall-rpm-lifecycle-amd64-task5 bash /tmp/rpm-tests/lifecycle.sh upgrade /tmp/upgrade.rpm
docker restart heimdall-rpm-lifecycle-amd64-task5
for attempt in $(seq 1 60); do
  docker exec heimdall-rpm-lifecycle-amd64-task5 systemctl show-environment >/dev/null 2>&1 && break
  sleep 1
  test "$attempt" -lt 60
done
docker exec heimdall-rpm-lifecycle-amd64-task5 bash /tmp/rpm-tests/lifecycle.sh verify
docker exec heimdall-rpm-lifecycle-amd64-task5 bash /tmp/rpm-tests/lifecycle.sh remove
```

On the tested ARM Mac, warming DNF metadata took about seven minutes under x86_64 emulation; `dnf makecache` is therefore an explicit preparation step. The lifecycle package transactions retain their 300-second bounds. The launch requested `--runtime=runc`, while Docker inspection reported the effective runtime as `sysbox-runc`; acceptance rests on the observed usable system bus, real PostgreSQL and Heimdall services, and application checks rather than the runtime label.

The minimal OL8 test image creates `/usr/share/man/man1` before dependency installation because the PGDG alternatives script expects this filesystem-owned directory. Clean-host checks confirm this does not preinstall Heimdall, Node, Yarn, Git, the compiler, or PostgreSQL server.

X86_64 lifecycle acceptance passed with clean test-host image `sha256:ce31ef5ea9f1799e03acdd755818c6ed5027bf088519df3628fcc5ad7399a465`. Release 1 binary SHA-256 is `f8b143133c7e9f8a84567567cfb8c15361a962c590ce2fbf9c87843031523325`; release 2 binary SHA-256 is `a5d7bf4051eb6aaffef2f45784ae695b6bbf180d540296abb6552176ee5ef57a`. ARM64 acceptance passed with clean test-host image `sha256:3ce1b0f93fc2464f2cad9f09579bb07f34c8a19fdc895e5e078dd01f122e47b4`; release 1 binary SHA-256 is `c2394636520fe010151f8802e5f3db34c52fbc0adbc38e0edd7d1556697f4940` and release 2 binary SHA-256 is `a6d22f1dc49f53f1c54d032a4b769a72f5bb46c5e1ef59274162b7c609f79212`. On both architectures, fresh install, login, setup rerun, sentinel/configuration preservation, release upgrade, restart, verification, and retention-safe removal passed. Docker acceptance does not validate host SELinux enforcement, external TLS termination, native x86_64 hardware, or migrations from a historical deployed database.
