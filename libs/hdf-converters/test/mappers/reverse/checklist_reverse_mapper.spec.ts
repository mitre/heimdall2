import fs from 'fs';
import {ChecklistResults} from '../../../src/ckl-mapper/checklist-mapper';
import {version as hdfConvertersVersion} from '../../../package.json';

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

    // fs.writeFileSync(
    //   'sample_jsons/checklist_mapper/converted-RHEL8V1R3.ckl',
    //   mapper.toCkl()
    // );

    const expected = fs.readFileSync(
      'sample_jsons/checklist_mapper/converted-RHEL8V1R3.ckl',
      'utf-8'
    );
    const converted = mapper.toCkl();

    expect(converted).toEqual(
      expected.replace(/2\.10\.1/gi, hdfConvertersVersion)
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

    // fs.writeFileSync(
    //   'sample_jsons/checklist_mapper/converted-three-stig-checklist.ckl',
    //   mapper.toCkl()
    // );

    const expected = fs.readFileSync(
      'sample_jsons/checklist_mapper/converted-three-stig-checklist.ckl',
      'utf-8'
    );
    const converted = mapper.toCkl();

    expect(converted).toEqual(
      expected.replace(/2\.10\.2/gi, hdfConvertersVersion)
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

    // fs.writeFileSync(
    //   'sample_jsons/checklist_mapper/converted-nessus.ckl',
    //   mapper.toCkl()
    // );

    const expected = fs.readFileSync(
      'sample_jsons/checklist_mapper/converted-nessus.ckl',
      'utf-8'
    );
    const converted = mapper.toCkl();

    expect(converted).toEqual(
      expected.replace(
        /Heimdall Version :: 2\.10\.2/gi,
        `Heimdall Version :: ${hdfConvertersVersion}`
      )
    );
  });
});

describe('Small RHEL8 HDF file', () => {
  it('can be successfully converted from HDF to Checklist', () => {
    const mapper = new ChecklistResults(
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/attestations/rhel8_sample_oneOfEachControlStatus.json',
          {
            encoding: 'utf-8'
          }
        )
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/checklist_mapper/converted-rhel8_sample_oneOfEachControlStatus.ckl',
    //   mapper.toCkl()
    // );

    const expected = fs.readFileSync(
      'sample_jsons/checklist_mapper/converted-rhel8_sample_oneOfEachControlStatus.ckl',
      'utf-8'
    );
    const converted = mapper.toCkl();

    expect(converted).toEqual(
      expected.replace(/2\.10\.1/gi, hdfConvertersVersion)
    );
  });
});

describe('Small RHEL 7 with severity and severity override tags', () => {
  it('can be successfully converted from HDF to Checklist', () => {
    const mapper = new ChecklistResults(
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/checklist_mapper/sample_input_report/RHEL7_overrides_hdf.json',
          {
            encoding: 'utf-8'
          }
        )
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/checklist_mapper/converted-rhel7_overrides.ckl',
    //   mapper.toCkl()
    // );

    const expected = fs.readFileSync(
      'sample_jsons/checklist_mapper/converted-rhel7_overrides.ckl',
      'utf-8'
    );
    const converted = mapper.toCkl();

    expect(converted).toEqual(
      expected.replace(/2\.10\.8/gi, hdfConvertersVersion)
    );
  });
});
