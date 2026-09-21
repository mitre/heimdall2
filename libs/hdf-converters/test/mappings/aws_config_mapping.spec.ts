import {is_control, NistControl, parse_nist} from 'inspecjs';
import {describe, expect, it} from 'vitest';
import {data as AwsConfigMappingData} from '../../src/mappings/AwsConfigMappingData';
import {AwsConfigMapping} from '../../src/mappings/AwsConfigMapping';

const mapping = new AwsConfigMapping();

/** Parse a NIST tag string into a NistControl (throws if it is not a control). */
function control(tag: string): NistControl {
  const parsed = parse_nist(tag);
  if (!is_control(parsed)) {
    throw new Error(`"${tag}" did not parse to a NIST control`);
  }
  return parsed;
}

/**
 * Mirrors how Heimdall filters/rolls up: a rule is reachable under `filterTag`
 * when the filter control contains (equals or is a parent of) one of the rule's
 * mapped tags -- see NistControl.compare_lineage in inspecjs/src/nist.ts.
 */
function reachableUnder(filterTag: string, ruleTags: string[]): boolean {
  const filter = control(filterTag);
  return ruleTags.some((t) => filter.contains(control(t)));
}

describe('AwsConfigMapping NIST sub-part expansion (issue #8458)', () => {
  it('splits collapsed sibling enhancements into their own tags', () => {
    // root-account-mfa-enabled carried the collapsed tag IA-2(1)(11).
    const tags = mapping.searchNIST(['ROOT_ACCOUNT_MFA_ENABLED']);
    expect(tags).toContain('IA-2(1)');
    expect(tags).toContain('IA-2(11)');
    expect(tags).not.toContain('IA-2(1)(11)');
  });

  it('makes every sibling enhancement reachable, not just the first', () => {
    // The core bug: IA-2(11) was unreachable because [IA,2,11] is not a
    // prefix of the flattened [IA,2,1,11]. Both must now be reachable.
    const tags = mapping.searchNIST(['ROOT_ACCOUNT_MFA_ENABLED']);
    expect(reachableUnder('IA-2(1)', tags)).toBe(true);
    expect(reachableUnder('IA-2(11)', tags)).toBe(true);
  });

  it('splits three collapsed enhancements (IA-2(1)(2)(11)) into siblings', () => {
    const tags = mapping.searchNIST(['MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS']);
    expect(tags).toEqual(
      expect.arrayContaining(['IA-2(1)', 'IA-2(2)', 'IA-2(11)'])
    );
    for (const t of ['IA-2(1)', 'IA-2(2)', 'IA-2(11)']) {
      expect(reachableUnder(t, tags)).toBe(true);
    }
  });

  it('splits collapsed statement parts into siblings (SI-4, AU-6, CA-7)', () => {
    const tags = mapping.searchNIST(['SECURITYHUB_ENABLED']);
    expect(tags).toEqual(
      expect.arrayContaining([
        'SI-4(a)',
        'SI-4(b)',
        'SI-4(c)',
        'AU-6(1)',
        'AU-6(3)',
        'CA-7(a)',
        'CA-7(b)'
      ])
    );
    expect(reachableUnder('SI-4(c)', tags)).toBe(true);
    expect(reachableUnder('AU-6(3)', tags)).toBe(true);
  });

  it('keeps the enhancement prefix on mixed enhancement+parts (IA-5(1)(a)(d)(e))', () => {
    const tags = mapping.searchNIST(['IAM_PASSWORD_POLICY']);
    expect(tags).toEqual(
      expect.arrayContaining(['IA-5(1)(a)', 'IA-5(1)(d)', 'IA-5(1)(e)'])
    );
    // The parts belong to enhancement (1), not to the base control, so the
    // wrong base-level parts must NOT appear.
    expect(tags).not.toContain('IA-5(a)');
    expect(tags).not.toContain('IA-5(d)');
    expect(tags).not.toContain('IA-5(e)');
  });

  it('leaves legitimately-nested single controls intact (AC-2(12)(a), CM-8(3)(a))', () => {
    // These are enhancement + its own statement part -- a single valid control,
    // already reachable via prefix match -- so they must NOT be split.
    const secHub = mapping.searchNIST(['SECURITYHUB_ENABLED']);
    expect(secHub).toContain('AC-2(12)(a)');
    expect(secHub).not.toContain('AC-2(a)');

    const allTags = new Set(
      AwsConfigMappingData.flatMap((m) => m['NIST-ID'].split('|'))
    );
    expect(allTags.has('CM-8(3)(a)')).toBe(true);
  });

  it('no longer stores any collapsed sibling token in the mapping data', () => {
    const collapsed = [
      'AU-2(a)(d)',
      'AU-12(a)(c)',
      'CA-7(a)(b)',
      'SI-4(a)(b)(c)',
      'AU-6(1)(3)',
      'IA-2(1)(11)',
      'IA-2(1)(2)(11)',
      'IA-5(1)(a)(d)(e)'
    ];
    const offenders = AwsConfigMappingData.filter((m) =>
      collapsed.some((c) => m['NIST-ID'].includes(c))
    ).map((m) => m.AwsConfigRuleName);
    expect(offenders).toEqual([]);
  });
});
