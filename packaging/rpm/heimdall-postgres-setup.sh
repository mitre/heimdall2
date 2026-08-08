#!/bin/bash
set -euo pipefail

ENV_FILE="/etc/heimdall-server/backend.env"

usage() {
  echo "Usage: $0" >&2
}

if [[ $# -gt 0 ]]; then
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    usage
    exit 0
  fi
  echo "Unknown option: $1" >&2
  usage
  exit 64
fi

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  if ! source "${ENV_FILE}"; then
    set +a
    echo "Failed to parse ${ENV_FILE}" >&2
    exit 1
  fi
  set +a
fi

DATABASE_HOST="${DATABASE_HOST:-localhost}"
DATABASE_PORT="${DATABASE_PORT:-5432}"
DATABASE_USERNAME="${DATABASE_USERNAME:-postgres}"
DATABASE_PASSWORD="${DATABASE_PASSWORD:-}"

if [[ -z "${DATABASE_USERNAME//[[:space:]]/}" ]]; then
  echo "DATABASE_USERNAME is required." >&2
  exit 1
fi

if [[ -z "${DATABASE_PASSWORD//[[:space:]]/}" ]]; then
  echo "DATABASE_PASSWORD is required." >&2
  echo "Run: sudo heimdall-server-setup" >&2
  exit 1
fi

if [[ "${DATABASE_HOST}" != "127.0.0.1" && "${DATABASE_HOST}" != "localhost" ]]; then
  echo "DATABASE_HOST=${DATABASE_HOST}; skipping local PostgreSQL bootstrap."
  exit 0
fi

# Detect PGDG installations (18 down to 13), then fall back to system psql.
PSQL_BIN=""
PG_SETUP_BIN=""
PG_SERVICE=""
PG_DATA_DIR=""

for ver in 18 17 16 15 14 13; do
  if [[ -x "/usr/pgsql-${ver}/bin/psql" ]]; then
    PSQL_BIN="/usr/pgsql-${ver}/bin/psql"
    PG_SETUP_BIN="/usr/pgsql-${ver}/bin/postgresql-${ver}-setup"
    PG_SERVICE="postgresql-${ver}"
    PG_DATA_DIR="/var/lib/pgsql/${ver}/data"
    break
  fi
done

if [[ -z "${PSQL_BIN}" ]]; then
  if command -v psql >/dev/null 2>&1; then
    PSQL_BIN="$(command -v psql)"
    PG_SETUP_BIN="$(command -v postgresql-setup || true)"
    PG_SERVICE="postgresql"
    PG_DATA_DIR="/var/lib/pgsql/data"
  else
    echo "psql not found. Install a PostgreSQL client/server (13+) before running setup." >&2
    exit 1
  fi
fi

PG_MAJOR="$("${PSQL_BIN}" --version | awk '{print $3}' | cut -d. -f1)"
if [[ ! "${PG_MAJOR}" =~ ^[0-9]+$ ]]; then
  echo "Unable to determine PostgreSQL major version from: $("${PSQL_BIN}" --version)" >&2
  exit 1
fi

if [[ "${PG_MAJOR}" -lt 13 ]]; then
  echo "PostgreSQL >= 13 is required (detected: ${PG_MAJOR})." >&2
  exit 1
fi

echo "Detected PostgreSQL ${PG_MAJOR} (${PSQL_BIN})"

if [[ ! -f "${PG_DATA_DIR}/PG_VERSION" ]]; then
  echo "Initializing PostgreSQL data directory..."
  if [[ -x "${PG_SETUP_BIN}" ]]; then
    if [[ "${PG_SERVICE}" == postgresql-* ]]; then
      "${PG_SETUP_BIN}" initdb
    else
      "${PG_SETUP_BIN}" --initdb || "${PG_SETUP_BIN}" --initdb --unit "${PG_SERVICE}"
    fi
  else
    echo "Unable to initialize PostgreSQL cluster: setup utility not found." >&2
    exit 1
  fi
fi

# Harden pg_hba.conf: use scram-sha-256 for TCP connections from localhost.
# Sequelize needs to connect to both the 'postgres' database (for db:create)
# and the application database. We allow the configured user to connect to
# any database via password auth over TCP. The default 'peer' rule for local
# Unix socket connections (used by runuser -u postgres) is preserved.
PG_HBA="${PG_DATA_DIR}/pg_hba.conf"
if [[ -f "${PG_HBA}" ]]; then
  if ! grep -q "# Heimdall" "${PG_HBA}" 2>/dev/null; then
    sed -i '/^# TYPE/a # Heimdall: password authentication for TCP connections from localhost\nhost    all    '"${DATABASE_USERNAME}"'    127.0.0.1/32    scram-sha-256\nhost    all    '"${DATABASE_USERNAME}"'    ::1/128         scram-sha-256' "${PG_HBA}"
    echo "  pg_hba.conf: scram-sha-256 for ${DATABASE_USERNAME} TCP connections"
  fi
fi

# Ensure scram-sha-256 is the default password encryption
PG_CONF="${PG_DATA_DIR}/postgresql.conf"
if [[ -f "${PG_CONF}" ]]; then
  if ! grep -q "^password_encryption = scram-sha-256" "${PG_CONF}" 2>/dev/null; then
    echo "password_encryption = scram-sha-256" >> "${PG_CONF}"
    echo "  postgresql.conf: password_encryption = scram-sha-256"
  fi
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl enable "${PG_SERVICE}" >/dev/null 2>&1 || true
  systemctl start "${PG_SERVICE}" >/dev/null 2>&1 || true
fi

run_psql_as_postgres() {
  runuser -u postgres -- "${PSQL_BIN}" -v ON_ERROR_STOP=1 -d postgres "$@"
}

echo "Configuring database role '${DATABASE_USERNAME}'..."

run_psql_as_postgres \
  -v db_user="${DATABASE_USERNAME}" \
  -v db_pass="${DATABASE_PASSWORD}" <<'SQL'
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
SELECT pg_reload_conf();

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_pass')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_user') \gexec
SELECT format('ALTER ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_pass') \gexec
SELECT format('ALTER ROLE %I CREATEDB', :'db_user') \gexec
SQL

PASSWORD_FORMAT="$(
  run_psql_as_postgres -tA -v db_user="${DATABASE_USERNAME}" <<'SQL' | tr -d '[:space:]'
SELECT rolpassword FROM pg_authid WHERE rolname = :'db_user';
SQL
)"

if [[ "${PASSWORD_FORMAT}" != SCRAM-SHA-256* ]]; then
  echo "Database role password is not stored as SCRAM-SHA-256." >&2
  echo "Current rolpassword prefix: ${PASSWORD_FORMAT:0:12}" >&2
  echo "Check PostgreSQL password_encryption and recreate/alter the role password." >&2
  exit 1
fi

# Verify password-based login works via the scram-sha-256 pg_hba rule.
# We connect to the heimdall database (which has the scram entry), creating
# it first if it doesn't exist.
run_psql_as_postgres -v db_name="${DATABASE_NAME:-heimdall-server-production}" <<'SQL'
SELECT format('CREATE DATABASE %I', :'db_name')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') \gexec
SQL

PGPASSWORD="${DATABASE_PASSWORD}" "${PSQL_BIN}" \
  "postgresql://${DATABASE_USERNAME}@127.0.0.1:${DATABASE_PORT}/${DATABASE_NAME:-heimdall-server-production}" \
  -c "SELECT 1;" >/dev/null

echo "PostgreSQL bootstrap complete."
