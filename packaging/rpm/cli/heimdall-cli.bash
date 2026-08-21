# Bash completion for heimdall-cli
# Installed to /etc/bash_completion.d/heimdall-cli

_heimdall_cli() {
    local cur prev commands config_keys
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    commands="status reset_password set_port add_cert backup restore config logs diag restart stop start"

    # Top-level completion
    if [[ ${COMP_CWORD} -eq 1 ]]; then
        COMPREPLY=($(compgen -W "${commands}" -- "${cur}"))
        return 0
    fi

    # Subcommand-specific completion
    case "${COMP_WORDS[1]}" in
        config)
            if [[ ${COMP_CWORD} -eq 2 ]]; then
                COMPREPLY=($(compgen -W "get set" -- "${cur}"))
            elif [[ ${COMP_CWORD} -eq 3 ]]; then
                # Generate key list from schema if available, otherwise use static list
                if command -v python3 >/dev/null 2>&1 && [ -f /usr/lib/heimdall-cli/config_schema.py ]; then
                    config_keys="$(python3 -c 'import sys; sys.path.insert(0,"/usr/lib/heimdall-cli"); from config_schema import all_keys; print(" ".join(all_keys()))' 2>/dev/null)"
                fi
                if [ -z "${config_keys}" ]; then
                    config_keys="NODE_ENV PORT EXTERNAL_URL NGINX_HOST DATABASE_HOST DATABASE_PORT DATABASE_USERNAME DATABASE_PASSWORD DATABASE_NAME DATABASE_URL DATABASE_SSL JWT_SECRET JWT_EXPIRE_TIME API_KEY_SECRET ADMIN_EMAIL ADMIN_PASSWORD LOCAL_LOGIN_DISABLED REGISTRATION_DISABLED ONE_SESSION_PER_USER MAX_FILE_UPLOAD_SIZE WARNING_BANNER CLASSIFICATION_BANNER_TEXT GITHUB_CLIENTID GITHUB_CLIENTSECRET GITLAB_CLIENTID GITLAB_CLIENTSECRET GOOGLE_CLIENTID GOOGLE_CLIENTSECRET OKTA_DOMAIN OKTA_CLIENTID OKTA_CLIENTSECRET OIDC_NAME OIDC_ISSUER OIDC_CLIENTID OIDC_CLIENT_SECRET LDAP_ENABLED LDAP_HOST LDAP_PORT LDAP_BINDDN LDAP_PASSWORD LDAP_SEARCHBASE HTTPS_PROXY NODE_EXTRA_CA_CERTS TENABLE_HOST_URL SPLUNK_HOST_URL"
                fi
                COMPREPLY=($(compgen -W "${config_keys}" -- "${cur}"))
            fi
            ;;
        add_cert)
            # File completion for .pem and .crt files
            COMPREPLY=($(compgen -f -X '!*.@(pem|crt|cer)' -- "${cur}"))
            ;;
        restore)
            # File completion for .tar.gz files
            COMPREPLY=($(compgen -f -X '!*.tar.gz' -- "${cur}"))
            ;;
        backup)
            # Directory completion
            COMPREPLY=($(compgen -d -- "${cur}"))
            ;;
        logs)
            COMPREPLY=($(compgen -W "--lines --follow" -- "${cur}"))
            ;;
        reset_password)
            # Suggest the default admin email
            if [[ ${COMP_CWORD} -eq 2 ]]; then
                COMPREPLY=($(compgen -W "admin@heimdall.local" -- "${cur}"))
            fi
            ;;
    esac
    return 0
}

complete -F _heimdall_cli heimdall-cli
