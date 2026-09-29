# heimdall-server-sysconfig 5 "Heimdall Server" "Heimdall Server Manual"

## NAME

heimdall-server-sysconfig - Heimdall Server service-level configuration

## SYNOPSIS

**/etc/sysconfig/heimdall-server**

## DESCRIPTION

This file contains service-level settings that control **how** the
Heimdall Server systemd service runs: filesystem paths, restart behavior,
and other operational parameters. It is loaded by the systemd unit as an
EnvironmentFile before the application starts.

This file is **not** for application configuration. Database credentials,
authentication settings, and all other runtime parameters belong in
**/etc/heimdall-server/backend.env**. See
**heimdall-server-backend.env**(5).

The file uses shell-compatible **KEY=value** syntax. Lines beginning with
**#** are comments. Changes take effect after restarting the service:

```bash
sudo systemctl restart heimdall-server
```

## CONFIGURATION PRIORITY

Settings can be specified through multiple mechanisms. When the same
setting is defined in more than one place, the following priority order
applies (highest to lowest):

1. CLI flag (e.g., **heimdall-cli setup --app-dir=/custom/path**)
2. Environment variable (e.g., **export HEIMDALL_APP_DIR=/custom/path**)
3. This configuration file (**/etc/sysconfig/heimdall-server**)
4. Compile-time default

In practice, this means values set in this file are the baseline and can
be overridden by environment variables or CLI flags without editing the
file.

## SETTINGS

**HEIMDALL_APP_DIR**=_/usr/share/heimdall-server_

:   Application install directory containing the Node.js application
    files, compiled backend, frontend assets, vendored node_modules,
    database migrations, and seeders. This directory is read-only at
    runtime.

**HEIMDALL_DATA_DIR**=_/var/lib/heimdall-server_

:   Variable data directory owned by the heimdall user. Contains the
    backups/ subdirectory for pre-upgrade and on-demand database backups.
    Private PostgreSQL and Caddy state are separate sibling directories and
    are not relocated or recursively reowned by this application setting.

**HEIMDALL_CONFIG_DIR**=_/etc/heimdall-server_

:   Configuration directory containing backend.env and any additional
    configuration files. Owned by root:heimdall with mode 0751 for private Caddy traversal;
    backend.env remains root:heimdall 0640.

**HEIMDALL_LIBEXEC_DIR**=_/usr/libexec/heimdall-server_

:   Helper scripts and runtime directory. Packaged executables use fixed paths
    beneath runtime/. CLI path overrides do not relocate the RPM or units.

**HEIMDALL_LOG_DIR**=_/var/log/heimdall-server_

:   Log directory owned by the heimdall user. Used when LOG_FILE is set
    in backend.env. When LOG_FILE is unset (the default), logs go to
    journald and this directory is unused.

**HEIMDALL_CERT_DIR**=_/etc/pki/heimdall-server_

:   TLS certificate directory. Stores self-signed certificates generated
    during setup for IP-based deployments and any manually installed
    certificates.

**HEIMDALL_ENV_FILE**=_/etc/heimdall-server/backend.env_

:   Path to the application environment file. The entrypoint script
    sources this file before starting the Node.js process.

**SKIP_PREUPGRADE_BACKUP**=_false_

:   An active configured installation must complete a pre-upgrade backup before
    replacement. Set this strict boolean to **true** only after independently
    verifying a separate backup; reset it to **false** afterward.

**RESTART_ON_UPGRADE**=_(legacy)_

:   Retained for compatibility only. Upgrade transactions stop owned services and
    leave /etc/heimdall-server/upgrade-pending. Full **heimdall-cli setup
    --non-interactive** must successfully migrate before application startup.
    This setting cannot override the migration gate.

## UPGRADE BEHAVIOR

This file is marked **%config(noreplace)** in the RPM spec. During
package upgrades:

- If you have **not** modified the file, the new version from the package
  replaces it.
- If you **have** modified the file, your version is preserved and the
  new package version is saved as
  **/etc/sysconfig/heimdall-server.rpmnew** for reference.

This ensures that custom path overrides and restart preferences survive
upgrades. Review .rpmnew templates without replacing saved secrets.
PostgreSQL major upgrades require a separate migration. A mismatched retained
cluster major refuses package replacement before any service is stopped.

## EXAMPLES

Override the data directory to use a dedicated volume:

```text
HEIMDALL_DATA_DIR=/data/heimdall-server
```

After verifying an independent backup, explicitly override the automatic backup
gate for one upgrade:

```text
SKIP_PREUPGRADE_BACKUP=true
```

Reset it to false after the transaction. Full setup remains required.

Point the configuration to a non-standard location:

```text
HEIMDALL_CONFIG_DIR=/opt/heimdall/etc
HEIMDALL_ENV_FILE=/opt/heimdall/etc/backend.env
```

## SEE ALSO

**heimdall-server**(8), **heimdall-server-backend.env**(5),
**heimdall-cli**(1), **systemd.exec**(5), **systemctl**(1)

## AUTHORS

MITRE SAF Team <saf@mitre.org>

https://github.com/mitre/heimdall2
