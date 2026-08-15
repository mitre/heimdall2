# ADR-008: Login Must Not Block on Application Data

**Status:** Accepted — path A (fix in this PR), ruled by Aaron 2026-08-15
**Date:** 2026-08-15
**Author:** Aaron Lippold
**Branch:** `feature/fips-compliant-password-hashing`
**PR charter:** `heimdall2-zv9y`
**Related:** `heimdall2-8han` (lint-sweep behavior-change ledger), `heimdall2-hl1.7.3`
(Vuex→Pinia), `heimdall2-3ys` (composables), `heimdall2-izw.16` (better-auth)

> **Numbering.** ADR-007 is reserved by card `heimdall2-8dy` (API-key credential hashing).

> **Revision note.** The first draft of this ADR (2026-08-15) framed the login coupling as a
> latent design flaw and proposed a frontend-wide data-loading policy. A six-agent review
> refuted that framing. **The coupling is branch-local and three days old**, several supporting
> claims were wrong, and one proposed change would have caused a regression. This revision
> re-grounds the document on `origin/master` vs. this branch. Every correction is attributed
> inline as `[review: <lens>]`. Nothing from the first draft is silently retained.

## Evidence standard

Every claim cites a file and line at commit `40e29b572`, a git object, or an official framework
document. Claims about *this branch* are additionally checked against `origin/master`, because
the first draft's central error was never asking whether the cited code was upstream or
branch-local `[review: adversarial]`.

## Context

### What actually happened

On 2026-08-14 no user could enter the Heimdall GUI. Two independent defects, both introduced by
the ESLint sweep on this branch, combined:

1. **`3bdd1f146`** (autofix) alphabetized `GroupsController`, moving `@Get(':id')` above
   `@Get('/my')`. NestJS registers routes in declaration order, so `GET /groups/my` resolved to
   `findById('my')` and Postgres rejected `"my"` as a bigint. Fixed and closed as
   `heimdall2-8han.3`.
2. **`14c13a0e9`** ("stop losing async flow in stores and routing") converted three
   fire-and-forget calls into an awaited chain, making login **block** on that failing endpoint.

**Both are the same root cause: an automated lint cleanup silently changing runtime behavior.**
That is the subject of epic `heimdall2-8han`, and `14c13a0e9` belongs in `8han.2`'s ledger.

### The coupling is branch-local — this is the correction that reframes the document

`git merge-base --is-ancestor 14c13a0e9 origin/master` → **not on master**. On master:

```
origin/master:apps/frontend/src/store/server.ts:200   this.GetUserInfo();          // unawaited
origin/master:apps/frontend/src/store/groups.ts       this.FetchAllGroups();       // fire-and-forget
                                                      this.FetchMyGroups();
```

The commit that changed it:

```
-    this.GetUserInfo();
+    // Awaited: Login resolved before the profile fetch finished, racing the
+    // post-login navigation that callers chain onto it.
+    await this.GetUserInfo();
```

On master, `router.push('/')` ran while those fetches were still in flight. There was no "path
that forgot the `catch`" — there was nothing to catch until this branch made the promise
awaited `[review: adversarial]`. **The first draft's "asymmetry proves this is an oversight"
argument is withdrawn.**

The awaits were not gratuitous: the commit messages record real defects (a race against
post-login navigation; a loading flag flipping false before either list resolved). The fix must
preserve those intents, not revert them.

### Where the blocking chain lives

| Step | Location |
|---|---|
| `await ServerModule.Login(creds)` | `LocalLogin.vue:194` |
| ↳ token + userID committed **and persisted to localStorage** | `store/server.ts:93-97`, `:100-103`, `:195-196` |
| ↳ `await handleLogin()` → `await GetUserInfo()` | `store/server.ts:199` |
| ↳ `GET /users/{id}`, profile committed | `store/server.ts:253-255` |
| ↳ `await FetchAllUsers()` → `GET /users/user-find-all` | `store/server.ts:261` |
| ↳ `await GroupsModule.FetchGroupData()` → `Promise.all([...])` **rejects** | `store/server.ts:262`, `store/groups.ts:121` |
| `void this.$router.push('/')` — never reached | `LocalLogin.vue:197` |

`login()` is `try { … } finally { … }` with no `catch` (`LocalLogin.vue:193-201`).

### Severity, corrected

