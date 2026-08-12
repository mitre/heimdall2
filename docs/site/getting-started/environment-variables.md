---
title: Environment Variables
description: The canonical reference for every environment variable Heimdall reads, with defaults verified against the source that supplies them.
outline: [2, 3]
---

# Environment Variables

This page is the single source of truth for Heimdall's configuration. Every
variable below was derived by reading the code that reads it — not copied from
another document. Other pages link here rather than restating variable
descriptions.

::: tip Where these go
The variable names are identical across every deployment method; only the file
that holds them changes.

- **Development** — `apps/backend/.env` (start from `apps/backend/.env-example`)
- **Docker Compose** — the `environment:` block, or a `.env` beside `docker-compose.yml`
- **RPM** — `/etc/heimdall-server/backend.env`
:::

## How configuration is loaded

Heimdall reads configuration in `apps/backend/config/app_config.ts`. Three
behaviors surprise people, so they are stated up front.

**The process environment wins over the `.env` file.** `AppConfig.get()` is
`process.env[key] || envConfig[key]`. A variable exported in the shell, set in a
systemd unit, or injected by Kubernetes overrides the same key in `.env`. It is
not the other way around.

**`.env` is read from the working directory.** The file is loaded with a
relative `fs.readFileSync('.env')`, so it is found relative to where the process
was started, not relative to the installed application. Starting the server from
a different directory silently loads no file — the application logs
`Unable to read configuration file .env!` and continues on the process
environment alone.

**An empty value is not the same as a default.** Most reads use `||`, so an
empty string behaves like unset and the default applies. A few variables
validate instead and refuse to start; those are called out individually.

## Known traps

These have each cost someone real time.

::: warning PORT is read by two different servers
`PORT` sets the backend's listen port (default `3000`). The frontend dev server
reads its own configuration from `apps/frontend/.env.development` and
deliberately reads nothing from `apps/backend/.env`. Setting `PORT` in the
backend `.env` to steer the frontend broke local development on 2026-08-10.
Leave `PORT` unset for local development and use `API_PROXY_TARGET` for the
frontend proxy.
:::

::: warning NODE_ENV selects the database name
When `DATABASE_NAME` is unset, the database name is derived as
`heimdall-server-${NODE_ENV}`. Changing `NODE_ENV` therefore silently points
Heimdall at a different database. If **both** `DATABASE_NAME` and `NODE_ENV` are
unset the application throws at startup rather than guessing.
:::

::: warning JWT_EXPIRE_TIME is not currently honored in the units it accepts
`JWT_EXPIRE_TIME` is converted to milliseconds and passed to `jsonwebtoken`'s
`expiresIn`, which interprets the number as **seconds**. Sessions therefore last
far longer than configured — the `60s` default yields roughly 16.6 hours, and
`1d` yields roughly 2.7 years. The value is separately clamped to a maximum of
two days before that conversion, so the clamp does not bound the resulting
session either. This is a known open defect; treat the configured value as
advisory until it is fixed.
:::

## Core server

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `NODE_ENV` | Runtime mode: `development`, `production` or `test`. Also selects the database name when `DATABASE_NAME` is unset. | Yes | none |
| `PORT` | Port the backend listens on. | No | `3000` |
| `EXTERNAL_URL` | Public URL of the deployment, used to build OAuth callback URLs. Required for any external auth provider. | No | empty |
| `MAX_FILE_UPLOAD_SIZE` | Maximum evaluation upload size, in megabytes. | No | `50` |
| `WARNING_BANNER` | Text shown in the login banner. Empty means no banner. | No | empty |

## Database

`DATABASE_URL` is parsed at startup into the individual `DATABASE_*` components,
so it can be used instead of setting them separately. It does not appear in
`apps/backend/.env-example`, but the application does read it.

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `DATABASE_URL` | Full connection string. When set, it populates `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_NAME` and `DATABASE_PORT`. | No | none |
| `DATABASE_HOST` | Database hostname. | No | `127.0.0.1` |
| `DATABASE_PORT` | Database port. | No | `5432` |
| `DATABASE_USERNAME` | Database user. | No | `postgres` |
| `DATABASE_PASSWORD` | Database password. | No | empty |
| `DATABASE_NAME` | Database name. When unset, derived as `heimdall-server-${NODE_ENV}`. | No | derived |
| `DATABASE_SSL` | Enable TLS to the database. Any value other than `false` enables it. | No | `false` |
| `DATABASE_SSL_INSECURE` | Set to `true` to skip database certificate verification. A security risk; intended for self-signed development certificates only. | No | `false` |
| `DATABASE_SSL_KEY` | Client key — either an absolute path to the file, or the key material itself (detected by a `-BEGIN` marker). Required when `DATABASE_SSL` is enabled with client certificates. | No | none |
| `DATABASE_SSL_CERT` | Client certificate — path or inline material, same detection. | No | none |
| `DATABASE_SSL_CA` | Certificate authority — path or inline material, same detection. | No | none |

