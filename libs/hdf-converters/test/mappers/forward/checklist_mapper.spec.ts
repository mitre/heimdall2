import fs from 'fs';
import {ChecklistResults} from '../../../src/ckl-mapper/checklist-mapper';
import {omitVersions} from '../../utils';

describe('checklist_mapper_single_stig', () => {
  it('Successfully converts Checklists', () => {
    const mapper = new ChecklistResults(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

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

describe('checklist_mapper_single_stig_with_raw', () => {
  it('Successfully converts Checklists with raw', () => {
    const mapper = new ChecklistResults(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf-with-raw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf-with-raw.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });
});

describe('checklist_mapper_with_severity_overrides', () => {
  it('Successfully converts Checklists with severity overrides', () => {
    const mapper = new ChecklistResults(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/small_ckl_overrides.ckl',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/checklist_mapper/small_overrides_hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/checklist_mapper/small_overrides_hdf.json',
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

    // fs.writeFileSync(
    //   'sample_jsons/checklist_mapper/three_stig_checklist-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

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

describe('checklist_jsonix', () => {
  it('Successfully creates jsonix object', () => {
    const mapper = new ChecklistResults(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
        {encoding: 'utf-8'}
      )
    );

    const results = mapper.getJsonix();

    // fs.writeFileSync(
    //   'sample_jsons/checklist_mapper/checklist_jsonix_data.json',
    //   JSON.stringify(mapper.getJsonix(), null, 2)
    // );

    expect(results).toEqual(
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/checklist_mapper/checklist_jsonix_data.json',
          {encoding: 'utf-8'}
        )
      )
    );
  });
});

describe('checklist_intermediate_object', () => {
  it('Successfully creates intermediate checklist object', () => {
    const mapper = new ChecklistResults(
      fs.readFileSync(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
        {encoding: 'utf-8'}
      )
    );

    const jsonixData = mapper.getJsonix();

    const results = mapper.toIntermediateObject(jsonixData);

    // fs.writeFileSync(
    //   'sample_jsons/checklist_mapper/checklist_intermediate_object.json',
    //   JSON.stringify(mapper.toIntermediateObject(jsonixData), null, 2)
    // );

    expect(results).toEqual(
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/checklist_mapper/checklist_intermediate_object.json',
          {encoding: 'utf-8'}
        )
      )
    );
  });
});
