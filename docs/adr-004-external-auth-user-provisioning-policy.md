# ADR-004: Scoped REGISTRATION_DISABLED for Local and SSO Account Creation

**Status:** Proposed
**Date:** 2026-07-09
**Author:** Eugene Aronne
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
2. The provider returns a verified email and profile details.
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

`sso` allows local registration but requires SSO users to be pre-provisioned.

The `sso` scope governs **all** external authentication providers — GitHub, GitLab, Google, Okta, custom OIDC, **and LDAP** — because every provider strategy provisions through the same `AuthnService.validateOrCreateUser(...)` path (see 3.3). "SSO" in the value name is shorthand for external authentication generally, not OAuth/OIDC only.

Existing users are unaffected. If a local Heimdall account already exists with the email returned by the external identity provider, SSO login continues to work for all values.

Unknown values are rejected at startup (see 3.1) — a typo in a security-policy variable must never silently open both account-creation paths.

---

## 3. Proposed Implementation

### 3.1 Configuration Service

Update `apps/backend/src/config/config.service.ts` so `isRegistrationAllowed()` accepts an optional scope.

```ts
type RegistrationScope = 'local' | 'sso';

isRegistrationAllowed(scope: RegistrationScope = 'local'): boolean {
  const registrationDisabled = this.get('REGISTRATION_DISABLED')?.toLowerCase();
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
  const raw = this.get('REGISTRATION_DISABLED');
  if (raw === undefined || raw === '') return; // unset/empty = false (permissive)
  if (!ConfigService.VALID_REGISTRATION_VALUES.has(raw.toLowerCase())) {
    throw new Error(
      `Invalid REGISTRATION_DISABLED value "${raw}". ` +
      `Valid values: false, true, local, sso (case-insensitive).`
    );
  }
}
```

