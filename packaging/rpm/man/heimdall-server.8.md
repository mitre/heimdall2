# heimdall-server 8 "Heimdall Server" "Heimdall Server Manual"

## NAME

heimdall-server - security results persistence and review server

## SYNOPSIS

**systemctl** start|stop|restart|status **heimdall-server**

## DESCRIPTION

Heimdall Server is a Node.js application that provides data persistence,
authentication, role-based access control (RBAC), and a REST API for
managing InSpec and other security scan results. It stores evaluation data
in PostgreSQL and serves a web interface for reviewing, comparing, and
sharing compliance results.

The server listens on a configurable TCP port (default 3000) and is
typically deployed behind a TLS reverse proxy such as Caddy, nginx, or a
load balancer. The RPM package ships a systemd service unit that runs the
application as the unprivileged **heimdall** user with extensive security
hardening.

## POST-INSTALL SETUP

After installing the RPM, complete the initial setup by running:

```bash
sudo heimdall-cli setup --interactive
```

The RPM includes private Node.js, PostgreSQL and Caddy runtimes. Setup asks
independently for **--database-mode bundled|external** and
**--proxy-mode bundled|external|none**. External databases may run on localhost;
setup tests connectivity and migrates the application but never controls the
external service. Supported external PostgreSQL server majors are 13 through 18.
The two private services remain disabled until selected by setup.

Fresh defaults are bundled/bundled. Flags override saved selections; saved
selections override defaults. Existing configured systems without mode keys use
external/external and retain endpoints. Temporary **--skip-db** and **--skip-tls**
do not change ownership. **--reconfigure** writes configuration only; run full
setup afterward to apply topology changes. Changing databases does not copy data.

Bundled Caddy supports **--tls-mode acme|internal|custom**. Custom mode also takes
**--tls-cert** and **--tls-key**. External proxies forward to the configured
application port. A port conflict returns an error without stopping its owner.
See **heimdall-cli-setup**(1) for all options.

## UPGRADES AND RECOVERY

```bash
sudo heimdall-cli backup
sudo dnf upgrade ./heimdall-server-*.rpm
sudo heimdall-cli setup --non-interactive
sudo heimdall-cli status
```

Select exactly one upgrade RPM. The transaction requires a successful backup for
an active installation, then stops only owned services. An upgrade-pending marker
prevents application startup until full setup successfully migrates the schema.
Skipped database work and failed migrations do not clear the marker. The legacy
RESTART_ON_UPGRADE setting does not override this requirement.

Ordinary runtime patches arrive through a new server RPM. A retained PostgreSQL
cluster with a different major blocks replacement; major migration is separate.
Backups contain logical SQL, configuration and owned Caddy certificate/CA state.
Restore into an empty recovery database, then run full setup before serving.
Removal retains data, certificates, backups and accounts, including modified
configuration saved by RPM as .rpmsave.

## OPTIONS

The **heimdall-server** binary itself takes no command-line options. All
runtime behavior is controlled through environment variables loaded from
the configuration files listed below. Service management is performed
exclusively through **systemctl**(1) or **heimdall-cli**(1).

## SERVICE MANAGEMENT

Start the service:

```bash
sudo systemctl start heimdall-server
```

Stop the service:

```bash
sudo systemctl stop heimdall-server
```

Restart after configuration changes:

```bash
sudo systemctl restart heimdall-server
```

Check service status:

```bash
sudo systemctl status heimdall-server
```

View logs:

```bash
sudo journalctl -u heimdall-server -f
```

Or use the admin CLI for service control:

```bash
sudo heimdall-cli start
sudo heimdall-cli stop
sudo heimdall-cli restart
sudo heimdall-cli status
```

## FILES

**/etc/heimdall-server/backend.env**

:   Application configuration file containing database credentials, JWT
    secrets, authentication provider settings, and all other runtime
    parameters. Owned by root:heimdall with mode 0640. See
    **heimdall-server-backend.env**(5).

**/etc/sysconfig/heimdall-server**

:   Service-level configuration controlling filesystem paths and restart
    behavior. Consumed by the systemd unit as an EnvironmentFile. See
    **heimdall-server-sysconfig**(5).

**/usr/lib/systemd/system/heimdall-server.service**

:   Systemd service unit. Runs the application as the **heimdall** user
    with security hardening directives. Loads both the sysconfig and
    backend.env files.

**/usr/share/heimdall-server/**

:   Application files including the compiled Node.js backend, frontend
    assets, database migrations, seeders, and vendored node_modules.

**/usr/bin/heimdall-cli**

:   Administrative CLI tool for setup, status, configuration, backup,
    restore, password reset, diagnostics, and service control. Go binary; its administrative commands use the packaged runtime clients.

**/usr/bin/heimdall-server**

:   Service entrypoint script. Sources configuration from backend.env,
    validates that required secrets are present, and executes the Node.js
    application.

