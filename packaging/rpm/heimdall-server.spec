Name:           heimdall-server
Version:        2.12.6
Release:        1%{?dist}
Summary:        Heimdall server for security result persistence and review

License:        Apache-2.0
URL:            https://github.com/mitre/heimdall2
Source0:        heimdall2-%{version}.tar.gz
Source1:        heimdall-server.service
Source2:        heimdall-backend.env
Source3:        heimdall-server.sh
Source4:        heimdall-db-setup.sh
Source5:        heimdall-configure.sh
Source6:        heimdall-postgres-setup.sh
Source7:        heimdall-setup.sh

# JS application package: disable auto debug/debuginfo subpackages.
%global debug_package %{nil}
%global _debugsource_packages 0

ExclusiveArch:  aarch64 x86_64

# Vendored backend node_modules are shipped with the application and should
# not drive automatic RPM dependency/provide generation.
%global __requires_exclude_from ^/usr/share/heimdall-server/apps/backend/node_modules/.*$
%global __provides_exclude_from ^/usr/share/heimdall-server/apps/backend/node_modules/.*$

BuildRequires:  gcc-c++
BuildRequires:  make
BuildRequires:  nodejs >= 22
BuildRequires:  python3
BuildRequires:  systemd-rpm-macros
BuildRequires:  yarn

%{?systemd_requires}

Requires:       nodejs >= 22
Requires:       openssl
Requires(pre):  shadow-utils
Requires(post): postgresql18
Requires(post): postgresql18-server
Requires(post): util-linux

%description
Heimdall Server provides data persistence, authentication, RBAC, and API
access for Heimdall evaluations.

%prep
%autosetup -n heimdall2-%{version}

%build
export NODE_ENV=production
export YARN_CACHE_FOLDER="$(mktemp -d)"
trap 'rm -rf "${YARN_CACHE_FOLDER}"' EXIT

# Respect enterprise CA bundles for Yarn/npm fetches in rpmbuild.
CAFILE=""
if [ -n "${NODE_EXTRA_CA_CERTS:-}" ] && [ -r "${NODE_EXTRA_CA_CERTS}" ]; then
  CAFILE="${NODE_EXTRA_CA_CERTS}"
elif [ -n "${SSL_CERT_FILE:-}" ] && [ -r "${SSL_CERT_FILE}" ]; then
  CAFILE="${SSL_CERT_FILE}"
  export NODE_EXTRA_CA_CERTS="${CAFILE}"
fi

if [ -n "${CAFILE}" ]; then
  export npm_config_cafile="${CAFILE}"
fi

yarn install --frozen-lockfile --production --network-timeout 600000
yarn frontend build
yarn backend build

%install
rm -rf %{buildroot}

install -d %{buildroot}%{_datadir}/%{name}
install -d %{buildroot}%{_datadir}/%{name}/apps/backend
install -d %{buildroot}%{_datadir}/%{name}/libs
install -d %{buildroot}%{_sysconfdir}/%{name}
install -d %{buildroot}%{_unitdir}
install -d %{buildroot}%{_bindir}
install -d %{buildroot}%{_libexecdir}/%{name}

cp -a apps/backend/package.json %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/node_modules %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/.sequelizerc %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/db %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/config %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/migrations %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/seeders %{buildroot}%{_datadir}/%{name}/apps/backend/
cp -a apps/backend/dist %{buildroot}%{_datadir}/%{name}/apps/backend/

# Keep executable bits only for JS files that are actual scripts with shebangs.
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
install -m 0640 %{SOURCE2} %{buildroot}%{_sysconfdir}/%{name}/backend.env
install -m 0755 %{SOURCE3} %{buildroot}%{_bindir}/%{name}
install -m 0755 %{SOURCE4} %{buildroot}%{_bindir}/%{name}-db-setup
install -m 0755 %{SOURCE7} %{buildroot}%{_bindir}/%{name}-setup
install -m 0755 %{SOURCE5} %{buildroot}%{_libexecdir}/%{name}/configure.sh
install -m 0755 %{SOURCE6} %{buildroot}%{_libexecdir}/%{name}/postgres-setup.sh

ln -s %{_sysconfdir}/%{name}/backend.env \
  %{buildroot}%{_datadir}/%{name}/apps/backend/.env

%pre
getent group heimdall >/dev/null || groupadd -r heimdall
getent passwd heimdall >/dev/null || \
  useradd -r -g heimdall -d %{_datadir}/%{name} -s /sbin/nologin \
  -c "Heimdall service user" heimdall

%post
%systemd_post %{name}.service
if [ "$1" -eq 1 ]; then
  if %{_libexecdir}/%{name}/configure.sh --non-interactive; then
    %{_libexecdir}/%{name}/postgres-setup.sh || exit 1
    %{_bindir}/%{name}-db-setup || exit 1
    if command -v systemctl >/dev/null 2>&1; then
      systemctl enable --now %{name}.service >/dev/null 2>&1 || exit 1
    fi
  else
    rc="$?"
    if [ "${rc}" -eq 2 ]; then
      cat <<'EOM'
heimdall-server installed, but required configuration values are missing.
Run the interactive setup as root to complete database bootstrap and service start:
  sudo /usr/bin/heimdall-server-setup
EOM
    else
      exit "${rc}"
    fi
  fi
fi

%preun
%systemd_preun %{name}.service

%postun
%systemd_postun_with_restart %{name}.service

%files
%license LICENSE.md
%doc README.md
%{_unitdir}/%{name}.service
%{_bindir}/%{name}
%{_bindir}/%{name}-db-setup
%{_bindir}/%{name}-setup
%dir %{_libexecdir}/%{name}
%{_libexecdir}/%{name}/configure.sh
%{_libexecdir}/%{name}/postgres-setup.sh
%dir %{_sysconfdir}/%{name}
%attr(0640,root,heimdall) %config(noreplace) %{_sysconfdir}/%{name}/backend.env
%dir %{_datadir}/%{name}
%{_datadir}/%{name}/apps
%{_datadir}/%{name}/dist
%{_datadir}/%{name}/libs

%changelog
* Wed Feb 25 2026 Heimdall Maintainers <opensource@mitre.org> - 2.12.6-1
- Initial Oracle/RHEL style RPM packaging scaffold with interactive install
