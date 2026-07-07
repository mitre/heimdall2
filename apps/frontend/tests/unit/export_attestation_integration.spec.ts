import { addAttestationToHDF } from '@mitre/hdf-converters';
import type { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnotationModule } from '@/store/annotation_store';

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

function makeMinimalEvaluation(): ExecJSON.Execution {
  return {
    platform: { name: 'test', release: '1.0', target_id: '' },
    profiles: [
      {
        attributes: [],
        controls: [
          {
            code: '',
            desc: 'A test control',
            descriptions: [{ data: 'Test description', label: 'default' }],
            id: 'V-2255',
            impact: 0.5,
            refs: [],
            results: [
              {
                code_desc: 'This control must be manually reviewed',
                run_time: 0,
                skip_message: 'Not Reviewed',
                start_time: '2026-01-01T00:00:00Z',
                status: 'skipped' as ExecJSON.ControlResultStatus,
              },
            ],
            source_location: { line: 0, ref: '' },
            tags: {},
            title: 'Test Control',
          },
          {
            code: '',
            desc: 'Another test control',
            descriptions: [],
            id: 'V-2256',
            impact: 0.7,
            refs: [],
            results: [
              {
                code_desc: 'Test passed',
                run_time: 0,
                start_time: '2026-01-01T00:00:00Z',
                status: 'passed' as ExecJSON.ControlResultStatus,
              },
            ],
            source_location: { line: 0, ref: '' },
            tags: {},
            title: 'Another Control',
          },
        ],
        copyright: 'Test',
        copyright_email: 'test@test.com',
        groups: [],
        license: 'Apache-2.0',
        maintainer: 'Test',
        name: 'test-profile',
        sha256: 'abc123',
        summary: 'Test profile',
        supports: [],
        title: 'Test Profile',
        version: '1.0.0',
      },
    ],
    statistics: { duration: 0 },
    version: '4.0.0',
  };
}

