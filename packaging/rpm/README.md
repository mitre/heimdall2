# Heimdall Server RPM Scaffold

This directory contains an initial Oracle/RHEL style RPM packaging scaffold
for Heimdall Server.

## Files

- `heimdall-server.spec`: Builds and packages Heimdall server runtime assets.
- `heimdall-server.service`: systemd unit.
- `heimdall-backend.env`: Runtime environment template.
- `heimdall-server.sh`: Service entrypoint.
- `heimdall-db-setup.sh`: Database create/migrate/seed helper.
- `heimdall-configure.sh`: Interactive install-time configuration script.
- `heimdall-postgres-setup.sh`: PostgreSQL init/start/user bootstrap helper.
- `setup-rpm-build-env.sh`: One-command RPM build environment setup/staging helper.

## Build Notes

- The spec expects Node.js 22 and Yarn on the build host.
- PostgreSQL packages are expected from PGDG (for `postgresql18` and `postgresql18-server`).
- `Source0` is a local source archive (`heimdall2-<version>.tar.gz`).

## Host Prerequisite (OL8/EL8)

Enable PGDG 18 before installing the Heimdall RPM:

```bash
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo dnf -qy module disable postgresql
```

If you need to bypass GPG checks during dependency installs, use:

```bash
./packaging/rpm/setup-rpm-build-env.sh --no-gpg-check
```

## Build Command

From the repository root:

```bash
./packaging/rpm/setup-rpm-build-env.sh
```

To also run `rpmbuild` in the same command:

```bash
./packaging/rpm/setup-rpm-build-env.sh --build
```

Manual equivalent:

```bash
mkdir -p ~/rpmbuild/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}

cp packaging/rpm/heimdall-server.spec ~/rpmbuild/SPECS/
cp packaging/rpm/heimdall-server.service ~/rpmbuild/SOURCES/
cp packaging/rpm/heimdall-backend.env ~/rpmbuild/SOURCES/
cp packaging/rpm/heimdall-server.sh ~/rpmbuild/SOURCES/
cp packaging/rpm/heimdall-db-setup.sh ~/rpmbuild/SOURCES/
cp packaging/rpm/heimdall-configure.sh ~/rpmbuild/SOURCES/
cp packaging/rpm/heimdall-postgres-setup.sh ~/rpmbuild/SOURCES/

# Version must match the Version field in heimdall-server.spec.
git archive --format=tar.gz --prefix=heimdall2-2.12.6/ HEAD \
  > ~/rpmbuild/SOURCES/heimdall2-2.12.6.tar.gz

rpmbuild -ba ~/rpmbuild/SPECS/heimdall-server.spec
```

## Install Behavior

On first install, the RPM will:

1. Prompt for Heimdall environment variables interactively.
2. Write `/etc/heimdall-server/backend.env`.
3. Initialize/start PostgreSQL (local), force `password_encryption='scram-sha-256'`,
   create/update the configured DB role with `CREATEDB`, and verify login.
4. Run database create/migrate/seed automatically.
5. Enable and start `heimdall-server.service`.

Note: first-time installation is interactive and requires a TTY.

You should only need to verify status after installation:

```bash
sudo systemctl status heimdall-server
```
