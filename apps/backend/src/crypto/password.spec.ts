import * as nodeCrypto from 'node:crypto';
import {
  KNOWN_GOOD_VECTORS,
  MALFORMED_CORPUS,
} from '@heimdall/password-hash-vectors';
import * as bcryptjs from 'bcryptjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  configureKdfLimiter,
  hashPassword,
  hashPasswordWithSalt,
  kdfLimiterState,
  KdfOverloadedError,
  PasswordHashError,
  verifyPassword,
} from './password';

// Wrap compare in a pass-through spy so tests can assert INVOCATION and
// NON-invocation of the real module (§5: a return-value assertion alone would
// pass an implementation that calls compare() and discards the result — the
// exact V-222571 finding). vi.mock intercepts the lazy dynamic import in
// password.ts too; the FIPS-off positive control proves the interception is
// live, so the non-invocation assertion cannot pass vacuously.
vi.mock('bcryptjs', async (importOriginal) => {
  const actual = await importOriginal<typeof bcryptjs>();
  return { ...actual, compare: vi.fn(actual.compare) };
});

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

// Build a PHC hash with RAW node:crypto, bypassing hashPassword's §9 hashing
// floors — the only way to produce the legacy-parameter hashes (50k, 1000
// iterations; >128-char passwords) that verifyPassword must still accept.
// Buffer base64, not Uint8Array#toBase64 — that TC39 API is undefined at our
// Node runtime (see toB64 in password.ts).
function rawPhc(
  password: string,
  salt: Buffer,
  iterations: number,
  algorithm: Algorithm,
): string {
  const key = nodeCrypto.pbkdf2Sync(
    password,
    salt,
    iterations,
    digestWidth(algorithm),
    algorithm,
  );
  const b64 = (buffer: Buffer) => buffer.toString('base64').replaceAll('=', '');
  return `$pbkdf2-${algorithm}$i=${iterations}$${b64(salt)}$${b64(key)}`;
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

describe('verifyPassword — §3 dispatch × FIPS gate', () => {
  it('refuses a bcrypt hash under FIPS without ever invoking bcryptjs.compare', async () => {
    // §5: the spy IS the point. An implementation that calls compare() and
    // discards the result generates a bcrypt hash outside the validated
    // module — the V-222571 finding — while passing a return-value check.
    vi.mocked(bcryptjs.compare).mockClear();
    const result = await verifyPassword({
      getFips: () => 1,
      hash: '$2b$14$abcdefghijklmnopqrstuuX0Xz3wF9Yt7q0kz0kz0kz0kz0kz0kz0',
      password: 'CorrectHorse15!x',
    });
    expect(result).toEqual({
      needsRehash: false,
      requiresReset: true,
      valid: false,
    });
    expect(bcryptjs.compare).not.toHaveBeenCalled();
  });

  it('verifies every known-good vector in BOTH FIPS states with needsRehash:false', async () => {
    // §3 row 1: the pbkdf2 path is identical whether FIPS is on or off.
    for (const v of KNOWN_GOOD_VECTORS) {
      for (const fips of [0, 1]) {
        const result = await verifyPassword({
          getFips: () => fips,
          hash: v.hash,
          password: v.password,
        });
        expect(result, `${v.label} fips=${fips}`).toEqual({
          needsRehash: false,
          valid: true,
        });
      }
    }
  });

  it('rejects every vector when the last key character is perturbed', async () => {
    // 'A' (0) and 'Q' (16) both have zero trailing bits at every digest
    // width, so the perturbed hash stays CANONICAL base64 — it passes the
    // §6 step-6 re-encode check and step-7 lengths, reaching the real KDF
    // comparison. This pins the timingSafeEqual mismatch path, not an
    // earlier malformed-input rejection.
    for (const v of KNOWN_GOOD_VECTORS) {
      const perturbed
        = v.hash.slice(0, -1) + (v.hash.endsWith('A') ? 'Q' : 'A');
      const result = await verifyPassword({
        getFips: () => 0,
        hash: perturbed,
        password: v.password,
      });
      expect(result, `perturbed ${v.label}`).toEqual({
        needsRehash: false,
        valid: false,
      });
    }
  });
});

describe('verifyPassword — §6 validation against the malformed corpus', () => {
  it('rejects the ENTIRE corpus of reject/sentinel entries without throwing', async () => {
    const rejects = MALFORMED_CORPUS.filter(
      entry => entry.expected === 'reject' || entry.expected === 'sentinel',
    );
    // Pin the count so a silently shrunk corpus (or a broken filter) fails
    // loudly instead of vacuously passing on an empty table.
    expect(rejects).toHaveLength(18);
    // One FIPS state suffices: getFips is unreachable on every reject path
    // (only the bcrypt branch consults it — covered both-states in the
    // dispatch tests), and each rejection burns a full-cost constant-work
    // dummy, so doubling the loop doubles ~5s of KDF time for zero coverage.
    // fips=1 is the deployment-relevant state; the timing and non-string
    // tests exercise reject paths at fips=0.
    for (const entry of rejects) {
      const result = await verifyPassword({
        getFips: () => 1,
        // The corpus's one non-string entry deliberately violates the
        // signature — §6 step 1 is a runtime guard for the CommonJS seeder.
        hash: entry.hash as string,
        password: 'CorrectHorse15!x',
      });
      expect(result, `corpus trap: ${entry.trap}`).toEqual({
        needsRehash: false,
        valid: false,
      });
    }
  }, 15_000);

  it('rejects a non-string password without throwing', async () => {
    const result = await verifyPassword({
      getFips: () => 0,
      hash: KNOWN_GOOD_VECTORS[0].hash,
      password: 42 as unknown as string,
    });
    expect(result).toEqual({ needsRehash: false, valid: false });
  });
});

describe('verifyPassword — constant-work rejection (Risks: timing side-channel)', () => {
  it('burns KDF-equivalent work on the unknown-format and FIPS-refuse paths', async () => {
    // Timing IS the requirement, so the assertion is temporal: a reject must
    // cost at least a quarter of a real default-parameter verification.
    // Correct code runs the SAME 600k-iteration KDF on both sides (~1x), so
    // the 4x margin cannot flake; pre-fix rejects are ~1000x faster and fail.
    const vector = KNOWN_GOOD_VECTORS[0]; // sha512 @ 600k — default params
    const realStart = performance.now();
    await verifyPassword({
      getFips: () => 0,
      hash: vector.hash,
      password: vector.password,
    });
    const realDuration = performance.now() - realStart;

    const sentinelStart = performance.now();
    const sentinel = await verifyPassword({
      getFips: () => 0,
      hash: 'INVALIDATED-BY-FIPS-CUTOVER-DO-NOT-USE',
      password: vector.password,
    });
    const sentinelDuration = performance.now() - sentinelStart;

    const refuseStart = performance.now();
    const refused = await verifyPassword({
      getFips: () => 1,
      hash: '$2b$14$abcdefghijklmnopqrstuuX0Xz3wF9Yt7q0kz0kz0kz0kz0kz0kz0',
      password: vector.password,
    });
    const refuseDuration = performance.now() - refuseStart;

    expect(sentinel).toEqual({ needsRehash: false, valid: false });
    expect(refused).toEqual({
      needsRehash: false,
      requiresReset: true,
      valid: false,
    });
    expect(sentinelDuration).toBeGreaterThan(realDuration / 4);
    expect(refuseDuration).toBeGreaterThan(realDuration / 4);
  });
});

describe('verifyPassword — §9 verify has no policy floor and no length cap', () => {
  it('verifies a 50k-iteration hash of a 200-char password — legacy config params must not lock users out', async () => {
    // §9: a user hashed under an earlier PASSWORD_HASH_ITERATIONS=50000 (below
    // the 100k HASHING floor) must still verify, and PASSWORD_MAX_LENGTH
    // applies to hashing only — capping on verify would lock out any user
    // whose existing password exceeds it.
    const password = 'Aa1!'.repeat(50); // 200 chars — over the 128 hashing cap
    const hash = rawPhc(password, Buffer.alloc(24, 9), 50_000, 'sha512');
    const result = await verifyPassword({ getFips: () => 1, hash, password });
    expect(result).toEqual({ needsRehash: false, valid: true });
  });

  it('accepts the 1000-iteration sanity floor and rejects 999', async () => {
    const atFloor = rawPhc('CorrectHorse15!x', Buffer.alloc(16, 3), 1000, 'sha256');
    await expect(
      verifyPassword({ getFips: () => 0, hash: atFloor, password: 'CorrectHorse15!x' }),
    ).resolves.toEqual({ needsRehash: false, valid: true });

    const belowFloor = rawPhc('CorrectHorse15!x', Buffer.alloc(16, 3), 999, 'sha256');
    await expect(
      verifyPassword({ getFips: () => 0, hash: belowFloor, password: 'CorrectHorse15!x' }),
    ).resolves.toEqual({ needsRehash: false, valid: false });
  });
});

describe('verifyPassword — §3 bcrypt path (FIPS off)', () => {
  it('verifies a real bcrypt hash via bcryptjs.compare with needsRehash:valid — the positive control for the spy', async () => {
    // This test proves the vi.mock interception is LIVE: the same spy the
    // FIPS-refusal test asserts was NOT called must observe the call here.
    // Without this control, a spy that failed to intercept would make the
    // non-invocation assertion pass vacuously.
    const hash = await bcryptjs.hash('CorrectHorse15!x', 4);
    vi.mocked(bcryptjs.compare).mockClear();
    const match = await verifyPassword({
      getFips: () => 0,
      hash,
      password: 'CorrectHorse15!x',
    });
    expect(match).toEqual({ needsRehash: true, valid: true });
    expect(bcryptjs.compare).toHaveBeenCalledTimes(1);
    expect(bcryptjs.compare).toHaveBeenCalledWith('CorrectHorse15!x', hash);

    const mismatch = await verifyPassword({
      getFips: () => 0,
      hash,
      password: 'WrongHorse15!x',
    });
    expect(mismatch).toEqual({ needsRehash: false, valid: false });
  });

  it('rejects a bcrypt-prefixed but malformed hash without throwing — a corrupted row must fail auth, not 500', async () => {
    // bcryptjs v3 compare, probed live: length !== 60 resolves false, but a
    // 60-char hash whose salt section uses a non-bcrypt alphabet REJECTS the
    // promise ("Illegal salt length: 0 != 16") — verifyPassword must convert
    // that into the reject result (the "never throws on malformed input"
    // contract covers the §3 bcrypt row too).
    const shortMalformed = await verifyPassword({
      getFips: () => 0,
      hash: '$2b$zz$not-a-valid-bcrypt-hash',
      password: 'CorrectHorse15!x',
    });
    expect(shortMalformed).toEqual({ needsRehash: false, valid: false });

    const rejectingMalformed = await verifyPassword({
      getFips: () => 0,
      hash: `$2b$10$${'!'.repeat(53)}`, // 60 chars — compare() rejects on this
      password: 'CorrectHorse15!x',
    });
    expect(rejectingMalformed).toEqual({ needsRehash: false, valid: false });
  });

  it('dispatches all three corpus bcrypt prefixes: compare invoked when FIPS off, refused un-invoked when FIPS on', async () => {
    const bcryptEntries = MALFORMED_CORPUS.filter(
      entry => entry.expected === 'bcrypt',
    );
    expect(bcryptEntries).toHaveLength(3); // $2a$ / $2b$ / $2y$
    for (const entry of bcryptEntries) {
      // FIPS off — §3 dispatches to bcryptjs; garbage checksum → false, no throw.
      vi.mocked(bcryptjs.compare).mockClear();
      const offResult = await verifyPassword({
        getFips: () => 0,
        hash: entry.hash as string,
        password: 'CorrectHorse15!x',
      });
      expect(offResult, `${entry.trap} fips=0`).toEqual({
        needsRehash: false,
        valid: false,
      });
      expect(bcryptjs.compare, `${entry.trap} fips=0`).toHaveBeenCalledTimes(1);

      // FIPS on — §3 refuses without ever invoking bcryptjs.
      vi.mocked(bcryptjs.compare).mockClear();
      const onResult = await verifyPassword({
        getFips: () => 1,
        hash: entry.hash as string,
        password: 'CorrectHorse15!x',
      });
      expect(onResult, `${entry.trap} fips=1`).toEqual({
        needsRehash: false,
        requiresReset: true,
        valid: false,
      });
      expect(bcryptjs.compare, `${entry.trap} fips=1`).not.toHaveBeenCalled();
    }
  });
});

describe('KDF concurrency limiter (§11) — global semaphore inside password.ts', () => {
  afterEach(() => {
    // Restore defaults so limiter config never leaks across tests.
    configureKdfLimiter();
  });

  it('with concurrency 2, a third concurrent hashPassword queues and does not dispatch until a slot frees', async () => {
    configureKdfLimiter({ concurrency: 2 });
    // 200k iterations ≈ tens of ms — long enough that all three overlap and
    // the state probe below runs before ANY of them completes.
    const inFlight = [
      hashPassword('CorrectHorse15!x', { iterations: 200_000 }),
      hashPassword('CorrectHorse15!x', { iterations: 200_000 }),
      hashPassword('CorrectHorse15!x', { iterations: 200_000 }),
    ];
    // One microtask flush: the first two acquired slots synchronously, the
    // third must be QUEUED — not dispatched to pbkdf2.
    await Promise.resolve();
    expect(kdfLimiterState()).toEqual({ active: 2, queued: 1 });

    const hashes = await Promise.all(inFlight);
    for (const hash of hashes) {
      expect(hash.startsWith('$pbkdf2-sha512$i=200000$')).toBe(true);
    }
    // All slots released after settlement — no leaked accounting.
    expect(kdfLimiterState()).toEqual({ active: 0, queued: 0 });
  });

  it('rejects with the typed KdfOverloadedError when the bounded queue is full', async () => {
    configureKdfLimiter({ concurrency: 1, maxQueue: 1 });
    const first = hashPassword('CorrectHorse15!x', { iterations: 200_000 });
    const second = hashPassword('CorrectHorse15!x', { iterations: 200_000 });
    // 1 active + 1 queued — the third must reject, typed, without ever
    // dispatching KDF work.
    await expect(
      hashPassword('CorrectHorse15!x', { iterations: 200_000 }),
    ).rejects.toBeInstanceOf(KdfOverloadedError);
    await expect(first).resolves.toContain('$pbkdf2-');
    await expect(second).resolves.toContain('$pbkdf2-');
    expect(kdfLimiterState()).toEqual({ active: 0, queued: 0 });
  });

  it('covers the verify path too — a queued verifyPassword completes correctly', async () => {
    configureKdfLimiter({ concurrency: 1 });
    const vector = KNOWN_GOOD_VECTORS[0];
    // Occupy the single slot, then verify — the verify must queue, then run.
    const occupant = hashPassword('CorrectHorse15!x', { iterations: 200_000 });
    const verified = verifyPassword({
      getFips: () => 0,
      hash: vector.hash,
      password: vector.password,
    });
    await Promise.resolve();
    expect(kdfLimiterState().queued).toBe(1);
    await expect(verified).resolves.toEqual({
      needsRehash: false,
      valid: true,
    });
    await occupant;
  });

  it('rejects invalid limiter configuration with a typed error, never clamps', () => {
    expect(() => configureKdfLimiter({ concurrency: 0 })).toThrow(
      PasswordHashError,
    );
    expect(() => configureKdfLimiter({ maxQueue: 0 })).toThrow(
      PasswordHashError,
    );
    expect(() =>
      configureKdfLimiter({ concurrency: 1.5 }),
    ).toThrow(PasswordHashError);
  });
});
