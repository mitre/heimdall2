# ADR-006: PBKDF2 Password Hashing via a FIPS 140-3 Validated Module

**Status:** Proposed
**Date:** 2026-07-29
**Author:** Aaron Lippold
**Branch:** `feature/fips-compliant-password-hashing`
**Base:** `master` @ `2e1649c9e`

> **On the title.** This document deliberately avoids the phrase "FIPS compliant."
> FedRAMP *Policy for Cryptographic Module Selection and Use* v1.1.0 (approved
> 2025-01-16), rule **FRR8**, states that representations "must use terminology
> approved by NIST" and that CSPs "must not use ambiguous or CSP-defined terms
> such as 'FIPS compliant.'" The accurate claim is that password hashing is
> performed by a FIPS 140-3 **validated module**. That phrasing is used throughout.

## Evidence standard

Every normative claim below is marked:

- **[V]** — verified this session against a primary source (NIST/CMVP PDF, DISA STIG API, vendor source or docs, or a direct read of this repository at `2e1649c9e`).
- **[U]** — plausible but **unverified**. Not load-bearing. Must be confirmed before it appears in any SSP, POA&M, or assessor-facing artifact.

This standard exists because an earlier review pass of this ADR produced confident, well-formatted citations — STIG check text, CCI numbers, CMVP guidance sections, FedRAMP rule IDs — that had **never been read**. The reviewer subsequently retracted them. Independent verification against primary sources later confirmed most of the substance and **refuted one central argument** (see §3 on IG 2.4.A, which ran opposite to how it was first cited).

The process failure is instructive and worth stating plainly: **an unsourced citation is worthless regardless of how correct it sounds, and a plausible-sounding one is worse than none — it survives review.** Nothing marked [V] below rests on recollection; each was read this session, and where two reviewers disagreed the primary source decided it.

Two consequences for anyone extending this document:

- **Do not promote a [U] to [V] without reading the source.** The [U] list is short and specific; it is not a formality.
- **Assessor-facing artifacts must cite only [V] items.** SP 800-53A Rev 5's SC-13 assessment objects explicitly include "cryptographic module validation certificates; list of FIPS-validated cryptographic modules," which is exactly the class of claim that was fabricated the first time.

## Context

Heimdall2 hashes passwords with bcrypt via `bcryptjs` (pure JavaScript, cost factor 14) and stores API keys as bcrypt hashes of JWT signatures.

