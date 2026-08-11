import { PasswordHashError } from './password';

/**
 * ADR-006 §12 — the write-gate DECISION, extracted pure so the Nest service
 * (hash-write-gate.service.ts) and the CommonJS admin seeder (site 8, which
 * runs outside DI and requires the COMPILED dist/src/crypto output) share ONE
 * implementation instead of a keep-in-sync copy. Dependency-free by the same
 * §5 rule as password.ts.
 *
 * The write epoch this build understands. Epoch 1 = PBKDF2-PHC credential
 * writes (§2). Bump ONLY when stored-credential write semantics change
 * incompatibly; the §12 mechanism-3 startup refusal fires when a database's
 * marker records a NEWER epoch than this constant. DECISION (card e25.21): a
 * dedicated integer, NOT package.json's semver — an RPM Release-only bump
 * changes neither write semantics nor this constant; the repo's package
 * versions are unreliable comparison subjects (root 0.0.0, backend/frontend
 * skew); integers compare without the lexicographic trap semver strings carry
 * ('2.13.0' < '2.9.9'). Recorded in the marker table's migration.
 */
export const SUPPORTED_HASH_MARKER_VERSION = 1;

export type HashWriteDecision = {
  readonly enabled: boolean;
  readonly reason: string;
};

export type HashWriteDecisionInput = {
  /** Raw PASSWORD_HASH_WRITE_ENABLED value; undefined or '' means unset. */
  readonly explicitSetting: string | undefined;
  /** A durable marker row exists — PBKDF2 writes already began. */
  readonly markerPresent: boolean;
  /** The Users table has at least one row. */
  readonly usersPresent: boolean;
};

/**
 * §9: out-of-range configuration throws at startup, never clamps silently.
 */
export function assertValidHashWriteSetting(raw: string | undefined): void {
  if (raw !== undefined && raw !== '' && raw !== 'true' && raw !== 'false') {
    throw new PasswordHashError(
      `PASSWORD_HASH_WRITE_ENABLED must be 'true' or 'false' (got '${raw}')`,
    );
  }
}

/**
 * §12 derivation (settled 2026-08-05): an explicit env value wins; otherwise
 * the gate is ON when PBKDF2 writes have already begun on this database
 * (marker present — sticky across restarts) or on a fresh install (empty
 * Users table — no pre-N peer can exist), and OFF only on an upgrade, where
 * a rolling window with pre-N pods is possible.
 */
export function deriveHashWriteState(
  input: HashWriteDecisionInput,
): HashWriteDecision {
  assertValidHashWriteSetting(input.explicitSetting);
  if (input.explicitSetting === 'true') {
    return { enabled: true, reason: 'PASSWORD_HASH_WRITE_ENABLED=true' };
  }
  if (input.explicitSetting === 'false') {
    return { enabled: false, reason: 'PASSWORD_HASH_WRITE_ENABLED=false' };
  }
  if (input.markerPresent) {
    return {
      enabled: true,
      reason:
        'durable marker present — PBKDF2 writes already began on this database',
    };
  }
  if (!input.usersPresent) {
    return {
      enabled: true,
      reason: 'fresh install (empty Users table) — no pre-N peer can exist',
    };
  }
  return {
    enabled: false,
    reason:
      'upgrade default — existing users and no marker, so a rolling window with pre-N peers is possible',
  };
}
