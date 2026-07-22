# [EPIC] Implement scoped REGISTRATION_DISABLED — ADR-004 external-auth provisioning policy

> Local read-only export of the Beads epic and its child cards. No push was performed while producing this view.

- Epic: `heimdall2-4qg`
- Status: open
- Priority: P1
- Owner: lippold@gmail.com
- Estimate: 134 minutes
- Source design: [ADR-004](../../../docs/adr-004-external-auth-user-provisioning-policy.md)
- Exported: 2026-07-14

## Card summary

| Card | Title | Status | Priority | Estimate |
|---|---|---:|---:|---:|
| `heimdall2-4qg.1` | Extend registration configuration — ADR-004 Phase 1 | open | P1 | 8 min |
| `heimdall2-4qg.2` | Gate SSO user creation — ADR-004 Phase 2 | open | P1 | 10 min |
| `heimdall2-4qg.3` | Emit SSO provisioning audit event — ADR-004 Phase 3 | open | P1 | 6 min |
| `heimdall2-4qg.4` | Preserve authentication error code — ADR-004 Phase 4 | open | P1 | 10 min |
| `heimdall2-4qg.5` | Render provisioning denial alert — ADR-004 Phase 5 | open | P1 | 12 min |
| `heimdall2-4qg.6` | Emit startup policy warnings — ADR-004 Phase 6 | open | P1 | 8 min |
| `heimdall2-4qg.7` | Complete backend policy test matrices — ADR-004 Phase 7 | open | P1 | 15 min |
| `heimdall2-4qg.8` | Fix LDAP rejection plumbing and integration coverage — ADR-004 Phase 8 | open | P1 | 18 min |
| `heimdall2-4qg.9` | Update registration policy documentation — ADR-004 Phase 9 | open | P1 | 12 min |
| `heimdall2-4qg.10` | Run live OIDC policy matrix — ADR-004 Phase 10 | open | P1 | 35 min |

## Epic details

## Phase 0 — MANDATORY REMINDER (read before every card)
**CORRECTNESS IS THE ONLY PRIORITY.** Best practices, standards, DRY, maintainable code — always. No shortcuts, no hacks, no workarounds. Card-close velocity is NOT a metric. Speed is NOT a goal. If an AC requires research, DO THE RESEARCH. If an AC requires a specific format (XLSX, YAML, etc.), implement THAT FORMAT — do not substitute. Read the ADR section referenced below BEFORE writing code. Every AC gets evidence before close. The `/project-ac-verify` gate blocks `bd close` mechanically — an independent reviewer checks your work.

---

Title: [EPIC] Implement scoped REGISTRATION_DISABLED — ADR-004 external-auth provisioning policy

Description:
Implement ADR-004 through 10 child cards covering configuration, SSO/LDAP provisioning, error transport and rendering, verification, migration documentation, and live OIDC testing. The children total 134 Claude-pace minutes; this epic is complete only when the full behavior matrix and both breaking-change cohorts have evidence.
Design doc: docs/adr-004-external-auth-user-provisioning-policy.md §2, §5, §10

Files:
- Create: none
- Modify: none
- Test: none

First failing test:
See child cards

Acceptance criteria:
- [ ] All 10 child cards are closed after independent AC verification
- [ ] Every row of ADR §5 is demonstrated, including LDAP and self-registration-under-`sso`
- [ ] Both breaking-change cohorts in ADR §6.2 are covered by the shipped, version-pinned migration note
- [ ] ADR §6.3's verified-email warning and operator guidance are implemented and verified
- [ ] All work via TDD (failing test first)
- [ ] No regressions on existing backend, frontend, and end-to-end tests
- [ ] Live tested against the running app with the Phase 10 OIDC matrix; per-cell proof and light/dark alert screenshots are pasted in card notes before closing

Verification:
`yarn workspace heimdall-server test:ci && yarn workspace @mitre/heimdall-lite test:ci && yarn workspace heimdall-server lint:ci && yarn workspace @mitre/heimdall-lite lint:ci && npx tsc --noEmit -p apps/backend/tsconfig.json && npx tsc --noEmit -p apps/frontend/tsconfig.json`

Decision points:
- Any proposed deviation from ADR-004's settled one-variable, four-value, fail-fast design must stop for maintainer approval
- Implementing the entire feature in one card is the simpler shortcut, but it is wrong because it removes independently verifiable boundaries for the security policy, transport contract, UI behavior, and migration work
- Pushing code or documentation to an external branch, wiki, or repository requires explicit approval from the relevant maintainer

Anti-patterns:
- Do NOT optimize for card-close velocity or speed
- Do NOT collapse or bypass child-card verification to close the epic sooner
- Do NOT add `rubocop:disable`/`eslint-disable` to work around warnings — fix the root cause
- Do NOT close this card with any AC unchecked — no deferrals, no "lower priority" exceptions

NOT in scope:
- Approval-queue provisioning, provider-specific controls, `iss`+`sub` identity binding, or local-registration email verification
- Implementing the ADR-005 VitePress documentation site

Before closing:
- [ ] Re-read the Phase 0 preamble — correctness is the only priority
- [ ] **EVERY AC checkbox verified with evidence — NO EXCEPTIONS, NO DEFERRALS**
- [ ] Re-read Anti-patterns — confirm none violated
- [ ] Run the exact Verification command — paste output
- [ ] Live test proof pasted in card notes — method matches layer changed
- [ ] AC verification gate resolved with evidence (never `--force` to bypass)
- [ ] git diff shows ONLY files listed in Files section
- [ ] Zero new linter disable comments in the diff
- [ ] If closing 2+ cards in a row: STOP. Are you rushing? Verify each one fully.

Story points: sp:13
Estimate: 134 minutes, Claude-pace total across child cards

---

## heimdall2-4qg.1: Extend registration configuration — ADR-004 Phase 1

- Status: open
- Priority: P1
- Owner: lippold@gmail.com
- Estimate: 8 minutes

## Phase 0 — MANDATORY REMINDER (read before every card)
**CORRECTNESS IS THE ONLY PRIORITY.** Best practices, standards, DRY, maintainable code — always. No shortcuts, no hacks, no workarounds. Card-close velocity is NOT a metric. Speed is NOT a goal. If an AC requires research, DO THE RESEARCH. If an AC requires a specific format (XLSX, YAML, etc.), implement THAT FORMAT — do not substitute. Read the ADR section referenced below BEFORE writing code. Every AC gets evidence before close. The `/project-ac-verify` gate blocks `bd close` mechanically — an independent reviewer checks your work.