The first draft claimed "the blast radius is total." **It is not.** The token and userID are
persisted to `localStorage` *before* the failing call, and on reload `CheckForServer` reads them
back and swallows the failure (`store/server.ts:173-183`, `:185`). A user who presses F5 lands
inside the application with a valid session and a populated profile; only the group lists are
empty `[review: adversarial]`. The defect is real and user-blocking on the login path, but it is
recoverable by refresh.

### Every entry path — and why fixing `LocalLogin.vue` is not enough

| Entry path | Route into the chain |
|---|---|
| Local login | `LocalLogin.vue:194` → `Login` → `handleLogin` → `GetUserInfo` |
| LDAP | `LDAPLogin.vue:77` → `LoginLDAP` → `handleLogin` → `GetUserInfo` — **no `try` at all** |
| GitHub / GitLab / Google / OIDC / Okta | `LocalLogin.vue:223` `location.assign('/authn/<site>')` → backend `redirect('/')` (`authn.controller.ts:179-181`) → **`CheckForServer:183`** → `GetUserInfo`. These never touch a `Login*` action. |
| Page reload | `router.ts:86` → `CheckForServer:183` → `GetUserInfo` |

`ServerModule.LoginGithub` (`store/server.ts:214-222`) has **zero callers** — dead code
`[review: cartographer, architecture]`.

**All four paths funnel through `GetUserInfo:261-262`.** That is the single choke point
`[review: cartographer]`.

### What the prefetch serves

`GET /users/user-find-all` returns every user in the deployment
(`apps/backend/src/users/users.controller.ts:93-100`) on every login. Its consumers are **six**
sites, not the five the first draft listed: `GroupManagement.vue:250-259`, `Users.vue:138,:219`,
`GroupModal.vue:188`, `EditEvaluationModal.vue:139`, `EvaluationMixin.ts:14`,
`RegistrationModal.vue:221` `[review: cartographer]`.

**Withdrawn claim.** The first draft said "two of those sites already fetch for themselves… the
per-view pattern is already established." Both cited lines are **post-mutation store refreshes**
— `GroupModal.vue:216` inside `save()` after the write, `RegistrationModal.vue:221` after
`Register()` — not initial-load fetches. They are evidence *for* the store-as-cache design, not
precedent against it `[review: citations, adversarial]`. Four of the six consumers have no fetch
of their own, so Phase 2's blast radius is ~3× what the first draft stated `[review: citations]`.

### What the frameworks and libraries say

- **vue-router 3** offers only the guard hooks; there is no session-resolution hook and no
  `router.isReady()` (that is vue-router 4). The established substitute is a **memoized
  in-flight promise**. Relevant because `router.ts:86` currently awaits `CheckForServer()` on
  **every navigation** `[review: framework]`.
- **NestJS** signs roles into the payload in its own guide, and this backend already does:
  `authn.service.ts:93-98` signs `{email, forcePasswordChange, role, sub}`
  `[review: architecture, framework]`.
- **Vue is `~2.7.16`** (`apps/frontend/package.json:94`), not 2.6 — the Composition API is
  built in `[review: framework]`.
- **`@tanstack/vue-query` v5** declares peer `vue: ^2.6.0 || ^3.3.0` via `vue-demi`, so it runs
  on 2.7.16 today and survives the Vue 3 + Pinia migrations unchanged. `swrv` (frozen
  `v2-latest` 0.10.0, no releases 2024-2026) and `vue-promised` (last publish 2021) are rejected
  on supply-chain grounds under `heimdall2-30c` `[review: framework]`.
- **better-auth** peers on `vue: ^3.0.0` and is unusable on 2.7. It would replace the
  `GetUserInfo` session bootstrap at `izw.16` — but it says nothing about group lists, so it does
  **not** obsolete per-view loading `[review: framework]`.

### Two pre-existing defects found during review — carded separately, not fixed here

1. **The 401 auto-logout is dead in a default deployment, and compares two different things.**
   `main.ts:38-49` gates logout on `origin === ServerModule.externalUrl`.
   - *Why it is dead by default:* `externalUrl` initializes `''` (`store/server.ts:68`) and is
     populated from the backend's `EXTERNAL_URL` (`store/server.ts:113`), which ships commented
     out (`packaging/rpm/heimdall-backend.env:13`). A real origin never equals `''`
     `[review: security]`.
   - *Why it is fragile even when set:* `origin` is derived from `error.config?.url`
     (`main.ts:33-35`), and Heimdall's own API calls use **relative** URLs (`/users/{id}`,
     `/groups/my`), which resolve against `location.origin`. So the left side is always the
     page's origin while the right side is a **backend-configured absolute URL** — they match
     only when an operator sets `EXTERNAL_URL` to exactly the browser's origin. Measured at
     `3090a5f0f`.

   Either way every 401 — including a revoked token — renders a toast and the session continues.
   Session termination is STIG-relevant.
