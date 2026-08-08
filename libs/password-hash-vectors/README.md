# @heimdall/password-hash-vectors

The password-hash **format contract** for Heimdall, shared between the
application (`mitre/heimdall2`) and the admin CLI (`mitre/heimdall-cli`).

heimdall2 **owns** the format. Both implementations test against these vectors,
so a divergence surfaces as a build failure rather than as a break-glass tool
that writes credentials the FIPS-gated server refuses (ADR-006 §14).

## Contents

| Export             | Status                | Purpose                                                                                                                                                                                    |
| ------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MALFORMED_CORPUS` | **this card (e25.2)** | Every ADR-006 §6 input-validation trap and §3 dispatch case, as `{hash, expected, trap, note}` entries. Drives `verifyPassword`'s rejection tests (e25.7) and heimdall-cli's parity suite. |
| known-good vectors | follow-on (e25.4)     | Reproducible password→hash pairs for all three digests.                                                                                                                                    |
| `formatVersion`    | follow-on (e25.4)     | Integer stamp heimdall-cli asserts against at build time; bumped on any change to the PHC grammar, allowlist, or parameter bounds.                                                         |

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

Data and types only — no crypto, no parsing logic. Consumed in-repo and by
heimdall-cli via a pinned git ref; not published to npm.

## Test

```sh
yarn workspace @heimdall/password-hash-vectors test
```