---

Title: Extend registration configuration — ADR-004 Phase 1

Description:
Extend `ConfigService.isRegistrationAllowed()` with a defaulted local/SSO scope and case-insensitive, whitespace-trimmed enum handling. Add fail-fast bootstrap validation so unknown deny-policy values never silently enable account creation, while unset and whitespace-only values remain permissive for compatibility.
Design doc: docs/adr-004-external-auth-user-provisioning-policy.md §3.1, §3.2, §7.1

Files:
- Create: none
- Modify: apps/backend/src/config/config.service.ts, apps/backend/src/main.ts
- Test: apps/backend/src/config/config.service.spec.ts

First failing test:
`it('rejects SSO registration when REGISTRATION_DISABLED is sso')`

Acceptance criteria:
- [ ] `RegistrationScope` accepts only `local` or `sso`, defaults to `local`, and existing callers compile unchanged
- [ ] The complete ADR §7.1 value/scope matrix is covered, including case variants and trimmed values
- [ ] `validateRegistrationDisabled()` accepts unset/empty/whitespace and the four valid values, and rejects `1`, `yes`, `0`, `banana`, `ture`, and `sso-approval` with an error naming every valid value
- [ ] Bootstrap invokes validation exactly once before the application begins listening
- [ ] `frontendStartupSettings().registrationEnabled` is false for `true`/`local` and true for unset/`false`/`sso`
- [ ] All work via TDD (failing test first)
- [ ] No regressions on existing tests
- [ ] Live tested against the running backend: `REGISTRATION_DISABLED=banana` refuses boot with the exact error and `REGISTRATION_DISABLED=sso` boots; output is pasted in card notes

Verification:
`yarn workspace heimdall-server test:ci && yarn workspace heimdall-server lint:ci && npx tsc --noEmit -p apps/backend/tsconfig.json`

Decision points:
- If configuration loading has another bootstrap path besides `apps/backend/src/main.ts`, stop and include it before claiming validation is complete
- Treating unknown values as permissive is simpler, but it is wrong because a typo in a deny-policy variable would silently open both creation paths

Anti-patterns:
- Do NOT optimize for card-close velocity or speed
- Do NOT preserve permissive behavior for non-empty unknown values
- Do NOT duplicate enum parsing between validation and `isRegistrationAllowed()`
- Do NOT add `rubocop:disable`/`eslint-disable` to work around warnings — fix the root cause
- Do NOT close this card with any AC unchecked — no deferrals, no "lower priority" exceptions

NOT in scope:
- Gating SSO user creation or emitting migration/security warnings
- Updating environment-variable documentation

Before closing:
- [ ] Re-read the Phase 0 preamble — correctness is the only priority
- [ ] **EVERY AC checkbox verified with evidence — NO EXCEPTIONS, NO DEFERRALS**
- [ ] Re-read Anti-patterns — confirm none violated
- [ ] Run the exact Verification command — paste output
- [ ] Live test proof pasted in card notes — method matches layer changed
- [ ] AC verification gate resolved with evidence (never `--force` to bypass)
- [ ] git diff shows ONLY files listed in Files section
- [ ] Zero new linter disable comments in the diff
- [ ] If closing 2+ cards in a row: STOP. Are you rushing? Verify each one fully.

Story points: sp:1
Estimate: 8 minutes, Claude-pace

---

## heimdall2-4qg.2: Gate SSO user creation — ADR-004 Phase 2

- Status: open
- Priority: P1
- Owner: lippold@gmail.com
- Estimate: 10 minutes
- Blocked by: `heimdall2-4qg.1`

## Phase 0 — MANDATORY REMINDER (read before every card)
**CORRECTNESS IS THE ONLY PRIORITY.** Best practices, standards, DRY, maintainable code — always. No shortcuts, no hacks, no workarounds. Card-close velocity is NOT a metric. Speed is NOT a goal. If an AC requires research, DO THE RESEARCH. If an AC requires a specific format (XLSX, YAML, etc.), implement THAT FORMAT — do not substitute. Read the ADR section referenced below BEFORE writing code. Every AC gets evidence before close. The `/project-ac-verify` gate blocks `bd close` mechanically — an independent reviewer checks your work.

---

Title: Gate SSO user creation — ADR-004 Phase 2

Description:
Gate only the missing-user creation branch in `AuthnService.validateOrCreateUser()` with `isRegistrationAllowed('sso')`. Preserve existing-user login, normalize external email before lookup/create, distinguish missing email from provisioning denial, and propagate non-not-found database errors unchanged.
Design doc: docs/adr-004-external-auth-user-provisioning-policy.md §3.3, §3.5, §5, §7.2

Files:
- Create: apps/backend/src/authn/authn.service.spec.ts
- Modify: apps/backend/src/authn/authn.service.ts
- Test: apps/backend/src/authn/authn.service.spec.ts

First failing test:
`it('rejects a missing SSO user under REGISTRATION_DISABLED=sso without creating a user')`

Acceptance criteria:
- [ ] Missing users are created for unset/`false`/`local` and rejected for `true`/`sso`; every branch is tested
- [ ] The denial is an `UnauthorizedException` with the exact body `{statusCode: 401, message, error: 'account_not_provisioned'}` required by ADR §3.3
- [ ] `usersService.create()` is never called on a denied registration or a non-`NotFoundException` lookup failure
- [ ] Missing/empty email is rejected before lookup with `external_identity_missing_email`, never `account_not_provisioned`
- [ ] External email is trimmed and lowercased before lookup and create; mixed-case external email matches a lowercase pre-provisioned account without creating a duplicate
- [ ] Existing-user profile and login-metadata behavior remains unchanged for every configuration value
- [ ] All work via TDD (failing test first)
- [ ] No regressions on existing tests
- [ ] Live tested against the running API with `curl` on the LDAP or OIDC path under `sso`; the 401 body and unchanged database row count are pasted in card notes

Verification:
`yarn workspace heimdall-server test:ci && yarn workspace heimdall-server lint:ci && npx tsc --noEmit -p apps/backend/tsconfig.json`

Decision points:
- If `UsersService.findByEmail()` can signal absence with anything other than `NotFoundException`, stop and reconcile the service contract before changing the catch
- A bare catch is simpler, but it is wrong because it converts database failures into policy denials and may create users after a failed lookup
- If a maintained API schema is introduced before implementation, stop and add its response type and contract validation to this card atomically

