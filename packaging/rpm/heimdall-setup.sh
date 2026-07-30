#!/bin/bash
set -euo pipefail

CONFIGURE_BIN="/usr/libexec/heimdall-server/configure.sh"
POSTGRES_SETUP_BIN="/usr/libexec/heimdall-server/postgres-setup.sh"
DB_SETUP_BIN="/usr/bin/heimdall-server-db-setup"
SERVICE_NAME="heimdall-server.service"
ENV_FILE="/etc/heimdall-server/backend.env"
CERT_DIR="/etc/pki/heimdall-server"
CADDYFILE_SRC="/usr/libexec/heimdall-server/heimdall-Caddyfile"
CADDYFILE_DST="/etc/caddy/Caddyfile.d/heimdall-server.caddy"

usage() {
  cat >&2 <<'EOF'
Usage: heimdall-server-setup [OPTIONS]

Complete Heimdall server post-install setup: generate configuration,
bootstrap PostgreSQL (if local), run database migrations, configure TLS
reverse proxy, apply security policies, and start the service.

Options:
  --interactive       Prompt for configuration values (default when TTY).
  --non-interactive   Accept defaults and auto-generate all secrets.
  --external-url URL  Set the public URL (e.g., https://heimdall.example.com).
  --tls-cert PATH     Path to TLS certificate (PEM). Used with Caddy BYO cert.
  --tls-key PATH      Path to TLS private key (PEM). Used with Caddy BYO cert.
  --reconfigure       Re-run only the configuration step.
  --skip-db           Skip PostgreSQL bootstrap and database migrations.
  --skip-tls          Skip TLS reverse proxy setup (use when behind a load
                      balancer or existing reverse proxy).
  -h, --help          Show this help.

Deployment patterns:
  Direct install (Caddy handles TLS):
    sudo heimdall-server-setup --external-url https://heimdall.example.com

  Behind a load balancer (LB terminates TLS):
    sudo heimdall-server-setup --external-url https://heimdall.example.com --skip-tls

  Corporate PKI certificates:
    sudo heimdall-server-setup --external-url https://heimdall.example.com \
      --tls-cert /etc/pki/tls/certs/heimdall.pem \
      --tls-key /etc/pki/tls/private/heimdall.key

  Air-gapped (IP only, self-signed):
    sudo heimdall-server-setup --external-url https://10.0.1.50
EOF
}

SETUP_MODE="auto"
RECONFIGURE_ONLY=0
SKIP_DB=0
SKIP_TLS=0
EXTERNAL_URL_FLAG=""
TLS_CERT=""
TLS_KEY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --interactive)
      SETUP_MODE="interactive"
      shift
      ;;
    --non-interactive)
      SETUP_MODE="non-interactive"
      shift
      ;;
    --reconfigure)
      RECONFIGURE_ONLY=1
      shift
      ;;
    --skip-db)
      SKIP_DB=1
      shift
      ;;
    --skip-tls)
      SKIP_TLS=1
      shift
      ;;
    --external-url)
      if [[ $# -lt 2 ]]; then echo "--external-url requires a URL" >&2; exit 64; fi
      EXTERNAL_URL_FLAG="$2"
      shift 2
      ;;
    --tls-cert)
      if [[ $# -lt 2 ]]; then echo "--tls-cert requires a path" >&2; exit 64; fi
      TLS_CERT="$2"
      shift 2
      ;;
    --tls-key)
      if [[ $# -lt 2 ]]; then echo "--tls-key requires a path" >&2; exit 64; fi
      TLS_KEY="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 64
      ;;
  esac
done

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root (use sudo)." >&2
  exit 1
fi

# Validate --tls-cert and --tls-key (must be provided together, ignored with --skip-tls)
if [[ "${SKIP_TLS}" -eq 0 && ( -n "${TLS_CERT}" || -n "${TLS_KEY}" ) ]]; then
  if [[ -z "${TLS_CERT}" || -z "${TLS_KEY}" ]]; then
    echo "--tls-cert and --tls-key must be provided together." >&2
    exit 64
  fi
  if [[ ! -f "${TLS_CERT}" ]]; then
    echo "TLS certificate not found: ${TLS_CERT}" >&2
    exit 1
  fi
  if [[ ! -f "${TLS_KEY}" ]]; then
    echo "TLS key not found: ${TLS_KEY}" >&2
    exit 1
  fi
fi

# Determine configure mode.
CONFIGURE_FLAG=""
case "${SETUP_MODE}" in
  interactive)
    CONFIGURE_FLAG="--interactive"
    ;;
  non-interactive)
    CONFIGURE_FLAG="--non-interactive"
    ;;
  auto)
    # Default to interactive when a TTY is available.
    if [[ -t 0 || -t 1 ]]; then
      CONFIGURE_FLAG="--interactive"
    else
      CONFIGURE_FLAG="--non-interactive"
    fi
    ;;
esac

echo "=== Step 1/6: Configuration ==="
CONFIGURE_ARGS=("${CONFIGURE_FLAG}")
if [[ -n "${EXTERNAL_URL_FLAG}" ]]; then
  CONFIGURE_ARGS+=("--external-url" "${EXTERNAL_URL_FLAG}")
fi
"${CONFIGURE_BIN}" "${CONFIGURE_ARGS[@]}"

if [[ "${RECONFIGURE_ONLY}" -eq 1 ]]; then
  echo ""
  echo "Reconfiguration complete. Restart the service to apply changes:"
  echo "  sudo systemctl restart ${SERVICE_NAME}"
  exit 0
fi

if [[ "${SKIP_DB}" -eq 0 ]]; then
  echo ""
  echo "=== Step 2/6: PostgreSQL bootstrap ==="
  "${POSTGRES_SETUP_BIN}"

  echo ""
  echo "=== Step 3/6: Database migrations ==="
  "${DB_SETUP_BIN}"
else
  echo ""
  echo "=== Steps 2-3 skipped (--skip-db) ==="
fi

PORT="$(grep -oP '^PORT=\K[0-9]+' "${ENV_FILE}" 2>/dev/null || echo 3000)"

# -----------------------------------------------------------------------
# Cloud environment detection — advisory messages for external firewall
# -----------------------------------------------------------------------
detect_cloud() {
  # EC2
  if curl -sf -m 2 http://169.254.169.254/latest/meta-data/instance-id >/dev/null 2>&1; then
    echo "ec2"
    return
  fi
  # Azure
  if curl -sf -m 2 -H "Metadata:true" "http://169.254.169.254/metadata/instance?api-version=2021-02-01" >/dev/null 2>&1; then
    echo "azure"
    return
  fi
  # GCP
  if curl -sf -m 2 -H "Metadata-Flavor: Google" http://metadata.google.internal/ >/dev/null 2>&1; then
    echo "gcp"
    return
  fi
  echo "bare-metal"
}

print_cloud_hint() {
  local cloud="$1"
  case "${cloud}" in
    ec2)
      echo ""
      echo "  NOTE: Detected AWS EC2 instance."
      echo "  Ensure your Security Group allows inbound HTTPS (TCP 443)."
      echo "  Example: aws ec2 authorize-security-group-ingress --group-id <sg-id> --protocol tcp --port 443 --cidr 0.0.0.0/0"
      ;;
    azure)
      echo ""
      echo "  NOTE: Detected Azure VM."
      echo "  Ensure your Network Security Group (NSG) allows inbound HTTPS (TCP 443)."
      ;;
    gcp)
      echo ""
      echo "  NOTE: Detected GCP VM."
      echo "  Ensure your VPC firewall rule allows inbound HTTPS (TCP 443)."
      echo "  Example: gcloud compute firewall-rules create allow-heimdall-https --allow tcp:443"
      ;;
  esac
}