**/usr/libexec/heimdall-server/**

:   Setup helpers and private runtimes under runtime/node, runtime/postgresql
    and runtime/caddy. No global node, psql or caddy aliases are installed.

**/usr/share/heimdall-server/runtime-manifest.json**

:   Runtime versions, archive hashes and license inventory. Notices are installed
    under /usr/share/licenses/heimdall-server.

**/var/lib/heimdall-postgresql/18/data**

:   Private PostgreSQL cluster owned by heimdall-postgres. The service is
    heimdall-postgresql.service; its default listener is 127.0.0.1:55432 and
    its Unix socket is /run/heimdall-postgresql.

**/etc/heimdall-server/caddy/Caddyfile**

:   Private Caddy configuration. The service is heimdall-caddy.service, running
    as heimdall-caddy. State lives under /var/lib/heimdall-caddy, and the admin
    socket is /run/heimdall-caddy/admin.sock.

**/var/lib/heimdall-server/**

:   Variable data directory owned by the heimdall user. Contains the
    backups/ subdirectory for pre-upgrade and on-demand database backups.

**/var/log/heimdall-server/**

:   Log directory. Used only when LOG_FILE is set in backend.env.
    By default, logs go to journald via systemd.

**/etc/pki/heimdall-server/**

:   Legacy certificate directory. Managed private Caddy certificates and CA
    state are retained in its private configuration/state directories.

**/usr/share/selinux/packages/heimdall-server.pp**

:   Compiled SELinux policy module defining the heimdall_server_t domain.
    Automatically loaded on install and removed on uninstall.

**/usr/lib/firewalld/services/heimdall-server.xml**

:   Firewalld service definition for the Heimdall Server listen port.

## SECURITY

### Systemd Hardening

The service unit applies the following restrictions:

- **NoNewPrivileges=true** -- prevents privilege escalation via setuid
  binaries or filesystem capabilities.
- **PrivateTmp=true** -- isolates /tmp and /var/tmp from other services.
- **ProtectSystem=strict** -- mounts the entire filesystem read-only
  except for explicitly listed ReadWritePaths.
- **ReadWritePaths=/var/lib/heimdall-server** -- the only writable path.
- **ProtectHome=true** -- hides /home, /root, and /run/user.
- **RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6** -- limits network
  socket types to Unix domain, IPv4, and IPv6.
- **CapabilityBoundingSet=** (empty) -- drops all Linux capabilities.
- **RestrictNamespaces=true** -- prevents creation of new namespaces.
- **LockPersonality=true** -- locks the process execution domain.
- **PrivateDevices=true** -- restricts access to physical devices.
- **ProtectKernelTunables=true**, **ProtectKernelModules=true**,
  **ProtectControlGroups=true** -- prevents kernel modification.
- **ProtectClock=true**, **ProtectHostname=true**,
  **ProtectKernelLogs=true** -- additional kernel protection.
- **ProtectProc=invisible** -- hides other processes.
- **RemoveIPC=true** -- removes IPC resources on service stop.
- **RestrictRealtime=true** -- prevents realtime scheduling.
- **RestrictSUIDSGID=true** -- blocks setuid/setgid file creation.
- **SystemCallArchitectures=native** -- restricts to native arch only.

SystemCallFilter and MemoryDenyWriteExecute are intentionally not enabled
because the Node.js V8 JIT engine requires syscalls outside the
@system-service set and writable-executable memory pages.

### SELinux

The RPM ships a custom policy module that confines the service to the
**heimdall_server_t** domain. The policy registers TCP port 3000 as
**heimdall_server_port_t**. If the listen port is changed, register the
new port:

```bash
sudo semanage port -a -t heimdall_server_port_t -p tcp 8443
```

The policy includes a tunable for PostgreSQL connectivity:

```bash
getsebool heimdall_server_connect_postgresql
```

### fapolicyd

The RPM registers all bundled native binaries with the fapolicyd trust
database at install time via **heimdall-cli fapolicyd**.
Entries are automatically removed on uninstall.

Policy compilation and privileged container tests do not establish enforcing
SELinux/fapolicyd acceptance. Stock runtimes do not establish FIPS validation.
EL8 ignores ProtectClock, ProtectHostname, ProtectKernelLogs and ProtectProc.

### Firewalld

A service definition is shipped at
**/usr/lib/firewalld/services/heimdall-server.xml**. When Caddy is
configured as a reverse proxy, the setup script opens HTTPS (port 443)
instead of the application port.

## ENVIRONMENT

All environment variables are documented in
**heimdall-server-backend.env**(5).

## EXIT STATUS

The entrypoint script exits with status 1 if DATABASE_PASSWORD is not set
in the configuration file.

## SEE ALSO

**heimdall-cli**(1), **heimdall-server-backend.env**(5),
**heimdall-server-sysconfig**(5), **systemctl**(1), **journalctl**(1),
**semanage**(8)

## AUTHORS

MITRE SAF Team <saf@mitre.org>

https://github.com/mitre/heimdall2