Anti-patterns:
- Do NOT optimize for card-close velocity or speed
- Do NOT throw a message-only exception; the machine-readable code is part of the transport contract
- Do NOT normalize local registration or change database uniqueness in this card
- Do NOT add `rubocop:disable`/`eslint-disable` to work around warnings — fix the root cause
- Do NOT close this card with any AC unchecked — no deferrals, no "lower priority" exceptions

NOT in scope:
- Structured audit logging, OAuth cookie transport, frontend rendering, or LDAP strategy error plumbing
- Case-insensitive database uniqueness or `iss`+`sub` identity binding

Before closing:
- [ ] Re-read the Phase 0 preamble — correctness is the only priority
- [ ] **EVERY AC checkbox verified with evidence — NO EXCEPTIONS, NO DEFERRALS**
- [ ] Re-read Anti-patterns — confirm none violated
- [ ] Run the exact Verification command — paste output
- [ ] Live test proof pasted in card notes — method matches layer changed
- [ ] AC verification gate resolved with evidence (never `--force` to bypass)
- [ ] git diff shows ONLY files listed in Files section
- [ ] Zero new linter disable comments in the diff
- [ ] If closing 2+ cards in a row: STOP. Are you rushing? Verify each one fully.

Story points: sp:2
Estimate: 10 minutes, Claude-pace

---

## heimdall2-4qg.3: Emit SSO provisioning audit event — ADR-004 Phase 3

- Status: open
- Priority: P1
- Owner: lippold@gmail.com
- Estimate: 6 minutes
- Blocked by: `heimdall2-4qg.2`

## Phase 0 — MANDATORY REMINDER (read before every card)
**CORRECTNESS IS THE ONLY PRIORITY.** Best practices, standards, DRY, maintainable code — always. No shortcuts, no hacks, no workarounds. Card-close velocity is NOT a metric. Speed is NOT a goal. If an AC requires research, DO THE RESEARCH. If an AC requires a specific format (XLSX, YAML, etc.), implement THAT FORMAT — do not substitute. Read the ADR section referenced below BEFORE writing code. Every AC gets evidence before close. The `/project-ac-verify` gate blocks `bd close` mechanically — an independent reviewer checks your work.

---

Title: Emit SSO provisioning audit event — ADR-004 Phase 3

Description:
Emit one single-line JSON audit event whenever SSO self-provisioning is rejected by policy. The event must use ADR §3.5's exact five-field shape and must not expose password, token, or additional profile material.
Design doc: docs/adr-004-external-auth-user-provisioning-policy.md §3.5 item 3, §7.2 tests 8 and 11

Files:
- Create: none
- Modify: apps/backend/src/authn/authn.service.ts
- Test: apps/backend/src/authn/authn.service.spec.ts

First failing test:
`it('logs exactly one five-field audit event when SSO provisioning is denied')`

Acceptance criteria:
- [ ] Parsed JSON has exactly `event`, `provider`, `email`, `reason`, and `timestamp` with the pinned event/reason strings
- [ ] The email is the normalized external email and the timestamp is valid ISO-8601
- [ ] The event is emitted only for `account_not_provisioned`, not missing email, database error, successful create, or existing-user login
- [ ] The serialized event contains no password, token, or additional profile fields
- [ ] All work via TDD (failing test first)
- [ ] No regressions on existing tests
- [ ] Live tested against the running backend by triggering one denial; the exact stdout log line is pasted in card notes

Verification:
`yarn workspace heimdall-server test:ci && yarn workspace heimdall-server lint:ci && npx tsc --noEmit -p apps/backend/tsconfig.json`

Decision points:
- If the existing Winston formatter cannot emit the pinned object as one JSON line, stop and make the smallest logger change that preserves other AuthnService logs
- Free-form prose logging is simpler, but it is wrong because operators cannot reliably query the stable security event contract

Anti-patterns:
- Do NOT optimize for card-close velocity or speed
- Do NOT add extra fields or use substring-only assertions for the pinned event
- Do NOT move durable retention into the application; stdout remains the documented sink
- Do NOT add `rubocop:disable`/`eslint-disable` to work around warnings — fix the root cause
- Do NOT close this card with any AC unchecked — no deferrals, no "lower priority" exceptions

NOT in scope:
- Exception-filter diagnostic redaction or frontend error transport
- Deployment log retention and aggregation

Before closing:
- [ ] Re-read the Phase 0 preamble — correctness is the only priority
- [ ] **EVERY AC checkbox verified with evidence — NO EXCEPTIONS, NO DEFERRALS**
- [ ] Re-read Anti-patterns — confirm none violated
- [ ] Run the exact Verification command — paste output
- [ ] Live test proof pasted in card notes — method matches layer changed
- [ ] AC verification gate resolved with evidence (never `--force` to bypass)
- [ ] git diff shows ONLY files listed in Files section
- [ ] Zero new linter disable comments in the diff
- [ ] If closing 2+ cards in a row: STOP. Are you rushing? Verify each one fully.

Story points: sp:1
Estimate: 6 minutes, Claude-pace

---

## heimdall2-4qg.4: Preserve authentication error code — ADR-004 Phase 4

- Status: open
- Priority: P1
- Owner: lippold@gmail.com
- Estimate: 10 minutes
- Blocked by: `heimdall2-4qg.2`

## Phase 0 — MANDATORY REMINDER (read before every card)
**CORRECTNESS IS THE ONLY PRIORITY.** Best practices, standards, DRY, maintainable code — always. No shortcuts, no hacks, no workarounds. Card-close velocity is NOT a metric. Speed is NOT a goal. If an AC requires research, DO THE RESEARCH. If an AC requires a specific format (XLSX, YAML, etc.), implement THAT FORMAT — do not substitute. Read the ADR section referenced below BEFORE writing code. Every AC gets evidence before close. The `/project-ac-verify` gate blocks `bd close` mechanically — an independent reviewer checks your work.

---

Title: Preserve authentication error code — ADR-004 Phase 4

Description:
Preserve `account_not_provisioned` through the OAuth callback by adding an `authenticationErrorCode` cookie while retaining the existing human-readable error cookie and redirect. Redact callback secrets from filter diagnostics so the newly frequent policy rejection path cannot log OAuth codes, state, cookies, or authorization headers.
Design doc: docs/adr-004-external-auth-user-provisioning-policy.md §3.5 item 4, §7.5

