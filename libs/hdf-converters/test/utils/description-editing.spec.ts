import {ExecJSON} from 'inspecjs';
import {describe, expect, it} from 'vitest';
import {Severityoverride} from '../../src/ckl-mapper/checklistJsonix';
import {
  ChecklistVuln,
  Severity
} from '../../src/ckl-mapper/checklist-jsonix-converter';
import {
  setControlDescription,
  sanitizeCklSectionMarkers,
  syncChecklistVulnComments
} from '../../src/utils/description-editing';

describe('setControlDescription', () => {
  describe('array-form descriptions (evaluation controls)', () => {
    it('updates existing description by label', () => {
      const descriptions: ExecJSON.ControlDescription[] = [
        {label: 'check', data: 'Run the check'},
        {label: 'comments', data: 'old comment'},
        {label: 'fix', data: 'Apply the fix'}
      ];
      setControlDescription(descriptions, 'comments', 'new comment');
      expect(descriptions[1].data).toBe('new comment');
    });

    it('adds a new description when label does not exist', () => {
      const descriptions: ExecJSON.ControlDescription[] = [
        {label: 'check', data: 'Run the check'}
      ];
      setControlDescription(descriptions, 'comments', 'added comment');
      expect(descriptions).toHaveLength(2);
      expect(descriptions[1]).toEqual({
        label: 'comments',
        data: 'added comment'
      });
    });

    it('handles case-insensitive label matching', () => {
      const descriptions: ExecJSON.ControlDescription[] = [
        {label: 'Comments', data: 'old'}
      ];
      setControlDescription(descriptions, 'comments', 'new');
      expect(descriptions[0].data).toBe('new');
      expect(descriptions).toHaveLength(1);
    });

    it('handles empty descriptions array', () => {
      const descriptions: ExecJSON.ControlDescription[] = [];
      setControlDescription(descriptions, 'caveat', 'new caveat');
      expect(descriptions).toHaveLength(1);
      expect(descriptions[0]).toEqual({label: 'caveat', data: 'new caveat'});
    });
  });

  describe('object-form descriptions (profile controls)', () => {
    it('updates existing property', () => {
      const descriptions: Record<string, string> = {
        check: 'Run the check',
        comments: 'old comment'
      };
      setControlDescription(descriptions, 'comments', 'new comment');
      expect(descriptions.comments).toBe('new comment');
    });

    it('adds a new property when key does not exist', () => {
      const descriptions: Record<string, string> = {
        check: 'Run the check'
      };
      setControlDescription(descriptions, 'justification', 'justified');
      expect(descriptions.justification).toBe('justified');
    });
  });
});