2. **`GetUserInfo`'s fail-closed path is unreachable.** `axios.get` at `:253` sits *outside* the
   `try` opening at `:254`, so the `catch → Logout()` whose comment says "clear their token"
   cannot run for its stated purpose `[review: security, architecture]`.

## Decision

**Login completes when credentials are exchanged. Application data must never block it, and
must never deny a session.**

1. **Only the JWT is session-critical — and `requiresAdmin` needs no change to make that true.**
   The review stated that the guard "reads `role` from the JWT claim already signed at
   `authn.service.ts:93-98`". **Measured at `3090a5f0f`, that is false:** `router.ts:99` reads
   `ServerModule.userInfo.role`, i.e. the *fetched profile*. The claim is signed, but the guard
   does not consult it `[review: architecture, framework, security — premise false]`.

   The proposed remedy (switch the guard to the claim) is **dropped from Phase 1**, because the
   risk it dissolves does not exist once the choke-point fix is scoped correctly:
   - Phase 1 releases only the **two secondary fetches** (`FetchAllUsers`, `FetchGroupData`). The
     profile fetch and its `SET_USER_INFO` commit stay awaited inside `GetUserInfo`, so
     `userInfo.role` is populated before any post-login navigation. There is no ordering race for
     an admin deep-link to lose.
   - Switching to the claim would be **strictly less current**: this ADR's own Consequences record
     that the claim is stale until token expiry, whereas the profile is re-fetched per login and
     reload. Trading a fresh value for a stale one to fix a race that Phase 1 already prevents is
     a downgrade.

   The load-bearing half of the point stands unchanged and is why nothing here is a security
   decision: the frontend guard is **UI routing only**. `JwtStrategy` re-loads the user from the
   database per request, so neither the claim nor the profile ever authorizes anything.
2. **The fix goes at the choke point, not the call sites.** `GetUserInfo:261-262` stops awaiting
   the secondary fetches; `groups.ts:121` stops being fail-fast. One change covers local, LDAP,
   all five OAuth providers and page reload. Per-component `catch` blocks would fix one path of
   four `[review: cartographer]`.
3. **`CheckForServer` must NEVER reject.** It is awaited inside the router guard (`router.ts:86`),
   and the guard's own comment records that a rejection there means `next()` is never called and
   navigation hangs silently. It classifies internally — connection failure / 401 / server error
   — commits state, and always resolves. **The first draft's "make it distinguish errors" would
   have re-created that hang for every OAuth login and reload** `[review: architecture]`.
4. **Fail-soft applies to transport and 5xx only.** A **401** on any request terminates the
   session and returns to `/login`; it is never a toast. A **403** renders as an authorization
   error `[review: security]`.
5. **Errors surface through the existing channel.** `main.ts:48` → `SnackbarModule.HTTPFailure`
   already fires for every failed request. Call sites must **not** add their own toast — that
   double-reports. The repo's existing idiom ("Fire-and-forget: HTTP failures surface via the
   interceptor snackbar", `UserManagement.vue:111-113`) is the pattern `[review: cartographer]`.
6. **`CheckForServer()` already runs once per page load — no change needed, only a pinning
   test.** The framework lens proposed memoizing it on the belief that `router.ts:86` pays for it
   on every navigation. **Measured at `3090a5f0f`, that is false:** `server.ts:163` early-returns
   on `!this.loading`; `loading` initializes `true` (`:66`) and is only ever committed `false`
   (the `finally` at `:189`). `SET_LOADING(true)` is never called on this module, so the body
   executes exactly once per page load and the early return covers every later navigation. The
   behavior is correct and **unpinned** — Phase 1 adds the test, not the memoization
   `[review: framework — claim withdrawn on measurement]`.
