import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {
  ChecklistResults
} from '../../../src/ckl-mapper/checklist-mapper';
import {omitVersions} from '../../utils';

describe('checklist_mapper_single_stig', () => {
  it('Successfully converts Checklists', () => {
    const mapper = new ChecklistResults(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
        {encoding: 'utf-8'}
      )
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
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });
});

describe('checklist_mapper_multi_stig_wrapper', () => {
  it('Successfully converts Checklists', () => {
    const mapper = new ChecklistResults(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/three_stig_checklist.ckl',
        {encoding: 'utf-8'}
      )
    );

    const results = mapper.toHdf();

    fs.writeFileSync(
      'sample_jsons/checklist_mapper/three_stig_checklist-hdf.json',
      JSON.stringify(mapper.toHdf(), null, 2)
    );

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
  });
});