describe('Export attestation integration', () => {
  describe('addAttestationToHDF bakes attestation_data into clone', () => {
    it('adds attestation_data to the matching control', () => {
      const evaluation = makeMinimalEvaluation();
      const clone = _.cloneDeep(evaluation);

      const attestations = [
        {
          control_id: 'V-2255',
          explanation: 'Verified manually',
          frequency: 'annually',
          status: 'passed' as const,
          updated: '2026-06-01T00:00:00Z',
          updated_by: 'test@example.com',
        },
      ];

      addAttestationToHDF(clone, attestations);

      const attestedControl = clone.profiles[0].controls.find(
        c => c.id === 'V-2255',
      );
      expect(attestedControl?.attestation_data).toBeDefined();
      expect(attestedControl?.attestation_data?.status).toBe('passed');
      expect(attestedControl?.attestation_data?.explanation).toBe(
        'Verified manually',
      );
    });

    it('appends a result segment for the attestation', () => {
      const evaluation = makeMinimalEvaluation();
      const clone = _.cloneDeep(evaluation);

      const attestations = [
        {
          control_id: 'V-2255',
          explanation: 'Verified manually',
          frequency: 'annually',
          status: 'passed' as const,
          updated: '2026-06-01T00:00:00Z',
          updated_by: 'test@example.com',
        },
      ];

      addAttestationToHDF(clone, attestations);

      const attestedControl = clone.profiles[0].controls.find(
        c => c.id === 'V-2255',
      );
      expect(attestedControl?.results.length).toBe(2);
      expect(attestedControl?.results[1].status).toBe('passed');
    });

    it('does NOT modify controls without attestations', () => {
      const evaluation = makeMinimalEvaluation();
      const clone = _.cloneDeep(evaluation);

      const attestations = [
        {
          control_id: 'V-2255',
          explanation: 'Verified manually',
          frequency: 'annually',
          status: 'passed' as const,
          updated: '2026-06-01T00:00:00Z',
          updated_by: 'test@example.com',
        },
      ];

      addAttestationToHDF(clone, attestations);

      const unmodifiedControl = clone.profiles[0].controls.find(
        c => c.id === 'V-2256',
      );
      expect(unmodifiedControl?.attestation_data).toBeUndefined();
      expect(unmodifiedControl?.results.length).toBe(1);
    });

    it('does NOT modify the original when working on a clone', () => {
      const original = makeMinimalEvaluation();
      const clone = _.cloneDeep(original);

      addAttestationToHDF(clone, [
        {
          control_id: 'V-2255',
          explanation: 'Verified',
          frequency: 'annually',
          status: 'passed' as const,
          updated: '2026-06-01T00:00:00Z',
          updated_by: 'test@example.com',
        },
      ]);

      const originalControl = original.profiles[0].controls.find(
        c => c.id === 'V-2255',
      );
      expect(originalControl?.attestation_data).toBeUndefined();
      expect(originalControl?.results.length).toBe(1);
    });
  });

  describe('AnnotationModule.applyAttestationsToHdf', () => {
    beforeEach(() => {
      for (const fa of AnnotationModule.fileAnnotations) {
        AnnotationModule.clearFileAnnotations(fa.fileId);
      }
    });

    it('returns undefined when no attestations exist for file', async () => {
      const result = await AnnotationModule.applyAttestationsToHdf({ fileId: 'nonexistent-file' });
      expect(result).toBeUndefined();
    });
  });

  describe('JSON serialization with attestations', () => {
    it('serialized JSON contains attestation_data field', () => {
      const evaluation = makeMinimalEvaluation();
      const clone = _.cloneDeep(evaluation);

      addAttestationToHDF(clone, [
        {
          control_id: 'V-2255',
          explanation: 'Verified manually',
          frequency: 'annually',
          status: 'passed' as const,
          updated: '2026-06-01T00:00:00Z',
          updated_by: 'test@example.com',
        },
      ]);

      const json = JSON.stringify(clone);
      const parsed = JSON.parse(json);
      const control = parsed.profiles[0].controls.find(
        (c: { id: string }) => c.id === 'V-2255',
      );

      expect(control.attestation_data).toBeDefined();
      expect(control.attestation_data.status).toBe('passed');
      expect(control.attestation_data.explanation).toBe('Verified manually');
      expect(control.results.length).toBe(2);
    });

    it('serialized JSON does NOT contain attestation_data on non-attested controls', () => {
      const evaluation = makeMinimalEvaluation();
      const clone = _.cloneDeep(evaluation);

      addAttestationToHDF(clone, [
        {
          control_id: 'V-2255',
          explanation: 'Verified',
          frequency: 'annually',
          status: 'passed' as const,
          updated: '2026-06-01T00:00:00Z',
          updated_by: 'test@example.com',
        },
      ]);

      const json = JSON.stringify(clone);
      const parsed = JSON.parse(json);
      const unattested = parsed.profiles[0].controls.find(
        (c: { id: string }) => c.id === 'V-2256',
      );

      expect(unattested.attestation_data).toBeUndefined();
    });
  });

  describe('CSV attestation columns', () => {
    it('attestation lookup returns status and explanation for attested control', () => {
      const fileId = `csv-test-${Date.now()}`;
      const controlId = 'V-2255';

      AnnotationModule.addAttestation({
        controlId,
        explanation: 'Manually verified in lab',
        fileId,
        frequency: 'annually',
        status: 'passed',
        updatedBy: 'auditor@example.com',
      });

      expect(AnnotationModule.hasAttestation(fileId, controlId)).toBe(true);

      const attestations = AnnotationModule.attestationsForFile(fileId);
      const match = attestations.find(a => a.control_id === controlId);

      expect(match).toBeDefined();
      expect(match?.status).toBe('passed');
      expect(match?.explanation).toBe('Manually verified in lab');
    });

    it('returns empty for non-attested control', () => {
      const fileId = `csv-test-empty-${Date.now()}`;

      expect(AnnotationModule.hasAttestation(fileId, 'V-9999')).toBe(false);
      expect(AnnotationModule.attestationsForFile(fileId)).toEqual([]);
    });
  });
});
