import { type ExecJSON } from 'inspecjs';
import { describe, expect, it } from 'vitest';
import {
  type ChecklistVuln,
  Severity,
} from '../../src/ckl-mapper/checklist-jsonix-converter';
import { Severityoverride } from '../../src/ckl-mapper/checklistJsonix';
import {
  buildEditsMapFromProfiles,
  prepareEvaluationForCklExport,
  sanitizeCklSectionMarkers,
  setControlDescription,
  syncChecklistVulnComments,
} from '../../src/utils/description-editing';

describe('setControlDescription', () => {
  describe('array-form descriptions (evaluation controls)', () => {
    it('updates existing description by label', () => {
      const descriptions: ExecJSON.ControlDescription[] = [
        { data: 'Run the check', label: 'check' },
        { data: 'old comment', label: 'comments' },
        { data: 'Apply the fix', label: 'fix' },
      ];
      setControlDescription(descriptions, 'comments', 'new comment');
      expect(descriptions[1].data).toBe('new comment');
    });

    it('adds a new description when label does not exist', () => {
      const descriptions: ExecJSON.ControlDescription[] = [
        { data: 'Run the check', label: 'check' },
      ];
      setControlDescription(descriptions, 'comments', 'added comment');
      expect(descriptions).toHaveLength(2);
      expect(descriptions[1]).toEqual({
        data: 'added comment',
        label: 'comments',
      });
    });

    it('handles case-insensitive label matching', () => {
      const descriptions: ExecJSON.ControlDescription[] = [
        { data: 'old', label: 'Comments' },
      ];
      setControlDescription(descriptions, 'comments', 'new');
      expect(descriptions[0].data).toBe('new');
      expect(descriptions).toHaveLength(1);
    });

    it('handles empty descriptions array', () => {
      const descriptions: ExecJSON.ControlDescription[] = [];
      setControlDescription(descriptions, 'caveat', 'new caveat');
      expect(descriptions).toHaveLength(1);
      expect(descriptions[0]).toEqual({ data: 'new caveat', label: 'caveat' });
    });
  });

  describe('object-form descriptions (profile controls)', () => {
    it('updates existing property', () => {
      const descriptions: Record<string, string> = {
        check: 'Run the check',
        comments: 'old comment',
      };
      setControlDescription(descriptions, 'comments', 'new comment');
      expect(descriptions.comments).toBe('new comment');
    });

    it('adds a new property when key does not exist', () => {
      const descriptions: Record<string, string> = { check: 'Run the check' };
      setControlDescription(descriptions, 'justification', 'justified');
      expect(descriptions.justification).toBe('justified');
    });
  });
});

describe('sanitizeCklSectionMarkers', () => {
  it('returns plain text unchanged', () => {
    expect(sanitizeCklSectionMarkers('This is a normal comment')).toBe(
      'This is a normal comment',
    );
  });

  it('escapes CAVEAT :: marker in user text', () => {
    const result = sanitizeCklSectionMarkers('ok\nCAVEAT :: N/A per ISSO');
    expect(result).not.toContain('\nCAVEAT ::');
  });

  it('escapes JUSTIFICATION :: marker in user text', () => {
    const result = sanitizeCklSectionMarkers(
      'some text\nJUSTIFICATION :: not real',
    );
    expect(result).not.toContain('\nJUSTIFICATION ::');
  });

  it('escapes RATIONALE :: marker in user text', () => {
    const result = sanitizeCklSectionMarkers(
      'text\nRATIONALE :: fake rationale',
    );
    expect(result).not.toContain('\nRATIONALE ::');
  });

  it('escapes COMMENTS :: marker in user text', () => {
    const result = sanitizeCklSectionMarkers(
      'line1\nCOMMENTS :: duplicate section',
    );
    expect(result).not.toContain('\nCOMMENTS ::');
  });

  it('handles empty string', () => {
    expect(sanitizeCklSectionMarkers('')).toBe('');
  });

  it('does not escape markers that are not at the start of a line', () => {
    const text = 'Refer to CAVEAT :: section in the docs';
    expect(sanitizeCklSectionMarkers(text)).toBe(text);
  });
});

