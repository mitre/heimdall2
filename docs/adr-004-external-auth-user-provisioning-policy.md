# ADR-004: External Authentication User Provisioning Policy

**Status:** Proposed
**Date:** 2026-07-08
**Author:** TBD
**Branch:** `feature/sso-auto-create-users-policy`
**Related:** Environment variables configuration, OAuth/OIDC authentication, user registration controls

---

## Glossary

| Term | Definition |
|------|------------|
| **SSO** | Single Sign-On - user authentication delegated to an external identity provider |
| **OAuth/OIDC** | External authentication protocols supported by Heimdall through Passport strategies |
| **External authentication provider** | GitHub, GitLab, Google, Okta, custom OIDC, LDAP, or another non-local login mechanism |
| **Local user** | A Heimdall database user record in the `users` table |
| **JIT provisioning** | Just-in-time account creation: creating a local Heimdall user automatically the first time a valid external identity logs in |
| **Public registration** | Self-service user creation through Heimdall's local registration endpoint |
| **Pre-provisioned user** | A local Heimdall user record created by an administrator before the user's first SSO login |

---

## 1. Context

### 1.1 The Problem

Heimdall currently supports two different account-creation paths:

1. **Local registration:** a user creates an account through Heimdall's user registration endpoint.
2. **External authentication login:** a user authenticates with an external provider and Heimdall creates a local user record if one does not already exist.

The existing `REGISTRATION_DISABLED` environment variable only controls the local registration path. The external authentication path bypasses the local user registration controller and calls `AuthnService.validateOrCreateUser(...)` directly.

As a result, deployments can set:

```env
REGISTRATION_DISABLED=true
LOCAL_LOGIN_DISABLED=true
```

and still allow new local Heimdall accounts to be created when a previously unknown user successfully authenticates through SSO.

This behavior is useful for low-friction deployments, but it is surprising for locked-down environments where administrators expect all account creation to be explicitly approved.

### 1.2 Current Behavior

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

### 1.3 Why This Matters

Many Heimdall deployments run in environments where:

- only explicitly approved users should receive local Heimdall accounts
- identity provider access does not necessarily mean Heimdall application authorization
- auditors expect account creation to be traceable to an administrator action
- default-deny access is preferred for mission or compliance systems

In those environments, SSO should authenticate identity, but Heimdall should still decide whether a local application account is allowed to exist.

### 1.4 User Expectation Gap

The name `REGISTRATION_DISABLED` naturally reads as "disable user self-registration." Administrators may reasonably assume this includes SSO-created accounts. In the current implementation, it does not.

Changing `REGISTRATION_DISABLED` to also block SSO auto-creation would close that surprise, but it would also change established behavior for deployments that intentionally use SSO as their provisioning mechanism.

---

## 2. Decision

Add a separate environment variable:

```env
SSO_AUTO_CREATE_USERS_DISABLED=true
```

When this variable is set to `true`, Heimdall will reject external-authentication logins for users who do not already have a local Heimdall account.

Default behavior remains unchanged:

| `SSO_AUTO_CREATE_USERS_DISABLED` | Behavior |
|----------------------------------|----------|
| unset | Missing SSO users are automatically created, current behavior |
| `false` | Missing SSO users are automatically created |
| `true` | Missing SSO users are rejected unless an admin pre-created the account |

This keeps `REGISTRATION_DISABLED` scoped to local public registration and gives administrators an explicit control for SSO just-in-time provisioning.

---

## 3. Proposed Implementation

### 3.1 Configuration Service

Add a helper to `apps/backend/src/config/config.service.ts`:

```ts
isSsoAutoCreateUsersAllowed(): boolean {
  return this.get('SSO_AUTO_CREATE_USERS_DISABLED')?.toLowerCase() !== 'true';
}
```

This follows the existing boolean-disabled pattern used by:

- `isRegistrationAllowed()`
- `isLocalLoginAllowed()`

The default is permissive to preserve backwards compatibility.

