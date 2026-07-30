# ADR-006: PBKDF2 Password Hashing via a FIPS 140-3 Validated Module

**Status:** Proposed
**Date:** 2026-07-29
**Author:** Aaron Lippold
**Branch:** `feature/fips-compliant-password-hashing`
**Base:** `master` @ `2e1649c9e`
**Epic:** `heimdall2-e25`

> **On the title.** This document avoids the phrase "FIPS compliant." FedRAMP
> *Policy for Cryptographic Module Selection and Use* v1.1 (approved
> 2025-01-16), rule **FRR8**: representations "must use terminology approved by
> NIST" and CSPs "must not use ambiguous or CSP-defined terms such as 'FIPS
> compliant.'" The accurate claim is that hashing is performed **by a FIPS
> 140-3 validated module**.

## Evidence standard

Every normative claim is marked **[V]** (verified against a primary source —
NIST/CMVP PDF, DISA STIG API, vendor source, or a direct read of this
repository) or **[U]** (unverified; not load-bearing; must not appear in an
SSP or POA&M without confirmation).

This exists because an earlier review of this ADR produced confident,
well-formatted citations — STIG check text, CMVP guidance, FedRAMP rule IDs —
that had **never been read**. The reviewer retracted them, and on retraction
discovered its own central argument ran backwards. Independent verification
later confirmed most of the substance and **refuted one key citation**, which
is corrected in §3.

Two rules follow for anyone extending this:

- **Do not promote a [U] to [V] without reading the source.**
- **Assessor-facing artifacts cite only [V] items.** SP 800-53A Rev 5's SC-13
  assessment objects explicitly include "cryptographic module validation
  certificates; list of FIPS-validated cryptographic modules" **[V]** — exactly
  the class of claim that was fabricated the first time.

## Context

Heimdall hashes passwords with bcrypt via `bcryptjs` (pure JavaScript, cost 14)
and stores API keys as bcrypt hashes of JWT signatures.

**The problem is boundary, not strength.** bcrypt at cost 14 is strong. But
`bcryptjs` computes its **hash in pure JavaScript** — the Blowfish key schedule
and the digest never enter `node:crypto` or OpenSSL, so on a FIPS-enabled host
hash generation runs *undetected and unblocked*, entirely outside the validated
module **[V]**.

Be precise about this: bcryptjs v3 *does* import `node:crypto`, using
`crypto.randomBytes()` for salt generation. The claim is narrower than "it never
touches crypto" — it is that the **hashing** is not performed by a validated
module, which is exactly what V-222571's check text turns on. The conclusion is
unchanged; the earlier phrasing overstated it. **[V]**

**What this actually costs, stated precisely** — an earlier draft overstated it:

- **V-222542** ("must only store cryptographic representations of passwords",
  **CAT I**, CCI-004062) requires "strong cryptographic hash
  functions" with a random salt and prohibits MD5. **The phrase "FIPS-validated"
  appears nowhere in the rule.** bcrypt already satisfies it. **[V]**
- **V-222571** (**CAT II**, CCI-002450) is the rule we fail, and its finding
  condition is **invocation-scoped**. **[V]**
- **V-222572** (**CAT II**, CCI-002450) — "must utilize FIPS-validated
  cryptographic modules when protecting unclassified information." Omitted from
  the prior draft. **[V]**

So: **two CAT II findings, not a CAT I failure.** Worth fixing; not worth
overstating to an assessor.

**Supporting control.** SP 800-53A Rev 5 **IA-5(1)(d)**: "for password-based
authentication, passwords are stored using an **approved salted key derivation
function**, preferably using a keyed hash." **[V]** PBKDF2-HMAC fits this text
more directly than bcrypt. This is the strongest affirmative control and the
prior draft never cited it.

### Comparable projects, scoped to FIPS mode

The prior draft surveyed seven projects, concluded "five of seven use lazy
rehash," and justified an unconditional bcrypt fallback with it. **That survey
measured non-FIPS behavior.** Corrected:

| Project | In FIPS mode | Verified |
|---|---|---|
| **Keycloak** | **Refuses.** The provider never registers, so verification is never reached; affected users "will not be able to login after switch to the FIPS environment" — remedy is "ask users to reset the password." Note the quotes describe **argon2** (Keycloak 25+ default), not bcrypt. The refuse-and-reset *pattern* is what transfers. | **[V]** source + docs |
| **GitLab** | **Gates on FIPS mode.** "Bcrypt: Used by default. **PBKDF2+SHA512: Used when FIPS mode is enabled.**" Concedes bcrypt hashes "cannot be re-encrypted without user help." Issue **#360659** — "Force password resets for users with bcrypt login passwords" (closed 2022-07-27). | **[V]** |
| **Mattermost** | **Supporting precedent.** As of v11 it defaults to PBKDF2-HMAC-SHA256 @ 600,000 behind a `requirefips` build tag — the same shape as this design. | **[V]** |

All three now point the same way: **gate on FIPS mode, and define a terminal
state.** Keycloak refuses outright, GitLab gates and drives toward forced resets,
Mattermost ships a FIPS build that uses PBKDF2 by default. An ungated,
unterminated bcrypt fallback — which is what an earlier draft of §3 specified —
matches none of them.

### The Grafana lesson

Grafana has used PBKDF2 since inception and remains at **10,000 iterations**
with no upgrade path, because parameters were never encoded in the stored hash
**[V]**. Encoding parameters is structural, not cosmetic.

## Decision

### 1. PBKDF2 via `node:crypto`

**Parameters:** PBKDF2-HMAC-SHA-512 (default; `sha256`/`sha384` selectable),
600,000 iterations, 32-byte salt from `crypto.randomBytes()`, derived key
matching digest width.

**Why this is an approved operation.** The prior draft argued "PBKDF2 is the
only NIST-approved password KDF, therefore compliant." That **overstates**:

- SP 800-132 §4: the derived Master Key is for generating Data Protection Keys;
  "**The MK shall not be used for other purposes.**" **[V]**
- IG **§D.N**: password-derived keys "**may only be used in storage
  applications.**" Every RHEL security policy examined repeats this. **[V]**

Hash-and-compare verification is not "a storage application" in that sense.

**But the module remains approved, and CMVP says so.** IG **2.4.C** anticipates
exactly this **[V]**:

> "If the module operator (e.g., calling application) can do things outside of
> the module's control/visibility that can take an otherwise approved algorithm
> and use it in a non-approved way (e.g., use PBKDF **and/or AES XTS** outside
> of storage applications), the corresponding module service **may still be
> considered approved** ... and the Security Policy shall clarify how to use the
> service in an approved manner."

So this is a **documentation obligation, not a design defect**. Two consequences:

1. **What actually satisfies V-222571** is that the **HMAC-SHA-512 primitive
   executes inside the validated module**; secure hashing is an approved
   security function. PBKDF2's iteration structure is a construction *over* an
   approved primitive, not an appeal to SP 800-132's key-derivation scope.
2. **The SSP must state this reasoning** and disclose the storage-application
   scope limit.

**Our parameters clear every bound the module enforces [V]** — policy
`140sp4857.pdf`: **a portion of** the salt ≥128 bits from the SP 800-90Ar1 DRBG, iterations ≥1000,
derived key ≥112 bits. The same policy lists "PBKDF2 (short password; short
salt; insufficient iterations; <112-bit keys)" as a **non-approved service** —
the failure mode is under-parameterisation, which we are well clear of.

**On password strength:** IG §D.N states "**SP 800-132 does not impose any
strictly defined requirements on the strength of a password**" **[V]**. An
earlier draft claimed a 112-bit floor implied a 14-character minimum. Wrong —
the "14" is a BouncyCastle byte-length check that Keycloak works around by
*padding*. Heimdall's 15-character minimum is good practice, not a FIPS
obligation, and must not be presented as one.

### 2. PHC string format

```
$pbkdf2-sha512$i=600000$<b64-salt>$<b64-key>
```

