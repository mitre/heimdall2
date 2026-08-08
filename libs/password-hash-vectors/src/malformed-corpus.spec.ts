import { describe, expect, it } from 'vitest';
import { MALFORMED_CORPUS, type MalformedVector } from './malformed-corpus';

// Every §6 trap class (ADR-006 §6 "Input validation — exact sequence", plus
// the §3 dispatch prefixes and sentinel). The corpus is the shared ammunition
// for e25.7's verifyPassword tests and for heimdall-cli's parity suite, so
// coverage of each class is the contract, asserted here.
const REQUIRED_TRAPS = [
  'empty-string',
  'non-string',
  'four-field',
  'six-field',
  'parts0-nonempty',
  'algo-md5',
  'algo-sha1',
  'algo-sha512-md5-naive-split',
  'iter-6e5',
  'iter-600000abc',
  'iter-0x10000',
  'iter-zero',
  'iter-over-max',
  'lenient-base64-at',
  'lenient-base64-space',
  'key-length-mismatch',
  'salt-too-short',
  'bcrypt-2a',
  'bcrypt-2b',
  'bcrypt-2y',
  'sentinel',
] as const;

const B64_ALPHABET
  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Decoded byte width of a no-padding base64 string: floor(len * 6 / 8).
function b64ByteWidth(field: string): number {
  return Math.floor((field.length * 3) / 4);
}

function fieldsOf(hash: string): string[] {
  return hash.split('$');
}

// A no-padding base64 string is canonical iff its trailing bits are zero:
// length%4===2 → the last char's low 4 bits must be 0; length%4===3 → low 2
// bits must be 0; length%4===0 → always canonical. 'A' (value 0) always is;
// 'B' (value 1) is NOT at those remainders — exactly the masking bug this
// pins against (§6 item 6 rejects a non-canonical field before item 7 runs).
// Computed arithmetically so the check needs neither Buffer nor a regex.
function isCanonicalB64(field: string): boolean {
  const rem = field.length % 4;
  if (rem === 0) {
    return true;
  }
  if (rem === 1) {
    return false; // not a valid base64 length
  }
  const lastValue = B64_ALPHABET.indexOf(field.at(-1) ?? '');
  if (lastValue === -1) {
    return false;
  }
  const modulus = rem === 2 ? 16 : 4;
  return lastValue % modulus === 0;
}

