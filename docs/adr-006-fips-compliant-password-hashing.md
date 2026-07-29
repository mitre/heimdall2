# ADR-006: FIPS 140-3 Compliant Password Hashing

**Status:** Proposed
**Date:** 2026-07-29
**Author:** Aaron Lippold
**Branch:** `feature/fips-compliant-password-hashing`
**Base:** `master` @ `2e1649c9e`

## Context

Heimdall2 stores user passwords hashed with bcrypt via `bcryptjs` (pure JavaScript, cost factor 14). API keys are stored as bcrypt hashes of JWT signatures. This is a FIPS compliance gap:

1. **bcrypt is not FIPS-approved.** Bcrypt uses Blowfish, which is not listed in SP 800-140C. Neither scrypt nor Argon2 are approved either — Argon2 is planned for a revised SP 800-132 but no draft exists.

2. **bcryptjs bypasses the FIPS boundary entirely.** It is pure JavaScript — it never calls `node:crypto` or OpenSSL. On a FIPS-enabled host it runs *undetected and unblocked*, outside the validated module. This failure mode is well known: Chainguard's `node-fips` image documentation flags bcryptjs by name, and SafeLogic's Node.js FIPS guidance warns that "even if Node.js is configured correctly at the core level, parts of the application may still operate outside the FIPS boundary," naming bcrypt explicitly.

3. **Customers on STIG-hardened systems cannot pass ASD STIG checks.** V-222542 (High) requires cryptographic password storage via FIPS-validated algorithms; V-222571 (Medium) requires FIPS-validated modules for hashing.

4. **FedRAMP deadline.** All FIPS 140-2 certificates move to the NIST Historical List in **September 2026**; only 140-3 modules are accepted for new federal procurement thereafter. Drivers include FISMA, OMB Circular A-130, NIST SP 800-53 and SP 800-171.

### Prior art in this repository

**`fips_compliance` branch (2023, Amndeep Singh Mann / George Dias):**
- `--force-fips` Node startup (`cmd.sh`, `start:fips` script) and Postgres `scram-sha-256`
- `libs/common/src/crypto/crypto.ts` — PBKDF2-SHA256, 600k iterations, 32-byte salt, `useBCrypt` fallback flag
- Defects: synchronous `pbkdf2Sync` blocks the event loop; no self-describing format (iterations unrecoverable from the hash); `===` string comparison rather than `timingSafeEqual`; iterations hardcoded in two places

**Heimdall v3 (`a52f6ceb`, 2026-03-13, `mitre/heimdall` repo):**
- PBKDF2-SHA512 in `apps/backend/src/auth/password.ts`, format `pbkdf2-sha512$iterations$salt$key`
- Async `pbkdf2`, `timingSafeEqual`, env-configurable algorithm and iterations
- **Hard-rejects** non-FIPS hashes; returns a bare boolean because better-auth's `emailAndPassword.password.verify` contract requires it (`auth.ts:44-45`)

### Industry survey

Seven comparable projects were surveyed to validate the approach:

| Project | Algorithm / iterations | Migration strategy | Params in hash? |
|---|---|---|---|
| **GitLab** | PBKDF2-SHA512 @ 20,000 | Lazy rehash on sign-in | Yes |
| **Keycloak** | PBKDF2-SHA512 @ 210,000 | Lazy rehash on login (`rehashPasswordIfRequired`) | Yes |
| **Mattermost** | PBKDF2-SHA256 @ 600,000 | Lazy rehash on login (`App.migratePassword`) | Yes — PHC |
| **Django** | PBKDF2-SHA256 @ 600k–1.8M by version | Lazy rehash via `setter` callback | Yes |
| **Spring Security** | PBKDF2-SHA256 @ 310,000 | Opt-in via `UserDetailsPasswordService` | Yes — `{id}` prefix |
| **Grafana** | PBKDF2-SHA256 @ **10,000** | **None** | **No** |
| **Vault** | bcrypt, **no FIPS path** | N/A | bcrypt native |

