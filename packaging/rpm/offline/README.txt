Heimdall offline installation

Obtain this archive and its external SHA-256 digest through a trusted channel.
Verify the archive digest before extracting or executing its installer. Bundled
checksums alone cannot establish the authenticity of an archive or its keys.
Use the archive matching the host distribution ID, EL major and architecture.
The archive includes the DNF/RPM dependency stack to support matching installer
library updates. Use a compatible distribution repository snapshot; compatibility
with arbitrary historical minor releases or third-party packages is not established.

From the extracted directory on the target host:

  sha256sum --check SHA256SUMS
  sudo bash ./install.sh
  sudo heimdall-cli setup --interactive

The installer validates checksums and scoped RPM signatures, disables external
repositories and DNF plugins, and asks before installing dependency updates.
Use sudo bash ./install.sh --assumeyes for unattended package installation.
It does not configure the application. Back up an existing deployment before
upgrading; run setup afterward to apply migrations using saved configuration.

For a fully disconnected deployment, choose bundled database and proxy services
and internal or custom TLS in the interactive setup. A deterministic example is:

  sudo heimdall-cli setup --non-interactive \
    --database-mode bundled --proxy-mode bundled --tls-mode internal \
    --external-url https://heimdall.example.test

Provide local DNS or hosts-file resolution for the chosen hostname. With internal
TLS, distribute the generated public CA certificate to client trust stores:
  /var/lib/heimdall-caddy/data/caddy/pki/authorities/local/root.crt
Keep private keys confidential. Bundled services and internal/custom TLS setup
need no package downloads; default bundled-service configuration needs no package
download either. ACME certificate issuance and external databases/proxies retain
their connectivity requirements. Setup requires a booted systemd host.
