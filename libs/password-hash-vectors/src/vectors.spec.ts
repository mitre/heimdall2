import { pbkdf2Sync } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { buildVectors } from '../scripts/generate-vectors';
import { FORMAT_VERSION } from './format-version';
import {
  BCRYPT_DEGRADATION_VECTOR,
  KNOWN_GOOD_VECTORS,
  type KnownGoodVector,
} from './vectors';

// Standard base64 alphabet (RFC 4648 §4, i.e. +/, not base64url's -_).
const STANDARD_B64_ALPHABET
  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Decoded byte width of a no-padding base64 string: floor(len * 6 / 8).
// Arithmetic so the field-width checks need no Buffer decode.
function b64ByteWidth(field: string): number {
  return Math.floor((field.length * 3) / 4);
}

// PBKDF2 derived-key width equals the digest width (§2), exhaustive over the
// union — no dynamic object indexing.
function digestWidth(algorithm: KnownGoodVector['algorithm']): number {
  switch (algorithm) {
    case 'sha256': {
      return 32;
    }
    case 'sha384': {
      return 48;
    }
    case 'sha512': {
      return 64;
    }
    default: {
      throw new Error('unhandled algorithm');
    }
  }
}

// Every code point in the printable ASCII range space..'~'.
function isPrintableAscii(s: string): boolean {
  return [...s].every((c) => {
    const code = c.codePointAt(0) ?? 0;
    return code >= 0x20 && code <= 0x7E;
  });
}

// True iff s is non-empty and every char is in the standard base64 alphabet.
// A char-set check rather than a regex, sidestepping the /u-vs-/v flag churn.
function isStandardB64(s: string): boolean {
  return s.length > 0 && [...s].every(c => STANDARD_B64_ALPHABET.includes(c));
}

// Parse a PHC pbkdf2 hash WITHOUT the app's parser — raw string ops, so the
// re-derivation below is implementation-independent ground truth (§14).
function parsePhc(hash: string): {
  algorithm: KnownGoodVector['algorithm'];
  iterations: number;
  key: Buffer;
  salt: Buffer;
} {
  const parts = hash.split('$');
  // ['', 'pbkdf2-sha512', 'i=600000', '<b64salt>', '<b64key>']
  const algorithm = parts[1].replace('pbkdf2-', '') as KnownGoodVector['algorithm'];
  const iterations = Number(parts[2].slice(2));
  return {
    algorithm,
    iterations,
    key: Buffer.from(parts[4], 'base64'),
    salt: Buffer.from(parts[3], 'base64'),
  };
}

