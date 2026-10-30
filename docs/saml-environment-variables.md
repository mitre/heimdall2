# SAML environment variables

> **Unmerged feature:** This document describes a separate authentication change.
> SAML is not available in this branch: its settings, routes, dependencies, and
> the strategy referenced by the coverage check below are not implemented here.
> These instructions apply only after that feature is merged.

Heimdall enables SAML when all four settings below have values. There is no dedicated SAML enablement flag. Configure `EXTERNAL_URL` for the deployment so the default callback URL points to its `/authn/saml/callback` endpoint, or set `SAML_CALLBACK_URL` explicitly. Register that URL as the assertion consumer service (ACS) at the identity provider (IdP).

```dotenv
SAML_NAME=Internal SSO
SAML_ENTRY_POINT=https://idp.example.com/saml/sso
SAML_ISSUER=https://heimdall.example.com
SAML_IDP_CERT=<Matching IdP signing certificate as PEM or base64 DER>
```

Replace the certificate placeholder with the matching IdP signing certificate. The example contains no usable credential.

Identity claims are scalar strings stored under flat attribute names. Configure each name as one literal key; URI punctuation and dots do not mean a nested path. Missing or empty required identity claims reject authentication before account creation.

```dotenv
SAML_NAME=Internal SSO
SAML_ENTRY_POINT=https://idp.example.com/saml/sso
SAML_ISSUER=https://heimdall.example.com
SAML_EMAIL_ATTRIBUTE=email
SAML_GIVEN_NAME_ATTRIBUTE=http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname
SAML_FAMILY_NAME_ATTRIBUTE=lastName
```

`SAML_IDP_CERT` must also contain the matching IdP signing certificate for this example.

## Value formats and validation

Remove unused optional settings from a real `.env`; the angle-bracket descriptions below are placeholders, not configuration values. Boolean settings accept `true` or `false`. Clock skew, assertion age, and request-ID expiration settings use milliseconds. `SAML_SCOPING_PROXY_COUNT` is a numeric count.

Query parameter, XML extension, and metadata settings use JSON with the object or array shape specified below. For example, `SAML_ADDITIONAL_AUTHORIZE_PARAMS='{"login_hint":"user@example.com"}'` supplies a query parameter. `SAML_SCOPING_IDP_LIST='[{"entries":[{"providerId":"https://idp.example"}]}]'` supplies an array of IdP lists; each list has an `entries` array and each entry requires `providerId`, with optional `name` and `loc`. A list may also include `getComplete`.

`SAML_AUTHN_CONTEXT` accepts comma-separated context URIs. `SAML_SCOPING_REQUESTER_ID` accepts one requester ID or comma-separated IDs. Both lists trim whitespace around each value. `SAML_XML_SIGNATURE_TRANSFORMS` accepts a JSON array of URI strings; its upstream default is `["http://www.w3.org/2000/09/xmldsig#enveloped-signature","http://www.w3.org/2001/10/xml-exc-c14n#"]`.

Private keys and public certificates are contents, not filesystem paths. For PEM values, preserve the header, footer, and line breaks inside a quoted value supported by the deployment's environment loader. `SAML_IDP_CERT` also accepts a base64 DER certificate.

`SAML_AUDIENCE=false` disables audience checking. `SAML_ACCEPTED_CLOCK_SKEW_MS=-1` disables timestamp checks, including the maximum-age check. `SAML_MAX_ASSERTION_AGE_MS=0` adds no maximum-age limit; the assertion's validity timestamps still apply unless timestamp checking is disabled. `SAML_VALIDATE_IN_RESPONSE_TO=never` disables response/request correlation; `ifPresent` checks it when supplied, and `always` requires it. Setting either signing requirement to `false` relaxes that requirement, but Node-SAML still requires a valid signature on the response or assertion even when both are `false`.

The logout and metadata settings are passed to Node-SAML. They do not create Heimdall logout or metadata routes; the implemented SAML endpoints are `GET /authn/saml` and `POST /authn/saml/callback`.

Heimdall supports only HTTP-Redirect for outgoing authentication requests. Setting `SAML_AUTHN_REQUEST_BINDING=HTTP-POST` rejects startup because Node-SAML's generated form conflicts with the application's content security policy. Use `HTTP-Redirect` or omit the setting. IdP responses still use the POST callback endpoint.

## Supported settings

Defaults describe Heimdall's strategy and its installed [Node-SAML 5.1.0 configuration](https://github.com/node-saml/node-saml/tree/v5.1.0#config-parameter-details).

