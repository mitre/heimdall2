import {describe, expect, it} from 'vitest';
import {ChecklistResults} from '../../../src/ckl-mapper/checklist-mapper';
import {omitVersions, readSample} from '../../utils';
import {InvalidChecklistMetadataException} from '../../../src/ckl-mapper/checklist-metadata-utils';

// To write the output to a file for visual inspection, follow the example below:
// fs.writeFileSync(
//   'sample_jsons/checklist_mapper/FILENAME.json',
//   JSON.stringify(mapper.toHdf(), null, 2)
// );

const testCases = [
  {
    description: 'checklist_mapper_single_stig',
    inputFile: 'checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
    expectedFile: 'checklist_mapper/checklist-RHEL8V1R3-hdf.json',
    options: {}
  },
  {
    description: 'checklist_mapper_single_stig_with_raw',
    inputFile: 'checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
    expectedFile: 'checklist_mapper/checklist-RHEL8V1R3-hdf-with-raw.json',
    options: {includeRaw: true}
  },
  {
    description: 'checklist_mapper_with_severity_overrides',
    inputFile: 'checklist_mapper/sample_input_report/small_ckl_overrides.ckl',
    expectedFile: 'checklist_mapper/small_overrides_hdf.json',
    options: {includeRaw: true}
  },
  {
    description: 'checklist_mapper_multi_stig_wrapper',
    inputFile: 'checklist_mapper/sample_input_report/three_stig_checklist.ckl',
    expectedFile: 'checklist_mapper/three_stig_checklist-hdf.json',
    options: {}
  },
  {
    description: 'checklist_with_multiple_host_mac_addresses',
    inputFile:
      'checklist_mapper/sample_input_report/multiple_mac_addresses_metadata.ckl',
    expectedFile:
      'checklist_mapper/multiple_mac_addresses_metadata.json',
    options: {includeRaw: false}
  },
  {
    description: 'checklist_with_multiple_host_ip_addresses',
    inputFile:
      'checklist_mapper/sample_input_report/multiple_ip_addresses_metadata.ckl',
    expectedFile:
      'checklist_mapper/multiple_ip_addresses_metadata.json',
    options: {includeRaw: false}
  }
];

describe('Checklist Mapper Tests', () => {
  for (const {description, inputFile, expectedFile, options} of testCases) {
    it(`Successfully converts Checklists for ${description}`, () => {
      const mapper = new ChecklistResults(
        readSample(inputFile),
        options.includeRaw
      );
      const results = mapper.toHdf();
      expect(omitVersions(results)).toEqual(
        omitVersions(JSON.parse(readSample(expectedFile)))
      );
    });
  }

  it('Successfully creates jsonix object', () => {
    const mapper = new ChecklistResults(
      readSample('checklist_mapper/sample_input_report/RHEL8V1R3.ckl')
    );
    const results = mapper.getJsonix();
    expect(results).toEqual(
      JSON.parse(readSample('checklist_mapper/checklist_jsonix_data.json'))
    );
  });

  it('Successfully creates intermediate checklist object', () => {
    const mapper = new ChecklistResults(
      readSample('checklist_mapper/sample_input_report/RHEL8V1R3.ckl')
    );
    const jsonixData = mapper.getJsonix();
    const results = mapper.toIntermediateObject(jsonixData);
    expect(results).toEqual(
      JSON.parse(
        readSample('checklist_mapper/checklist_intermediate_object.json')
      )
    );
  });

  it('Throws InvalidChecklistFormatException when trying to convert checklist with invalid metadata', () => {
    const fileContents = readSample(
      'checklist_mapper/sample_input_report/invalid_metadata.ckl'
    );
    expect(() => new ChecklistResults(fileContents)).toThrowError(
      InvalidChecklistMetadataException
    );
  });
});
