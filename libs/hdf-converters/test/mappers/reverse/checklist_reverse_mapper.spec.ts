import fs from 'fs';
import {ChecklistResults} from '../../../src/ckl-mapper/checklist-mapper';
import {XMLParser} from 'fast-xml-parser';

describe('previously_checklist_converted_hdf_to_checklist', () => {
  it('Successfully converts HDF to Checklist', () => {
    const mapper = new ChecklistResults(
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json',
          {encoding: 'utf-8'}
        )
      )
    );

    fs.writeFileSync(
      'sample_jsons/checklist_mapper/converted-RHEL8V1R3.ckl',
      mapper.toCkl()
    );

    const parser = new XMLParser();

    expect(parser.parse(mapper.toCkl())).toEqual(
      parser.parse(fs
        .readFileSync(
          'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl'
        ))
    );
  });
});

describe('previously_checklist_converted_hdf_to_checklist', () => {
  it('Successfully converts HDF with multiple stigs to Checklist', () => {
    const mapper = new ChecklistResults(
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/checklist_mapper/three_stig_checklist-hdf.json',
          {encoding: 'utf-8'}
        )
      )
    );

    fs.writeFileSync(
      'sample_jsons/checklist_mapper/converted-three-stig-checklist.ckl',
      mapper.toCkl()
    );

    const parser = new XMLParser();

    expect(parser.parse(mapper.toCkl())).toEqual(
      parser.parse(fs
        .readFileSync(
          'sample_jsons/checklist_mapper/sample_input_report/three_stig_checklist.ckl'
        ))
      );
  });
});

describe('non_checklist_converted_hdf_to_checklist', () => {
  it('Successfully converts HDF to Checklist', () => {
    const mapper = new ChecklistResults(
      JSON.parse(
        fs.readFileSync('sample_jsons/nessus_mapper/nessus-hdf-10.0.0.3.json', {
          encoding: 'utf-8'
        })
      )
    );

    const parser = new XMLParser();

    fs.writeFileSync(
      'sample_jsons/checklist_mapper/converted-nessus.ckl',
      mapper.toCkl()
    );

    expect(parser.parse(mapper.toCkl())).toEqual(
      parser.parse(fs
        .readFileSync('sample_jsons/checklist_mapper/converted-nessus.ckl')
      )
    );
  });
});