::: warning
When a `DATABASE_SSL_*` value is given as a path, the file must exist at startup.
A missing file raises `SSL Key file does not exist` (or the `Cert`/`CA`
equivalent) and the application does not start.
:::

## Password hashing

Heimdall derives password hashes with PBKDF2 so that hashing is performed by a
FIPS 140-3 validated module. These values are validated at startup and **throw**
on anything out of range — they are never silently clamped.

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `FIPS_MODE` | `true` refuses to start unless the OpenSSL provider reports FIPS active. `false` disables the assertion. Any other value throws. When unset, no assertion runs and the application warns loudly at boot. | No | unset |
| `PASSWORD_HASH_ALGORITHM` | PBKDF2 digest: `sha256`, `sha384` or `sha512`. Any other value throws. | No | `sha512` |
| `PASSWORD_HASH_ITERATIONS` | PBKDF2 iteration count. Accepted range is `100000`–`10000000`; outside it, startup throws. | No | `600000` |
| `PASSWORD_MAX_LENGTH` | Maximum accepted password length when hashing. Accepted range is `1`–`128`. | No | `128` |
| `PASSWORD_KDF_CONCURRENCY` | Number of password derivations allowed to run concurrently. Minimum `1`. | No | `2` |
| `PASSWORD_HASH_WRITE_ENABLED` | `true` or `false`; any other value throws. Gates whether new credentials are written as PBKDF2. Set it `false` during a rolling deploy so older instances can still read newly written credentials, then enable it after cutover. | No | derived — see below |

::: info How PASSWORD_HASH_WRITE_ENABLED behaves when unset
Leaving it unset is the normal case — the gate is then derived from the state of
the database, and an explicit value always overrides that derivation.

- A durable marker exists, meaning PBKDF2 writes already began on this database — **enabled**. This is sticky across restarts.
- No marker and the `Users` table is empty, meaning a fresh install — **enabled**, because no older instance can exist.
- No marker and users already exist, meaning an upgrade — **disabled**, because a rolling window with older instances is possible.
:::

::: danger PASSWORD_HASH_WRITE_ENABLED=false is incompatible with FIPS mode
With writes disabled, new credentials fall back to bcrypt — which generates the
hash outside the validated module. If FIPS mode is active, that combination
throws rather than producing a hash outside the boundary. Enable PBKDF2 writes
before enabling FIPS mode.
:::

::: info Verification is never gated
Only the hashing path reads these values. Verification reads its parameters from
the stored hash, so credentials written under an earlier algorithm, iteration
count or length limit keep working after you change these settings.
:::

## Authentication

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `JWT_SECRET` | Signing secret for session tokens. When unset, a value is generated at startup, which invalidates all sessions on every restart. | Yes in production | generated |
| `JWT_EXPIRE_TIME` | Token lifetime, clamped to a maximum of two days. See the trap above regarding units. | No | `60s` |
| `API_KEY_SECRET` | Signing secret for API keys. API keys are disabled entirely when this is unset. | No | none |
| `LOCAL_LOGIN_DISABLED` | `true` disables username/password login, leaving only external providers. | No | `false` |
| `REGISTRATION_DISABLED` | `true` prevents self-registration; only an administrator can create users. | No | `false` |
| `ONE_SESSION_PER_USER` | `true` limits each user to a single active session. | No | `false` |
| `ADMIN_EMAIL` | Email address of the seeded administrator account. | No | `admin@heimdall.local` |
| `ADMIN_PASSWORD` | Password for the seeded administrator. When unset, a random password is generated and printed once, during initial setup. | No | generated |
| `ADMIN_USES_EXTERNAL_AUTH` | `true` seeds the administrator as an external-auth user with no local password. | No | `false` |