Per the [PHC string format](https://github.com/C2SP/C2SP/blob/main/phc-strings.md),
matching npm `phc-pbkdf2`. Standard base64, padding stripped. PHC is a strict
*subset* of Modular Crypt Format; bcrypt's `$2b$14$…` is valid MCF, invalid PHC.
Both coexist in one column.

The leading `$` is load-bearing: `$` appears in no base64 alphabet nor in
bcrypt's radix-64 **[V]**, so dispatch is an unambiguous lookup on `parts[1]`.
It also admits `$argon2id$v=19$m=…` unchanged if NIST approves Argon2.

**Storage width [V]:** 154 characters. Both `Users.encryptedPassword` and
`ApiKeys.apiKey` are `VARCHAR(255)` in model *and* migration — 101 characters
of headroom, no `VARCHAR(60)` anywhere. Postgres *errors* on overflow rather
than truncating, but it would fire **inside the login path**, so an AC asserts
output ≤255 for all three digests.

### 3. Migration: FIPS-gated fallback with a real terminal state

`verifyPassword` dispatches on stored format **and FIPS state**:

| Stored prefix | FIPS off | FIPS on (`getFips() === 1`) |
|---|---|---|
| `$pbkdf2-sha{256,384,512}$` | verify, `needsRehash: false` | verify, `needsRehash: false` |
| `$2a$`/`$2b$`/`$2y$` | `bcryptjs.compare()`; `needsRehash: valid` | **refuse — do not invoke bcryptjs**; `{valid: false, needsRehash: false, requiresReset: true}` |
| anything else | reject without throwing | reject without throwing |

#### Why the gate is required — the STIG, and only the STIG

An earlier version rested on CMVP **IG 2.4.A**. **That argument is withdrawn —
it ran backwards.** IG 2.4.A scopes to functions "**within the scope of the
module**"; `bcryptjs` is not within OpenSSL's boundary, so 2.4.A never reaches
it. IG 2.4.A *example 1* in fact lists "store authentication data using MD5"
among non-approved algorithms **permitted** in approved mode where no security
is claimed of the module — subject to that example's own conditions (no
security claimed; the result is "considered unprotected plaintext"). **[V]**

**FIPS 140-3 does not itself prohibit calling bcryptjs.** CMVP validates
modules, not applications; nothing the caller does voids OpenSSL's certificate.

**The prohibition is application-scoped and comes from the STIG.** V-222571's
check text, in full **[V]**:

> "If FIPS-validated cryptographic modules are **not used when generating
> hashes** or if the application is configured to use the MD5 or SHA1 hashing
> algorithm, this is a finding.
>
> **If hashing of application components has been identified in the application
> security plan as not being required and if a documented acceptance of risk is
> provided, this is not a finding.**
>
> **If the application resides on a National Security System (NSS) and uses an
> algorithm weaker than SHA-384, this is a finding.**"

The prior draft quoted only the first sentence and labelled it "verbatim." Two
consequences of the full text:

- A documented **risk acceptance** is an available path. We are not taking it,
  but an assessor knows it exists.
- **On NSS, `PASSWORD_HASH_ALGORITHM=sha256` is itself a finding.** §9 must
  carry that warning.

`bcryptjs.compare()` *generates* a bcrypt hash in pure JS inside no validated
module — the finding condition, literally. So the accurate claim is narrow:
**an ungated bcrypt call in a deployment asserting FIPS is a CAT II STIG
finding, not a FIPS 140-3 violation.** That is why Keycloak refuses and GitLab
gates.

**SP 800-131A does not apply** — its legacy-use doctrine covers algorithms that
were *once* approved. Bcrypt never was. **[V]** (verified for Rev 2; Rev 3 ipd
adds PBKDF language, so pin the revision when citing).

#### Three phases, with an end

1. **Non-FIPS operation** — lazy rehash on login. Transparent, no disruption.
2. **Cutover** — a migration **invalidates** every remaining `$2%` credential:
   overwrite `encryptedPassword` with an unusable sentinel *and* set
   `forcePasswordChange`. Setting the flag alone does **not** convert a hash —
   the user would still have to log in (refused under FIPS) and submit their
   old password (verified via bcrypt). The prior draft's phase 2 did not produce
   the terminal state it claimed.
3. **FIPS enablement** — no bcrypt hashes remain, so the gate never fires in
   normal operation.

The sentinel is any value `hashPassword` cannot produce; `verifyPassword`
rejects it on the unknown-format path with no new branch.

**Fresh installs have no transition** — provided the seeder is fixed (§4 site 8).

#### Recovery is a prerequisite, and it already exists

Heimdall has **no self-service password reset** — no forgot-password flow, no
reset token, anywhere in backend or frontend **[V]**. And admins **cannot edit
their own account without supplying their password** — `casl-ability.factory.ts:65`:
```ts
// Force admins to supply their password when editing their own user.
cannot(Action.Manage, User, {id: user.id});
```
**[V]** So a single-admin deployment that enables FIPS before cutover would be
locked out with no in-application remedy.