Files:
- Create: apps/backend/src/filters/authentication-exception.filter.spec.ts
- Modify: apps/backend/src/filters/authentication-exception.filter.ts
- Test: apps/backend/src/filters/authentication-exception.filter.spec.ts

First failing test:
`it('sets authenticationErrorCode for account_not_provisioned and redirects to root')`

Acceptance criteria:
- [ ] An `HttpException` response object with `error: 'account_not_provisioned'` produces an exact-value `authenticationErrorCode` cookie and a 302 redirect to `/`
- [ ] A generic error without a structured code produces only the existing `authenticationError` cookie
- [ ] Existing human-readable cookie behavior and cookie security flags are preserved
- [ ] WARN diagnostics redact `code` and `state` query values and omit cookie/authorization headers; tests assert secrets are absent from serialized output
- [ ] The LDAP/local POST path remains the exact 401 object from Phase 2 and does not use redirect cookies
- [ ] All work via TDD (failing test first)
- [ ] No regressions on existing tests
- [ ] Live tested against the running mock OIDC callback with `curl`; response cookies, redirect, and the redacted log line are pasted in card notes

Verification:
`yarn workspace heimdall-server test:ci && yarn workspace heimdall-server lint:ci && npx tsc --noEmit -p apps/backend/tsconfig.json`

Decision points:
- If the existing cookie flags are unsafe, stop and raise that separately instead of silently changing legacy cookie behavior in this transport card
- Logging the entire request and masking only one field is simpler, but it is wrong because callback headers and query parameters contain multiple credential classes
- If a maintained API schema is introduced before implementation, stop and add cookie/401 transport documentation and contract validation atomically

Anti-patterns:
- Do NOT optimize for card-close velocity or speed
- Do NOT log raw `request.headers`, `request.query`, OAuth `code`, or OAuth `state`
- Do NOT replace the existing human-readable error cookie
- Do NOT add `rubocop:disable`/`eslint-disable` to work around warnings — fix the root cause
- Do NOT close this card with any AC unchecked — no deferrals, no "lower priority" exceptions

NOT in scope:
- Rendering the dedicated alert or changing the Phase 2 exception body
- General-purpose application logging redesign

Before closing:
- [ ] Re-read the Phase 0 preamble — correctness is the only priority
- [ ] **EVERY AC checkbox verified with evidence — NO EXCEPTIONS, NO DEFERRALS**
- [ ] Re-read Anti-patterns — confirm none violated
- [ ] Run the exact Verification command — paste output
- [ ] Live test proof pasted in card notes — method matches layer changed
- [ ] AC verification gate resolved with evidence (never `--force` to bypass)
- [ ] git diff shows ONLY files listed in Files section
- [ ] Zero new linter disable comments in the diff
- [ ] If closing 2+ cards in a row: STOP. Are you rushing? Verify each one fully.

Story points: sp:2
Estimate: 10 minutes, Claude-pace

---

## heimdall2-4qg.5: Render provisioning denial alert — ADR-004 Phase 5

- Status: open
- Priority: P1
- Owner: lippold@gmail.com
- Estimate: 12 minutes
- Blocked by: `heimdall2-4qg.4`

## Phase 0 — MANDATORY REMINDER (read before every card)
**CORRECTNESS IS THE ONLY PRIORITY.** Best practices, standards, DRY, maintainable code — always. No shortcuts, no hacks, no workarounds. Card-close velocity is NOT a metric. Speed is NOT a goal. If an AC requires research, DO THE RESEARCH. If an AC requires a specific format (XLSX, YAML, etc.), implement THAT FORMAT — do not substitute. Read the ADR section referenced below BEFORE writing code. Every AC gets evidence before close. The `/project-ac-verify` gate blocks `bd close` mechanically — an independent reviewer checks your work.

---

Title: Render provisioning denial alert — ADR-004 Phase 5

Description:
Render `account_not_provisioned` as one dedicated, provider-named login alert for both OAuth-cookie and LDAP-401 transports while suppressing generic snackbars for the recognized code. Preserve generic fallback behavior, record the clicked OAuth provider client-side across the redirect, and verify the local Sign Up visibility matrix affected by the scoped configuration.
Design doc: docs/adr-004-external-auth-user-provisioning-policy.md §3.2, §3.6, §7.6

Files:
- Create: apps/frontend/tests/unit/Login.spec.ts, apps/frontend/tests/unit/LDAPLogin.spec.ts, apps/frontend/tests/unit/LocalLogin.spec.ts
- Modify: apps/frontend/src/views/Login.vue, apps/frontend/src/components/global/login/LDAPLogin.vue, apps/frontend/src/components/global/login/LocalLogin.vue
- Test: apps/frontend/tests/unit/Login.spec.ts, apps/frontend/tests/unit/LDAPLogin.spec.ts, apps/frontend/tests/unit/LocalLogin.spec.ts

First failing test:
`it('renders the dedicated alert and suppresses the generic snackbar for the OAuth account_not_provisioned cookie')`

Acceptance criteria:
- [ ] OAuth callback reads and clears both error cookies, renders only the dedicated alert for the recognized code, and retains generic behavior for unknown/no codes
- [ ] OAuth provider selection is persisted before redirect, used in the alert, and cleared after handling
- [ ] LDAP 401 `account_not_provisioned` renders the same alert naming LDAP and suppresses the generic interceptor/snackbar path
- [ ] Alert copy contains administrator remediation and does not expose the policy value, enabled-provider list, or other configuration posture
- [ ] Local Sign Up is visible for unset/`false`/`sso` and hidden for `true`/`local`; direct `/signup` remains protected by the backend
- [ ] Design system compliance verified against `apps/frontend/src/plugins/vuetify.ts`; use Vuetify components and theme colors before adding custom styling
- [ ] All work via TDD (failing test first)
- [ ] No regressions on existing tests
- [ ] Live tested in the running app with Playwright screenshots in light and dark modes for the dedicated alert, plus both OAuth and LDAP transport proofs pasted in card notes

Verification:
`yarn workspace @mitre/heimdall-lite test:ci && yarn workspace @mitre/heimdall-lite lint:ci && npx tsc --noEmit -p apps/frontend/tsconfig.json`

Decision points:
- If provider identity cannot be retained using the existing `LocalStorageVal` utility without exposing configuration, stop before introducing a new persistence mechanism
- Reusing the generic snackbar is simpler, but it is wrong because it discards the ADR's remediation and provider context
- If a Vuetify component/theme token cannot satisfy the alert, stop before adding custom CSS or a new UI dependency

