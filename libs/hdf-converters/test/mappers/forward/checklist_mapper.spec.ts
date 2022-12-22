import fs from 'fs';
import {ChecklistMapper} from '../../../src/checklist-mapper';
import {omitVersions} from '../../utils';

describe('checklist_mapper', () => {
  it('Successfully converts Checklists', () => {
    const mapper = new ChecklistMapper(
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
          fs.readFileSync('sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json', {
            encoding: 'utf-8'
          })
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
describe('checklist_mapper', () => {
  it('Successfully converts Checklists', () => {
    const mapper = new ChecklistMapper(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/Red_Hat_7_STIG_Baseline.ckl',
        {encoding: 'utf-8'}
      )
    );

    fs.writeFileSync(
      'sample_jsons/checklist_mapper/checklist-Red_Hat_7_STIG_Baseline-hdf.json',
      JSON.stringify(mapper.toHdf(), null, 2)
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/checklist_mapper/checklist-Red_Hat_7_STIG_Baseline-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('checklist_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Checklist', () => {
    const mapper = new ChecklistMapper(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/Red_Hat_7_STIG_Baseline.ckl',
        {encoding: 'utf-8'}
      ),
      true
    );

    fs.writeFileSync(
      'sample_jsons/checklist_mapper/checklist-Red_Hat_7_STIG_Baseline-hdf-withraw.json',
      JSON.stringify(mapper.toHdf(), null, 2)
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/checklist_mapper/checklist-Red_Hat_7_STIG_Baseline-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
describe('checklist_mapper', () => {
  it('Successfully converts Checklists', () => {
    const mapper = new ChecklistMapper(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/Three_Layer_RHEL7_Overlay_Example.ckl',
        {encoding: 'utf-8'}
      )
    );

    fs.writeFileSync(
      'sample_jsons/checklist_mapper/checklist-Three_Layer_RHEL7_Overlay_Example-hdf.json',
      JSON.stringify(mapper.toHdf(), null, 2)
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/checklist_mapper/checklist-Three_Layer_RHEL7_Overlay_Example-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('checklist_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Checklist', () => {
    const mapper = new ChecklistMapper(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/Three_Layer_RHEL7_Overlay_Example.ckl',
        {encoding: 'utf-8'}
      ),
      true
    );

    fs.writeFileSync(
      'sample_jsons/checklist_mapper/checklist-Three_Layer_RHEL7_Overlay_Example-hdf-withraw.json',
      JSON.stringify(mapper.toHdf(), null, 2)
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/checklist_mapper/checklist-Three_Layer_RHEL7_Overlay_Example-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
