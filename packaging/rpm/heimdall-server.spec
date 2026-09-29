Name:           heimdall-server
Version:        2.13.1
%{!?heimdall_release:%global heimdall_release 0.1.integration}
Release:        %{heimdall_release}%{?dist}
Summary:        Heimdall server for security result persistence and review

# Node's complete third-party notices are shipped in node/LICENSE.
License:        Apache-2.0 AND MIT AND BSD-2-Clause AND BSD-3-Clause AND ISC AND Unicode-3.0 AND ICU AND Zlib AND LicenseRef-Public-Domain AND PostgreSQL
URL:            https://github.com/mitre/heimdall2
Source0:        https://github.com/mitre/heimdall2/archive/refs/tags/v%{version}.tar.gz#/heimdall2-%{version}.tar.gz
Source1:        heimdall-server.service
Source2:        heimdall-backend.env
Source3:        heimdall-server.sh
Source4:        heimdall-db-setup.sh
Source5:        heimdall-configure.sh
Source6:        heimdall-postgres-setup.sh
Source7:        heimdall-setup.sh
Source8:        heimdall-server-tmpfiles.conf
Source9:        heimdall_server.te
Source10:       heimdall_server.fc
Source11:       heimdall_server.if
Source13:       heimdall-server.xml
Source14:       heimdall-server.repo
Source15:       heimdall-cli
Source16:       heimdall-Caddyfile
Source17:       heimdall-sysconfig
Source18:       heimdall-rsyslog.conf
Source19:       heimdall-logrotate.conf
Source20:       40-heimdall.rules
Source21:       SECURITY.md
Source22:       heimdall-cli-man.tar.gz
Source23:       node-runtime.tar.xz
Source24:       postgresql-runtime.tar.bz2
Source25:       caddy-runtime.tar.gz
Source26:       runtime-manifest.json
Source27:       heimdall-postgresql.service
Source28:       heimdall-caddy.service

# JS application with native addons: disable debug/debuginfo subpackages.
%global debug_package %{nil}
%global _debugsource_packages 0

ExclusiveArch:  aarch64 x86_64

# Vendored node_modules are shipped with the application and must not drive
# automatic RPM dependency/provide generation.
%global __requires_exclude_from ^%{_datadir}/%{name}/(apps/backend/node_modules|libs)/.*$
%global __provides_exclude_from ^(%{_datadir}/%{name}/(apps/backend/node_modules|libs)|%{_libexecdir}/%{name}/runtime/postgresql/lib)/.*$
# These observed SONAME requirements resolve through PostgreSQL's private RUNPATH.
# Keep all base OS ELF requirements, including OpenSSL, ICU and zlib.
%global __requires_exclude ^lib(ecpg[.]so[.]6|ecpg_compat[.]so[.]3|pgtypes[.]so[.]3|pq[.]so[.]5)[(][)][(]64bit[)]$

# Note: node_modules are vendored at build time via `yarn install --frozen-lockfile`.
# A full Provides: bundled(npm(...)) manifest is not generated; the lockfile in
# the source archive is the authoritative dependency record.

BuildRequires:  gcc-c++
BuildRequires:  gcc
BuildRequires:  libicu-devel
BuildRequires:  openssl-devel
BuildRequires:  zlib-devel
BuildRequires:  bison
BuildRequires:  flex
BuildRequires:  pkgconfig
BuildRequires:  tar
BuildRequires:  xz
BuildRequires:  bzip2
BuildRequires:  make
BuildRequires:  nodejs(engine) >= 22.18.0
BuildRequires:  python3
BuildRequires:  /usr/bin/python3.9
BuildRequires:  /usr/bin/perl
BuildRequires:  selinux-policy-devel
BuildRequires:  systemd-rpm-macros
BuildRequires:  /usr/bin/yarn

%{?systemd_requires}

Requires:       openssl
Requires:       policycoreutils-python-utils
Requires:       selinux-policy-targeted
Requires:       tar
Requires:       util-linux
Requires:       iproute
Requires(pre):  shadow-utils

Provides:       bundled(nodejs) = 22.23.3
Provides:       bundled(postgresql) = 18.6
Provides:       bundled(caddy) = 2.11.4
Recommends:     firewalld-filesystem

%description
Heimdall Server provides data persistence, authentication, RBAC, and API
access for Heimdall evaluations.

After installation, run:
  sudo heimdall-cli setup

%prep
%autosetup -n heimdall2-%{version}
mkdir -p rpm-man
tar -xzf "%{SOURCE22}" -C rpm-man

