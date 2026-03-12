# RECOVERY CONTEXT - 2026-02-27

## Current Epic/Phase
**Goal:** saf-packaging mono-repo Phase 1 — heimdall-server RPM with TLS/enterprise support
**Branch:** `main` (saf-packaging repo) + `feat/rpm-build` (heimdall2 repo)
**Epic Card:** heimdall2-zp6 (RPM packaging), heimdall2-ty3 (TLS/proxy)
**Success Criteria:**
- saf-packaging repo has all heimdall-server packaging files ✅
- RPM -8 builds on OL8 + RHEL9 ✅
- Caddy TLS reverse proxy works with hostname auto-detection ⏳ testing
- Clean install + setup verified end-to-end on RHEL9 ⏳ testing
- Grouped commits in saf-packaging (14 commits, not pushed yet)

## Progress Status
**Completed this session:**
- ✅ RPM -7 built on OL8 aarch64, upgrade -6→-7 verified (service + CLI + reset_password + API login)
- ✅ RPM -7 built on RHEL9 x86_64, fresh install verified (all 5 original steps)
- ✅ 14 grouped commits in saf-packaging (scaffolding → core → security → CLI → CI → profiles → airgap → TLS)
- ✅ Added Caddy TLS reverse proxy support (Recommends: caddy, Caddyfile template, setup step 4/6)
- ✅ Caddy auto-TLS research: Caddy auto-detects public vs private hostnames (LE vs internal CA)
- ✅ Caddyfile template cleaned: no tls directive, Caddy auto-detects; setup script adds tls only for IP/BYO
- ✅ Added --external-url, --tls-cert, --tls-key flags to setup + configure scripts
- ✅ Enterprise deployment patterns: LB (--skip-tls), BYO cert, existing proxy
- ✅ Cloud detection (EC2/Azure/GCP) with firewall advisory hints
- ✅ Firewalld opens 443 (Caddy) or PORT (--skip-tls for LB)
- ✅ SELinux httpd_can_network_connect for reverse proxy
- ✅ IP-based deployments: openssl self-signed cert with IP SAN
- ✅ COPR repo file ([mitre-saf], enabled=0)
- ✅ Two agent code reviews: all critical bugs fixed (local outside functions, duplicate env writes, LE path)
- ✅ INSTALL.md fully updated: 6 steps, TLS strategies table, enterprise patterns, cloud detection
- ✅ Created beads cards: heimdall2-ty3 (TLS), heimdall2-aqx (BIND_ADDRESS), heimdall2-kwr (Python setup)

**In progress:**
- ⏳ RPM -8 rebuilding on EC2 RHEL9 (i-092650a237d966551, IP: 34.229.52.59)
  - Status: build started in tmux, uninstalled old RPM, cleaned up user/db/dirs
  - Next: wait for build, then fresh install + setup with hostname:
    `sudo heimdall-server-setup --external-url https://ip-172-31-47-186.ec2.internal`
  - Verify: Caddy auto-detects .internal hostname → internal CA cert (no tls internal needed)
  - Then: test HTTPS via hostname from inside the box
  - EC2 instance keeps stopping (IP changes each restart) — use `aws ec2 start-instances`

**Not yet done:**
- ❌ Clean install test with hostname-based Caddy auto-TLS on RHEL9
- ❌ Test on OL9 x86_64 VM (oracle9-x86-64@orb) — OrbStack
- ❌ Ubuntu DEB packaging (Phase 2)
- ❌ Alpine APK packaging (Phase 2)
- ❌ Push saf-packaging to GitHub

## Research & Findings

### Caddy TLS Auto-Detection (Key Finding)
Caddy automatically determines TLS strategy based on hostname type:
- **Public DNS** (heimdall.agency.mil): Let's Encrypt via ACME — zero config
- **Private hostname** (.internal, .local, RFC 1918): Internal CA — automatic, generates root CA + leaf
- **Air-gapped** (no internet): Falls back to internal CA automatically
- **Bare IP address**: Cannot issue certs — must provide self-signed or BYO

**Implication:** Our Caddyfile template ships with NO tls directive. For hostnames, Caddy does the right thing by default. For IPs, our setup script generates an openssl self-signed cert and adds `tls /path/to/cert /path/to/key`. For BYO, user passes `--tls-cert`/`--tls-key`.