**The remedy is `heimdall-cli reset-password`**, which exists today at
[github.com/mitre/heimdall-cli](https://github.com/mitre/heimdall-cli). It
writes directly to the database via `psql` with parameterized binding, and sets
`passwordChangedAt`/`forcePasswordChange` — correct for a genuine reset. **[V]**

**But it hashes with bcrypt (cost 14)**, so after this change it would write a
credential the FIPS-gated server refuses — turning the break-glass tool into a
break-glass *trap*. Fixing it is a **blocking cross-repo dependency**, not a
follow-up. See §14.

### 4. Eight call sites

The prior draft enumerated seven and omitted the seeder — the one that runs on
every deployment. Line numbers verified at `2e1649c9e` **[V]**.

| # | File | Line | Function | Change |
|---|---|---|---|---|
| 1 | `users.service.ts` | 66 | `create()` | → service hash |
| 2 | `users.service.ts` | 89 | `update()` | → service hash |
| 3 | `users.service.ts` | 126 | `remove()` | → **pure** `verifyPassword`, `.valid` only |
| 4 | `authn.service.ts` | 53 | `validateUser()` | verify **+ CAS rehash** — primary migration path |
| 5 | `authn.service.ts` | 75 | `validateApiKey()` | verify + CAS rehash |
| 6 | `authn.service.ts` | 208 | `testPassword()` | → **pure** `verifyPassword` (see below) |
| 7 | `apikey.service.ts` | 43 | `create()` | → service hash |
| **8** | **`seeders/20200514154327-create-administrator.js`** | **56** | admin bootstrap | **`bcrypt.hashSync` → compiled pure function, awaited** |

**Site 8 matters most.** `cmd.sh:4` runs `db:seed:all` on **every container
start**, and the RPM path runs the same seeder. Unchanged, **every fresh install
provisions its administrator — the highest-privilege account — with a bcrypt
hash on day one**, in a change whose purpose is to eliminate them. With
`ADMIN_USES_EXTERNAL_AUTH=true` it may never migrate. It is also CommonJS,
synchronous, and runs outside both Nest DI and the TypeScript build.

**Exact require path [V]:** rootDir is inferred across `src/`, `db/`, `config/`,
so `src/crypto/password.ts` compiles to **`dist/src/crypto/password.js`** — note
the `src/` segment. From `seeders/*.js` that is `require('../dist/src/crypto/password')`.
`.sequelizerc` already depends on build output, and `cmd.sh` runs under `set -e`,
so a bad require is a **boot crash loop, not a degraded seed**. An AC must
assert the seeder resolves in the built image, and `password.ts` must stay
dependency-free so the inferred layout cannot shift.

**AC:** a fresh install, zero logins → `bcrypt_remaining = 0`.

#### Two structural constraints

**`testPassword` is called unbound [V].** `users.service.ts:79` does
`await AuthnService.prototype.testPassword(...)`. This works *only because*
`testPassword` uses the module-scope `compare` and never touches `this`. Making
it `this.passwordService.verify(...)` throws `TypeError`, and `UsersService`
cannot inject `AuthnService` (circular). **Site 6 must use the pure function.**

**No persistence method can honor the lifecycle constraint [V].**
`usersService.update()` unconditionally sets `passwordChangedAt` and
`forcePasswordChange`. Two narrow writers are required —
`UsersService.updateEncryptedPassword()` and an `ApiKeyService` equivalent —
following the existing `updateLoginMetadata`/`updateUserSecret` pattern.

### 5. Module structure

Only `hashPassword` needs configuration; `verifyPassword` reads parameters from
the hash. Hence:

- `apps/backend/src/crypto/password.ts` — **pure functions**. Usable from the
  seeder and scripts with no DI container (§4 sites 6 and 8 both require this).
- `apps/backend/src/crypto/password.service.ts` — Nest injectable reading
  `ConfigService`.
- `apps/backend/src/crypto/crypto.module.ts` — **required**: `ConfigModule` is
  *not* `@Global()` **[V]**.

```ts
export type PasswordHashAlgorithm = 'sha256' | 'sha384' | 'sha512';

export interface PasswordHashOptions {
  algorithm?: PasswordHashAlgorithm;   // default 'sha512'
  iterations?: number;                 // default 600000
}

export interface PasswordVerifyResult {
  valid: boolean;
  needsRehash: boolean;                // required, always present
  requiresReset?: boolean;             // bcrypt encountered while FIPS on
}

export function hashPassword(
  password: string,
  options?: PasswordHashOptions
): Promise<string>;

export function verifyPassword(args: {
  hash: string;
  password: string;
  getFips?: () => number;              // default crypto.getFips — INJECTABLE
}): Promise<PasswordVerifyResult>;
```

**`getFips` must be injectable.** §10's `assertFipsMode` already is; without the
same seam here the document's central new behavior is untestable in non-FIPS CI.
`vi.mock('crypto')` is unusable (the module also needs real `pbkdf2`,
`randomBytes`, `timingSafeEqual`), and `vi.spyOn` works only under a namespace
import — a destructured `import {getFips}` compiles to a non-writable binding
under swc. **AC: namespace import, never destructured.**

**The FIPS-refusal test must assert non-invocation**, not just the return value.
V-222571 fires on *generating* a hash, so an implementation that calls
`bcryptjs.compare()` and discards the result would pass a return-value
assertion while committing the exact finding.

### 6. Input validation — exact sequence

Each item is a verified trap **[V]** (confirmed by execution on Node 24):

1. Reject non-string/empty. **`''.split('$')` is `['']`**, so a `parts[0] === ''`
   check *passes* for the empty string — the field-count check catches it. These
   are `AND`, not alternatives.
2. `split('$')` must yield **exactly 5** parts, and `parts[0] === ''`.
3. **Strict allowlist over the full identifier** —
   `Set(['pbkdf2-sha256','pbkdf2-sha384','pbkdf2-sha512'])`. Never prefix-match:
   `crypto.pbkdf2` accepts `md5` and `sha1`, so `$pbkdf2-md5$…` would verify.
   Allowlisting only the digest still admits `$pbkdf2-sha512-md5$` via naive
   splitting. The prior draft specified `$pbkdf2-sha*$` — an algorithm-confusion
   downgrade in a document banning MD5.
4. **Iterations by regex only** — `/^i=([1-9][0-9]{0,8})$/`. **`parseInt('6e5')`
   is `6`** (a forged hash verifies at six iterations — a 100,000× downgrade
   that looks well-formed); `parseInt('600000abc')` is `600000`;
   `Number('0x10000')` is `65536`.
5. **Upper bound mandatory** — reject above 10,000,000. Node permits 2³¹−1,
   roughly 8.6 minutes of one libuv thread per verification; four such rows
   exhaust the default 4-thread pool and take authentication down.
   **No lower bound on the verify path** — see §9.
6. Decode salt and key, **re-encode and compare** (padding stripped both sides).
   `Buffer.from(str,'base64')` is lenient: `'AA@@AA'` and `'A A A A'` decode to
   the same three bytes as `'AAAA'`.
7. **Assert key length equals the digest's width, and salt ≥16 bytes, *before*
   calling `pbkdf2`.** `keylen=0` throws an **untyped** error (`e.code` is
   `undefined`) *before* any downstream guard — so the ADR's own required test
   ("malformed hash rejected without throwing") cannot pass without this. A hash
   claiming `sha512` with a 32-byte key would otherwise verify: silent
   acceptance of a downgraded artifact.
8. Guard length before `timingSafeEqual`, which **throws**
   `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH` on mismatch. Return `false`.

**Maximum password length: 128 characters**, enforced **on hashing only** (see
§9). Two reasons: **(a) DoS** — this is Django **CVE-2013-1443** exactly ("A
password one megabyte in size... roughly one minute of computation") **[V]**;
Heimdall sets `json({limit:'50mb'})` and rate-limits only `/authn/login` at
20/min/IP **[V]**. **(b) Approved range** — policy `140sp4857.pdf` states
PBKDF2 "8-128 characters" **[V]**.

**Critical: `authn.service.ts:109` generates a 256-character password [V].**
```ts
const randomPass = crypto.randomBytes(128).toString('hex');
```
It is the placeholder for **every** externally-authenticated user (OIDC, LDAP,
GitHub, GitLab, Google, Okta) and goes straight to `usersService.create()`.
A cap enforced inside the hash path would make **every external-auth user
creation throw**. **Shorten it to `randomBytes(32)`** (64 hex characters, 256
bits — ample for a credential never used to log in) so the cap stays uniform on
every path. An exemption would be a bypass waiting to be misused.

Removing bcrypt also removes its 72-byte truncation, so a >72-character password
is validated in full after rehash. Behaviorally correct; worth a test.

### 7. Concurrency: compare-and-swap

**`authn.service.ts:54` already calls `updateLoginMetadata(user)` without
`await` [V]** — a floating promise ending in `user.save()`. Adding a rehash
`save()` on the same instance gives two concurrent unawaited writes to one row.

**The damaging interleaving:** a user changes their password (writes H2) while
an in-flight login rehashes the **old** password and writes H1′. Last-write-wins
silently reverts the change. **If that change was a response to compromise, the
compliance fix reinstates the compromise.**

**Use `Model.update`, not raw SQL. [V]** The prior draft prescribed raw SQL plus
`silent: true` — but `sequelize.query()` **has no `silent` option** (zero hits in
Sequelize v6 source); it exists on `Model.update`. One call gives CAS, field
restriction, suppressed `updatedAt`, and the affected count:

```ts
const [affected] = await this.userModel.update(
  {encryptedPassword: newHash},
  {where: {id: user.id, encryptedPassword: originalHash},
   fields: ['encryptedPassword'], silent: true}
);
```

Zero rows means another writer won — do nothing. `silent: true` suppresses the
`updatedAt` bump so a mass migration does not make every account look recently
modified. Wrap in try/catch: **a failed rehash must never fail an otherwise
successful login.**

**The rehash must not mutate the Sequelize instance.** Assigning
`user.encryptedPassword = newHash` to keep the object coherent puts that field
into the in-flight `updateLoginMetadata` `save()` — **outside** the CAS
predicate, recreating the exact revert this prevents.

The same un-awaited pattern exists at `apikey.service.ts:44` **[V]**.

#### Lifecycle fields

`user.model.ts` declares `forcePasswordChange` (55) and `passwordChangedAt` (68)
**[V]**. A rehash changes only the stored representation. Writing
`passwordChangedAt` would silently reset the password-expiry clock for every
migrating user — a security regression introduced by a compliance fix.

**Test scope, corrected.** The prior draft required asserting `lastLogin`,
`loginCount`, and `updatedAt` unchanged. **That AC is unsatisfiable on the path
it protects** — `updateLoginMetadata` changes all three on every successful
login by design. Assert **`passwordChangedAt` and `forcePasswordChange`
unchanged**, `encryptedPassword` changed and now `$pbkdf2-`-prefixed, verified
after `await user.reload()` — not against the in-memory instance.

**Known wrinkle [V]:** migration `20200417145649` creates `passwordChangedAt` as
`Sequelize.STRING` while the model declares `DataType.DATE`, and
`synchronize: true` outside test means a synchronize-built DB gets `DATE` and a
migration-built one `VARCHAR(255)`. The test must compare type-agnostically.
Pre-existing; documented, not fixed here.

### 8. Known limitation: iteration upgrades do not propagate

A PBKDF2 hash always returns `needsRehash: false`, even when its stored `i=` is
below policy. **This is the Grafana failure mode this ADR criticizes**, and it
is a deliberate trade — reading parameters from the hash is what makes iteration
changes non-breaking. Recorded so a maintainer does not "fix" it accidentally.

### 9. Configuration

| Variable | Type | Default | Notes |
|---|---|---|---|
| `PASSWORD_HASH_ALGORITHM` | `sha256\|sha384\|sha512` | `sha512` | **NSS deployments must not use `sha256`** — V-222571 makes anything weaker than SHA-384 a finding |
| `PASSWORD_HASH_ITERATIONS` | int ≥100000 | `600000` | |
| `PASSWORD_MIN_LENGTH` | int | `15` | already read by heimdall-cli |
| `PASSWORD_MAX_LENGTH` | int ≤128 | `128` | §6 cap |
| `PASSWORD_REQUIRE_CLASSES` | int | `4` | already read by heimdall-cli |
| `PASSWORD_MAX_CONSECUTIVE` | int | `3` | already read by heimdall-cli |
| `FIPS_MODE` | boolean | unset | assertion + fallback gate |
| `PASSWORD_HASH_WRITE_ENABLED` | boolean | see §12 | rollout gate |

Out-of-range values **throw at startup**; they do not clamp silently.

**Floors and caps apply to hashing only, never verification.** The prior draft
contradicted itself — §6 required stored iterations within `[100_000,
10_000_000]` during the *verify* parse while §9 stated the floor "applies to
hashing only... or users are locked out." A user hashed under an earlier
`PASSWORD_HASH_ITERATIONS=50000` was simultaneously rejected and required to
succeed. **Verification enforces only the upper bound** (the DoS guard) plus a
sanity floor of 1000, the module's own documented minimum **[V]**. The same
applies to `PASSWORD_MAX_LENGTH`: capping on verify would lock out any user
whose password exceeds it. If an oversized password reaches the rehash path,
**skip the rehash and log it** — never fail the login (§7).

**Configurable complexity is now in scope, and neither side supports it yet.**
`libs/password-complexity` hardcodes its rules, and so does the Go
`heimdall-cli` — **[V]**. Only the *retired Python* CLI read
`PASSWORD_MIN_LENGTH` / `PASSWORD_REQUIRE_CLASSES` / `PASSWORD_MAX_CONSECUTIVE`
from `backend.env`; that capability was lost when the CLI was rewritten in Go,
and an earlier draft of this ADR wrongly attributed it to the current binary.

So the two implementations disagree about what a valid password is **by
duplication**, not by configuration drift: each hardcodes its own copy of the
rules, with nothing keeping them aligned. That is the same class of bug as the
hash format, and it needs fixing on both sides — the variable names above are the
contract, and **teaching the Go CLI to read them belongs on §14's blocking
cross-repo list**, not to a later phase.

### 10. FIPS mode on RHEL — the prior draft had this backwards

**Red Hat's Node actively discourages `--force-fips`. [V]** Verified by running
the UBI9 image:

```
$ node --force-fips -p 'require("crypto").getFips()'
ERROR: Using options related to FIPS is not recommended,
       configure FIPS in openssl instead.
```

The RHEL model is **host FIPS mode → OpenSSL enables → Node inherits**, not an
application flag. The prior draft built a three-layer design around
`--force-fips` — a `start:fips` script, a launcher preflight, and systemd
`StartLimitBurst` hardening to survive the resulting crash loop. **On RHEL none
of that is correct**, and the 2023 `fips_compliance` branch's `start:fips` was
wrong for the same reason.

**This simplifies the epic.** No preflight, no `start:fips`, and the crash-loop
blocker disappears because the flag is never passed. `--force-fips` remains
documented **only** for non-RHEL deployments running stock Node with a manually
configured provider.

**The startup assertion becomes more important, not less** — with no flag
forcing the issue, it is the only thing between us and silent non-FIPS
operation. This is GitLab's Workhorse failure: it shipped without the `fips`
build tag and `fips.Enabled()` returned **false with no error**.

`assertFipsMode({fipsMode, getFips})` must be **exported and injectable** —
`bootstrap()` in `main.ts` is not exported and cannot be unit-tested **[V]**.
When `FIPS_MODE` is unset, **log loudly at boot that no assertion was
performed**; silence is how the Workhorse class of failure survives.

**Never call `crypto.setFips()`** — under `--force-fips` it triggers a native
`CHECK()` that **aborts the process**; it does not throw. **[V]**

Two error families must not be conflated: `ERR_OSSL_EVP_UNSUPPORTED` is an
OpenSSL 3 legacy-provider problem, *not* FIPS; `EVP_DigestInit_ex:disabled for
FIPS` is a real denial.

### 11. Performance — measured, and it inverts the prior rating

The prior draft asserted "≈ bcrypt cost 14 (~200-400 ms)" and rated the change a
Low/Low performance *regression*. **Both wrong.** Measured on Node 24:

| Operation | Latency | Throughput | Event-loop lag |
|---|---|---|---|
| `bcryptjs` compare cost 14 (**current production**) | **1120 ms** | 0.9/sec | 788 ms |
| PBKDF2-SHA512 @600k (**this ADR**) | **145 ms** | 20/sec | 1.4 ms |
| PBKDF2-SHA512 @220k (OWASP floor) | ~55 ms | ~50/sec | — |

**A 7.7× latency and 22× throughput improvement.** The prior draft buried its
own strongest justification.

**The cost it failed to document:** `crypto.pbkdf2` dispatches to the **libuv
threadpool (default 4)**. Throughput pins at ~20 auth/sec *regardless of
concurrency*, and the pool is shared with `fs`, `dns.lookup`, and `zlib` —
`fs.readFile` went **1.16 ms → 337 ms** with 8 PBKDF2 operations queued.
"Async, does not block the event loop" is true but misleading. `UV_THREADPOOL_SIZE`
must be set — and it is **not an application env var**; libuv reads it at first
threadpool use, so it belongs in the Dockerfile, `cmd.sh`, or the systemd unit.

**600k is well supported.** OWASP's floor for PBKDF2-SHA512 is 220,000, and its
guidance now explicitly recommends "600,000 or more" in FIPS-140 contexts — so
the chosen value sits on the recommendation, not above it. It remains defensible
at 220k if latency matters more, but 600k is only safe if `UV_THREADPOOL_SIZE` is
raised and a global KDF concurrency limit lands.** Keeping 600k while addressing
neither is the one indefensible combination. Benchmark on the target RHEL
container before finalizing.

**Login is a DoS amplification vector [V]** — 20 req/min/IP on `/authn/login` is
the only protection; no global cap, no account lockout (`loginCount` increments
only on success).

**API keys: 600k iterations is pointless there.** The hashed value is a JWT
HS256 signature — 43 base64url characters, **256 bits of machine entropy**.
Iterated KDFs raise per-guess cost against *low-entropy human* input; brute
force from a stolen hash is infeasible at any iteration count. GitHub and Stripe
store API tokens as a single SHA-256. The path is **not** reachable
unauthenticated (`jwt.verify` gates it, and is cheap) **[V]**, and per-request
cost still *drops* 1120 → 145 ms. Recorded as a known inefficiency; changing it
is out of scope (§15).

### 12. Rollout and rollback

**(a) Rolling deploys.** Old and new pods share one database. A user rehashed by
a new pod then hits an old pod: `bcryptjs.compare()` returns `false` on a PBKDF2
hash (it does not throw — verified: `compare()` short-circuits on
`hashValue.length !== 60`) **[V]**, so they get "Incorrect Username or
Password" — *intermittent* auth failure that appears to self-resolve as the
deploy completes, amplified by the rate limit turning retries into 429s.

**API keys are worse.** `validateApiKey` serves CI and `saf` CLI — no human to
retry, silent pipeline failure. And an API key **cannot be recovered**; the
server stores only a hash of a signature it never retains.

**(b) Version skips (air-gapped RPM).** Forward skips are safe. **Reverse is
catastrophic**, and `dnf downgrade` is one command.

**Mechanism:**

1. **`PASSWORD_HASH_WRITE_ENABLED`**, default `false` in release N, `true` in
   N+1. When false, `verifyPassword` still reports `needsRehash` but call sites
   skip the write. **Scope must be stated explicitly**: the gate covers *all*
   writes (sites 1, 2, 7, 8) during the rolling window, not just rehash —
   otherwise a password change or a new SSO user on an N pod is unreadable by a
   pre-N pod. Consequently §4's "fresh install → `bcrypt_remaining = 0`" AC
   applies from **N+1**, or the gate must be derived: enabled unconditionally on
   a fresh install (no pre-N peer can exist), defaulted off only on upgrade.
2. **A durable DB marker planted in release N**, recording that PBKDF2 writes
   have begun. **Planting trigger must be defined** — at install it records
   something untrue; on first write it flips during the canary while most rows
   are still bcrypt. Define which, and who reads it.
3. **Enforcement is in the application, not RPM `%pre`.** The prior draft
   specified a `%pre` guard; **it cannot fire on the downgrades it targets** —
   on downgrade the `%pre` that runs belongs to the **older** package, built
   before the guard existed. It also cannot abort the transaction, and would
   need Postgres access mid-transaction on exactly the air-gapped hosts it
   serves. Instead: **the application refuses to start when it reads a marker
   newer than its own code version.** That works on RPM and container paths
   alike, needs no scriptlet DB access, and is the only mechanism that also
   catches the `pg_dump`-restore hazard.
4. **Graceful-degradation AC** — an integration test running the old verify path
   against a PBKDF2 hash, asserting a clean `false`, no throw, no 500.

**Read replicas.** The lazy rehash is a write on the login path; a lagging
replica read would return the stale bcrypt hash and rehash again — an unbounded
loop. Heimdall does not use read replicas today; recorded as an assumption.

### 13. Dependency audit

**Own code is clean [V]** — no `md5`/`sha1`/`createHash` in
`apps/backend/src`, `apps/backend/config`, `libs/common`, or
`libs/password-complexity`. Only `crypto.randomBytes`. `uuid` v4 only. No
`@aws-sdk/*` or `hdf-converters` in the backend.

**Express ETag — the prior draft's diagnosis was wrong. [V]** `etag/index.js:47`
uses **`createHash('sha1')`**, not MD5; the empty-body constant
`2jmj7l5rSw0yVb/vlWAYkK/YBwk` is exactly `sha1('')`. SHA-1 **is** approved in the
OpenSSL 3 FIPS provider, so this likely does **not** break under plain FIPS.
*Two reviewers asserted MD5; both were wrong — the source read is definitive.*

**But verify under `FIPS:STIG`**, whose permitted hash list is SHA-2/SHA-3 only.
If it does break, use a **SHA-256 custom generator**, never `app.set('etag',
false)` — Heimdall serves large HDF JSON payloads, so losing 304 revalidation
costs more than rehashing. `serve-static` uses stat-based tags and no hash.

**`pg` MD5 auth breaks under FIPS** — see §16.

**Runtime audit required.** Static analysis cannot see transitive dependencies.
Unaudited: `passport-google-oauth` (bundles an OAuth 1.0a HMAC-SHA1 path),
`passport-ldapauth` (SASL DIGEST-MD5 if configured), `express-session`.

### 14. Repository boundary and the cross-repo dependency

This is no longer hypothetical. Current topology:

| Repo | Owns |
|---|---|
| **mitre/heimdall2** | application, `packaging/rpm/` (imported `35d47dee3`), `libs/password-hash-vectors/` (the contract) |
| **mitre/heimdall-cli** | Go admin binary, own release pipeline, consumes the vectors |
| **mitre/saf-packaging** | cross-SAF policy, airgap/repo infrastructure, other tools |

**Why the CLI stays separate.** Of its fifteen commands, fourteen are
deployment-domain (start/stop/status/logs/backup/restore/certs/fapolicyd/…).
Exactly one, `reset-password`, touches an app contract. Its value is being a
**static binary that works when the app is broken** — no Node, no `dist/`, no
working install. Note the history: an earlier Python CLI hashed by shelling out
to the app's `bcryptjs` — true single-implementation — and was **deliberately
replaced** one day later by the Go binary for "single binary, no Python/vendor
dependencies" **[V]**. That trade was made on purpose; the contract restores
safety without giving it back.

**The contract: `libs/password-hash-vectors/`.** heimdall2 owns the format and
publishes versioned vectors — known password→hash pairs plus the malformed-hash
corpus (which §6's tests need anyway) and a `formatVersion` stamp. Both
implementations test against it; a mismatch is a **build failure**.

**Blocking cross-repo work in this epic:**

1. Add `Pbkdf2Hasher` implementing the CLI's existing `PasswordHasher`
   interface — the seam is already there
2. Write PHC format, not bcrypt; **remove the bcrypt write path entirely**
3. Consume the published vectors, asserting `formatVersion`
4. Update `heimdall-cli-reset-password.1`, which documents bcrypt cost 14
5. **Read the `PASSWORD_*` environment variables** (§9). The Go CLI hardcodes
   its complexity rules, as does `libs/password-complexity` — each carries its
   own copy with nothing keeping them aligned. Only the retired Python CLI read
   them. **[V]**
6. **Restore `cmd/gen-manpages`.** It did not survive the extraction to a
   standalone repository, and the spec's `%files` claims
   `%{_mandir}/man1/heimdall-cli*.1*` while the CLI's `.gitignore` excludes
   `man/man1/` as generated output. So the pages are neither committed nor
   generatable — the RPM cannot currently build. `packaging/rpm/Makefile`'s
   `man:` target fails with an explicit message rather than a confusing
   `go: cannot find main module`. **[V]**

Until (1)–(3) land, enabling the FIPS gate turns break-glass into a trap. (6)
blocks the RPM build outright.

**RPM packaging is now in-tree**, so §10's deployment changes and §16's Postgres
detection are ordinary cards in this repo rather than cross-repo coordination.

#### The build pipeline carries the contract

The import (`35d47dee3`) left four references pointing at saf-packaging's layout,
where `heimdall-server/`, `heimdall-cli/`, and `scripts/` were siblings. Repaired
in `d2fca993e` and `7fb61561c`:

| Was | Now |
|---|---|
| `scripts/fetch-source.sh` downloaded a release tarball | `git archive v$(VERSION)` from the local repository — no network, so airgapped builds work without a mirror |
| `CLI_DIR := ../heimdall-cli` (sibling path) | clone at **`HEIMDALL_CLI_REF`** |
| `man:` used the same broken sibling path | generated from the *same* pinned checkout as the binary, so pages cannot drift from the commands they document |
| `NAME`/`VERSION` from `rpmspec` (RHEL-only) | POSIX `sed`; the repository `VERSION` file is canonical and `check-version` fails the build if the spec disagrees |

**`HEIMDALL_CLI_REF` is where the §14 contract actually lives.** It records
exactly which CLI a given RPM shipped. Release builds must pin a tag. Combined
with `libs/password-hash-vectors/`'s `formatVersion`, a CLI that cannot produce
the current hash format fails the build rather than shipping a break-glass tool
that writes credentials the server refuses.

Two bugs were fixed in passing: `CLI_COMMIT` was `git rev-parse HEAD` evaluated
in the *packaging* repo, so `heimdall-cli --version` reported a heimdall2 commit
as the CLI commit; and a spec/repository version mismatch had no detection at
all — which is how the `feat/rpm-build` copy sat at 2.12.6 while the shipped one
tracked to 2.13.1.

**CI builds the RPM** (`987bfffc9`, `.github/workflows/build-rpm.yml`) for
el8/el9 × x86_64/aarch64 on native runners, smoke-tests installation in a clean
container with no build dependencies present, and attaches the artifacts to
GitHub Releases with `actions/attest-build-provenance`. heimdall2 published no
downloadable release assets before this.

Note the RPM cannot use the usual SRPM-as-handoff idiom: `Source15` is a
pre-built architecture-specific CLI binary, so an x86_64 SRPM cannot build an
aarch64 RPM. Each architecture does a full native build, with sources identical
by construction — same tag, same `HEIMDALL_CLI_REF`.

**Not yet build-verified.** `rpmspec` does not exist on macOS and hosted runners
are not FIPS-enabled, so the RPM has never actually been built from its new home.
That verification gates removing saf-packaging's copies (`heimdall2-30c.5`), and
belongs on the same FIPS-host trip as the §15 `[U]` questions.

#### Distribution

RPMs are built in two places, for two different reasons.

**Fedora COPR is the build farm.** Project `mitresaf/saf`
([copr.fedorainfracloud.org/coprs/mitresaf/saf](https://copr.fedorainfracloud.org/coprs/mitresaf/saf/),
ID 249476) created 2026-07-30 with `epel-8` and `epel-9` chroots on x86_64 and
aarch64. **[V]** As an open-source project we get real `mock` chroots on native
multi-architecture builders at no cost — an authentic EL build environment
rather than the approximation a container-on-Ubuntu CI job provides. The
precedent is directly relevant: Caddy, which this RPM already `Recommends:`,
ships via `dnf copr enable @caddy/caddy` as its official RHEL channel.

Three operational facts, verified:

- **`enable_net` must be on.** It has defaulted to *false* since June 2022, and
  `%build` runs `yarn install`. Every build fails without it. Confirmed set on
  the project (`enable_net: True`). **[V]**
- **COPR is not durable storage.** `mitresaf/saf` uses the Pulp backend, which
  retains only the **5 most recent successful builds per package**; content is
  also removed 180 days after a chroot reaches EOL. **GitHub Releases is
  therefore the archival home**, not an alternative to it. **[V]**
- **COPR signs with its own per-project key**, published at
  `results/mitresaf/saf/pubkey.gpg` — which does not exist until the first
  successful build. **[V]**

That last point resolves a real inconsistency: `saf.repo` currently sets
`gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-SAF-MITRE` while
`heimdall-server.repo` points at COPR's `pubkey.gpg`. **These disagree, and both
reference a project namespace (`@mitre/saf`) that never existed.** Either users
verify COPR's key, or artifacts are re-signed with the MITRE key on the way to
GitHub Releases. Both files must be corrected once the first build publishes a
key.

**Signing, when it happens, uses RSA — not ed25519.** RHEL 9 ships rpm 4.16, which predates EdDSA
verification support; EdDSA-signed RPMs sign but will not install (rpm#1877
documents the behaviour on rpm 4.17/openSUSE). The key
should be published over HTTPS at a MITRE URL *and* shipped inside a
`heimdall-server-release` RPM to `/etc/pki/rpm-gpg/`, which is the pattern that
survives air-gap. **[U]** — the RSA/EdDSA constraint is verified; whether MITRE
wants detached GPG signatures in addition to COPR's is a security-team decision,
not an engineering default.

**EPEL proper is not a viable target.** Not because of bundled `node_modules` —
Fedora made npm bundling the default in F34 — but mechanically: Koji builds are
network-isolated and `%build` runs `yarn install --frozen-lockfile`. Submitting
would require vendoring `node_modules` into the source tarball and generating the
`Provides: bundled(npm(...))` manifest the spec explicitly declines to produce,
then clearing first-package sponsorship. Quarters, not weeks. **[V]**

**The air-gapped bundle matters more than the online repo.** DoD sites mirror
internally regardless, so `airgap/build-bundle.sh` (createrepo_c output plus the
key and a `file:///` `.repo`) is the artifact most deployments actually consume.
RKE2 is the closest analogue — FIPS/government focus, an online repo plus air-gap
tarballs in GitHub Releases — and it is worth following.

**Resulting layers:**

| Layer | Mechanism | Why |
|---|---|---|
| Build farm | COPR `mitresaf/saf` | free native multi-arch, real mock chroots |
| Durable artifacts | GitHub Releases | COPR retention makes this mandatory |
| Online convenience | COPR repo | `dnf copr enable mitresaf/saf` for current-version users |
| Air-gapped | `airgap/build-bundle.sh` | the path the target deployments use |
| CI | `.github/workflows/build-rpm.yml` | PR-time proof the spec builds and installs |

**Sequencing note.** COPR generates the signing key and repository tree on first
successful build, so the `.repo` corrections above are blocked until one lands.
A first manual build (`copr-cli build mitresaf/saf <srpm>`) doubles as the
verification that the packaging move works — in a real mock chroot on both
architectures, which is stronger evidence than the OL9 VM would provide.

### 15. Platform

`Dockerfile:1` sets `ARG BASE_CONTAINER=registry.access.redhat.com/ubi9/nodejs-22-minimal:1`
**[V]**. Verified by running it:

- **`shared_openssl: true`** — Node 22.23.1 against OpenSSL 3.5.5, shared build,
  so it uses system OpenSSL rather than a bundled copy **[V]**
- **`fips.so` is present** at `/usr/lib64/ossl-modules/` (1.3 MB), and the
  provider identifies as **"Red Hat Enterprise Linux 9 - OpenSSL FIPS Provider",
  version `3.0.7-cda111b5812c30d4`** **[V]**

**That version is NOT the validated one, and it never will be.** Certificate
#4857 validates version **`3.0.7-395c1a240fbfffd8`**; the string the running
container reports appears in no CMVP record. This is not a mistake to fix by
pinning — it is structural. Red Hat validated one specific openssl build and has
shipped security errata since, so **any current UBI image carries a newer,
non-validated maintenance build of the same module**, essentially always.

Pinning the literally-validated build is the strictly worse option: it forgoes
every CVE fix issued since validation, which contradicts this ADR's own
security-over-compliance tiebreaker. The remedy is **documentation, not pinning**:

1. Cite certificate **#4857** and its validated version `3.0.7-395c1a240fbfffd8`
2. **Disclose the deployed build** as a Red Hat maintenance build of that module
3. Self-affirm the operational environment under CMVP Management Manual **§7.9**
   (Level 1 porting — see §14)
4. Cite the FedRAMP *Policy for Cryptographic Module Selection and Use* — the
   same document this ADR already cites for FRR8 — which directs CSPs to
   prioritize security patching over remaining on a frozen validated binary

This posture must be verified on the FIPS-host trip alongside the `[U]` items
below. In particular, **whether the containerized provider activates at all
without its own `fipsmodule.cnf` is upstream of any version-citation question** —
if it does not activate, the version discussion is moot.
- **`fipsmodule.cnf` is absent.** On a stock OpenSSL flow that file (from
  `openssl fipsinstall`) activates the provider; RHEL's patched OpenSSL instead
  keys off `/proc/sys/crypto/fips_enabled`. **Whether a container on a FIPS host
  activates the provider without its own `fipsmodule.cnf` is unresolved** and
  requires a FIPS host to settle. **[U]**

**Four constraints:**

1. **It is an overridable `ARG`.** `--build-arg BASE_CONTAINER=node:22-alpine`
   silently produces exactly the compliance theater this ADR warns against.
   Consider failing the build if the base is not UBI.
2. **A UBI image carries no validation of its own.** Red Hat's position:
   products are not FIPS validated, cryptographic components are. **A FIPS-mode
   RHEL host is a hard requirement.**
3. Node **never** reads `/proc/sys/crypto/fips_enabled`; RHEL's *OpenSSL* does.
   That runtime check **is** the inheritance mechanism.
4. **Since RHEL 9.2 the FIPS provider ships as a separate RPM** **[U]** — the
   package exists on Red Hat's UBI CDN, but the "since 9.2" claim could not be
   retrieved.

Stock nodejs.org binaries **do** support FIPS — `BUILDING.md`: "It is not
necessary to rebuild Node.js to enable support for FIPS" **[V]** — but require
`openssl fipsinstall`, `OPENSSL_CONF`, and `OPENSSL_MODULES` (documented in
`doc/api/crypto.md`, **not** BUILDING.md).

**Operational environment.** CMVP **Management Manual §7.9**: a user "may
perform post-validation porting of a module and affirm the module's continued
validation compliance," and a Level 1 software module "will remain compliant
with the FIPS 140-3 validation on any general-purpose platform/processor that
supports the specified operating system... or another compatible operating
system." CMVP "makes no statement as to the correct operation of the module...
when ported and executed in an OE not listed on the validation certificate."
**[V]** So an untested OE **does not void validation** at Level 1 — the customer
self-affirms.

### 16. PostgreSQL

**Narrower than the prior draft implied [V].** `docker-compose.yml:3` pins
**`postgres:17`**; Postgres 14+ defaults to `scram-sha-256`. Exposure is RHEL 8
AppStream (Postgres 13) and pre-existing customer databases.

**And the prior remediation did not address the case it identified.**
`POSTGRES_HOST_AUTH_METHOD`/`POSTGRES_INITDB_ARGS` are Docker-image variables
that take effect **only during `initdb` on an empty data directory**. Even
`password_encryption = 'scram-sha-256'` affects only passwords set *after* the
change; existing roles keep their `md5…` verifier in `pg_authid`:

```sql
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
SELECT pg_reload_conf();
ALTER ROLE heimdall WITH PASSWORD '<same or new>';   -- rewrites the verifier
-- then flip pg_hba.conf md5 → scram-sha-256 and reload
SELECT rolname, left(rolpassword, 14) FROM pg_authid WHERE rolname = 'heimdall';
```

Add the `pg_authid` check to `packaging/rpm`'s setup detection so an operator is
warned *before* the app fails to connect.

### 17. Observability

**The prior removal criterion — "zero rows across all deployments" — is
unsatisfiable.** MITRE ships to air-gapped customers; the vendor never sees
their tables.

- **Log every rehash** at `info` via the existing Winston logger: user id,
  `from: bcrypt`, `to: pbkdf2-sha512`, iterations. Since §7 forbids touching
  `passwordChangedAt`, nothing else records that a credential converted.
- **A `/health` endpoint.** None exists **[V]**. Split it: unauthenticated
  liveness returning `{status, version}` only; **authenticated** admin detail
  for `fips`, `passwordHashWriteEnabled`, and `bcryptRemaining`. The counts are
  a full scan of `Users` — a readiness probe that scans a user table every few
  seconds is a self-inflicted outage, and publishing migration state
  unauthenticated is a disclosure decision. Note `app.controller.ts:11` already
  exposes an unauthenticated `/server` endpoint — the right thing to compare
  against.
- **Progress query covering both tables** — the prior draft's covered `Users`
  only, so `bcrypt_remaining = 0` could be true while every `ApiKeys.apiKey`
  row was still `$2b$`:

```sql
SELECT count(*) FILTER (WHERE "encryptedPassword" LIKE '$2%')       AS bcrypt_remaining,
       count(*) FILTER (WHERE "encryptedPassword" LIKE '$pbkdf2-%') AS pbkdf2_migrated,
       max(age(now(), "lastLogin")) FILTER (WHERE "encryptedPassword" LIKE '$2%') AS oldest_unmigrated
FROM "Users";
```
Plus the `ApiKeys` equivalent. Ship as `heimdall-cli report`, not a wiki snippet
air-gapped operators cannot reach.
- **Admin UI** — per-user legacy-hash badge, bulk force-password-change, and
  **bulk API-key invalidation** (keys are *regenerated*, not reset).

**Restated removal criterion:** no earlier than N+3, and only after
`bcrypt_remaining = 0` across **both tables** is confirmed via the health
endpoint, or a forced-reset release has shipped.

## STIG and control mapping

| Rule | Severity | Requirement | Status |
|---|---|---|---|
| **V-222542** | CAT I | Salted iterated hash; MD5 prohibited. **No FIPS mention.** CCI-004062 | Already satisfied; remains so |
| **V-222571** | CAT II | FIPS-validated modules **when generating hashes** | Satisfied once §3's gate lands and legacy hashes retire |
| **V-222572** | CAT II | FIPS-validated modules for unclassified data | Same condition |
| **V-222543** | CAT I | Passwords transmitted cryptographically protected | **NOT satisfied — prior draft claimed it was.** `main.ts:39-45` *explicitly removes* `upgrade-insecure-requests`; cookie `secure` only in production **[V]**. Requires a TLS reverse proxy — deployment requirement, not an application control |
| **V-222570** | CAT II | FIPS-validated modules when **signing application components** (code signing) | **Mapping questionable** — the prior draft mapped JWT signing to a code-signing rule. Regardless, `apikey.service.ts:29` signs HS256 with an **empty-string key** when `API_KEY_SECRET` is unset, and `JWT_SECRET` is combined by **string concatenation** **[V]**. Tracked as `heimdall2-0bi`. The rule offers an AoR path we do not have |
| **V-230223** (RHEL 8) / **V-258241** (RHEL 9) | CAT I | System-wide FIPS crypto policy via `update-crypto-policies` | **Customer host responsibility.** No application change satisfies an OS rule. V-230223 is a RHEL **8** rule; our base is UBI **9** |

**Supporting:** IA-5(1)(d) is the affirmative control **[V]**. SC-13 assessment
objects name validation certificates explicitly **[V]**.

**Corrections to the prior draft's `[U]` list:**

- **IA-7 — dropped. It is the wrong control.** IA-7 governs authenticating an
  operator **to a cryptographic module**, not an application verifying an end
  user's password. DISA's own implementation (APSC-DV-001860): "If the
  application does not provide authenticated access to a cryptographic module,
  the requirement is not applicable." **[V]** The correct citation is SC-13 via
  CCI-002450 — implemented as **APSC-DV-002030**, which *is* V-222571.
- **V-16793 — dropped. Retired.** Zero occurrences in the current ASD STIG
  (V6R4, revised 2025-09-09); superseded by the 2016 move to `APSC-DV-*`
  rules. Nearest current coverage is APSC-DV-002380 (SC-4) and APSC-DV-002330
  (SC-28), both CAT II. **[V]**
- **Memory zeroization — not applicable.** FIPS 140-3 AS09.28 requires zeroising
  SSPs "**within the module**"; the application is outside it. IG 9.6.A
  explicitly exempts our case: "An approved hash algorithm for a CSP such as a
  password that does not need to be recovered but is used to check if it matches
  any other values." **[V]** No Node practice exists because the requirement was
  never scoped there — the HTTP body parser produces a string before our code
  sees it. Mention only as defense-in-depth, if at all.
- **SI-6** — Rev 5 title is "Security **and Privacy** Function Verification",
  and it is **HIGH baseline only** (absent from LOW and MODERATE) **[V]**.
  Defensible for a startup FIPS check; not mandatory at MODERATE.
- **SP 800-63B peppering** — **SHOULD, not SHALL**, in Rev 3 §5.1.1.2 and Rev 4
  §3.1.1.2 **[V]**. Cite **Rev 4**; Rev 3 was withdrawn 2025-08-01. We do not
  pepper; recorded as a decision. Our 32-byte salt far exceeds the 32-*bit*
  minimum.
- **NIST IR 8547** — still an **Initial Public Draft**, and "Deprecated after
  2030 / Disallowed after 2035" applies **only to the 112-bit row**; at ≥128-bit
  strength there is no 2030 deprecation **[V]**. Cite with both qualifiers or
  omit.

## Certificates

The prior draft cited **two wrong certificates** — the first thing an assessor
checks. **[V]**:

| Cited | Actual | Verdict |
|---|---|---|
| #4985 "RHEL OpenSSL" | **OpenSSL FIPS Provider**, vendor *The OpenSSL Project* | Wrong vendor |
| #4754 "Red Hat FIPS 140-3 policy" | **RHEL 9 libgcrypt** | Wrong library, and **Historical**, superseded by #5366 |

**Correct: #4857** — "Red Hat Enterprise Linux 9 - OpenSSL FIPS Provider",
**Active**, validated 2024-10-29, sunset 2029-10-28. **#4746** covered RHEL 9.0 and went
**Historical on 2026-07-30** — do not cite it.

The running module self-identifies as `3.0.7-cda111b5812c30d4`, which is a
Red Hat **maintenance build**, not the validated `3.0.7-395c1a240fbfffd8` (§15).
The SSP must name the certificate and its validated version, disclose the
deployed build, and self-affirm the operational environment.

## Scope

**In scope:** pure module + service + Nest module; migration at all **eight**
sites; FIPS-gated fallback; §6 validation; CAS writes; narrow persistence
methods; env vars including configurable complexity; startup assertion;
`/health`; rehash logging; cutover invalidation; progress reporting;
`libs/password-hash-vectors/`; `packaging/rpm` FIPS + Postgres detection;
**heimdall-cli PBKDF2 support (cross-repo, blocking)**.

**NOT in scope:**

1. **Changing what API keys hash** — bcrypt's 72-byte limit is why only the
   signature is hashed; changing it invalidates every existing key. Needs its
   own ADR and a rotation plan. §11's inefficiency is recorded, not acted on.
2. **Migrating to better-auth** (`izw`). Forward note: v3 returns a bare boolean
   because better-auth's `verify` contract requires it; our richer return is
   possible *because* heimdall2 has no such constraint. A future adapter
   discards `needsRehash` on better-auth's path while an outer hook rehashes.
3. **Self-service password reset** — Heimdall has **no email infrastructure**
   (zero `nodemailer`/SMTP anywhere) **[V]**, and outbound mail is often
   unavailable in the target deployments. `heimdall-cli` plus admin UI covers
   recovery. A forgot-password flow is a separate epic gated on SMTP.
4. **Removing `bcryptjs`** — required for legacy verification until §17's
   criterion is met.
5. **Fixing V-222570** (empty-string JWT key, concatenated secret) — real,
   verified, tracked as `heimdall2-0bi`.
6. **The `passwordChangedAt` column-type mismatch** — pre-existing (§7).
7. **Elastic-style `pbkdf2_stretch`** — exists to defeat *bcrypt's 72-byte
   truncation*, which PBKDF2 does not have. (The prior draft justified excluding
   it by the 15-character minimum, which is a non-sequitur.)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Rollback / mixed-version lockout | Medium | **High** | §12 — write gate, durable marker, app-side version check. API keys unrecoverable; regeneration is the only path |
| Break-glass tool writes an unusable credential | **High if unfixed** | **High** | §14 — heimdall-cli PBKDF2 support is blocking, not follow-up |
| Fresh install ships a bcrypt admin | **High if unfixed** | **High** | §4 site 8 |
| Rehash reverts a password change | Medium | **High** | §7 compare-and-swap |
| Silent FIPS bypass | Medium | **High** | §10 assertion; loud log when `FIPS_MODE` unset |
| Auth throughput ceiling / threadpool starvation | Medium | Medium | §11 — `UV_THREADPOOL_SIZE`, global KDF limiter, benchmark on target hardware |
| DoS via long password or forged iterations | Medium | Medium | §6 — 128-char cap on hashing, iteration bounds |
| Operator enables FIPS before cutover | Medium | **High** | §3 phased order; heimdall-cli break-glass; document the ordering as a hard rule |
| Transitive dependency uses a non-approved digest | Medium | Medium | §13 runtime audit |
| Dormant accounts never migrate | **High** | Low | §3 cutover + §17 bulk action. bcrypt remains strong — the gap is compliance, not security |
| `requiresReset` becomes an enumeration oracle | Medium | Medium | **Return the generic 401 to unauthenticated callers.** `local.strategy.ts` collapses every failure into one message today; distinguishing "needs reset" would tell an attacker which accounts exist *and* are dormant. Surface migration state only through the authenticated admin surface and logs |
| Timing side-channel | Low | Low | Under FIPS the refuse path does no KDF work at all, so separation is effectively infinite rather than the 7.7× in §11. Mitigation is a **dummy hash on the absent, unknown-format, *and refuse* paths**. Note: the prior draft cited Django's `harden_runtime()` — **incorrectly**; that equalizes *intra-PBKDF2 iteration* differences and cannot bridge a bcrypt-vs-PBKDF2 gap |

## Alternatives considered

1. **Argon2id** — OWASP's first recommendation, **not FIPS-approved**; no
   revised SP 800-132 draft exists. Keycloak defaults to it and must override in
   FIPS mode. The PHC format admits it later with no parser change.
2. **Hard cutover** (v3's approach) — forces a reset for every user. §3's phased
   design reaches the same terminal state without it.
3. **Keep bcrypt, add `--force-fips`** — compliance theater, and on RHEL the
   flag is discouraged outright (§10).
4. **Unconditional bcrypt fallback** (prior draft) — weaker than both Keycloak
   and GitLab.
5. **Adopt an npm package** — no viable candidate. `@phc/pbkdf2` last published
   **2018**, repo dead since 2021, no types, 13 stars. `pbkdf2-password` defaults
   to **SHA-1**. Everything maintained uses a non-approved KDF or native/WASM
   bindings that bypass OpenSSL. **[V]**
6. **Spring-style opt-in rehash service** — `UserDetailsPasswordService`
   silently no-ops when unwired. Django's inline setter fails loudly. We follow
   Django.
7. **Move heimdall-cli into this monorepo** — rejected (§14). Fourteen of its
   fifteen commands are deployment-domain, its `go.mod` already declares a
   top-level module path, and its value is being a zero-dependency static binary.

## Guiding principle

GitLab's stated tiebreaker, adopted: **when security and compliance cannot both
be satisfied, favor security.** Nothing here requires that trade — PBKDF2 at
600k is both — but it governs any future conflict.

## References

**Standards** — [SP 800-132](https://csrc.nist.gov/pubs/sp/800/132/final) ·
[FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final) ·
[FIPS 140-3 IG](https://csrc.nist.gov/CSRC/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf)
(2.4.A, 2.4.C, 9.6.A, D.N) ·
[CMVP Management Manual](https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS-140-3-CMVP%20Management%20Manual.pdf)
(§7.9) · [SP 800-53A Rev 5](https://csrc.nist.gov/pubs/sp/800/53/a/r5/final)
(SC-13, IA-5(1)(d), SI-6) · [SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html) ·
[FedRAMP Cryptographic Module Policy v1.1](https://www.fedramp.gov/resources/documents/FedRAMP_Policy_for_Cryptographic_Module_Selection_v1.1.0.pdf)
(FRR8) · [PHC string format](https://github.com/C2SP/C2SP/blob/main/phc-strings.md) ·
[OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

**Certificates** — [#4857](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4857) (Active) ·
[#4746](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4746) (sunsets 2026-07-30) ·
[#4985](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4985) (OpenSSL Project, *not* Red Hat) ·
[#4754](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4754) (libgcrypt, Historical)

**Implementations** — [GitLab FIPS](https://docs.gitlab.com/development/fips_gitlab/) ·
[GitLab password storage](https://docs.gitlab.com/security/password_storage/) ·
[GitLab #360659](https://gitlab.com/gitlab-org/gitlab/-/issues/360659) ·
[Keycloak FIPS](https://www.keycloak.org/server/fips) ·
[Django CVE-2013-1443](https://www.djangoproject.com/weblog/2013/sep/15/security/) ·
[Django hashers.py](https://github.com/django/django/blob/main/django/contrib/auth/hashers.py) ·
[phc-pbkdf2](https://github.com/simonepri/phc-pbkdf2)

**Known breakage** — [jshttp/etag#17](https://github.com/jshttp/etag/issues/17) ·
[node-postgres#1706](https://github.com/brianc/node-postgres/issues/1706) (a PR, not an issue)

**In-repo / cross-repo** — Heimdall v3 `a52f6ceb` (`mitre/heimdall`) ·
`fips_compliance` branch `cbfa40946`, `b384fd335`, `310c24a3c` ·
[mitre/heimdall-cli](https://github.com/mitre/heimdall-cli) ·
`packaging/rpm/` (imported `35d47dee3`)