Anti-patterns:
- Do NOT optimize for card-close velocity or speed
- Do NOT infer the provider from server configuration or reveal which providers permit provisioning
- Do NOT leave the LDAP promise rejection to the global generic interceptor
- Do NOT add `rubocop:disable`/`eslint-disable` to work around warnings — fix the root cause
- Do NOT close this card with any AC unchecked — no deferrals, no "lower priority" exceptions

NOT in scope:
- Backend transport changes or adding an i18n framework
- Redesigning the full login page or adding a new design system

Before closing:
- [ ] Re-read the Phase 0 preamble — correctness is the only priority
- [ ] **EVERY AC checkbox verified with evidence — NO EXCEPTIONS, NO DEFERRALS**
- [ ] Re-read Anti-patterns — confirm none violated
- [ ] Run the exact Verification command — paste output
- [ ] Live test proof pasted in card notes — method matches layer changed
- [ ] AC verification gate resolved with evidence (never `--force` to bypass)
- [ ] git diff shows ONLY files listed in Files section
- [ ] Zero new linter disable comments in the diff
- [ ] If closing 2+ cards in a row: STOP. Are you rushing? Verify each one fully.

Story points: sp:2
Estimate: 12 minutes, Claude-pace

---

## heimdall2-4qg.6: Emit startup policy warnings — ADR-004 Phase 6

- Status: open
- Priority: P1
- Owner: lippold@gmail.com
- Estimate: 8 minutes
- Blocked by: `heimdall2-4qg.1`

## Phase 0 — MANDATORY REMINDER (read before every card)
**CORRECTNESS IS THE ONLY PRIORITY.** Best practices, standards, DRY, maintainable code — always. No shortcuts, no hacks, no workarounds. Card-close velocity is NOT a metric. Speed is NOT a goal. If an AC requires research, DO THE RESEARCH. If an AC requires a specific format (XLSX, YAML, etc.), implement THAT FORMAT — do not substitute. Read the ADR section referenced below BEFORE writing code. Every AC gets evidence before close. The `/project-ac-verify` gate blocks `bd close` mechanically — an independent reviewer checks your work.

---

Title: Emit startup policy warnings — ADR-004 Phase 6

Description:
Emit the migration warning once per boot when `REGISTRATION_DISABLED=true` and any OAuth or LDAP strategy is enabled. Also implement ADR §6.3's security warning when pre-provisioning is paired with `OIDC_USES_VERIFIED_EMAIL=false`, because unverified email matching can bind an external identity to the wrong local account.
Design doc: docs/adr-004-external-auth-user-provisioning-policy.md §3.7, §6.3, §7.1

Files:
- Create: none
- Modify: apps/backend/src/config/config.service.ts
- Test: apps/backend/src/config/config.service.spec.ts

First failing test:
`it('warns once when REGISTRATION_DISABLED is true and LDAP is the only enabled external strategy')`

Acceptance criteria:
- [ ] The §3.7 warning fires for `true` plus OAuth-only and for `true` plus LDAP-only configurations
- [ ] The §3.7 warning does not fire with no external strategy or with unset/`false`/`local`/`sso`
- [ ] Repeated `isRegistrationAllowed()` calls do not repeat startup warnings; logger spies prove once-per-bootstrap behavior
- [ ] Enabled-strategy detection is exactly `enabledOauthStrategies().length > 0 || LDAP_ENABLED=true`, not provider-class registration
- [ ] A distinct security warning fires when `OIDC_USES_VERIFIED_EMAIL=false` is combined with `REGISTRATION_DISABLED=true` or `sso`, and not for safer combinations
- [ ] Warning text states the migration/security consequences and remediation without logging secrets
- [ ] All work via TDD (failing test first)
- [ ] No regressions on existing tests
- [ ] Live tested by booting the backend with `true` plus LDAP-only and with `sso` plus unverified OIDC email; one instance of each expected warning is pasted in card notes

Verification:
`yarn workspace heimdall-server test:ci && yarn workspace heimdall-server lint:ci && npx tsc --noEmit -p apps/backend/tsconfig.json`

Decision points:
- If warning evaluation cannot remain in the one-time bootstrap validation call, stop before introducing stateful suppression in ordinary config getters
- Checking OAuth only is simpler, but it is wrong because LDAP is in the breaking cohort and shares the same provisioning gate
- Reusing `isRegistrationAllowed()` to emit warnings is simpler, but it is wrong because normal reads would spam operators

Anti-patterns:
- Do NOT optimize for card-close velocity or speed
- Do NOT detect enabled providers from unconditionally registered strategy classes
- Do NOT omit ADR §6.3's unverified-email combination warning
- Do NOT add `rubocop:disable`/`eslint-disable` to work around warnings — fix the root cause
- Do NOT close this card with any AC unchecked — no deferrals, no "lower priority" exceptions

NOT in scope:
- Fail-fast enum validation itself or release-note documentation
- A reusable in-app administrator advisory system

Before closing:
- [ ] Re-read the Phase 0 preamble — correctness is the only priority
- [ ] **EVERY AC checkbox verified with evidence — NO EXCEPTIONS, NO DEFERRALS**
- [ ] Re-read Anti-patterns — confirm none violated
- [ ] Run the exact Verification command — paste output
- [ ] Live test proof pasted in card notes — method matches layer changed
- [ ] AC verification gate resolved with evidence (never `--force` to bypass)
- [ ] git diff shows ONLY files listed in Files section
- [ ] Zero new linter disable comments in the diff
- [ ] If closing 2+ cards in a row: STOP. Are you rushing? Verify each one fully.

Story points: sp:1
Estimate: 8 minutes, Claude-pace

---

## heimdall2-4qg.7: Complete backend policy test matrices — ADR-004 Phase 7

- Status: open
- Priority: P1
- Owner: lippold@gmail.com
- Estimate: 15 minutes
- Blocked by: `heimdall2-4qg.4`, `heimdall2-4qg.6`, `heimdall2-4qg.2`, `heimdall2-4qg.3`, `heimdall2-4qg.5`, `heimdall2-4qg.1`

## Phase 0 — MANDATORY REMINDER (read before every card)
**CORRECTNESS IS THE ONLY PRIORITY.** Best practices, standards, DRY, maintainable code — always. No shortcuts, no hacks, no workarounds. Card-close velocity is NOT a metric. Speed is NOT a goal. If an AC requires research, DO THE RESEARCH. If an AC requires a specific format (XLSX, YAML, etc.), implement THAT FORMAT — do not substitute. Read the ADR section referenced below BEFORE writing code. Every AC gets evidence before close. The `/project-ac-verify` gate blocks `bd close` mechanically — an independent reviewer checks your work.

