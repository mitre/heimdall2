# ADR-004: Scoped REGISTRATION_DISABLED for Local and SSO Account Creation

**Status:** Proposed
**Date:** 2026-07-09
**Author:** Eugene Aronne, Aaron Lippold
**Branch:** `external_auth_provisioning_policy`
**Related:** Environment variables configuration, OAuth/OIDC authentication, LDAP authentication, user registration controls

---

## Glossary

| Term | Definition |
|------|------------|
| **SSO** | Single Sign-On - user authentication delegated to an external identity provider |
| **OAuth/OIDC** | External authentication protocols supported by Heimdall through Passport strategies |
| **External authentication provider** | GitHub, GitLab, Google, Okta, custom OIDC, LDAP, or another non-local login mechanism |
| **Local user** | A Heimdall database user record in the `users` table |
| **JIT provisioning** | Just-in-time account creation: creating a local Heimdall user automatically the first time a valid external identity logs in |
| **Local registration** | Self-service user creation through Heimdall's local registration endpoint |
| **SSO auto-account creation** | Creating a local Heimdall user record after a successful first-time external-authentication login |
| **Pre-provisioned user** | A local Heimdall user record created by an administrator before the user's first SSO login |

---

## 1. Context

### 1.1 The Problem

Heimdall currently supports two account-creation paths:

1. **Local registration:** a user creates an account through Heimdall's user registration endpoint.
2. **External authentication login:** a user authenticates with an external provider and Heimdall creates a local user record if one does not already exist.

The existing `REGISTRATION_DISABLED` environment variable only controls the local registration path. The external authentication path bypasses the local user registration controller and calls `AuthnService.validateOrCreateUser(...)` directly.

As a result, deployments can set:

```env
REGISTRATION_DISABLED=true
LOCAL_LOGIN_DISABLED=true
```

and still allow new local Heimdall accounts to be created when a previously unknown user successfully authenticates through SSO.

This is surprising for locked-down environments, but changing `REGISTRATION_DISABLED=true` to always block SSO JIT provisioning would break deployments that intentionally disable local registration while relying on SSO as the provisioning gate.

### 1.2 Current External Authentication Flow

The current flow for OAuth/OIDC-style login is:

1. User authenticates with the external identity provider.
2. The provider returns an email and profile details. (Email verification is checked by the GitHub and Google strategies, and by OIDC unless `OIDC_USES_VERIFIED_EMAIL=false`; the GitLab, Okta, and LDAP strategies do not check verification — see 6.3.)
3. The strategy calls `authnService.validateOrCreateUser(email, firstName, lastName, creationMethod)`.
4. `validateOrCreateUser(...)` looks up the user by email.
5. If the user exists, Heimdall updates profile metadata and login metadata.
6. If the user does not exist, Heimdall creates a local user with:
   - random password
   - role `user`
   - `creationMethod` set to the provider name
7. Login succeeds.

The `REGISTRATION_DISABLED` check is not part of this flow.

### 1.3 Desired Operator Controls

Administrators need to express four simple policies:

| Policy | Local registration | SSO auto-account creation |
|--------|--------------------|---------------------------|
| Allow both | Allowed | Allowed |
| Disable both | Rejected | Rejected |
| Disable local only | Rejected | Allowed |
| Disable SSO only | Allowed | Rejected |

This does not require provider-specific controls. Heimdall can keep one application-level registration setting while making the disabled scope explicit.

---

## 2. Decision

Change `REGISTRATION_DISABLED` from a boolean-only flag into a small, case-insensitive enum:

| `REGISTRATION_DISABLED` | Local registration | SSO auto-account creation |
|-------------------------|--------------------|---------------------------|
| unset | Allowed | Allowed |
| `false` | Allowed | Allowed |
| `true` | Rejected | Rejected |
| `local` | Rejected | Allowed |
| `sso` | Allowed | Rejected |

`true` disables both account-creation paths. This introduces a small breaking change for existing deployments that currently set `REGISTRATION_DISABLED=true` to disable local registration while still relying on SSO JIT provisioning. Those deployments should change to `REGISTRATION_DISABLED=local`.

`local` is the explicit spelling of the historical behavior where local public registration is disabled but SSO JIT provisioning remains enabled.

`sso` allows local registration but disables external-auth JIT creation. Be precise about what this guarantees: it prevents *silent* auto-provisioning. It does not by itself require administrator-created accounts, because local registration remains open — a user can self-register a local account with their IdP email and then sign in through SSO against it (see 6.3). Deployments that require administrator-gated provisioning should use `true`.

The `sso` scope governs **all** external authentication providers — GitHub, GitLab, Google, Okta, custom OIDC, **and LDAP** — because every provider strategy provisions through the same `AuthnService.validateOrCreateUser(...)` path (see 3.3). "SSO" in the value name is shorthand for external authentication generally, not OAuth/OIDC only.

Existing users are unaffected. If a local Heimdall account already exists with the email returned by the external identity provider, SSO login continues to work for all values.

Unknown values are rejected at startup (see 3.1) — a typo in a security-policy variable must never silently open both account-creation paths.

