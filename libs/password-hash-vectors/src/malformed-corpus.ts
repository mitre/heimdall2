/**
 * Malformed-hash corpus — the shared ammunition for verifyPassword's input
 * validation (ADR-006 §6) and the §3 dispatch table.
 *
 * Each entry is a hash string (or, in one deliberate case, a non-string) paired
 * with the outcome a correct verifyPassword MUST produce, and a `trap` label
 * naming the §6 rule it exercises. heimdall2's verifyPassword (e25.7) and
 * heimdall-cli's parity suite both run against this corpus; a divergence is a
 * contract violation.
 *
 * This module is DATA ONLY — no crypto, no parsing logic. The known-good
 * password→hash vectors and the formatVersion stamp land in the follow-on
 * card (e25.4).
 *
 * Expected outcomes:
 *   'reject'   — verifyPassword returns {valid:false} WITHOUT throwing (§6)
 *   'bcrypt'   — a well-formed bcrypt hash; §3 dispatches to the bcrypt path
 *                (FIPS-off) or refuses (FIPS-on). NOT a malformed reject.
 *   'pbkdf2'   — a well-formed PBKDF2/PHC hash; §3 dispatches to the pbkdf2 path
 *   'sentinel' — the cutover-invalidation sentinel (§3): unproducible by
 *                hashPassword, rejected on the unknown-format path
 */
export type MalformedExpected = 'bcrypt' | 'pbkdf2' | 'reject' | 'sentinel';

export type MalformedVector = {
  readonly expected: MalformedExpected;
  /** The stored value fed to verifyPassword. Non-string only for 'non-string'. */
  readonly hash: unknown;
  readonly note: string;
  /** Names the §6 rule (or §3 dispatch case) this entry exercises. */
  readonly trap: string;
};

// A valid-looking 32-byte base64 salt and a 64-byte (sha512-width) base64 key,
// padding stripped per PHC — reused to build hashes that are well-formed
// EXCEPT for the one field each entry is probing.
//
// Both MUST be CANONICAL base64: 'A' is byte value 0, so any run of 'A's
// re-encodes to itself. 'B' (value 1) does NOT — 'B'.repeat(86) round-trips to
// '...BA', which fails §6 item 6 (decode/re-encode/compare) and would mask the
// item-7 (key/salt length) entries by rejecting them a step early. Verified.
const B64_SALT_32 = 'A'.repeat(43); // 32 bytes → 43 b64 chars, canonical
const B64_KEY_64 = 'A'.repeat(86); // 64 bytes → 86 b64 chars, canonical

