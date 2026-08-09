/**
 * FIPS-validated password hashing — the pure primitive (ADR-006 §1, §2, §5, §6).
 *
 * DEPENDENCY-FREE by hard constraint: the only TOP-LEVEL import is
 * `node:crypto`. The admin bootstrap seeder (ADR §4 site 8) requires this
 * module via a bare `require()` of the COMPILED output, outside Nest DI and
 * the ConfigService — so it must pull in nothing else, and the inferred build
 * layout must not shift. Do NOT add imports of Nest, config, a logger, or the
 * vectors package (the vectors are a TEST-only dependency, imported by the
 * spec, never here). ONE disclosed exception: verifyPassword's FIPS-off
 * bcrypt fallback lazily `await import()`s bcryptjs at call time — never
 * loaded under FIPS, never loaded on the hash path the seeder uses.
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

/** Result of {@link verifyPassword} (§5). `requiresReset` appears ONLY on the
 * FIPS-refuse path: a bcrypt credential encountered while FIPS is on. */
export type PasswordVerifyResult = {
  needsRehash: boolean;
  requiresReset?: boolean;
  valid: boolean;
};

/**
 * Thrown when the bounded KDF queue is full (§11). Server-side signal only:
 * the auth layer maps this to its generic failure — never a distinct
 * client-visible error (Risks — enumeration oracle).
 */
export class KdfOverloadedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KdfOverloadedError';
  }
}

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

const BCRYPT_PREFIX = /^\$2[aby]\$/v; // §3: exactly $2a$/$2b$/$2y$

/**
 * §6 step 3: STRICT allowlist over the FULL identifier. Never prefix-match —
 * crypto.pbkdf2 accepts 'md5' and 'sha1', so `$pbkdf2-sha*$` would verify a
 * downgraded digest, and allowlisting only the digest admits
 * `$pbkdf2-sha512-md5$` via naive splitting.
 */
const PBKDF2_IDENTIFIERS = new Map<string, PasswordHashAlgorithm>([
  ['pbkdf2-sha256', 'sha256'],
  ['pbkdf2-sha384', 'sha384'],
  ['pbkdf2-sha512', 'sha512'],
]);

/**
 * §6 step 4: iterations by regex ONLY — parseInt('6e5') is 6 (a 100,000×
 * downgrade that looks well-formed), parseInt('600000abc') is 600000,
 * Number('0x10000') is 65536. Nine digits max, so Number() on the capture
 * is always a safe integer.
 */
const ITERATIONS_FIELD = /^i=(?<iterations>[1-9]\d{0,8})$/v;

/**
 * §9: floors and caps apply to HASHING only, never verification — a user
 * hashed under an earlier PASSWORD_HASH_ITERATIONS=50000 must still verify.
 * Verify enforces only the DoS upper bound (MAX_ITERATIONS) plus this sanity
 * floor of 1000, the module's own documented minimum.
 */
const VERIFY_MIN_ITERATIONS = 1000;
const MIN_SALT_BYTES = 16; // §6 step 7

/** Constant input for the timing-mitigation dummy — its output is discarded. */
const DUMMY_SALT = Buffer.alloc(SALT_BYTES);

/**
 * §11 KDF concurrency limiter — a hand-rolled counting semaphore (zero deps;
 * the module must stay dependency-free for the seeder's bare require). It
 * wraps the module's single internal pbkdf2 dispatcher, so hashPassword,
 * verifyPassword, AND the constant-work dummy are all globally capped —
 * "600k is only safe if UV_THREADPOOL_SIZE is raised AND a global KDF
 * concurrency limit lands."
 *
 * Defaults per §11's starvation measurements: concurrency 2 leaves ≥2 of
 * libuv's default 4 threads for fs/dns; queue 100 bounds the flood so thread
 * starvation cannot become memory exhaustion. This is DELIBERATE module-scope
 * shared state (the limit is global by design); configureKdfLimiter is the
 * init/test seam.
 */
const DEFAULT_KDF_CONCURRENCY = 2;
const DEFAULT_KDF_MAX_QUEUE = 100;

type KdfLimiter = {
  active: number;
  concurrency: number;
  maxQueue: number;
  queue: (() => void)[];
};