```dotenv
## SAML Service
SAML_NAME=<Frontend provider name; required to enable SAML>
SAML_ENTRY_POINT=<IdP SSO URL; required to enable SAML>
SAML_ISSUER=<Heimdall service-provider entity ID; required to enable SAML>
SAML_IDP_CERT=<IdP signing certificate as PEM or base64 DER; required to enable SAML>
SAML_EMAIL_ATTRIBUTE=<Flat email attribute name; default=email>
SAML_GIVEN_NAME_ATTRIBUTE=<Flat given-name attribute name; default=firstName>
SAML_FAMILY_NAME_ATTRIBUTE=<Flat family-name attribute name; default=lastName>
SAML_CALLBACK_URL=<ACS URL; default=EXTERNAL_URL followed by /authn/saml/callback>
SAML_AUDIENCE=<Expected audience; default=SAML_ISSUER; false disables audience checking>
SAML_ACCEPTED_CLOCK_SKEW_MS=<Allowed clock skew in milliseconds; default=0; -1 disables timestamp checks>
SAML_MAX_ASSERTION_AGE_MS=<Maximum assertion age in milliseconds; default=0, no additional age limit>
SAML_REQUEST_ID_EXPIRATION_PERIOD_MS=<Request-ID cache lifetime in milliseconds; default=28800000>
SAML_VALIDATE_IN_RESPONSE_TO=<never, ifPresent, or always; default=never>
SAML_ADDITIONAL_PARAMS=<JSON object of query parameters for all requests; default={}>
SAML_ADDITIONAL_AUTHORIZE_PARAMS=<JSON object of authorization query parameters; default={}>
SAML_ADDITIONAL_LOGOUT_PARAMS=<JSON object of logout query parameters; default={}>
SAML_ALLOW_CREATE=<Allow creation of a new subject identifier; true or false; default=true>
SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX=<Attribute-consuming service index; optional, omitted by default>
SAML_AUTHN_CONTEXT=<Comma-separated context URIs; default=urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport>
SAML_AUTHN_REQUEST_BINDING=<HTTP-Redirect only; default=HTTP-Redirect; HTTP-POST is rejected at startup>
SAML_AUTHN_REQUEST_EXTENSIONS=<JSON object of AuthnRequest XML extensions; omitted by default>
SAML_DECRYPTION_PVK=<PEM private-key contents for encrypted assertions; omitted by default>
SAML_DIGEST_ALGORITHM=<sha1, sha256, or sha512; upstream default=sha1>
SAML_DISABLE_REQUEST_ACS_URL=<Omit ACS URL from requests; true or false; default=false>
SAML_DISABLE_REQUESTED_AUTHN_CONTEXT=<Omit requested auth context; true or false; default=false>
SAML_FORCE_AUTHN=<Force IdP reauthentication; true or false; default=false>
SAML_IDENTIFIER_FORMAT=<NameID format URI; default=urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress>
SAML_IDP_ISSUER=<Expected IdP issuer for supported logout validation; optional>
SAML_LOGOUT_CALLBACK_URL=<Single logout callback URL used in metadata; optional>
SAML_LOGOUT_REQUEST_EXTENSIONS=<JSON object of logout XML extensions; omitted by default>
SAML_LOGOUT_URL=<IdP logout URL; default=SAML_ENTRY_POINT>
SAML_METADATA_CONTACT_PERSON=<JSON contact-person array for metadata; optional>
SAML_METADATA_ORGANIZATION=<JSON organization object for metadata; optional>
SAML_PASSIVE=<Request passive authentication; true or false; default=false>
SAML_PRIVATE_KEY=<PEM private-key contents for signing requests; omitted by default>
SAML_PROVIDER_NAME=<ProviderName sent in AuthnRequest; optional; distinct from frontend SAML_NAME>
SAML_PUBLIC_CERT=<PEM public-certificate contents for signed requests/metadata; optional>
SAML_RAC_COMPARISON=<exact, minimum, maximum, or better; default=exact>
SAML_SCOPING_IDP_LIST=<JSON array of IdP lists, e.g. [{"entries":[{"providerId":"https://idp.example"}]}]; optional>
SAML_SCOPING_PROXY_COUNT=<Numeric proxy count; optional>
SAML_SCOPING_REQUESTER_ID=<Single requester ID or comma-separated IDs; optional>
SAML_SIGNATURE_ALGORITHM=<sha1, sha256, or sha512; upstream default=sha1>
SAML_SIGN_METADATA=<Sign generated metadata; true or false; default=false>
SAML_SKIP_REQUEST_COMPRESSION=<Skip request compression; true or false; default=false>
SAML_SP_NAME_QUALIFIER=<NameID service-provider qualifier; optional>
SAML_WANT_ASSERTIONS_SIGNED=<Require signed assertions; true or false; default=true>
SAML_WANT_AUTHN_RESPONSE_SIGNED=<Require signed response messages; true or false; default=true>
SAML_XML_SIGNATURE_TRANSFORMS=<JSON array of signature-transform URIs; upstream defaults are enveloped-signature and exclusive XML canonicalization>
```

## Authentication transaction sessions

Local, LDAP, and SAML authentication issue application JWTs. OIDC and Okta retain redirect state in an Express session, and Tenable stores remote credentials there. Node-SAML manages its own request-ID cache, separate from Express sessions, when response/request correlation is enabled. Heimdall retains the historical OAuth-or-Tenable session condition even though every individual OAuth strategy does not currently use session state. See [PR #2094](https://github.com/mitre/heimdall2/pull/2094), [PR #7032](https://github.com/mitre/heimdall2/pull/7032), [PR #6820](https://github.com/mitre/heimdall2/pull/6820), and the [Node-SAML 5.1.0 cache source](https://github.com/node-saml/node-saml/blob/v5.1.0/src/saml.ts#L130-L137).

## Documentation coverage check

Run from the repository root to compare the environment example and this document with every SAML setting read by the implementation:

```python
import re
from pathlib import Path

sources = [Path('apps/backend/src/authn/saml.strategy.ts'),
           Path('apps/backend/src/config/config.service.ts')]
used = set(re.findall(r'SAML_[A-Z0-9_]+', '\n'.join(p.read_text() for p in sources)))
for filename in ['apps/backend/.env-example', 'docs/saml-environment-variables.md']:
    documented = set(re.findall(r'^SAML_[A-Z0-9_]+(?==)', Path(filename).read_text(), re.M))
    assert used == documented, {'missing': sorted(used-documented),
                                'extra': sorted(documented-used)}
```
