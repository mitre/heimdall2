import fs from 'fs';
import path from 'path';
import {describe, expect, it} from 'vitest';
import {InspecIntakeModule} from '@/store/report_intake';
import {InspecDataModule} from '@/store/data_store';
import type {InspecFile} from '@/store/report_intake';

function makeMinimalExecJson(): string {
  return JSON.stringify({
    platform: {name: 'test', release: '1.0', target_id: ''},
    version: '4.0.0',
    statistics: {duration: 0},
    profiles: [
      {
        name: 'test-profile',
        version: '1.0.0',
        sha256: 'abc123',
        title: 'Test',
        maintainer: 'Test',
        summary: 'Test',
        license: 'Apache-2.0',
        copyright: 'Test',
        copyright_email: 'test@test.com',
        supports: [],
        attributes: [],
        groups: [],
        controls: [
          {
            id: 'V-1',
            title: 'Test Control',
            desc: 'Test',
            descriptions: [],
            impact: 0.5,
            refs: [],
            tags: {},
            code: '',
            source_location: {ref: '', line: 0},
            results: [
              {
                status: 'passed',
                code_desc: 'Test passed',
                run_time: 0,
                start_time: '2026-01-01T00:00:00Z'
              }
            ]
          }
        ]
      }
    ]
  });
}

function loadProfileFixture(): string {
  const fixturePath = path.resolve(
    __dirname,
    '../../public/static/samples/ubuntu_profile.json'
  );
  return fs.readFileSync(fixturePath, 'utf-8');
}

describe('sourceFormat persistence on loaded files', () => {
  describe('InspecFile type', () => {
    it('accepts sourceFormat as optional field', () => {
      const withFormat: InspecFile = {
        uniqueId: 'a',
        filename: 'test.json',
        sourceFormat: 'inspec-json'
      };
      const withoutFormat: InspecFile = {
        uniqueId: 'b',
        filename: 'test.json'
      };
      expect(withFormat.sourceFormat).toBe('inspec-json');
      expect(withoutFormat.sourceFormat).toBeUndefined();
    });
  });

  describe('loadText sets sourceFormat on evaluation files', () => {
    it('sets sourceFormat to inspec-json for HDF execution data', async () => {
      const fileId = await InspecIntakeModule.loadText({
        text: makeMinimalExecJson(),
        filename: `hdf-test-${Date.now()}.json`,
        sourceFormat: 'inspec-json'
      });

      const file = InspecDataModule.allFiles.find(
        (f) => f.uniqueId === fileId
      );
      expect(file).toBeDefined();
      expect(file!.sourceFormat).toBe('inspec-json');
    });

    it('defaults to inspec-profile for profile-only JSON via loadText', async () => {
      const fileId = await InspecIntakeModule.loadText({
        text: loadProfileFixture(),
        filename: `profile-test-${Date.now()}.json`
      });

      const file = InspecDataModule.allFiles.find(
        (f) => f.uniqueId === fileId
      );
      expect(file).toBeDefined();
      expect(file!.sourceFormat).toBe('inspec-profile');
    });

    it('defaults to inspec-json when sourceFormat not provided (DB-load path)', async () => {
      const fileId = await InspecIntakeModule.loadText({
        text: makeMinimalExecJson(),
        filename: `db-hdf-${Date.now()}.json`
      });

      const file = InspecDataModule.allFiles.find(
        (f) => f.uniqueId === fileId
      );
      expect(file).toBeDefined();
      expect(file!.sourceFormat).toBe('inspec-json');
    });
  });

  describe('loadExecJson sets sourceFormat', () => {
    it('preserves sourceFormat from converted file', async () => {
      const data = JSON.parse(makeMinimalExecJson());
      const fileId = await InspecIntakeModule.loadExecJson({
        data,
        filename: `converted-${Date.now()}.json`,
        sourceFormat: 'checklist'
      });

      const file = InspecDataModule.allFiles.find(
        (f) => f.uniqueId === fileId
      );
      expect(file).toBeDefined();
      expect(file!.sourceFormat).toBe('checklist');
    });

    it('sourceFormat is undefined when not provided (legacy DB load)', async () => {
      const data = JSON.parse(makeMinimalExecJson());
      const fileId = await InspecIntakeModule.loadExecJson({
        data,
        filename: `legacy-db-${Date.now()}.json`
      });

      const file = InspecDataModule.allFiles.find(
        (f) => f.uniqueId === fileId
      );
      expect(file).toBeDefined();
      expect(file!.sourceFormat).toBeUndefined();
    });
  });
});
