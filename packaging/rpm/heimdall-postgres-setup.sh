#!/bin/bash
set -euo pipefail

ENV_FILE="/etc/heimdall-server/backend.env"

usage() {
  echo "Usage: $0" >&2
}

if [[ $# -gt 0 ]]; then
  case "$1" in
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

if [[ -z "${DATABASE_USERNAME}" ]]; then
  echo "DATABASE_USERNAME is required." >&2
  exit 1
fi

if [[ "${DATABASE_HOST}" != "127.0.0.1" && "${DATABASE_HOST}" != "localhost" ]]; then
  echo "DATABASE_HOST=${DATABASE_HOST}; skipping local PostgreSQL bootstrap." >&2
  exit 0
fi

PSQL_BIN=""
PG_SETUP_BIN=""
PG_SERVICE=""
PG_DATA_DIR=""

if [[ -x /usr/pgsql-18/bin/psql ]]; then
  PSQL_BIN="/usr/pgsql-18/bin/psql"
  PG_SETUP_BIN="/usr/pgsql-18/bin/postgresql-18-setup"
  PG_SERVICE="postgresql-18"
  PG_DATA_DIR="/var/lib/pgsql/18/data"
elif command -v psql >/dev/null 2>&1; then
  PSQL_BIN="$(command -v psql)"
  PG_SETUP_BIN="$(command -v postgresql-setup || true)"
  PG_SERVICE="postgresql"
  PG_DATA_DIR="/var/lib/pgsql/data"
else
  echo "psql not found. Install PostgreSQL client/server before installing heimdall-server." >&2
  exit 1
fi

PG_MAJOR="$("${PSQL_BIN}" --version | awk '{print $3}' | cut -d. -f1)"
if [[ ! "${PG_MAJOR}" =~ ^[0-9]+$ ]]; then
  echo "Unable to determine PostgreSQL major version from: $("${PSQL_BIN}" --version)" >&2
  exit 1
fi

if [[ "${PG_MAJOR}" -le 10 ]]; then
  echo "PostgreSQL version must be > 10 (detected: ${PG_MAJOR})." >&2
  exit 1
fi

if [[ ! -f "${PG_DATA_DIR}/PG_VERSION" ]]; then
  if [[ -x "${PG_SETUP_BIN}" ]]; then
    if [[ "${PG_SERVICE}" == "postgresql-18" ]]; then
      "${PG_SETUP_BIN}" initdb
    else
      "${PG_SETUP_BIN}" --initdb || "${PG_SETUP_BIN}" --initdb --unit "${PG_SERVICE}"
    fi
  else
    echo "Unable to initialize PostgreSQL cluster: setup utility not found." >&2
    exit 1
  fi
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl enable "${PG_SERVICE}" >/dev/null 2>&1 || true
  systemctl start "${PG_SERVICE}" >/dev/null 2>&1 || true
fi

runuser -u postgres -- "${PSQL_BIN}" -v ON_ERROR_STOP=1 -d postgres \
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
  runuser -u postgres -- "${PSQL_BIN}" -tA -v ON_ERROR_STOP=1 -d postgres \
    -v db_user="${DATABASE_USERNAME}" <<'SQL' | tr -d '[:space:]'
SELECT rolpassword FROM pg_authid WHERE rolname = :'db_user';
SQL
)"

if [[ "${PASSWORD_FORMAT}" != SCRAM-SHA-256* ]]; then
  echo "Database role password is not stored as SCRAM-SHA-256." >&2
  echo "Current rolpassword prefix: ${PASSWORD_FORMAT:0:12}" >&2
  echo "Check PostgreSQL password_encryption and recreate/alter the role password." >&2
  exit 1
fi

PGPASSWORD="${DATABASE_PASSWORD}" "${PSQL_BIN}" \
  "postgresql://${DATABASE_USERNAME}@127.0.0.1:${DATABASE_PORT}/postgres" \
  -c "select 1;" >/dev/null