The default (unset) remains JIT-on. This is a deliberate backward-compatibility choice, not an oversight: [Gitea/Forgejo ship the equivalent setting off by default](https://docs.gitea.com/administration/config-cheat-sheet) (`ENABLE_AUTO_REGISTRATION`, default false), while [GitLab](https://docs.gitlab.com/integration/omniauth/) (`allow_single_sign_on`) and [Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/generic-oauth/) (`allow_sign_up`) default it on, as Heimdall does. Changing the default would break every existing SSO deployment on upgrade; locked-down environments opt in explicitly (8.2). In NIST SP 800-63C-4 terms ([Sec. 4.6.3, Provisioning Models](https://pages.nist.gov/800-63-4/sp800-63c.html)), JIT is "the most common form of provisioning in federation systems," and disabling it moves a deployment to the recognized pre-provisioning model.

---

## 3. Proposed Implementation

### 3.1 Configuration Service

Update `apps/backend/src/config/config.service.ts` so `isRegistrationAllowed()` accepts an optional scope.

```ts
type RegistrationScope = 'local' | 'sso';

isRegistrationAllowed(scope: RegistrationScope = 'local'): boolean {
  const registrationDisabled = this.get('REGISTRATION_DISABLED')?.trim().toLowerCase();
  return registrationDisabled !== 'true' && registrationDisabled !== scope;
}
```

Behavior:

| Call | Disabled when `REGISTRATION_DISABLED` is |
|------|------------------------------------------|
| `isRegistrationAllowed()` | `true` or `local` |
| `isRegistrationAllowed('local')` | `true` or `local` |
| `isRegistrationAllowed('sso')` | `true` or `sso` |

The default scope is `local`, so existing local-registration callers keep the same call shape and gain support for the new `local` value.

**Unknown values fail fast at startup.** With a boolean, an unrecognized value degrading to permissive was a bounded surprise. With this enum, a typo (`REGISTRATION_DISABLED=locel`) degrading to permissive silently opens BOTH account-creation paths — in a variable whose purpose is to deny. Validate at application bootstrap:

```ts
private static readonly VALID_REGISTRATION_VALUES = new Set([
  'false', 'true', 'local', 'sso'
]);

validateRegistrationDisabled(): void {
  const raw = this.get('REGISTRATION_DISABLED')?.trim();
  if (raw === undefined || raw === '') return; // unset/empty/whitespace-only = false (permissive)
  if (!ConfigService.VALID_REGISTRATION_VALUES.has(raw.toLowerCase())) {
    throw new Error(
      `Invalid REGISTRATION_DISABLED value "${raw}". ` +
      `Valid values: false, true, local, sso (case-insensitive).`
    );
  }
}
```

Called once during backend startup (alongside existing config initialization) so a misconfigured deployment refuses to boot with a clear message instead of running with an unintended registration policy.

Values are trimmed before validation and matching. Environment values delivered by Kubernetes manifests, systemd units, or shell exports can carry stray whitespace; `true ` (trailing space) is silently permissive today and must behave as `true` after this change — not refuse to start — while whitespace-only values are treated as unset.

Both halves of this design are well precedented. Boolean-to-enum with the boolean spellings kept as members: PostgreSQL's [`password_encryption`](https://www.postgresql.org/docs/release/10.0/) ("changed from boolean to enum" in v10) and [`synchronous_commit`](https://www.postgresql.org/docs/current/runtime-config-wal.html) ("Valid values are remote_apply, on (the default), remote_write, local, and off"), and systemd's [`ProtectHome=`](https://man7.org/linux/man-pages/man5/systemd.exec.5.html) ("Takes a boolean argument or the special values \"read-only\" or \"tmpfs\""). Strict validation of formerly-tolerated values: PostgreSQL 14 [removed the legacy boolean-like `password_encryption` values](https://www.postgresql.org/docs/release/14.0/) as a documented incompatibility, and Django 4.0 made previously-working [`CSRF_TRUSTED_ORIGINS` values invalid](https://docs.djangoproject.com/en/5.2/releases/4.0/) while pairing the change with an automated system check that names the required fix — the model for this ADR's startup error naming the valid values.

### 3.2 Local Registration Endpoint

No code change is required if existing callers continue to use:

```ts
this.configService.isRegistrationAllowed()
```

With the new default scope, local registration is rejected when:

```env
REGISTRATION_DISABLED=true
```

or:

```env
REGISTRATION_DISABLED=local
```

`isRegistrationAllowed()` has one other caller: `frontendStartupSettings()` in `config.service.ts` exposes it (default `local` scope) as `registrationEnabled`, which is served to the login page pre-authentication and controls the Sign Up button (`LocalLogin.vue`). No code change is required there either, but the per-value UI must be verified against the section 5 matrix: `sso` still shows Sign Up; `true` and `local` hide it. The `/signup` route remains directly navigable — the backend gate in `users.controller.ts` is authoritative, not the button visibility.

### 3.3 Authentication Service

Update `apps/backend/src/authn/authn.service.ts` inside `validateOrCreateUser(...)`.

Current behavior:

```ts
try {
  user = await this.usersService.findByEmail(email);
} catch {
  const randomPass = crypto.randomBytes(128).toString('hex');
  const createUser: CreateUserDto = {
    email,
    password: randomPass,
    passwordConfirmation: randomPass,
    firstName,
    lastName,
    organization: '',
    title: '',
    role: 'user',
    creationMethod
  };
  await this.usersService.create(createUser);
  user = await this.usersService.findByEmail(email);
}
```

Proposed behavior:

```ts
if (!email) {
  // A missing or empty email attribute is a provider/mapping problem, not a
  // provisioning-policy rejection — never report it as account_not_provisioned.
  throw new UnauthorizedException({
    message: 'External identity did not provide an email address.',
    error: 'external_identity_missing_email'
  });
}

try {
  user = await this.usersService.findByEmail(email);
} catch (err) {
  // findByEmail throws NotFoundException only for a missing user; database or
  // query failures must not be treated as "not provisioned".
  if (!(err instanceof NotFoundException)) {
    throw err;
  }

  if (!this.configService.isRegistrationAllowed('sso')) {
    throw new UnauthorizedException({
      message:
        'No Heimdall account exists for this SSO user. Please ask your system administrator to create the account.',
      error: 'account_not_provisioned'
    });
  }

  const randomPass = crypto.randomBytes(128).toString('hex');
  const createUser: CreateUserDto = {
    email,
    password: randomPass,
    passwordConfirmation: randomPass,
    firstName,
    lastName,
    organization: '',
    title: '',
    role: 'user',
    creationMethod
  };
  await this.usersService.create(createUser);
  user = await this.usersService.findByEmail(email);
}
```

This keeps provider strategies unchanged, with one exception. `LDAPStrategy.validate()` currently passes the un-awaited promise from `validateOrCreateUser(...)` to `done(...)`; today the rejection still propagates, but only because `@nestjs/passport` happens to await the resolved value — an undocumented internal. Because the `sso`/`true` rejection is a designed, high-frequency path, `validate()` must `await validateOrCreateUser(...)` and call `done(err)` on rejection so the failure flows through Passport's intended error path (Phase 8). GitHub, GitLab, Google, Okta, OIDC, and any other strategy that uses `validateOrCreateUser(...)` inherit the same SSO-scope policy with no change.

Two LDAP-specific input rules fall out of the email gate: Heimdall uses the FIRST value of a multi-valued LDAP mail attribute (`ldap.strategy.ts`), and LDAP value ordering is not guaranteed — operators pre-provisioning accounts must ensure the provisioned email is the attribute's primary/first value (see 8.2). A missing or empty mail attribute is rejected before the lookup with a distinct error code (`external_identity_missing_email`), never `account_not_provisioned`, and never reaches `findByEmail(undefined)`.

**Email normalization is part of this gate.** `findByEmail` is a case-sensitive exact match on a plain Postgres string column, and the users module performs no case normalization anywhere. IdPs routinely return mixed-case emails (`Jane.Doe@Agency.gov`), so without normalization the pre-provisioning model fails on case alone: the admin provisions `jane.doe@agency.gov`, the IdP returns mixed case, and the user is rejected under `sso`/`true` — or a duplicate account is created under permissive values. `validateOrCreateUser(...)` must trim and lowercase the external email before lookup and before create, and 8.2 documents the operator-side rule (store pre-provisioned emails lowercase). Known caveat: the `Users.email` unique constraint remains case-sensitive, so rows differing only by case can already coexist; full case-insensitive uniqueness (citext or a `lower(email)` unique index, plus normalizing local registration and local login) is a follow-on change, and the normalization here is scoped to the external-auth path this ADR touches.

All external-authentication strategies must continue to provision through `AuthnService.validateOrCreateUser(...)`. This is the architectural choke point for account creation, so future strategies such as SAML must use the same service method rather than creating Heimdall users directly. The invariant is about the policy, not the library: if the authentication stack is ever replaced, the replacement must re-home this gate at its single account-creation point — the `REGISTRATION_DISABLED` policy attaches to account creation, wherever that lives. [Mattermost documents the failure mode](https://docs.mattermost.com/administration-guide/configure/authentication-configuration-settings.html) of anything less than one choke point: its `EnableUserCreation` setting admits "LDAP and SAML users can always create a Mattermost account by logging in ... regardless of whether this configuration setting is enabled."

### 3.4 Environment Documentation and Samples

Update every repository surface that lists or examples environment variables, including Helm charts if present, to describe all supported values.

Known surfaces in the current `master` checkout:

| Surface | Required update |
|---------|-----------------|
| `apps/backend/.env-example` | Update `REGISTRATION_DISABLED` description |
| `manifest.yml.example` | Add or update a `REGISTRATION_DISABLED` example under `env:` |
| Helm chart `values.yaml` / `templates/*.yaml`, if present in the target branch or packaging path | Update any `REGISTRATION_DISABLED` value/comment and any generated environment variable list |
| Docker Compose examples / generated `.env` docs | Update only if they list `REGISTRATION_DISABLED` directly; current `docker-compose.yml` delegates to `.env` |
| Environment variables wiki | Update `REGISTRATION_DISABLED` wording and external-authentication behavior |
| `mitre/saf-packaging` (separate repo) | The Heimdall Server RPM ships a `backend.env` configuration file; update its `REGISTRATION_DISABLED` description. Outside this repository, so outside the section 11 audit's scope — listed here so Phase 9 does not miss it |
| Release notes / migration notes | Call out the new enum values |

Recommended wording for `.env-example`:

```env
REGISTRATION_DISABLED=<Controls account self-provisioning: false/unset allows local registration and SSO auto-account creation; true disables both; local disables local registration only; sso disables SSO auto-account creation only (defaults to false)>
```

Recommended manifest example:

```yaml
#REGISTRATION_DISABLED: 'false' # 'false' | 'true' | 'local' | 'sso' — string value; keep it quoted so YAML tooling does not type it as a boolean
```

External charts, manifests, or operators that model `REGISTRATION_DISABLED` as a boolean toggle must change it to a string field — `local` and `sso` are not booleans. Boolean renderings of the old values (`True`, `FALSE`, and so on) remain accepted case-insensitively.

### 3.5 Error Handling and Logging

When SSO auto-account creation is disabled and an external identity authenticates successfully but no local Heimdall user exists:

1. Do not create a user record.
2. Throw `UnauthorizedException` carrying BOTH a human-readable `message` and a machine-readable `error: 'account_not_provisioned'` (see the 3.3 snippet). A message string alone does not satisfy this contract — every layer between the service and the frontend must forward the structured code, not prose.
3. Log a structured event. "Structured" is specified, not aspirational — the backend's existing winston loggers emit prose with per-class printf formats, so this event pins its own shape: one JSON object logged as a single line, with exactly these fields:

   ```json
   {
     "event": "external_auth.login.rejected_not_provisioned",
     "provider": "<creationMethod>",
     "email": "<normalized external email>",
     "reason": "registrationDisabledForSso",
     "timestamp": "<ISO-8601>"
   }
   ```

   No password or token material. The sink is stdout (winston console transport), consistent with the rest of the backend; durable retention is the deployment's log-aggregation concern, and that boundary is stated here deliberately.
4. Preserve the `account_not_provisioned` code through to the frontend on BOTH transport paths:
   - **OAuth GET callbacks** (github/gitlab/google/okta/oidc): `AuthenticationExceptionFilter` catches the exception. Today it flattens everything into a human-readable `authenticationError` cookie and redirects to `/`; it gains a second cookie, `authenticationErrorCode`, carrying the code verbatim (see 3.6).
   - **POST login flows** (LDAP, local): these routes answer an XHR with JSON — no redirect, no cookie, and no exception filter. The code travels in the 401 response body (NestJS serializes the object form of `UnauthorizedException`), and the frontend login components map it (see 3.6).

The filter's diagnostic logging must also be constrained. `AuthenticationExceptionFilter` currently logs `request.query` and the complete `request.headers` at WARN on every caught error; OAuth callbacks arrive as `GET ?code=...&state=...` with cookie/authorization headers, and this ADR makes the filter a designed, potentially frequent rejection path. The filter must redact `code`/`state` query values and drop or allowlist headers (the existing `ConfigService.sensitiveKeys` list is the redaction reference) so the "no password or token material" rule in item 3 holds at every layer that handles the rejection, not just at the audit event.

The `message` below is the API- and log-facing string, and the fallback shown by clients that do not recognize the code; the login-page alert wording in 3.6 is what browser users see. It should be clear enough to route the user to an administrator:

```text
No Heimdall account exists for this SSO user. Please ask your system administrator to create the account.
```

### 3.6 Login Page Rendering

Preserving the `account_not_provisioned` code (3.5) is only half the contract — the login page must render it distinctly. An intentional policy rejection surfaced as a generic authentication failure is the exact risk 9.3 warns about.

Today, OAuth authentication failures reach the login page like this: `AuthenticationExceptionFilter` sets an `authenticationError` cookie containing free text and redirects to `/`, and `Login.vue`'s `checkForAuthenticationError()` renders that cookie as a generic transient snackbar. There is no query-parameter error channel for login failures (`?error`/`?logoff` drive logout messaging only), and the LDAP/local POST flows bypass the filter entirely — their errors surface only as the global axios interceptor's generic HTTP-failure snackbar.

The contract is therefore one rendering rule fed by two transports:

- **OAuth GET callbacks:** the filter sets a second cookie, `authenticationErrorCode`, carrying the structured code; `checkForAuthenticationError()` reads and clears both cookies.
- **LDAP/local POST logins:** the login component reads the code from the 401 JSON body (the axios error response) and feeds the same rendering rule. (`LDAPLogin.vue` currently has no error handler; it gains one under this ADR.)

When the code resolves to `account_not_provisioned` — from either transport — the frontend renders ONLY the dedicated alert below, suppressing the generic `authenticationError` snackbar and the generic HTTP-failure snackbar for that event. Codes the frontend does not recognize fall back to today's generic messages. The alert, above the login form:

```
┌────────────────────────────────────────────────────────┐
│  ⚠  Sign-in not completed                              │
│     Your identity was verified, but no Heimdall        │
│     account exists for you. Contact your Heimdall      │
│     administrator to request an account.               │
├────────────────────────────────────────────────────────┤
│   Email / Password fields, provider buttons…           │
└────────────────────────────────────────────────────────┘
```

The alert should name the provider the user attempted ("Your Okta identity was verified, but..."), following [GitLab's precedent](https://github.com/gitlabhq/gitlabhq/blob/master/spec/controllers/omniauth_callbacks_controller_spec.rb) ("Signing in using your SAML account without a pre-existing account ... is not allowed") — it materially helps users who clicked the wrong provider button. The provider name is already known to the client (the user clicked it) and discloses no configuration posture.

The alert must not disclose configuration posture beyond that (which policy value is set, which providers auto-create). On account enumeration, the reasoning is recorded here so security review does not re-litigate it: [OWASP ASVS 5.0.0 V6.3.8](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x15-V6-Authentication.md) requires that "valid users cannot be deduced from failed authentication challenges," and this alert is shown only after *successful* external identity validation — the requester already controls the identity being probed, so the alert reveals nothing an unauthenticated visitor can harvest. GitLab's flash message and Grafana's public "Sign up is disabled" disclose the same class of information. The documented anti-pattern sits on the other side: Keycloak surfaces this condition as a generic "Invalid username or password" ([keycloak#8900](https://github.com/keycloak/keycloak/issues/8900), closed not-planned), which is exactly the misleading generic failure 9.3 warns against.

### 3.7 Startup Migration Warning

The `true` semantics change breaks one specific cohort: deployments with `REGISTRATION_DISABLED=true` that rely on SSO JIT provisioning. Release notes are the weakest channel to reach them; the application itself can target them precisely at upgrade time.

At backend startup, when BOTH conditions hold:

- `REGISTRATION_DISABLED` resolves to `true`, and
- at least one external authentication strategy is enabled, defined as `ConfigService.enabledOauthStrategies()` returning a non-empty list OR `LDAP_ENABLED=true`. (Strategy *registration* cannot be the test: every strategy provider class is registered unconditionally in `authn.module.ts` regardless of configuration.)

log a single warning, emitted once from the bootstrap validation call — not re-emitted by later `isRegistrationAllowed()` reads:

```text
WARN: REGISTRATION_DISABLED=true disables SSO/LDAP auto-account creation as well as
local registration (changed in vX.Y). New external-authentication users will be
rejected until an administrator pre-creates their accounts. Set
REGISTRATION_DISABLED=local for the previous behavior (local registration disabled,
SSO auto-creation enabled). If pre-provisioned-only access is what you intend, no
action is needed.
```

This is a configuration-shape notice, not a one-time migration event: it fires on every boot for as long as the combination holds, including for the deliberately locked-down configuration recommended in 8.2. That is accepted for the vX.Y release cycle — the migration cohort (6.2) sees it at the moment they upgrade, and intentionally locked-down operators see a factual restatement of their policy; softening or removing it later is a one-line change. For the record, this goes deliberately one step beyond precedent: [Grafana paired its AngularJS behavior change with in-product warnings](https://grafana.com/docs/grafana/latest/developers/angular_deprecation/) during a transition window, but no surveyed project warns permanently on a still-valid value. The extension is justified because the `true` semantic change is itself permanent.

This is the minimum viable form of an operator advisory; an in-app admin notification mechanism is explicitly out of scope (9.4).

---

## 4. Why Not the Alternatives

### Option A: Keep `REGISTRATION_DISABLED` Boolean-Only and Apply to Both Paths

`REGISTRATION_DISABLED=true` would block both local registration and SSO auto-account creation.

**Pros:**
- Very simple mental model
- No new values to document
- Good locked-down default when set to `true`

**Cons:**
- Behavior change for deployments that set `REGISTRATION_DISABLED=true` but rely on SSO JIT provisioning
- Cannot express "local disabled, SSO JIT enabled"
- Cannot express "local enabled, SSO JIT disabled"

**Decision:** Reject. The enum keeps the simple one-variable model while allowing the needed deployment modes.

### Option B: Add `SSO_AUTO_CREATE_USERS_DISABLED`

Add a separate global environment variable:

```env
SSO_AUTO_CREATE_USERS_DISABLED=true
```

**Pros:**
- Explicit about the external-authentication path
- Allows local registration and SSO JIT provisioning to be controlled independently

**Cons:**
- Adds another account-creation flag administrators must understand
- Leaves the relationship between the two flags less obvious
- Requires combinations of two variables to express a single policy

**Decision:** Reject. Use one variable with explicit values.

### Option C: Add Provider-Specific SSO Controls

Add variables such as:

```env
OIDC_AUTO_CREATE_USERS_DISABLED=true
GOOGLE_AUTO_CREATE_USERS_DISABLED=true
GITHUB_AUTO_CREATE_USERS_DISABLED=true
```

**Pros:**
- Supports mixed-provider deployments with different risk profiles
- Allows one provider to auto-provision while another requires pre-created users

**Cons:**
- Larger configuration surface
- Larger test matrix
- Harder to explain than one registration policy
- Makes account creation depend on provider naming conventions

**Decision:** Reject for this ADR. Per-provider control is an established pattern — [GitLab's `allow_single_sign_on` accepts an array of providers](https://docs.gitlab.com/integration/omniauth/) and [Grafana's `allow_sign_up` is per-provider](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/generic-oauth/) — so if it becomes a real deployment requirement, it should be introduced in a later ADR as an explicit expansion of the registration model. The global-with-one-choke-point design chosen here avoids the documented failure mode of piecemeal scoping: [Mattermost's `EnableUserCreation`](https://docs.mattermost.com/administration-guide/configure/authentication-configuration-settings.html) concedes that "LDAP and SAML users can always create a Mattermost account by logging in ... regardless of whether this configuration setting is enabled."

### Option D: Remove SSO Auto-Creation Entirely

Require all SSO users to be pre-created regardless of environment configuration.

**Pros:**
- Strong default-deny posture
- Simple implementation

**Cons:**
- Breaks low-friction deployments
- Breaks existing environments that rely on IdP assignment as the provisioning gate
- Requires manual admin work for every new SSO user

**Decision:** Reject. Heimdall should still support SSO JIT provisioning when configured to do so.

### Option E: Approval Queue (Create-but-Block Pending Admin Approval)

GitLab's `block_auto_created_users` pattern (which [defaults to true](https://docs.gitlab.com/integration/omniauth/) — "Places automatically-created users in a pending approval state (unable to sign in) until they are approved by an administrator"): the JIT user record is created on first SSO login but blocked until an administrator approves it. Default-deny access with zero manual email matching — the record self-creates with the IdP-correct email, and the approval click is itself the auditable admin action. GitLab pairs the state with a dedicated user message ("Your account is pending approval from your GitLab administrator and hence blocked", state key [`blocked_pending_approval`](https://github.com/gitlabhq/gitlabhq/blob/master/config/locales/devise.en.yml)) and it preserves admin authorization (NIST AC-2e) while capturing the provisioning request for an admin queue instead of losing it.

**Pros:**
- Best operator experience for locked-down deployments (no pre-provisioning typos, one-click approval)
- Account-creation and approval events form a complete audit trail

**Cons:**
- Requires a pending/blocked user state and an admin approval UI — substantially larger scope
- Not expressible in this ADR's model: "approval" is not a kind of "disabled," so it can never be a `REGISTRATION_DISABLED` value

**Decision:** Reject for this ADR. If an approval workflow becomes a real requirement, it must be introduced as a **separate mechanism in its own ADR** — explicitly NOT as an additional `REGISTRATION_DISABLED` value. This note exists so a future contributor does not attempt `REGISTRATION_DISABLED=sso-approval` and turn the enum into a policy grab-bag.

**Composition rule for any future provisioning variable:** a later mechanism (approval queue, per-provider controls, or any other provisioning mode) must define its interaction with every `REGISTRATION_DISABLED` value in its own ADR, and contradictory combinations must fail startup the same way unknown enum values do (3.1) — two provisioning policies that disagree silently is the same class of bug as a typo degrading to permissive.

---

## 5. Behavior Matrix

| Scenario | Local user exists? | External auth succeeds? | `REGISTRATION_DISABLED` | Result |
|----------|--------------------|--------------------------|-------------------------|--------|
| Existing OIDC user signs in | Yes | Yes | any | Login succeeds |
| Existing GitHub user signs in | Yes | Yes | any | Login succeeds |
| Unknown OIDC user signs in | No | Yes | unset / `false` | User is created; login succeeds |
| Unknown OIDC user signs in | No | Yes | `true` | Login rejected; user is not created |
| Unknown OIDC user signs in | No | Yes | `local` | User is created; login succeeds |
| Unknown OIDC user signs in | No | Yes | `sso` | Login rejected; user is not created |
| Unknown LDAP user signs in | No | Yes | unset / `false` / `local` | User is created; login succeeds (LDAP uses the same `validateOrCreateUser` gate) |
| Unknown LDAP user signs in | No | Yes | `true` / `sso` | Login rejected; user is not created |
| SSO user has a local account under a different email | No matching email | Yes | unset / `false` / `local` | A new local user may be created for the IdP email; the existing mismatched account is not used |
| SSO user has a local account under a different email | No matching email | Yes | `true` / `sso` | Login rejected; pre-provisioned users must exactly match the IdP email |
| User self-registers locally with their IdP email, then signs in via SSO | Yes (self-created) | Yes | `sso` | Login succeeds — the SSO login binds to the self-registered account. `sso` blocks silent JIT only; it does not enforce admin-gated provisioning while local registration is open (see 6.3) |
| Unknown user fails IdP authentication | No | No | any | Login rejected by provider strategy |
| Local public registration | No | n/a | unset / `false` | User creation follows existing local-registration behavior |
| Local public registration | No | n/a | `true` | Rejected unless current user has registration-bypass permission |
| Local public registration | No | n/a | `local` | Rejected unless current user has registration-bypass permission |
| Local public registration | No | n/a | `sso` | User creation follows existing local-registration behavior |
| Local username/password login | Yes | n/a | any | Controlled by `LOCAL_LOGIN_DISABLED`, unchanged |

---

## 6. Security and Compliance Considerations

### 6.1 Positive Security Effects

- Supports default-deny local and SSO account self-provisioning with `REGISTRATION_DISABLED=true`.
- Separates identity authentication from Heimdall application authorization with `REGISTRATION_DISABLED=sso`.
- Preserves low-friction SSO provisioning with `REGISTRATION_DISABLED=local`.
- Keeps account-creation policy in a single environment variable.
- Avoids provider-specific configuration unless future requirements justify it.

**NIST SP 800-53 rev 5 mapping.** Heimdall deployers cite account-management controls in ATO documentation; this feature is the mechanism for several of them:

| Control | Text (rev 5) | How this feature satisfies it |
|---------|--------------|-------------------------------|
| AC-2a | "Define and document the types of accounts allowed and specifically prohibited" | The four `REGISTRATION_DISABLED` values are the documented account-creation policy |
| AC-2e | "Require approvals by [org-defined personnel or roles] for requests to create accounts" | `true`/`sso` make administrator pre-provisioning the only external-account path; with JIT on, the federation trust itself must be the documented authorization |
| AC-2f | "Create, enable, modify, disable, and remove accounts in accordance with [org-defined policy]" | Creation is policy-controlled here; note Heimdall currently has no account *disable* capability (6.3) |
| AC-2(1) | Automated system account management | The enforcement is automated at the provisioning choke point (3.3) |
| IA-4a | "Receiving authorization ... to assign an individual ... identifier" | Pre-provisioning under `true`/`sso` is the authorization step for the email identifier binding |
| IA-4d | "Preventing reuse of identifiers for [org-defined time period]" | With email as the binding key, reuse prevention is delegated to the IdP — a residual risk documented in 6.3 |

In [NIST SP 800-63C-4](https://pages.nist.gov/800-63-4/sp800-63c.html) (final, July 2025) vocabulary, Sec. 4.6.3 recognizes exactly the two models this enum switches between: just-in-time provisioning ("the most common form of provisioning in federation systems") and pre-provisioning. Note 4.6.3 states JIT accounts are "bound to the federated identifier in the assertion used to provision them" — Heimdall's email-only binding does not yet satisfy that (see 6.3).

### 6.2 Backwards Compatibility

Current boolean values keep their intuitive meaning:

- unset / `false`: local registration and SSO auto-account creation are allowed
- `true`: local registration and SSO auto-account creation are disabled

**This is a breaking change** for deployments that currently set `REGISTRATION_DISABLED=true` but rely on SSO JIT provisioning, and it is communicated through three required channels (not optional):

| Channel | Content |
|---------|---------|
| Release notes + wiki migration note + version-pinned upgrade-notes entry (required deliverable, Phase 9) | Who is affected: `true` + SSO-JIT reliance. Symptom: new SSO/LDAP users rejected with `account_not_provisioned`. Fix: `REGISTRATION_DISABLED=local`. A version-specific upgrade-notes entry is required, not just a changelog line — [GitLab's process](https://docs.gitlab.com/update/plan_your_upgrade/) trains operators to consult upgrade notes before upgrading, and its deprecation policy states "The burden is on GitLab, not the customer, to own change management" |
| Startup warning (3.7) | Reaches every `true` + external-auth deployment on every boot; the migration cohort sees it at the moment they upgrade, and intentionally locked-down deployments see a factual restatement of their policy |
| Login page alert (3.6) | Affected end users get remediation guidance instead of a generic failure |

Those deployments should change to:

```env
REGISTRATION_DISABLED=local
```

Deployments that want local registration enabled but SSO users pre-provisioned should set:

```env
REGISTRATION_DISABLED=sso
```

**A second cohort also breaks: previously-tolerated invalid values.** Today any value other than case-insensitive `true` — `1`, `yes`, `disabled`, typos — runs silently permissive. After this change those deployments refuse to start with an error naming the valid values (3.1). No pre-upgrade channel reaches them (the startup warning requires a successful boot; the boot error itself arrives only after the outage begins), so the Phase 9 release note must instruct operators to check their `REGISTRATION_DISABLED` value against the enum before upgrading.

**Upgrade ordering and rollback:** on any pre-upgrade backend, `local` and `sso` read as "not `true`" — fully permissive, BOTH account-creation paths open, with a clean boot and no warning. Set `REGISTRATION_DISABLED=local` or `sso` only after ALL backend instances run vX.Y or later (rolling deploys included). If rolling back below vX.Y, revert `REGISTRATION_DISABLED` to `true` first.

### 6.3 Residual Risks

- Existing auto-created users remain in the database after SSO auto-account creation is disabled — disabling creation does not touch previously auto-created accounts (NIST AC-2f's "disable and remove" half; SP 800-63C-4 Sec. 4.6.7 covers time-based RP account removal as the eventual model).
- Administrators must remove unwanted existing accounts, and removal currently means **deletion**: Heimdall has no user disable/deactivate flag, and deleting a user affects the evaluations and data that user owns. An account-disable capability is a candidate follow-on (it would also complete the AC-2f mapping in 6.1).
- **Self-registration bypass under `sso` — the Classic-Federated Merge (CFM) attack.** With local registration open and no email-ownership verification at registration (Heimdall has none), anyone can register an account with any email. A legitimate user can self-provision this way (see the section 5 matrix row), and an attacker can pre-register a victim's email before the victim's first SSO login — the victim's SSO login then binds to an account whose password the attacker set. This is the CFM class from [Sudhodanan & Paverd, USENIX Security 2022](https://www.usenix.org/conference/usenixsecurity22/presentation/sudhodanan) (Sec. 4.1: "the attacker uses the victim's email address to create an account via the classic approach, and the victim subsequently creates an account via the federated approach ... both the victim and the attacker having access to the same account"). The paper's primary mitigation is blocking email verification at registration, which Heimdall lacks (12.4). Interim operator guidance: deployments that need admin-gated provisioning use `true`, which closes both creation paths; and [NIST SP 800-63C-4 Sec. 3.8.1](https://pages.nist.gov/800-63-4/sp800-63c.html) ("the RP SHALL require an authenticated session with the subscriber account for all linking functions") is the standard Heimdall's silent bind-on-email does not yet meet — [Mattermost refuses this auto-bind outright](https://github.com/mattermost/mattermost/blob/master/server/channels/app/user.go), and Keycloak's documented alternative is re-authentication before linking.
- **Email address matching remains the account binding mechanism, and it is the wrong long-term key.** [OIDC Core 1.0 Sec. 5.7](https://openid.net/specs/openid-connect-core-1_0.html): "The sub (subject) and iss (issuer) Claims, used together, are the only Claims that an RP can rely upon as a stable identifier for the End-User" — the same section permits issuers to re-use an email across different end-users over time (recycled contractor emails inherit the departed user's pre-provisioned account). [OWASP ASVS 5.0.0 V10.5.2](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x19-V10-OAuth-and-OIDC.md) requires identifying users by `sub`; SP 800-63C-4 Sec. 3.4 defines the federated identifier as subject + issuer, and its FAL2 bar (Sec. 2.3) prohibits plaintext email as the identifier outright. The remedy — a provider-identities table binding `iss`+`sub` per user, with email as the one-time bootstrap match only — is a schema change **out of scope here and recorded as the named future ADR** this section's residual risks converge on. Until then, email binding is accepted, documented debt.
- If an IdP allows user-editable or unverified email claims, an external identity could bind to someone else's pre-provisioned Heimdall account. Under `sso`/`true` the deployment model is pre-provisioned (often privileged) accounts, so this is an account-takeover risk, not merely an unwanted-account risk. The requirement that SSO providers return verified, administrator-controlled email attributes is enforced unevenly by the shipped strategies: GitHub and Google check the provider's verified flag; OIDC checks `email_verified`, but `OIDC_USES_VERIFIED_EMAIL=false` disables that check; GitLab and Okta perform no verification check; LDAP trusts whatever attribute `LDAP_MAILFIELD` names. Two mitigations are in scope: (1) log a startup warning when `OIDC_USES_VERIFIED_EMAIL=false` is combined with `REGISTRATION_DISABLED=sso` or `true`, and (2) the Phase 9 documentation must tell 8.2/8.4 operators that email claims must be administrator-controlled at the IdP, and which knobs weaken that.
- IdP-side access control is still required to prevent users from reaching the SSO callback flow.
- Deployments cannot express per-provider SSO provisioning preferences with this ADR.

---

## 7. Testing Strategy

### 7.1 ConfigService Tests

Add tests for `ConfigService.isRegistrationAllowed(scope?)`:

| `REGISTRATION_DISABLED` | `isRegistrationAllowed()` | `isRegistrationAllowed('local')` | `isRegistrationAllowed('sso')` |
|-------------------------|---------------------------|----------------------------------|--------------------------------|
| unset | `true` | `true` | `true` |
| `false` | `true` | `true` | `true` |
| `FALSE` | `true` | `true` | `true` |
| `true` | `false` | `false` | `false` |
| `TRUE` | `false` | `false` | `false` |
| `local` | `false` | `false` | `true` |
| `LOCAL` | `false` | `false` | `true` |
| `sso` | `true` | `true` | `false` |
| `SSO` | `true` | `true` | `false` |

Startup validation tests (`validateRegistrationDisabled()`, per 3.1):

| `REGISTRATION_DISABLED` | Startup |
|-------------------------|---------|
| unset | Boots (permissive) |
| `` (empty string) | Boots (treated as unset) |
| `   ` (whitespace only) | Boots (trimmed; treated as unset) |
| `false` / `true` / `local` / `sso` (any case) | Boots |
| ` true ` (padded) | Boots as `true` (trimmed before matching) |
| `1` / `yes` / `0` (previously silently permissive) | Refuses to start, error names valid values |
| `banana` | Refuses to start, error names valid values |
| `ture` (typo) | Refuses to start |
| `sso-approval` | Refuses to start |

Startup warning tests (3.7):

1. `true` + at least one OAuth strategy configured (e.g. OIDC only) → warning logged.
2. `true` + LDAP only (`LDAP_ENABLED=true`, no OAuth client IDs) → warning logged. Detection must cover both provider families, not just OAuth.
3. `true` + no external strategies → no warning.
4. `local` / `sso` / unset → no warning.
5. "Logged once" means emitted from the one-time bootstrap validation call: assert with a logger spy that repeated `isRegistrationAllowed()` calls after boot do not re-emit it.

### 7.2 AuthnService Tests

Add tests for `validateOrCreateUser(...)`:

1. Existing SSO user is returned regardless of `REGISTRATION_DISABLED`.
2. Missing SSO user is created when `REGISTRATION_DISABLED` is unset.
3. Missing SSO user is created when `REGISTRATION_DISABLED=false`.
4. Missing SSO user is created when `REGISTRATION_DISABLED=local`.
5. Missing SSO user throws `UnauthorizedException` when `REGISTRATION_DISABLED=true`.
6. Missing SSO user throws `UnauthorizedException` when `REGISTRATION_DISABLED=sso`.
7. Missing SSO user with SSO creation disabled does not call `usersService.create(...)`.
8. Missing SSO user with SSO creation disabled emits a structured audit event.
9. Missing SSO user with SSO creation disabled propagates a stable `account_not_provisioned` error code to the callback / frontend flow.
10. Existing user profile updates and login metadata updates are unchanged.
11. The thrown error does not leak sensitive profile data. (Provider tokens never reach `validateOrCreateUser(...)` — its arguments are email, names, and `creationMethod` — so token-leak coverage lives at the filter layer, 7.5.)
12. A `findByEmail` failure that is NOT `NotFoundException` (e.g. a database error) is rethrown unchanged: no `account_not_provisioned` code, no `registrationDisabledForSso` audit event, no user creation.
13. A missing/empty email from the provider is rejected with `external_identity_missing_email` before any lookup — never `account_not_provisioned`.
14. Email normalization: a mixed-case IdP email (`Jane.Doe@Agency.gov`) matches a pre-provisioned lowercase account under `sso`/`true`, and under permissive values does NOT create a case-variant duplicate account.

### 7.3 Local Registration Tests

Update local user creation tests to cover:

1. Local registration allowed when unset / `false`.
2. Local registration rejected when `true`.
3. Local registration rejected when `local`.
4. Local registration allowed when `sso`.
5. Existing administrator bypass behavior remains unchanged for disabled local registration.

### 7.4 Strategy Integration Tests

No provider-specific policy logic should be required in strategy classes, but at least one OAuth/OIDC strategy test should verify the end-to-end flow:

1. Strategy receives a valid verified external identity.
2. Strategy calls `validateOrCreateUser(...)`.
3. `validateOrCreateUser(...)` rejects a missing user when `REGISTRATION_DISABLED=sso`.
4. `validateOrCreateUser(...)` rejects a missing user when `REGISTRATION_DISABLED=true`.
5. The login fails without creating a local user.

OIDC is the preferred coverage target because custom OIDC is the most common enterprise SSO integration point.

LDAP already calls `validateOrCreateUser(...)`, so LDAP is covered by the same AuthnService gate — once the strategy is fixed to `await` the call (3.3, Phase 8). Add an LDAP rejection regression test: a valid LDAP bind for a user with no Heimdall account under `REGISTRATION_DISABLED=sso` fails with `account_not_provisioned` and does not create a user.

Two facts about the current test surface shape this section:

- No backend spec exercises `validateOrCreateUser(...)` today — there is no `authn.service.spec.ts`, and the only existing `REGISTRATION_DISABLED` test covers `true` in `users.controller.spec.ts`. Every 7.2 test is new code, not an update.
- The tests that actually depend on JIT auto-creation are the Cypress e2e logins (`test/integration/login.cy.ts` creates the LDAP user on first login), and CI's `.env-ci` never sets `REGISTRATION_DISABLED`. At least one automated end-to-end (or database-backed integration) test must run with `REGISTRATION_DISABLED=sso` and assert BOTH the rejection and that no `Users` row was created; Phase 8 owns the CI environment plumbing this requires.

### 7.5 Exception Filter Tests

`AuthenticationExceptionFilter` is where the structured code can be lost and where secrets can leak; both get direct tests:

1. Given an `UnauthorizedException` carrying `error: 'account_not_provisioned'`, the filter emits a response from which the frontend can recover the exact code string (the `authenticationErrorCode` cookie), and the 302 redirect to `/` completes.
2. Given a generic authentication failure with no structured code, the filter behaves as today: `authenticationError` cookie only, no code cookie.
3. The filter's WARN log for a rejection excludes authorization/cookie headers and redacts `code`/`state` query values (3.5).

### 7.6 Frontend Tests

The 3.6 rendering contract is frontend behavior and needs frontend tests:

1. `Login.vue` receiving the `account_not_provisioned` signal (cookie transport) renders the dedicated alert — not the generic `authenticationError` snackbar.
2. The LDAP login flow receiving a 401 body with `account_not_provisioned` renders the same dedicated alert — not the generic HTTP-failure snackbar.
3. The alert text contains the remediation guidance and does NOT contain the `REGISTRATION_DISABLED` value, the enabled-provider list, or any other configuration posture.
4. A generic authentication failure still renders the existing generic message (no regression).

---

## 8. Migration and Operations

### 8.1 Default Migration

No migration is required for deployments that do not set `REGISTRATION_DISABLED`. The default remains equivalent to:

```env
REGISTRATION_DISABLED=false
```

Missing SSO users continue to be auto-created by default.

### 8.2 Locked-Down Deployment

Recommended configuration for deployments that require explicit user provisioning for both local and SSO users:

```env
REGISTRATION_DISABLED=true
```

Optional, if local username/password login should also be disabled:

```env
LOCAL_LOGIN_DISABLED=true
```

**Caveat — order matters:** the user-creation endpoint (`POST /users`) is blocked for everyone when `LOCAL_LOGIN_DISABLED=true`, including administrators — the local-login check in `users.controller.ts` runs before, and independently of, the admin registration-bypass. Pre-provision all accounts BEFORE setting `LOCAL_LOGIN_DISABLED=true`; adding a user later requires temporarily re-enabling local login (config change + restart). Splitting admin user creation out of `LOCAL_LOGIN_DISABLED` is open question 12.3.

Operational steps:

1. Create or import local Heimdall user records for approved users.
2. Ensure each local user email exactly matches the email returned by the IdP, and store it lowercase — Heimdall normalizes external emails to lowercase before matching (3.3). For LDAP, Heimdall binds to the FIRST value of a multi-valued mail attribute — make the provisioned email the attribute's primary/first value.
3. Assign the same users to the Heimdall app in the IdP.
4. Set `REGISTRATION_DISABLED=true`.
5. Remove any previously auto-created users that should not retain access.

### 8.3 SSO JIT With Local Registration Disabled

Recommended configuration for deployments that use SSO as the provisioning gate:

```env
REGISTRATION_DISABLED=local
```

If local username/password login should also be disabled:

```env
LOCAL_LOGIN_DISABLED=true
```

Apply the upgrade-ordering rule in 6.2: set `local` only after all backend instances run vX.Y or later — older code reads `local` as fully permissive.

### 8.4 Local Registration With SSO Pre-Provisioning

Recommended configuration for deployments that allow local registration but require SSO users to already exist:

```env
REGISTRATION_DISABLED=sso
```

The same upgrade-ordering rule applies (6.2): older code reads `sso` as fully permissive.

---

## 9. Consequences

### 9.1 Positive

- One environment variable expresses all four account-creation policies.
- `REGISTRATION_DISABLED=true` gives locked-down deployments an explicit default-deny setting.
- `REGISTRATION_DISABLED=local` provides a migration path for existing local-registration-only deployments.
- `REGISTRATION_DISABLED=sso` supports pre-provisioned SSO without disabling local registration.
- Provider strategies remain simple and unchanged.

### 9.2 Negative

- `REGISTRATION_DISABLED` is no longer boolean-only.
- Documentation must be updated everywhere the environment variable is listed.
- Deployments using strict boolean validators in external Helm charts or platform tooling may need updates.
- Deployments cannot express different auto-account-creation preferences per SSO provider.
- Deployments that currently use `REGISTRATION_DISABLED=true` while relying on SSO JIT provisioning must change to `REGISTRATION_DISABLED=local`.

### 9.3 Risks

- Both transports (the OAuth callback cookie and the POST 401 body) must preserve the `account_not_provisioned` error code; otherwise users see a generic authentication failure with no remediation guidance. The filter and frontend tests (7.5, 7.6) exist to hold this.
- The tests that assume missing external users are always created are the Cypress e2e logins (7.4); no backend spec exercises `validateOrCreateUser(...)` today, so the 7.2 suite is new coverage, not an update.
- Future external-authentication strategies must continue to use `validateOrCreateUser(...)` so they do not bypass the shared provisioning gate.
- Admin user-management workflows may be awkward when `LOCAL_LOGIN_DISABLED=true`.

### 9.4 What's NOT in Scope

- Role mapping from IdP claims to Heimdall roles
- Group-based automatic user authorization
- SCIM provisioning
- Bulk user import
- Provider-specific auto-create flags
- Deleting existing auto-created users
- Redesigning admin user creation when local login is disabled
- Approval-queue provisioning (create-but-block pending admin approval) — see Option E; a separate mechanism in its own ADR if ever required
- An in-app admin notification/advisory mechanism for configuration warnings — the startup warning (3.7) is the minimum viable form; a reusable admin-facing advisory channel is future work

---

## 10. Work Order

| Phase | Scope | Depends On | Estimate | Notes |
|-------|-------|------------|----------|-------|
| 1 | Update `ConfigService.isRegistrationAllowed(scope?)` + `validateRegistrationDisabled()` fail-fast startup validation | - | sp:1 | Support unset/`false`/`true`/`local`/`sso`; default scope `local`; unknown values refuse to start (3.1) |
| 2 | Gate the create branch in `AuthnService.validateOrCreateUser(...)` with `configService.isRegistrationAllowed('sso')` | Phase 1 | sp:2 | Throw `UnauthorizedException` with the structured code; do not call `usersService.create(...)`; rethrow non-NotFound lookup errors; reject missing/empty email with `external_identity_missing_email`; trim+lowercase the external email before lookup and create (3.3) |
| 3 | Add structured audit logging for rejected SSO self-provisioning | Phase 2 | sp:1 | Emit the pinned JSON event shape from 3.5 (`external_auth.login.rejected_not_provisioned`); exclude token/password material |
| 4 | Preserve a frontend-visible `account_not_provisioned` error code on both transports | Phase 2 | sp:2 | Structured code in the exception body (3.3); `authenticationErrorCode` cookie in `AuthenticationExceptionFilter` for OAuth callbacks; 401 JSON body for LDAP/local POST; filter log redaction per 3.5 |
| 5 | Render `account_not_provisioned` as a dedicated login-page alert | Phase 4 | sp:2 | Per 3.6: distinct alert naming the attempted provider, remediation guidance, no config posture disclosed; cookie transport for OAuth callbacks, 401-body transport for LDAP/local; suppress generic snackbars for recognized codes; frontend tests per 7.6 |
| 6 | Startup migration warning for `true` + external auth enabled | Phase 1 | sp:1 | Per 3.7: one WARN from bootstrap validation; enabled-strategy predicate = `enabledOauthStrategies()` non-empty OR `LDAP_ENABLED=true`; fires every boot while the shape holds (accepted) |
| 7 | Add ConfigService (incl. validation + warning), AuthnService, exception-filter, and local registration tests | Phase 1-6 | sp:3 | Cover case-insensitive + whitespace values, unknown-value startup rejection incl. formerly-permissive `1`/`yes`, both scopes, per-family warning conditions, audit event, error code, non-NotFound rethrow, filter tests (7.5) |
| 8 | Fix LDAP strategy to await `validateOrCreateUser(...)`; add strategy integration + e2e deny-path tests | Phase 2 | sp:3 | LDAP `validate()` awaits and calls `done(err)` on rejection (3.3); OIDC + LDAP rejection coverage for `true`/`sso`; one automated e2e/DB-backed test asserting rejection AND no `Users` row, incl. CI env plumbing (7.4) |
| 9 | Update all environment-variable listing surfaces + REQUIRED release/migration note | Phase 1 | sp:2 | `.env-example`, `manifest.yml.example` (quoted string per 3.4), Helm chart if present, wiki, `mitre/saf-packaging` backend.env (3.4); release note per 6.2 covers BOTH breaking cohorts, the upgrade-ordering/rollback rule, and IdP verified-email guidance (6.3), delivered as a version-pinned upgrade-notes entry, not only a changelog line |
| 10 | Manual smoke test with OIDC in server mode | Phase 1-9 | sp:2 | Existing user succeeds; missing user follows `false`/`true`/`local`/`sso` matrix; login page shows the 3.6 alert; boot warning fires for the `true`+SSO combination |

---

## 11. Environment Surface Audit

Searches run against current `mitre/heimdall2` `master` checkout:

- `rg -n -uuu "REGISTRATION_DISABLED|LOCAL_LOGIN_DISABLED|OIDC_|GITHUB_CLIENTID|GITLAB_CLIENTID|GOOGLE_CLIENTID|OKTA_CLIENTID|LDAP_ENABLED|Environment Variables|environment variables"`
- `rg --files -uuu | rg -i "helm|chart|values|template|manifest|compose|docker|env|example|sample|readme|docs|k8s|kubernetes"`

Findings:

| Surface | Status |
|---------|--------|
| `apps/backend/.env-example` | Must update `REGISTRATION_DISABLED` description |
| `manifest.yml.example` | Should add `REGISTRATION_DISABLED` example/comment |
| `docker-compose.yml` | Uses `env_file: .env`; no direct `REGISTRATION_DISABLED` listing found |
| `setup-docker-env.sh` / `setup-docker-env.ps1` | Generate secrets only; no direct `REGISTRATION_DISABLED` listing found |
| `README.md` | Links to the wiki for `.env`; no direct `REGISTRATION_DISABLED` listing found |
| Helm chart | No chart directory, `Chart.yaml`, or `values.yaml` found in current `master`; update if present in a release branch, packaging branch, or downstream chart |
| Backend test env files | LDAP/OIDC test config only; no `REGISTRATION_DISABLED` listing found |

The audit above is scoped to this repository. Known out-of-repo surfaces: the `mitre/saf-packaging` Heimdall Server RPM (`backend.env`) and the wiki (3.4); downstream charts/manifests maintained outside MITRE cannot be audited and are addressed by the 6.2 release note.

---

## 12. Review Questions

1. ~~Should unknown `REGISTRATION_DISABLED` values remain permissive, or should startup fail fast?~~ **Resolved: fail fast (3.1).** An enum typo degrading to permissive would silently open both account-creation paths in a deny-purposed variable. Unset/empty remain permissive for compatibility; anything else refuses to start.
2. ~~Should the wiki and release notes call this a breaking change?~~ **Resolved: yes, as a required deliverable (6.2 table, Phase 9)** — plus the startup warning (3.7) targeting the affected cohort at upgrade time, and the login-page alert (3.6) for affected end users.
3. Should admin user creation remain blocked when `LOCAL_LOGIN_DISABLED=true`, or should that be split into a separate setting? (Open — separate concern from registration policy; candidate for its own issue/ADR.)
4. Should local registration require email-ownership verification? (Open — it is the primary mitigation for the CFM pre-hijacking risk in 6.3 and the root-cause fix named by the USENIX paper; a separate feature with its own ADR/issue. Related: the `iss`+`sub` identity-binding table, also named in 6.3 as the long-term fix for email-based binding.)

---

## 13. References

- `apps/backend/src/authn/authn.service.ts` - `validateOrCreateUser(...)`
- `apps/backend/src/authn/ldap.strategy.ts` - LDAP email extraction and the await fix (3.3)
- `apps/backend/src/config/config.service.ts` - `isRegistrationAllowed()` and `frontendStartupSettings()` (`registrationEnabled` is served pre-auth and controls the Sign Up button)
- `apps/backend/src/filters/authentication-exception.filter.ts` - OAuth callback error delivery (`authenticationError` cookie + redirect; gains `authenticationErrorCode`)
- `apps/backend/src/users/users.controller.ts` - local public registration enforcement
- `apps/frontend/src/views/Login.vue` - login-page error rendering (3.6)
- `apps/backend/.env-example` - environment variable documentation
- `manifest.yml.example` - Cloud Foundry example environment variables
- Heimdall2 wiki: Environment Variables Configuration
- ADR-001 (GUI Attestation & Comment Engine), ADR-002 (DRY Refactoring of hdf-converters), ADR-003 (CKLB Converter) — other Heimdall ADRs; not present in this branch's `docs/`

Standards and prior art (all verified against primary sources, 2026-07-09):

- [NIST SP 800-63C-4](https://pages.nist.gov/800-63-4/sp800-63c.html) (final, July 2025) — Sec. 2.3 (FAL2 identifier requirements), 3.4 (federated identifiers), 3.8.1 (account linking), 4.6.3 (provisioning models)
- [NIST SP 800-53 rev 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) — AC-2, AC-2(1), IA-4 (mapping in 6.1)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) — Sec. 5.7 (claim stability: `sub`+`iss` are the only stable identifier; email may be re-used)
- [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0/5.0/en) — V6.3.8 (enumeration), V10.3.3 / V10.5.2 (identify users by `iss`+`sub`)
- Sudhodanan & Paverd, [*Pre-hijacked accounts: An Empirical Study of Security Failures in User Account Creation on the Web*](https://www.usenix.org/conference/usenixsecurity22/presentation/sudhodanan), USENIX Security 2022 — Sec. 4.1 (Classic-Federated Merge), 6.2 (mitigations)
- Product precedents: [GitLab OmniAuth](https://docs.gitlab.com/integration/omniauth/) (`allow_single_sign_on`, `block_auto_created_users`), [Grafana generic OAuth](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/generic-oauth/) (`allow_sign_up`), [Gitea config cheat sheet](https://docs.gitea.com/administration/config-cheat-sheet) (`ENABLE_AUTO_REGISTRATION`, default false), [Mattermost authentication settings](https://docs.mattermost.com/administration-guide/configure/authentication-configuration-settings.html) (`EnableUserCreation` caveat), [Keycloak first-broker-login flow](https://github.com/keycloak/keycloak/blob/main/docs/documentation/server_admin/topics/identity-broker/first-login-flow.adoc)
- Config-migration precedents: [PostgreSQL 10](https://www.postgresql.org/docs/release/10.0/) / [PostgreSQL 14](https://www.postgresql.org/docs/release/14.0/) (`password_encryption` boolean→enum, then strict), [Django 4.0 release notes](https://docs.djangoproject.com/en/5.2/releases/4.0/) (`CSRF_TRUSTED_ORIGINS` stricter validation + system check), [GitLab deprecation guidelines](https://docs.gitlab.com/development/deprecation_guidelines/)
