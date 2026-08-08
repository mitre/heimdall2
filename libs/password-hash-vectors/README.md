# @heimdall/password-hash-vectors

The password-hash **format contract** for Heimdall, shared between the
application (`mitre/heimdall2`) and the admin CLI (`mitre/heimdall-cli`).

heimdall2 **owns** the format. Both implementations test against these vectors,
so a divergence surfaces as a build failure rather than as a break-glass tool
that writes credentials the FIPS-gated server refuses (ADR-006 §14).

## Contents

| Export                      | Purpose                                                                                                                                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MALFORMED_CORPUS`          | Every ADR-006 §6 input-validation trap and §3 dispatch case, as `{hash, expected, trap, note}` entries. Drives `verifyPassword`'s rejection tests (e25.7) and heimdall-cli's parity suite.                                                                               |
| `KNOWN_GOOD_VECTORS`        | Reproducible `{password, hash, algorithm, iterations, label}` vectors covering all three digests. Each hash re-derives from its password via raw `node:crypto` `pbkdf2Sync` — implementation-independent ground truth both `hashPassword` and heimdall-cli test against. |
| `BCRYPT_DEGRADATION_VECTOR` | A PBKDF2 hash paired with `expectedBcryptCompare: false` — the §12(4) rolling-deploy assertion that a pre-upgrade pod's `bcryptjs.compare` rejects a PBKDF2 hash cleanly. Consumed by the write-gate card (e25.21).                                                      |
| `FORMAT_VERSION`            | Integer stamp both implementations assert **equality** against at build time.                                                                                                                                                                                            |

## FORMAT_VERSION — the build-time contract

`FORMAT_VERSION` is a single integer (starts at `1`). heimdall2 and heimdall-cli
each assert equality against it at build time; a mismatch is a **build failure**
(ADR-006 §14) — what stops heimdall-cli from shipping a break-glass tool that
writes a hash format the FIPS-gated server refuses.

**Bump it whenever any of these changes:** the PHC grammar
(`$pbkdf2-<alg>$i=<n>$<b64-salt>$<b64-key>`), the algorithm allowlist
(sha256 | sha384 | sha512), or the parameter bounds (iteration floor/ceiling,
salt/key widths). It is a plain stamp, not a semver — §14 specifies equality.

## Regenerating the known-good vectors

`KNOWN_GOOD_VECTORS` is generated, never hand-edited:

```sh
yarn workspace @heimdall/password-hash-vectors gen:vectors
```

`scripts/generate-vectors.ts` is a pure module (safe to import); the script
above renders it to `src/vectors.ts`.

The generator uses raw `node:crypto` (never the app's `hashPassword` — circular)
and **fixed salts** (never `crypto.randomBytes`), so regeneration is byte-for-byte
identical. The spec asserts `buildVectors()` equals the committed vectors, so an
un-regenerated seed change fails the build.

### PHC encoding, per the [C2SP phc-strings spec](https://github.com/C2SP/C2SP/blob/main/phc-strings.md)

- **Standard base64**, not base64url (alphabet `+/`, not `-_`).
- **Padding stripped** from both salt and key (`=` removed).
- Salt is 32 bytes; key width equals the digest width (32 / 48 / 64 bytes for
  sha256 / sha384 / sha512).

This matches the reference [`@phc/pbkdf2`](https://github.com/simonepri/phc-pbkdf2)
/ [`@phc/format`](https://www.npmjs.com/package/@phc/format), which represent
salt and hash as Node `Buffer`s. Base64 uses `Buffer` (not the newer
`Uint8Array.fromBase64`/`toBase64`): that TC39 API is Stage 4 but **undefined at
our Node runtime** (verified), so `Buffer` is the only working encoder. ESLint's
`unicorn/prefer-uint8array-base64` flags this — a config-ahead-of-runtime false
preference; migrate when Node ships the API.

## The corpus is executable documentation

Each entry's `note` cites the specific §6 rule it exercises — the parser traps
that are invisible until you hit them:

- `parseInt('6e5') === 6` — a forged hash would verify at 6 iterations
- `$pbkdf2-sha*` prefix-matching accepts `md5`/`sha1` — algorithm-confusion downgrade
- `Buffer.from('AA@@AA','base64')` silently drops `@@` — lenient base64
- a `sha512` hash carrying a 32-byte key would verify a downgraded artifact

`expected` is what a correct `verifyPassword` must produce: `reject` (return
`{valid:false}` without throwing), `bcrypt`/`pbkdf2` (well-formed — dispatch,
don't reject), or `sentinel` (the §3 cutover-invalidation marker).

## Scope

Runtime exports are data and types. The vector generator uses raw `node:crypto`,
but that is a build-time script, not a runtime dependency. Consumed in-repo and
by heimdall-cli via a pinned git ref; not published to npm.

## Test

```sh
yarn workspace @heimdall/password-hash-vectors test
```
