#!/bin/bash
set -euo pipefail

ENV_FILE="/etc/heimdall-server/backend.env"

usage() {
  echo "Usage: $0 [--check-auth]" >&2
  echo "  --check-auth  Only check the configured role's password verifier" >&2
  echo "                (ADR-006 §16 FIPS compatibility) and exit." >&2
}

CHECK_AUTH_ONLY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check-auth)
      CHECK_AUTH_ONLY=1
      shift
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

# Locate a psql client: PGDG installations (18 down to 13) first, then the
# system psql. Prints the path, or nothing when no client exists.
find_psql_binary() {
  local ver
  for ver in 18 17 16 15 14 13; do
    if [[ -x "/usr/pgsql-${ver}/bin/psql" ]]; then
      echo "/usr/pgsql-${ver}/bin/psql"
      return 0
    fi
  done
  command -v psql || true
}

# ADR-006 §16: a FIPS-mode host cannot complete md5 password authentication,
# so a role whose pg_authid verifier is still md5 makes the Heimdall server
# fail to connect the moment FIPS mode is enabled. This check WARNS and prints
# the remediation — it never modifies the database (the remediation rewrites
# credentials; the operator decides).
#
# Three outcomes, all return 0 — detection must never crash the setup:
#   SCRAM verifier  -> silent pass
#   md5 verifier    -> loud warning + the exact §16 remediation sequence
#   no pg_authid access / role absent -> prints the manual superuser check
check_password_verifier() {
  local psql_bin="$1"
  local conninfo="$2"
  local role="$3"
  local row=""
  local verifier=""
  if ! row="$(PGPASSWORD="${DATABASE_PASSWORD}" "${psql_bin}" "${conninfo}" \
    -v ON_ERROR_STOP=1 -tA -v db_user="${role}" 2>&1 <<'SQL'
SELECT rolname, left(rolpassword, 14) FROM pg_authid WHERE rolname = :'db_user';
SQL
  )"; then
    echo "NOTE: could not read pg_authid as role '${role}' (superuser required)."
    echo "      The FIPS password-verifier check was skipped. To check manually,"
    echo "      run as a PostgreSQL superuser:"
    echo "        SELECT rolname, left(rolpassword, 14) FROM pg_authid WHERE rolname = '${role}';"
    echo "      A result starting 'md5' will fail on FIPS-mode hosts; see the"
    echo "      remediation in INSTALL.md (ADR-006 §16)."
    return 0
  fi
  verifier="${row##*|}"
  verifier="${verifier//[[:space:]]/}"
  case "${verifier}" in
    SCRAM-SHA-256*)
      return 0
      ;;
    md5*)
      echo "=============================================================================="
      echo "WARNING: the PostgreSQL password verifier for role '${role}' is MD5."
      echo "A FIPS-mode host cannot complete md5 password authentication, so the"
      echo "Heimdall server will FAIL TO CONNECT to this database once FIPS mode is"
      echo "enabled. Remediation (run as a PostgreSQL superuser; ADR-006 §16):"
      echo ""
      echo "  ALTER SYSTEM SET password_encryption = 'scram-sha-256';"
      echo "  SELECT pg_reload_conf();"
      echo "  ALTER ROLE ${role} WITH PASSWORD '<same or new>';  -- rewrites the verifier"
      echo "  -- then change any md5 rules in pg_hba.conf to scram-sha-256 and reload"
      echo ""
      echo "This setup does NOT modify the database authentication configuration —"
      echo "the ALTER ROLE rewrites stored credentials, so the operator decides."
      echo "=============================================================================="
      return 0
      ;;
    '')
      echo "NOTE: role '${role}' was not found in pg_authid; the FIPS password-"
      echo "      verifier check was skipped (the role may not exist yet)."
      return 0
      ;;
    *)
      echo "NOTE: unrecognized password verifier prefix for role '${role}': ${verifier}"
      echo "      Verify it is SCRAM-SHA-256 before enabling FIPS mode (ADR-006 §16)."
      return 0
      ;;
  esac
}

run_verifier_check_via_tcp() {
  local psql_bin=""
  psql_bin="$(find_psql_binary)"
  if [[ -z "${psql_bin}" ]]; then
    echo "NOTE: psql not found; the FIPS password-verifier check was skipped."
    echo "      Install a PostgreSQL client, or run the manual superuser check"
    echo "      from INSTALL.md (ADR-006 §16)."
    return 0
  fi
  check_password_verifier "${psql_bin}" \
    "postgresql://${DATABASE_USERNAME}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME:-postgres}" \
    "${DATABASE_USERNAME}"
}

if [[ "${CHECK_AUTH_ONLY}" -eq 1 ]]; then
  run_verifier_check_via_tcp
  echo "Password-verifier check complete for role '${DATABASE_USERNAME}' on ${DATABASE_HOST}:${DATABASE_PORT}."
  exit 0
fi

if [[ "${DATABASE_HOST}" != "127.0.0.1" && "${DATABASE_HOST}" != "localhost" ]]; then
  echo "DATABASE_HOST=${DATABASE_HOST}; skipping local PostgreSQL bootstrap."
  # ADR-006 §16: pre-existing remote/customer databases are exactly where an
  # md5 verifier survives unnoticed — check before the app fails to connect.
  run_verifier_check_via_tcp
  exit 0
fi

# Local bootstrap: locate the client plus the version-specific setup paths.
PSQL_BIN="$(find_psql_binary)"
PG_SETUP_BIN=""
PG_SERVICE=""
PG_DATA_DIR=""

if [[ -z "${PSQL_BIN}" ]]; then
  echo "psql not found. Install a PostgreSQL client/server (13+) before running setup." >&2
  exit 1
fi

if [[ "${PSQL_BIN}" == /usr/pgsql-*/bin/psql ]]; then
  PG_VER="${PSQL_BIN#/usr/pgsql-}"
  PG_VER="${PG_VER%%/*}"
  PG_SETUP_BIN="/usr/pgsql-${PG_VER}/bin/postgresql-${PG_VER}-setup"
  PG_SERVICE="postgresql-${PG_VER}"
  PG_DATA_DIR="/var/lib/pgsql/${PG_VER}/data"
else
  PG_SETUP_BIN="$(command -v postgresql-setup || true)"
  PG_SERVICE="postgresql"
  PG_DATA_DIR="/var/lib/pgsql/data"
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