const kdfLimiter: KdfLimiter = {
  active: 0,
  concurrency: DEFAULT_KDF_CONCURRENCY,
  maxQueue: DEFAULT_KDF_MAX_QUEUE,
  queue: [],
};

/**
 * Init/test seam: the service card binds PASSWORD_KDF_CONCURRENCY here at
 * construction; tests use it to configure and reset. Call ONLY at boot or
 * between settled operations — it zeroes the accounting, so reconfiguring
 * with KDFs in flight would corrupt the slot count. Out-of-range values
 * THROW (§9) — never a silent clamp.
 */
export function configureKdfLimiter(options?: {
  concurrency?: number;
  maxQueue?: number;
}): void {
  const concurrency = options?.concurrency ?? DEFAULT_KDF_CONCURRENCY;
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new PasswordHashError(
      'PASSWORD_KDF_CONCURRENCY must be an integer >= 1',
    );
  }
  const maxQueue = options?.maxQueue ?? DEFAULT_KDF_MAX_QUEUE;
  if (!Number.isSafeInteger(maxQueue) || maxQueue < 1) {
    throw new PasswordHashError('KDF maxQueue must be an integer >= 1');
  }
  kdfLimiter.concurrency = concurrency;
  kdfLimiter.maxQueue = maxQueue;
  kdfLimiter.active = 0;
  kdfLimiter.queue = [];
}

/** Observable semaphore state — the test seam the limiter ACs require. */
export function kdfLimiterState(): { active: number; queued: number } {
  return { active: kdfLimiter.active, queued: kdfLimiter.queue.length };
}

/**
 * Verify a submitted password against a stored hash, dispatching on stored
 * format AND FIPS state (§3). Never throws on malformed input — rejects via
 * the result object. `getFips` is injectable (§5) so both FIPS states are
 * testable in non-FIPS CI; the default is the real `crypto.getFips`.
 */
export async function verifyPassword(arguments_: {
  getFips?: () => number;
  hash: string;
  password: string;
}): Promise<PasswordVerifyResult> {
  const { hash, password } = arguments_;
  if (typeof hash !== 'string' || typeof password !== 'string') {
    // §6 step 1 — the seeder path is CommonJS JS, so a non-string can arrive.
    return rejectWithConstantWork(password);
  }
  const getFips = arguments_.getFips ?? crypto.getFips;
  if (BCRYPT_PREFIX.test(hash)) {
    if (getFips() === 1) {
      // §3: refuse — do NOT invoke bcryptjs. bcryptjs.compare() generates a
      // bcrypt hash in pure JS outside the validated module; under a FIPS
      // deployment that is the V-222571 finding itself.
      return rejectWithConstantWork(password, true);
    }
    // Lazy import so FIPS deployments never load unapproved-crypto code and
    // the seeder's bare require() of the compiled module stays free of it —
    // this branch is the ONLY exception to the header's node:crypto-only
    // rule, and it never executes under FIPS or on the hash path.
    const { compare } = await import('bcryptjs');
    try {
      const isValid = await compare(password, hash);
      // needsRehash: valid — a rehash requires the correct plaintext (§3).
      return { needsRehash: isValid, valid: isValid };
    } catch {
      // compare() rejects on a bcrypt-prefixed hash with an unparseable
      // rounds/salt section (verified against bcryptjs 3.0.3) — a corrupted
      // stored credential. Classification: unverifiable-hash → auth failure,
      // never a thrown 500. This module is dependency-free by the header's
      // constraint, so logging the corruption belongs to the service layer
      // (rehash audit card). Constant work keeps the fast parse failure from
      // advertising that the stored hash is corrupt rather than mismatched.
      return rejectWithConstantWork(password);
    }
  }
  return verifyPbkdf2(hash, password);
}

function acquireKdfSlot(): Promise<void> {
  if (kdfLimiter.active < kdfLimiter.concurrency) {
    kdfLimiter.active += 1;
    return Promise.resolve();
  }
  if (kdfLimiter.queue.length >= kdfLimiter.maxQueue) {
    return Promise.reject(
      new KdfOverloadedError(
        `KDF queue full (${kdfLimiter.maxQueue} pending) — server overloaded`,
      ),
    );
  }
  return new Promise((resolve) => {
    kdfLimiter.queue.push(() => {
      kdfLimiter.active += 1;
      resolve();
    });
  });
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

/** The module's ONLY pbkdf2 dispatcher — every KDF passes the §11 limiter. */
async function pbkdf2(
  password: string,
  salt: Buffer,
  iterations: number,
  keylen: number,
  digest: PasswordHashAlgorithm,
): Promise<Buffer> {
  await acquireKdfSlot();
  try {
    return await new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        iterations,
        keylen,
        digest,
        (error, key) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(key);
        },
      );
    });
  } finally {
    releaseKdfSlot();
  }
}

