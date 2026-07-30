# Heimdall Server Security Configuration

This directory contains sample security configurations for STIG and FedRAMP
environments. These files are NOT activated automatically — review and copy
them to the appropriate system directories.

## Files

| File | Destination | Purpose |
|------|------------|---------|
| `40-heimdall.rules` | `/etc/audit/rules.d/` | auditd filesystem watches |

## SELinux Policy

The RPM ships a custom SELinux policy module at
`/usr/share/selinux/packages/heimdall-server.pp`. The policy is automatically
loaded on install and removed on uninstall.

### Domain and port types

- **heimdall_server_t** — the confined domain under which the Heimdall Server
  systemd service runs. The policy restricts file access, network sockets, and
  inter-process communication to only what the application requires.
- **heimdall_server_port_t** — the TCP port type registered for the
  application listen port (default TCP 3000).

### Changing the listen port

If you change the `PORT` variable in `/etc/heimdall-server/backend.env`, you
must update the SELinux port registration:

```bash
sudo semanage port -m -t heimdall_server_port_t -p tcp <NEW_PORT>
```

### PostgreSQL connectivity tunable

The policy includes a boolean for PostgreSQL access:

```bash
getsebool heimdall_server_connect_postgresql
```

### heimdall-cli (unconfined)

The `heimdall-cli` binary runs as root in the system's unconfined domain. It
is an administrative tool intended for privileged operators and is not confined
by a custom SELinux policy.

## Firewalld

A service definition is shipped at
`/usr/lib/firewalld/services/heimdall-server.xml`.

- **With Caddy (default):** The setup script configures Caddy as a TLS reverse
  proxy and opens port **443** (HTTPS) via the `heimdall-server` firewalld
  service. The application port (3000) is not exposed externally.
- **With `--skip-tls`:** The setup script opens port **3000** directly so the
  application is reachable without a reverse proxy.

The setup script handles firewalld configuration automatically. No manual
firewall changes are required for standard deployments.

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

```
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
| `/etc/heimdall-server/backend.env` | 0640 | root:heimdall | Credentials (DB, JWT, OAuth) |
| `/etc/sysconfig/heimdall-server` | 0640 | root:root | Service path overrides |
| `/etc/rsyslog.d/30-heimdall-server.conf` | 0644 | root:root | Rsyslog routing rules |
| `/etc/logrotate.d/heimdall-server` | 0644 | root:root | Log rotation policy |
| `/run/heimdall-server/` | 0750 | heimdall:heimdall | Runtime directory (via tmpfiles.d) |
| `/var/lib/heimdall-server/` | 0750 | heimdall:heimdall | Variable data |
| `/var/lib/heimdall-server/backups/` | 0700 | heimdall:heimdall | Backup archives (contain credentials) |
| `/var/log/heimdall-server/` | 0750 | heimdall:heimdall | Log files |