describe('MALFORMED_CORPUS', () => {
  it('contains an entry for every §6 trap class', () => {
    const traps = new Set(MALFORMED_CORPUS.map(v => v.trap));
    for (const required of REQUIRED_TRAPS) {
      expect(traps, `missing corpus entry for trap "${required}"`).toContain(
        required,
      );
    }
  });

  it('types every entry with an expected outcome and a trap label', () => {
    const outcomes = new Set<MalformedVector['expected']>([
      'bcrypt',
      'pbkdf2',
      'reject',
      'sentinel',
    ]);
    for (const v of MALFORMED_CORPUS) {
      expect(typeof v.trap, `trap not a string: ${JSON.stringify(v)}`).toBe(
        'string',
      );
      expect(outcomes, `bad expected for ${v.trap}`).toContain(v.expected);
    }
  });

  it('gives every entry a string hash except the deliberate non-string probe', () => {
    const stringHashes = MALFORMED_CORPUS.filter(
      v => v.trap !== 'non-string',
    );
    const nonStringHashes = MALFORMED_CORPUS.filter(
      v => v.trap === 'non-string',
    );
    expect(stringHashes.every(v => typeof v.hash === 'string')).toBe(true);
    // The 'non-string' entry exists precisely to exercise §6 step 1's
    // reject-non-string branch, so its hash must NOT be a string.
    expect(nonStringHashes).toHaveLength(1);
    expect(typeof nonStringHashes[0].hash).not.toBe('string');
  });

  it('marks the three bcrypt prefixes as dispatch fixtures, not rejects', () => {
    for (const trap of ['bcrypt-2a', 'bcrypt-2b', 'bcrypt-2y'] as const) {
      const entry = MALFORMED_CORPUS.find(v => v.trap === trap);
      expect(entry, `no entry for ${trap}`).toBeDefined();
      // These are well-formed bcrypt hashes — verifyPassword dispatches on
      // them (§3), it does not reject them as malformed.
      expect(entry?.expected).toBe('bcrypt');
    }
  });

  // The §6 item-7 entries (key/salt LENGTH) only exercise item 7 if they
  // survive item 6 (decode → re-encode → compare). A non-canonical base64
  // field would be rejected at item 6 first, silently masking item 7 — so
  // pin canonicality + intended byte width here, at the corpus's own layer.
  it('gives the item-7 entries canonical base64 fields so item 6 does not mask them', () => {
    // key-length-mismatch: $pbkdf2-sha512$i=..$salt$key → salt=[3], key=[4]
    const keyLength = MALFORMED_CORPUS.find(
      v => v.trap === 'key-length-mismatch',
    );
    const klFields = fieldsOf(keyLength?.hash as string);
    // Pin the DECLARED digest too: without this, changing the header to
    // pbkdf2-sha256 would make the 32-byte key a valid width and turn this
    // into a well-formed hash still labelled 'reject' (the D1/D2 class).
    expect(klFields[1]).toBe('pbkdf2-sha512');
    expect(isCanonicalB64(klFields[3]), 'key-length salt not canonical').toBe(
      true,
    );
    expect(isCanonicalB64(klFields[4]), 'key-length key not canonical').toBe(
      true,
    );
    // sha512 declared (64-byte width), but the key is 32 bytes — the mismatch.
    expect(b64ByteWidth(klFields[4])).toBe(32);

    const saltShort = MALFORMED_CORPUS.find(v => v.trap === 'salt-too-short');
    const ssFields = fieldsOf(saltShort?.hash as string);
    expect(isCanonicalB64(ssFields[3]), 'salt-too-short salt not canonical').toBe(
      true,
    );
    expect(isCanonicalB64(ssFields[4]), 'salt-too-short key not canonical').toBe(
      true,
    );
    // salt is 15 bytes — below the 16-byte minimum (§6 item 7).
    expect(b64ByteWidth(ssFields[3])).toBeLessThan(16);
  });

  it('gives iter-over-max a value that passes the item-4 pattern but exceeds the item-5 bound', () => {
    const entry = MALFORMED_CORPUS.find(v => v.trap === 'iter-over-max');
    const iterField = fieldsOf(entry?.hash as string)[2]; // 'i=NNNN'
    expect(iterField.startsWith('i=')).toBe(true);
    const digits = iterField.slice(2);
    // Characterizes item-4's /^i=[1-9][0-9]{0,8}$/ without a regex literal:
    // 1–9 digits, no leading zero, all decimal.
    expect(digits.length).toBeGreaterThanOrEqual(1);
    expect(digits.length).toBeLessThanOrEqual(9);
    expect(digits.startsWith('0')).toBe(false);
    expect([...digits].every(c => c >= '0' && c <= '9')).toBe(true);
    // …yet the value is above the item-5 DoS bound.
    expect(Number(digits)).toBeGreaterThan(10_000_000);
  });

  it('gives parts0-nonempty a 5-field hash with a non-empty first field', () => {
    const entry = MALFORMED_CORPUS.find(v => v.trap === 'parts0-nonempty');
    const fields = fieldsOf(entry?.hash as string);
    expect(fields).toHaveLength(5); // NOT caught by the field-count arm
    expect(fields[0]).not.toBe(''); // caught only by the parts[0] arm
  });

  it('classifies every algorithm-confusion and iteration trap as reject', () => {
    const rejectTraps = [
      'algo-md5',
      'algo-sha1',
      'algo-sha512-md5-naive-split',
      'iter-6e5',
      'iter-600000abc',
      'iter-0x10000',
      'iter-zero',
      'iter-over-max',
      'key-length-mismatch',
      'salt-too-short',
    ];
    for (const trap of rejectTraps) {
      const entry = MALFORMED_CORPUS.find(v => v.trap === trap);
      expect(entry?.expected, `${trap} should be reject`).toBe('reject');
    }
  });
});
