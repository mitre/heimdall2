# better-auth Migration Research for Heimdall2

**Date:** 2026-05-31
**Scope:** Complete research for migrating Heimdall2 from Passport.js to better-auth
**Sources:** 10 parallel research agents covering docs, source code, npm, GitHub, examples

---

## 1. Executive Summary

better-auth is a strong fit for Heimdall2. It replaces Passport.js, 8 custom strategies, manual JWT handling, and express-session with a single unified auth framework. Key findings:

- **NestJS 11 + Express 5 already in our dependency tree** — `@thallesp/nestjs-better-auth` adapter is a direct fit
- **All 7 Heimdall auth providers have better-auth equivalents** (local, GitHub, GitLab, Google, Okta, OIDC, LDAP)
- **Custom bcrypt hashes migrate directly** — `password: { hash, verify }` config accepts our cost-14 `$2b$` hashes
- **CASL integration is straightforward** — `customSession` plugin attaches group data, ability factory receives `UserSession` instead of Sequelize `User`
- **Air-gap safe** — no telemetry by default, no native modules, no CDN dependencies, no frontend assets
- **One FIPS concern** — XChaCha20-Poly1305 is not FIPS-approved; avoidable by not using OAuth token encryption or JWE cookie cache

---

## 2. Version Compatibility

| Dependency | Heimdall2 Current | better-auth Requires | Status |
|---|---|---|---|
| NestJS | ^11.1.6 (installed: 11.1.24) | ^11.1.6 | MATCH |
| Express | 5.2.1 (via @nestjs/platform-express) | ^5.1.0 | MATCH |
| Node.js | 24.14.0 | >=18 | MATCH |
| PostgreSQL | 17 (Docker) | Any (via Drizzle/Kysely) | MATCH |

---

## 3. Architecture: What Replaces What

### Auth Providers

| Heimdall Current | File | better-auth Replacement | Config Path |
|---|---|---|---|
| passport-local | `local.strategy.ts` | `emailAndPassword: { enabled: true }` | Built-in |
| passport-github | `github.strategy.ts` | `socialProviders: { github: {...} }` | Built-in |
| passport-gitlab2 | `gitlab.strategy.ts` | `socialProviders: { gitlab: {...} }` | Built-in |
| passport-google-oauth | `google.strategy.ts` | `socialProviders: { google: {...} }` | Built-in |
| passport-openidconnect (Okta) | `okta.strategy.ts` | `genericOAuth({ config: [okta({...})] })` | Plugin |
| passport-openidconnect (OIDC) | `oidc.strategy.ts` | `genericOAuth({ config: [{discoveryUrl}] })` | Plugin |
| passport-ldapauth | `ldap.strategy.ts` | `better-auth-credentials-plugin` | Community |
| passport-headerapikey | `apikey.strategy.ts` | `@better-auth/api-key` | Plugin |
| passport-jwt | `jwt.strategy.ts` | `bearer()` plugin + DB sessions | Plugin |

### Guards

| Heimdall Current | better-auth Replacement |
|---|---|
| `JwtAuthGuard` | Global `AuthGuard` (auto-registered by `AuthModule.forRoot()`) |
| `LocalAuthGuard` | Not needed — better-auth handles `/api/auth/sign-in/email` |
| `APIKeyOrJwtAuthGuard` | Custom guard checking both `@Session()` and API key header |
| `ImplicitAllowJwtAuthGuard` | `@OptionalAuth()` decorator |
| `APIKeysEnabled` | Check `API_KEY_SECRET` env var (unchanged) |
| `TestGuard` | Unchanged |

### Session Management

| Aspect | Heimdall Current | better-auth |
|---|---|---|
| Token format | JWT (signed, self-contained) | Opaque random string (32 chars, ~190 bits entropy) |
| Storage | Stateless JWT + per-user jwtSecret | Database-backed session table |
| Cookie | Manual `res.cookie()` in controller | Auto-managed, HMAC-signed, httpOnly by default |
| Expiry | JWT_EXPIRE_TIME (default 60s!) | session.expiresIn (default 7 days) |
| Invalidation | Update user.jwtSecret (invalidates all JWTs) | Delete session row (per-session granularity) |
| Per-user sessions | ONE_SESSION_PER_USER flag | `session.revokeOtherSessions: true` |

