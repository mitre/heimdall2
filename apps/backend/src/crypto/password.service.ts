import * as nodeCrypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { hash as bcryptHashLegacy } from 'bcryptjs';
import { ConfigService } from '../config/config.service';
import { HashWriteGateService } from './hash-write-gate.service';
import {
  configureKdfLimiter,
  hashPassword,
  PasswordHashAlgorithm,
  PasswordHashError,
  PasswordVerifyResult,
  verifyPassword,
} from './password';

const DECIMAL_INTEGER = /^\d+$/v;
const ALGORITHMS: readonly PasswordHashAlgorithm[] = [
  'sha256',
  'sha384',
  'sha512',
];

function isAlgorithm(value: string): value is PasswordHashAlgorithm {
  return (ALGORITHMS as readonly string[]).includes(value);
}

/**
 * Nest layer over the pure password primitives (ADR-006 §5, §9). Reads the
 * §9 configuration through ConfigService and delegates to password.ts.
 *
 * Only hashing needs configuration — verifyPassword reads its parameters from
 * the stored hash, so the verify path passes NO policy bounds (§9's
 * contradiction fix: a user hashed under an earlier, lower iteration/length
 * config must still verify). All §9 values are validated at construction and
 * throw — never a silent clamp.
 *
 * §9 defaults (must match the ADR table):
 *   PASSWORD_HASH_ALGORITHM = sha512   (NSS deployments must NOT use sha256 —
 *                                       V-222571 makes anything weaker than
 *                                       SHA-384 a finding)
 *   PASSWORD_HASH_ITERATIONS = 600000
 *   PASSWORD_MAX_LENGTH      = 128
 *   PASSWORD_KDF_CONCURRENCY = 2
 */
@Injectable()
export class PasswordService {
  private static readonly ABSOLUTE_MAX_LENGTH = 128; // §6 approved 8–128 range
  private static readonly DEFAULT_ALGORITHM: PasswordHashAlgorithm = 'sha512';
  private static readonly DEFAULT_ITERATIONS = 600_000;
  private static readonly DEFAULT_KDF_CONCURRENCY = 2;
  private static readonly DEFAULT_MAX_LENGTH = 128;
  private static readonly MAX_ITERATIONS = 10_000_000; // §6 DoS ceiling
  private static readonly MIN_ITERATIONS = 100_000; // §9 hash-path floor

  private readonly algorithm: PasswordHashAlgorithm;
  private readonly iterations: number;
  private readonly maxLength: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly hashWriteGate: HashWriteGateService,
  ) {
    this.algorithm = this.readAlgorithm();
    this.iterations = this.readIntInRange(
      'PASSWORD_HASH_ITERATIONS',
      PasswordService.DEFAULT_ITERATIONS,
      PasswordService.MIN_ITERATIONS,
      PasswordService.MAX_ITERATIONS,
    );
    this.maxLength = this.readIntInRange(
      'PASSWORD_MAX_LENGTH',
      PasswordService.DEFAULT_MAX_LENGTH,
      1,
      PasswordService.ABSOLUTE_MAX_LENGTH,
    );
    const concurrency = this.readIntInRange(
      'PASSWORD_KDF_CONCURRENCY',
      PasswordService.DEFAULT_KDF_CONCURRENCY,
      1,
      Number.MAX_SAFE_INTEGER,
    );
    // §11: bind the global KDF limiter's init seam (e25.8). Done once at
    // construction, before any hashing runs.
    configureKdfLimiter({ concurrency });
  }

  private readAlgorithm(): PasswordHashAlgorithm {
    const raw = this.configService.get('PASSWORD_HASH_ALGORITHM');
    if (raw === undefined || raw === '') {
      return PasswordService.DEFAULT_ALGORITHM;
    }
    if (isAlgorithm(raw)) {
      return raw;
    }
    throw new PasswordHashError(
      `PASSWORD_HASH_ALGORITHM must be one of sha256, sha384, sha512 (got '${raw}')`,
    );
  }

  private readIntInRange(
    key: string,
    fallback: number,
    min: number,
    max: number,
  ): number {
    const raw = this.configService.get(key);
    if (raw === undefined || raw === '') {
      return fallback;
    }
    // Decimal integers only — never parseInt/Number coercion (§6 step 4:
    // parseInt('6e5') === 6, Number('0x10') === 16).
    if (!DECIMAL_INTEGER.test(raw)) {
      throw new PasswordHashError(
        `${key} must be an integer within [${min}, ${max}] (got '${raw}')`,
      );
    }
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < min || value > max) {
      throw new PasswordHashError(
        `${key} must be an integer within [${min}, ${max}] (got '${raw}')`,
      );
    }
    return value;
  }

  /**
   * Hash a password using the configured algorithm and iterations. Enforces
   * the configured PASSWORD_MAX_LENGTH on this (hash) path only; the pure
   * function keeps its own absolute 128 cap as defense in depth.
   *
   * §12 rollout gate: while PBKDF2 writes are DISABLED (rolling-deploy
   * window), a NEW credential must still be readable by a pre-N pod, so this
   * falls back to bcrypt (cost 14, the historical parameter) and leaves
   * rehash debt for after the gate opens. When writes are enabled, the first
   * PBKDF2 hash plants the §12 durable marker.
   */
  async hash(password: string): Promise<string> {
    if (typeof password === 'string' && password.length > this.maxLength) {
      throw new PasswordHashError(
        `password must be at most ${this.maxLength} characters`,
      );
    }
    if (!(await this.hashWriteGate.writesEnabled())) {
      // §3 / V-222571: bcrypt (pure JS, outside the validated module) must
      // never GENERATE a hash while FIPS mode is active. Gate-off + FIPS-on
      // is a self-contradictory deployment — §12's phase ordering enables
      // FIPS only after cutover, when the gate is necessarily on.
      if (nodeCrypto.getFips() === 1) {
        throw new PasswordHashError(
          'PASSWORD_HASH_WRITE_ENABLED=false is incompatible with FIPS mode: a bcrypt fallback hash cannot be generated inside the validated boundary (V-222571). Enable PBKDF2 writes or disable FIPS mode.',
        );
      }
      return bcryptHashLegacy(password, 14);
    }
    const hashed = await hashPassword(password, {
      algorithm: this.algorithm,
      iterations: this.iterations,
    });
    await this.hashWriteGate.plantMarker();
    return hashed;
  }

  /**
   * Verify a password against a stored hash. NO policy bounds are applied —
   * the stored hash's own parameters govern (§9). getFips defaults to the real
   * crypto.getFips inside verifyPassword.
   */
  verify(arguments_: {
    hash: string;
    password: string;
  }): Promise<PasswordVerifyResult> {
    return verifyPassword(arguments_);
  }

  /**
   * §12: whether PBKDF2 credential writes are enabled for this process.
   * The rehash call sites (sites 4 and 5) consult this to SKIP persistence
   * while the gate is off — verifyPassword still reports needsRehash, but a
   * rehash written during the rolling window would be unreadable by pre-N
   * pods. Exposed here so callers need no direct gate dependency.
   */
  writesEnabled(): Promise<boolean> {
    return this.hashWriteGate.writesEnabled();
  }
}
