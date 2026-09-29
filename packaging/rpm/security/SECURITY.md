# Heimdall Server Security Configuration

This directory contains sample security configurations for STIG and FedRAMP
environments. These files are NOT activated automatically — review and copy
them to the appropriate system directories.

## Files

| File | Destination | Purpose |
|------|------------|---------|
| `40-heimdall.rules` | `/etc/audit/rules.d/` | auditd filesystem watches |

## SELinux Policy

The RPM ships a SELinux policy module at
`/usr/share/selinux/packages/heimdall-server.pp`. Installation registers it and
relabels package-owned runtime, configuration, state, and socket paths. Setup
also relabels newly created private state. Check installation warnings: policy
compilation alone does not establish successful loading or runtime confinement.

### Domain and port types

- **heimdall_server_t** — the application domain, entered through private Node at
  `/usr/libexec/heimdall-server/runtime/node/bin/node`. Node's V8 JIT requires
  `execmem`; the policy retains that permission.
- **postgresql_t** — the stock PostgreSQL domain, used by the private server.
- **httpd_t** — the stock HTTP service domain, used by private Caddy. The policy
  permits traversal to its configuration, management of HTTP state, and reverse
  proxy connections to `heimdall_server_port_t`.
- **heimdall_server_port_t** — the TCP port type registered for the
  application listen port (default TCP 3000).
- **postgresql_port_t** — the TCP port type for the selected private database
  port (default TCP 55432); external database ports must also permit connection.
- **http_port_t** — the HTTP/HTTPS listeners, normally TCP 80 and 443.

Bundled and system PostgreSQL instances share `postgresql_t`; bundled Caddy and
system HTTP daemons share `httpd_t`. SELinux does not isolate instances sharing
these domains. Dedicated accounts and private filesystem modes provide that
separation. `NoNewPrivileges=true` remains enabled; the policy includes systemd
transition permissions for all three domains.

Private PostgreSQL data and sockets use `postgresql_db_t` and
`postgresql_var_run_t`. Its libraries use `lib_t`; only `postgres`, `initdb`, and
`pg_ctl` are server entry points. Private Caddy configuration, certificate state,
and sockets use `httpd_config_t`, `httpd_var_lib_t`, and `httpd_var_run_t`.

### Changing the listen port

Use the CLI to change the application port and rerun setup after changing the
selected database/proxy ports. Setup must reject an explicit conflicting SELinux
service-port assignment, even when no process currently listens there. Choose
another port or have the host administrator resolve the assignment; do not use
`semanage port -m` to take another service's label.

Inspect current assignments with:

```bash
sudo semanage port -l
sudo semanage port -l -C
```

New mappings created by Heimdall are recorded in root-owned mode-0600
`/etc/heimdall-server/selinux-ports` as `TYPE tcp PORT`. Existing compatible
mappings are used without claiming ownership. Uninstall removes a recorded
mapping only when its current local assignment still matches; failed removals
remain in the ledger. Administrator-created and stock mappings are retained.

### PostgreSQL connectivity tunable

The policy includes a boolean for PostgreSQL access:

```bash
getsebool heimdall_server_connect_postgresql
```

### Enforcement verification

The policy compiles against the inspected EL8 interfaces. Enforcing OL8 runtime
acceptance remains unverified. Check actual `ps -eZ` process domains and
`matchpathcon`/`ls -Z` labels on an enforcing host, then exercise setup, SQL,
readiness/login, HTTPS, port changes, upgrades, and removal. Inspect relevant
AVCs with `ausearch -m AVC,USER_AVC -ts recent`. Caddy ACME/DNS/HTTP3, custom
certificates, storage, and admin socket behavior require this runtime check;
do not enable broad HTTP network permissions without measuring a real need.
Neither a successful module build nor a privileged container closes this gate.

### heimdall-cli (administrative)

The `heimdall-cli` binary is an administrative tool intended for privileged
operators. It has no custom SELinux domain; its actual domain depends on the
operator's SELinux login/role policy.

## fapolicyd and FIPS