# -----------------------------------------------------------------------
# Step 4/6: TLS reverse proxy (Caddy)
# -----------------------------------------------------------------------
if [[ "${SKIP_TLS}" -eq 0 ]]; then
  echo ""
  echo "=== Step 4/6: TLS reverse proxy ==="

  if command -v caddy >/dev/null 2>&1; then
    # Determine hostname for EXTERNAL_URL
    HOSTNAME_GUESS="$(hostname -f 2>/dev/null || hostname)"
    EXTERNAL_URL="$(grep -oP '^EXTERNAL_URL=\K.*' "${ENV_FILE}" 2>/dev/null | tr -d '"' || true)"

    if [[ -z "${EXTERNAL_URL}" ]]; then
      EXTERNAL_URL="https://${HOSTNAME_GUESS}"
      # Update EXTERNAL_URL in env file (configure.sh already wrote the key)
      sed -i "s|^EXTERNAL_URL=.*|EXTERNAL_URL=\"${EXTERNAL_URL}\"|" "${ENV_FILE}"
      echo "  Set EXTERNAL_URL=${EXTERNAL_URL}"
    fi

    # Install Caddyfile
    if [[ -f "${CADDYFILE_SRC}" ]]; then
      mkdir -p "$(dirname "${CADDYFILE_DST}")"
      cp -f "${CADDYFILE_SRC}" "${CADDYFILE_DST}"

      # Determine TLS strategy based on flags and hostname type
      EXTERNAL_HOST="$(echo "${EXTERNAL_URL}" | sed 's|https\?://||; s|:.*||; s|/.*||')"

      # Validate hostname to prevent sed/openssl injection
      if [[ ! "${EXTERNAL_HOST}" =~ ^[a-zA-Z0-9][a-zA-Z0-9.\-]*[a-zA-Z0-9]$ ]] && \
         [[ ! "${EXTERNAL_HOST}" =~ ^[a-zA-Z0-9]$ ]]; then
        echo "Error: invalid hostname '${EXTERNAL_HOST}' — contains unsafe characters" >&2
        exit 1
      fi

      if [[ -n "${TLS_CERT}" && -n "${TLS_KEY}" ]]; then
        # BYO certificate from corporate PKI
        sed -i "s|^:443 {|${EXTERNAL_HOST} {|" "${CADDYFILE_DST}"
        sed -i "/reverse_proxy/i\\\\ttls ${TLS_CERT} ${TLS_KEY}" "${CADDYFILE_DST}"
        echo "  Caddy: configured with provided certificate"
        echo "    Cert: ${TLS_CERT}"
        echo "    Key:  ${TLS_KEY}"
      elif [[ -n "${EXTERNAL_HOST}" && ! "${EXTERNAL_HOST}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        # Real hostname — determine if public or private
        #
        # Private hostnames need explicit "tls internal" — Caddy does NOT
        # auto-detect these and will fail trying Let's Encrypt ACME instead.
        # Patterns: .internal, .local, .lan, .localdomain, .home.arpa,
        #           .corp, .private, .test, single-label (no dots)
        if [[ "${EXTERNAL_HOST}" =~ \.(internal|local|lan|localdomain|home\.arpa|corp|private|test)$ ]] || \
           [[ ! "${EXTERNAL_HOST}" =~ \. ]]; then
          # Keep :443 (accepts any hostname/IP) — private hostnames aren't
          # resolvable from outside, so Caddy must accept all connections.
          sed -i "/reverse_proxy/i\\\\ttls internal" "${CADDYFILE_DST}"
          echo "  Caddy: private hostname detected — using internal CA"
          echo "    Import root CA into browsers to avoid warnings:"
          echo "    /var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt"
          echo ""
          echo "    For IP-based access, add to client /etc/hosts:"
          echo "    <server-ip>  ${EXTERNAL_HOST}"
          echo ""
          echo "    Or re-run with IP: sudo heimdall-server-setup --external-url https://<server-ip>"
        else
          # Public hostname — Caddy uses Let's Encrypt ACME automatically.
          # Replace :443 with hostname so Caddy gets the right cert.
          sed -i "s|^:443 {|${EXTERNAL_HOST} {|" "${CADDYFILE_DST}"
          echo "  Caddy: public hostname — automatic Let's Encrypt certificate"
        fi
      else
        # IP-based — Caddy can't issue certs for bare IPs.
        # Generate a self-signed cert with the IP as SAN.
        mkdir -p "${CERT_DIR}"
        if [[ ! -f "${CERT_DIR}/server.crt" ]]; then
          openssl req -x509 -nodes -days 365 \
            -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
            -keyout "${CERT_DIR}/server.key" \
            -out "${CERT_DIR}/server.crt" \
            -subj "/CN=${EXTERNAL_HOST}" \
            -addext "subjectAltName=IP:${EXTERNAL_HOST},DNS:localhost" \
            2>/dev/null
          chmod 640 "${CERT_DIR}/server.key"
          chown root:caddy "${CERT_DIR}/server.key" 2>/dev/null || true
          echo "  Generated self-signed cert for ${EXTERNAL_HOST}"
        fi
        sed -i "/reverse_proxy/i\\\\ttls ${CERT_DIR}/server.crt ${CERT_DIR}/server.key" "${CADDYFILE_DST}"
        echo "  Caddy: configured with self-signed cert (IP-based deployment)"
      fi

      # Detect and warn about existing reverse proxies on 443
      if command -v ss >/dev/null 2>&1; then
        existing_443="$(ss -tlnp 2>/dev/null | grep ':443 ' | grep -v caddy || true)"
        if [[ -n "${existing_443}" ]]; then
          echo ""
          echo "  WARNING: Another process is already listening on port 443:"
          echo "  ${existing_443}"
          echo "  Caddy may fail to start. Stop the other service first."
        fi
      fi

      # Ensure main Caddyfile imports our config
      CADDY_MAIN="/etc/caddy/Caddyfile"
      if [[ -f "${CADDY_MAIN}" ]] && ! grep -q "import /etc/caddy/Caddyfile.d/" "${CADDY_MAIN}" 2>/dev/null; then
        echo "import /etc/caddy/Caddyfile.d/*.caddy" >> "${CADDY_MAIN}"
      fi

      # Enable and start Caddy
      systemctl enable --now caddy 2>/dev/null || true
      systemctl reload caddy 2>/dev/null || true
      echo "  Caddy: enabled and running"
      echo "  Caddy internal CA root: /var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt"
    fi

    # SELinux: allow Caddy (httpd_t) to proxy to Heimdall backend
    if command -v setsebool >/dev/null 2>&1; then
      setsebool -P httpd_can_network_connect on 2>/dev/null || true
      echo "  SELinux: httpd_can_network_connect enabled (Caddy → backend proxy)"
    fi
  else
    echo "  Caddy not installed — skipping TLS proxy setup."
    if [[ -n "${TLS_CERT}" ]]; then
      echo "  WARNING: --tls-cert and --tls-key were provided but Caddy is not installed."
      echo "  Install Caddy first, then re-run setup."
    fi
    echo ""
    # Offer to install EPEL + Caddy
    if command -v dnf >/dev/null 2>&1; then
      # Detect OS: Fedora doesn't need EPEL, RHEL/derivatives do
      if grep -qi fedora /etc/os-release 2>/dev/null; then
        echo "  Install Caddy with: sudo dnf install -y caddy"
      elif rpm -q epel-release >/dev/null 2>&1; then
        echo "  Install Caddy with: sudo dnf install -y caddy"
      else
        # Detect EL major version from os-release (more reliable than rpm -E)
        el_ver="$(. /etc/os-release 2>/dev/null && echo "${VERSION_ID%%.*}")"
        el_ver="${el_ver:-9}"
        echo "  EPEL repository not found. Install EPEL and Caddy with:"
        echo "    sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-${el_ver}.noarch.rpm"
        echo "    sudo dnf install -y caddy"
      fi
    fi
    echo "  Then re-run: sudo heimdall-server-setup --skip-db"
    echo ""
    echo "  Alternatively, configure nginx or another reverse proxy manually."
    echo "  The app listens on http://127.0.0.1:${PORT}"
  fi
else
  echo ""
  echo "=== Step 4/6 skipped (--skip-tls) ==="
fi

echo ""
echo "=== Step 5/6: Security policies ==="

# --- SELinux ---
# The policy module is loaded by RPM %post. Here we ensure the port is
# registered and file contexts are applied. Safe to run even when SELinux
# is disabled — semanage/restorecon just no-op.
if command -v semanage >/dev/null 2>&1; then
  # Register the app port (3000 for direct, or custom)
  semanage port -a -t heimdall_server_port_t -p tcp 3000 2>/dev/null || \
    semanage port -m -t heimdall_server_port_t -p tcp 3000 2>/dev/null || true
  if [[ "${PORT}" != "3000" ]]; then
    semanage port -a -t heimdall_server_port_t -p tcp "${PORT}" 2>/dev/null || \
      semanage port -m -t heimdall_server_port_t -p tcp "${PORT}" 2>/dev/null || true
    echo "  SELinux: registered port ${PORT}"
  else
    echo "  SELinux: port 3000 registered"
  fi

  # Allow reverse proxy (httpd_t) to connect to backend
  if command -v setsebool >/dev/null 2>&1; then
    setsebool -P httpd_can_network_connect on 2>/dev/null || true
    echo "  SELinux: httpd_can_network_connect enabled"
  fi
fi
if command -v restorecon >/dev/null 2>&1; then
  restorecon -R /usr/share/heimdall-server/ \
                /etc/heimdall-server/ \
                /var/lib/heimdall-server/ 2>/dev/null || true
  echo "  SELinux: file contexts applied"
fi

# --- fapolicyd ---
FAPOLICYD_SCRIPT="/usr/libexec/heimdall-server/fapolicyd-trust.sh"
if command -v fapolicyd-cli >/dev/null 2>&1 && [[ -x "${FAPOLICYD_SCRIPT}" ]]; then
  "${FAPOLICYD_SCRIPT}" add 2>/dev/null || true
  echo "  fapolicyd: bundled binaries trusted"
else
  echo "  fapolicyd: not installed (skipped)"
fi

# --- firewalld ---
if command -v firewall-cmd >/dev/null 2>&1; then
  if systemctl is-active --quiet firewalld 2>/dev/null; then
    if [[ "${SKIP_TLS}" -eq 0 ]]; then
      # Caddy handles TLS — open HTTPS (443), backend stays on localhost
      firewall-cmd --permanent --add-service=https 2>/dev/null || true
      echo "  firewalld: HTTPS (443) enabled"
    else
      # No local TLS proxy — open the app port for LB health checks / direct access
      firewall-cmd --permanent --add-port="${PORT}/tcp" 2>/dev/null || true
      echo "  firewalld: port ${PORT}/tcp enabled (no local TLS proxy)"
    fi
    firewall-cmd --reload 2>/dev/null || true
  else
    echo "  firewalld: not running (skipped)"
  fi
else
  echo "  firewalld: not installed (skipped)"
fi

# --- File permission hardening (STIG/CIS) ---
echo "  Applying STIG/CIS file permissions..."

# Config files: root:heimdall, no world access
chmod 0640 "${ENV_FILE}"
chown root:heimdall "${ENV_FILE}"

# Runtime directories
install -d -m 0750 -o heimdall -g heimdall /var/lib/heimdall-server
install -d -m 0700 -o heimdall -g heimdall /var/lib/heimdall-server/backups
install -d -m 0750 -o heimdall -g heimdall /var/log/heimdall-server

# Cert directory (if exists): root:caddy, restricted
if [[ -d "${CERT_DIR}" ]]; then
  chmod 0750 "${CERT_DIR}"
  chmod 0640 "${CERT_DIR}"/*.key 2>/dev/null || true
  chmod 0644 "${CERT_DIR}"/*.crt 2>/dev/null || true
fi

# Helper scripts: root-only write
chmod 0755 "${CONFIGURE_BIN}" "${POSTGRES_SETUP_BIN}" "${DB_SETUP_BIN}"

echo "  File permissions hardened"

echo ""
echo "=== Step 6/6: Starting service ==="
if command -v systemctl >/dev/null 2>&1; then
  systemctl enable --now "${SERVICE_NAME}"
  echo "Service enabled and started."
else
  echo "systemctl not found; start the service manually."
fi

# Detect cloud environment and print helpful hints
CLOUD_ENV="$(detect_cloud)"

EXTERNAL_URL="$(grep -oP '^EXTERNAL_URL=\K.*' "${ENV_FILE}" 2>/dev/null | tr -d '"' || echo "https://$(hostname)")"

echo ""
echo "=========================================="
echo " Heimdall server is running."
echo ""
if [[ "${SKIP_TLS}" -eq 1 ]]; then
  echo " Open: ${EXTERNAL_URL}"
  echo ""
  echo " TLS: handled externally (load balancer / reverse proxy)"
  echo " App listening on: http://0.0.0.0:${PORT}"
elif command -v caddy >/dev/null 2>&1; then
  echo " Open: ${EXTERNAL_URL}"
  echo ""
  echo " TLS: Caddy reverse proxy on port 443"
  if [[ -n "${TLS_CERT}" ]]; then
    echo " Cert: ${TLS_CERT}"
  else
    echo " Caddy CA root (for browser import):"
    echo "   /var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt"
  fi
else
  echo " Open: http://localhost:${PORT}"
  echo ""
  echo " WARNING: No TLS reverse proxy configured."
  echo " Install Caddy for automatic HTTPS:"
  echo "   sudo dnf install --enablerepo=epel caddy"
  echo "   sudo heimdall-server-setup --skip-db"
fi
echo ""
echo " Useful commands:"
echo "   systemctl status  ${SERVICE_NAME}"
echo "   journalctl -u     ${SERVICE_NAME}"
print_cloud_hint "${CLOUD_ENV}"
echo "=========================================="
