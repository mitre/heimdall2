/**
 * FIPS-validated password hashing — the pure primitive (ADR-006 §1, §2, §5, §6).
 *
 * DEPENDENCY-FREE by hard constraint: the only import is `node:crypto`. The
 * admin bootstrap seeder (ADR §4 site 8) requires this module via a bare
 * `require()` of the COMPILED output, outside Nest DI and the ConfigService —
 * so it must pull in nothing else, and the inferred build layout must not
 * shift. Do NOT add imports of Nest, config, a logger, or the vectors package
 * (the vectors are a TEST-only dependency, imported by the spec, never here).
 *
 * `node:crypto` is a NAMESPACE import, never destructured: swc compiles a
 * destructured `import {getFips}` to a non-writable binding, which blocks the
 * injectable `getFips` seam that verifyPassword (e25.7) needs.
 *
 * Public API is `hashPassword(password, options?)` — it always generates a
 * fresh 32-byte random salt. `hashPasswordWithSalt` is the deterministic
 * variant used by tests and vector tooling to reproduce known-good vectors;
 * production code must never pass a caller-controlled salt.
 */
import * as crypto from 'node:crypto';

export type PasswordHashAlgorithm = 'sha256' | 'sha384' | 'sha512';

export type PasswordHashOptions = {
  /** HMAC digest. Default 'sha512'. */
  algorithm?: PasswordHashAlgorithm;
  /** PBKDF2 iterations. Default 600000. Must be within [100000, 10000000]. */
  iterations?: number;
};

/** Thrown for any invalid input — never a silent clamp (§6, §9). */
export class PasswordHashError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordHashError';
  }
}

const DEFAULT_ALGORITHM: PasswordHashAlgorithm = 'sha512';
const DEFAULT_ITERATIONS = 600_000;
const SALT_BYTES = 32;
const MAX_PASSWORD_LENGTH = 128; // §6 DoS cap + approved 8–128 range
const MIN_ITERATIONS = 100_000; // §9 hash-path floor (NOT enforced on verify)
const MAX_ITERATIONS = 10_000_000; // §6 DoS ceiling
const ALLOWED_ALGORITHMS = new Set<PasswordHashAlgorithm>([
  'sha256',
  'sha384',
  'sha512',
]);

/**
 * Hash a password with a fresh 32-byte random salt, producing a PHC string
 * `$pbkdf2-<alg>$i=<n>$<b64-salt>$<b64-key>` (§1, §2). Defaults: sha512,
 * 600000 iterations. Throws {@link PasswordHashError} on invalid input.
 */
export function hashPassword(
  password: string,
  options?: PasswordHashOptions,
): Promise<string> {
  return hashPasswordWithSalt(password, crypto.randomBytes(SALT_BYTES), options);
}

/**
 * Deterministic hash — the caller supplies the salt. Tests and vector tooling
 * only; production code uses {@link hashPassword}. Reusing a salt across
 * passwords in production would be a critical weakness.
 */
export async function hashPasswordWithSalt(
  password: string,
  salt: Buffer,
  options?: PasswordHashOptions,
): Promise<string> {
  const algorithm = options?.algorithm ?? DEFAULT_ALGORITHM;
  const iterations = options?.iterations ?? DEFAULT_ITERATIONS;
  validate(password, algorithm, iterations);
  const key = await pbkdf2(
    password,
    salt,
    iterations,
    digestWidth(algorithm),
    algorithm,
  );
  return `$pbkdf2-${algorithm}$i=${iterations}$${toB64(salt)}$${toB64(key)}`;
}

/** PBKDF2 derived-key width = digest width (§2). Exhaustive over the union. */
function digestWidth(algorithm: PasswordHashAlgorithm): number {
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
      throw new PasswordHashError('unhandled algorithm');
    }
  }
}

function pbkdf2(
  password: string,
  salt: Buffer,
  iterations: number,
  keylen: number,
  digest: PasswordHashAlgorithm,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key);
    });
  });
}

/**
 * Standard base64 (not base64url), padding stripped — §2. Uses Buffer, not
 * Uint8Array#toBase64: that TC39 API is undefined at the Node runtime
 * (verified), so eslint's prefer-uint8array-base64 is a config-ahead-of-runtime
 * false preference here — migrate when Node ships the API.
 */
function toB64(buffer: Buffer): string {
  let out = buffer.toString('base64');
  while (out.endsWith('=')) {
    out = out.slice(0, -1);
  }
  return out;
}

function validate(
  password: unknown,
  algorithm: PasswordHashAlgorithm,
  iterations: number,
): asserts password is string {
  if (typeof password !== 'string') {
    throw new PasswordHashError('password must be a string');
  }
  if (password.length === 0) {
    throw new PasswordHashError('password must not be empty');
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new PasswordHashError(
      `password must be at most ${MAX_PASSWORD_LENGTH} characters`,
    );
  }
  if (!ALLOWED_ALGORITHMS.has(algorithm)) {
    throw new PasswordHashError(`unsupported algorithm: ${algorithm}`);
  }
  if (!Number.isSafeInteger(iterations)) {
    throw new PasswordHashError('iterations must be an integer');
  }
  if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
    throw new PasswordHashError(
      `iterations must be within [${MIN_ITERATIONS}, ${MAX_ITERATIONS}]`,
    );
  }
}