### LDAP

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `LDAP_ENABLED` | `true` enables LDAP authentication. | No | `false` |
| `LDAP_HOST` | LDAP server hostname. | Yes, for LDAP | none |
| `LDAP_PORT` | LDAP server port. | No | `389` |
| `LDAP_BINDDN` | Distinguished name used for lookups. | Yes, for LDAP | none |
| `LDAP_PASSWORD` | Password for the lookup account. | Yes, for LDAP | none |
| `LDAP_SEARCHBASE` | Search base, for example `OU=Users, DC=example, DC=local`. | Yes, for LDAP | none |
| `LDAP_SEARCHFILTER` | Search filter. Active Directory typically uses `sAMAccountName={{username}}`. | No | `(sAMAccountName={{username}})` |
| `LDAP_NAMEFIELD` | Attribute holding the user's full name. | No | `name` |
| `LDAP_MAILFIELD` | Attribute holding the user's email. | No | `mail` |
| `LDAP_SSL` | `true` connects with `ldaps://` instead of `ldap://`. | No | `false` |
| `LDAP_SSL_INSECURE` | `true` skips LDAP certificate verification. A security risk. | No | `false` |
| `LDAP_SSL_CA` | Certificate authority — path or inline material. | No | none |

### OAuth and OIDC

Setting a provider's `*_CLIENTID` is what enables that provider; leaving it unset
disables it. Every provider also needs `EXTERNAL_URL` set, because the callback
URL is built from it.

#### GitHub

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `GITHUB_CLIENTID` | GitHub application client ID. Enables the provider. | Yes, for GitHub | none |
| `GITHUB_CLIENTSECRET` | GitHub application client secret. | Yes, for GitHub | none |
| `GITHUB_ENTERPRISE_INSTANCE_BASE_URL` | Base URL for GitHub Enterprise. | No | `https://github.com/` |
| `GITHUB_ENTERPRISE_INSTANCE_API_URL` | API URL for GitHub Enterprise. | No | `https://api.github.com/` |

#### GitLab

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `GITLAB_CLIENTID` | GitLab application client ID. Enables the provider. | Yes, for GitLab | none |
| `GITLAB_CLIENTSECRET` | GitLab application client secret. | Yes, for GitLab | none |
| `GITLAB_SECRET` | Legacy name for the client secret, still accepted. | No | none |
| `GITLAB_BASEURL` | GitLab base URL, for self-managed instances. | No | `https://gitlab.com` |

::: info Two names for the GitLab client secret
`GITLAB_CLIENTSECRET` is canonical — it matches the other providers. Earlier
releases read only `GITLAB_SECRET`, so that name remains supported and existing
deployments need no change. When both are set, `GITLAB_CLIENTSECRET` wins.
:::

#### Google

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `GOOGLE_CLIENTID` | Google application client ID, usually ending in `.apps.googleusercontent.com`. Enables the provider. | Yes, for Google | none |
| `GOOGLE_CLIENTSECRET` | Google application client secret. | Yes, for Google | none |

#### Okta

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `OKTA_CLIENTID` | Okta application client ID. Enables the provider. | Yes, for Okta | none |
| `OKTA_CLIENTSECRET` | Okta application client secret. | Yes, for Okta | none |
| `OKTA_DOMAIN` | Okta domain, for example `example.okta.com`. The issuer and endpoint URLs below are derived from it when they are not set explicitly. | Yes, for Okta | none |
| `OKTA_ISSUER_URL` | Override the derived issuer URL. | No | derived from `OKTA_DOMAIN` |
| `OKTA_AUTHORIZATION_URL` | Override the derived authorization endpoint. | No | derived |
| `OKTA_TOKEN_URL` | Override the derived token endpoint. | No | derived |
| `OKTA_USER_INFO_URL` | Override the derived user-info endpoint. | No | derived |
| `OKTA_USE_HTTPS_PROXY` | `true` routes Okta requests through the proxy named by `HTTPS_PROXY`. | No | `false` |

#### Generic OIDC

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `OIDC_CLIENTID` | OIDC client ID. Enables the provider. | Yes, for OIDC | none |
| `OIDC_CLIENT_SECRET` | OIDC client secret. Note the underscore — this name differs from the other providers. | Yes, for OIDC | none |
| `OIDC_NAME` | Label shown on the login button. | Yes, for OIDC | empty |
| `OIDC_ISSUER` | Issuer URL, for example `https://example.auth0.com`. | Yes, for OIDC | none |
| `OIDC_AUTHORIZATION_URL` | Authorization endpoint. | Yes, for OIDC | none |
| `OIDC_TOKEN_URL` | Token endpoint. | Yes, for OIDC | none |
| `OIDC_USER_INFO_URL` | User-info endpoint. | Yes, for OIDC | none |
| `OIDC_EXTERNAL_GROUPS` | `true` maps groups from the provider. Groups are never created automatically — users are only mapped into groups that already exist. | No | `false` |
| `OIDC_USES_PKCE_S256` | `true` uses PKCE with the `S256` challenge method. | No | `false` |
| `OIDC_USES_PKCE_PLAIN` | `true` uses PKCE with the `plain` challenge method. Ignored when `OIDC_USES_PKCE_S256` is set. | No | `false` |
| `OIDC_USES_VERIFIED_EMAIL` | Set to `false` to accept provider emails that are not marked verified. | No | `true` |
| `OIDC_USE_HTTPS_PROXY` | `true` routes OIDC requests through the proxy named by `HTTPS_PROXY`. | No | `false` |
| `HTTPS_PROXY` | Proxy URL used when `OIDC_USE_HTTPS_PROXY` or `OKTA_USE_HTTPS_PROXY` is enabled. | No | none |

