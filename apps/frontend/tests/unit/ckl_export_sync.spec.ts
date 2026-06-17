import {describe, expect, it} from 'vitest';
import {
  syncChecklistVulnComments,
  buildEditsMapFromProfiles
} from '@mitre/hdf-converters';
import type {ExecJSON} from 'inspecjs';

/**
 * Frontend integration tests for CKL export-time sync (ADR §5.4.2).
 * The core functions live in hdf-converters and are tested there (24 tests).
 * These tests verify the functions are importable from the frontend context
 * and work end-to-end: build edits map → sync to vulns.
 */

describe('CKL export sync — frontend integration (ADR §5.4.2)', () => {
  it('buildEditsMapFromProfiles is importable and returns correct map', () => {
    const profiles: ExecJSON.Profile[] = [
      {
        name: 'test',
        version: '1.0',
        sha256: 'abc',
        supports: [],
        attributes: [],
        groups: [],
        controls: [
          {
            id: 'V-2255',
            title: 'Test',
            desc: '',
            impact: 0.5,
            tags: {},
            descriptions: [{label: 'comments', data: 'reviewer note'}],
            refs: [],
            source_location: {},
            results: []
          }
        ]
      }
    ];

    const edits = buildEditsMapFromProfiles(profiles, ['V-2255']);
    expect(edits.size).toBe(1);
    expect(edits.get('V-2255')?.comments).toBe('reviewer note');
  });

  it('end-to-end: build edits → sync to vuln comments', () => {
    const profiles: ExecJSON.Profile[] = [
      {
        name: 'test',
        version: '1.0',
        sha256: 'abc',
        supports: [],
        attributes: [],
        groups: [],
        controls: [
          {
            id: 'V-2255',
            title: 'Test',
            desc: '',
            impact: 0.5,
            tags: {},
            descriptions: [{label: 'comments', data: 'edited comment'}],
            refs: [],
            source_location: {},
            results: []
          }
        ]
      }
    ];

    const vulns = [{vulnNum: 'V-2255', comments: ''}];
    const edits = buildEditsMapFromProfiles(profiles, ['V-2255']);

    syncChecklistVulnComments(vulns as any, edits);

    expect(vulns[0].comments).toContain('COMMENTS :: edited comment');
  });
});
