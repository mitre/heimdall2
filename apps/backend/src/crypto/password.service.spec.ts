import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '../config/config.service';
import {
  configureKdfLimiter,
  hashPassword,
  kdfLimiterState,
  PasswordHashError,
} from './password';
import { PasswordService } from './password.service';

// Hoisted to module scope (prefer-static-regex): assertion patterns for the
// construction-time validation messages.
const ITERATIONS_RANGE = /PASSWORD_HASH_ITERATIONS.*100000.*10000000/v;
const ITERATIONS_NAMED = /PASSWORD_HASH_ITERATIONS/v;
const ALGORITHM_ALLOWLIST = /PASSWORD_HASH_ALGORITHM.*sha256.*sha384.*sha512/v;
const MAX_LENGTH_NAMED = /PASSWORD_MAX_LENGTH.*128/v;
const KDF_CONCURRENCY_NAMED = /PASSWORD_KDF_CONCURRENCY/v;

// Build a PasswordService whose ConfigService returns the given values. A Map
// (not a Record index) avoids the object-injection sink; spying `get` (not
// casting) keeps the real type — no Gate 3 bypass.
function serviceWith(
  values: Record<string, string | undefined>,
): PasswordService {
  const lookup = new Map(Object.entries(values));
  const config = new ConfigService();
  vi.spyOn(config, 'get').mockImplementation((key: string) => lookup.get(key));
  return new PasswordService(config);
}

describe('PasswordService — §9 config binding + delegation', () => {
  beforeEach(() => {
    // Reset the module-scope KDF limiter so concurrency-binding assertions
    // start from a known state (e25.8's seam).
    configureKdfLimiter();
  });

  describe('construction-time §9 validation — throws, never clamps', () => {
    it('throws when PASSWORD_HASH_ITERATIONS is below the floor, naming the variable and range', () => {
      expect(() => serviceWith({ PASSWORD_HASH_ITERATIONS: '50000' })).toThrow(
        ITERATIONS_RANGE,
      );
    });

    it('throws when PASSWORD_HASH_ITERATIONS exceeds the ceiling', () => {
      expect(() =>
        serviceWith({ PASSWORD_HASH_ITERATIONS: '10000001' }),
      ).toThrow(ITERATIONS_NAMED);
    });

    it('throws when PASSWORD_HASH_ALGORITHM is not in the allowlist', () => {
      expect(() => serviceWith({ PASSWORD_HASH_ALGORITHM: 'md5' })).toThrow(
        ALGORITHM_ALLOWLIST,
      );
    });

    it('throws when PASSWORD_MAX_LENGTH exceeds 128', () => {
      expect(() => serviceWith({ PASSWORD_MAX_LENGTH: '256' })).toThrow(
        MAX_LENGTH_NAMED,
      );
    });

    it('throws when PASSWORD_KDF_CONCURRENCY is below 1', () => {
      expect(() => serviceWith({ PASSWORD_KDF_CONCURRENCY: '0' })).toThrow(
        KDF_CONCURRENCY_NAMED,
      );
    });

    it('throws on a non-integer iteration value (never silently coerces)', () => {
      expect(() =>
        serviceWith({ PASSWORD_HASH_ITERATIONS: '6e5' }),
      ).toThrow(ITERATIONS_NAMED);
    });
  });

  describe('defaults (§9 table) when nothing is configured', () => {
    it('hashes with sha512 / 600000 by default', async () => {
      const service = serviceWith({});
      const hash = await service.hash('CorrectHorse15!x');
      expect(hash.startsWith('$pbkdf2-sha512$i=600000$')).toBe(true);
    });

    it('binds PASSWORD_KDF_CONCURRENCY default of 2 to the limiter', async () => {
      // Pre-set a DIFFERENT concurrency so this test proves the constructor
      // actively rebinds to 2 — not merely that beforeEach left it at 2. If
      // the bind were removed, the limiter would stay at 5 and the third probe
      // would run ({active:3,queued:0}), failing the assertion.
      configureKdfLimiter({ concurrency: 5 });
      serviceWith({});
      const runs = Promise.all([
        hashViaLimiterProbe(),
        hashViaLimiterProbe(),
        hashViaLimiterProbe(),
      ]);
      await Promise.resolve();
      expect(kdfLimiterState()).toEqual({ active: 2, queued: 1 });
      await runs;
    });
  });

  describe('configured values are honoured on the hash path', () => {
    it('uses PASSWORD_HASH_ALGORITHM and PASSWORD_HASH_ITERATIONS', async () => {
      const service = serviceWith({
        PASSWORD_HASH_ALGORITHM: 'sha256',
        PASSWORD_HASH_ITERATIONS: '200000',
      });
      const hash = await service.hash('CorrectHorse15!x');
      expect(hash.startsWith('$pbkdf2-sha256$i=200000$')).toBe(true);
    });

    it('binds a custom PASSWORD_KDF_CONCURRENCY to the limiter', async () => {
      serviceWith({ PASSWORD_KDF_CONCURRENCY: '1' });
      const runs = Promise.all([hashViaLimiterProbe(), hashViaLimiterProbe()]);
      await Promise.resolve();
      expect(kdfLimiterState()).toEqual({ active: 1, queued: 1 });
      await runs;
    });

    it('rejects a password longer than the configured PASSWORD_MAX_LENGTH (hash path cap)', async () => {
      const service = serviceWith({ PASSWORD_MAX_LENGTH: '64' });
      await expect(service.hash('a'.repeat(65))).rejects.toBeInstanceOf(
        PasswordHashError,
      );
      await expect(service.hash('Aa1!'.repeat(15))).resolves.toContain(
        '$pbkdf2-',
      ); // 60 chars, under the cap
    });
  });

  describe('verify path applies NO policy bounds (§9)', () => {
    it('verifies a hash made under a DIFFERENT (lower) iteration config', async () => {
      // Hash at 200k, then verify through a service configured at 600k — the
      // stored parameters govern verification, not the service policy.
      const lo = serviceWith({ PASSWORD_HASH_ITERATIONS: '200000' });
      const stored = await lo.hash('CorrectHorse15!x');
      const hi = serviceWith({}); // default 600k
      await expect(
        hi.verify({ hash: stored, password: 'CorrectHorse15!x' }),
      ).resolves.toEqual({ needsRehash: false, valid: true });
      await expect(
        hi.verify({ hash: stored, password: 'WrongHorse15!x' }),
      ).resolves.toEqual({ needsRehash: false, valid: false });
    });

    it('verify does not apply PASSWORD_MAX_LENGTH — a password over the configured cap still verifies', async () => {
      // A 100-char password: over the configured cap (64) but under the pure
      // module's absolute 128 DoS cap, so it was hashable when the cap was
      // higher. After the cap drops to 64 the user must STILL verify (§9:
      // caps never apply on verify).
      const capped = serviceWith({ PASSWORD_MAX_LENGTH: '64' });
      const longPass = 'Aa1!'.repeat(25); // 100 chars
      const stored = await hashUncapped(longPass);
      await expect(
        capped.verify({ hash: stored, password: longPass }),
      ).resolves.toEqual({ needsRehash: false, valid: true });
    });
  });
});

function hashUncapped(password: string): Promise<string> {
  return hashPassword(password);
}

// Local helpers kept out of the describe bodies for scoping cleanliness.
// Direct (not dynamic-import) so the acquire runs synchronously and the
// limiter-state probe after one microtask flush is deterministic.
function hashViaLimiterProbe(): Promise<string> {
  return hashPassword('CorrectHorse15!x', { iterations: 200_000 });
}
