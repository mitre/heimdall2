#!/bin/bash
set -euo pipefail

ENV_FILE="/etc/heimdall-server/backend.env"
TMP_FILE="$(mktemp)"
trap 'rm -f "${TMP_FILE}"' EXIT

# Load previously configured values if available.
if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}" || true
  set +a
fi

RAW_NODE_ENV="${NODE_ENV:-}"
RAW_PORT="${PORT:-}"
RAW_DATABASE_HOST="${DATABASE_HOST:-}"
RAW_DATABASE_PORT="${DATABASE_PORT:-}"
RAW_DATABASE_USERNAME="${DATABASE_USERNAME:-}"
RAW_DATABASE_PASSWORD="${DATABASE_PASSWORD:-}"
RAW_DATABASE_NAME="${DATABASE_NAME:-}"
RAW_JWT_SECRET="${JWT_SECRET:-}"
RAW_JWT_EXPIRE_TIME="${JWT_EXPIRE_TIME:-}"
RAW_ADMIN_EMAIL="${ADMIN_EMAIL:-}"

require_nonempty() {
  local key="$1"
  local value="$2"
  if [[ -z "${value}" ]]; then
    echo "Missing required configuration for non-interactive install: ${key}" >&2
    return 1
  fi
  return 0
}

if [[ ! -e /dev/tty ]]; then
  # Non-interactive mode: require all mandatory settings to be already present.
  require_nonempty NODE_ENV "${RAW_NODE_ENV}" || exit 1
  require_nonempty PORT "${RAW_PORT}" || exit 1
  require_nonempty DATABASE_HOST "${RAW_DATABASE_HOST}" || exit 1
  require_nonempty DATABASE_PORT "${RAW_DATABASE_PORT}" || exit 1
  require_nonempty DATABASE_USERNAME "${RAW_DATABASE_USERNAME}" || exit 1
  require_nonempty DATABASE_PASSWORD "${RAW_DATABASE_PASSWORD}" || exit 1
  require_nonempty DATABASE_NAME "${RAW_DATABASE_NAME}" || exit 1
  require_nonempty JWT_SECRET "${RAW_JWT_SECRET}" || exit 1
  require_nonempty JWT_EXPIRE_TIME "${RAW_JWT_EXPIRE_TIME}" || exit 1
  require_nonempty ADMIN_EMAIL "${RAW_ADMIN_EMAIL}" || exit 1
  exit 0
fi

NODE_ENV="${NODE_ENV:-production}"
PORT="${PORT:-3000}"
DATABASE_HOST="${DATABASE_HOST:-127.0.0.1}"
DATABASE_PORT="${DATABASE_PORT:-5432}"
DATABASE_USERNAME="${DATABASE_USERNAME:-heimdall}"
DATABASE_PASSWORD="${DATABASE_PASSWORD:-}"
DATABASE_NAME="${DATABASE_NAME:-heimdall-server-production}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 64)}"
JWT_EXPIRE_TIME="${JWT_EXPIRE_TIME:-1d}"
API_KEY_SECRET="${API_KEY_SECRET:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@heimdall.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

prompt_required() {
  local var_name="$1"
  local label="$2"
  local default_value="$3"
  local secret="${4:-0}"
  local user_input=""
  local prompt_default="${default_value}"

  if [[ "${secret}" -eq 1 && -n "${default_value}" ]]; then
    prompt_default="<hidden>"
  fi

  while true; do
    if [[ "${secret}" -eq 1 ]]; then
      read -r -s -p "${label} [${prompt_default}]: " user_input </dev/tty
      echo >/dev/tty
    else
      read -r -p "${label} [${prompt_default}]: " user_input </dev/tty
    fi

    if [[ -z "${user_input}" ]]; then
      user_input="${default_value}"
    fi

    if [[ -n "${user_input}" ]]; then
      printf -v "${var_name}" "%s" "${user_input}"
      return 0
    fi
    echo "Value is required." >/dev/tty
  done
}

prompt_optional() {
  local var_name="$1"
  local label="$2"
  local default_value="$3"
  local secret="${4:-0}"
  local user_input=""
  local prompt_default="${default_value}"

  if [[ "${secret}" -eq 1 && -n "${default_value}" ]]; then
    prompt_default="<hidden>"
  fi

  if [[ "${secret}" -eq 1 ]]; then
    read -r -s -p "${label} [${prompt_default}]: " user_input </dev/tty
    echo >/dev/tty
  else
    read -r -p "${label} [${prompt_default}]: " user_input </dev/tty
  fi

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

echo "Heimdall server configuration" >/dev/tty
echo "Press Enter to accept each default value." >/dev/tty
echo >/dev/tty

prompt_required NODE_ENV "NODE_ENV" "${NODE_ENV}" 0
prompt_required PORT "PORT" "${PORT}" 0
prompt_required DATABASE_HOST "DATABASE_HOST" "${DATABASE_HOST}" 0
prompt_required DATABASE_PORT "DATABASE_PORT" "${DATABASE_PORT}" 0
prompt_required DATABASE_USERNAME "DATABASE_USERNAME" "${DATABASE_USERNAME}" 0
prompt_required DATABASE_PASSWORD "DATABASE_PASSWORD" "${DATABASE_PASSWORD}" 1
prompt_required DATABASE_NAME "DATABASE_NAME" "${DATABASE_NAME}" 0
prompt_required JWT_SECRET "JWT_SECRET" "${JWT_SECRET}" 1
prompt_required JWT_EXPIRE_TIME "JWT_EXPIRE_TIME" "${JWT_EXPIRE_TIME}" 0

local_enable_api_keys="n"
if [[ -n "${API_KEY_SECRET}" ]]; then
  local_enable_api_keys="y"
fi
read -r -p "Enable API keys? [y/N] (default: ${local_enable_api_keys}): " api_choice </dev/tty
api_choice="${api_choice:-${local_enable_api_keys}}"
if [[ "${api_choice,,}" == "y" ]]; then
  if [[ -z "${API_KEY_SECRET}" ]]; then
    API_KEY_SECRET="$(openssl rand -hex 33)"
  fi
  prompt_required API_KEY_SECRET "API_KEY_SECRET" "${API_KEY_SECRET}" 1
else
  API_KEY_SECRET=""
fi

prompt_required ADMIN_EMAIL "ADMIN_EMAIL" "${ADMIN_EMAIL}" 0
prompt_optional ADMIN_PASSWORD "ADMIN_PASSWORD (leave blank for auto-generated seed password)" "${ADMIN_PASSWORD}" 1

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
write_key ADMIN_EMAIL "${ADMIN_EMAIL}"
write_key ADMIN_PASSWORD "${ADMIN_PASSWORD}"

mv "${TMP_FILE}" "${ENV_FILE}"
chown root:heimdall "${ENV_FILE}"
chmod 0640 "${ENV_FILE}"

echo >/dev/tty
echo "Saved configuration to ${ENV_FILE}" >/dev/tty