### Models

| Heimdall Current | better-auth Equivalent | Notes |
|---|---|---|
| `User` (Sequelize) | `user` (Drizzle) | Custom fields via `additionalFields` |
| `Group` | `organization` | `public` flag needs additionalField |
| `GroupUser` | `member` | Direct mapping |
| `GroupEvaluation` | **None** | Custom table needed — better-auth doesn't manage domain objects |
| `ApiKey` | `apikey` | better-auth plugin has richer features (rate limit, permissions, expiry) |
| No equivalent | `session` | New — DB-backed sessions |
| No equivalent | `account` | New — links providers to users |
| No equivalent | `verification` | New — email verification, password reset tokens |

---

## 4. NestJS Integration

### Adapter: `@thallesp/nestjs-better-auth`

- **Version:** 2.6.0 | **Stars:** 543 | **License:** MIT
- **Zero runtime dependencies** | 19.3 kB packed
- **23 releases** in 10 months, last push 2026-05-22

### Setup Pattern

```typescript
// auth.ts — standalone config file (canonical pattern)
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, twoFactor, bearer, openAPI } from "better-auth/plugins";
import { genericOAuth, okta } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { sso } from "@better-auth/sso";
import { db } from "./db";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.EXTERNAL_URL,
  basePath: "/api/auth",
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (pw) => bcrypt.hash(pw, 14),
      verify: async ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  socialProviders: {
    github: { clientId: env.GITHUB_CLIENTID, clientSecret: env.GITHUB_CLIENTSECRET },
    gitlab: { clientId: env.GITLAB_CLIENTID, clientSecret: env.GITLAB_SECRET },
    google: { clientId: env.GOOGLE_CLIENTID, clientSecret: env.GOOGLE_CLIENTSECRET },
  },
  plugins: [
    admin(),
    bearer(),
    openAPI(),
    twoFactor({ issuer: "Heimdall" }),
    organization({ teams: { enabled: true } }),
    apiKey(),
    sso({ saml: {...}, oidc: {...} }),
    genericOAuth({ config: [
      okta({ clientId: env.OKTA_CLIENTID, clientSecret: env.OKTA_CLIENTSECRET, issuer: env.OKTA_ISSUER }),
      { providerId: "oidc", clientId: env.OIDC_CLIENTID, clientSecret: env.OIDC_CLIENT_SECRET, discoveryUrl: env.OIDC_ISSUER },
    ]}),
  ],
  session: { expiresIn: 86400 }, // 24 hours
  advanced: {
    cookiePrefix: "heimdall",
    defaultCookieAttributes: { httpOnly: true, secure: true, sameSite: "strict" },
  },
});

// app.module.ts
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./auth";

@Module({
  imports: [AuthModule.forRoot({ auth })],
})
export class AppModule {}

// CRITICAL: main.ts must disable body parser
const app = await NestFactory.create(AppModule, { bodyParser: false });
```

### Decorators Available

| Decorator | Purpose |
|---|---|
| `@Session()` | Param decorator — extracts `UserSession` from request |
| `@AllowAnonymous()` | Skip auth on a route |
| `@OptionalAuth()` | Allow unauthenticated, attach session if present |
| `@Roles(['admin'])` | System-level role check |
| `@OrgRoles(['owner'])` | Organization-level role check |
| `@UserHasPermission({...})` | Fine-grained permission check |
| `@MemberHasPermission({...})` | Org-scoped permission check |
| `@BeforeHook('/sign-in')` | Request lifecycle hook with NestJS DI |
| `@AfterHook('/sign-in')` | Response lifecycle hook |
| `@BeforeCreate('user')` | Database entity hook |
| `@AfterCreate('session')` | Database entity hook |