---

Title: Complete backend policy test matrices — ADR-004 Phase 7

Description:
Map every ADR §7.1, §7.2, §7.3, and §7.5 requirement to a concrete backend test and fill every gap left by Phases 1–6. Verify local registration under all scoped values, the administrator bypass, both startup-warning families, transport redaction, and failure behavior strong enough to catch broken implementations.
Design doc: docs/adr-004-external-auth-user-provisioning-policy.md §7.1–§7.5

Files:
- Create: none
- Modify: apps/backend/src/config/config.service.ts, apps/backend/src/authn/authn.service.ts, apps/backend/src/filters/authentication-exception.filter.ts, apps/backend/src/users/users.controller.ts, apps/backend/src/config/config.service.spec.ts, apps/backend/src/authn/authn.service.spec.ts, apps/backend/src/filters/authentication-exception.filter.spec.ts, apps/backend/src/users/users.controller.spec.ts
- Test: apps/backend/src/config/config.service.spec.ts, apps/backend/src/authn/authn.service.spec.ts, apps/backend/src/filters/authentication-exception.filter.spec.ts, apps/backend/src/users/users.controller.spec.ts

First failing test:
`it('allows anonymous local registration when REGISTRATION_DISABLED is sso')`

Acceptance criteria:
- [ ] A row-by-row map in card notes links every §7.1 row, all 14 §7.2 tests, all five §7.3 tests, and all three §7.5 tests to exact test names
- [ ] Local registration is allowed for unset/`false`/`sso`, rejected for `true`/`local`, and the existing administrator `ForceRegistration` bypass remains unchanged
- [ ] Config coverage includes `frontendStartupSettings().registrationEnabled`, fail-fast startup validation, the §3.7 migration warning, and the §6.3 unverified-email warning
- [ ] Three representative tests are mutation-checked and fail when their guarded implementation is deliberately broken
- [ ] All model callbacks traced for save/update calls — no callback-conflicts-endpoint bugs
- [ ] All enum values tested for fields that trigger callbacks; if the current `User` model has none, that fact is evidenced in card notes
- [ ] All work via TDD (failing test first)
- [ ] No regressions on existing tests
- [ ] Live tested against the running API with real user data: `curl` proofs for local registration under `local` and `sso`, plus an administrator bypass proof, are pasted in card notes

Verification:
`yarn workspace heimdall-server test:ci && yarn workspace heimdall-server lint:ci && npx tsc --noEmit -p apps/backend/tsconfig.json`

Decision points:
- If an ADR row cannot be tested as specified, stop and correct the ADR/card contract rather than silently omitting it
- Skipping rows already covered indirectly is simpler, but it is wrong because indirect coverage does not prove the explicit security matrix
- If mutation checks reveal a production gap, fix it in the listed production file rather than weakening the test

Anti-patterns:
- Do NOT optimize for card-close velocity or speed
- Do NOT use substring/type-only assertions that still pass when the protected behavior is broken
- Do NOT weaken or duplicate existing tests merely to make the checklist appear complete
- Do NOT assume a model callback is harmless — trace it through every controller action that triggers it
- Do NOT add `rubocop:disable`/`eslint-disable` to work around warnings — fix the root cause
- Do NOT close this card with any AC unchecked — no deferrals, no "lower priority" exceptions

NOT in scope:
- Frontend §7.6 tests or strategy/e2e §7.4 tests
- New provisioning features beyond ADR-004

Before closing:
- [ ] Re-read the Phase 0 preamble — correctness is the only priority
- [ ] **EVERY AC checkbox verified with evidence — NO EXCEPTIONS, NO DEFERRALS**
- [ ] Re-read Anti-patterns — confirm none violated
- [ ] Run the exact Verification command — paste output
- [ ] Live test proof pasted in card notes — method matches layer changed
- [ ] AC verification gate resolved with evidence (never `--force` to bypass)
- [ ] git diff shows ONLY files listed in Files section
- [ ] Zero new linter disable comments in the diff
- [ ] If closing 2+ cards in a row: STOP. Are you rushing? Verify each one fully.

Story points: sp:3
Estimate: 15 minutes, Claude-pace

---

## heimdall2-4qg.8: Fix LDAP rejection plumbing and integration coverage — ADR-004 Phase 8

- Status: open
- Priority: P1
- Owner: lippold@gmail.com
- Estimate: 18 minutes
- Blocked by: `heimdall2-4qg.2`

## Phase 0 — MANDATORY REMINDER (read before every card)
**CORRECTNESS IS THE ONLY PRIORITY.** Best practices, standards, DRY, maintainable code — always. No shortcuts, no hacks, no workarounds. Card-close velocity is NOT a metric. Speed is NOT a goal. If an AC requires research, DO THE RESEARCH. If an AC requires a specific format (XLSX, YAML, etc.), implement THAT FORMAT — do not substitute. Read the ADR section referenced below BEFORE writing code. Every AC gets evidence before close. The `/project-ac-verify` gate blocks `bd close` mechanically — an independent reviewer checks your work.

---

Title: Fix LDAP rejection plumbing and integration coverage — ADR-004 Phase 8

Description:
Make `LDAPStrategy.validate()` await `validateOrCreateUser()` and route rejection through Passport's `done(err)` contract instead of passing a pending promise as the user. Add OIDC and LDAP strategy tests plus a dedicated Cypress/CI deny-path proving `REGISTRATION_DISABLED=sso` rejects a valid external identity without creating a database row.
Design doc: docs/adr-004-external-auth-user-provisioning-policy.md §3.3, §7.4

Files:
- Create: apps/backend/src/authn/ldap.strategy.spec.ts, apps/backend/src/authn/oidc.strategy.spec.ts, test/integration/registration-policy.cy.ts
- Modify: apps/backend/src/authn/ldap.strategy.ts, apps/backend/src/authn/oidc.strategy.ts, apps/backend/test/.env-ci, .github/workflows/e2e-ui-tests.yml
- Test: apps/backend/src/authn/ldap.strategy.spec.ts, apps/backend/src/authn/oidc.strategy.spec.ts, test/integration/registration-policy.cy.ts

First failing test:
`it('passes account_not_provisioned to done when a valid LDAP user has no Heimdall account under sso')`

