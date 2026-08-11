import * as nodeCrypto from 'node:crypto';
import { createLogger, format, transports } from 'winston';
import { PasswordHashError } from './password';

/**
 * ADR-006 §10: the FIPS startup assertion. With --force-fips gone (Red Hat's
 * Node rejects it — the RHEL model is host FIPS mode -> OpenSSL -> Node),
 * this assertion is the ONLY thing between us and silent non-FIPS operation:
 * GitLab's Workhorse shipped exactly that failure, fips.Enabled() returning
 * false with no error. Exported and injectable because bootstrap() in main.ts
 * is not exported and cannot be unit-tested.
 *
 * NEVER call crypto.setFips() here or anywhere: under --force-fips it
 * triggers a native CHECK() that ABORTS the process — it does not throw.
 *
 * Operator error-family note (§10 — you will hit both): an
 * ERR_OSSL_EVP_UNSUPPORTED error is an OpenSSL 3 LEGACY-PROVIDER problem, NOT
 * a FIPS denial; "...disabled for FIPS" in an OpenSSL error IS a real FIPS
 * denial. Do not conflate them when diagnosing a refused boot.
 *
 * `node:crypto` is a NAMESPACE import (§5): a destructured getFips compiles
 * to a non-writable binding under swc, which would break the injectable seam.
 */

const fipsLogger = createLogger({
  format: format.printf(info => `[FIPS]: ${String(info.message)}`),
  transports: [new transports.Console()],
});

export type AssertFipsModeArguments = {
  /** Raw FIPS_MODE value; undefined or '' means unset. */
  readonly fipsMode: string | undefined;
  /** Injectable FIPS probe; defaults to the real crypto.getFips. */
  readonly getFips?: () => number;
  /** Injectable warning sink; defaults to the module's winston logger. */
  readonly logWarning?: (message: string) => void;
};

/**
 * Throws when FIPS_MODE=true but the OpenSSL provider reports FIPS inactive;
 * warns LOUDLY when FIPS_MODE is unset (no assertion performed — §10's
 * anti-Workhorse rule); silent for an explicit 'false' and for a satisfied
 * 'true'. Invalid values throw per §9 (never clamp silently).
 */
export function assertFipsMode(arguments_: AssertFipsModeArguments): void {
  const {
    fipsMode,
    getFips = nodeCrypto.getFips,
    logWarning = (message: string): void => {
      fipsLogger.warn({ message });
    },
  } = arguments_;

  if (fipsMode === undefined || fipsMode === '') {
    logWarning(
      'FIPS_MODE is not set — NO FIPS assertion was performed at boot. If this host is supposed to run in FIPS mode, set FIPS_MODE=true so a silently non-FIPS OpenSSL provider refuses startup instead of running non-validated crypto (ADR-006 §10).',
    );
    return;
  }
  if (fipsMode !== 'true' && fipsMode !== 'false') {
    throw new PasswordHashError(
      `FIPS_MODE must be 'true' or 'false' (got '${fipsMode}')`,
    );
  }
  if (fipsMode === 'false') {
    return;
  }
  if (getFips() !== 1) {
    throw new Error(
      'REFUSING TO START: FIPS_MODE=true but the OpenSSL provider reports FIPS is NOT active (getFips() returned 0). Running would silently use non-validated crypto. Remedy on RHEL: enable HOST FIPS mode — fips-mode-setup --enable and reboot — so OpenSSL and Node inherit it (ADR-006 §10). Do NOT use node --force-fips on RHEL: the platform Node rejects it (configure FIPS in OpenSSL instead).',
    );
  }
}
