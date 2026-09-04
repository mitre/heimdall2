import {afterEach, describe, expect, it, vi} from 'vitest';
import {impactMapping} from '../../src/base-converter';

const MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['low', 0.3],
  ['none', 0.0]
]);

// This project runs tests concurrently (vitest.config.ts sequence.concurrent);
// these tests spy on the shared console, so they must run sequentially.
describe.sequential('impactMapping', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the mapped value exactly for known severities, case-insensitively', () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue();
    const mapper = impactMapping(MAPPING);
    expect(mapper('critical')).toBe(0.9);
    expect(mapper('HIGH')).toBe(0.7);
    expect(mapper('Low')).toBe(0.3);
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns a legitimate mapped 0.0 with no warning', () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue();
    expect(impactMapping(MAPPING)('none')).toBe(0.0);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns and returns the 0.5 default for an unmapped severity', () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue();
    expect(impactMapping(MAPPING)('unassigned')).toBe(0.5);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('unassigned');
    expect(warn.mock.calls[0][0]).toContain('0.5');
  });

  it('warns and returns the default for a non-string, non-number severity', () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue();
    expect(impactMapping(MAPPING)(undefined)).toBe(0.5);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('honors a caller-supplied default value', () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue();
    expect(impactMapping(MAPPING, 0.3)('mystery')).toBe(0.3);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('0.3');
  });

  it('warns once per distinct unmapped severity, not once per finding', () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue();
    const mapper = impactMapping(MAPPING);
    mapper('unassigned');
    mapper('unassigned');
    mapper('unassigned');
    mapper('unimportant');
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
