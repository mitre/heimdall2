import {
  buildEditsMapFromProfiles,
  syncChecklistVulnComments,
} from '@mitre/hdf-converters';
import type { ExecJSON } from 'inspecjs';
import { describe, expect, it } from 'vitest';

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
        attributes: [],
        controls: [
          {
            desc: '',
            descriptions: [{ data: 'reviewer note', label: 'comments' }],
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
    expect(edits.size).toBe(1);
    expect(edits.get('V-2255')?.comments).toBe('reviewer note');
  });

  it('end-to-end: build edits → sync to vuln comments', () => {
    const profiles: ExecJSON.Profile[] = [
      {
        attributes: [],
        controls: [
          {
            desc: '',
            descriptions: [{ data: 'edited comment', label: 'comments' }],
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

    const vulns = [{ comments: '', vulnNum: 'V-2255' }];
    const edits = buildEditsMapFromProfiles(profiles, ['V-2255']);

    syncChecklistVulnComments(vulns as any, edits);

    expect(vulns[0].comments).toContain('COMMENTS :: edited comment');
  });
});