Called once during backend startup (alongside existing config initialization) so a misconfigured deployment refuses to boot with a clear message instead of running with an unintended registration policy.

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
try {
  user = await this.usersService.findByEmail(email);
} catch {
  if (!this.configService.isRegistrationAllowed('sso')) {
    throw new UnauthorizedException(
      'No Heimdall account exists for this SSO user. Please ask your system administrator to create the account.'
    );
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

This keeps provider strategies unchanged. GitHub, GitLab, Google, Okta, OIDC, LDAP, and any other strategy that uses `validateOrCreateUser(...)` inherit the same SSO-scope policy.

All external-authentication strategies must continue to provision through `AuthnService.validateOrCreateUser(...)`. This is the architectural choke point for account creation, so future strategies such as SAML must use the same service method rather than creating Heimdall users directly.

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
| Release notes / migration notes | Call out the new enum values |

Recommended wording for `.env-example`:

```env
REGISTRATION_DISABLED=<Controls account self-provisioning: false/unset allows local registration and SSO auto-account creation; true disables both; local disables local registration only; sso disables SSO auto-account creation only (defaults to false)>
```

Recommended manifest example:

```yaml
#REGISTRATION_DISABLED: false # false|true|local|sso
```

### 3.5 Error Handling and Logging

When SSO auto-account creation is disabled and an external identity authenticates successfully but no local Heimdall user exists:

1. Do not create a user record.
2. Throw `UnauthorizedException`.
3. Log a structured event with:
   - provider / `creationMethod`
   - external email
   - reason: `registrationDisabledForSso`
   - no password or token material
4. Preserve a structured error code through the callback / frontend flow, such as `account_not_provisioned`, so this condition is distinguishable from a generic authentication failure.

The user-facing message should be clear enough to route the user to an administrator:

```text
No Heimdall account exists for this SSO user. Please ask your system administrator to create the account.
```

### 3.6 Login Page Rendering

Preserving the `account_not_provisioned` code (3.5) is only half the contract — the login page must render it distinctly. An intentional policy rejection surfaced as a generic authentication failure is the exact risk 9.3 warns about.

The error code travels on the OAuth/LDAP callback redirect as a query parameter, consistent with how existing authentication failures reach the login page. The frontend maps `account_not_provisioned` to a dedicated alert above the login form:

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

The alert must not disclose configuration posture (which policy value is set, which providers auto-create). It is shown only after successful external identity validation, so it does not enable account enumeration by unauthenticated visitors.

### 3.7 Startup Migration Warning

The `true` semantics change breaks one specific cohort: deployments with `REGISTRATION_DISABLED=true` that rely on SSO JIT provisioning. Release notes are the weakest channel to reach them; the application itself can target them precisely at upgrade time.

At backend startup, when BOTH conditions hold:

- `REGISTRATION_DISABLED` resolves to `true`, and
- at least one external authentication strategy is enabled (OAuth/OIDC/LDAP)

log a single warning:

```text
WARN: As of vX.Y, REGISTRATION_DISABLED=true also disables SSO/LDAP auto-account
creation. New external-authentication users will be rejected until an administrator
pre-creates their accounts. Set REGISTRATION_DISABLED=local to restore the previous
behavior (local registration disabled, SSO auto-creation enabled).
```

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

**Decision:** Reject for this ADR. If per-provider policy becomes a real deployment requirement, it should be introduced in a later ADR as an explicit expansion of the registration model.

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

GitLab's `block_auto_created_users` pattern: the JIT user record is created on first SSO login but blocked until an administrator approves it. Default-deny access with zero manual email matching — the record self-creates with the IdP-correct email, and the approval click is itself the auditable admin action.

**Pros:**
- Best operator experience for locked-down deployments (no pre-provisioning typos, one-click approval)
- Account-creation and approval events form a complete audit trail

**Cons:**
- Requires a pending/blocked user state and an admin approval UI — substantially larger scope
- Not expressible in this ADR's model: "approval" is not a kind of "disabled," so it can never be a `REGISTRATION_DISABLED` value

**Decision:** Reject for this ADR. If an approval workflow becomes a real requirement, it must be introduced as a **separate mechanism in its own ADR** — explicitly NOT as an additional `REGISTRATION_DISABLED` value. This note exists so a future contributor does not attempt `REGISTRATION_DISABLED=sso-approval` and turn the enum into a policy grab-bag.

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

### 6.2 Backwards Compatibility

Current boolean values keep their intuitive meaning:

- unset / `false`: local registration and SSO auto-account creation are allowed
- `true`: local registration and SSO auto-account creation are disabled

**This is a breaking change** for deployments that currently set `REGISTRATION_DISABLED=true` but rely on SSO JIT provisioning, and it is communicated through three required channels (not optional):

| Channel | Content |
|---------|---------|
| Release notes + wiki migration note (required deliverable, Phase 9) | Who is affected: `true` + SSO-JIT reliance. Symptom: new SSO/LDAP users rejected with `account_not_provisioned`. Fix: `REGISTRATION_DISABLED=local`. |
| Startup warning (3.7) | Targets exactly the affected cohort at exactly the moment they upgrade |
| Login page alert (3.6) | Affected end users get remediation guidance instead of a generic failure |

Those deployments should change to:

```env
REGISTRATION_DISABLED=local
```

Deployments that want local registration enabled but SSO users pre-provisioned should set:

```env
REGISTRATION_DISABLED=sso
```

### 6.3 Residual Risks

- Existing auto-created users remain in the database after SSO auto-account creation is disabled.
- Administrators must still remove or disable unwanted existing accounts.
- Email address matching remains the account binding mechanism.
- If an IdP allows user-editable or unverified email claims, an external identity could bind to someone else's pre-provisioned Heimdall account. SSO providers must return verified, administrator-controlled email attributes.
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
| `false` / `true` / `local` / `sso` (any case) | Boots |
| `banana` | Refuses to start, error names valid values |
| `ture` (typo) | Refuses to start |
| `sso-approval` | Refuses to start |

Startup warning tests (3.7):

1. `true` + at least one external strategy enabled → warning logged once.
2. `true` + no external strategies → no warning.
3. `local` / `sso` / unset → no warning.

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
11. The thrown error does not leak provider tokens or sensitive profile data.

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

LDAP already calls `validateOrCreateUser(...)`, so LDAP is covered by the same AuthnService gate. Add a lightweight regression assertion or code-reference test so future LDAP changes do not bypass the shared provisioning path.

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

Operational steps:

1. Create or import local Heimdall user records for approved users.
2. Ensure each local user email exactly matches the email returned by the IdP.
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

### 8.4 Local Registration With SSO Pre-Provisioning

Recommended configuration for deployments that allow local registration but require SSO users to already exist:

```env
REGISTRATION_DISABLED=sso
```

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

- The callback and frontend flow must preserve the `account_not_provisioned` error code; otherwise users may see a generic authentication failure with no remediation guidance.
- If existing tests assume missing external users are always created, those tests must be updated to cover both branches.
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
| 2 | Gate the create branch in `AuthnService.validateOrCreateUser(...)` with `configService.isRegistrationAllowed('sso')` | Phase 1 | sp:1 | Throw `UnauthorizedException`; do not call `usersService.create(...)` |
| 3 | Add structured audit logging for rejected SSO self-provisioning | Phase 2 | sp:1 | Include provider, email, and `registrationDisabledForSso`; exclude token/password material |
| 4 | Preserve a frontend-visible `account_not_provisioned` error code | Phase 2 | sp:1 | Callback/login UI can distinguish missing pre-provisioned users from generic auth failure |
| 5 | Render `account_not_provisioned` as a dedicated login-page alert | Phase 4 | sp:2 | Per 3.6: distinct alert with remediation, no config posture disclosed, redirect query param consistent with existing auth failures |
| 6 | Startup migration warning for `true` + external auth enabled | Phase 1 | sp:1 | Per 3.7: one WARN naming `REGISTRATION_DISABLED=local` as the previous-behavior value |
| 7 | Add ConfigService (incl. validation + warning), AuthnService, and local registration tests | Phase 1-6 | sp:3 | Cover case-insensitive values, unknown-value startup rejection, both scopes, warning conditions, audit event, error code |
| 8 | Add or update strategy integration tests, preferably OIDC plus LDAP path coverage | Phase 2 | sp:2 | Verify valid external identity + missing local user is rejected for `true` and `sso`; assert LDAP still uses `validateOrCreateUser(...)` |
| 9 | Update all environment-variable listing surfaces + REQUIRED release/migration note | Phase 1 | sp:2 | `.env-example`, `manifest.yml.example`, Helm chart if present, wiki; release note per 6.2 breaking-change table is a deliverable, not optional |
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

---

## 12. Review Questions

1. ~~Should unknown `REGISTRATION_DISABLED` values remain permissive, or should startup fail fast?~~ **Resolved: fail fast (3.1).** An enum typo degrading to permissive would silently open both account-creation paths in a deny-purposed variable. Unset/empty remain permissive for compatibility; anything else refuses to start.
2. ~~Should the wiki and release notes call this a breaking change?~~ **Resolved: yes, as a required deliverable (6.2 table, Phase 9)** — plus the startup warning (3.7) targeting the affected cohort at upgrade time, and the login-page alert (3.6) for affected end users.
3. Should admin user creation remain blocked when `LOCAL_LOGIN_DISABLED=true`, or should that be split into a separate setting? (Open — separate concern from registration policy; candidate for its own issue/ADR.)

---

## 13. References

- `apps/backend/src/authn/authn.service.ts` - `validateOrCreateUser(...)`
- `apps/backend/src/config/config.service.ts` - `isRegistrationAllowed()`
- `apps/backend/src/users/users.controller.ts` - local public registration enforcement
- `apps/backend/.env-example` - environment variable documentation
- `manifest.yml.example` - Cloud Foundry example environment variables
- Heimdall2 wiki: Environment Variables Configuration
- ADR-001: GUI Attestation & Comment Engine
- ADR-002: DRY Refactoring of hdf-converters
- ADR-003: CKLB Converter