export const MALFORMED_CORPUS: readonly MalformedVector[] = [
  // §6 step 1 — reject non-string / empty. ''.split('$') is [''] so the
  // parts[0]==='' check alone passes for the empty string; the field-count
  // check (step 2) is what catches it. These are AND, not alternatives.
  {
    expected: 'reject',
    hash: '',
    note: "''.split('$') === [''] — parts[0]==='' passes; field count catches it",
    trap: 'empty-string',
  },
  {
    expected: 'reject',
    hash: 12_345,
    note: 'non-string input rejected before any parsing',
    trap: 'non-string',
  },

  // §6 step 2 — split('$') must yield EXACTLY 5 parts.
  {
    expected: 'reject',
    hash: `$pbkdf2-sha512$i=600000$${B64_SALT_32}`,
    note: '4 fields (missing key) — not exactly 5',
    trap: 'four-field',
  },
  {
    expected: 'reject',
    hash: `$pbkdf2-sha512$i=600000$${B64_SALT_32}$${B64_KEY_64}$extra`,
    note: '6 fields (trailing segment) — not exactly 5',
    trap: 'six-field',
  },
  {
    expected: 'reject',
    // 5 fields (correct count) but parts[0] is 'x' not '' — isolates the
    // parts[0]==='' arm of §6 item 2, which a field-count-only check misses.
    hash: `x$pbkdf2-sha512$i=600000$${B64_SALT_32}$${B64_KEY_64}`,
    note: "leading char before $ — parts[0] !== '' though field count is 5 (§2: leading $ is load-bearing)",
    trap: 'parts0-nonempty',
  },

  // §6 step 3 — STRICT allowlist over the FULL identifier. crypto.pbkdf2
  // accepts 'md5' and 'sha1', so prefix-matching $pbkdf2-sha* would verify a
  // downgraded digest. Allowlisting only the digest still admits the
  // naive-split confusion below.
  {
    expected: 'reject',
    hash: `$pbkdf2-md5$i=600000$${B64_SALT_32}$${'B'.repeat(22)}`,
    note: 'algorithm confusion: $pbkdf2-md5$ — MD5 banned; strict allowlist rejects',
    trap: 'algo-md5',
  },
  {
    expected: 'reject',
    hash: `$pbkdf2-sha1$i=600000$${B64_SALT_32}$${'B'.repeat(27)}`,
    note: 'algorithm confusion: $pbkdf2-sha1$ — SHA-1 not in the allowlist',
    trap: 'algo-sha1',
  },
  {
    expected: 'reject',
    hash: `$pbkdf2-sha512-md5$i=600000$${B64_SALT_32}$${B64_KEY_64}`,
    note: 'naive split on last dash would read digest as md5; full-identifier allowlist rejects',
    trap: 'algo-sha512-md5-naive-split',
  },

  // §6 step 4 — iterations by regex /^i=([1-9][0-9]{0,8})$/ ONLY.
  {
    expected: 'reject',
    hash: `$pbkdf2-sha512$i=6e5$${B64_SALT_32}$${B64_KEY_64}`,
    note: "parseInt('6e5') === 6 — a 100,000x downgrade that looks well-formed; regex rejects",
    trap: 'iter-6e5',
  },
  {
    expected: 'reject',
    hash: `$pbkdf2-sha512$i=600000abc$${B64_SALT_32}$${B64_KEY_64}`,
    note: "parseInt('600000abc') === 600000 — trailing garbage; regex rejects",
    trap: 'iter-600000abc',
  },
  {
    expected: 'reject',
    hash: `$pbkdf2-sha512$i=0x10000$${B64_SALT_32}$${B64_KEY_64}`,
    note: "Number('0x10000') === 65536 — hex literal; regex (decimal only) rejects",
    trap: 'iter-0x10000',
  },
  {
    expected: 'reject',
    hash: `$pbkdf2-sha512$i=0$${B64_SALT_32}$${B64_KEY_64}`,
    note: 'i=0 — leading-zero / below the module minimum (1000); regex requires [1-9] start',
    trap: 'iter-zero',
  },
  {
    expected: 'reject',
    // 8 digits — PASSES the item-4 regex, so it actually reaches item 5's
    // upper bound (unlike a 10-digit value, which item 4's 9-digit cap
    // rejects first and would never test the DoS guard).
    hash: `$pbkdf2-sha512$i=20000000$${B64_SALT_32}$${B64_KEY_64}`,
    note: 'i=20,000,000 passes the item-4 regex but exceeds the 10,000,000 upper bound — DoS guard (§6 step 5)',
    trap: 'iter-over-max',
  },

  // §6 step 6 — decode, re-encode, compare. Buffer.from is lenient:
  // 'AA@@AA' and 'A A A A' decode to the same bytes as 'AAAA'. A hash whose
  // salt/key round-trips to a different string is malformed.
  {
    expected: 'reject',
    hash: `$pbkdf2-sha512$i=600000$AA@@${'A'.repeat(39)}$${B64_KEY_64}`,
    note: "Buffer.from('AA@@AA','base64') drops '@@' — salt does not re-encode to itself",
    trap: 'lenient-base64-at',
  },
  {
    expected: 'reject',
    hash: `$pbkdf2-sha512$i=600000$A A ${'A'.repeat(39)}$${B64_KEY_64}`,
    note: 'Buffer.from ignores spaces — salt does not re-encode to itself',
    trap: 'lenient-base64-space',
  },

  // §6 step 7 — key length must equal digest width; salt ≥16 bytes, BOTH
  // checked BEFORE pbkdf2 is called (keylen=0 throws an untyped error).
  {
    expected: 'reject',
    // Canonical 32-byte key ('A'.repeat(43)) under a sha512 (64-byte) header:
    // passes item 6's re-encode check, so item 7's length assert is what must
    // catch it. A non-canonical key here would be masked by item 6.
    hash: `$pbkdf2-sha512$i=600000$${B64_SALT_32}$${'A'.repeat(43)}`,
    note: 'sha512 hash carrying a canonical 32-byte key — item 7 must reject; would silently verify a downgraded artifact otherwise',
    trap: 'key-length-mismatch',
  },
  {
    expected: 'reject',
    hash: `$pbkdf2-sha512$i=600000$${'A'.repeat(20)}$${B64_KEY_64}`,
    note: '15-byte salt (< 16 minimum) — reject before pbkdf2',
    trap: 'salt-too-short',
  },

  // §3 dispatch fixtures — well-formed bcrypt hashes. NOT malformed rejects:
  // verifyPassword dispatches (bcrypt path when FIPS off, refuse when FIPS on).
  {
    expected: 'bcrypt',
    hash: '$2a$14$abcdefghijklmnopqrstuuX0Xz3wF9Yt7q0kz0kz0kz0kz0kz0kz0',
    note: '$2a$ prefix — legacy bcrypt; §3 dispatches, does not reject',
    trap: 'bcrypt-2a',
  },
  {
    expected: 'bcrypt',
    hash: '$2b$14$abcdefghijklmnopqrstuuX0Xz3wF9Yt7q0kz0kz0kz0kz0kz0kz0',
    note: '$2b$ prefix — current bcryptjs output; §3 dispatches',
    trap: 'bcrypt-2b',
  },
  {
    expected: 'bcrypt',
    hash: '$2y$14$abcdefghijklmnopqrstuuX0Xz3wF9Yt7q0kz0kz0kz0kz0kz0kz0',
    note: '$2y$ prefix — crypt(3) variant; §3 dispatches',
    trap: 'bcrypt-2y',
  },

  // §3 cutover sentinel — an unusable value hashPassword cannot produce.
  // verifyPassword rejects it on the unknown-format path with no new branch.
  {
    expected: 'sentinel',
    hash: 'INVALIDATED-BY-FIPS-CUTOVER-DO-NOT-USE',
    note: 'cutover-invalidation sentinel (§3) — unknown format, rejected without a dedicated branch',
    trap: 'sentinel',
  },
] as const;
