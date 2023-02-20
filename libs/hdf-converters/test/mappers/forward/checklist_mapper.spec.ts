import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {
  ChecklistResults,
  checklistSupplementalInfo
} from '../../../src/checklist-mapper';
import {omitVersions} from '../../utils';

describe('checklist_mapper_single_stig_default', () => {
  it('Successfully converts Checklists', () => {
    const supplementalInfo: checklistSupplementalInfo = {
      filename: 'RHEL8V1R3.ckl',
      intakeType: 'default'
    };
    const mapper = new ChecklistResults(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
        {encoding: 'utf-8'}
      ),
      supplementalInfo
    );

    const results = mapper.toHdf();

    expect(Array.isArray(results)).toBe(false);

    if (!Array.isArray(results)) {
      expect(omitVersions(results)).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json',
              {encoding: 'utf-8'}
            )
          )
        )
      );
    }
  });
});

describe('checklist_mapper_multi_stig_wrapper', () => {
  it('Successfully converts Checklists', () => {
    const supplementalInfo: checklistSupplementalInfo = {
      filename: 'three_stig_checklist.ckl',
      intakeType: 'wrapper'
    };
    const mapper = new ChecklistResults(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/three_stig_checklist.ckl',
        {encoding: 'utf-8'}
      ),
      supplementalInfo
    );

    const results = mapper.toHdf();

    expect(Array.isArray(results)).toBe(false);

    if (!Array.isArray(results)) {
      expect(omitVersions(results)).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              'sample_jsons/checklist_mapper/three_stig_checklist-hdf.json',
              {encoding: 'utf-8'}
            )
          )
        )
      );
    }
  });
});

describe('checklist_mapper_multi_stig_split', () => {
  it('Successfully converts Checklists', () => {
    const supplementalInfo: checklistSupplementalInfo = {
      filename: 'three_stig_checklist.ckl',
      intakeType: 'split'
    };
    const mapper = new ChecklistResults(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/three_stig_checklist.ckl',
        {encoding: 'utf-8'}
      ),
      supplementalInfo
    );

    const results = mapper.toHdf();

    const expectedSet = [
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/checklist_mapper/three_stig_checklist-hdf-1.json',
          {encoding: 'utf-8'}
        )
      ),
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/checklist_mapper/three_stig_checklist-hdf-2.json',
          {encoding: 'utf-8'}
        )
      ),
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/checklist_mapper/three_stig_checklist-hdf-3.json',
          {encoding: 'utf-8'}
        )
      )
    ];

    expect(Array.isArray(results)).toBe(true);

    if (Array.isArray(results)) {
      expect(results.map((result) => omitVersions(result))).toEqual(
        expectedSet.map((result: ExecJSON.Execution) => omitVersions(result))
      );
    }
  });
});