describe('syncChecklistVulnComments', () => {
  it('updates comments on matching vuln by vulnNum', () => {
    const vulns = [
      makeVuln({ ruleId: 'SV-12345r1_rule', vulnNum: 'V-12345' }),
      makeVuln({ ruleId: 'SV-67890r1_rule', vulnNum: 'V-67890' }),
    ];
    const edits = new Map([['V-12345', { comments: 'updated comment' }]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toBe('COMMENTS :: updated comment');
    expect(vulns[1].comments).toBe('');
  });

  it('preserves existing structured comments (CAVEAT, JUSTIFICATION) when updating COMMENTS section', () => {
    const vulns = [
      makeVuln({
        comments: 'CAVEAT :: existing caveat\nCOMMENTS :: old comment',
        ruleId: 'SV-12345r1_rule',
        vulnNum: 'V-12345',
      }),
    ];
    const edits = new Map([['V-12345', { comments: 'new comment' }]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toContain('CAVEAT :: existing caveat');
    expect(vulns[0].comments).toContain('COMMENTS :: new comment');
    expect(vulns[0].comments).not.toContain('old comment');
  });

  it('adds COMMENTS section when none existed in structured comments', () => {
    const vulns = [
      makeVuln({
        comments: 'CAVEAT :: some caveat',
        ruleId: 'SV-12345r1_rule',
        vulnNum: 'V-12345',
      }),
    ];
    const edits = new Map([['V-12345', { comments: 'brand new' }]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toContain('CAVEAT :: some caveat');
    expect(vulns[0].comments).toContain('COMMENTS :: brand new');
  });

  it('removes COMMENTS section when value is empty', () => {
    const vulns = [
      makeVuln({
        comments: 'CAVEAT :: caveat\nCOMMENTS :: to be removed',
        ruleId: 'SV-12345r1_rule',
        vulnNum: 'V-12345',
      }),
    ];
    const edits = new Map([['V-12345', { comments: '' }]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toBe('CAVEAT :: caveat');
    expect(vulns[0].comments).not.toContain('COMMENTS');
  });

  it('handles plain (non-structured) comments by replacing entirely', () => {
    const vulns = [
      makeVuln({
        comments: 'just a plain comment',
        ruleId: 'SV-12345r1_rule',
        vulnNum: 'V-12345',
      }),
    ];
    const edits = new Map([['V-12345', { comments: 'replaced' }]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toBe('COMMENTS :: replaced');
  });

  it('sanitizes section markers in user text before writing', () => {
    const vulns = [
      makeVuln({ ruleId: 'SV-12345r1_rule', vulnNum: 'V-12345' }),
    ];
    const edits = new Map([
      ['V-12345', { comments: 'ok\nCAVEAT :: injected' }],
    ]);

    syncChecklistVulnComments(vulns, edits);

    const result = vulns[0].comments ?? '';
    const caveatCount = (result.match(/CAVEAT ::/gv) || []).length;
    expect(caveatCount).toBe(0);
  });

  it('does not modify vulns with no matching edits', () => {
    const vulns = [
      makeVuln({
        comments: 'original',
        ruleId: 'SV-12345r1_rule',
        vulnNum: 'V-12345',
      }),
    ];
    const edits = new Map([['V-99999', { comments: 'should not apply' }]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toBe('original');
  });

  it('updates multiple description fields (caveat + comments)', () => {
    const vulns = [
      makeVuln({
        comments: 'CAVEAT :: old caveat\nCOMMENTS :: old comment',
        ruleId: 'SV-12345r1_rule',
        vulnNum: 'V-12345',
      }),
    ];
    const edits = new Map([
      ['V-12345', { caveat: 'new caveat', comments: 'new comment' }],
    ]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toContain('CAVEAT :: new caveat');
    expect(vulns[0].comments).toContain('COMMENTS :: new comment');
    expect(vulns[0].comments).not.toContain('old');
  });
});

describe('buildEditsMapFromProfiles', () => {
  it('extracts description fields from profiles for matching vulns', () => {
    const profiles: ExecJSON.Profile[] = [
      {
        attributes: [],
        controls: [
          {
            desc: '',
            descriptions: [
              { data: 'reviewer note', label: 'comments' },
              { data: 'applies only to prod', label: 'caveat' },
            ],
            id: 'V-2255',
            impact: 0.5,
            refs: [],
            results: [],
            source_location: {},
            tags: {},
            title: 'Test',
          },
        ],
        groups: [],
        name: 'test',
        sha256: 'abc',
        supports: [],
        version: '1.0',
      },
    ];
    const vulnNums = ['V-2255', 'V-9999'];

    const edits = buildEditsMapFromProfiles(profiles, vulnNums);

    expect(edits.size).toBe(1);
    expect(edits.has('V-2255')).toBe(true);
    expect(edits.get('V-2255')?.comments).toBe('reviewer note');
    expect(edits.get('V-2255')?.caveat).toBe('applies only to prod');
    expect(edits.has('V-9999')).toBe(false);
  });

  it('skips controls with no edited description fields', () => {
    const profiles: ExecJSON.Profile[] = [
      {
        attributes: [],
        controls: [
          {
            desc: '',
            descriptions: [],
            id: 'V-2255',
            impact: 0.5,
            refs: [],
            results: [],
            source_location: {},
            tags: {},
            title: 'Test',
          },
        ],
        groups: [],
        name: 'test',
        sha256: 'abc',
        supports: [],
        version: '1.0',
      },
    ];

    const edits = buildEditsMapFromProfiles(profiles, ['V-2255']);
    expect(edits.size).toBe(0);
  });

  it('handles case-insensitive control ID matching', () => {
    const profiles: ExecJSON.Profile[] = [
      {
        attributes: [],
        controls: [
          {
            desc: '',
            descriptions: [{ data: 'test', label: 'comments' }],
            id: 'v-2255',
            impact: 0.5,
            refs: [],
            results: [],
            source_location: {},
            tags: {},
            title: 'Test',
          },
        ],
        groups: [],
        name: 'test',
        sha256: 'abc',
        supports: [],
        version: '1.0',
      },
    ];

    const edits = buildEditsMapFromProfiles(profiles, ['V-2255']);
    expect(edits.size).toBe(1);
    expect(edits.has('V-2255')).toBe(true);
  });
});

describe('prepareEvaluationForCklExport', () => {
  it('returns a deep clone — original is NOT mutated', () => {
    const original: ExecJSON.Execution = {
      platform: { name: 'test', release: '1.0' },
      profiles: [{
        attributes: [],
        controls: [{
          desc: '',
          descriptions: [{ data: 'original comment', label: 'comments' }],
          id: 'V-2255',
          impact: 0.5,
          refs: [],
          results: [{ code_desc: 'Manual review', status: 'skipped' }],
          source_location: {},
          tags: {},
          title: 'Test',
        }],
        groups: [],
        name: 'test-profile',
        sha256: 'abc',
        supports: [],
        version: '1.0',
      }],
      statistics: { duration: 0 },
      version: '4.0',
    };

    const snapshot = JSON.parse(JSON.stringify(original));

    const clone = prepareEvaluationForCklExport(original, []);
    expect(JSON.parse(JSON.stringify(original))).toEqual(snapshot);
    expect(clone).not.toBe(original);
  });

  it('applies attestations to the clone', () => {
    const original: ExecJSON.Execution = {
      platform: { name: 'test', release: '1.0' },
      profiles: [{
        attributes: [],
        controls: [{
          desc: '',
          descriptions: [],
          id: 'V-2255',
          impact: 0.5,
          refs: [],
          results: [{ code_desc: 'Manual review', status: 'skipped' }],
          source_location: {},
          tags: {},
          title: 'Test',
        }],
        groups: [],
        name: 'test-profile',
        sha256: 'abc',
        supports: [],
        version: '1.0',
      }],
      statistics: { duration: 0 },
      version: '4.0',
    };

    const attestations = [{
      control_id: 'V-2255',
      explanation: 'Verified',
      frequency: 'annually',
      status: 'passed' as const,
      updated: '2026-06-17T00:00:00Z',
      updated_by: 'test@example.com',
    }];

    const clone = prepareEvaluationForCklExport(original, attestations);
    const control = clone.profiles[0].controls[0];
    expect(control.attestation_data).toBeDefined();
    expect(control.results.length).toBe(2);
  });

  it('syncs passthrough vuln comments from description edits', () => {
    const original: ExecJSON.Execution = {
      passthrough: { checklist: { stigs: [{ vulns: [makeVuln({ comments: '', vulnNum: 'V-2255' })] }] } },
      platform: { name: 'test', release: '1.0' },
      profiles: [{
        attributes: [],
        controls: [{
          desc: '',
          descriptions: [{ data: 'edited comment', label: 'comments' }],
          id: 'V-2255',
          impact: 0.5,
          refs: [],
          results: [{ code_desc: 'Manual review', status: 'skipped' }],
          source_location: {},
          tags: {},
          title: 'Test',
        }],
        groups: [],
        name: 'test-profile',
        sha256: 'abc',
        supports: [],
        version: '1.0',
      }],
      statistics: { duration: 0 },
      version: '4.0',
    } as ExecJSON.Execution & { passthrough: unknown };

    const clone = prepareEvaluationForCklExport(original, []);
    const passthrough = (clone as any).passthrough;
    expect(passthrough.checklist.stigs[0].vulns[0].comments).toContain(
      'COMMENTS :: edited comment',
    );
  });
});

function makeVuln(
  overrides: Partial<{ comments: string; ruleId: string; vulnNum: string }>,
): ChecklistVuln {
  return {
    cciRef: '',
    checkContent: '',
    checkContentRef: 'M',
    class: 'Unclass',
    comments: overrides.comments ?? '',
    documentable: 'false',
    falseNegatives: '',
    falsePositives: '',
    findingdetails: '',
    fixText: '',
    groupTitle: '',
    iaControls: '',
    legacyId: '',
    mitigationControl: '',
    mitigations: '',
    potentialImpact: '',
    responsibility: '',
    ruleId: overrides.ruleId ?? '',
    ruleTitle: '',
    ruleVer: '',
    securityOverrideGuidance: '',
    severity: Severity.Empty,
    severityjustification: '',
    severityoverride: Severityoverride.Empty,
    status: 'Not Reviewed' as ChecklistVuln['status'],
    stigRef: '',
    stigUuid: '',
    targetKey: '',
    thirdPartyTools: '',
    vulnDiscuss: '',
    vulnNum: overrides.vulnNum ?? 'V-00000',
    weight: '10.0',
  };
}