7. **The intended destination survives login** — including across the full page reload that OAuth
   performs — with the `redirect` value validated (`^/(?!/)`) and navigated via `router.push`,
   never `location.href`/`location.replace` `[review: security]`.

   > **PENDING SCOPE RULING — this is a NEW FEATURE, not a regression repair.** Measured at
   > `3090a5f0f`, **no post-login redirect mechanism exists**: `router.ts:90-97` calls
   > `next('/login')` and discards the intended destination, and the only `redirect` token in the
   > frontend is `router.ts:77`, an unrelated vue-router catch-all. There is therefore **no
   > open-redirect vulnerability to fix** — the validation the security lens specified guards a
   > parameter nothing reads. Building it is a UX improvement worth having, but it is not part of
   > repairing what `14c13a0e9` broke, which is the basis on which path A was ruled. Carded only
   > if Aaron scopes it into this PR.
8. **Later, application data moves per-view** — using `@tanstack/vue-query`, not five hand-rolled
   loading/error pairs — delivered inside `hl1.7.3`/`3ys`, which rewrite these files anyway.

## Alternatives Considered

### Alternative A: Do nothing
- **Why rejected:** the branch currently ships a regression that blocks GUI login. Master does
  not have it. Shipping `14c13a0e9` as written is not an option.
  *(The first draft rejected A for "the failure mode is intact", which was wrong — the failure
  mode does not exist on master `[review: adversarial]`.)*

### Alternative B: Revert `14c13a0e9`
- **Pros:** restores known-good master behavior exactly.
- **Cons:** reverts two legitimate fixes the commit made (the navigation race; the loading flag).
- **Why rejected:** throws away real work to undo a side effect.

### Alternative C: Per-component `catch` in the login handlers
- **Why rejected:** covers local + LDAP only. The five OAuth providers and page reload enter via
  `CheckForServer`, never through a `Login*` action `[review: architecture, cartographer]`.

### Alternative D: Full per-view migration now
- **Cons:** four of six consumers need new fetch + loading/error UI; collides with `hl1.7.3`
  and `3ys`, which rewrite `store/server.ts` and `store/groups.ts`.
- **Why rejected as Phase 1:** it is the right destination, and it is nearly free inside the
  rewrites that are already planned. Note the hazard: `GroupsModule.loading` starts `true` and is
  cleared only in `FetchGroupData` (`groups.ts:26,:122`), so removing the prefetch without adding
  a view fetch leaves that table spinning forever `[review: architecture]`.

### Alternative E (chosen): Un-block at the choke point, defer the migration
Stop awaiting the secondary fetches inside `GetUserInfo`, attach `.catch()` so nothing floats
(preserving what `14c13a0e9` was cleaning up), make `FetchGroupData` settled, and read `role`
from the JWT claim. Application data moves per-view later, with `vue-query`, inside the planned
rewrites.
- **Pros:** ~4 small edits; covers every entry path; preserves the commit's legitimate intents;
  nothing written now is thrown away by the ports.
- **Cons:** the full-directory prefetch remains until Phase 2 — it can no longer deny a session,
  but it still runs on every login.

### Alternative F: Memoized `ensure*()` store actions
Fetch-once-on-demand behind a shared promise, called from getters/views.
- **Why not now:** a real option, and closer to `vue-query`'s model — which is why Phase 2 uses
  the library rather than hand-building this `[review: architecture]`.

## Consequences

**Easier:** a failing list degrades to an empty table, not a lockout · failures are diagnosable
at the layer that owns them · `hl1.7.3` has a written target.

**Harder:** two new states per view ("not loaded" vs "failed") once Phase 2 lands · the JWT role
claim is stale until expiry, which must be documented as UI-only.

**Risks:**
- *`allSettled` without an error channel yields "loaded and empty".* Real, and **deferred to
  Phase 2 rather than mitigated in Phase 1** `[review: adversarial, cartographer — mitigation
  re-sited on measurement]`. The review proposed adding a `groups.error` field "shaped like
  `store/evaluations.ts:79-92`". Measured at `3090a5f0f`, that citation does not support it:
  `:79-92` is the `SET_LOADING(true)` + `try/finally` **loading** pattern and contains no error
  field, and **no data store in this repo has one** — the only `error` state is `snackbar.ts:25`,
  which is the interceptor channel Decision §5 already routes through. A `groups.error` added now
  would have zero consumers, because nothing renders it until Phase 2 gives each view its own
  loading/error pair.
  - **Phase 1 takes the half that is precedented and load-bearing:** `SET_LOADING(true)` on entry
    to `FetchGroupData`, so a refetch stops rendering "loaded, empty" (`groups.ts:26,:122` — the
    flag is set `false` once and never back to `true`).
  - **Phase 2 owns the error channel**, where `@tanstack/vue-query` supplies per-query error state
    natively. That is a further reason to prefer the library over hand-building it here.
