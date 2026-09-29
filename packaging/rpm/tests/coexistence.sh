#!/bin/bash
# This scenario intentionally installs administrator-owned system services.
set -euo pipefail
[[ -e /.dockerenv && ${HEIMDALL_RPM_TEST:-} == 1 && $EUID == 0 ]] || exit 64
export RPM_TEST_COEXIST=1 RPM_TEST_DB_HOST=127.0.0.1 RPM_TEST_DB_PORT=5432
export RPM_TEST_DB_USER=heimdall_external RPM_TEST_DB_PASSWORD=Rpm-External-Fixture-2026
export RPM_TEST_DB_NAME=heimdall-server-production RPM_TEST_PROXY_CA=/etc/nginx/rpm-fixture.crt
export RPM_TEST_PROXY_ADDRESS=127.0.0.1
fingerprint() {
  systemctl show -p MainPID --value postgresql nginx
  sha256sum /var/lib/pgsql/data/postgresql.conf /var/lib/pgsql/data/pg_hba.conf /etc/nginx/nginx.conf
}
case ${1:-} in
  prepare)
    dnf module reset -y postgresql
    dnf module enable -y postgresql:13
    dnf install -y postgresql-server nginx
    postgresql-setup --initdb
    cat >> /var/lib/pgsql/data/postgresql.conf <<'PG'
listen_addresses = '127.0.0.1'
port = 5432
password_encryption = 'scram-sha-256'
PG
    sed -i 's/ident$/scram-sha-256/' /var/lib/pgsql/data/pg_hba.conf
    systemctl enable --now postgresql
    runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c \
      "CREATE ROLE heimdall_external LOGIN PASSWORD 'Rpm-External-Fixture-2026'"
    runuser -u postgres -- createdb -O heimdall_external heimdall-server-production
    openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
      -keyout /etc/nginx/rpm-fixture.key -out /etc/nginx/rpm-fixture.crt \
      -subj /CN=heimdall.example.test -addext subjectAltName=DNS:heimdall.example.test
    cat > /etc/nginx/nginx.conf <<'NGINX'
events {}
http {
  server {
    listen 443 ssl;
    server_name heimdall.example.test;
    ssl_certificate /etc/nginx/rpm-fixture.crt;
    ssl_certificate_key /etc/nginx/rpm-fixture.key;
    location / {
      proxy_pass http://127.0.0.1:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-Proto https;
    }
  }
}
NGINX
    systemctl enable --now nginx
    fingerprint > /tmp/rpm-system-before
    ;;
  verify)
    bash /tmp/rpm-tests/topology.sh external external
    fingerprint > /tmp/rpm-system-after
    cmp /tmp/rpm-system-before /tmp/rpm-system-after
    # An occupied port must be reported without taking its system owner down.
    if heimdall-cli setup --non-interactive --proxy-mode bundled --tls-mode internal \
      > /tmp/rpm-occupied443.log 2>&1; then
      echo 'Bundled Caddy unexpectedly accepted occupied port 443.' >&2
      exit 1
    fi
    cat /tmp/rpm-occupied443.log
    grep -Eq '443|in use|already.*listen|bind' /tmp/rpm-occupied443.log
    systemctl is-active --quiet nginx postgresql
    fingerprint > /tmp/rpm-system-after
    cmp /tmp/rpm-system-before /tmp/rpm-system-after
    # The fixture administrator moves its own proxy, then freezes its fingerprints.
    sed -i 's/listen 443 ssl/listen 8443 ssl/' /etc/nginx/nginx.conf
    systemctl restart nginx
    fingerprint > /tmp/rpm-system-before
    heimdall-cli setup --non-interactive --database-mode bundled --proxy-mode bundled \
      --db-host 127.0.0.1 --db-port 55432 --db-user heimdall \
      --db-password Rpm-Bundled-Fixture-2026 --tls-mode internal \
      --external-url https://heimdall.example.test
    for unit in postgresql nginx heimdall-postgresql heimdall-caddy heimdall-server; do
      systemctl is-active --quiet "$unit"
    done
    runtime=/usr/libexec/heimdall-server/runtime
    source /etc/heimdall-server/backend.env
    private_query=(env PGPASSWORD="$DATABASE_PASSWORD" "$runtime/postgresql/bin/psql"
      -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USERNAME" -v ON_ERROR_STOP=1 -At
      -d "$DATABASE_NAME")
    "${private_query[@]}" -c 'CREATE TABLE rpm_coexist_sentinel(id integer); INSERT INTO rpm_coexist_sentinel VALUES (42)'
    mapfile -t roots < <(find /var/lib/heimdall-caddy -name root.crt -type f)
    [[ ${#roots[@]} == 1 ]]
    sha256sum "${roots[0]}" > /tmp/rpm-coexist-ca.sha256
    curl --fail --silent --show-error --retry 30 --retry-connrefused --retry-delay 1 \
      --retry-max-time 60 --max-time 5 --noproxy '*' --cacert "${roots[0]}" \
      --resolve heimdall.example.test:443:127.0.0.1 https://heimdall.example.test/health/ready
    # Each replacement is validated before the owned service is stopped.
    heimdall-cli setup --non-interactive --database-mode external --proxy-mode external \
      --db-host 127.0.0.1 --db-port 5432 --db-user "$RPM_TEST_DB_USER" \
      --db-password "$RPM_TEST_DB_PASSWORD" --db-name "$RPM_TEST_DB_NAME" \
      --external-url https://heimdall.example.test:8443
    if systemctl is-active --quiet heimdall-postgresql; then exit 1; fi
    if systemctl is-active --quiet heimdall-caddy; then exit 1; fi
    test -s /var/lib/heimdall-postgresql/18/data/PG_VERSION
    sha256sum --check /tmp/rpm-coexist-ca.sha256
    curl --fail --silent --show-error --retry 30 --retry-connrefused --retry-delay 1 \
      --retry-max-time 60 --max-time 5 --noproxy '*' --cacert "$RPM_TEST_PROXY_CA" \
      --resolve heimdall.example.test:8443:127.0.0.1 https://heimdall.example.test:8443/health/ready
    heimdall-cli setup --non-interactive --database-mode bundled --proxy-mode bundled \
      --db-host 127.0.0.1 --db-port 55432 --db-user heimdall \
      --db-password Rpm-Bundled-Fixture-2026 --tls-mode internal \
      --external-url https://heimdall.example.test
    [[ $("${private_query[@]}" -c 'SELECT id FROM rpm_coexist_sentinel') == 42 ]]
    sha256sum --check /tmp/rpm-coexist-ca.sha256
    fingerprint > /tmp/rpm-system-after
    cmp /tmp/rpm-system-before /tmp/rpm-system-after
    dnf remove -y --noautoremove heimdall-server
    systemctl is-active --quiet postgresql nginx
    fingerprint > /tmp/rpm-system-after
    cmp /tmp/rpm-system-before /tmp/rpm-system-after
    ;;
  *) exit 64 ;;
esac
