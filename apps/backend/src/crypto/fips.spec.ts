import * as nodeCrypto from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { assertFipsMode } from './fips';
import { PasswordHashError } from './password';

// Module-scope assertion patterns (prefer-static-regex).
const REFUSAL_MESSAGE = /FIPS_MODE=true.*getFips\(\).*fips-mode-setup --enable/sv;
const NO_FORCE_FIPS = /Do NOT use.*--force-fips/sv;
const UNSET_WARNING = /FIPS_MODE is not set.*NO FIPS assertion was performed/sv;
const INVALID_VALUE = /FIPS_MODE must be 'true' or 'false'/v;

// Pass-through wrap so the default-seam tests can steer getFips and so the
// never-calls-setFips AC is mechanically observable. Every other node:crypto
// function goes to the real implementation via the spread.
vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof nodeCrypto>();
  return {
    ...actual,
    getFips: vi.fn(actual.getFips),
    setFips: vi.fn(actual.setFips),
  };
});

// ADR-006 §10: with --force-fips gone (wrong on RHEL), this assertion is the
// ONLY thing between us and silent non-FIPS operation — the GitLab Workhorse
// failure shape. Injectable getFips/logWarning so both FIPS states are
// testable in non-FIPS CI.
describe('assertFipsMode — §10 startup assertion', () => {
  it('FIPS_MODE=true + getFips()===0 throws, naming FIPS_MODE and the RHEL host-FIPS remedy (never --force-fips)', () => {
    expect.assertions(2);
    expect(() =>
      assertFipsMode({ fipsMode: 'true', getFips: () => 0 }),
    ).toThrow(REFUSAL_MESSAGE);
    expect(() =>
      assertFipsMode({ fipsMode: 'true', getFips: () => 0 }),
    ).toThrow(NO_FORCE_FIPS);
  });

  it('FIPS_MODE=true + getFips()===1 passes silently — no throw, no warning', () => {
    expect.assertions(1);
    const logWarning = vi.fn();
    assertFipsMode({ fipsMode: 'true', getFips: () => 1, logWarning });
    expect(logWarning).not.toHaveBeenCalled();
  });

  it('FIPS_MODE=false is a deliberate operator statement — no throw, no warning, and getFips is never consulted', () => {
    expect.assertions(2);
    const logWarning = vi.fn();
    const getFips = vi.fn(() => 0);
    assertFipsMode({ fipsMode: 'false', getFips, logWarning });
    expect(logWarning).not.toHaveBeenCalled();
    expect(getFips).not.toHaveBeenCalled();
  });

  it('FIPS_MODE unset logs the prominent no-assertion boot warning and does not throw (§10: silence is how Workhorse-class failures survive)', () => {
    expect.assertions(2);
    const logWarning = vi.fn();
    assertFipsMode({ fipsMode: undefined, getFips: () => 0, logWarning });
    expect(logWarning).toHaveBeenCalledTimes(1);
    expect(logWarning.mock.calls[0][0]).toMatch(UNSET_WARNING);
  });

  it('FIPS_MODE empty string behaves as unset — warning, no throw', () => {
    expect.assertions(1);
    const logWarning = vi.fn();
    assertFipsMode({ fipsMode: '', getFips: () => 0, logWarning });
    expect(logWarning).toHaveBeenCalledTimes(1);
  });

  it('an invalid FIPS_MODE value throws at startup (§9: out-of-range config never clamps silently)', () => {
    expect.assertions(1);
    expect(() => assertFipsMode({ fipsMode: 'yes' })).toThrow(
      PasswordHashError,
    );
  });

  it('the invalid-value message names the accepted values', () => {
    expect.assertions(1);
    expect(() => assertFipsMode({ fipsMode: 'enabled' })).toThrow(
      INVALID_VALUE,
    );
  });

  it('the default getFips seam reads crypto.getFips (namespace import) — both outcomes exercised', () => {
    expect.assertions(2);
    vi.mocked(nodeCrypto.getFips).mockReturnValueOnce(0);
    expect(() => assertFipsMode({ fipsMode: 'true' })).toThrow(
      REFUSAL_MESSAGE,
    );
    vi.mocked(nodeCrypto.getFips).mockReturnValueOnce(1);
    expect(() => assertFipsMode({ fipsMode: 'true' })).not.toThrow();
  });

  it('NEVER calls crypto.setFips — under --force-fips it is a native CHECK() abort, not a throw (§10)', () => {
    expect.assertions(1);
    const logWarning = vi.fn();
    assertFipsMode({ fipsMode: 'false', logWarning });
    assertFipsMode({ fipsMode: undefined, logWarning });
    assertFipsMode({ fipsMode: 'true', getFips: () => 1, logWarning });
    try {
      assertFipsMode({ fipsMode: 'true', getFips: () => 0, logWarning });
    } catch {
      // the refusal throw is the expected behavior under test elsewhere
    }
    expect(vi.mocked(nodeCrypto.setFips)).not.toHaveBeenCalled();
  });
});