# Keep archive members and link targets inside their private extraction roots.
python3 - <<'PY'
import os
import tarfile
for archive, directory, strip in [
    ("%{SOURCE23}", "runtime-node", True),
    ("%{SOURCE24}", "runtime-postgresql", True),
    ("%{SOURCE25}", "runtime-caddy", False),
]:
    os.mkdir(directory)
    root = os.path.realpath(directory) + os.sep
    with tarfile.open(archive) as source:
        for member in source:
            if member.name.startswith("/") or ".." in member.name.split("/"):
                raise SystemExit("Unsafe archive path: " + member.name)
            if strip:
                member.name = member.name.partition("/")[2]
            if not member.name:
                continue
            target = os.path.realpath(os.path.join(directory, member.name))
            if not target.startswith(root):
                raise SystemExit("Archive path escapes destination: " + member.name)
            if member.islnk():
                if strip:
                    member.linkname = member.linkname.partition("/")[2]
                link = os.path.join(directory, member.linkname)
                if os.path.islink(link):
                    raise SystemExit("Archive hard link targets a symlink: " + member.name)
            elif member.issym():
                link = os.path.join(os.path.dirname(target), member.linkname)
            elif not (member.isfile() or member.isdir()):
                raise SystemExit("Unsupported archive member: " + member.name)
            else:
                link = target
            if not os.path.realpath(link).startswith(root):
                raise SystemExit("Archive link escapes destination: " + member.name)
            source.extract(member, directory)
PY

%build
export PATH="$PWD/runtime-node/bin:$PATH"
test "$(node --version)" = v22.23.3
export NODE_ENV=production
# Build native addons against the exact Node headers shipped in this archive.
export npm_config_nodedir="$PWD/runtime-node"
export npm_config_build_from_source=true
export npm_config_python=/usr/bin/python3.9

# YARN_CACHE_FOLDER: if caller exported one (e.g. `make rpm CACHE=1`
# for fast local rebuilds), honor it and leave it in place. Otherwise
# create a fresh mktemp and clean it up at the end — matches the
# stateless CI/mock/COPR build model.
if [ -n "${YARN_CACHE_FOLDER:-}" ]; then
  mkdir -p "${YARN_CACHE_FOLDER}"
  yarn_cache_owned=0
else
  export YARN_CACHE_FOLDER="$(mktemp -d)"
  yarn_cache_owned=1
fi

# Use system CA bundle so yarn/node trust corporate TLS inspection proxies.
if [ -f /etc/pki/tls/certs/ca-bundle.crt ]; then
  export NODE_EXTRA_CA_CERTS=/etc/pki/tls/certs/ca-bundle.crt
fi
yarn install --frozen-lockfile --production --network-timeout 600000
yarn frontend build
yarn backend build

test -s apps/backend/dist/src/main.js
test -s apps/backend/dist/db/database.js
test -s dist/frontend/index.html
test -x apps/backend/node_modules/.bin/sequelize

if [ "$yarn_cache_owned" = "1" ]; then
  rm -rf "${YARN_CACHE_FOLDER}"
fi

# Build SELinux policy module
mkdir -p selinux
cp %{SOURCE9} %{SOURCE10} %{SOURCE11} selinux/
make -f /usr/share/selinux/devel/Makefile -C selinux heimdall_server.pp

pushd runtime-postgresql
./configure --prefix=%{_libexecdir}/%{name}/runtime/postgresql \
  --with-icu --with-ssl=openssl --with-zlib --without-readline
# PostgreSQL generates headers only at MAKELEVEL=0; Make also launches rpmbuild.
env -u MAKELEVEL -u MAKEFLAGS -u MFLAGS make %{?_smp_mflags}
popd

%install
rm -rf %{buildroot}

install -d %{buildroot}%{_datadir}/%{name}
install -d %{buildroot}%{_datadir}/%{name}/apps/backend
install -d %{buildroot}%{_datadir}/%{name}/libs
install -d %{buildroot}%{_sysconfdir}/%{name}
install -d %{buildroot}%{_unitdir}
install -d %{buildroot}%{_tmpfilesdir}
install -d %{buildroot}%{_bindir}
install -d %{buildroot}%{_libexecdir}/%{name}

env -u MAKELEVEL -u MAKEFLAGS -u MFLAGS make -C runtime-postgresql install DESTDIR=%{buildroot}
# Headers, static archives and build integration files are not runtime inputs.
rm -rf %{buildroot}%{_libexecdir}/%{name}/runtime/postgresql/include \
       %{buildroot}%{_libexecdir}/%{name}/runtime/postgresql/lib/pgxs \
       %{buildroot}%{_libexecdir}/%{name}/runtime/postgresql/lib/pkgconfig
