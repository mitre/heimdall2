# better-auth Plugin Catalog — Heimdall2 Assessment

Assessed 2026-05-31 against better-auth 1.6.13. 28 first-party plugins + 2 separate packages.

## Already Wired (feat/backend-modernization branch)

| Plugin | Purpose | Config |
|--------|---------|--------|
| admin | User management, roles, banning | Custom heimdallRoles (no impersonation) |
| bearer | Authorization: Bearer header support | Default config |
| openAPI | Swagger/OpenAPI endpoint documentation | Non-production only |
| genericOAuth | Okta + generic OIDC via discovery URL | Conditional on CLIENTID env vars |
| customSession | Surface forcePasswordChange in session | Always on |
| passwordPolicy | STIG password complexity (15+ chars, 4 classes, no 4+ consecutive) | Custom plugin, always on |
| ldap | LDAP/AD authentication | Vendored, conditional on LDAP_ENABLED |
| api-key | Personal Access Tokens with expiry, permissions, rate limiting | Conditional on API_KEY_SECRET |

## Should Wire — This PR or Next

| Plugin | Priority | Why | Air-gap safe? |
|--------|----------|-----|---------------|
| **organization** | P0 | Replaces Heimdall's custom Groups model (owner/member roles, group-owned evaluations). Provides invitations, RBAC, teams. | Yes |
| **two-factor** | P1 | TOTP + backup codes. STIG/DoD requires MFA. | Yes (TOTP is offline) |
| **@better-auth/sso** | P1 | Full SAML 2.0 SP. Replaces incomplete feat/saml-auth branch. ADFS, Okta SAML, Azure AD. Domain verification, InResponseTo validation. | Yes |
| **haveibeenpwned** | P2 | Breach checking via HIBP k-anonymity API. Complements passwordPolicy (complexity vs breach). **Must be conditional** — makes outbound HTTPS to api.pwnedpasswords.com, fails air-gapped. | NO — internet required |

## Consider Later

| Plugin | Priority | Why |
|--------|----------|-----|
| jwt | P2 | JWKS rotation, session-to-JWT exchange. Useful if Heimdall needs to issue tokens for cross-service auth or CLI. |
| captcha | P2 | Turnstile/reCAPTCHA/hCaptcha. Defense against credential stuffing on public instances. Not applicable air-gapped. |
| email-otp | P2 | Email-based OTP for verification flows. Weaker than TOTP for STIG but useful as fallback. |
| one-time-token | P2 | Ephemeral tokens (3-min TTL). CLI-to-web handoff, cross-domain session transfer. |
| last-login-method | P2 | Tracks which auth method was used per login. Low effort, audit value. |

## Not Applicable to Heimdall

| Plugin | Why Not |
|--------|---------|
| username | Heimdall uses email-based auth. LDAP handles username login. |
| magic-link | Bypasses STIG password requirements. Requires email infra. |
| anonymous | Security tool requires authenticated access. Evaluations must be attributable. |
| multi-session | Contradicts ONE_SESSION_PER_USER STIG requirement. |
| oidc-provider | Heimdall is an OIDC consumer, not provider. Deprecated — use @better-auth/oauth-provider. |
| mcp | MCP auth provider for AI tools. Not relevant to security results. |
| device-authorization | RFC 8628 device flow for TVs/IoT. Heimdall is a web app. |
| phone-number | SMS auth. No SMS infra in air-gapped/enterprise. |
| one-tap | Google One Tap popup. Already have Google OAuth. |
| siwe | Sign In With Ethereum. Zero relevance to government security. |
| oauth-proxy | Dev convenience for proxying OAuth callbacks. Low priority. |

## Notes

- **haveibeenpwned + passwordPolicy are complementary**: complexity (local check) + breach (network check). Both should be enabled where internet is available.
- **organization plugin covers ~60% of Heimdall's Groups**: membership, roles, invitations. GroupEvaluation (which evaluations belong to which group) and CASL per-row conditions remain custom.
- **@better-auth/sso includes OIDC discovery enhancement**: it can supplement or replace genericOAuth for OIDC providers that support full discovery.
- **two-factor supports trusted devices**: users can mark a device as trusted to skip 2FA for N days. Configurable.
