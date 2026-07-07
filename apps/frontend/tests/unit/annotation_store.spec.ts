import { ControlAttestationStatus } from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnotationModule } from '@/store/annotation_store';
import { InspecDataModule } from '@/store/data_store';

const mockSaveAs = vi.fn();
vi.mock('file-saver', () => ({ saveAs: (...args: unknown[]) => mockSaveAs(...args) }));

function addTestAttestation(
  fileId: string,
  controlId: string,
  overrides?: Partial<{
    explanation: string;
    frequency: string;
    originalStatuses: Record<string, string>;
    status: 'failed' | 'passed';
    updatedBy: string;
  }>,
) {
  return AnnotationModule.addAttestation({
    controlId,
    explanation: overrides?.explanation ?? 'Test attestation',
    fileId,
    frequency: overrides?.frequency ?? 'annually',
    originalStatuses: overrides?.originalStatuses,
    status: overrides?.status ?? 'passed',
    updatedBy: overrides?.updatedBy ?? 'test@example.com',
  });
}

function uniqueFileId(suffix: string): string {
  return `test-file-${Date.now()}-${suffix}`;
}

describe('annotation_store', () => {
  beforeEach(() => {
    mockSaveAs.mockClear();
  });

  describe('attestation management', () => {
    it('addAttestation stores record and hasAttestation returns true via O(1) index', () => {
      const fileId = uniqueFileId('attest-1');
      const controlId = 'V-2255';

      addTestAttestation(fileId, controlId, { explanation: 'Verified manually' });

      expect(AnnotationModule.hasAttestation(fileId, controlId)).toBe(true);
      expect(AnnotationModule.hasAttestation(fileId, 'V-9999')).toBe(false);
    });

    it('addAttestation overwrites existing attestation for same control (upsert)', () => {
      const fileId = uniqueFileId('attest-upsert');
      const controlId = 'V-2256';

      addTestAttestation(fileId, controlId, { explanation: 'First attestation' });

      addTestAttestation(fileId, controlId, {
        explanation: 'Updated attestation',
        frequency: 'quarterly',
        status: 'failed',
      });

      const attestations = AnnotationModule.attestationsForFile(fileId);
      expect(attestations).toHaveLength(1);
      expect(attestations[0].explanation).toBe('Updated attestation');
      expect(attestations[0].status).toBe(ControlAttestationStatus.Failed);
    });

    it('removeAttestation removes record and updates index', () => {
      const fileId = uniqueFileId('attest-remove');
      const controlId = 'V-2257';

      addTestAttestation(fileId, controlId, { explanation: 'Will be removed' });

      expect(AnnotationModule.hasAttestation(fileId, controlId)).toBe(true);

      AnnotationModule.removeAttestation({ controlId, fileId });

      expect(AnnotationModule.hasAttestation(fileId, controlId)).toBe(false);
      expect(AnnotationModule.attestationsForFile(fileId)).toHaveLength(0);
    });

    it('attestationCount returns total across all files', () => {
      const fileA = uniqueFileId('count-a');
      const fileB = uniqueFileId('count-b');
      const baseCount = AnnotationModule.attestationCount;

      addTestAttestation(fileA, 'V-1001', { explanation: 'Test A' });
      addTestAttestation(fileB, 'V-1002', { explanation: 'Test B', frequency: 'quarterly', status: 'failed' });

      expect(AnnotationModule.attestationCount).toBe(baseCount + 2);
    });

    it('attestationsForFile returns empty array for unknown file', () => {
      expect(AnnotationModule.attestationsForFile('nonexistent-file')).toEqual(
        [],
      );
    });
  });

  describe('comment management', () => {
    it('addComment appends entry and hasComments returns true via O(1) index', () => {
      const fileId = uniqueFileId('comment-1');
      const controlId = 'V-3001';

      AnnotationModule.addComment({
        comment: {
          control_id: controlId,
          text: 'Needs documentation',
          updated: '2026-06-16T21:00:00Z',
          updated_by: 'reviewer@example.com',
        },
        fileId,
      });

      expect(AnnotationModule.hasComments(fileId, controlId)).toBe(true);
      expect(AnnotationModule.hasComments(fileId, 'V-9999')).toBe(false);
    });

    it('addComment is append-only — multiple comments accumulate', () => {
      const fileId = uniqueFileId('comment-append');
      const controlId = 'V-3002';

      AnnotationModule.addComment({
        comment: {
          control_id: controlId,
          text: 'First comment',
          updated: '2026-06-16T21:00:00Z',
          updated_by: 'reviewer1@example.com',
        },
        fileId,
      });

      AnnotationModule.addComment({
        comment: {
          control_id: controlId,
          text: 'Second comment',
          updated: '2026-06-16T22:00:00Z',
          updated_by: 'reviewer2@example.com',
        },
        fileId,
      });

      const comments = AnnotationModule.commentsForControl(fileId, controlId);
      expect(comments).toHaveLength(2);
      expect(comments[0].text).toBe('First comment');
      expect(comments[1].text).toBe('Second comment');
    });

    it('hasComments returns false for unknown control', () => {
      expect(AnnotationModule.hasComments('unknown-file', 'V-0000')).toBe(
        false,
      );
    });

    it('commentCount returns total across all files', () => {
      const fileA = uniqueFileId('ccount-a');
      const fileB = uniqueFileId('ccount-b');
      const baseCount = AnnotationModule.commentCount;

      AnnotationModule.addComment({
        comment: {
          control_id: 'V-4001',
          text: 'Comment A',
          updated: '2026-06-16T21:00:00Z',
          updated_by: 'test@example.com',
        },
        fileId: fileA,
      });

      AnnotationModule.addComment({
        comment: {
          control_id: 'V-4002',
          text: 'Comment B',
          updated: '2026-06-16T22:00:00Z',
          updated_by: 'test@example.com',
        },
        fileId: fileB,
      });

      expect(AnnotationModule.commentCount).toBe(baseCount + 2);
    });

    it('commentsForControl returns empty array for unknown control', () => {
      expect(
        AnnotationModule.commentsForControl('unknown-file', 'V-0000'),
      ).toEqual([]);
    });
  });

  describe('file-level operations', () => {
    it('pendingFiles returns FileIDs with any annotations', () => {
      const fileId = uniqueFileId('pending');

      addTestAttestation(fileId, 'V-5001', { explanation: 'Pending test' });

      expect(AnnotationModule.pendingFiles).toContain(fileId);
    });

    it('clearFileAnnotations removes all data for a file', () => {
      const fileId = uniqueFileId('clear');

      addTestAttestation(fileId, 'V-6001', { explanation: 'Will be cleared' });

      AnnotationModule.addComment({
        comment: {
          control_id: 'V-6002',
          text: 'Will be cleared',
          updated: '2026-06-16T21:00:00Z',
          updated_by: 'test@example.com',
        },
        fileId,
      });

      expect(AnnotationModule.hasAttestation(fileId, 'V-6001')).toBe(true);
      expect(AnnotationModule.hasComments(fileId, 'V-6002')).toBe(true);

      AnnotationModule.clearFileAnnotations(fileId);

      expect(AnnotationModule.hasAttestation(fileId, 'V-6001')).toBe(false);
      expect(AnnotationModule.hasComments(fileId, 'V-6002')).toBe(false);
      expect(AnnotationModule.attestationsForFile(fileId)).toEqual([]);
      expect(AnnotationModule.pendingFiles).not.toContain(fileId);
    });

    it('annotationsForFile returns undefined for unknown file', () => {
      expect(
        AnnotationModule.annotationsForFile('nonexistent-file-id'),
      ).toBeUndefined();
    });
  });

  describe('originalStatuses', () => {
    it('captures original status on first annotation for a file', () => {
      const fileId = uniqueFileId('orig-status');

      addTestAttestation(fileId, 'V-7001', {
        explanation: 'First annotation',
        originalStatuses: { 'V-7001': 'Not Reviewed', 'V-7002': 'Passed' },
      });

      const state = AnnotationModule.annotationsForFile(fileId);
      expect(state).toBeDefined();
      expect(state!.originalStatuses['V-7001']).toBe('Not Reviewed');
      expect(state!.originalStatuses['V-7002']).toBe('Passed');
    });

    it('does not overwrite originalStatuses on subsequent annotations', () => {
      const fileId = uniqueFileId('orig-no-overwrite');

      addTestAttestation(fileId, 'V-8001', {
        explanation: 'First',
        originalStatuses: { 'V-8001': 'Not Reviewed' },
      });

      addTestAttestation(fileId, 'V-8002', {
        explanation: 'Second',
        frequency: 'quarterly',
        originalStatuses: { 'V-8001': 'TAMPERED', 'V-8002': 'Failed' },
        status: 'failed',
      });

      const state = AnnotationModule.annotationsForFile(fileId);
      expect(state!.originalStatuses['V-8001']).toBe('Not Reviewed');
    });
  });

  describe('importAnnotations', () => {
    it('bulk imports attestations and comments with indexes', () => {
      const fileId = uniqueFileId('import');

      AnnotationModule.importAnnotations({
        fileId,
        state: {
          attestations: [
            {
              control_id: 'V-9001',
              explanation: 'Imported',
              frequency: 'annually',
              status: ControlAttestationStatus.Passed,
              updated: '2026-06-16T21:00:00Z',
              updated_by: 'import@example.com',
            },
          ],
          commentLog: [
            {
              control_id: 'V-9002',
              text: 'Imported comment',
              updated: '2026-06-16T21:00:00Z',
              updated_by: 'import@example.com',
            },
          ],
          fileId,
          originalStatuses: { 'V-9001': 'Not Reviewed', 'V-9002': 'Passed' },
        },
      });

      expect(AnnotationModule.hasAttestation(fileId, 'V-9001')).toBe(true);
      expect(AnnotationModule.hasComments(fileId, 'V-9002')).toBe(true);
      expect(AnnotationModule.attestationsForFile(fileId)).toHaveLength(1);
      expect(
        AnnotationModule.commentsForControl(fileId, 'V-9002'),
      ).toHaveLength(1);
    });
  });

  describe('addCommentWithControl — live display patching (ADR §3.1.2)', () => {
    it('stores comment in annotation store', async () => {
      const fileId = uniqueFileId('cwc-store');
      const controlId = 'V-10001';

      const mockControl = {
        data: {
          descriptions: [{ data: 'original', label: 'comments' }],
          id: controlId,
        },
        hdf: { descriptions: { comments: 'original' } },
        sourcedFrom: { from_file: { uniqueId: fileId }, sourcedFrom: null },
      };

      await AnnotationModule.addCommentWithControl({
        control: mockControl as any,
        fileId,
        text: 'New reviewer comment',
        updatedBy: 'reviewer@example.com',
      });

      expect(AnnotationModule.hasComments(fileId, controlId)).toBe(true);
      const comments = AnnotationModule.commentsForControl(fileId, controlId);
      expect(comments).toHaveLength(1);
      expect(comments[0].text).toBe('New reviewer comment');
      expect(comments[0].updated_by).toBe('reviewer@example.com');
      expect(comments[0].control_id).toBe(controlId);
      expect(typeof comments[0].updated).toBe('string');
    });

    it('patches control.hdf.descriptions via cross-module updateControlDescription', async () => {
      const fileId = uniqueFileId('cwc-patch');
      const controlId = 'V-10002';

      const mockControl = {
        data: {
          descriptions: [{ data: 'old text', label: 'comments' }],
          id: controlId,
        },
        hdf: { descriptions: { comments: 'old text' } },
        sourcedFrom: { from_file: { uniqueId: fileId }, sourcedFrom: null },
      };

      await AnnotationModule.addCommentWithControl({
        control: mockControl as any,
        fileId,
        text: 'updated by reviewer',
        updatedBy: 'test@example.com',
      });

      expect(mockControl.hdf.descriptions.comments).toBe(
        'updated by reviewer',
      );
    });

    it('patches array-form descriptions via setControlDescription', async () => {
      const fileId = uniqueFileId('cwc-array');
      const controlId = 'V-10003';

      const mockControl = {
        data: {
          descriptions: [{ data: 'array-form original', label: 'comments' }],
          id: controlId,
        },
        hdf: { descriptions: { comments: 'array-form original' } },
        sourcedFrom: { from_file: { uniqueId: fileId }, sourcedFrom: null },
      };

      await AnnotationModule.addCommentWithControl({
        control: mockControl as any,
        fileId,
        text: 'array-form updated',
        updatedBy: 'test@example.com',
      });

      const desc = mockControl.data.descriptions.find(
        d => d.label === 'comments',
      );
      expect(desc?.data).toBe('array-form updated');
    });

    it('marks file dirty via cross-module commit', async () => {
      const fileId = uniqueFileId('cwc-dirty');
      const controlId = 'V-10004';

      const mockControl = {
        data: {
          descriptions: [{ data: '', label: 'comments' }],
          id: controlId,
        },
        hdf: { descriptions: { comments: '' } },
        sourcedFrom: { from_file: { uniqueId: fileId }, sourcedFrom: null },
      };

      await AnnotationModule.addCommentWithControl({
        control: mockControl as any,
        fileId,
        text: 'should dirty the file',
        updatedBy: 'test@example.com',
      });

      expect(InspecDataModule.isFileDirty(fileId)).toBe(true);
      InspecDataModule.markFileSaved([fileId]);
    });
  });

  describe('addAttestation auto-populates fields (ADR §3.1.1)', () => {
    it('auto-populates updated timestamp and control_id from controlId param', async () => {
      const fileId = uniqueFileId('auto-pop');
      const controlId = 'V-AP001';
      const beforeTime = new Date().toISOString();

      await AnnotationModule.addAttestation({
        controlId,
        explanation: 'Verified manually',
        fileId,
        frequency: 'annually',
        status: ControlAttestationStatus.Passed,
        updatedBy: 'isso@example.com',
      });

      const attestations = AnnotationModule.attestationsForFile(fileId);
      expect(attestations).toHaveLength(1);
      expect(attestations[0].control_id).toBe(controlId);
      expect(attestations[0].updated_by).toBe('isso@example.com');
      expect(attestations[0].status).toBe(ControlAttestationStatus.Passed);
      expect(attestations[0].explanation).toBe('Verified manually');
      expect(attestations[0].frequency).toBe('annually');
      const afterTime = new Date().toISOString();
      expect(attestations[0].updated >= beforeTime).toBe(true);
      expect(attestations[0].updated <= afterTime).toBe(true);
    });
  });

  describe('exportAttestations store action (ADR §5.4.3)', () => {
    function findCall(filenamePattern: RegExp | string): [Blob, string] | undefined {
      return (mockSaveAs.mock.calls as [Blob, string][]).find(
        ([, fn]) =>
          typeof filenamePattern === 'string'
            ? fn === filenamePattern
            : filenamePattern.test(fn),
      );
    }

    it('exports JSON with correct filename and content type', async () => {
      const fileId = uniqueFileId('export-json');
      addTestAttestation(fileId, 'V-EX001', { explanation: 'JSON test' });

      await AnnotationModule.exportAttestations({
        fileId,
        filename: 'exp-json',
        format: 'json',
      });

      const call = findCall('exp-json.json');
      expect(call).toBeDefined();
      const [blob] = call!;
      expect(blob).toBeInstanceOf(Blob);
      expect((blob).type).toBe('application/json');
    });

    it('exports YAML with .yaml extension', async () => {
      const fileId = uniqueFileId('export-yaml');
      addTestAttestation(fileId, 'V-EX002', { explanation: 'YAML test' });

      await AnnotationModule.exportAttestations({
        fileId,
        filename: 'exp-yaml',
        format: 'yaml',
      });

      const call = findCall('exp-yaml.yaml');
      expect(call).toBeDefined();
      expect((call![0]).type).toBe('text/yaml');
    });

    it('exports bundle with .heimdall.json extension', async () => {
      const fileId = uniqueFileId('export-bundle');
      addTestAttestation(fileId, 'V-EX003');
      AnnotationModule.addComment({
        comment: {
          control_id: 'V-EX004',
          text: 'Bundle comment',
          updated: '2026-06-17T00:00:00Z',
          updated_by: 'test@example.com',
        },
        fileId,
      });

      await AnnotationModule.exportAttestations({
        fileId,
        filename: 'exp-bundle',
        format: 'bundle',
      });

      const call = findCall('exp-bundle.heimdall.json');
      expect(call).toBeDefined();
      expect((call![0]).type).toBe('application/json');
    });

    it('exports XLSX with .xlsx extension', async () => {
      const fileId = uniqueFileId('export-xlsx');
      addTestAttestation(fileId, 'V-EX005');

      await AnnotationModule.exportAttestations({
        fileId,
        filename: 'exp-xlsx',
        format: 'xlsx',
      });

      const call = findCall('exp-xlsx.xlsx');
      expect(call).toBeDefined();
      expect((call![0]).type).toBe('application/vnd.ms-excel');
    });

    it('uses default filename when none provided', async () => {
      const fileId = uniqueFileId('export-default');
      addTestAttestation(fileId, 'V-EX006');

      await AnnotationModule.exportAttestations({ fileId, format: 'json' });

      const call = findCall(/^attestations-.*\.json$/v);
      expect(call).toBeDefined();
    });

    it('does nothing when fileId has no annotations', async () => {
      const callsBefore = mockSaveAs.mock.calls.length;
      const fileId = uniqueFileId('export-empty');

      await AnnotationModule.exportAttestations({ fileId, format: 'json' });

      expect(mockSaveAs.mock.calls.length).toBe(callsBefore);
    });
  });

  describe('applyAttestationsToHdf (ADR §5.4.1)', () => {
    it('returns undefined when no attestations exist for file', async () => {
      const fileId = uniqueFileId('apply-none');
      const result = await AnnotationModule.applyAttestationsToHdf({ fileId });
      expect(result).toBeUndefined();
    });

    it('returns undefined when file has attestations but is not in data store', async () => {
      const fileId = uniqueFileId('apply-nofile');
      addTestAttestation(fileId, 'V-11001');

      const result = await AnnotationModule.applyAttestationsToHdf({ fileId });
      expect(result).toBeUndefined();
    });
  });
});