---

## 5. Plugin Ecosystem

### First-Party (built-in, `better-auth/plugins`)

| Plugin | Import | Tables | Key Features |
|---|---|---|---|
| `admin()` | built-in | Adds `role`, `banned` cols to user | 15 admin endpoints, impersonation, ban/unban |
| `twoFactor()` | built-in | `twoFactor` table | TOTP, backup codes, trusted devices |
| `organization()` | built-in | `organization`, `member`, `invitation` | Orgs, members, roles, invitations, optional teams |
| `bearer()` | built-in | none | `Authorization: Bearer <session_token>` support |
| `openAPI()` | built-in | none | Auto-generates OpenAPI spec for auth endpoints |
| `genericOAuth()` | built-in | uses `account` | Pre-configured: Okta, Keycloak, Auth0, Microsoft Entra ID, etc. |
| `customSession()` | built-in | none | Attach computed fields (groups, permissions) to every session |
| `testUtils()` | built-in | none | Test helpers: createUser, getAuthHeaders, getOTP |

### Separate Packages

| Plugin | Package | Tables | Key Features |
|---|---|---|---|
| API Key | `@better-auth/api-key` | `apikey` | Multi-config, permissions, rate limiting, expiry, refill |
| SSO | `@better-auth/sso` | `ssoProvider` | SAML 2.0 + OIDC, multi-IdP, domain routing |
| Passkey | `@better-auth/passkey` | `passkey` | WebAuthn/FIDO2 |

### Community

| Plugin | Package | Purpose | Maturity |
|---|---|---|---|
| LDAP | `better-auth-credentials-plugin` v0.5.2 | Generic credentials callback with LDAP example | 21 releases, single maintainer, pre-1.0 |
| Kerberos | None exists | Would need reverse-proxy approach or custom plugin | N/A |

---

## 6. Drizzle ORM Integration

### Schema Generation

`npx auth generate --output ./src/db/auth-schema.ts` produces full Drizzle `pgTable()` definitions including all plugin tables. However, production repos hand-write schemas for control over indexes, relations, and custom columns.

### Core Tables (PostgreSQL)

**user:** id (text PK), name, email (unique), emailVerified (bool), image, createdAt, updatedAt
**session:** id (text PK), expiresAt, token (unique), ipAddress, userAgent, userId (FK cascade), createdAt, updatedAt
**account:** id (text PK), accountId, providerId, userId (FK cascade), accessToken, refreshToken, idToken, scope, password (for credential accounts), createdAt, updatedAt
**verification:** id (text PK), identifier, value, expiresAt, createdAt, updatedAt

### Custom Fields for Heimdall User

```typescript
user: {
  additionalFields: {
    firstName: { type: "string", required: false },
    lastName: { type: "string", required: false },
    organization: { type: "string", required: false },
    title: { type: "string", required: false },
    forcePasswordChange: { type: "boolean", defaultValue: false },
    lastLogin: { type: "date", required: false },
    loginCount: { type: "number", defaultValue: 0 },
    passwordChangedAt: { type: "date", required: false },
    creationMethod: { type: "string", required: true },
  },
}
```

Note: `role` is handled by the `admin()` plugin. `encryptedPassword` moves to `account.password`. `jwtSecret` is no longer needed (DB sessions replace per-user JWT invalidation).

### Table/Column Remapping

```typescript
user: { modelName: "Users", fields: { email: "email", name: "firstName" } },
session: { modelName: "Sessions" },
```

### drizzle-zod Integration

```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import { user } from './auth-schema';
export const userInsertSchema = createInsertSchema(user);
```

Works directly with better-auth's generated/hand-written schema. This is the "one definition -> entire stack" pattern.

### Dual-ORM Coexistence (Sequelize + Drizzle)

- Both can point at the same PostgreSQL database safely
- **MUST turn off `synchronize: true` first** (izw.8) — Sequelize sync could drop Drizzle-added columns
- Separate migration tracking (SequelizeMeta vs __drizzle_migrations)
- Cannot share transactions across ORMs — migrate entire request paths atomically
- New tables (account, session, verification) have no Sequelize equivalent — good first targets

