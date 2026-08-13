# FIPS-enabled RHEL 9 test host (EC2, OpenTofu)

Provisions a RHEL 9 EC2 instance that is **FIPS-enabled at the kernel before it
is ever reachable**: cloud-init runs `fips-mode-setup --enable` and reboots, so
`/proc/sys/crypto/fips_enabled` reads `1` from the first usable session. This is
the host tier for ADR-006's empirical work (provider activation, benchmarks,
runtime dependency audit) and for RPM install/runtime testing that containers
cannot do (FIPS, SELinux enforcing, fapolicyd, real systemd).

## Access is SSM, not SSH

The MITRE network filters the SSH **protocol** at the edge — TCP to port 22
connects, then the banner exchange is killed (verified 2026-08-06 against both
an EC2 host and github.com). Session Manager tunnels over HTTPS/443 via the
agent's outbound connection, so it works where SSH cannot.

```bash
# interactive shell — needs session-manager-plugin. The brew cask requires
# admin elevation (blocked by corporate privilege management); the user-space
# install needs none:
#   curl -o /tmp/smp.zip https://s3.amazonaws.com/session-manager-downloads/plugin/latest/mac_arm64/sessionmanager-bundle.zip
#   unzip /tmp/smp.zip -d /tmp && cp /tmp/sessionmanager-bundle/bin/session-manager-plugin ~/.local/bin/
aws ssm start-session --target <instance-id>

# one-shot command
aws ssm send-command --instance-ids <id> --document-name AWS-RunShellScript \
  --parameters 'commands=["cat /proc/sys/crypto/fips_enabled"]'
```

The key pair is still attached — plain SSH works from networks that permit it.

**Real `ssh`/`scp` through the tunnel** — add to `~/.ssh/config` (before any
`Host *` block). The wildcard entry serves any instance ID ever; the alias
resolves the instance by Name tag at connect time, so it survives rebuilds,
IP changes, and VPC changes without edits:

```text
Host i-* mi-*
  ProxyCommand aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'
  User ec2-user
  IdentityFile ~/.ssh/aaronl-aws.pem
  UserKnownHostsFile /dev/null   # host keys churn on rebuild; SSM transport is already SigV4-authed + TLS
  LogLevel ERROR

Host heimdall-fips
  ProxyCommand aws ssm start-session --target $(aws ec2 describe-instances --filters Name=tag:Name,Values=${TF_VAR_name:-heimdall-fips} Name=instance-state-name,Values=running --query 'Reservations[0].Instances[0].InstanceId' --output text) --document-name AWS-StartSSHSession --parameters 'portNumber=%p'
  User ec2-user
  IdentityFile ~/.ssh/aaronl-aws.pem
  UserKnownHostsFile /dev/null
  LogLevel ERROR
```

## Lifecycle

```bash
tofu init && tofu apply    # create (~5 min to FIPS-on: update, agent, enable, reboot)
bin/fips-box pause         # taking a break — stop now, don't wait for the idle alarm
bin/fips-box wake          # start + wait until SSM is reachable (prints when ssh-ready)
bin/fips-box status        # state, IP, idle-alarm state
tofu destroy               # ephemeral use — gone entirely
```

`fips-box` resolves the instance by Name tag, so it needs no edits across
rebuilds. Stopped costs only EBS (~$4/mo @ 50GB). The **idle alarm** stops the
box automatically after 45 min under 3% CPU (`idle_stop_minutes`, 0 disables) —
`pause` is for when you know you're leaving and don't want to wait. Either way,
`wake` brings it back; FIPS mode persists across stop/start (kernel args);
running processes and tmux sessions do not.

Two profiles, one module: ephemeral test host (apply → test → destroy) and
persistent dev/test box (apply once, stop between sessions).

## Per-user boxes — one env var

The Name tag is the single identity knob, driven by `TF_VAR_name` everywhere
(OpenTofu reads it natively; `bin/fips-box` and the ssh alias follow the same
variable). Default: `heimdall-fips`.

```bash
export TF_VAR_name=will-fips        # your box, your tools, no file edits
export TF_VAR_key_name=will-aws     # REQUIRED per user — default is Aaron's key pair
tofu apply                          # separate state dir = separate box
```

⚠️ **Renaming an EXISTING box replaces it** — the IAM profile name derives from
`name`, and an instance-profile change forces instance replacement. Run
`tofu plan` and read it before approving any apply against a box that carries
work; the disk does not survive replacement.

## Sizing

Default `t3.medium` — sufficient for the FIPS spike and CLI testing. If an RPM
build proves it needs more: stop → modify instance type → start (same disk,
two minutes). Resize on evidence, not speculation. `t4g.*` + an aarch64 AMI
for ARM checks.

## Notes

- `fips-mode-setup` is deprecated for *switching* on RHEL 9.5+ (replacements
  are install-time: kickstart `fips=1`, image builder, bootc). The pinned AMI
  is RHEL 9.4, where post-install switching is the supported, documented
  method. Long term, move to a FIPS-enabled image.
- Never `--force-fips` on Node here — the RHEL model is host FIPS → OpenSSL →
  Node inherits (ADR-006 §10).
- State is local and gitignored; this module manages a throwaway test tier,
  not production infrastructure.
