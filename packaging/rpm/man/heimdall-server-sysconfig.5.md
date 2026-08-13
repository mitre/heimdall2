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
    This is the only directory the service writes to at runtime (via the
    systemd ReadWritePaths directive).

**HEIMDALL_CONFIG_DIR**=_/etc/heimdall-server_

:   Configuration directory containing backend.env and any additional
    configuration files. Owned by root:heimdall with mode 0750.

**HEIMDALL_LIBEXEC_DIR**=_/usr/libexec/heimdall-server_

:   Helper scripts directory containing configure.sh, postgres-setup.sh,
    fapolicyd-trust.sh, and the Caddy reverse proxy template.

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

**RESTART_ON_UPGRADE**=_true_

:   Controls whether the service is automatically restarted during RPM
    upgrades. When set to **true** (the default), the RPM postun
    scriptlet calls **systemctl try-restart heimdall-server** after
    package upgrade. Set to **false** to manage restart timing manually,
    which is useful in environments with maintenance windows or when
    upgrades require manual database migration steps.

This follows the same pattern used by Grafana and other enterprise
services that ship sysconfig files for restart control.

## UPGRADE BEHAVIOR

This file is marked **%config(noreplace)** in the RPM spec. During
package upgrades:

- If you have **not** modified the file, the new version from the package
  replaces it.
- If you **have** modified the file, your version is preserved and the
  new package version is saved as
  **/etc/sysconfig/heimdall-server.rpmnew** for reference.

This ensures that custom path overrides and restart preferences survive
upgrades without manual intervention.

## EXAMPLES

Override the data directory to use a dedicated volume:

```text
HEIMDALL_DATA_DIR=/data/heimdall-server
```

Disable automatic restart during upgrades:

```text
RESTART_ON_UPGRADE=false
```

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