---

## 7. CASL Integration

### Migration Path

1. Add `user.additionalFields` for custom fields (role is via admin plugin)
2. Use `customSession` plugin to attach group memberships:
   ```typescript
   plugins: [customSession(async ({ user, session }) => {
     const groups = await findUserGroups(user.id);
     return { user: { ...user, groups }, session };
   })]
   ```
3. Change `CaslAbilityFactory.createForUser()` to accept `UserSession` instead of Sequelize `User`
4. All 16 CASL rules stay structurally identical — only the data source changes

### What CASL Handles vs. better-auth's Built-in AC

| Concern | Use CASL | Use better-auth |
|---|---|---|
| "Can user X read evaluation Y?" | YES — condition-based ABAC | No — too granular for resource+action model |
| "Is user X an admin?" | Either works | `@Roles(['admin'])` decorator |
| "Is user X an owner of org Y?" | Either works | `@OrgRoles(['owner'])` decorator |
| "Can user X manage group Z?" | YES — `$elemMatch` on membership | Partially — `hasPermission` checks |
| "Can anonymous user see public evals?" | YES — `createForAnonymous()` | No equivalent |

**Recommendation:** Keep CASL for evaluation/group-level authorization. Use better-auth decorators for simple role checks on routes.

---

## 8. Security Model

### Strengths

