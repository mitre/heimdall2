import {describe, expect, it} from 'vitest';
import {
  toAttestationJson,
  toAttestationYaml,
  toHeimdallBundle,
  toAttestationXlsx
} from '@/utilities/export_attestations';
import {ControlAttestationStatus} from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import type {CommentEntry} from '@/store/annotation_store';
import type {AttestationData} from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import * as XLSX from '@e965/xlsx';

const sampleAttestations: AttestationData[] = [
  {
    control_id: 'V-2255',
    status: ControlAttestationStatus.Passed,
    explanation: 'Verified manually',
    frequency: 'annually',
    updated: '2026-06-16T21:00:00Z',
    updated_by: 'isso@example.com'
  },
  {
    control_id: 'V-2260',
    status: ControlAttestationStatus.Failed,
    explanation: 'Still failing after remediation',
    frequency: 'quarterly',
    updated: '2026-06-16T22:00:00Z',
    updated_by: 'isso@example.com'
  }
];

const sampleComments: CommentEntry[] = [
  {
    control_id: 'V-2256',
    text: 'See JIRA-1234 for remediation plan',
    updated: '2026-06-16T21:05:00Z',
    updated_by: 'reviewer@example.com'
  }
];

describe('export_attestations', () => {
  describe('toAttestationJson (SAF CLI compatible)', () => {
    it('produces a JSON string with only AttestationData records', () => {
      const json = toAttestationJson(sampleAttestations);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].control_id).toBe('V-2255');
      expect(parsed[0].status).toBe('passed');
      expect(parsed[1].status).toBe('failed');
    });

    it('includes all 6 AttestationData fields', () => {
      const json = toAttestationJson(sampleAttestations);
      const parsed = JSON.parse(json);
      const record = parsed[0];

      expect(Object.keys(record).sort()).toEqual([
        'control_id',
        'explanation',
        'frequency',
        'status',
        'updated',
        'updated_by'
      ]);
    });

    it('never includes comment records', () => {
      const json = toAttestationJson([]);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual([]);
    });

    it('produces valid JSON parseable by JSON.parse', () => {
      const json = toAttestationJson(sampleAttestations);
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe('toHeimdallBundle', () => {
    it('produces JSON with attestations and comments arrays', () => {
      const json = toHeimdallBundle(sampleAttestations, sampleComments);
      const parsed = JSON.parse(json);

      expect(parsed.attestations).toHaveLength(2);
      expect(parsed.comments).toHaveLength(1);
      expect(parsed.attestations[0].control_id).toBe('V-2255');
      expect(parsed.comments[0].control_id).toBe('V-2256');
      expect(parsed.comments[0].text).toBe(
        'See JIRA-1234 for remediation plan'
      );
    });

    it('works with empty comments', () => {
      const json = toHeimdallBundle(sampleAttestations, []);
      const parsed = JSON.parse(json);

      expect(parsed.attestations).toHaveLength(2);
      expect(parsed.comments).toEqual([]);
    });

    it('works with empty attestations', () => {
      const json = toHeimdallBundle([], sampleComments);
      const parsed = JSON.parse(json);

      expect(parsed.attestations).toEqual([]);
      expect(parsed.comments).toHaveLength(1);
    });
  });

  describe('toAttestationYaml', () => {
    it('produces YAML string with same structure as JSON format', () => {
      const yamlStr = toAttestationYaml(sampleAttestations);
      expect(typeof yamlStr).toBe('string');
      expect(yamlStr).toContain('control_id: V-2255');
      expect(yamlStr).toContain('status: passed');
      expect(yamlStr).toContain('explanation: Verified manually');
    });

    it('produces valid YAML parseable back to the same data', () => {
      const yaml = require('yaml');
      const yamlStr = toAttestationYaml(sampleAttestations);
      const parsed = yaml.parse(yamlStr);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].control_id).toBe('V-2255');
      expect(parsed[0].status).toBe('passed');
      expect(parsed[1].control_id).toBe('V-2260');
      expect(parsed[1].status).toBe('failed');
    });

    it('never includes comment records', () => {
      const yamlStr = toAttestationYaml([]);
      const yaml = require('yaml');
      const parsed = yaml.parse(yamlStr);
      expect(parsed).toEqual([]);
    });

    it('includes all 6 AttestationData fields', () => {
      const yaml = require('yaml');
      const yamlStr = toAttestationYaml(sampleAttestations);
      const parsed = yaml.parse(yamlStr);
      const record = parsed[0];

      expect(Object.keys(record).sort()).toEqual([
        'control_id',
        'explanation',
        'frequency',
        'status',
        'updated',
        'updated_by'
      ]);
    });
  });

  describe('toAttestationXlsx', () => {
    it('returns a BlobPart that can be used with new Blob()', () => {
      const result = toAttestationXlsx(sampleAttestations, sampleComments);
      const blob = new Blob([result]);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('contains a sheet named "attestations" matching parseXLSXAttestations format', () => {
      const xlsxData = toAttestationXlsx(sampleAttestations, sampleComments);
      const workbook = XLSX.read(xlsxData);
      expect(workbook.SheetNames).toContain('attestations');
    });

    it('has correct columns for round-trip with parseXLSXAttestations', () => {
      const xlsxData = toAttestationXlsx(sampleAttestations, sampleComments);
      const workbook = XLSX.read(xlsxData);
      const sheet = workbook.Sheets['attestations'];
      const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet);

      expect(rows.length).toBeGreaterThan(0);
      const firstRow = rows[0];
      expect(firstRow).toHaveProperty('control_id');
      expect(firstRow).toHaveProperty('status');
      expect(firstRow).toHaveProperty('explanation');
      expect(firstRow).toHaveProperty('frequency');
      expect(firstRow).toHaveProperty('updated');
      expect(firstRow).toHaveProperty('updated_by');
    });

    it('attestation rows have correct values', () => {
      const xlsxData = toAttestationXlsx(sampleAttestations, []);
      const workbook = XLSX.read(xlsxData);
      const sheet = workbook.Sheets['attestations'];
      const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet);

      expect(rows).toHaveLength(2);
      expect(rows[0].control_id).toBe('V-2255');
      expect(rows[0].status).toBe('passed');
      expect(rows[0].explanation).toBe('Verified manually');
      expect(rows[0].frequency).toBe('annually');
      expect(rows[0].updated_by).toBe('isso@example.com');
    });

    it('includes comment rows with type column for human review', () => {
      const xlsxData = toAttestationXlsx(sampleAttestations, sampleComments);
      const workbook = XLSX.read(xlsxData);
      const sheet = workbook.Sheets['attestations'];
      const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet);

      const commentRows = rows.filter((r) => r.type === 'comment');
      expect(commentRows).toHaveLength(1);
      expect(commentRows[0].control_id).toBe('V-2256');
      expect(commentRows[0].explanation).toBe(
        'See JIRA-1234 for remediation plan'
      );
    });
  });
});