describe('KNOWN_GOOD_VECTORS', () => {
  it('re-derives every vector from its password via raw node:crypto pbkdf2Sync', () => {
    // THE CONTRACT: each vector's stored key must equal what pbkdf2Sync
    // produces from the vector's password and the parameters encoded in the
    // hash. Any implementation (app or CLI) that produces a different key for
    // the same inputs is non-conformant.
    for (const v of KNOWN_GOOD_VECTORS) {
      const { algorithm, iterations, key, salt } = parsePhc(v.hash);
      // The hash's encoded params must match the vector's declared params.
      expect(algorithm, `${v.label}: algorithm mismatch`).toBe(v.algorithm);
      expect(iterations, `${v.label}: iterations mismatch`).toBe(v.iterations);
      const rederived = pbkdf2Sync(
        v.password,
        salt,
        iterations,
        digestWidth(algorithm),
        algorithm,
      );
      expect(
        rederived.equals(key),
        `${v.label}: pbkdf2Sync output != stored key`,
      ).toBe(true);
    }
  });

  it('encodes every hash in exact §2 PHC form with padding-stripped standard base64', () => {
    for (const v of KNOWN_GOOD_VECTORS) {
      // $pbkdf2-<alg>$i=<n>$<b64salt>$<b64key> — 5 fields, empty first.
      const parts = v.hash.split('$');
      expect(parts, `${v.label}: not 5 fields`).toHaveLength(5);
      expect(parts[0]).toBe('');
      expect(parts[1]).toBe(`pbkdf2-${v.algorithm}`);
      expect(parts[2]).toBe(`i=${v.iterations}`);
      // Padding stripped: no '=' in salt or key.
      expect(parts[3]).not.toContain('=');
      expect(parts[4]).not.toContain('=');
      // Standard base64 alphabet (not base64url): allow +/ , reject -_ .
      expect(isStandardB64(parts[3]), `${v.label}: salt not standard b64`).toBe(
        true,
      );
      expect(isStandardB64(parts[4]), `${v.label}: key not standard b64`).toBe(
        true,
      );
      // Salt is 32 bytes; key is the digest width (arithmetic, no decode).
      expect(b64ByteWidth(parts[3])).toBe(32);
      expect(b64ByteWidth(parts[4])).toBe(digestWidth(v.algorithm));
    }
  });

  it('covers all three digests at 600,000 plus a non-default iteration count each', () => {
    for (const algorithm of ['sha256', 'sha384', 'sha512'] as const) {
      const forAlg = KNOWN_GOOD_VECTORS.filter(v => v.algorithm === algorithm);
      const iterCounts = new Set(forAlg.map(v => v.iterations));
      expect(iterCounts, `${algorithm}: missing default 600000`).toContain(
        600_000,
      );
      // At least one non-default iteration count for this digest.
      expect(
        [...iterCounts].some(n => n !== 600_000),
        `${algorithm}: no non-default iteration vector`,
      ).toBe(true);
    }
  });

  it('covers every required password class', () => {
    const passwords = KNOWN_GOOD_VECTORS.map(v => v.password);
    // 15-char minimum boundary (STIG default min length).
    expect(passwords.some(p => p.length === 15)).toBe(true);
    // 128-char maximum boundary (§6 cap).
    expect(passwords.some(p => p.length === 128)).toBe(true);
    // Multi-byte UTF-8 (a char whose byte length exceeds its code-unit length).
    expect(
      passwords.some(p => Buffer.byteLength(p, 'utf8') > p.length),
    ).toBe(true);
    // >72 characters — documents that bcrypt's 72-byte truncation is gone (§6).
    expect(passwords.some(p => p.length > 72)).toBe(true);
    // Plain ASCII — uses the module-scoped isPrintableAscii helper.
    expect(passwords.some(p => isPrintableAscii(p))).toBe(true);
  });

  it('keeps every hash within the VARCHAR(255) storage limit', () => {
    for (const v of KNOWN_GOOD_VECTORS) {
      expect(v.hash.length, `${v.label}: hash exceeds 255 chars`).toBeLessThanOrEqual(
        255,
      );
    }
  });

  it('exports a positive integer formatVersion', () => {
    expect(Number.isSafeInteger(FORMAT_VERSION)).toBe(true);
    expect(FORMAT_VERSION).toBeGreaterThanOrEqual(1);
  });

  it('is byte-for-byte reproducible from the deterministic generator', () => {
    // The committed vectors MUST equal what buildVectors() recomputes from the
    // fixed seeds + fixed salts. If a seed or the encoder changed without
    // regenerating (or a random salt slipped in), this fails.
    const regenerated = buildVectors();
    expect(regenerated).toHaveLength(KNOWN_GOOD_VECTORS.length);
    expect(regenerated).toStrictEqual(
      KNOWN_GOOD_VECTORS.map(v => ({
        algorithm: v.algorithm,
        hash: v.hash,
        iterations: v.iterations,
        label: v.label,
        password: v.password,
      })),
    );
  });
});

describe('BCRYPT_DEGRADATION_VECTOR', () => {
  it('is a PBKDF2 hash that bcryptjs.compare rejects cleanly (false, no throw)', () => {
    // §12(4): a pre-upgrade pod running the OLD verify path (bcryptjs.compare)
    // against a NEW PBKDF2 hash must get a clean false — never a throw or 500.
    expect(BCRYPT_DEGRADATION_VECTOR.hash.startsWith('$pbkdf2-')).toBe(true);
    let result: boolean | undefined;
    expect(() => {
      result = bcrypt.compareSync('any-password', BCRYPT_DEGRADATION_VECTOR.hash);
    }).not.toThrow();
    expect(result).toBe(BCRYPT_DEGRADATION_VECTOR.expectedBcryptCompare);
    expect(BCRYPT_DEGRADATION_VECTOR.expectedBcryptCompare).toBe(false);
  });
});