| Feature | Detail |
|---|---|
| Session tokens | 32-char opaque random (crypto.getRandomValues), HMAC-signed cookies |
| Cookie defaults | httpOnly: true, secure: auto, sameSite: "lax" |
| CSRF protection | Origin + Referer validation + Fetch Metadata headers (no CSRF tokens) |
| Rate limiting | Built-in, 100/60s default, per-path customizable |
| Password hashing | scrypt default, fully pluggable (we use bcrypt cost-14) |
| Secret rotation | Versioned secrets with envelope format ($ba$version$ciphertext) |
| OAuth security | email_verified checks, trusted provider list, encrypted token storage |
| Session granularity | Per-session revocation (vs Heimdall's all-or-nothing jwtSecret) |

### Gaps Requiring Custom Work

| Gap | Severity | Mitigation |
|---|---|---|
| Account lockout | Medium | Custom `databaseHooks` + failed attempt counter table |
| Password complexity | Low | Custom validation in `before` hook on sign-up |
| FIPS compliance | High (gov) | Avoid `encryptOAuthTokens` and JWE cookie cache (uses XChaCha20); use `compact` cache strategy (HMAC-SHA256 only) |
| Audit logging | Medium | Custom audit table + `databaseHooks` + `hooks.after` |
| Sentinel (bot detection) | Low | Paid plugin or custom implementation |

### FIPS Concern Detail

XChaCha20-Poly1305 is used for:
- OAuth token encryption (`encryptOAuthTokens: true`)
- JWE cookie cache (`cookieCache.strategy: "jwe"`)

**Neither is required.** Don't enable these features. Use:
- `cookieCache.strategy: "compact"` (HMAC-SHA256, FIPS-OK)
- Don't set `encryptOAuthTokens` (tokens stored in plaintext in DB, protected by DB-level encryption)

All other crypto (password hashing, session tokens, HMAC signing) uses FIPS-approved algorithms when using `node:crypto`.

---

## 9. Air-Gap Deployment

| Concern | Status | Detail |
|---|---|---|
| Telemetry | SAFE | Disabled by default. No hardcoded external URLs. |
| `npx auth migrate` | SAFE | Fully offline — reads local config, queries local DB |
| Native modules | SAFE | Zero native deps. All pure JS. Portable for RPM. |
| Social OAuth | SAFE | Just don't configure `socialProviders`. No errors. |
| LDAP | SAFE | Community plugin connects to internal LDAP server |
| Frontend assets | SAFE | Purely API — no login pages, CSS, or JS served |
| Crypto | SAFE | `node:crypto` primary (FIPS-compatible), `@noble/*` fallback |

---

## 10. Migration Strategy

### Phase 0: Prerequisites (before touching auth)
- Turn off `synchronize: true` (izw.8)
- Set up Drizzle alongside Sequelize
- Install better-auth + adapter + plugins

### Phase 1: Parallel Mount (coexistence)
- Mount better-auth on `/api/auth/*` via `AuthModule.forRoot()`
- Keep all existing Passport guards on existing routes
- Create the 4 core better-auth tables (user, session, account, verification)
- Write data migration: copy Users to better-auth user+account tables
- Test: can sign in via both old (`/authn/login`) and new (`/api/auth/sign-in/email`) paths

### Phase 2: Guard Swap
- Create new `BetterAuthGuard` using `@Session()` decorator
- Gradually swap `JwtAuthGuard` for `BetterAuthGuard` on each controller
- Update CASL factory to accept `UserSession`
- Add `customSession` plugin for group membership data

### Phase 3: Provider Migration
- Enable social providers in better-auth config
- Enable genericOAuth for Okta and OIDC
- Wire LDAP via credentials plugin
- Remove old Passport strategy files one by one

### Phase 4: Cleanup
- Remove `@nestjs/passport`, all passport-* packages
- Remove old authn.controller.ts routes
- Remove manual JWT signing/validation
- Remove express-session (better-auth manages its own sessions)
- Remove per-user jwtSecret column (sessions are DB-backed now)

### Env Var Mapping

| Heimdall Current | better-auth Equivalent |
|---|---|
| JWT_SECRET | BETTER_AUTH_SECRET |
| JWT_EXPIRE_TIME | session.expiresIn |
| API_KEY_SECRET | Managed by @better-auth/api-key |
| EXTERNAL_URL | baseURL config |
| GITHUB_CLIENTID/SECRET | socialProviders.github.clientId/clientSecret |
| GOOGLE_CLIENTID/SECRET | socialProviders.google.clientId/clientSecret |
| GITLAB_CLIENTID/SECRET | socialProviders.gitlab.clientId/clientSecret |
| OKTA_DOMAIN/CLIENTID/SECRET | genericOAuth okta() config |
| OIDC_ISSUER/CLIENTID/SECRET | genericOAuth custom config with discoveryUrl |
| LDAP_* | Credentials plugin callback config |
| ONE_SESSION_PER_USER | session.revokeOtherSessions |

---

## 11. Organization Plugin — Groups Migration

### What Maps Directly

| Heimdall | better-auth organization | Notes |
|---|---|---|
| Group.name | organization.name | Direct |
| Group.desc | organization.metadata or additionalField | Needs mapping |
| GroupUser (userId, groupId, role) | member (userId, organizationId, role) | Direct |
| role: 'owner'\|'member' | role: 'owner'\|'admin'\|'member' | Adds 'admin' |

### What Doesn't Map

| Heimdall | Gap | Solution |
|---|---|---|
| Group.public | No equivalent | `additionalField: { public: { type: "boolean" } }` |
| GroupEvaluation | No domain-object-to-org association | Custom `organizationEvaluation` join table |
| ensureGroupHasOwner | No auto-promotion | Implement in `afterRemoveMember` hook |
| syncUserGroups (OIDC) | No external group sync | Custom hook on OIDC login callback |
| CASL $elemMatch rules | Different paradigm | Keep CASL for evaluation-level authz |

### Assessment

The organization plugin covers ~60% of Heimdall's group system (membership, roles, invitations, teams). The critical 40% — associating evaluations with groups and CASL-style conditional authorization — remains custom. Worth adopting for the membership/role/invitation features, but not a complete replacement.

---

## 12. Testing Strategy

### Test Utilities

- `testUtils()` plugin: `createUser()`, `saveUser()`, `getAuthHeaders()`, `getOTP()`
- SQLite in-memory for fast isolated test runs
- `auth.$context` exposes test helpers

### NestJS Guard Testing

- **Unit tests:** Mock `auth.api.getSession()` injection token
- **Integration tests:** `AuthModule.forRoot()` with real better-auth instance + SQLite

### Pattern

```typescript
const ctx = await auth.$context;
const user = ctx.test.createUser({ email: "test@example.com" });
await ctx.test.saveUser(user);
const headers = await ctx.test.getAuthHeaders({ userId: user.id });
const session = await auth.api.getSession({ headers });
expect(session?.user.id).toBe(user.id);
```

---

## 13. Hooks and Audit Logging

### Request-Level Hooks

```typescript
hooks: {
  before: createAuthMiddleware(async (ctx) => {
    // Branch on ctx.path: '/sign-in/email', '/sign-up/email', etc.
    // Return new Response() to abort
  }),
  after: createAuthMiddleware(async (ctx) => {
    // ctx.context.returned has the response
    // Emit to @nestjs/event-emitter for audit logging
  }),
}
```

### Database Hooks

```typescript
databaseHooks: {
  user: { create: { after: async (user) => { /* audit */ } } },
  session: {
    create: { after: async (session) => { /* log sign-in */ } },
    delete: { after: async (session) => { /* log sign-out */ } },
  },
}
```

### NestJS DI Hooks (via adapter)

```typescript
@Injectable()
class AuditHooks {
  @AfterHook('/sign-in/email')
  async onSignIn(ctx) { /* has access to NestJS DI */ }

  @AfterCreate('session')
  async onSessionCreated(session) { /* entity hook */ }
}
```

---

## 14. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LDAP plugin pre-1.0 breaks | Medium | High | Pin version, write characterization tests, have fallback to direct ldapts usage |
| better-auth breaking changes (pre-2.0) | Low | Medium | Pin to 1.6.x, upgrade deliberately |
| NestJS adapter maintained by single dev | Medium | Low | MIT licensed, ~98KB, could vendor if abandoned |
| No CASL examples exist | Certain | Low | Integration is straightforward — just a user object shape change |
| FIPS audit flags XChaCha20 | Medium | High | Don't enable encryptOAuthTokens or JWE cache |
| GroupEvaluation not in org plugin | Certain | Medium | Custom join table, same pattern as today |
| ID type change (BIGINT -> text) | Certain | High | Requires FK migration across entire schema |

---

## 15. Effort Estimate

| Phase | Cards | SP | Claude-pace |
|---|---|---|---|
| Phase 0: Prerequisites (synchronize:true, Drizzle setup) | 2 | 8 | ~60 min |
| Phase 1: Parallel mount + data migration | 3 | 13 | ~120 min |
| Phase 2: Guard swap + CASL update | 2 | 8 | ~60 min |
| Phase 3: Provider migration (7 providers) | 4 | 13 | ~120 min |
| Phase 4: Cleanup + remove Passport | 2 | 5 | ~30 min |
| **Total** | **13** | **47** | **~390 min (~6.5h)** |

This supersedes the previous izw.16 estimate of sp:13/120min, which underestimated the scope.

---

## 16. FIPS Configuration Guide

### Required Settings for FIPS-Compliant Government Deployment

```typescript
export const auth = betterAuth({
  // Password: bcrypt cost-14 (NIST SP 800-63B approved)
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (pw) => bcrypt.hash(pw, 14),
      verify: async ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },

  // Session: DB-backed, HMAC-SHA256 signed cookies (FIPS-approved)
  session: {
    expiresIn: 86400,
    cookieCache: {
      enabled: true,
      maxAge: 300,
      // CRITICAL: use "compact" (HMAC-SHA256), NOT "jwe" (XChaCha20)
    },
  },

  // Cookies: strict for government
  advanced: {
    cookiePrefix: "heimdall",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    },
  },

  // DO NOT ENABLE — uses XChaCha20-Poly1305 (not FIPS-approved):
  // account: { encryptOAuthTokens: true },     // ← NEVER
  // session: { cookieCache: { strategy: "jwe" } }, // ← NEVER
});
```

### FIPS Algorithm Mapping

| Operation | Algorithm | FIPS 140-2/3 | Node.js Path |
|---|---|---|---|
| Session tokens | crypto.getRandomValues() | APPROVED | OS CSPRNG → OpenSSL |
| Cookie signing | HMAC-SHA256 | APPROVED | WebCrypto → OpenSSL |
| Cookie cache (compact) | HMAC-SHA256 | APPROVED | WebCrypto → OpenSSL |
| Password hashing | bcrypt cost-14 | APPROVED (SP 800-63B) | bcryptjs (pure JS) |
| Secret key derivation | SHA-256 | APPROVED | node:crypto → OpenSSL |
| Verification tokens | crypto.getRandomValues() | APPROVED | OS CSPRNG → OpenSSL |

### Features to NEVER Enable in FIPS Environments

| Feature | Config | Algorithm | Why |
|---|---|---|---|
| OAuth token encryption | `account.encryptOAuthTokens: true` | XChaCha20-Poly1305 | Not NIST-approved |
| JWE cookie cache | `session.cookieCache.strategy: "jwe"` | XChaCha20-Poly1305 | Not NIST-approved |

### Node.js FIPS Mode

Run Heimdall with `--enable-fips` on FIPS-configured RHEL:
```bash
node --enable-fips apps/backend/dist/main.js
```

All `node:crypto` calls route through OpenSSL's FIPS provider. The `@noble/*` fallback paths only activate on non-Node runtimes (edge, Deno) — never on RHEL servers.

---

## 17. Typesafe Environment Configuration

All environment variables are validated at startup via Zod in `apps/backend/src/env.ts`. This is the ONLY file that reads `process.env`. All other code imports the typed `env` object.

### Pattern
```typescript
import env from './env';  // typed, validated at startup
env.DATABASE_HOST          // string (default: '127.0.0.1')
env.DATABASE_PORT          // number (coerced, default: 5432)
env.GITHUB_CLIENTID        // string | undefined
env.NODE_ENV               // 'development' | 'production' | 'test'
```

### Production Guards (superRefine)
- `BETTER_AUTH_SECRET` or `JWT_SECRET` required
- `DATABASE_PASSWORD` required
- `EXTERNAL_URL` must be explicitly set (not the default)
- HTTPS enforced for: `OIDC_ISSUER`, `GITLAB_BASEURL`, `OKTA_DOMAIN`, `OKTA_ISSUER_URL`, `GITHUB_ENTERPRISE_INSTANCE_BASE_URL`, `EXTERNAL_URL`
- `OKTA_DOMAIN` required when `OKTA_CLIENTID` is configured

### Migration Notes
- `JWT_EXPIRE_TIME` default changed from `60s` to `1d` (the old 60s was a known bug)
- `OIDC_AUTHORIZATION_URL`, `OIDC_TOKEN_URL`, `OIDC_USER_INFO_URL` replaced by discovery-based flow via `OIDC_ISSUER`
- `NGINX_HOST` not included (reverse proxy config, not backend concern)

### Testing
Tests use `createAuth({ envOverrides: {...} })` to inject test values — no `process.env` mutation in test files (only `env.spec.ts` tests the env module itself).

---

## 18. Open Questions for User Decision

1. **Organization plugin adoption:** Use it for group membership/roles/invitations (replacing Group/GroupUser), or keep existing models and just replace auth?
2. **ID type migration:** better-auth uses text IDs (UUIDs). Heimdall uses BIGINT auto-increment. Full schema migration or mapping layer?
3. **API key approach:** Use `@better-auth/api-key` (richer features) or keep existing JWT-signature-based API keys?
4. **SAML/CAC priority:** Add `@better-auth/sso` now or defer to later phase?
5. **MFA:** Add `twoFactor()` plugin now or defer?
6. **Env var backwards compatibility:** Keep existing env var names (GITHUB_CLIENTID, etc.) or adopt better-auth conventions?