`heimdall-cli fapolicyd add` refreshes trust for the private Node/PostgreSQL/Caddy
executables, PostgreSQL shared libraries, and application native `.node` addons.
Install/upgrade invokes the same native CLI command; removal deletes only owned
trust entries. Mutable configuration, database files, and certificate storage
are not blanket-trusted. Inspect trust-command failures and exercise services
with fapolicyd running in enforcing mode; that gate remains unverified here.

Existing host FIPS checks remain relevant. Stock bundled Node, PostgreSQL, and
Caddy binaries do not establish FIPS validation or compliance. Do not describe
this RPM as FIPS-validated without separate evidence for the complete deployed
cryptographic configuration.

## Upgrade and removal safety

Upgrades reject incompatible/ambiguous private PostgreSQL clusters before any
backup or service stop. An active configured installation must produce a backup;
failure aborts replacement. Only the exact unquoted setting
`SKIP_PREUPGRADE_BACKUP=true` in `/etc/sysconfig/heimdall-server` overrides that
requirement, after an operator has taken and verified a separate backup.
`RESTART_ON_UPGRADE` is retired. RPM scriptlets do not evaluate sysconfig as shell.

After backup, RPM creates root-owned `/etc/heimdall-server/upgrade-pending` and
stops only the app, private Caddy, and private PostgreSQL, in that order. Both the
unit and launcher block application startup while the marker exists, including
restart attempts by an older package's uninstall scriptlet. Run
`sudo heimdall-cli setup --non-interactive` after upgrading. Successful full setup
applies migrations before clearing the marker and starting selected services;
failed migration, `--skip-db`, and `--reconfigure` leave it in place.

Removal stops/disables only the three Heimdall units. It retains application and
database data, secrets, certificates, configuration, and service accounts. It
does not administer system PostgreSQL, Caddy, or other proxies. Backups contain
logical SQL plus configuration and optional private Caddy CA/certificate state;
they never substitute a copy of the live PostgreSQL data tree for `pg_dump`.
RPM may retain modified packaged configuration with a `.rpmsave` suffix; restore
that configuration before setting up a reinstalled package.

## Firewalld

A service definition is shipped at
`/usr/lib/firewalld/services/heimdall-server.xml`.

- **With bundled Caddy (default):** Setup configures Caddy as a TLS reverse
  proxy and opens port **443** (HTTPS) via the `heimdall-server` firewalld
  service. The application port (3000) is not exposed externally.
- **With proxy mode `none`:** Setup can expose the selected application port
  directly for HTTP-only development.

External proxies remain operator-managed. `--skip-tls` temporarily skips proxy
configuration; it does not change the saved proxy ownership mode. Review the
host's firewall policy for the chosen deployment.

## Enabling Audit Rules

The sample audit rules in `40-heimdall.rules` are **not activated by default**.
Follow these steps to enable them:

1. **Review the sample rules** to ensure they are appropriate for your
   environment:

   ```bash
   cat /usr/share/heimdall-server/security/40-heimdall.rules
   ```

2. **Copy the rules** to the active audit rules directory:

   ```bash
   sudo cp /usr/share/heimdall-server/security/40-heimdall.rules /etc/audit/rules.d/
   ```

3. **Restart auditd** to load the new rules:

   ```bash
   sudo systemctl restart auditd
   ```

4. **Verify the rules loaded** successfully:

   ```bash
   sudo auditctl -l | grep heimdall
   ```

   You should see entries for each `-w` watch and `-a` syscall rule defined in
   the file.

5. **Test with ausearch** to confirm events are being recorded:

   ```bash
   sudo ausearch -k heimdall-config
   sudo ausearch -k heimdall-admin
   sudo ausearch -k heimdall-data
   ```

## Security Considerations

### Database password in process environment

The CLI passes the PostgreSQL password via the `PGPASSWORD` environment variable
when calling `psql` and `pg_dump`. On shared systems, other users may be able to
see environment variables via `/proc/<pid>/environ`. For maximum security:

- Restrict access to the Heimdall server to authorized administrators only
- Consider using a `.pgpass` file (mode 0600) for unattended operations
- Run `heimdall-cli` commands only from secure terminals

### Password reset output