Two conclusions drive this ADR. First, **lazy rehash-on-login is the industry standard** — five of seven implement it; it is not a novel approach. Second, **Grafana is the cautionary tale**: PBKDF2 from day one, technically FIPS-shaped, still stuck at 10,000 iterations (well below OWASP's 600,000) with no upgrade path, precisely *because* the parameters were never encoded in the stored hash. Encoding parameters is not a nicety; it is what makes the scheme maintainable.

## Decision

### 1. Replace bcrypt with PBKDF2 via `node:crypto`

**Algorithm:** PBKDF2-HMAC-SHA-512 default; `sha256` and `sha384` selectable
**Iterations:** 600,000 default, configurable, floor of 100,000 enforced
**Salt:** 32 bytes from `crypto.randomBytes()` — exceeds SP 800-132's 128-bit minimum
**Derived key:** matches digest width (64 / 48 / 32 bytes)

**Why PBKDF2:** the only NIST-approved password KDF (SP 800-132). Approved PRFs are HMAC with SHA-2 (FIPS 180-4) or SHA-3 (FIPS 202).

**Why `node:crypto`:** it delegates to OpenSSL, the FIPS-validated module on RHEL (CMVP #4985). The operation therefore runs *inside* the validated boundary, satisfying V-222571. TuxCare's guidance to federal agencies is explicit that vendors must use validated modules rather than build proprietary implementations.

**On the iteration count.** OWASP 2024 gives 210,000 for PBKDF2-SHA512 and 600,000 for SHA256. We use 600,000 for SHA512 — roughly 3× the OWASP floor and 30× GitLab's production value. This is deliberate: the cost is one-time per login (~200-400 ms, comparable to bcrypt cost 14), and the self-describing format means it can be lowered later without invalidating stored hashes.

### 2. PHC string format

```
$pbkdf2-sha512$i=600000$<b64-salt>$<b64-key>
```

This follows the [PHC string format](https://github.com/C2SP/C2SP/blob/main/phc-strings.md) (the spec moved from `P-H-C/phc-string-format` to C2SP) and matches the `phc-pbkdf2` npm implementation. Base64 uses the standard alphabet with padding stripped.

Note PHC is a rigorously-defined **subset** of Modular Crypt Format, not a superset. bcrypt's `$2b$14$...` is valid MCF but invalid PHC. That is fine — both live in the same column and are distinguished on parse.

Three reasons this beats v3's `pbkdf2-sha512$600000$salt$key`:

1. **The leading `$` unifies the namespace.** `$` appears in no base64 alphabet (standard uses `A-Za-z0-9+/=`) nor in bcrypt's radix-64, so splitting is unambiguous. Dispatch becomes a single lookup on `parts[1]` — `'2b'` versus `'pbkdf2-sha512'` — instead of two parsers for two shapes.
2. **Named parameters** (`i=600000`) are self-documenting and extensible.
3. **Argon2 slots in unchanged.** `$argon2id$v=19$m=...$...` parses with the same code the day NIST approves it.

Note there is no *registered* PHC identifier for PBKDF2 — the spec defines only the argon2 variants. Three de-facto formats exist in the wild (npm `phc-pbkdf2` uses `i=`; Mattermost uses `$pbkdf2$f=SHA256,w=600000,l=32$`; Python passlib uses bare rounds with a non-standard `ab64` alphabet). We follow `phc-pbkdf2` as the JavaScript-ecosystem convention.

### 3. Graceful migration — unconditional lazy rehash on login

`verifyPassword` dispatches on the stored format:

| Stored prefix | Path | Returns |
|---|---|---|
| `$pbkdf2-sha*$` | PBKDF2, params read from the hash | `{valid, needsRehash: false}` |
| `$2a$` / `$2b$` / `$2y$` | `bcryptjs.compare()` fallback | `{valid, needsRehash: valid}` |
| anything else | reject without throwing | `{valid: false, needsRehash: false}` |

Verification always reads parameters **from the stored hash**, never from configuration — so changing `PASSWORD_HASH_ITERATIONS` never invalidates existing hashes.

**The rehash must be unconditional in the login path.** We follow Django's model (a `setter` callback invoked inline by `check_password`) rather than Spring's (`UserDetailsPasswordService`, which must be separately wired). Spring's design **silently no-ops when unwired** — a migration that quietly does nothing is precisely the failure mode to avoid in compliance work.

Consequences:
- No forced password resets; users migrate transparently on next login
- Dormant accounts keep bcrypt hashes indefinitely — reporting query and eventual forced reset required
- `bcryptjs` stays installed until migration completes
- API keys migrate on next validation by the same mechanism

**NIST 112-bit floor:** SP 800-132's strength requirement translates to a 14-character minimum, enforced by Keycloak strict mode and Mattermost's FIPS build. Heimdall's existing **15-character** STIG default already clears this — no change needed, but it is a compliance checkpoint worth recording.

### 4. Environment variables

| Variable | Type | Default | Notes |
|---|---|---|---|
| `PASSWORD_HASH_ALGORITHM` | `sha256\|sha384\|sha512` | `sha512` | PBKDF2 digest |
| `PASSWORD_HASH_ITERATIONS` | integer ≥ 100000 | `600000` | PBKDF2 iterations |
| `FIPS_MODE` | boolean, optional | unset | Startup assertion override (see §7). Name follows GitLab's `Labkit::FIPS` convention. |

**Relationship to `libs/password-complexity`:** that library is plain JavaScript with **hardcoded, non-configurable** rules — 15-character minimum, all four character classes, no 4+ consecutive characters of one class. It has no environment variables. Password *complexity* is orthogonal to password *hashing*; this ADR does not change it, and making it configurable is out of scope.

### 5. Node.js FIPS mode

Add opt-in `--force-fips` support: a `start:fips` script, `FIPS_ENABLED` handling in `cmd.sh`, and `NODE_OPTIONS` support for the RPM systemd unit.

Facts verified against Node's `BUILDING.md`, `doc/api/cli.md`, and `src/node_options.cc`:

- **A custom Node build is not required.** BUILDING.md states plainly: *"It is not necessary to rebuild Node.js to enable support for FIPS."* Under OpenSSL 3, FIPS is a runtime-loadable provider. Stock nodejs.org binaries need `openssl fipsinstall` → `fipsmodule.cnf` plus `OPENSSL_CONF` and `OPENSSL_MODULES`; without a configured provider, startup fails.
- **Our base image needs none of that.** `Dockerfile:1` already uses `registry.access.redhat.com/ubi9/nodejs-22-minimal:1`. RHEL's Node is a `--shared-openssl` build, so it inherits FIPS from the system OpenSSL automatically. Had heimdall2 been on a Debian or Alpine `node:` image with statically-bundled OpenSSL, `--force-fips` would have been compliance theater.
- **Node never reads `/proc/sys/crypto/fips_enabled`.** Host inheritance is a property of the build, not a runtime check.
- `--enable-fips` can be undone by `crypto.setFips(false)`; `--force-fips` cannot. Under `--force-fips`, `setFips()` triggers a native `CHECK()` that **aborts the process** — it does not throw. Never call it.
- `--openssl-legacy-provider` restores MD4/RC4/DES and will **not** rescue a genuine FIPS denial; its interaction with FIPS mode is undocumented.

When debugging, do not conflate the two error families: `ERR_OSSL_EVP_UNSUPPORTED` is an OpenSSL 3 legacy-provider problem, *not* FIPS; `EVP_DigestInit_ex:disabled for FIPS` is a real denial.

### 6. Dependency audit for incidental non-approved hashing

MD5 and SHA-1 commonly appear in *non-security* roles — ETags, cache keys, checksums, fingerprints — and still fail under FIPS. GitLab hit this repeatedly (S3 content-MD5, SSH fingerprints, Maven/Gradle checksums). Python solved its equivalent with `usedforsecurity=False`; **Node has no such escape hatch**, so offending calls must be replaced outright.

Audit results for heimdall2:

| Component | Status |
|---|---|
| `apps/backend/src`, `apps/backend/config`, `libs/common`, `libs/password-complexity` | **Clean** — no `md5`/`sha1`/`createHash` |
| `uuid` | **Safe** — only `v4` (random) is used; `v3`/`v5` would use MD5/SHA-1 |
| `@aws-sdk/*` | **Not in the backend** — S3/STS are browser-side (`apps/frontend`), `client-config-service` is in `libs/hdf-converters`, which the backend does not import |
| **Express ETag** | **Breaks.** We run `NestExpressApplication` (`main.ts:3`). Express generates ETags by default and the `etag` package uses MD5 ([jshttp/etag#17](https://github.com/jshttp/etag/issues/17)). Must be disabled or replaced with a SHA-256 generator. |
| **`pg` MD5 auth** | **Breaks** against Postgres configured for md5 ([node-postgres#1706](https://github.com/brianc/node-postgres/issues/1706)) — see §8 |

A runtime audit under `--force-fips` is required, since static analysis cannot see into transitive dependencies.

### 7. Startup FIPS assertion

When FIPS is expected, the application must **verify** it rather than assume it. GitLab's Workhorse shipped without the required build tag and `fips.Enabled()` returned **false with no error** — the system reported healthy while operating outside the boundary. Silent boundary bypass is the defining failure mode of FIPS work.

On boot, when `FIPS_MODE` is truthy (or `--force-fips` is set), assert `crypto.getFips() === 1` and fail fast with a clear message otherwise. `crypto.getFips()` is the only reliable runtime check.

### 8. PostgreSQL FIPS compatibility

Postgres configured for `md5` authentication breaks the `pg` driver under FIPS, because OpenSSL refuses MD5. Postgres **14+ defaults to `scram-sha-256`** and needs no change.

Scope is narrower than the 2023 branch suggests: `docker-compose.yml:3` already pins **`postgres:17`**, so the default stack is unaffected. The remaining exposure is RHEL 8 AppStream (Postgres 13) and pre-existing customer databases. This is therefore **documentation plus RPM setup detection**, not a compose change. For those deployments:

```
POSTGRES_HOST_AUTH_METHOD=scram-sha-256
POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256
```

## STIG and Compliance Mapping

| Rule | Severity | Requirement | Satisfied by |
|---|---|---|---|
| **V-222542** (ASD) | High | Passwords stored as salted iterated hash via FIPS-validated algorithm; MD5 prohibited | PBKDF2-SHA512, 600k iterations, 32-byte salt, via OpenSSL FIPS provider |
| **V-222543** (ASD) | High | Passwords transmitted only cryptographically protected | Unchanged — TLS enforced via Helmet |
| **V-222571** (ASD) | Medium | FIPS-validated modules for hashing | `crypto.pbkdf2` in-boundary; bcryptjs phased out |
| **V-222570** (ASD) | Medium | FIPS-validated modules for signing | JWT HMAC-SHA256 — already compliant |
| **V-230223** (RHEL 8) | High | System-wide FIPS crypto policy | UBI9 base + `--force-fips` + startup assertion |
| **V-258241** (RHEL 9) | High | As RHEL 8, plus SHAKE-256 | Same |

**FedRAMP:** SC-13, SC-28, IA-7. Deadline September 2026.

## Implementation Plan

### Phase 1: Core module

**Configuration split.** Only `hashPassword` needs configuration — `verifyPassword` reads its parameters from the self-describing hash. This permits pure functions with a thin injectable on top:

- `apps/backend/src/crypto/password.ts` — pure functions, options as parameters with FIPS defaults. Usable from seeders and scripts with no DI container.
- `apps/backend/src/crypto/password.service.ts` — NestJS injectable reading the existing `ConfigService`.

This avoids module-scope `AppConfig` instantiation, which would read `.env` from disk at import time and repeat a mutation pattern this codebase has deliberately moved away from.

```ts
export type PasswordHashAlgorithm = 'sha256' | 'sha384' | 'sha512';

export interface PasswordHashOptions {
  algorithm?: PasswordHashAlgorithm;  // default 'sha512'
  iterations?: number;                 // default 600000
}

export interface PasswordVerifyResult {
  valid: boolean;
  needsRehash: boolean;
}

export function hashPassword(
  password: string,
  options?: PasswordHashOptions
): Promise<string>;

export function verifyPassword(args: {
  hash: string;
  password: string;
}): Promise<PasswordVerifyResult>;
```

**Implementation landmines — each requires a test:**

1. **`crypto.timingSafeEqual` throws on length mismatch** — `RangeError` / `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH`. Guard lengths and return `false`; never let it throw. Length is not secret here (it is fixed by the stored parameters).
2. **`Buffer.from(str, 'base64')` is lenient** — it silently discards invalid characters, so a corrupt hash decodes into plausible-looking garbage. Validate by re-encoding and comparing.
3. **Parse defensively** — assert `parts[0] === ''` (leading `$`) and an exact field count. Never index blindly.
4. **Never call `crypto.setFips()`** — aborts the process under `--force-fips`.

**Tests:** format conforms to PHC; verify correct/incorrect password; unique salt per hash; iteration floor enforced; bcrypt hash verified via fallback; `needsRehash` true only for bcrypt; malformed/truncated/empty hash rejected without throwing; length-mismatch guard; base64 leniency guard; service applies env vars and defaults.

### Phase 2: Call-site migration

Seven sites, line numbers verified against `master` @ `2e1649c9e`.

**`users.service.ts`** (import line 9):

| Line | Function | Change |
|---|---|---|
| 66 | `create()` | `hash(password, 14)` → `passwordService.hash(password)` |
| 89 | `update()` | `hash(password, 14)` → `passwordService.hash(password)` |
| 126 | `remove()` | `compare()` → `verifyPassword()`; `.valid` only (account is being deleted) |

**`authn.service.ts`** (import line 7):

| Line | Function | Change |
|---|---|---|
| 53 | `validateUser()` | `compare()` → `verifyPassword()`; **rehash + save when `needsRehash`** — primary migration path |
| 75 | `validateApiKey()` | `compare(JWTSignature, ...)` → `verifyPassword()`; rehash + save `matchingKey.apiKey` |
| 208 | `testPassword()` | `compare()` → `verifyPassword()`; `.valid` only (caller sets a new hash anyway) |

**`apikey.service.ts`** (import line 3):

| Line | Function | Change |
|---|---|---|
| 43 | `create()` | `hash(JWTSignature, 14)` → `passwordService.hash(JWTSignature)` |

#### Constraint: rehash must not touch password lifecycle fields

`user.model.ts` declares `passwordChangedAt` (line 68) and `forcePasswordChange` (line 55). A transparent rehash changes only the *stored representation* — **the password itself has not changed.**

The update MUST write `encryptedPassword` only. It must NOT touch `passwordChangedAt` or `forcePasswordChange`. Writing `passwordChangedAt` would silently reset the password-expiry clock for every migrating user — a security regression introduced by a compliance fix. Required AC with a dedicated regression test.

### Phase 3: Deployment support

- `start:fips` script in `apps/backend/package.json` (`node --force-fips dist/src/main`)
- `cmd.sh`: conditional on `FIPS_ENABLED` (currently `yarn backend start` at line 5)
- Startup FIPS assertion (§7)
- Express ETag fix (§6) — disable or replace with SHA-256
- `ENVIRONMENT_VARIABLES.md`: new variables and a FIPS deployment guide, including the Postgres ≤13 note
- RPM: systemd `NODE_OPTIONS`, setup-script FIPS detection

### Phase 4: Validation

- **Migration progress query** (there is no `apps/cli` on master — only `backend` and `frontend`):
  ```sql
  SELECT count(*) FILTER (WHERE "encryptedPassword" LIKE '$2%')      AS bcrypt_remaining,
         count(*) FILTER (WHERE "encryptedPassword" LIKE '$pbkdf2-%') AS pbkdf2_migrated
  FROM "Users";
  ```
  Plus the equivalent for `ApiKeys."apiKey"`. Both belong in the deployment guide.
- Integration test: login against a PBKDF2 hash
- Integration test: bcrypt → PBKDF2 upgrade on login, asserting `passwordChangedAt` and `forcePasswordChange` unchanged
- Integration test: API key upgrades its hash on first use
- **Runtime dependency audit** — boot and exercise auth under `node --force-fips`; catches transitive MD5 that static analysis misses
- Document `bcryptjs` removal criteria (zero rows from the query above, across all deployments)

## Scope

### In scope
Core module and service; migration at all seven call sites; two new env vars; `--force-fips` support; startup FIPS assertion; Express ETag fix; Postgres documentation and RPM detection; tests and documentation.

### Explicitly NOT in scope

**1. Changing what API keys hash.** `apikey.service.ts:41` notes *"Since BCrypt has a 72 byte limit only hash the JWT signature"* — that limit is why only the signature is hashed. PBKDF2 has no such limit, making full-JWT hashing possible. **Do not change it here.** It would alter the verification contract and invalidate every existing key. Hashing the signature remains sound. Revisiting needs its own ADR and a key-rotation plan.

**2. Migrating heimdall2 to better-auth.** Heimdall2 stays on Passport + Sequelize. The better-auth migration is a large separate effort (`izw` epic) and folding it in would balloon this change.

Forward-compatibility note: v3's `verifyPassword` returns a bare boolean because better-auth's `verify` contract requires it. Heimdall2 has no such constraint, which is exactly why it can return `{valid, needsRehash}` and support graceful migration. A future better-auth adoption will need a thin adapter — it discards `needsRehash` on better-auth's call path while an outer hook performs the rehash. Flagged so that migration is not surprised; no work now.

**3. Making password complexity configurable.** `libs/password-complexity` stays hardcoded.

**4. Removing `bcryptjs`.** Required to verify legacy hashes during migration. Removal only after deployments confirm zero bcrypt hashes remain.

**5. Elastic-style `pbkdf2_stretch`.** Elasticsearch pre-hashes with SHA-512 before PBKDF2 because raw PBKDF2 over a short password can miss the FIPS strength floor. Heimdall's 15-character minimum makes this unnecessary.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Rollback breaks migrated logins** | Medium | **High** | Lazy migration is one-way — a user rehashed to PBKDF2 cannot authenticate against code that only reads bcrypt. GitLab split this across two flags precisely here, noting the *write* flag is safely reversible but the *read* flag is not; Mattermost's PR carries the same warning. **Deploy read support first, enable writes in a subsequent release.** Document that reverting past the read-support release requires password resets. |
| Silent FIPS bypass (system reports compliant, isn't) | Medium | **High** | Startup assertion on `crypto.getFips()` (§7); runtime audit under `--force-fips` |
| Transitive dependency uses MD5/SHA-1 | Medium | Medium | Express ETag already identified; Phase 4 runtime audit for the rest |
| Timing side-channel reveals migration state | Low | Low | bcrypt cost 14 and PBKDF2 600k have different latencies, so response time can leak which accounts are migrated. Django addresses this with `harden_runtime()`. Low value to an attacker (it reveals staleness, not credentials); documented, not mitigated in this phase. |
| Dormant accounts never migrate | Medium | Low | Reporting query; bcrypt remains cryptographically strong meanwhile — the gap is compliance, not security |
| Performance regression | Low | Low | PBKDF2-SHA512 @ 600k ≈ bcrypt cost 14 (~200-400 ms); async, does not block the event loop |
| API key migration disrupts service | Low | Medium | Transparent on next use |

## Alternatives Considered

**1. Argon2id.** Won the Password Hashing Competition and is OWASP's first recommendation, but is **not FIPS-approved** — no SP 800-132 revision draft exists. Keycloak made Argon2id its default in v25 and must *override* it in FIPS mode. Adopting it would fail V-222571. The PHC format lets us add it later with no parser change.

**2. Hard cutover (v3's approach).** Clean and FIPS-pure, but forces a password reset for every user. Five of the seven surveyed projects chose lazy migration instead.

**3. Keep bcrypt, add `--force-fips` only.** Compliance theater. The process would report FIPS-enabled while a non-approved algorithm runs in pure JS where neither OpenSSL nor the OS can see it. V-222571 requires the *application* to use validated modules, not merely to run on a FIPS-enabled host.

**4. Adopt an npm package instead of implementing.** No viable candidate. `@phc/pbkdf2` is the only real match — last published **2018**, repo dead since 2021, no TypeScript types, 13 stars. `pbkdf2-password` defaults to SHA-1. Everything actively maintained (`argon2`, `@node-rs/argon2`, `secure-password`) uses a non-approved KDF, and native/WASM bindings bypass OpenSSL — self-defeating. We borrow the format spec and implement roughly 80 lines against `node:crypto`.

**5. Spring-style opt-in rehash service.** Rejected: `UserDetailsPasswordService` silently no-ops when unwired. Django's inline setter fails loudly instead.

## Guiding Principle

GitLab's stated tiebreaker, adopted here: **when security and compliance cannot both be satisfied, favor security.** Nothing in this ADR requires that trade — PBKDF2 at 600,000 iterations is both compliant and strong — but it governs any future conflict.

## References

**Standards**
- [NIST SP 800-132 — Password-Based Key Derivation](https://csrc.nist.gov/pubs/sp/800/132/final)
- [NIST FIPS 180-4 — Secure Hash Standard](https://csrc.nist.gov/pubs/fips/180-4/upd1/final)
- [PHC string format (C2SP)](https://github.com/C2SP/C2SP/blob/main/phc-strings.md)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Red Hat FIPS 140-3 Security Policy (CMVP #4754)](https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/security-policies/140sp4754.pdf)

**STIGs**
- [ASD STIG V-222542](https://www.stigviewer.com/stigs/application_security_and_development/2025-02-12/finding/V-222542) · [V-222571](https://www.stigviewer.com/stigs/application_security_and_development/2025-09-09/finding/V-222571)
- [RHEL 8 STIG V-230223](https://www.stigviewer.com/stigs/red_hat_enterprise_linux_8/2024-11-25/finding/V-230223)

**Implementations surveyed**
- [GitLab FIPS development guide](https://docs.gitlab.com/development/fips_gitlab/) · [password storage](https://docs.gitlab.com/17.9/security/password_storage/) · [MR !91622](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/91622) · [epic #7939](https://gitlab.com/groups/gitlab-org/-/epics/7939)
- [Keycloak FIPS 140-2 guide](https://www.keycloak.org/server/fips)
- [Mattermost PR #33830](https://github.com/mattermost/mattermost/pull/33830)
- [Django `hashers.py`](https://github.com/django/django/blob/main/django/contrib/auth/hashers.py)
- [Spring Security password storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html)
- [`phc-pbkdf2` (npm)](https://github.com/simonepri/phc-pbkdf2)

**Known breakage**
- [jshttp/etag#17 — MD5 under FIPS](https://github.com/jshttp/etag/issues/17)
- [node-postgres#1706 — md5 auth under FIPS](https://github.com/brianc/node-postgres/issues/1706)

**In-repo prior art**
- Heimdall v3: `a52f6ceb` (`mitre/heimdall`)
- `fips_compliance` branch: `cbfa40946`, `b384fd335`, `310c24a3c`