**The core problem is boundary, not strength.** bcrypt at cost 14 is cryptographically strong. But `bcryptjs` is pure JavaScript — it never calls `node:crypto` or OpenSSL, so on a FIPS-enabled host it executes *undetected and unblocked*, entirely outside the validated module. **[V]** (verified by reading the package; Chainguard's `node-fips` image documentation flags it by name).

**What this actually costs us, stated precisely.** An earlier draft of this ADR overstated the exposure. Corrected:

- **V-222542** ("must only store cryptographic representations of passwords", **CAT I**, CCI-004062 / CCI-000196) requires "strong cryptographic hash functions" with a random salt and prohibits MD5. **The phrase "FIPS-validated" does not appear in its title, description, check text, or fix text.** bcrypt already satisfies it today. **[V]** — DISA STIG API.
- **V-222571** ("must use FIPS-validated cryptographic modules when generating hashes", **CAT II**, CCI-002450) is the rule we actually fail — and its finding condition is **invocation-scoped**, not storage-scoped. **[V]**
- **V-222572** ("must utilize FIPS-validated cryptographic modules when protecting unclassified information that requires cryptographic protection", **CAT II**, CCI-002450) is the closest general FIPS-invocation rule. The prior draft omitted it entirely. **[V]**

So the honest framing is: **two CAT II findings, not a CAT I failure.** That is still worth fixing — but the ADR must not overstate it to an assessor.

**Supporting control.** SP 800-53A Rev 5 **IA-5(1)(d)**: "for password-based authentication, passwords are stored using an **approved salted key derivation function**, preferably using a keyed hash." **[V]** PBKDF2-HMAC fits this text more directly than bcrypt does. This is the strongest affirmative control for the change and the prior draft never cited it.

### Prior art in this repository

**`fips_compliance` branch (2023):** `--force-fips` startup, Postgres `scram-sha-256`, and `libs/common/crypto/crypto.ts` (**note: no `src/` segment** — the prior draft's path was wrong) implementing PBKDF2-SHA256 @ 600k with a `useBCrypt` flag. Defects: synchronous `pbkdf2Sync`, no self-describing format, `===` comparison rather than `timingSafeEqual`, iterations hardcoded twice. **[V]**

**Heimdall v3 (`a52f6ceb`, `mitre/heimdall`):** PBKDF2-SHA512, format `pbkdf2-sha512$iterations$salt$key`, async, `timingSafeEqual`, env-configurable. Hard-rejects legacy hashes. Returns a bare boolean because better-auth's `verify` contract requires it. **[V]**

### What comparable projects do **in FIPS mode**

The prior draft surveyed seven projects, concluded "five of seven use lazy rehash — it is industry standard," and used that to justify an unconditional bcrypt fallback. **That survey measured non-FIPS migration behavior and imported the conclusion into a FIPS document.** Corrected, scoped to FIPS mode specifically:

| Project | FIPS-mode behavior | Verified |
|---|---|---|
| **Keycloak** | **Refuses.** `Argon2PasswordHashProviderFactory.isSupported()` returns false under FIPS; the provider never registers, so `verify()` is never reached. Docs: affected users "will not be able to login after switch to the FIPS environment" — remedy is "ask users to reset the password." | **[V]** source + docs |
| **GitLab** | **Gates on FIPS mode**, migrates lazily, with a forced-reset endgame. Docs: "Bcrypt: Used by default. **PBKDF2+SHA512: Used when FIPS mode is enabled.**" Concedes "these passwords cannot be re-encrypted without user help." Issue **#360659** — "Force password resets for users with bcrypt login passwords." Ships `gitlab:password:check_hashes`. | **[V]** docs + issues |
| **Mattermost** | Migrates lazily, **and its documentation is inaccurate.** `bcrypt.go` carries no `//go:build` FIPS exclusion, so pure-Go bcrypt compiles into and runs inside the FIPS build — while its FIPS/STIG doc claims "All application-level code uses only FIPS-approved algorithms." | **[V]** source + docs |

**The prior draft's §3 was weaker than both Keycloak and GitLab** — ungated, unconditional, no terminal state — i.e. it reproduced Mattermost's posture in a document asserting the opposite. That is the single most important correction in this revision.

### The Grafana lesson (unchanged, and still the reason for the format choice)

Grafana has used PBKDF2 since inception — technically the right algorithm — and remains at **10,000 iterations** with no upgrade path, because the parameters were never encoded in the stored hash. **[V]** Encoding parameters is structural, not cosmetic.

## Decision

### 1. PBKDF2 via `node:crypto`, with a correctly-scoped justification

**Parameters:** PBKDF2-HMAC-SHA-512 (default; `sha256`/`sha384` selectable), 600,000 iterations, 32-byte salt from `crypto.randomBytes()`, derived key matching digest width.

**Why this is an approved operation — the argument the prior draft got wrong.**

The prior draft argued "PBKDF2 is the only NIST-approved password KDF, therefore compliant." That **overstates**, because SP 800-132's approval is scope-limited:

- SP 800-132 §4: the derived Master Key "is used either 1) to generate one or more Data Protection Keys (DPKs) to protect data, or 2) to generate an intermediate key to protect one or more existing DPKs... **The MK shall not be used for other purposes.**" **[V]**
- FIPS 140-3 **IG §D.N**: "the vendor shall indicate in the module's Security Policy that keys derived from passwords, as shown in SP 800-132, **may only be used in storage applications.**" Every RHEL OpenSSL/libgcrypt/NSS security policy examined repeats this caveat verbatim. **[V]**

Password *verification* by hash-and-compare is not "a storage application" in SP 800-132's sense. So the SP 800-132 lineage alone does not carry the claim.

**But the module remains approved, and CMVP says so explicitly.** IG 2.4.A anticipates precisely this situation **[V]**:

> "If the module operator (e.g., calling application) can do things outside of the module's control/visibility that can take an otherwise approved algorithm and use it in a non-approved way (**e.g., use PBKDF ... outside of storage applications**), the corresponding module service **may still be considered approved** ... and the Security Policy shall clarify how to use the service in an approved manner."

So this is a **documentation obligation, not a design defect.** Two things follow:

1. **The argument that actually satisfies V-222571** is that the underlying **HMAC-SHA-512 primitive executes inside the validated module**, and secure hashing is an approved security function. PBKDF2's iteration structure is a *construction over* an approved primitive, not an appeal to SP 800-132's key-derivation scope.
2. **The SSP must state this reasoning rather than assume it**, and disclose the storage-application scope limit. Do not cite SP 800-132 as blanket authorization for password verification.

**Our parameters clear every bound the module actually enforces [V]** — security policy `140sp4857.pdf`: salt ≥ 128 bits generated by the SP 800-90Ar1 DRBG, iterations ≥ 1000, derived key ≥ 112 bits. We use a 256-bit salt from `crypto.randomBytes` (which routes through that DRBG under FIPS), 600,000 iterations, and a 512-bit key. Note the same policy lists "PBKDF2 (short password; short salt; insufficient iterations; < 112-bit keys)" as a **non-approved service** — the failure mode is under-parameterisation, which we are well clear of.

**On password strength:** IG §D.N states that "**SP 800-132 does not impose any strictly defined requirements on the strength of a password**," only that passwords "should be strong enough so that it is infeasible for attackers to get access by guessing." **[V]** An earlier draft claimed a 112-bit floor implied a 14-character minimum. That was wrong — the "14" originates in a BouncyCastle-FIPS byte-length check, which Keycloak works around by *padding* short passwords, proving it mechanical rather than an entropy requirement. Heimdall's existing 15-character minimum is good practice; it is not a FIPS obligation and should not be presented as one.

**On 600,000 iterations.** OWASP 2024 gives 210,000 for SHA-512. We use 600,000 — see the measured performance data in §11, which materially changes the trade-off the prior draft described.

### 2. PHC string format (unchanged — this part was right)

```
$pbkdf2-sha512$i=600000$<b64-salt>$<b64-key>
```

Per the [PHC string format](https://github.com/C2SP/C2SP/blob/main/phc-strings.md), matching npm `phc-pbkdf2`. Standard base64 alphabet, padding stripped. PHC is a strict *subset* of Modular Crypt Format; bcrypt's `$2b$14$…` is valid MCF but invalid PHC — both coexist in one column and are distinguished on parse.

The leading `$` is load-bearing: `$` appears in no base64 alphabet (`A-Za-z0-9+/=`) nor in bcrypt's radix-64 (`./A-Za-z0-9`), so dispatch is an unambiguous lookup on `parts[1]` — `'2b'` vs `'pbkdf2-sha512'`. **[V]** It also admits `$argon2id$v=19$m=…` unchanged if NIST approves Argon2.

**Storage width [V]:** the string is **154 characters** (24 + 43-char salt + 1 + 86-char key). Both `Users.encryptedPassword` (migration `20200417145649`) and `ApiKeys.apiKey` (migration `20210615141642`) are `Sequelize.STRING` = `VARCHAR(255)` in *both* model and migration — **101 characters of headroom**, no `VARCHAR(60)` anywhere. Postgres *errors* on overflow rather than truncating, so failure would be loud — but it would fire **inside the login path**. An AC asserts output ≤ 255 for all three digests.

### 3. Migration: FIPS-gated fallback with a terminal state

**This section replaces the prior draft's unconditional fallback, which was its central defect.**

`verifyPassword` dispatches on stored format **and on FIPS state**:

| Stored prefix | FIPS off | FIPS on (`getFips() === 1`) |
|---|---|---|
| `$pbkdf2-sha{256,384,512}$` | verify, `needsRehash: false` | verify, `needsRehash: false` |
| `$2a$` / `$2b$` / `$2y$` | `bcryptjs.compare()`; `needsRehash: valid` | **refuse — do not invoke bcryptjs**; return `{valid: false, requiresReset: true}` |
| anything else | reject without throwing | reject without throwing |

**Why the gate is required — the ASD STIG, and only the ASD STIG.**

An earlier version of this section rested on CMVP **IG 2.4.A** ("non-approved security functions shall not be used in the approved mode of operation"). **That argument is withdrawn — it was backwards.** IG 2.4.A scopes to functions "**within the scope of the module**," i.e. it governs what the validated module itself offers in approved mode. `bcryptjs` is not within OpenSSL's boundary at all, so 2.4.A never reaches it. IG 2.4.A *example 1* in fact lists "store authentication data using MD5 or using HMAC-SHA-1 with a weak HMAC key" among non-approved algorithms **permitted** in approved mode where no security is claimed of the module. **[V]** — direct PDF read.

**The FIPS 140-3 standard does not, by itself, prohibit calling bcryptjs.** CMVP validates modules, not applications (FIPS 140-3 §9), and nothing the calling application does voids OpenSSL's certificate.

**The prohibition is application-scoped and comes from the STIG**, which is sufficient on its own. V-222571's check text, verbatim **[V]**:

> "If FIPS-validated cryptographic modules are **not used when generating hashes** or if the application is configured to use the MD5 or SHA1 hashing algorithm, this is a finding."

`bcryptjs.compare()` *generates* a bcrypt hash of the candidate password, in pure JavaScript, inside no validated module. That meets the finding condition literally. V-222572 (CCI-002450) applies on the same basis.

So the accurate claim is narrow and defensible: **an ungated bcrypt call in a deployment asserting FIPS is a CAT II STIG finding, not a FIPS 140-3 violation.** That is still worth designing around — and it is exactly why Keycloak refuses and GitLab gates on FIPS mode.

**SP 800-131A does not apply either way.** Its "legacy use" doctrine covers verify-only continuation of algorithms that were *once* NIST-approved. Bcrypt never was. **[V]** — searched, zero hits for "bcrypt" or "password."

**The migration therefore has three phases, and a defined end:**

1. **Non-FIPS operation** — lazy rehash on login. Users migrate transparently, no disruption.
2. **Cutover** — a migration script sets `forcePasswordChange = true` on every remaining `$2%` row. This is GitLab's #360659 and it is what the prior draft's vague "eventual forced reset required" must become.
3. **FIPS enablement** — by this point no bcrypt hashes remain, so the gate never fires in normal operation. If one is encountered anyway, the user is told to reset.

This gives the terminal state the prior draft lacked and makes the `bcryptjs` removal criterion satisfiable.

**Fresh FIPS installs have no transition at all** — no bcrypt hash is ever written (see §4, the seeder).

### 4. Eight call sites, not seven

The prior draft enumerated seven and **omitted the admin bootstrap seeder** — the one that runs on every deployment. **[V]** All line numbers verified at `2e1649c9e`.

| # | File | Line | Function | Change |
|---|---|---|---|---|
| 1 | `users.service.ts` | 66 | `create()` | `hash(pw,14)` → service hash |
| 2 | `users.service.ts` | 89 | `update()` | `hash(pw,14)` → service hash |
| 3 | `users.service.ts` | 126 | `remove()` | `compare()` → **pure** `verifyPassword`, `.valid` only |
| 4 | `authn.service.ts` | 53 | `validateUser()` | `compare()` → verify **+ CAS rehash** (primary migration path) |
| 5 | `authn.service.ts` | 75 | `validateApiKey()` | `compare()` → verify + CAS rehash |
| 6 | `authn.service.ts` | 208 | `testPassword()` | `compare()` → **pure** `verifyPassword` — see constraint below |
| 7 | `apikey.service.ts` | 43 | `create()` | `hash(sig,14)` → service hash |
| **8** | **`seeders/20200514154327-create-administrator.js`** | **56** | admin bootstrap | **`bcrypt.hashSync(pw,14)` → compiled pure function, awaited** |

**Site 8 is the most consequential omission.** `cmd.sh:4` runs `db:seed:all` on **every container start**, and the RPM path runs the same seeder via `heimdall-db-setup.sh`. Left unchanged, **every fresh install provisions its administrator — the highest-privilege account — with a bcrypt hash on day one**, in a change whose purpose is to eliminate them. With `ADMIN_USES_EXTERNAL_AUTH=true` the local credential may never be used for a local login, so lazy rehash never fires and the hash persists indefinitely.

It is also structurally awkward: CommonJS `.js`, run by `sequelize-cli` outside both Nest DI and the TypeScript build, and **synchronous**. It must `require()` the compiled pure function from `dist/` and `await` it (its `up` is already `async`).

**AC:** a fresh install, zero logins, must yield `bcrypt_remaining = 0`.

#### Two structural constraints the prior draft missed

**`testPassword` is called unbound. [V]** `users.service.ts:79` does `await AuthnService.prototype.testPassword(updateUserDto, userToUpdate)`. This works *only because* `testPassword` uses the module-scope `compare` import and never touches `this`. If it becomes `this.passwordService.verify(...)` it throws `TypeError` — and `UsersService` cannot inject `AuthnService` (circular; `AuthnService` injects `UsersService` at line 42). **Site 6 must use the pure function.** This is why §5's pure-function/injectable split is a requirement, not a style preference.

**No persistence method can honor the lifecycle constraint. [V]** `usersService.update()` unconditionally sets `passwordChangedAt` and `forcePasswordChange`; `apiKeyService.update()` writes only `name`. Neither can perform a narrow rehash. Two new methods are required — `UsersService.updateEncryptedPassword()` and an `ApiKeyService` equivalent — following the existing narrow-writer pattern (`updateLoginMetadata`, `updateUserSecret`).

### 5. Module structure

Only `hashPassword` needs configuration; `verifyPassword` reads its parameters from the self-describing hash. Hence:

- `apps/backend/src/crypto/password.ts` — **pure functions**, options as parameters. Usable from the seeder and scripts with no DI container (§4 site 6 and site 8 both require this).
- `apps/backend/src/crypto/password.service.ts` — Nest injectable reading `ConfigService`.
- `apps/backend/src/crypto/crypto.module.ts` — **required**: `ConfigModule` is *not* `@Global()`, so `UsersModule`, `AuthnModule`, and `ApiKeyModule` each need an explicit import. **[V]**

```ts
export type PasswordHashAlgorithm = 'sha256' | 'sha384' | 'sha512';

export interface PasswordHashOptions {
  algorithm?: PasswordHashAlgorithm;   // default 'sha512'
  iterations?: number;                 // default 600000
}

export interface PasswordVerifyResult {
  valid: boolean;
  needsRehash: boolean;
  requiresReset?: boolean;             // bcrypt encountered while FIPS on
}

export function hashPassword(password: string, options?: PasswordHashOptions): Promise<string>;
export function verifyPassword(args: {hash: string; password: string}): Promise<PasswordVerifyResult>;
```

### 6. Input validation — the exact sequence

Each item below is a verified trap, not a precaution. **[V]** — all confirmed by execution on Node 24.

1. Reject non-string or empty. **`''.split('$')` is `['']`**, so a `parts[0] === ''` check *passes* for the empty string; the field-count check is what catches it. These are `AND`, not alternatives.
2. `split('$')` must yield **exactly 5** parts, and `parts[0] === ''`.
3. **Algorithm from a strict allowlist** — `Set(['sha256','sha384','sha512'])`. **Never prefix-match `sha*`.** `crypto.pbkdf2` accepts `md5` and `sha1`, so a stored `$pbkdf2-md5$…` would verify happily. The prior draft's dispatch table literally specified `$pbkdf2-sha*$` — an algorithm-confusion downgrade in a document banning MD5.
4. **Iterations by regex only** — `/^i=([1-9][0-9]{0,8})$/`. Never `parseInt`/`Number`: **`parseInt('6e5')` is `6`** (a forged hash verifies at six iterations — a 100,000× work-factor downgrade that looks well-formed), `parseInt('600000abc')` is `600000`, `Number('0x10000')` is `65536`, `Number('')` is `0`.
5. Iterations within `[100_000, 10_000_000]`. **An upper bound is mandatory**: Node permits up to 2³¹−1, which is roughly 8.6 minutes of one libuv thread per verification. Four such rows would exhaust the default 4-thread pool and take authentication down.
6. Decode salt and key, **re-encode and compare** (padding stripped both sides). `Buffer.from(str,'base64')` is lenient — `'AA@@AA'` and `'A A A A'` both decode identically to `'AAAA'`.
7. **Assert key length equals the digest's expected width, and salt ≥ 16 bytes, *before* calling `pbkdf2`.** `crypto.pbkdf2` with `keylen=0` throws an **untyped** error (`e.code` undefined) *before* any downstream guard runs — so the ADR's own required test, "malformed hash rejected without throwing," cannot pass without this check. A hash claiming `sha512` but carrying a 32-byte key would otherwise verify happily: silent acceptance of a downgraded artifact.
8. Guard length before `timingSafeEqual`, which **throws** `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH` on mismatch. Return `false`; never let it throw. Length is not secret — it is fixed by the stored parameters.

**Maximum password length: 128 characters, enforced on every path** (`validateUser`, `create`, `update`, `remove`, `testPassword`, and the seeder).

Two independent reasons. **(a) DoS** — this is Django **CVE-2013-1443** exactly: "A password one megabyte in size... will require roughly one minute of computation to check when using the PBKDF2 hasher." **[V]** Django capped at 4096 bytes. Heimdall currently sets `json({limit: '50mb'})` (`main.ts:67`), rate-limits only `/authn/login` at 20/min/IP (`main.ts:101-112`), and `libs/password-complexity` enforces a *minimum* of 15 with **no maximum**. **[V]** **(b) Approved range** — RHEL 9 OpenSSL security policy `140sp4857.pdf` states PBKDF2 "8-128 characters with password strength between 10⁸ and 10¹²⁸." **[V]** Over 128 is outside the module's documented approved range.

Note that removing bcrypt also removes its implicit 72-byte truncation, so a >72-character password will be validated in full after rehash where previously only its first 72 bytes mattered. Behaviorally correct; worth a test.

### 7. Concurrency: compare-and-swap, not `save()`

**[V]** `authn.service.ts:54` already calls `this.usersService.updateLoginMetadata(user)` **without `await`** — a floating promise ending in `user.save()`. Adding a rehash `save()` on the same Sequelize instance creates two concurrent unawaited writes to one row.

**The damaging interleaving:** a user changes their password (writes H2) while an in-flight login rehashes the **old** password and writes H1′. Last-write-wins silently reverts the password change. **If that change was a response to compromise, the compliance fix reinstates the compromise.**

A bare `.save()` also cannot honor the lifecycle constraint — Sequelize flushes *all* dirty attributes, which at that moment include `lastLogin` and `loginCount`, and `@UpdatedAt` always bumps `updatedAt`.

**Required:**

```sql
UPDATE "Users" SET "encryptedPassword" = :new
WHERE id = :id AND "encryptedPassword" = :originalHash
```

Zero rows affected means another writer won — do nothing. This makes concurrent logins idempotent and enforces the "write `encryptedPassword` only" constraint **in SQL rather than by convention**. Use `silent: true` to suppress the `updatedAt` bump, so a mass migration does not make every account look recently modified. Wrap in try/catch: **a failed rehash must never fail an otherwise-successful login** — it retries next time. A crash between verify and save is safe; the bcrypt hash survives.

The same un-awaited pattern exists at `apikey.service.ts:44`. **[V]**

#### Password lifecycle fields must not change

`user.model.ts` declares `forcePasswordChange` (line 55) and `passwordChangedAt` (line 68). **[V]** A rehash changes only the stored representation — the password itself did not change. Writing `passwordChangedAt` would silently reset the password-expiry clock for every migrating user: a security regression introduced by a compliance fix.

**Known wrinkle [V]:** migration `20200417145649` creates `passwordChangedAt` as `Sequelize.STRING`, while `user.model.ts` declares `DataType.DATE`. No migration reconciles them. Since `database.module.ts` returns `synchronize: true` outside test, a synchronize-built database gets `DATE` and a migration-built one gets `VARCHAR(255)`. The regression test must account for both. Pre-existing defect; noted, not fixed here.

**Test must assert both directions** — `encryptedPassword` *changed* and now starts with `$pbkdf2-`, while `passwordChangedAt`, `forcePasswordChange`, `lastLogin`, `loginCount`, and `updatedAt` are unchanged — verified after `await user.reload()`, not against the in-memory instance. A no-op rehash otherwise passes.

### 8. Known limitation: iteration upgrades do not propagate

Per §3, a PBKDF2 hash always returns `needsRehash: false`, even when its stored `i=` is below current policy. **This is the Grafana failure mode this ADR criticizes**, and it is a deliberate trade — reading parameters from the hash is what makes iteration changes non-breaking.

Recorded explicitly so a future maintainer does not "fix" it accidentally. If iteration upgrades become desirable, add a params-below-policy check to the dispatch, gated behind its own decision. Not in scope here.

### 9. Environment variables

| Variable | Type | Default | Purpose |
|---|---|---|---|
| `PASSWORD_HASH_ALGORITHM` | `sha256\|sha384\|sha512` | `sha512` | PBKDF2 digest |
| `PASSWORD_HASH_ITERATIONS` | int ≥ 100000 | `600000` | Iterations |
| `PASSWORD_MAX_LENGTH` | int ≤ 128 | `128` | Input cap (§6) |
| `FIPS_MODE` | boolean | unset | Assertion + fallback gate (§3, §10) |
| `PASSWORD_HASH_WRITE_ENABLED` | boolean | `false` in release N, `true` in N+1 | Rollout gate (§12) |
| `UV_THREADPOOL_SIZE` | int | platform default 4 | Auth throughput ceiling (§11) |

Floor/ceiling semantics must be explicit: out-of-range values **throw at startup**, they do not clamp silently. **The floor applies to hashing only, never to verification** — a stored hash with `i=50000` must remain verifiable or users are locked out.

`libs/password-complexity` remains hardcoded (15-char minimum, four classes, no 4+ consecutive same-class) with **no** environment variables. **[V]** Complexity is orthogonal to hashing; making it configurable is out of scope.

### 10. FIPS assertion and startup

**The in-process assertion cannot be the only gate. [V]** Verified by execution:

```
$ NODE_OPTIONS="--force-fips" node -e "console.log('ok')"
node: OpenSSL error when trying to enable FIPS:
EXIT=1
```

Node aborts **in bootstrap**, before `main.ts`, before Nest, before any logger — with an **empty error body**. The §10 assertion never runs on that path. Combined with the RPM unit's `Restart=on-failure` / `RestartSec=5` and no `StartLimitBurst` override, this produces a **permanent crash loop at 12 restarts/minute** with `systemctl status` showing `activating (auto-restart)` rather than `failed`.

**Therefore, three layers:**

1. **Launcher preflight** — never put `--force-fips` directly in the systemd unit or `NODE_OPTIONS`. Probe first, and on failure emit a real diagnostic (`/proc/sys/crypto/fips_enabled`, `update-crypto-policies --show`, `openssl list -providers`, `node -p process.versions.openssl`) and `exit 78` (`EX_CONFIG`).
2. **Unit hardening** — `StartLimitIntervalSec=60`, `StartLimitBurst=3`, so a misconfiguration reaches `failed` within a minute.
3. **In-process assertion** — still required, because it catches the *dangerous* case: `FIPS_MODE=true` set for compliance reporting **without** `--force-fips`, i.e. the system claims FIPS and is not. This is GitLab's Workhorse failure — it shipped without the `fips` build tag and `fips.Enabled()` returned false with no error. Must be an **exported, injectable** function (`assertFipsMode({fipsMode, getFips})`) so it is testable without booting the app; `bootstrap()` in `main.ts` is not exported. **[V]**

**When `FIPS_MODE` is unset, log loudly at boot that no assertion was performed** — silence is how the Workhorse class of failure survives.

**`crypto.getFips()` is necessary but not sufficient as evidence.** It proves the flag is set, not which provider loaded at what version, nor that the operational environment matches the certificate. Log module identity at startup as a durable artifact. Never silently degrade to a non-approved path.

**Never call `crypto.setFips()`** — under `--force-fips` it triggers a native `CHECK()` that **aborts the process**; it does not throw. **[V]**

### 11. Performance — measured, and it inverts the prior draft's risk rating

The prior draft asserted "PBKDF2-SHA512 @ 600k ≈ bcrypt cost 14 (~200-400 ms)" and rated the change a Low/Low performance *regression*. **Both are wrong.** Measured on Node 24 (Apple Silicon; server vCPUs will be 2-4× slower):

| Operation | Latency | Concurrent throughput | Event-loop lag |
|---|---|---|---|
| `bcryptjs` compare cost 14 (**current production**) | **1120 ms** | 0.9/sec | 788 ms |
| PBKDF2-SHA512 @ 600k (**this ADR**) | **145 ms** | 20/sec | 1.4 ms |
| PBKDF2-SHA512 @ 210k (OWASP) | 52 ms | ~55/sec | — |

This is a **7.7× latency improvement and a 22× throughput improvement.** The prior draft buried its own strongest justification.

**The real cost it failed to document:** `crypto.pbkdf2` dispatches to the **libuv threadpool (default 4 threads)**. Throughput pins at ~20 auth-ops/sec *regardless of concurrency*, and the pool is shared with `fs`, `dns.lookup`, and `zlib` — measured, `fs.readFile` went **1.16 ms → 337 ms** with 8 PBKDF2 operations queued. "Async, does not block the event loop" is true but materially misleading: the event loop stays responsive while all file I/O stalls. bcrypt today is far worse (0.9 ops/sec, 3232 ms `fs` stall), so this remains a large net win — but `UV_THREADPOOL_SIZE` must be set explicitly and the resulting ceiling documented.

**On keeping 600,000.** SHA-512 is the right digest — fast per byte on 64-bit CPUs while GPUs are comparatively weaker at 64-bit operations, so the defender/attacker ratio favors it. The *count* is defensible at 210k (OWASP) or at 600k **only if** `UV_THREADPOOL_SIZE` is raised and a global KDF concurrency limit lands. Keeping 600k while addressing neither is the one indefensible combination. **Benchmark on the target RHEL container before finalizing.**

**Login is a DoS amplification vector. [V]** The only protection is 20 req/min/IP on `/authn/login`; there is no global cap, no `@nestjs/throttler`, and **no account lockout** (`loginCount` increments only on success). A ~200-byte request buys 145 ms of CPU. Add a global KDF concurrency limiter and a per-account failed-attempt counter.

**API keys: 600,000 iterations is cryptographically pointless there.** The hashed value is a JWT HS256 signature — 43 base64url characters, **256 bits of machine-generated entropy**. Iterated KDFs raise per-guess cost against *low-entropy human* inputs; against a 256-bit token, brute force from a stolen hash is infeasible at any iteration count. GitHub and Stripe store API tokens as a single SHA-256. Note this path is **not** reachable by unauthenticated attackers — `jwt.verify` gates it and is cheap **[V]** — and per-request cost still *drops* 1120 → 145 ms. Recorded as a known inefficiency; changing it is out of scope (§14).

### 12. Rollout, rollback, and the mixed-version window

**The prior draft named rollback asymmetry as a High risk and specified no mechanism.** Two distinct hazards:

**(a) Rolling deploys — within a single release.** Old and new pods serve one database concurrently. A user rehashed by a new pod then hits an old pod: `bcryptjs.compare()` returns `false` on a PBKDF2 hash (it does not throw), so they get "Incorrect Username or Password" — *intermittent* auth failure that appears to self-resolve as the deploy completes, the hardest class to triage, amplified by the 20/min rate limit turning retries into 429s.

**API keys make this materially worse.** `validateApiKey` serves CI pipelines and `saf` CLI uploads — no human to retry, silent pipeline failure. And an API key **cannot be recovered**: the server stores only a hash of a signature it never retains in plaintext. A bad rollback means regenerating every key by hand.

**(b) Version skips — air-gapped RPM.** Forward skips are safe (pre-N → N+1 gets read+write together, having never run read-incapable code against PBKDF2 hashes). **Reverse is catastrophic** and `dnf downgrade` is one command.

**Mechanism — all four parts required:**

1. **`PASSWORD_HASH_WRITE_ENABLED`**, default `false` in release N, `true` in N+1. When false, `verifyPassword` still reports `needsRehash` but call sites skip the write. Two releases alone don't cover the intra-release rolling window; the flag alone doesn't cover operators who skip the read release.
2. **A durable format marker planted in release N** — the one thing that must not be deferred, because it is what makes both guards possible later. A DB row (not a file — container filesystems are ephemeral and the database is the only shared durable state) recording that PBKDF2 writes have begun.
3. **RPM `%pre` downgrade guard** — refuse installation below the recorded floor, with an explicit message naming the consequence and pointing at the recovery procedure.
4. **Graceful-degradation AC** — an integration test running the *old* verify path against a PBKDF2 hash, asserting a clean `false` rather than a throw or a 500.

**Sequence (SaaS):** N read-only + marker → soak → canary the flag on one replica → fleet-wide as a *separate* rollout → N+1 default true → N+2 flag removed → N+3 `bcryptjs` removed, gated on telemetry not a date.

**Sequence (air-gapped):** same artifacts, operator-timed; warning in the **upgrade** section of release notes, not the changelog; `%post` prints it to console; `%pre` guard enforces it.

**Also unguarded:** a `pg_dump` taken post-migration and restored onto pre-N code locks out every migrated user. Same hazard, different door, and `%pre` does not catch it. Document the forced-reset recovery — including that **API keys must be regenerated**.

**Read replicas.** The lazy rehash is a write on the login path. If reads were ever routed to a replica, a lagging read would return the stale bcrypt hash and rehash again — an unbounded loop burning a full KDF per login. Heimdall does not use read replicas today; recorded as an assumption to revisit.

### 13. Dependency and platform audit

**Our own code is clean. [V]** No `md5`/`sha1`/`createHash` in `apps/backend/src`, `apps/backend/config`, `libs/common`, or `libs/password-complexity`. Only `crypto.randomBytes` is used. `uuid` v4 only (v3/v5 would use MD5/SHA-1). No `@aws-sdk/*` or `hdf-converters` in the backend — AWS SDK is browser-side in `apps/frontend`.

**Express ETag — the prior draft's diagnosis was wrong. [V]** `etag/index.js:47` uses **`createHash('sha1')`**, not MD5. Confirmed two ways: a direct read of the installed package source, and the empty-body fast-path constant `2jmj7l5rSw0yVb/vlWAYkK/YBwk`, which is exactly `sha1('')` in base64 (`md5('')` is `1B2M2Y8AsgTpgAmY7PhCfg==`). SHA-1 **is** an approved hash in the OpenSSL 3 FIPS provider, so this likely does **not** break under plain `--force-fips`.

*Two separate reviewers asserted MD5 here.* Both were wrong; the source read is definitive. Recorded so this is not re-litigated.

**But it may still break under `FIPS:STIG`**, whose permitted hash list is SHA-2/SHA-3 only. **Verify empirically under both `FIPS` and `FIPS:STIG` policies before spending any work here.** If it does break, choose the **SHA-256 custom generator**, never `app.set('etag', false)` — Heimdall serves large HDF JSON payloads (`json({limit:'50mb'})`), so losing 304 revalidation costs far more than rehashing. Note `app.set('etag', false)` would not disable `serve-static`'s ETag anyway, and `send` passes an `fs.Stats` object to `etag`'s `stattag()`, which uses no hash at all.

**`pg` MD5 auth breaks under FIPS** ([node-postgres#1706](https://github.com/brianc/node-postgres/issues/1706)) — see §15.

**Runtime audit required.** Static analysis cannot see transitive dependencies. Boot and exercise auth under `--force-fips` on a real RHEL FIPS host. Do not conflate the two error families: `ERR_OSSL_EVP_UNSUPPORTED` is an OpenSSL 3 legacy-provider problem, *not* FIPS; `EVP_DigestInit_ex:disabled for FIPS` is a real denial.

### 14. Platform: what the base image does and does not give us

`Dockerfile:1` sets `ARG BASE_CONTAINER=registry.access.redhat.com/ubi9/nodejs-22-minimal:1`, used by both stages. **[V]** RHEL's Node is a `--shared-openssl` build, so it uses system OpenSSL rather than a statically-bundled copy.

**Four corrections to the prior draft's over-claim:**

1. **It is an overridable `ARG`, not a fixed `FROM`.** `--build-arg BASE_CONTAINER=node:22-alpine` silently produces exactly the compliance theater this ADR warns against. State it as a constraint; consider failing the build if the base is not UBI.
2. **A UBI image carries no validation of its own.** Red Hat's position: products are not FIPS validated, cryptographic components are — and if the host OS is not in FIPS mode, containers are not either. **The FIPS-mode RHEL host is a hard requirement**, not an implementation detail.
3. **The prior draft contradicted itself.** It claimed both "UBI9 inherits FIPS from system OpenSSL automatically" and "Node never reads `/proc/sys/crypto/fips_enabled`." Both are true and compatible: Node does not read it, but RHEL's *OpenSSL* does — that runtime check **is** the inheritance mechanism. Stated correctly here.
4. **Since RHEL 9.2 the FIPS provider ships as a separate RPM.** The prior draft's "our base image needs none of that" was asserted for a `-minimal` image with no evidence the package is present. **AC:** run `openssl list -providers` and `node --force-fips -e "console.log(require('crypto').getFips())"` *inside* the actual image and record the output.

Stock nodejs.org binaries **do** support FIPS — `BUILDING.md`: "It is not necessary to rebuild Node.js to enable support for FIPS" — but require `openssl fipsinstall`, `OPENSSL_CONF`, and `OPENSSL_MODULES`. **[V]**

**Operational-environment binding.** CMVP **IG 2.3.A**: the tested operational environment "must consist of the Operating System, the platform, and the processor," and "a claim cannot be made that the implementation also runs on another operating system." **[V]** Customers running outside the certificate's tested OE set need an explicit conformance statement. (Deploy-time porting to an untested OE maps to Management Manual §7.9 — **[U]**, not independently verified.)

### 15. PostgreSQL

**Scope is narrower than the prior draft implied. [V]** `docker-compose.yml:3` pins **`postgres:17`**, and Postgres 14+ defaults to `scram-sha-256`. The default stack needs no change. Exposure is limited to RHEL 8 AppStream (Postgres 13) and pre-existing customer databases.

**And the prior draft's remediation did not address the case it identified.** `POSTGRES_HOST_AUTH_METHOD` / `POSTGRES_INITDB_ARGS` are Docker-image variables that take effect **only during `initdb` on an empty data directory** — they do nothing for a pre-existing database. Even `password_encryption = 'scram-sha-256'` affects only passwords set *after* the change; existing roles keep their `md5…` verifier in `pg_authid` indefinitely. The role must be re-set:

```sql
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
SELECT pg_reload_conf();
ALTER ROLE heimdall WITH PASSWORD '<same or new>';   -- rewrites the verifier
-- then flip pg_hba.conf md5 → scram-sha-256 and reload
SELECT rolname, left(rolpassword, 14) FROM pg_authid WHERE rolname = 'heimdall';
```

Add the `pg_authid` check to the RPM setup script's FIPS detection so an operator is warned *before* the app fails to connect.

### 16. Observability

**The prior draft's `bcryptjs` removal criterion — "zero rows across all deployments" — is unsatisfiable as written.** MITRE ships to air-gapped customers; the vendor never sees their `Users` table.

Required:

- **Log every rehash** at `info` via the existing Winston logger (`authn.service.ts:26`): user id, `from: bcrypt`, `to: pbkdf2-sha512`, iterations. A rehash is a security-relevant state change. Without it a stalled migration is invisible and a *spurious* rehash loop is undetectable. Also the audit trail for the migration — since §7 forbids touching `passwordChangedAt`, nothing else records that a credential was converted or when.
- **A `/health` endpoint.** None exists today **[V]** — no `/health`, `/ready`, or `/livez`. Return `{status, version, fips: crypto.getFips() === 1, passwordHashWriteEnabled, bcryptRemaining}`. This is load-bearing four ways: rolling-deploy readiness gating (§12), continuous FIPS evidence rather than a one-time boot log (§10), migration progress, and a machine-readable artifact an assessor can collect without shell access. It is also what makes the removal criterion achievable — a customer sends one JSON blob instead of a DB dump.
- **Progress query**, shipped as an installed script (`/usr/bin/heimdall-server-hash-report`), not a wiki snippet air-gapped operators cannot reach:

```sql
SELECT count(*) FILTER (WHERE "encryptedPassword" LIKE '$2%')       AS bcrypt_remaining,
       count(*) FILTER (WHERE "encryptedPassword" LIKE '$pbkdf2-%') AS pbkdf2_migrated,
       max(age(now(), "lastLogin")) FILTER (WHERE "encryptedPassword" LIKE '$2%') AS oldest_unmigrated
FROM "Users";
```

- **Admin UI affordance** — a per-user legacy-hash badge and a bulk "force password change for all users on legacy hashes" action. This is the operational close-out for the dormant-account tail and the mechanism behind §3's cutover.

**Restated removal criterion:** no earlier than N+3, and only after `bcrypt_remaining = 0` is confirmed via the health endpoint across supported deployments **or** a forced-reset release has shipped.

## STIG and control mapping — corrected

The prior draft's table had four defects. All rule metadata below is **[V]** against the DISA STIG API.

| Rule | Severity | What it actually requires | Status after this ADR |
|---|---|---|---|
| **V-222542** | CAT I | Store only cryptographic representations — "strong cryptographic hash functions" + random salt, MD5 prohibited. **Does not mention FIPS validation.** CCI-004062/000196 | **Already satisfied today** by bcrypt; remains satisfied |
| **V-222571** | **CAT II** | FIPS-validated modules **when generating hashes**. CCI-002450. Invocation-scoped | **Satisfied** once §3's gate lands and legacy hashes are retired |
| **V-222572** | **CAT II** | FIPS-validated modules when protecting unclassified information. CCI-002450. *Omitted from the prior draft* | **Satisfied** on the same condition |
| **V-222543** | CAT I | Transmit only cryptographically-protected passwords. CCI-000197 | **NOT satisfied — and the prior draft claimed it was.** `main.ts:39-45` *explicitly removes* `upgrade-insecure-requests` ("causes issues for users trying to run over http"), and the session cookie is `secure` only in production. Helmet emits headers; it cannot enforce transport. **[V]** Requires a TLS reverse proxy — a deployment requirement, not an application control |
| **V-222570** | CAT II | FIPS-validated modules when **signing application components** — i.e. *code signing*, not JWT signing. CCI-002450 | **Mapping itself is questionable** — the prior draft mapped JWT signing to a code-signing rule. Regardless, the "already compliant" claim was false: `apikey.service.ts:29` signs HS256 with an **empty-string key** when `API_KEY_SECRET` is unset, and `JWT_SECRET` is combined by **string concatenation** rather than an approved KDF. **[V]** Both are real defects, carded separately. Note the rule's own escape hatch: "If signing has been identified in the application security plan as not being required and if a documented acceptance of risk is provided, this is not a finding" — which requires an AoR artifact we do not have |
| **V-230223** (RHEL 8) | CAT I | System-wide FIPS crypto policy, verified with `update-crypto-policies --show`. CCI-000068 | **Customer host responsibility.** No application change can satisfy an OS crypto-policy rule. Note this is a **RHEL 8** rule while our base image is UBI **9** |
| **V-258241** (RHEL 9) | CAT I | RHEL 9 analog; required hash list adds SHAKE-256 | **Customer host responsibility** |

**Supporting controls:** IA-5(1)(d) — "passwords are stored using an approved salted key derivation function, preferably using a keyed hash" **[V]** — is the affirmative control this change satisfies. SC-13 assessment objects explicitly include "cryptographic module validation certificates; list of FIPS-validated cryptographic modules" **[V]**, which is why §Certificates below must be exact.

**[U] — asserted in review but not verified; do not cite without confirmation:** IA-7 applicability to authenticator verification; SI-6 as the control for startup self-verification; V-16793 memory-zeroization applicability (note `password: string` is an immutable GC-managed V8 string that cannot be zeroized — a `Buffer`-based API with explicit zero-fill is the available mitigation, documented as compensating); NIST IR 8547 deprecation dates.

**SP 800-63B peppering:** the secret-salt step is **SHOULD, not SHALL**, in both Rev 3 §5.1.1.2 and Rev 4 §3.1.1.2. **[V]** We do not pepper. Recorded as a decision rather than an omission. Our 32-byte salt far exceeds 800-63B's 32-*bit* minimum.

## Certificates

The prior draft cited **two wrong certificates**, and this is the first thing an assessor checks. **[V]** — CMVP registry:

| Cited | Actual | Verdict |
|---|---|---|
| #4985 "RHEL OpenSSL" | **OpenSSL FIPS Provider**, vendor *The OpenSSL Project* | Wrong vendor — upstream generic module, not Red Hat |
| #4754 "Red Hat FIPS 140-3 policy" | **RHEL 9 libgcrypt** v1.10.0 | Wrong library (Node does not use libgcrypt) and **Historical**, superseded by #5366 |

**Correct:** RHEL 9 OpenSSL FIPS Provider — **#4746** (RHEL 9.0) and **#4857** (RHEL 9.2/9.4/9.5/9.6, **Active**, validated 2024-10-29, sunset 2029-10-28). Policy `140sp4857.pdf` lists PBKDF2 [SP 800-132] Option 1a with ACVP certs A4813/A4823-A4826/A5578/A5585 (SHA-1/2) and A4814/A5587 (SHA-3), password range 8-128 characters.

The SSP must name the module, version, certificate, **and** the certificate's tested operational environments for what the deployment actually links.

## Scope

**In scope:** pure module + service + Nest module; migration at all **eight** sites; FIPS-gated fallback; the §6 validation sequence; CAS rehash writes; narrow persistence methods; new env vars; launcher preflight + unit hardening + injectable assertion; `/health`; rehash logging; progress script; Postgres documentation and RPM detection; forced-reset cutover script; tests.

**NOT in scope:**

1. **Changing what API keys hash.** `apikey.service.ts:41` notes bcrypt's 72-byte limit as the reason only the signature is hashed. PBKDF2 removes that limit, but changing it invalidates every existing key. Needs its own ADR and a rotation plan. §11's inefficiency finding is recorded, not acted on.
2. **Migrating to better-auth.** Stays on Passport + Sequelize (`izw` epic). Forward note: v3 returns a bare boolean because better-auth's `verify` contract requires it; our richer return is possible *because* heimdall2 has no such constraint, and a future adapter will discard `needsRehash` on better-auth's path while an outer hook performs the rehash.
3. **Configurable password complexity.**
4. **Removing `bcryptjs`** — required for legacy verification until §16's criterion is met.
5. **Fixing V-222570** (empty-string JWT key, concatenated secret) — real, verified, and separately carded.
6. **Fixing the `passwordChangedAt` column-type mismatch** — pre-existing; documented in §7.
7. **Elastic-style `pbkdf2_stretch`** — the 15-character minimum makes the SHA-512 pre-hash unnecessary.
8. **RPM packaging changes** — `packaging/` does not exist on this branch **[V]**; it lives on `feat/rpm-build` / `saf-packaging`. Cross-repo coordination required, and the §12 downgrade guard is packaging-side, making it a **prerequisite** for enabling writes.

## Documentation target

**`ENVIRONMENT_VARIABLES.md` does not exist in this repository. [V]** The prior draft imported that filename from Vulcan. Heimdall2 documents environment variables in the **GitHub wiki** (`README.md:178`).

That is unusable for this audience: **air-gapped customers cannot read a wiki.** Create **`docs/fips-deployment.md`** in-repo, shipped inside the RPM at `/usr/share/doc/heimdall-server/`. It covers env vars, the FIPS host requirement, Postgres remediation, the migration query, rollout/rollback sequence, and recovery procedure.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Rollback / mixed-version lockout | Medium | **High** | §12 — write gate, durable marker, `%pre` guard, graceful-degradation test. API keys unrecoverable — regeneration is the only recovery |
| Fresh install ships a bcrypt admin | **High if unfixed** | **High** | §4 site 8; AC asserts `bcrypt_remaining = 0` on a fresh install |
| Rehash reverts a password change | Medium | **High** | §7 compare-and-swap |
| Silent FIPS bypass | Medium | **High** | §10 three layers; loud log when `FIPS_MODE` unset |
| Auth throughput ceiling / threadpool starvation | Medium | Medium | §11 — `UV_THREADPOOL_SIZE`, global KDF limiter, benchmark on target hardware |
| DoS via long password or forged iterations | Medium | Medium | §6 — 128-char cap, iteration bounds |
| Transitive dependency uses a non-approved digest | Medium | Medium | §13 runtime audit under `--force-fips` |
| Dormant accounts never migrate | **High** | Low | §3 cutover + §16 admin bulk action. bcrypt remains strong meanwhile — the gap is compliance, not security |
| Timing side-channel | Low | Low | Measured ratio is 7.7× (1120 vs 145 ms), trivially separable; identifies dormant never-migrated accounts. Compounded by a pre-existing ~1000× enumeration oracle — `validateUser` performs **no hashing** for a nonexistent user **[V]**. Mitigation is a dummy-hash on the absent/unknown-format paths. **Note:** the prior draft cited Django's `harden_runtime()` for this — incorrectly. That method equalizes *intra-PBKDF2 iteration* differences and cannot bridge a bcrypt-vs-PBKDF2 gap |

## Alternatives considered

1. **Argon2id** — OWASP's first recommendation, **not FIPS-approved**; no revised SP 800-132 draft exists. Keycloak defaults to it and must override in FIPS mode. The PHC format admits it later with no parser change.
2. **Hard cutover** (v3's approach) — clean, but forces a reset for every user. §3's phased design achieves the same terminal state without the disruption.
3. **Keep bcrypt, add `--force-fips`** — compliance theater. The process reports FIPS while a non-approved algorithm runs in pure JS where neither OpenSSL nor the OS can observe it.
4. **Unconditional bcrypt fallback** (the prior draft) — rejected against IG 2.4.A, and weaker than both Keycloak and GitLab.
5. **Adopt an npm package** — no viable candidate. `@phc/pbkdf2` last published **2018**, repo dead since 2021, no types, 13 stars. `pbkdf2-password` defaults to **SHA-1**. Everything maintained uses a non-approved KDF or native/WASM bindings that bypass OpenSSL. We borrow the format spec and implement ~80 lines.
6. **Spring-style opt-in rehash service** — `UserDetailsPasswordService` silently no-ops when unwired. Django's inline setter fails loudly. We follow Django.

## Guiding principle

GitLab's stated tiebreaker, adopted: **when security and compliance cannot both be satisfied, favor security.** Nothing here requires that trade — PBKDF2 at 600k is both — but it governs any future conflict.

## References

**Standards (verified)** — [SP 800-132](https://csrc.nist.gov/pubs/sp/800/132/final) · [FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final) · [FIPS 140-3 Implementation Guidance](https://csrc.nist.gov/CSRC/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf) (IG 2.3.A, 2.4.A, D.N) · [SP 800-53A Rev 5](https://csrc.nist.gov/pubs/sp/800/53/a/r5/final) (SC-13, IA-5(1)(d)) · [SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) · [FedRAMP Cryptographic Module Policy v1.1.0](https://www.fedramp.gov/resources/documents/FedRAMP_Policy_for_Cryptographic_Module_Selection_v1.1.0.pdf) (FRR8) · [PHC string format](https://github.com/C2SP/C2SP/blob/main/phc-strings.md) · [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

**Certificates** — [CMVP #4857](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4857) (RHEL 9 OpenSSL, Active) · [#4746](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4746) (RHEL 9.0) · [#4985](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4985) (OpenSSL Project — *not* Red Hat) · [#4754](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4754) (libgcrypt, Historical)

**Implementations** — [GitLab FIPS](https://docs.gitlab.com/development/fips_gitlab/) · [GitLab password storage](https://docs.gitlab.com/security/password_storage/) · [GitLab #360659](https://gitlab.com/gitlab-org/gitlab/-/issues/360659) · [Keycloak FIPS](https://www.keycloak.org/server/fips) · [Django CVE-2013-1443](https://www.djangoproject.com/weblog/2013/sep/15/security/) · [Django hashers.py](https://github.com/django/django/blob/main/django/contrib/auth/hashers.py) · [phc-pbkdf2](https://github.com/simonepri/phc-pbkdf2)

**Known breakage** — [node-postgres#1706](https://github.com/brianc/node-postgres/issues/1706)

**In-repo prior art** — Heimdall v3 `a52f6ceb` (`mitre/heimdall`) · `fips_compliance` `cbfa40946`, `b384fd335`, `310c24a3c`
