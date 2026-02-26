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
- `heimdall-setup.sh`: One-command post-install interactive setup helper.
- `setup-rpm-build-env.sh`: One-command RPM build environment setup/staging helper.

## Build Notes

- The spec expects Node.js 22 and Yarn on the build host.
- PostgreSQL packages are expected from PGDG (for `postgresql18` and `postgresql18-server`).
- `Source0` is a local source archive (`heimdall2-<version>.tar.gz`).
- The setup helper prefers `git archive` (tracked files only) when `.git` is available.
- RPM `%post` runs setup in auto mode: interactive when a TTY is available, otherwise non-interactive. Missing secrets (including `DATABASE_PASSWORD`) are generated automatically.

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

This applies to both package signatures and repository metadata checks.

## Build Command

From the repository root:

```bash
./packaging/rpm/setup-rpm-build-env.sh
```

To also run `rpmbuild` in the same command:

```bash
./packaging/rpm/setup-rpm-build-env.sh --build
```

If you see `Arch dependent binaries in noarch package`, restage from the
current workspace spec and rebuild:

```bash
./packaging/rpm/setup-rpm-build-env.sh --skip-deps
rpmbuild --define "_topdir ${HOME}/rpmbuild" -ba "${HOME}/rpmbuild/SPECS/heimdall-server.spec"
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
cp packaging/rpm/heimdall-setup.sh ~/rpmbuild/SOURCES/

# Version must match the Version field in heimdall-server.spec.
git archive --format=tar.gz --prefix=heimdall2-2.12.6/ HEAD \
  > ~/rpmbuild/SOURCES/heimdall2-2.12.6.tar.gz

rpmbuild --define "_topdir ${HOME}/rpmbuild" -ba ~/rpmbuild/SPECS/heimdall-server.spec
```

## Install and Run the Built RPM

After a successful build, install the newest RPM from your `rpmbuild` output:

```bash
RPM_PATH="$(ls -1t "${HOME}/rpmbuild/RPMS/$(uname -m)"/heimdall-server-*.rpm | head -n1)"
sudo dnf install -y "${RPM_PATH}"
```

If install runs from an interactive terminal, `%post` prompts for setup values.
Without a TTY, it runs non-interactively.

`%post` auto-generates missing secrets (`DATABASE_PASSWORD`, `JWT_SECRET`,
`API_KEY_SECRET`), bootstraps PostgreSQL, runs migrations/seeds, and starts the service.

To review or override values interactively, run:

```bash
sudo heimdall-server-setup --interactive
```

To rerun setup without prompts:

```bash
sudo heimdall-server-setup --non-interactive
```

Once setup finishes, verify the service:

```bash
sudo systemctl status heimdall-server
```

If needed, start or restart it explicitly:

```bash
sudo systemctl restart heimdall-server
```

## Install Behavior

On install or upgrade, the RPM will:

1. Run setup in auto mode (interactive when TTY is available) and generate missing secrets.
2. Initialize/start PostgreSQL (local), force `password_encryption='scram-sha-256'`,
   create/update the configured DB role with `CREATEDB`, and verify password login.
3. Run database create/migrate/seed automatically.
4. Enable and start `heimdall-server.service`.

You should only need to verify status after installation:

```bash
sudo systemctl status heimdall-server
```