### 3.2 Authentication Service

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
  if (!this.configService.isSsoAutoCreateUsersAllowed()) {
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

### 3.3 Environment Documentation

Add the variable to `apps/backend/.env-example`:

```env
SSO_AUTO_CREATE_USERS_DISABLED=<If users who log in with OAuth/OIDC/other external authentication providers should be required to already exist in Heimdall instead of being created automatically (defaults to false)>
```

Update the environment variables wiki to distinguish:

- `REGISTRATION_DISABLED`: disables public local registration
- `SSO_AUTO_CREATE_USERS_DISABLED`: disables SSO just-in-time local user creation

### 3.4 Authentication Strategies

No strategy-specific changes are required.

The existing provider strategies should continue to call `validateOrCreateUser(...)`:

- GitHub
- GitLab
- Google
- Okta
- OIDC

The provisioning decision belongs in `AuthnService`, not in each provider strategy. This avoids duplicating policy logic and keeps provider code focused on identity validation.

---

## 4. Why Not the Alternatives

### Option A: Reuse `REGISTRATION_DISABLED`

This would make `REGISTRATION_DISABLED=true` block both local registration and SSO auto-creation.

**Pros:**
- Simple mental model: no self-service account creation of any kind
- Minimal new configuration surface

**Cons:**
- Changes existing behavior for deployments that use SSO as their normal provisioning path
- Makes "registration" mean two different mechanisms
- Prevents administrators from disabling local public registration while still allowing SSO JIT provisioning

**Decision:** Reject. The behavior change is too broad for an existing variable.

### Option B: Remove SSO Auto-Creation Entirely

Require all SSO users to be pre-created.

**Pros:**
- Strong default-deny posture
- Simple implementation

**Cons:**
- Breaks low-friction deployments
- Breaks existing environments that rely on IdP assignment as the provisioning gate
- Requires manual admin work for every new SSO user

**Decision:** Reject. Heimdall should support both provisioning models.

### Option C: Provider-Specific Controls

Add variables such as:

```env
OIDC_AUTO_CREATE_USERS_DISABLED=true
GOOGLE_AUTO_CREATE_USERS_DISABLED=true
GITHUB_AUTO_CREATE_USERS_DISABLED=true
```

**Pros:**
- Maximum control per provider
- Useful for mixed-provider environments

**Cons:**
- More configuration and documentation burden
- Increases test matrix
- Does not match the current centralized creation path

**Decision:** Defer. A global policy is sufficient for the immediate need. Provider-specific overrides can be added later if a real deployment requires them.

### Option D: Rely on IdP App Assignment Only

Tell administrators to restrict who can access the Heimdall app in the identity provider.

**Pros:**
- No code change
- Keeps authorization outside Heimdall

**Cons:**
- Does not satisfy environments that require local account pre-approval
- IdP assignment and Heimdall account creation are different audit events
- Misconfiguration at the IdP still creates local users

**Decision:** Reject as the only control. IdP assignment remains recommended defense-in-depth, but Heimdall needs its own provisioning policy.

---

## 5. Behavior Matrix

| Scenario | Local user exists? | External auth succeeds? | `SSO_AUTO_CREATE_USERS_DISABLED` | Result |
|----------|--------------------|--------------------------|----------------------------------|--------|
| Existing user signs in with SSO | Yes | Yes | unset / `false` | Login succeeds |
| Existing user signs in with SSO | Yes | Yes | `true` | Login succeeds |
| Unknown user signs in with SSO | No | Yes | unset / `false` | User is created; login succeeds |
| Unknown user signs in with SSO | No | Yes | `true` | Login rejected |
| Unknown user fails IdP authentication | No | No | any | Login rejected by provider strategy |
| Local public registration | No | n/a | any | Controlled by `REGISTRATION_DISABLED`, unchanged |
| Local username/password login | Yes | n/a | any | Controlled by `LOCAL_LOGIN_DISABLED`, unchanged |

---

## 6. Security and Compliance Considerations

### 6.1 Positive Security Effects

- Supports default-deny local account provisioning
- Separates identity authentication from Heimdall application authorization
- Reduces risk from overly broad IdP app assignment
- Makes SSO provisioning behavior explicit and auditable
- Enables administrators to require pre-created Heimdall accounts while still using SSO for authentication

### 6.2 Residual Risks

- Existing auto-created users remain in the database after the flag is enabled.
- Administrators must still remove or disable unwanted existing accounts.
- Email address matching remains the account binding mechanism.
- IdP-side access control is still required to prevent users from reaching the SSO callback flow.

### 6.3 Audit Behavior

When the flag is enabled, a rejected SSO login should not create a user record. Any audit logging should record the failed authentication attempt without persisting a new local account.

If existing logging does not distinguish "SSO user authenticated but no local account exists," add a structured log message at the rejection point.

---

## 7. Testing Strategy

### 7.1 Unit Tests

Add tests for `ConfigService.isSsoAutoCreateUsersAllowed()`:

| Env value | Expected |
|-----------|----------|
| unset | `true` |
| `false` | `true` |
| `FALSE` | `true` |
| `true` | `false` |
| `TRUE` | `false` |

### 7.2 AuthnService Tests

Add tests for `validateOrCreateUser(...)`:

1. Existing user is returned regardless of `SSO_AUTO_CREATE_USERS_DISABLED`.
2. Missing user is created when the variable is unset.
3. Missing user is created when the variable is `false`.
4. Missing user throws `UnauthorizedException` when the variable is `true`.
5. Missing user with the variable set to `true` does not call `usersService.create(...)`.
6. Existing user profile updates and login metadata updates are unchanged.

### 7.3 Strategy Integration Tests

No provider-specific logic should be required, but at least one OAuth/OIDC strategy test should verify the flow:

1. Strategy receives a valid verified external identity.
2. `validateOrCreateUser(...)` rejects a missing user when auto-create is disabled.
3. The login fails without creating a local user.

OIDC is the preferred coverage target because custom OIDC is the most common enterprise SSO integration point.

---

## 8. Migration and Operations

### 8.1 Default Migration

No migration is required. The variable defaults to the existing behavior.

Existing deployments will continue to auto-create missing SSO users unless they explicitly set:

```env
SSO_AUTO_CREATE_USERS_DISABLED=true
```

### 8.2 Locked-Down Deployment Procedure

Recommended configuration for deployments that require explicit user provisioning:

```env
LOCAL_LOGIN_DISABLED=true
REGISTRATION_DISABLED=true
SSO_AUTO_CREATE_USERS_DISABLED=true
```

Operational steps:

1. Create or import local Heimdall user records for approved users.
2. Ensure each local user email exactly matches the email returned by the IdP.
3. Assign the same users to the Heimdall app in the IdP.
4. Enable `SSO_AUTO_CREATE_USERS_DISABLED=true`.
5. Remove any previously auto-created users that should not retain access.

### 8.3 Error Message

Use a clear user-facing message:

```text
No Heimdall account exists for this SSO user. Please ask your system administrator to create the account.
```

Avoid exposing whether an arbitrary email exists unless the user has already authenticated through a trusted provider. This message is returned only after successful external identity validation.

---

## 9. Consequences

### 9.1 Positive

- Administrators gain explicit control over SSO just-in-time provisioning.
- Existing deployments keep current behavior by default.
- The distinction between local registration and external-auth provisioning becomes documented and testable.
- The implementation is centralized in `AuthnService`.
- Provider strategies remain simple and unchanged.

### 9.2 Negative

- Adds one more environment variable to document and support.
- Administrators can misconfigure locked-down environments if they set `REGISTRATION_DISABLED=true` but forget `SSO_AUTO_CREATE_USERS_DISABLED=true`.
- Pre-provisioned SSO deployments require exact email matching.

### 9.3 Risks

- If the error is surfaced poorly in the frontend, users may see a generic authentication failure with no remediation guidance.
- If existing tests assume missing external users are always created, those tests must be updated to cover both branches.
- LDAP may need a separate review if its login path does not call `validateOrCreateUser(...)`.

### 9.4 What's NOT in Scope

- Role mapping from IdP claims to Heimdall roles
- Group-based automatic user authorization
- SCIM provisioning
- Bulk user import
- Provider-specific auto-create flags
- Changing the meaning of `REGISTRATION_DISABLED`
- Deleting existing auto-created users

---

## 10. Work Order

| Phase | Scope | Depends On | Estimate | Notes |
|-------|-------|------------|----------|-------|
| 1 | Add `ConfigService.isSsoAutoCreateUsersAllowed()` | - | sp:1 | Defaults to allowed unless env var is exactly `true` |
| 2 | Gate the create branch in `AuthnService.validateOrCreateUser(...)` | Phase 1 | sp:1 | Throw `UnauthorizedException`; do not call `usersService.create(...)` |
| 3 | Add unit tests for config helper and auth service behavior | Phase 1-2 | sp:2 | Include "create not called" assertion |
| 4 | Add one strategy integration test, preferably OIDC | Phase 2 | sp:2 | Verifies valid SSO identity + missing local user is rejected |
| 5 | Update `.env-example` and environment variables wiki | Phase 1 | sp:1 | Clarify difference from `REGISTRATION_DISABLED` |
| 6 | Manual smoke test with OIDC in server mode | Phase 2-5 | sp:2 | Existing user succeeds; missing user rejected |

---

## 11. Review Questions

1. Should the variable name be `SSO_AUTO_CREATE_USERS_DISABLED` or `EXTERNAL_AUTH_AUTO_CREATE_USERS_DISABLED`?
2. Should LDAP be covered by this same policy if it uses a separate creation path?
3. Should the rejected-login event be added to structured audit logging as part of this change?
4. Should the frontend show a specific message for this condition, or rely on the backend exception message?

---

## 12. References

- `apps/backend/src/authn/authn.service.ts` - `validateOrCreateUser(...)`
- `apps/backend/src/config/config.service.ts` - environment-backed configuration helpers
- `apps/backend/src/users/users.controller.ts` - local public registration enforcement
- `apps/backend/.env-example` - environment variable documentation
- Heimdall2 wiki: Environment Variables Configuration
- ADR-001: GUI Attestation & Comment Engine
- ADR-002: DRY Refactoring of hdf-converters
- ADR-003: CKLB Converter