Acceptance criteria:
- [ ] LDAP awaits `validateOrCreateUser()`, calls `done(null, user)` on success, and calls `done(err)` on rejection
- [ ] LDAP's first-value behavior for multi-valued mail attributes is preserved and missing/empty mail returns `external_identity_missing_email`
- [ ] OIDC and LDAP strategy tests cover missing-user rejection for both `true` and `sso`, with no user creation
- [ ] A dedicated CI execution starts the real stack with `REGISTRATION_DISABLED=sso`, performs a valid LDAP or OIDC authentication, asserts `account_not_provisioned`, and proves the `Users` row count is unchanged
- [ ] The existing default-config Cypress LDAP JIT login continues to pass
- [ ] CI environment plumbing isolates the deny-path config from the ordinary JIT-on job
- [ ] All work via TDD (failing test first)
- [ ] No regressions on existing tests
- [ ] Live tested against the LDAP test container with `curl`/browser authentication and a database count before and after; output is pasted in card notes

Verification:
`yarn workspace heimdall-server test:ci && yarn workspace heimdall-server lint:ci && npx tsc --noEmit -p apps/backend/tsconfig.json && yarn test:ui --spec test/integration/registration-policy.cy.ts`

Decision points:
- The architecturally correct path is a dedicated real-stack CI execution using the repository's existing Postgres/LDAP/Cypress services; if workflow isolation cannot guarantee separate config, stop before sharing mutable state between jobs
- A unit test alone is simpler, but it is wrong because it cannot prove the Passport transport and database no-create invariant together
- If OIDC strategy behavior diverges from the shared service contract, fix the listed strategy rather than adding provider-specific policy logic

Anti-patterns:
- Do NOT optimize for card-close velocity or speed
- Do NOT leave `done(null, promise)` or rely on guard promise adoption
- Do NOT satisfy the database-backed AC with mocks or a service-only test
- Do NOT add provider-specific registration policy outside `AuthnService.validateOrCreateUser()`
- Do NOT add `rubocop:disable`/`eslint-disable` to work around warnings — fix the root cause
- Do NOT close this card with any AC unchecked — no deferrals, no "lower priority" exceptions

NOT in scope:
- Implementing the shared gate or testing every shipped OAuth provider against a live IdP
- Changing LDAP attribute selection beyond the documented first-value rule

Before closing:
- [ ] Re-read the Phase 0 preamble — correctness is the only priority
- [ ] **EVERY AC checkbox verified with evidence — NO EXCEPTIONS, NO DEFERRALS**
- [ ] Re-read Anti-patterns — confirm none violated
- [ ] Run the exact Verification command — paste output
- [ ] Live test proof pasted in card notes — method matches layer changed
- [ ] AC verification gate resolved with evidence (never `--force` to bypass)
- [ ] git diff shows ONLY files listed in Files section
- [ ] Zero new linter disable comments in the diff
- [ ] If closing 2+ cards in a row: STOP. Are you rushing? Verify each one fully.

Story points: sp:3
Estimate: 18 minutes, Claude-pace

---

## heimdall2-4qg.9: Update registration policy documentation — ADR-004 Phase 9

- Status: open
- Priority: P1
- Owner: lippold@gmail.com
- Estimate: 12 minutes
- Blocked by: `heimdall2-4qg.1`

## Phase 0 — MANDATORY REMINDER (read before every card)
**CORRECTNESS IS THE ONLY PRIORITY.** Best practices, standards, DRY, maintainable code — always. No shortcuts, no hacks, no workarounds. Card-close velocity is NOT a metric. Speed is NOT a goal. If an AC requires research, DO THE RESEARCH. If an AC requires a specific format (XLSX, YAML, etc.), implement THAT FORMAT — do not substitute. Read the ADR section referenced below BEFORE writing code. Every AC gets evidence before close. The `/project-ac-verify` gate blocks `bd close` mechanically — an independent reviewer checks your work.

---

Title: Update registration policy documentation — ADR-004 Phase 9

Description:
Update every in-repository environment surface and ship a dedicated upgrade note for the scoped enum and its two breaking-change cohorts. Draft the two required wiki updates in card notes and coordinate the out-of-repository packaging update without treating those external writes as implicitly authorized.
Design doc: docs/adr-004-external-auth-user-provisioning-policy.md §3.4, §6.2, §6.3, §8

Files:
- Create: docs/upgrade-notes/registration-disabled-enum.md
- Modify: apps/backend/.env-example, manifest.yml.example, CHANGELOG
- Test: none

First failing test:
`rg --fixed-strings "#REGISTRATION_DISABLED: 'false'" manifest.yml.example`

Acceptance criteria:
- [ ] `apps/backend/.env-example` describes unset/`false`/`true`/`local`/`sso`, the default, and that SSO includes LDAP
- [ ] `manifest.yml.example` uses a quoted string value and explains the YAML boolean-typing hazard
- [ ] `docs/upgrade-notes/registration-disabled-enum.md` is pinned to the release that first ships the change and covers both breaking cohorts, symptom, remediation, rolling-upgrade ordering, and rollback ordering
- [ ] `CHANGELOG` links to the dedicated upgrade note and identifies the change as breaking; it is not the only migration channel
- [ ] Operator guidance covers lowercase pre-provisioned email, LDAP first-mail-value behavior, administrator-controlled/verified IdP email, and the risk of `OIDC_USES_VERIFIED_EMAIL=false`
- [ ] Exact draft text for both wiki pages is pasted in card notes for maintainer review
- [ ] The `mitre/saf-packaging` `backend.env` update is explicitly handed off through an approved issue/PR or recorded as blocked pending authorization; the card is not closed with that deliverable silently deferred
- [ ] The repository surface audit is rerun and confirms there is still no Helm chart or additional direct listing to update
- [ ] All work via TDD (failing test first)
- [ ] No regressions on existing tests
- [ ] Live tested against the running app: documented `true`, `local`, `sso`, and invalid-value behavior is compared to actual startup/login output and pasted in card notes

Verification:
`node -e "require('yaml').parse(require('fs').readFileSync('manifest.yml.example', 'utf8'))" && rg -n "REGISTRATION_DISABLED|account_not_provisioned|OIDC_USES_VERIFIED_EMAIL" apps/backend/.env-example manifest.yml.example CHANGELOG docs/upgrade-notes/registration-disabled-enum.md && git diff --check`