- *Phase 2 never gets scheduled.* It is carded standalone, not merely as a dependency of
  unscheduled epics `[review: architecture]`.
- *Per-view fetching trades one login fetch for N per-visit fetches.* `vue-query`'s cache is the
  mitigation, and is a reason to prefer it over hand-rolled hooks `[review: adversarial]`.

## Implementation Plan

### Phase 1 — Un-block login (this PR; fixes a regression this branch introduced)

**Files**
- Modify: `apps/frontend/src/store/server.ts` — `GetUserInfo:261-262` non-blocking with
  `.catch()`; move `axios.get:253` inside the `try`; delete dead `LoginGithub:214-222`
  (`CheckForServer` needs no change — Decision §6)
- Modify: `apps/frontend/src/store/groups.ts` — settled semantics at `:121`; `SET_LOADING(true)`
  on entry (no `error` field — see Risks; Phase 2 owns the error channel)
- ~~Modify `apps/frontend/src/router.ts` — read `role` from the JWT claim~~ **dropped**, premise
  false and the change would be a downgrade (Decision §1)
- `apps/frontend/src/router.ts` + the login components (`LocalLogin.vue`, `LDAPLogin.vue`,
  `views/Login.vue`) and a shared `completeLogin()` seam — **only if the `redirect` feature is
  scoped in** (Decision §7, pending ruling). Not otherwise touched by Phase 1.
- Modify: `apps/frontend/src/main.ts` — repair the 401 origin gate so auto-logout actually fires
- Test: `apps/frontend/tests/unit/LocalLogin.spec.ts`, `LDAPLogin.spec.ts` (both new)

**Acceptance criteria**
- [ ] A rejecting `GET /groups/my` does not prevent navigation — asserted for the local **and**
      LDAP paths, and for the `CheckForServer` path that OAuth and reload use
- [ ] MUTATION PROOF: each test fails against the current branch code
- [ ] `CheckForServer` never rejects — a 500 during it still completes navigation
- [ ] A **401** on any fetch terminates the session and returns to `/login`; verified by test
- [ ] `redirect` accepts only `^/(?!/)`; `//evil.tld`, `https://evil.tld`, `/\evil.tld` all fall
      back to `/`; navigation uses `router.push`
- [ ] No new toast is added at any call site — the interceptor remains the single channel
- [ ] `requiresAdmin` is UNCHANGED, and an admin deep-linking to `/admin` is never bounced —
      because the profile commit stays awaited ahead of navigation (Decision §1). Pinned by test,
      not implemented
- [ ] `CheckForServer` runs once per page load, not once per navigation — **pinned by test, not
      implemented**; the `!this.loading` early return already provides it (Decision §6)
- [ ] TDD; no regressions; live tested (single-theme app — one Playwright capture is complete)

**Verification**
`yarn workspace @mitre/heimdall-lite vitest run && yarn workspace @mitre/heimdall-lite build`

### Phase 2 — Per-view application data (deferred into `hl1.7.3` / `3ys`)

**Files:** `GroupManagement.vue` (add its fetch — rendered by both `views/Groups.vue:23` and
`views/Admin.vue:39`, so it belongs in the component), `Users.vue`, `EditEvaluationModal.vue`,
`EvaluationMixin.ts` (extract the hidden `myGroups` filter at `:14` **before** lists load
lazily), the two stores, plus `@tanstack/vue-query` adoption and an interceptor opt-out so
per-view errors do not double-report `[review: cartographer, framework]`.

**Acceptance criteria**
- [ ] `GetUserInfo` no longer fetches the user directory or group lists
- [ ] Every consumer loads its own data with loading and error states
- [ ] Bundle-size delta of `@tanstack/vue-query` measured before adoption, not assumed
- [ ] TDD; no regressions

### Verification Strategy

- **The regression test that matters:** reject `/groups/my` and assert navigation still occurs —
  on all four entry paths. It must fail against this branch and **pass against `origin/master`**,
  which is the check the first draft got wrong.
- **Edge cases:** OAuth arrival with a failing list · reload with a failing list ·
  `CheckForServer` erroring inside the guard · 401 vs 500 on a secondary fetch · admin deep-link
  to `/admin` · `redirect=//evil.tld`.
- **Security:** authorization is untouched; the frontend guard is UX and the backend re-derives
  authorization per request from the database (verified across all 11 controllers
  `[review: security]`). The JWT `role` claim is a UI hint and never an authorization decision.