describe('sanitizeCklSectionMarkers', () => {
  it('returns plain text unchanged', () => {
    expect(sanitizeCklSectionMarkers('This is a normal comment')).toBe(
      'This is a normal comment'
    );
  });

  it('escapes CAVEAT :: marker in user text', () => {
    const result = sanitizeCklSectionMarkers('ok\nCAVEAT :: N/A per ISSO');
    expect(result).not.toContain('\nCAVEAT ::');
  });

  it('escapes JUSTIFICATION :: marker in user text', () => {
    const result = sanitizeCklSectionMarkers(
      'some text\nJUSTIFICATION :: not real'
    );
    expect(result).not.toContain('\nJUSTIFICATION ::');
  });

  it('escapes RATIONALE :: marker in user text', () => {
    const result = sanitizeCklSectionMarkers(
      'text\nRATIONALE :: fake rationale'
    );
    expect(result).not.toContain('\nRATIONALE ::');
  });

  it('escapes COMMENTS :: marker in user text', () => {
    const result = sanitizeCklSectionMarkers(
      'line1\nCOMMENTS :: duplicate section'
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
      makeVuln({vulnNum: 'V-12345', ruleId: 'SV-12345r1_rule'}),
      makeVuln({vulnNum: 'V-67890', ruleId: 'SV-67890r1_rule'})
    ];
    const edits = new Map([['V-12345', {comments: 'updated comment'}]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toBe('COMMENTS :: updated comment');
    expect(vulns[1].comments).toBe('');
  });

  it('preserves existing structured comments (CAVEAT, JUSTIFICATION) when updating COMMENTS section', () => {
    const vulns = [
      makeVuln({
        vulnNum: 'V-12345',
        ruleId: 'SV-12345r1_rule',
        comments: 'CAVEAT :: existing caveat\nCOMMENTS :: old comment'
      })
    ];
    const edits = new Map([['V-12345', {comments: 'new comment'}]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toContain('CAVEAT :: existing caveat');
    expect(vulns[0].comments).toContain('COMMENTS :: new comment');
    expect(vulns[0].comments).not.toContain('old comment');
  });

  it('adds COMMENTS section when none existed in structured comments', () => {
    const vulns = [
      makeVuln({
        vulnNum: 'V-12345',
        ruleId: 'SV-12345r1_rule',
        comments: 'CAVEAT :: some caveat'
      })
    ];
    const edits = new Map([['V-12345', {comments: 'brand new'}]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toContain('CAVEAT :: some caveat');
    expect(vulns[0].comments).toContain('COMMENTS :: brand new');
  });

  it('removes COMMENTS section when value is empty', () => {
    const vulns = [
      makeVuln({
        vulnNum: 'V-12345',
        ruleId: 'SV-12345r1_rule',
        comments: 'CAVEAT :: caveat\nCOMMENTS :: to be removed'
      })
    ];
    const edits = new Map([['V-12345', {comments: ''}]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toBe('CAVEAT :: caveat');
    expect(vulns[0].comments).not.toContain('COMMENTS');
  });

  it('handles plain (non-structured) comments by replacing entirely', () => {
    const vulns = [
      makeVuln({
        vulnNum: 'V-12345',
        ruleId: 'SV-12345r1_rule',
        comments: 'just a plain comment'
      })
    ];
    const edits = new Map([['V-12345', {comments: 'replaced'}]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toBe('COMMENTS :: replaced');
  });

  it('sanitizes section markers in user text before writing', () => {
    const vulns = [
      makeVuln({vulnNum: 'V-12345', ruleId: 'SV-12345r1_rule'})
    ];
    const edits = new Map([
      ['V-12345', {comments: 'ok\nCAVEAT :: injected'}]
    ]);

    syncChecklistVulnComments(vulns, edits);

    const result = vulns[0].comments ?? '';
    const caveatCount = (result.match(/CAVEAT ::/g) || []).length;
    expect(caveatCount).toBe(0);
  });

  it('does not modify vulns with no matching edits', () => {
    const vulns = [
      makeVuln({
        vulnNum: 'V-12345',
        ruleId: 'SV-12345r1_rule',
        comments: 'original'
      })
    ];
    const edits = new Map([['V-99999', {comments: 'should not apply'}]]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toBe('original');
  });

  it('updates multiple description fields (caveat + comments)', () => {
    const vulns = [
      makeVuln({
        vulnNum: 'V-12345',
        ruleId: 'SV-12345r1_rule',
        comments: 'CAVEAT :: old caveat\nCOMMENTS :: old comment'
      })
    ];
    const edits = new Map([
      ['V-12345', {comments: 'new comment', caveat: 'new caveat'}]
    ]);

    syncChecklistVulnComments(vulns, edits);

    expect(vulns[0].comments).toContain('CAVEAT :: new caveat');
    expect(vulns[0].comments).toContain('COMMENTS :: new comment');
    expect(vulns[0].comments).not.toContain('old');
  });
});

function makeVuln(
  overrides: Partial<{vulnNum: string; ruleId: string; comments: string}>
): ChecklistVuln {
  return {
    status: 'Not Reviewed' as ChecklistVuln['status'],
    vulnNum: overrides.vulnNum ?? 'V-00000',
    severity: Severity.Empty,
    groupTitle: '',
    ruleId: overrides.ruleId ?? '',
    ruleVer: '',
    ruleTitle: '',
    vulnDiscuss: '',
    iaControls: '',
    checkContent: '',
    fixText: '',
    falsePositives: '',
    falseNegatives: '',
    documentable: 'false',
    mitigations: '',
    potentialImpact: '',
    thirdPartyTools: '',
    mitigationControl: '',
    responsibility: '',
    securityOverrideGuidance: '',
    checkContentRef: 'M',
    weight: '10.0',
    class: 'Unclass',
    stigRef: '',
    targetKey: '',
    stigUuid: '',
    legacyId: '',
    cciRef: '',
    comments: overrides.comments ?? '',
    findingdetails: '',
    severityjustification: '',
    severityoverride: Severityoverride.Empty
  };
}
