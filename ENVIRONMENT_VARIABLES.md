# Heimdall Server Environment Variables

All settings are loaded from a `.env` file or system environment variables.
Environment variables take precedence over values in the `.env` file.

- **Development**: `apps/backend/.env`
- **Docker**: `.env` in project root
- **RPM install**: `/etc/heimdall-server/backend.env`

See also: [Wiki: Environment Variables Configuration](https://github.com/mitre/heimdall2/wiki/Environment-Variables-Configuration)

---

## Core

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | *(required)* | Application environment: `production`, `development`, or `test` |
| `PORT` | `3000` | HTTP listen port |
| `EXTERNAL_URL` | | Public URL users access Heimdall at. Required for OAuth/OIDC callback URLs. Example: `https://heimdall.example.com` |
| `NGINX_HOST` | `localhost` | Hostname used by frontend defaults and NGINX config template |
| `LOG_FILE` | *(journald)* | Log file path. If unset, logs go to journald via systemd. Example: `/var/log/heimdall-server/server.log` |

## Database

| Variable | Default | Description |
|---|---|---|
| `DATABASE_HOST` | `127.0.0.1` | PostgreSQL hostname |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_USERNAME` | `postgres` | PostgreSQL username |
| `DATABASE_PASSWORD` | | PostgreSQL password |
| `DATABASE_NAME` | `heimdall-server-{NODE_ENV}` | Database name |
| `DATABASE_URL` | | Full connection URL. Overrides individual settings above if set. Example: `postgresql://user:pass@host:5432/dbname` |
| `DATABASE_SSL` | `false` | Enable SSL for database connection |
| `DATABASE_SSL_KEY` | | SSL key file path or PEM content |
| `DATABASE_SSL_CERT` | | SSL certificate file path or PEM content |
| `DATABASE_SSL_CA` | | SSL CA certificate file path or PEM content |
| `DATABASE_SSL_INSECURE` | `false` | Skip SSL certificate verification (security risk) |

## Authentication & Security

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | *(required)* | Secret key for JWT signing. Generate with: `openssl rand -hex 33` |
| `JWT_EXPIRE_TIME` | `60s` | JWT expiration duration (e.g., `60s`, `1h`, `1d`) |
| `API_KEY_SECRET` | | Secret for API key generation. API keys disabled if not set. Generate with: `openssl rand -hex 33` |
| `SESSION_EXPIRES_IN` | `86400` | Session expiry in seconds (default: 24 hours) |
| `SESSION_COOKIE_CACHE_MAX_AGE` | `300` | Cookie cache TTL in seconds (default: 5 minutes) |
| `BCRYPT_COST` | `14` | Bcrypt hashing cost factor (10-31). Higher = slower + more secure |
| `COOKIE_PREFIX` | `heimdall` | Cookie name prefix. Change for multi-instance deployments |
| `API_KEY_DEFAULT_EXPIRY_DAYS` | `7` | Default API key expiry in days |
| `TWO_FACTOR_ISSUER` | `Heimdall` | TOTP issuer name shown in authenticator apps |
| `ADMIN_EMAIL` | `admin@heimdall.local` | Initial admin user email (used during db:seed) |
| `ADMIN_PASSWORD` | *(auto-generated)* | Initial admin password. Shown on first setup if auto-generated |
| `ADMIN_USES_EXTERNAL_AUTH` | `false` | Admin authenticates via external provider instead of local password |
| `LOCAL_LOGIN_DISABLED` | `false` | Disable local username/password login |
| `REGISTRATION_DISABLED` | `false` | Disable public user registration |
| `ONE_SESSION_PER_USER` | `false` | Only allow one active session per user |
| `MAX_FILE_UPLOAD_SIZE` | `50` | Maximum evaluation upload size in MB |

## UI / Branding

| Variable | Default | Description |
|---|---|---|
| `WARNING_BANNER` | | Warning banner text displayed to all users |
| `CLASSIFICATION_BANNER_TEXT` | | Classification banner text (e.g., `CUI`, `FOUO`). No banner if empty |
| `CLASSIFICATION_BANNER_TEXT_COLOR` | `white` | Banner text color |
| `CLASSIFICATION_BANNER_COLOR` | `red` | Banner background color |

## LDAP

Set `LDAP_ENABLED=true` to enable LDAP authentication.

| Variable | Default | Description |
|---|---|---|
| `LDAP_ENABLED` | `false` | Enable LDAP authentication |
| `LDAP_HOST` | | LDAP server hostname |
| `LDAP_PORT` | `389` | LDAP server port |
| `LDAP_BINDDN` | | Bind DN for lookups (e.g., `cn=admin,dc=example,dc=com`) |
| `LDAP_PASSWORD` | | Bind password for lookups |
| `LDAP_SEARCHBASE` | | Search base DN (e.g., `OU=Users,DC=example,DC=com`) |
| `LDAP_SEARCHFILTER` | `(sAMAccountName={{username}})` | Search filter. `{{username}}` is replaced at login |
| `LDAP_NAMEFIELD` | `name` | LDAP attribute containing display name |
| `LDAP_MAILFIELD` | `mail` | LDAP attribute containing email address |
| `LDAP_SSL` | `false` | Use SSL for LDAP connections |
| `LDAP_SSL_INSECURE` | `false` | Skip LDAP SSL certificate verification |
| `LDAP_SSL_CA` | | LDAP SSL CA certificate file path or PEM content |

## GitHub OAuth

Set `GITHUB_CLIENTID` to enable GitHub login. Requires `EXTERNAL_URL`.

| Variable | Default | Description |
|---|---|---|
| `GITHUB_CLIENTID` | | GitHub OAuth app client ID |
| `GITHUB_CLIENTSECRET` | | GitHub OAuth app client secret |
| `GITHUB_ENTERPRISE_INSTANCE_BASE_URL` | `https://github.com/` | GitHub Enterprise base URL |
| `GITHUB_ENTERPRISE_INSTANCE_API_URL` | `https://api.github.com/` | GitHub Enterprise API URL |

## GitLab OAuth

Set `GITLAB_CLIENTID` to enable GitLab login. Requires `EXTERNAL_URL`.

| Variable | Default | Description |
|---|---|---|
| `GITLAB_CLIENTID` | | GitLab OAuth app client ID |
| `GITLAB_CLIENTSECRET` | | GitLab OAuth app client secret |
| `GITLAB_BASEURL` | `https://gitlab.com` | GitLab instance URL |

## Google OAuth

Set `GOOGLE_CLIENTID` to enable Google login. Requires `EXTERNAL_URL`.

| Variable | Default | Description |
|---|---|---|
| `GOOGLE_CLIENTID` | | Google OAuth client ID |
| `GOOGLE_CLIENTSECRET` | | Google OAuth client secret |

## Okta OIDC

Set `OKTA_CLIENTID` to enable Okta login. URLs are auto-computed from `OKTA_DOMAIN` unless overridden. Requires `EXTERNAL_URL`.

| Variable | Default | Description |
|---|---|---|
| `OKTA_DOMAIN` | | Okta domain (e.g., `your-org.okta.com`) |
| `OKTA_CLIENTID` | | Okta OAuth app client ID |
| `OKTA_CLIENTSECRET` | | Okta OAuth app client secret |
| `OKTA_ISSUER_URL` | *(from OKTA_DOMAIN)* | Okta issuer URL |
| `OKTA_AUTHORIZATION_URL` | *(from OKTA_DOMAIN)* | Okta authorization endpoint |
| `OKTA_TOKEN_URL` | *(from OKTA_DOMAIN)* | Okta token endpoint |
| `OKTA_USER_INFO_URL` | *(from OKTA_DOMAIN)* | Okta userinfo endpoint |
| `OKTA_USE_HTTPS_PROXY` | `false` | Route Okta requests through `HTTPS_PROXY` |

## Generic OIDC

Set `OIDC_CLIENTID` to enable generic OIDC login. Requires `EXTERNAL_URL`.

| Variable | Default | Description |
|---|---|---|
| `OIDC_NAME` | | Display name shown on login page |
| `OIDC_ISSUER` | | OIDC issuer URL |
| `OIDC_AUTHORIZATION_URL` | | OIDC authorization endpoint |
| `OIDC_TOKEN_URL` | | OIDC token endpoint |
| `OIDC_USER_INFO_URL` | | OIDC userinfo endpoint |
| `OIDC_CLIENTID` | | OIDC client ID |
| `OIDC_CLIENT_SECRET` | | OIDC client secret |
| `OIDC_USE_HTTPS_PROXY` | `false` | Route OIDC requests through `HTTPS_PROXY` |
| `OIDC_USES_PKCE_S256` | `false` | Use PKCE with SHA-256 challenge method |
| `OIDC_USES_PKCE_PLAIN` | `false` | Use PKCE with plain text challenge method |
| `OIDC_USES_VERIFIED_EMAIL` | `true` | Require verified email from OIDC provider |
| `OIDC_EXTERNAL_GROUPS` | `false` | Synchronize user groups from OIDC provider claims |

## Rate Limiting

| Variable | Default | Description |
|---|---|---|
| `RATE_LIMIT_ENABLED` | `true` | Enable rate limiting on auth endpoints. Set to `false` for development/testing |
| `RATE_LIMIT_WINDOW` | `60` | Global rate limit window in seconds |
| `RATE_LIMIT_MAX` | `20` | Maximum requests per window (global) |
| `RATE_LIMIT_LOGIN_WINDOW` | `60` | Rate limit window for login attempts in seconds |
| `RATE_LIMIT_LOGIN_MAX` | `5` | Maximum login attempts per window |
| `RATE_LIMIT_SIGNUP_WINDOW` | `300` | Rate limit window for sign-up in seconds |
| `RATE_LIMIT_SIGNUP_MAX` | `3` | Maximum sign-up attempts per window |

## Proxy / TLS

| Variable | Default | Description |
|---|---|---|
| `HTTPS_PROXY` | | HTTPS proxy URL for OAuth/OIDC outbound requests |
| `NODE_EXTRA_CA_CERTS` | | Path to CA bundle for TLS inspection proxies (e.g., `/etc/pki/tls/certs/ca-bundle.crt`) |

## External Services

| Variable | Default | Description |
|---|---|---|
| `TENABLE_HOST_URL` | | Tenable.SC instance URL |
| `SPLUNK_HOST_URL` | | Splunk instance URL |
| `FORCE_TENABLE_FRONTEND` | `false` | Force Tenable.SC UI on frontend |