find %{buildroot}%{_libexecdir}/%{name}/runtime/postgresql -name '*.a' -delete
install -D -m 0755 runtime-node/bin/node \
  %{buildroot}%{_libexecdir}/%{name}/runtime/node/bin/node
install -D -m 0755 runtime-caddy/caddy \
  %{buildroot}%{_libexecdir}/%{name}/runtime/caddy/caddy
install -m 0644 %{SOURCE26} %{buildroot}%{_datadir}/%{name}/runtime-manifest.json
install -D -m 0644 runtime-node/LICENSE %{buildroot}%{_licensedir}/%{name}/node/LICENSE
install -D -m 0644 runtime-postgresql/COPYRIGHT %{buildroot}%{_licensedir}/%{name}/postgresql/COPYRIGHT
install -D -m 0644 runtime-caddy/LICENSE %{buildroot}%{_licensedir}/%{name}/caddy/LICENSE

cp -a apps/backend/package.json %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/node_modules %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/.sequelizerc %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/db %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/config %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/migrations %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/seeders %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/seed-support %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/dist %{buildroot}%{_datadir}/%{name}/apps/backend/

# Strip executable bits from JS files that lack shebangs.
find %{buildroot}%{_datadir}/%{name}/apps/backend/node_modules \
  -type f \( -name '*.js' -o -name '*.cjs' -o -name '*.mjs' \) -perm /111 | \
while IFS= read -r file; do
  case "$(LC_ALL=C sed -n '1p' "${file}" 2>/dev/null || true)" in
    '#!'*) ;;
    *) chmod a-x "${file}" ;;
  esac
done

cp -a libs/common %{buildroot}%{_datadir}/%{name}/libs/
cp -a libs/password-complexity %{buildroot}%{_datadir}/%{name}/libs/
cp -a dist %{buildroot}%{_datadir}/%{name}/

install -m 0644 %{SOURCE1} %{buildroot}%{_unitdir}/%{name}.service
install -m 0644 %{SOURCE27} %{buildroot}%{_unitdir}/heimdall-postgresql.service
install -m 0644 %{SOURCE28} %{buildroot}%{_unitdir}/heimdall-caddy.service
install -d -m 0750 %{buildroot}%{_sysconfdir}/%{name}/caddy
install -m 0640 %{SOURCE2} %{buildroot}%{_sysconfdir}/%{name}/backend.env
install -m 0644 %{SOURCE8} %{buildroot}%{_tmpfilesdir}/%{name}.conf
install -m 0755 %{SOURCE3} %{buildroot}%{_bindir}/%{name}
install -m 0755 %{SOURCE4} %{buildroot}%{_bindir}/%{name}-db-setup
install -m 0755 %{SOURCE7} %{buildroot}%{_bindir}/%{name}-setup
install -m 0755 %{SOURCE5} %{buildroot}%{_libexecdir}/%{name}/configure.sh
install -m 0755 %{SOURCE6} %{buildroot}%{_libexecdir}/%{name}/postgres-setup.sh

# SELinux policy module
install -d %{buildroot}%{_datadir}/selinux/packages
install -m 0644 selinux/heimdall_server.pp %{buildroot}%{_datadir}/selinux/packages/%{name}.pp

# fapolicyd trust entries are managed by `heimdall-cli fapolicyd add|remove`,
# invoked from the post and preun scriptlets (no shell helper to install).

# firewalld service definition
install -d %{buildroot}%{_prefix}/lib/firewalld/services
install -m 0644 %{SOURCE13} %{buildroot}%{_prefix}/lib/firewalld/services/%{name}.xml

# Yum/DNF repo file
install -d %{buildroot}%{_sysconfdir}/yum.repos.d
install -m 0644 %{SOURCE14} %{buildroot}%{_sysconfdir}/yum.repos.d/%{name}.repo

# Caddy reverse proxy template
install -m 0644 %{SOURCE16} %{buildroot}%{_libexecdir}/%{name}/heimdall-Caddyfile

# heimdall-cli admin tool (pre-built Go static binary)
install -m 0755 %{SOURCE15} %{buildroot}%{_bindir}/heimdall-cli

# Sysconfig file for service-level path overrides
install -d %{buildroot}%{_sysconfdir}/sysconfig
install -m 0640 %{SOURCE17} %{buildroot}%{_sysconfdir}/sysconfig/%{name}