Source: https://caddyserver.com/docs/automatic-https

### Caddy on RHEL (Research)
- In EPEL for EL8/EL9 (caddy-2.6.4+)
- Fedora spec labels binary as httpd_exec_t → runs as httpd_t domain
- Needs httpd_can_network_connect boolean for proxying to backend
- No custom SELinux module needed for Caddy itself
- Default Caddyfile has a :80 welcome page — our import pattern works alongside it

### Enterprise Deployment Patterns (Research)
Major RPM-packaged apps (GitLab, Grafana, Zabbix, Cockpit, Foreman):
- All use nginx or Apache, none ship Caddy
- GitLab bundles nginx in omnibus, configures via gitlab.rb
- Grafana ships no proxy, recommends nginx in docs
- Cockpit handles TLS directly (built-in)
- Zabbix has separate nginx/apache conf subpackages

We chose Caddy because: auto-TLS (LE + internal CA), simpler config, in EPEL. Nginx remains documented as alternative for orgs with existing nginx infrastructure.

### Self-Signed Cert for IP Deployments
- Caddy's internal CA cannot issue certs for bare IP addresses
- We generate: openssl EC P-256 cert with subjectAltName=IP:x.x.x.x,DNS:localhost
- Stored in /etc/pki/heimdall-server/server.crt and .key
- Caddy config gets: `tls /etc/pki/heimdall-server/server.crt /etc/pki/heimdall-server/server.key`

### Helmet HTTPS Enforcement (Discovery)
Heimdall's NestJS backend uses Helmet middleware that adds:
- Content-Security-Policy with `upgrade-insecure-requests`
- Strict-Transport-Security header
This forces browsers to use HTTPS for all assets. Cannot be disabled via env vars — hardcoded in app. This is WHY a TLS reverse proxy is mandatory for production, not optional.

### COPR Repo File
- Section name cannot contain `@` — dnf rejects it
- Changed from `[copr:copr.fedorainfracloud.org:@mitre:saf]` to `[mitre-saf]`
- Ship with `enabled=0` until publication pipeline is stable

### Code Review Findings (Fixed)
- `local` keyword outside functions crashes under `set -e` in bash
- Duplicate EXTERNAL_URL appended to env file (fixed: use sed to update in-place)
- `tls internal` left in Caddyfile for hostname deployments blocked Let's Encrypt
- semanage port -a without -m fallback fails on reruns
- --tls-cert validated even when --skip-tls set (now skipped)
- Env file `source` overwrites user-added custom vars (deferred to Python refactor)

## Key Decisions This Session
- **Caddy as default reverse proxy** (not nginx): Auto-TLS, simpler config, in EPEL. nginx documented as alternative.
- **Caddyfile template has NO tls directive**: Let Caddy auto-detect. Setup script only adds tls for IP/BYO.
- **--external-url as CLI flag**: Replaces interactive-only EXTERNAL_URL prompt. Critical for automation.
- **--skip-tls for load balancer deployments**: App on 0.0.0.0:3000, LB handles TLS externally.
- **--tls-cert/--tls-key for corporate PKI**: Caddy uses BYO certs, no LE/internal CA.
- **Firewalld opens 443 (Caddy) or PORT (--skip-tls)**: Never both.
- **COPR repo file enabled=0**: Ship disabled until publication pipeline works.
- **Setup script stays bash for now**: Python refactor (heimdall-cli setup) deferred — card heimdall2-kwr.

## Scope Guard Rails
**IN SCOPE (next session):**
- ✅ Finish -8 clean install test with hostname Caddy auto-TLS
- ✅ Test on OL9 (OrbStack or EC2)
- ✅ Push saf-packaging to GitHub

**OUT OF SCOPE (defer):**
- ⛔ Ubuntu DEB packaging — Phase 2
- ⛔ Alpine APK packaging — Phase 2
- ⛔ Vulcan packaging — Phase 4
- ⛔ COPR submission — needs GPG key
- ⛔ Python setup refactor — heimdall2-kwr
- ⛔ BIND_ADDRESS upstream — heimdall2-aqx
- ⛔ Password env vars upstream — heimdall2-lcx

