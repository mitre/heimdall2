import {
  updateChecklistPassthroughComments,
  updateDescriptionArray,
  updateStructuredChecklistComments
} from '@/store/data_store';
import {EvaluationFile} from '@/store/report_intake';
import {ContextualizedControl} from 'inspecjs';
import {describe, expect, it} from 'vitest';

function controlWithChecklistTags(): ContextualizedControl {
  return {
    data: {
      id: 'V-1',
      descriptions: [],
      tags: {
        rid: 'SV-1r1_rule',
        stig_id: 'APP-1',
        STIGRef: 'Application Security STIG'
      }
    },
    hdf: {
      descriptions: {},
      isProfile: false
    }
  } as unknown as ContextualizedControl;
}

describe('data store comment mapping', () => {
  it('updates OHDF control descriptions with comments', () => {
    const control = controlWithChecklistTags();

    updateDescriptionArray(control, 'review note');

    expect(control.hdf.descriptions.comments).toBeUndefined();
    expect(control.data.descriptions).toContainEqual({
      data: 'review note',
      label: 'comments'
    });
  });

  it('updates the COMMENTS section while preserving other CKL structured comment sections', () => {
    expect(
      updateStructuredChecklistComments(
        'FINDING_DETAILS :: existing finding\nCOMMENTS :: old comment\nSEVERITY_OVERRIDE :: Low',
        'review note'
      )
    ).toBe(
      'FINDING_DETAILS :: existing finding\nCOMMENTS :: review note\nSEVERITY_OVERRIDE :: Low'
    );
  });

  it('updates matching CKL passthrough comments without changing nonmatching vulns', () => {
    const control = controlWithChecklistTags();
    const matchingVuln = {
      vulnNum: 'V-1',
      ruleId: 'SV-1r1_rule',
      ruleVer: 'APP-1',
      stigRef: 'Application Security STIG',
      comments:
        'FINDING_DETAILS :: existing finding\nCOMMENTS :: old comment'
    };
    const nonmatchingVuln = {
      vulnNum: 'V-2',
      ruleId: 'SV-2r1_rule',
      comments: 'COMMENTS :: keep me'
    };
    const file = {
      evaluation: {
        data: {
          passthrough: {
            checklist: {
              stigs: [
                {
                  vulns: [matchingVuln, nonmatchingVuln]
                }
              ]
            }
          }
        }
      }
    } as unknown as EvaluationFile;

    updateChecklistPassthroughComments(file, control, 'review note');

    expect(matchingVuln.comments).toBe(
      'FINDING_DETAILS :: existing finding\nCOMMENTS :: review note'
    );
    expect(nonmatchingVuln.comments).toBe('COMMENTS :: keep me');
  });

  it('does not update CKL passthrough comments when fewer than two identifiers match', () => {
    const control = controlWithChecklistTags();
    const vuln = {
      vulnNum: 'V-1',
      ruleId: 'different-rule',
      ruleVer: 'different-stig',
      comments: 'COMMENTS :: keep me'
    };
    const file = {
      evaluation: {
        data: {
          passthrough: {
            checklist: {
              stigs: [
                {
                  vulns: [vuln]
                }
              ]
            }
          }
        }
      }
    } as unknown as EvaluationFile;

    updateChecklistPassthroughComments(file, control, 'review note');

    expect(vuln.comments).toBe('COMMENTS :: keep me');
  });
});