# rsyslog config (routes journald messages to log files)
install -D -m 0644 %{SOURCE18} %{buildroot}%{_sysconfdir}/rsyslog.d/30-%{name}.conf

# logrotate config (90-day retention for FedRAMP compliance)
install -D -m 0644 %{SOURCE19} %{buildroot}%{_sysconfdir}/logrotate.d/%{name}

# Security samples (auditd rules, documentation — NOT activated by default)
install -d %{buildroot}%{_datadir}/%{name}/security
install -m 0644 %{SOURCE20} %{buildroot}%{_datadir}/%{name}/security/40-heimdall.rules
install -m 0644 %{SOURCE21} %{buildroot}%{_datadir}/%{name}/security/SECURITY.md

# Man pages generated from the pinned CLI and carried in the source package.
install -d %{buildroot}%{_mandir}/man1
install -p -m 0644 rpm-man/man1/*.1 %{buildroot}%{_mandir}/man1/

# Runtime directories (owned by service user)
install -d -m 0750 %{buildroot}/var/lib/%{name}
install -d -m 0700 %{buildroot}/var/lib/%{name}/backups
install -d -m 0750 %{buildroot}/var/log/%{name}
install -d -m 0700 %{buildroot}/var/lib/heimdall-postgresql/18
install -d -m 0700 %{buildroot}/var/lib/heimdall-caddy

# Relative symlink: avoids rpmbuild's "absolute-symlink" warning AND
# lets rpmbuild's file-recognition step resolve the target inside
# BUILDROOT instead of looking on the real filesystem (which would
# fail at build time with "broken symbolic link"). Per Fedora
# packaging guidelines on symlinks.
ln -sr %{buildroot}%{_sysconfdir}/%{name}/backend.env \
       %{buildroot}%{_datadir}/%{name}/apps/backend/.env

%pre
getent group heimdall >/dev/null || groupadd -r heimdall
getent passwd heimdall >/dev/null || \
  useradd -r -g heimdall -d %{_datadir}/%{name} -s /sbin/nologin \
  -c "Heimdall service user" heimdall
getent group heimdall-postgres >/dev/null || groupadd -r heimdall-postgres
getent passwd heimdall-postgres >/dev/null || \
  useradd -r -g heimdall-postgres -d /var/lib/heimdall-postgresql -s /sbin/nologin \
  -c "Heimdall PostgreSQL" heimdall-postgres
getent group heimdall-caddy >/dev/null || groupadd -r heimdall-caddy
getent passwd heimdall-caddy >/dev/null || \
  useradd -r -g heimdall-caddy -d /var/lib/heimdall-caddy -s /sbin/nologin \
  -c "Heimdall HTTPS proxy" heimdall-caddy

# On upgrade ($1 -eq 2): attempt automatic backup before replacing files.
# Non-fatal — upgrade proceeds even if backup fails (e.g., DB unreachable).
if [ $1 -eq 2 ] && command -v heimdall-cli >/dev/null 2>&1; then
  echo "Creating pre-upgrade backup..."
  heimdall-cli backup \
    -o /var/lib/%{name}/backups \
    2>/dev/null || echo "  Pre-upgrade backup skipped (non-fatal)"
fi

%post
%systemd_post %{name}.service
# Setup alone enables the selected private services; presets must not start them.
systemd-tmpfiles --create %{_tmpfilesdir}/%{name}.conf >/dev/null 2>&1 || :

# Load SELinux policy module
semodule -n -i %{_datadir}/selinux/packages/%{name}.pp 2>/dev/null || true
if /usr/sbin/selinuxenabled 2>/dev/null; then
  /usr/sbin/load_policy 2>/dev/null || true
  restorecon -R %{_datadir}/%{name}/ \
                %{_sysconfdir}/%{name}/ \
                %{_unitdir}/%{name}.service 2>/dev/null || true
  # Register port 3000 (ignore if already registered)
  semanage port -a -t heimdall_server_port_t -p tcp 3000 2>/dev/null || true
fi

# Register bundled binaries with the fapolicyd trust database.
# heimdall-cli is a no-op when fapolicyd-cli is not installed, so the
# command is safe to call unconditionally.
heimdall-cli fapolicyd add 2>/dev/null || :

if [ $1 -eq 1 ]; then
  echo ""
  echo "=========================================="
  echo " Heimdall Server installed successfully."
  echo ""
  echo " Complete setup by running:"
  echo "   sudo heimdall-cli setup"
  echo "=========================================="
  echo ""
elif [ $1 -eq 2 ]; then
  echo ""
  echo "=========================================="
  echo " Heimdall Server upgraded."
  echo ""
  echo " A backup was attempted before upgrade."
  echo " Backups: /var/lib/%{name}/backups/"
  echo ""
  echo " Run database migrations:"
  echo "   sudo heimdall-cli setup --skip-tls"
  echo ""
  echo " The service will restart automatically."
  echo "=========================================="
  echo ""
fi

%preun
%systemd_preun %{name}.service
%systemd_preun heimdall-caddy.service heimdall-postgresql.service

# Remove fapolicyd trust entries while the CLI and payload still exist.
if [ $1 -eq 0 ]; then
  heimdall-cli fapolicyd remove 2>/dev/null || :
fi

%postun
# On upgrade ($1 -ge 1): check RESTART_ON_UPGRADE in sysconfig before restarting.
# Follows the Grafana pattern — gives admins control over restart timing.
if [ $1 -ge 1 ]; then
  RESTART_ON_UPGRADE=true
  if [ -f %{_sysconfdir}/sysconfig/%{name} ]; then
    . %{_sysconfdir}/sysconfig/%{name}
  fi
  if [ "${RESTART_ON_UPGRADE}" = "true" ]; then
    systemctl try-restart %{name}.service >/dev/null 2>&1 || true
  fi
else
  systemctl daemon-reload >/dev/null 2>&1 || true
fi

# Remove SELinux policy on full uninstall
if [ $1 -eq 0 ]; then
  semodule -n -r heimdall_server 2>/dev/null || true
  if /usr/sbin/selinuxenabled 2>/dev/null; then
    /usr/sbin/load_policy 2>/dev/null || true
    semanage port -d -t heimdall_server_port_t -p tcp 3000 2>/dev/null || true
  fi
fi

%files
%license LICENSE.md
%license %{_licensedir}/%{name}/node
%license %{_licensedir}/%{name}/postgresql
%license %{_licensedir}/%{name}/caddy
%doc README.md CHANGELOG
%{_unitdir}/%{name}.service
%{_unitdir}/heimdall-postgresql.service
%{_unitdir}/heimdall-caddy.service
%{_tmpfilesdir}/%{name}.conf
%{_bindir}/%{name}
%{_bindir}/%{name}-db-setup
%{_bindir}/%{name}-setup
%attr(0755,root,root) %dir %{_libexecdir}/%{name}
%attr(0755,root,root) %{_libexecdir}/%{name}/configure.sh
%attr(0755,root,root) %{_libexecdir}/%{name}/postgres-setup.sh
%{_libexecdir}/%{name}/runtime
%attr(0751,root,heimdall) %dir %{_sysconfdir}/%{name}
%attr(0750,root,heimdall-caddy) %dir %{_sysconfdir}/%{name}/caddy
%attr(0640,root,heimdall-caddy) %ghost %config(noreplace) %{_sysconfdir}/%{name}/caddy/Caddyfile
%attr(0640,root,heimdall) %config(noreplace) %{_sysconfdir}/%{name}/backend.env
%attr(0755,root,root) %dir %{_datadir}/%{name}
%attr(0750,heimdall,heimdall) %dir /var/lib/%{name}
%attr(0700,heimdall,heimdall) %dir /var/lib/%{name}/backups
%attr(0750,heimdall,heimdall) %dir /var/log/%{name}
%attr(0700,heimdall-postgres,heimdall-postgres) %dir /var/lib/heimdall-postgresql
%attr(0700,heimdall-postgres,heimdall-postgres) %dir /var/lib/heimdall-postgresql/18
%attr(0700,heimdall-caddy,heimdall-caddy) %dir /var/lib/heimdall-caddy
%{_datadir}/%{name}/runtime-manifest.json
%{_datadir}/%{name}/apps
%{_datadir}/%{name}/dist
%{_datadir}/%{name}/libs
%{_datadir}/selinux/packages/%{name}.pp
%config(noreplace) %{_libexecdir}/%{name}/heimdall-Caddyfile
%config(noreplace) %{_prefix}/lib/firewalld/services/%{name}.xml
%config(noreplace) %{_sysconfdir}/yum.repos.d/%{name}.repo
%config(noreplace) %{_sysconfdir}/sysconfig/%{name}
%config(noreplace) %{_sysconfdir}/rsyslog.d/30-%{name}.conf
%config(noreplace) %{_sysconfdir}/logrotate.d/%{name}
%{_datadir}/%{name}/security
%{_bindir}/heimdall-cli
%{_mandir}/man1/heimdall-cli*.1*

%changelog
* Thu Apr 16 2026 alippold - 2.13.1-1
- Update to 2.13.1

* Fri Feb 27 2026 Heimdall Maintainers <saf@mitre.org> - 2.12.6-10
- Replace Python CLI with Go static binary (heimdall-cli).
  Single binary, no Python/vendor dependencies.
  14 commands: setup, status, config (list/get/set), backup, restore,
  reset-password, start, stop, restart, logs, diag, set-port, add-cert,
  validate.

* Fri Feb 27 2026 Heimdall Maintainers <saf@mitre.org> - 2.12.6-9
- Fix Caddy TLS for private hostnames: add "tls internal" explicitly.
  Caddy does NOT auto-detect private hostnames (.internal, .local, .lan,
  .corp, .localdomain, .home.arpa, .private, .test, single-label) — it
  tries Let's Encrypt ACME and fails. Setup script now detects these
  patterns and configures Caddy's internal CA automatically.
- Add --external-url, --tls-cert, --tls-key, --skip-tls flags to setup
  script for enterprise deployments (load balancer, corporate PKI, existing
  reverse proxy).
- Fix code review findings: remove local keyword outside functions, fix
  duplicate EXTERNAL_URL appends, add semanage -m fallback for reruns,
  skip --tls-cert validation when --skip-tls is set.

* Fri Feb 27 2026 Heimdall Maintainers <saf@mitre.org> - 2.12.6-8
- Add Caddy TLS reverse proxy support (Recommends: caddy, Caddyfile template).
- Setup script adds TLS/proxy step: Caddy config, EXTERNAL_URL, internal CA.
- Add cloud environment detection (EC2/Azure/GCP) with firewall hints.
- SELinux: enable httpd_can_network_connect for reverse proxy.
- Firewalld: open HTTPS (443) instead of app port (3000).
- Ship COPR repo file (enabled=0) instead of non-existent saf.mitre.org.

* Thu Feb 26 2026 Heimdall Maintainers <saf@mitre.org> - 2.12.6-7
- Fix heimdall-cli reset_password: hash via app bcryptjs, validate complexity,
  update DB directly. Passwords verified via API login.
- Add configurable password rules via env vars (PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIRE_CLASSES, PASSWORD_MAX_CONSECUTIVE) with current defaults.
- Move packaging to saf-packaging mono-repo.
- Bundle heimdall-cli files into single Source15 tarball (replaces 6 flat Sources).
- Standalone build: fetch source from GitHub releases instead of requiring
  local heimdall2 git checkout.

* Thu Feb 26 2026 Heimdall Maintainers <saf@mitre.org> - 2.12.6-5
- Add heimdall-cli admin tool (status, config, backup/restore, diagnostics).
- Add config schema data file for CLI validation and tab completion.
- Add yum repo file for saf.mitre.org/rpms/.
- Add upgrade message in %%post for $1 -eq 2.
- Add ENVIRONMENT_VARIABLES.md as authoritative config reference.
- Update .env-example with 14 previously undocumented variables.

* Thu Feb 26 2026 Heimdall Maintainers <saf@mitre.org> - 2.12.6-4
- Add SELinux policy module with custom heimdall_server_t domain.
- Add fapolicyd rules for bundled Node.js binary execution.
- Add firewalld service definition for port 3000.
- SELinux policy auto-loaded on install, removed on uninstall.

* Thu Feb 26 2026 Heimdall Maintainers <saf@mitre.org> - 2.12.6-3
- Remove all automation from %%post per Fedora packaging guidelines.
- Move PostgreSQL to Recommends for flexible local/remote deployments.
- Add systemd hardening (ProtectSystem=strict, RestrictAddressFamilies, etc).
- Add tmpfiles.d for /run/heimdall-server.
- Support PostgreSQL 13-18 auto-detection in setup scripts.

* Thu Feb 26 2026 Heimdall Maintainers <saf@mitre.org> - 2.12.6-2
- Run post-install setup in auto mode (interactive when TTY is available).
- Avoid RPM post scriptlet hard-fail for recoverable setup/startup issues.
- Treat existing database as idempotent during db:create.
- Validate DATABASE_PASSWORD at service startup with clear remediation guidance.

* Wed Feb 25 2026 Heimdall Maintainers <saf@mitre.org> - 2.12.6-1
- Initial Oracle/RHEL style RPM packaging scaffold with interactive install
