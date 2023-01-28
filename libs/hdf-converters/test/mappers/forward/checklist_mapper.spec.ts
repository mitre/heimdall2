import fs from 'fs';
import {ChecklistResults, checklistSupplementalInfo} from '../../../src/checklist-mapper';
import {omitVersions} from '../../utils';

describe('checklist_mapper_single_stig_default', () => {
  it('Successfully converts Checklists', () => {
    const supplementalInfo: checklistSupplementalInfo = {
      filename: 'RHEL8V1R3.ckl',
      intakeType: 'default',
    }
    const mapper = new ChecklistResults(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
        {encoding: 'utf-8'}
      ),
      supplementalInfo
    );

    fs.writeFileSync(
      'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json',
      JSON.stringify(mapper.toHdf(), null, 2)
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('checklist_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Checklist', () => {
    const mapper = new ChecklistMapper(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
        {encoding: 'utf-8'}
      ),
      true
    );

    fs.writeFileSync(
      'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf-withraw.json',
      JSON.stringify(mapper.toHdf(), null, 2)
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});