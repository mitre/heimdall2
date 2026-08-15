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

    sudo heimdall-cli setup

This performs seven steps: generates secrets and configuration, bootstraps
a local PostgreSQL database (if applicable), tests the database connection,
runs schema migrations and seeds the initial admin user, configures TLS
via Caddy (if installed), applies SELinux and firewall policies, and starts
the service.

See **heimdall-cli**(1) for the full list of setup options and deployment
patterns.

## OPTIONS

The **heimdall-server** binary itself takes no command-line options. All
runtime behavior is controlled through environment variables loaded from
the configuration files listed below. Service management is performed
exclusively through **systemctl**(1) or **heimdall-cli**(1).

## SERVICE MANAGEMENT

Start the service:

    sudo systemctl start heimdall-server

Stop the service:

    sudo systemctl stop heimdall-server

Restart after configuration changes:

    sudo systemctl restart heimdall-server

Check service status:

    sudo systemctl status heimdall-server

View logs:

    sudo journalctl -u heimdall-server -f

Or use the admin CLI for service control:

    sudo heimdall-cli start
    sudo heimdall-cli stop
    sudo heimdall-cli restart
    sudo heimdall-cli status

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
    restore, password reset, diagnostics, and service control. Static Go
    binary with no external dependencies.

**/usr/bin/heimdall-server**

:   Service entrypoint script. Sources configuration from backend.env,
    validates that required secrets are present, and executes the Node.js
    application.

**/usr/libexec/heimdall-server/**

:   Helper scripts used during setup and maintenance: configure.sh
    (generates configuration), postgres-setup.sh (bootstraps local
    PostgreSQL), fapolicyd-trust.sh (registers binaries with fapolicyd),
    and the Caddy reverse proxy template.

**/var/lib/heimdall-server/**

:   Variable data directory owned by the heimdall user. Contains the
    backups/ subdirectory for pre-upgrade and on-demand database backups.

**/var/log/heimdall-server/**

:   Log directory. Used only when LOG_FILE is set in backend.env.
    By default, logs go to journald via systemd.

**/etc/pki/heimdall-server/**

:   TLS certificate directory. Stores self-signed certificates generated
    during setup for IP-based deployments. Corporate PKI certificates may
    also be placed here.

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

    sudo semanage port -a -t heimdall_server_port_t -p tcp 8443

The policy includes a tunable for PostgreSQL connectivity:

    getsebool heimdall_server_connect_postgresql

### fapolicyd

The RPM registers all bundled native binaries with the fapolicyd trust
database at install time via **/usr/libexec/heimdall-server/fapolicyd-trust.sh**.
Entries are automatically removed on uninstall.

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
