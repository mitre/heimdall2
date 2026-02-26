#!/bin/bash
set -euo pipefail

ENV_FILE="/etc/heimdall-server/backend.env"
TMP_FILE="$(mktemp)"
trap 'rm -f "${TMP_FILE}"' EXIT

MODE="auto"
if [[ "${1:-}" == "--interactive" ]]; then
  MODE="interactive"
  shift
elif [[ "${1:-}" == "--non-interactive" ]]; then
  MODE="non-interactive"
  shift
fi

if [[ $# -gt 0 ]]; then
  echo "Usage: $0 [--interactive|--non-interactive]" >&2
  exit 64
fi

# Load previously configured values if available.
if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}" || true
  set +a
fi

have_tty() {
  if [[ -t 0 || -t 1 || -t 2 ]]; then
    return 0
  fi

  if exec 3<>/dev/tty 2>/dev/null; then
    exec 3>&-
    return 0
  fi

  return 1
}

NODE_ENV="${NODE_ENV:-production}"
PORT="${PORT:-3000}"
DATABASE_HOST="${DATABASE_HOST:-localhost}"
DATABASE_PORT="${DATABASE_PORT:-5432}"
DATABASE_USERNAME="${DATABASE_USERNAME:-postgres}"
DATABASE_PASSWORD="${DATABASE_PASSWORD:-}"
DATABASE_NAME="${DATABASE_NAME:-heimdall-server-${NODE_ENV}}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 64)}"
JWT_EXPIRE_TIME="${JWT_EXPIRE_TIME:-1d}"
API_KEY_SECRET="${API_KEY_SECRET:-$(openssl rand -hex 33)}"
NGINX_HOST="${NGINX_HOST:-localhost}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@heimdall.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

prompt_with_default() {
  local var_name="$1"
  local prompt_text="$2"
  local default_value="$3"
  local user_input=""

  printf "%s" "${prompt_text}" >/dev/tty
  read -r user_input </dev/tty

  if [[ -z "${user_input}" ]]; then
    user_input="${default_value}"
  fi

  printf -v "${var_name}" "%s" "${user_input}"
}

write_key() {
  local key="$1"
  local value="$2"
  if [[ -z "${value}" ]]; then
    printf "%s=\n" "${key}" >>"${TMP_FILE}"
    return 0
  fi

  local escaped
  escaped="$(printf "%s" "${value}" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\$/\\$/g' -e 's/`/\\`/g')"
  printf '%s="%s"\n' "${key}" "${escaped}" >>"${TMP_FILE}"
}

SHOULD_PROMPT=1
if [[ "${MODE}" == "non-interactive" ]]; then
  SHOULD_PROMPT=0
elif [[ "${MODE}" == "auto" ]] && ! have_tty; then
  SHOULD_PROMPT=0
elif ! have_tty; then
  echo "Interactive mode requires a TTY. Re-run with --non-interactive or from a terminal." >&2
  exit 1
fi

if [[ "${SHOULD_PROMPT}" -eq 1 ]]; then
  echo "Heimdall server configuration" >/dev/tty
  echo "Press Enter to accept each default value." >/dev/tty
  echo >/dev/tty

  prompt_with_default DATABASE_USERNAME "Enter DATABASE_USERNAME (leave blank to use default 'postgres'): " "postgres"
  prompt_with_default DATABASE_PASSWORD "Enter DATABASE_PASSWORD (leave blank to not set a password): " ""
  prompt_with_default JWT_EXPIRE_TIME "Enter JWT_EXPIRE_TIME ex. 1d or 25m (leave blank to use default 1d): " "1d"
  prompt_with_default NGINX_HOST "Enter your FQDN/Hostname/IP Address (leave blank to use default localhost): " "localhost"
fi

printf "# Generated during heimdall-server RPM installation\n" >>"${TMP_FILE}"
write_key NODE_ENV "${NODE_ENV}"
write_key PORT "${PORT}"
write_key DATABASE_HOST "${DATABASE_HOST}"
write_key DATABASE_PORT "${DATABASE_PORT}"
write_key DATABASE_USERNAME "${DATABASE_USERNAME}"
write_key DATABASE_PASSWORD "${DATABASE_PASSWORD}"
write_key DATABASE_NAME "${DATABASE_NAME}"
write_key JWT_SECRET "${JWT_SECRET}"
write_key JWT_EXPIRE_TIME "${JWT_EXPIRE_TIME}"
write_key API_KEY_SECRET "${API_KEY_SECRET}"
write_key NGINX_HOST "${NGINX_HOST}"
write_key ADMIN_EMAIL "${ADMIN_EMAIL}"
write_key ADMIN_PASSWORD "${ADMIN_PASSWORD}"

mv "${TMP_FILE}" "${ENV_FILE}"
chown root:heimdall "${ENV_FILE}"
chmod 0640 "${ENV_FILE}"

if [[ "${SHOULD_PROMPT}" -eq 1 ]]; then
  echo >/dev/tty
  echo "Saved configuration to ${ENV_FILE}" >/dev/tty
fi