/**
 * Risks (timing side-channel): burn one KDF-equivalent of work at DEFAULT
 * parameters on every reject that did not run the real KDF, so no rejection —
 * unknown format, the cutover sentinel, any §6 step failure, or the FIPS
 * refuse path — is distinguishable by timing from a failed verification.
 * Rejections after the real KDF (§6 step 8) already paid full cost.
 */
async function rejectWithConstantWork(
  password: unknown,
  shouldRequireReset?: boolean,
): Promise<PasswordVerifyResult> {
  await pbkdf2(
    typeof password === 'string' ? password : '',
    DUMMY_SALT,
    DEFAULT_ITERATIONS,
    digestWidth(DEFAULT_ALGORITHM),
    DEFAULT_ALGORITHM,
  );
  return shouldRequireReset === true
    ? { needsRehash: false, requiresReset: true, valid: false }
    : { needsRehash: false, valid: false };
}

function releaseKdfSlot(): void {
  kdfLimiter.active -= 1;
  const next = kdfLimiter.queue.shift();
  if (next !== undefined) {
    next();
  }
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

/** The §6 validation sequence, in order, against a candidate PHC string. */
async function verifyPbkdf2(
  hash: string,
  password: string,
): Promise<PasswordVerifyResult> {
  // §6 steps 1–2: ''.split('$') is [''], so the parts[0] === '' check alone
  // passes for the empty string — the exact-field-count check catches it.
  // These are AND, not alternatives.
  const parts = hash.split('$');
  if (parts.length !== 5 || parts[0] !== '') {
    return rejectWithConstantWork(password);
  }
  const algorithm = PBKDF2_IDENTIFIERS.get(parts[1]); // step 3
  if (algorithm === undefined) {
    return rejectWithConstantWork(password);
  }
  const iterationsMatch = ITERATIONS_FIELD.exec(parts[2]); // step 4
  if (iterationsMatch === null) {
    return rejectWithConstantWork(password);
  }
  const iterations = Number(iterationsMatch.groups?.iterations);
  // Step 5: the upper bound is the DoS guard — Node permits 2³¹−1, roughly
  // 8.6 minutes of one libuv thread per verification. (isSafeInteger also
  // rejects the cannot-happen NaN if the named group were ever absent.)
  if (
    !Number.isSafeInteger(iterations)
    || iterations < VERIFY_MIN_ITERATIONS
    || iterations > MAX_ITERATIONS
  ) {
    return rejectWithConstantWork(password);
  }
  // Step 6: Buffer.from(str, 'base64') is lenient — 'AA@@AA' and 'A A A A'
  // decode to the same bytes as 'AAAA'. Re-encode and compare (padding
  // stripped both sides) to reject non-canonical fields. (Buffer, not
  // Uint8Array.fromBase64 — undefined at our Node runtime; see toB64.)
  const salt = Buffer.from(parts[3], 'base64');
  const key = Buffer.from(parts[4], 'base64');
  if (toB64(salt) !== parts[3] || toB64(key) !== parts[4]) {
    return rejectWithConstantWork(password);
  }
  // Step 7: BEFORE pbkdf2 — keylen=0 throws an untyped error, and a sha512
  // hash carrying a 32-byte key would otherwise silently verify a
  // downgraded artifact.
  if (key.length !== digestWidth(algorithm) || salt.length < MIN_SALT_BYTES) {
    return rejectWithConstantWork(password);
  }
  const derived = await pbkdf2(password, salt, iterations, key.length, algorithm);
  // Step 8: timingSafeEqual THROWS on length mismatch — guard first.
  if (derived.length !== key.length) {
    return { needsRehash: false, valid: false };
  }
  return { needsRehash: false, valid: crypto.timingSafeEqual(derived, key) };
}
