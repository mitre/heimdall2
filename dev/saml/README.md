# Local SAML IdP

Local Keycloak SAML identity provider for Heimdall SAML development.

## Start

```bash
docker compose -f dev/saml/docker-compose.yml up -d
```

Admin console:

- URL: http://localhost:8080
- Username: `admin`
- Password: `admin`

Test user:

- Username: `saml.user@example.com`
- Password: `password`

## SAML Details

- Realm: `heimdall-dev`
- Client / SP entity ID: `heimdall-local`
- ACS URL: `http://localhost:3000/authn/saml/callback`
- IdP metadata: http://localhost:8080/realms/heimdall-dev/protocol/saml/descriptor

## View Config In Keycloak UI

1. Open http://localhost:8080/admin/master/console/#/heimdall-dev/clients
2. Sign in with `admin` / `admin` if prompted.
3. Click `heimdall-local`.
4. Confirm the client details:
   - `Client ID`: `heimdall-local`
   - `Protocol`: `SAML`
5. Open the client settings and confirm:
   - `Valid redirect URIs`: `http://localhost:3000/authn/saml/callback`
   - `Name ID format`: `email`
   - `Force POST binding`: enabled
6. Open the advanced SAML settings and confirm:
   - `Assertion Consumer Service POST Binding URL`: `http://localhost:3000/authn/saml/callback`
   - `IDP Initiated SSO URL Name`: `heimdall-local`
7. Open mappers or dedicated scopes and confirm these SAML user attributes:
   - `email`
   - `firstName`
   - `lastName`

## Reset

```bash
docker compose -f dev/saml/docker-compose.yml down -v
```

Keycloak only imports `dev/saml/realm/heimdall-dev-realm.json` when the realm
does not already exist. Use reset and rebuild after editing the realm import:

```bash
docker compose -f dev/saml/docker-compose.yml down
docker compose -f dev/saml/docker-compose.yml up -d --build
```