## External interfaces

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `SPLUNK_HOST_URL` | Splunk host URL, without a port. Enables the Splunk integration in the frontend. | No | empty |
| `TENABLE_HOST_URL` | Tenable.SC host URL, without a port. Enables the Tenable integration in the frontend. | No | empty |
| `FORCE_TENABLE_FRONTEND` | `true` forces the Tenable interface in the frontend. | No | `false` |

## Classification banner

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `CLASSIFICATION_BANNER_TEXT` | Banner text, for example `CUI`. No banner is shown when this is empty. | No | empty |
| `CLASSIFICATION_BANNER_COLOR` | Banner background color. | No | `red` |
| `CLASSIFICATION_BANNER_TEXT_COLOR` | Banner text color. | No | `white` |

## Deployment-method specific

These are read by installation tooling or the runtime host, not by the
application itself.

| Variable | Description | Where it applies | Default |
| --- | --- | --- | --- |
| `CYPRESS_TESTING` | `true` enables the end-to-end test support route. See the warning below before setting it. | Development and test only | unset |
| `UV_THREADPOOL_SIZE` | Size of libuv's thread pool, which is what PBKDF2 hashing runs on. Read by the Node runtime, not by Heimdall. Set to `8` by the Dockerfile, `cmd.sh` and the systemd unit. Raising `PASSWORD_HASH_ITERATIONS` without a matching thread pool starves concurrent logins. | Any | `8` where Heimdall's own launchers apply, otherwise Node's default of `4` |
| `NGINX_HOST` | Templated into the bundled NGINX configuration as `server_name`. Read by the setup scripts, never by the application. | Docker Compose, dev setup scripts | `localhost` |
| `LOG_FILE` | When set, the launcher redirects stdout and stderr to this path. Unset means logging to journald. The directory must be writable by the `heimdall` user. | RPM only | unset (journald) |
| `NODE_EXTRA_CA_CERTS` | Path to additional trusted CAs. Read by the Node runtime itself, not by Heimdall. Needed behind a TLS-inspecting proxy. | Any | none |
| `API_PROXY_TARGET` | Backend URL the frontend dev server proxies to. Lives in `apps/frontend/.env.development`. Unset or empty means no proxy, and the frontend runs as standalone Heimdall Lite. | Development only | empty |

::: danger CYPRESS_TESTING unlocks an endpoint that deletes every user
Setting `CYPRESS_TESTING=true` while `NODE_ENV` is `development` or `test`
enables `POST /users/clear`, which truncates the `Users` table. Both conditions
must hold, and `development` is the value used for ordinary local work — so the
one variable is what stands between a development instance and an unauthenticated
route that empties user accounts.

Set it only for an end-to-end test run, and never in an environment holding data
you care about. It has no effect when `NODE_ENV=production`.
:::

## Documentation build

These affect building this documentation site, not the application.

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `HEIMDALL_DOCS_TARGET` | Build target: `pages`, `local` or `app`. An unrecognized value fails the build. | No | `local` |
| `HEIMDALL_DOCS_BASE` | Base path, honored by the `app` target only. | No | `/docs/` |

## Not environment variables

The frontend source refers to `PACKAGE_VERSION`, `DESCRIPTION`, `REPOSITORY`,
`LICENSE`, `CHANGELOG`, `BRANCH` and `ISSUES` through `process.env`. These are
**not** runtime environment variables — they are substituted at build time from
`package.json` by webpack's `DefinePlugin`. Setting them in the environment has
no effect; change `package.json` and rebuild instead.

## Documented elsewhere but not yet implemented

The RPM manual page describes three password-complexity variables that this
application does not currently read. They are listed here so the discrepancy is
explicit rather than discovered in production.

| Variable | Status |
| --- | --- |
| `PASSWORD_MIN_LENGTH` | Not read by Heimdall. Setting it has no effect today. |
| `PASSWORD_REQUIRE_CLASSES` | Not read by Heimdall. Setting it has no effect today. |
| `PASSWORD_MAX_CONSECUTIVE` | Not read by Heimdall. Setting it has no effect today. |