Decision points:
- If the target release number is unknown, stop and obtain it before writing the version-pinned upgrade-note heading
- Wiki and `mitre/saf-packaging` writes require explicit maintainer authority; draft locally and request coordination rather than pushing implicitly
- A changelog-only note is simpler, but it is wrong because it does not give operators a stable, version-pinned pre-upgrade checklist
- If ADR-005 ships first, stop and move the approved wiki content into its exact VitePress page paths in the same reviewed change

Anti-patterns:
- Do NOT optimize for card-close velocity or speed
- Do NOT write `REGISTRATION_DISABLED` as an unquoted YAML boolean in the manifest example
- Do NOT omit the invalid-value cohort, mixed-version ordering, rollback ordering, or verified-email guidance
- Do NOT perform external wiki/repository writes without explicit authorization
- Do NOT add `rubocop:disable`/`eslint-disable` to work around warnings — fix the root cause
- Do NOT close this card with any AC unchecked — no deferrals, no "lower priority" exceptions

NOT in scope:
- Implementing the VitePress site or auditing downstream third-party charts
- Redesigning release automation

Before closing:
- [ ] Re-read the Phase 0 preamble — correctness is the only priority
- [ ] **EVERY AC checkbox verified with evidence — NO EXCEPTIONS, NO DEFERRALS**
- [ ] Re-read Anti-patterns — confirm none violated
- [ ] Run the exact Verification command — paste output
- [ ] Live test proof pasted in card notes — method matches layer changed
- [ ] AC verification gate resolved with evidence (never `--force` to bypass)
- [ ] git diff shows ONLY files listed in Files section
- [ ] Zero new linter disable comments in the diff
- [ ] If closing 2+ cards in a row: STOP. Are you rushing? Verify each one fully.

Story points: sp:2
Estimate: 12 minutes, Claude-pace

---

## heimdall2-4qg.10: Run live OIDC policy matrix — ADR-004 Phase 10

- Status: open
- Priority: P1
- Owner: lippold@gmail.com
- Estimate: 35 minutes
- Blocked by: `heimdall2-4qg.2`, `heimdall2-4qg.1`, `heimdall2-4qg.9`, `heimdall2-4qg.3`, `heimdall2-4qg.6`, `heimdall2-4qg.4`, `heimdall2-4qg.7`, `heimdall2-4qg.5`, `heimdall2-4qg.8`

## Phase 0 — MANDATORY REMINDER (read before every card)
**CORRECTNESS IS THE ONLY PRIORITY.** Best practices, standards, DRY, maintainable code — always. No shortcuts, no hacks, no workarounds. Card-close velocity is NOT a metric. Speed is NOT a goal. If an AC requires research, DO THE RESEARCH. If an AC requires a specific format (XLSX, YAML, etc.), implement THAT FORMAT — do not substitute. Read the ADR section referenced below BEFORE writing code. Every AC gets evidence before close. The `/project-ac-verify` gate blocks `bd close` mechanically — an independent reviewer checks your work.

---

Title: Run live OIDC policy matrix — ADR-004 Phase 10

Description:
Execute the complete registration-policy matrix against a running server and real OIDC provider after Phases 1–9 pass. Capture existing-user, missing-user, normalization, alert, startup-warning, and invalid-value evidence so provider-specific claim behavior cannot remain hidden behind mocks.
Design doc: docs/adr-004-external-auth-user-provisioning-policy.md §5, §8, §10 Phase 10

Files:
- Create: none
- Modify: none
- Test: none

First failing test:
`Manual matrix: a valid unknown OIDC identity under REGISTRATION_DISABLED=sso is rejected with account_not_provisioned and creates no Users row`

Acceptance criteria:
- [ ] An existing OIDC user signs in successfully under unset/`false`/`true`/`local`/`sso`
- [ ] An unknown OIDC user is created under unset/`false`/`local` and rejected without a row under `true`/`sso`
- [ ] A mixed-case OIDC email matches a lowercase pre-provisioned account under `true` and `sso`
- [ ] Dedicated provider-named alert is observed for both deny values, with Playwright screenshots in light and dark modes
- [ ] The §3.7 migration warning appears once for `true` plus OIDC; the §6.3 warning appears for unverified-email pre-provisioning; neither appears in configurations where it is not specified
- [ ] An invalid non-empty value refuses startup and names all valid values
- [ ] Every matrix cell has fresh request, response, and database evidence in card notes
- [ ] Any divergence is recorded on the epic and the ADR is corrected before this card closes
- [ ] All work via TDD (failing test first)
- [ ] No regressions on existing tests
- [ ] Live tested against the running app — the complete OIDC matrix and screenshots are the required proof

Verification:
`yarn workspace heimdall-server test:ci && yarn workspace @mitre/heimdall-lite test:ci && yarn workspace heimdall-server lint:ci && yarn workspace @mitre/heimdall-lite lint:ci && npx tsc --noEmit -p apps/backend/tsconfig.json && npx tsc --noEmit -p apps/frontend/tsconfig.json`

Decision points:
- Any observed IdP claim, email, or transport behavior that contradicts ADR §1.2 or §6.3 must stop closure and be reconciled in the ADR
- Sampling only one allow and one deny value is simpler, but it is wrong because the enum's compatibility semantics differ by path and value
- If the deployed app cannot render a supported light-mode screenshot, stop and document the design-system limitation before deciding how to satisfy visual verification

Anti-patterns:
- Do NOT optimize for card-close velocity or speed
- Do NOT infer matrix results from unit tests, old logs, or repeated use of the same user state
- Do NOT skip database before/after checks on denied provisioning
- Do NOT add `rubocop:disable`/`eslint-disable` to work around warnings — fix the root cause
- Do NOT close this card with any AC unchecked — no deferrals, no "lower priority" exceptions

NOT in scope:
- Live testing every shipped provider; OIDC is the enterprise reference path
- Implementing fixes without first adding the failing automated regression to the owning card scope

Before closing:
- [ ] Re-read the Phase 0 preamble — correctness is the only priority
- [ ] **EVERY AC checkbox verified with evidence — NO EXCEPTIONS, NO DEFERRALS**
- [ ] Re-read Anti-patterns — confirm none violated
- [ ] Run the exact Verification command — paste output
- [ ] Live test proof pasted in card notes — method matches layer changed
- [ ] AC verification gate resolved with evidence (never `--force` to bypass)
- [ ] git diff shows ONLY files listed in Files section
- [ ] Zero new linter disable comments in the diff
- [ ] If closing 2+ cards in a row: STOP. Are you rushing? Verify each one fully.

Story points: sp:2
Estimate: 35 minutes, Claude-pace exception for live IdP round trips