The `heimdall-cli reset-password` command prints auto-generated passwords to
stdout in plaintext. To prevent exposure:

- Do not redirect output to log files
- Clear terminal history after running the command: `history -c`
- Consider piping output to a secure credential store

## Active Configs (shipped in /etc/)

These are installed by the RPM and active by default:

| File | Purpose |
|------|---------|
| `/etc/rsyslog.d/30-heimdall-server.conf` | Routes journald messages to `/var/log/heimdall-server/` |
| `/etc/logrotate.d/heimdall-server` | 90-day log rotation (FedRAMP Moderate AU-11) |

## Logging Architecture

```text
NestJS app (stdout/stderr)
  → systemd (captures)
    → journald (primary storage, automatic)
      → rsyslog (routes to file via /etc/rsyslog.d/30-heimdall-server.conf)
        → /var/log/heimdall-server/heimdall-server.log
        → /var/log/heimdall-server/heimdall-cli.log
```

### Viewing logs

```bash
# Primary (journald)
journalctl -u heimdall-server
journalctl -u heimdall-server -f          # follow
journalctl -u heimdall-server -p err      # errors only
journalctl -u heimdall-server --since "1 hour ago"

# File-based (via rsyslog)
tail -f /var/log/heimdall-server/heimdall-server.log

# CLI admin actions
tail -f /var/log/heimdall-server/heimdall-cli.log

# Audit events (if rules activated)
ausearch -k heimdall-config               # config file changes
ausearch -k heimdall-admin                # CLI tool usage
ausearch -k heimdall-data                 # data directory changes
```

## STIG Controls

| Control | Implementation |
|---------|---------------|
| AU-2 (Audit Events) | auditd rules watch config, binaries, data |
| AU-3 (Audit Content) | journald captures timestamp, PID, unit, priority |
| AU-4 (Audit Storage) | 90-day logrotate retention |
| AU-9 (Audit Protection) | Log files 0640, audit rules in 40- slot (before -e 2) |
| AC-6 (Least Privilege) | systemd: CapabilityBoundingSet=, ProtectSystem=strict |
| CM-5 (Access Restrictions) | backend.env 0640 root:heimdall |
| SC-7 (Boundary Protection) | SELinux policy, firewalld, Caddy TLS |

## systemd Hardening (active by default)

The service unit includes comprehensive sandboxing:

- NoNewPrivileges, PrivateTmp, PrivateDevices
- ProtectSystem=strict with explicit ReadWritePaths
- ProtectHome, ProtectClock, ProtectHostname, ProtectKernelLogs
- RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
- SystemCallArchitectures=native
- CapabilityBoundingSet= (empty — no capabilities)
- UMask=0027

## File Permissions

| Path | Mode | Owner | Purpose |
|------|------|-------|---------|
| `/etc/heimdall-server/` | 0751 | root:heimdall | Caddy can traverse to its private subdirectory |
| `/etc/heimdall-server/backend.env` | 0640 | root:heimdall | Credentials (DB, JWT, OAuth) |
| `/etc/heimdall-server/caddy/` | 0750 | root:heimdall-caddy | Private proxy configuration |
| `/var/lib/heimdall-postgresql/` | 0700 | heimdall-postgres:heimdall-postgres | Private database state |
| `/var/lib/heimdall-caddy/` | 0700 | heimdall-caddy:heimdall-caddy | Private certificate/CA state |
| `/etc/sysconfig/heimdall-server` | 0640 | root:root | Service path overrides |
| `/etc/rsyslog.d/30-heimdall-server.conf` | 0644 | root:root | Rsyslog routing rules |
| `/etc/logrotate.d/heimdall-server` | 0644 | root:root | Log rotation policy |
| `/run/heimdall-server/` | 0750 | heimdall:heimdall | Runtime directory (via tmpfiles.d) |
| `/var/lib/heimdall-server/` | 0750 | heimdall:heimdall | Variable data |
| `/var/lib/heimdall-server/backups/` | 0700 | heimdall:heimdall | Backup archives (contain credentials) |
| `/var/log/heimdall-server/` | 0750 | heimdall:heimdall | Log files |