## EC2 Instance
- **Instance ID:** i-092650a237d966551
- **Type:** t3.large, RHEL 9.4 x86_64
- **Key:** ~/.ssh/aaronl-aws.pem, user: ec2-user
- **IP changes on restart** — always check: `aws ec2 describe-instances --instance-ids i-092650a237d966551 --query 'Reservations[0].Instances[0].[PublicIpAddress,State.Name]' --output text`
- **Internal hostname:** ip-172-31-47-186.ec2.internal
- **Security group:** sg-75232501 (SSH + 443 + 3000 open)
- **Status:** running, IP 34.229.52.59 (may change)
- **STOP don't terminate when done:** `aws ec2 stop-instances --instance-ids i-092650a237d966551`
- **Caddy installed from EPEL**, tmux installed, all build deps cached

## saf-packaging Repo State
- **Location (local):** `/Users/alippold/github/mitre/saf-packaging/`
- **Location (GitHub):** `https://github.com/mitre/saf-packaging`
- **14 commits on main**, NOT pushed yet (user wants to test all platforms first)
- **Last commit:** 39552f2 (fix: clean Caddyfile template)
- **Clean tree** — no uncommitted changes

## Git State (heimdall2 repo)
- **Branch:** feat/rpm-build
- **Uncommitted:** modified packaging/rpm/* files (from previous sessions)
- **Note:** saf-packaging is a SEPARATE repo

## Beads Summary
- heimdall2-zp6: RPM Packaging epic (OPEN)
- heimdall2-zp6.8: Rebuild RPMs with security policies (OPEN, in progress)
- heimdall2-zp6.9: Commit and create PR (OPEN, blocked by zp6.8)
- heimdall2-ty3: TLS reverse proxy + cloud detection (OPEN, implemented)
- heimdall2-aqx: BIND_ADDRESS upstream (OPEN, P2)
- heimdall2-lcx: Password complexity env vars upstream (OPEN, P2)
- heimdall2-3px: Host RPM repo on SAF GitHub Pages (OPEN, P2)
- heimdall2-kwr: Evaluate Python setup module (OPEN, P3)

## Recovery Commands
```bash
cat .beads/recovery-context.md
bd ready
bd show heimdall2-zp6.8
bd show heimdall2-ty3

# EC2 instance
aws ec2 describe-instances --instance-ids i-092650a237d966551 --query 'Reservations[0].Instances[0].[PublicIpAddress,State.Name]' --output text
# If stopped:
aws ec2 start-instances --instance-ids i-092650a237d966551
# Wait, get new IP, then:
ssh -i ~/.ssh/aaronl-aws.pem ec2-user@<NEW_IP> 'hostname; rpm -q heimdall-server 2>/dev/null || echo "not installed"'

# saf-packaging repo
cd /Users/alippold/github/mitre/saf-packaging && git log --oneline -5 && git status --short

# Resume test: rsync, rebuild, clean install, setup with hostname
rsync -az -e "ssh -i ~/.ssh/aaronl-aws.pem" /Users/alippold/github/mitre/saf-packaging/ ec2-user@<IP>:~/saf-packaging/
ssh -i ~/.ssh/aaronl-aws.pem ec2-user@<IP> 'tmux new-session -d -s build "cd ~/saf-packaging/heimdall-server && sudo bash setup-rpm-build-env.sh --skip-deps --skip-update --build 2>&1 | tee /tmp/build.log"'
# After build:
ssh -i ~/.ssh/aaronl-aws.pem ec2-user@<IP> 'sudo dnf install -y --disablerepo=heimdall-server --disablerepo="mitre*" /root/rpmbuild/RPMS/x86_64/heimdall-server-*.rpm && sudo heimdall-server-setup --external-url https://ip-172-31-47-186.ec2.internal'
```

## User Preferences / Friction Points
- VPN causes TLS inspection issues on VMs — turn off VPN before building
- User gets frustrated when builds appear stuck — always explain what's happening
- User expects thorough review before committing — agent reviews are valued
- User wants community best practices followed — research first, then implement
- Don't jump ahead — read and understand existing code before modifying
- Use tmux for long builds so user can watch
- EC2 instance stops randomly — always check state before SSH
- Stop (not terminate) EC2 when done
- User values enterprise deployment support (LB, BYO cert, existing proxy patterns)
