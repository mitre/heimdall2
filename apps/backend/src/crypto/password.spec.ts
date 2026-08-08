import { KNOWN_GOOD_VECTORS } from '@heimdall/password-hash-vectors';
import { describe, expect, it } from 'vitest';
import {
  hashPassword,
  hashPasswordWithSalt,
  PasswordHashError,
} from './password';

type Algorithm = 'sha256' | 'sha384' | 'sha512';

// Decoded byte width of a no-padding base64 string: floor(len * 6 / 8).
// Arithmetic so the width checks need no Buffer decode.
function b64ByteWidth(field: string): number {
  return Math.floor((field.length * 3) / 4);
}

// PBKDF2 derived-key width = digest width (§2), exhaustive, no dynamic index.
function digestWidth(algorithm: Algorithm): number {
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

// Decode a vector's salt straight out of its PHC hash so we can inject it —
// the vectors are the implementation-independent ground truth (ADR §14).
function saltOf(hash: string): Buffer {
  return Buffer.from(hash.split('$', 4)[3], 'base64');
}

describe('hashPasswordWithSalt', () => {
  it('reproduces every known-good vector when given the vector salt', async () => {
    // THE CONTRACT: hashing a vector's password with its salt/algorithm/
    // iterations must reproduce the vector's hash byte-for-byte. This proves
    // the encoder matches the ground truth, not itself.
    for (const v of KNOWN_GOOD_VECTORS) {
      const produced = await hashPasswordWithSalt(v.password, saltOf(v.hash), {
        algorithm: v.algorithm,
        iterations: v.iterations,
      });
      expect(produced).toBe(v.hash);
    }
  });

  it('emits standard base64 with padding stripped in both salt and key', async () => {
    const hash = await hashPasswordWithSalt('CorrectHorse15!x', Buffer.alloc(32, 7));
    const parts = hash.split('$');
    expect(parts).toHaveLength(5);
    expect(parts[0]).toBe('');
    expect(parts[3]).not.toContain('=');
    expect(parts[4]).not.toContain('=');
    // Standard alphabet (+/), never base64url (-_).
    expect(parts[3].includes('-') || parts[3].includes('_')).toBe(false);
    expect(parts[4].includes('-') || parts[4].includes('_')).toBe(false);
  });

  it('keeps every digest output within VARCHAR(255)', async () => {
    for (const algorithm of ['sha256', 'sha384', 'sha512'] as const) {
      const hash = await hashPasswordWithSalt('CorrectHorse15!x', Buffer.alloc(32, 1), { algorithm });
      expect(hash.length).toBeLessThanOrEqual(255);
      // Key width (arithmetic, no decode) must equal the digest width.
      expect(b64ByteWidth(hash.split('$', 5)[4])).toBe(digestWidth(algorithm));
    }
  });
});

describe('hashPassword (production path)', () => {
  it('defaults to sha512 / 600000 / a 32-byte random salt', async () => {
    const hash = await hashPassword('CorrectHorse15!x');
    const parts = hash.split('$');
    expect(parts[1]).toBe('pbkdf2-sha512');
    expect(parts[2]).toBe('i=600000');
    expect(b64ByteWidth(parts[3])).toBe(32);
    expect(b64ByteWidth(parts[4])).toBe(64);
  });

  it('produces a different salt (and hash) on each call', async () => {
    const a = await hashPassword('CorrectHorse15!x');
    const b = await hashPassword('CorrectHorse15!x');
    expect(a).not.toBe(b);
  });

  it('honours algorithm and iteration options', async () => {
    const hash = await hashPassword('CorrectHorse15!x', {
      algorithm: 'sha256',
      iterations: 200_000,
    });
    expect(hash.startsWith('$pbkdf2-sha256$i=200000$')).toBe(true);
  });
});

describe('validation (§6/§9) — throws typed errors, never clamps', () => {
  it('rejects a non-string password', async () => {
    // Runtime guard: the seeder is CommonJS JS, so a non-string can arrive.
    await expect(
      hashPassword(42 as unknown as string),
    ).rejects.toBeInstanceOf(PasswordHashError);
  });

  it('rejects an empty password', async () => {
    await expect(hashPassword('')).rejects.toBeInstanceOf(PasswordHashError);
  });

  it('rejects a password longer than 128 characters', async () => {
    await expect(
      hashPassword('a'.repeat(129)),
    ).rejects.toBeInstanceOf(PasswordHashError);
    // 128 exactly is allowed.
    await expect(hashPassword('a'.repeat(128))).resolves.toContain('$pbkdf2-');
  });

  it('rejects an algorithm outside the strict allowlist', async () => {
    await expect(
      hashPassword('CorrectHorse15!x', { algorithm: 'md5' as unknown as 'sha512' }),
    ).rejects.toBeInstanceOf(PasswordHashError);
  });

  it('rejects iterations below 100000 and above 10000000', async () => {
    await expect(
      hashPassword('CorrectHorse15!x', { iterations: 99_999 }),
    ).rejects.toBeInstanceOf(PasswordHashError);
    await expect(
      hashPassword('CorrectHorse15!x', { iterations: 10_000_001 }),
    ).rejects.toBeInstanceOf(PasswordHashError);
    // The boundaries themselves are allowed.
    await expect(
      hashPassword('CorrectHorse15!x', { iterations: 100_000 }),
    ).resolves.toContain('$pbkdf2-');
    await expect(
      hashPassword('CorrectHorse15!x', { iterations: 10_000_000 }),
    ).resolves.toContain('$pbkdf2-');
  }, 60_000);

  it('rejects a non-integer iteration count', async () => {
    await expect(
      hashPassword('CorrectHorse15!x', { iterations: 600_000.5 }),
    ).rejects.toBeInstanceOf(PasswordHashError);
  });
});
