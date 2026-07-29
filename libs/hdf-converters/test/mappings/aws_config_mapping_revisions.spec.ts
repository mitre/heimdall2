import {describe, expect, it} from 'vitest';
import {data as AwsConfigMappingData} from '../../src/mappings/AwsConfigMappingData';
import {
  AwsConfigMapping,
  AwsConfigRev
} from '../../src/mappings/AwsConfigMapping';

const rev4 = new AwsConfigMapping(4);
const rev5 = new AwsConfigMapping(5);

/** The table's own row for a rule at a revision, as the tags it should yield. */
function tableTags(ruleName: string, rev: AwsConfigRev): string[] {
  const row = AwsConfigMappingData.find(
    (m) => m.AwsConfigRuleName === ruleName && m.Rev === rev
  );
  if (row === undefined) {
    throw new Error(`no Rev ${rev} row for ${ruleName}`);
  }
  return row['NIST-ID'].split('|');
}

describe('AwsConfigMapping revision selection', () => {
  it('defaults to Rev 4, so existing callers keep the tags they had', () => {
    expect(new AwsConfigMapping().rev).toBe(4);
    expect(
      new AwsConfigMapping().searchNIST(['ROOT_ACCOUNT_MFA_ENABLED'])
    ).toEqual(rev4.searchNIST(['ROOT_ACCOUNT_MFA_ENABLED']));
  });

  it('returns each revision its own controls for the same rule', () => {
    const tags4 = rev4.searchNIST(['ROOT_ACCOUNT_MFA_ENABLED']);
    const tags5 = rev5.searchNIST(['ROOT_ACCOUNT_MFA_ENABLED']);

    // Rev 5 folded IA-2(11) into IA-2(2)/IA-2(6), and Rev 4 statement letters
    // (AC-2(j)) have no Rev 5 counterpart. The two sets must not be conflated.
    expect(tags4).toEqual(expect.arrayContaining(['AC-2(j)', 'IA-2(11)']));
    expect(tags5).not.toContain('IA-2(11)');
    expect(tags5).toEqual(expect.arrayContaining(['IA-2(6)', 'IA-2(8)']));
  });

  it('takes a per-lookup revision override', () => {
    expect(rev4.searchNIST(['ROOT_ACCOUNT_MFA_ENABLED'], 5)).toEqual(
      rev5.searchNIST(['ROOT_ACCOUNT_MFA_ENABLED'])
    );
    expect(rev5.searchNIST(['ROOT_ACCOUNT_MFA_ENABLED'], 4)).toEqual(
      rev4.searchNIST(['ROOT_ACCOUNT_MFA_ENABLED'])
    );
  });

  it('exposes the selected revision through the public lookup fields', () => {
    expect(rev5.awsConfigRuleNameMappings['root-account-mfa-enabled']).toEqual(
      tableTags('root-account-mfa-enabled', 5)
    );
    expect(
      rev4.awsConfigRuleSourceIdentifierMappings['ROOT_ACCOUNT_MFA_ENABLED']
    ).toEqual(tableTags('root-account-mfa-enabled', 4));
  });

  it('carries both revisions for every rule in the table', () => {
    const revsByRule = new Map<string, Set<number>>();
    for (const row of AwsConfigMappingData) {
      const revs = revsByRule.get(row.AwsConfigRuleName) ?? new Set<number>();
      revs.add(row.Rev);
      revsByRule.set(row.AwsConfigRuleName, revs);
    }
    const incomplete = [...revsByRule]
      .filter(([, revs]) => !(revs.has(4) && revs.has(5)))
      .map(([rule]) => rule);
    expect(incomplete).toEqual([]);
  });

  it('resolves every rule under both revisions, losing none to key collisions', () => {
    // The regression this guards: a single flat lookup let the Rev 4 and Rev 5
    // rows for a rule overwrite each other, so one revision returned nothing.
    for (const rev of [4, 5] as AwsConfigRev[]) {
      const mapping = new AwsConfigMapping(rev);
      const unresolved = AwsConfigMappingData.filter(
        (m) => m.Rev === rev
      ).filter((m) => {
        const found = mapping.searchNIST([m.AwsConfigRuleSourceIdentifier]);
        return !m['NIST-ID'].split('|').every((tag) => found.includes(tag));
      });
      expect(unresolved.map((m) => m.AwsConfigRuleName)).toEqual([]);
    }
  });
});
