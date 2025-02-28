import fs from 'fs';
import {ChecklistResults} from '../../../src/ckl-mapper/checklist-mapper';
import {omitVersions} from '../../utils';
import {InvalidChecklistMetadataException} from '../../../src/ckl-mapper/checklist-metadata-utils';

// To write the output to a file for visual inspection, follow the example below:
// fs.writeFileSync(
//   'sample_jsons/checklist_mapper/FILENAME.json',
//   JSON.stringify(mapper.toHdf(), null, 2)
// );

const readFile = (path: fs.PathOrFileDescriptor) =>
  fs.readFileSync(path, {encoding: 'utf-8'});
const parseJsonFile = (path: fs.PathOrFileDescriptor) =>
  JSON.parse(readFile(path));

const testCases = [
  {
    description: 'checklist_mapper_single_stig',
    inputFile:
      'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
    expectedFile: 'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json',
    options: {}
  },
  {
    description: 'checklist_mapper_single_stig_with_raw',
    inputFile:
      'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
    expectedFile:
      'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf-with-raw.json',
    options: {includeRaw: true}
  },
  {
    description: 'checklist_mapper_with_severity_overrides',
    inputFile:
      'sample_jsons/checklist_mapper/sample_input_report/small_ckl_overrides.ckl',
    expectedFile: 'sample_jsons/checklist_mapper/small_overrides_hdf.json',
    options: {includeRaw: true}
  },
  {
    description: 'checklist_mapper_multi_stig_wrapper',
    inputFile:
      'sample_jsons/checklist_mapper/sample_input_report/three_stig_checklist.ckl',
    expectedFile: 'sample_jsons/checklist_mapper/three_stig_checklist-hdf.json',
    options: {}
  },
  {
    description: 'checklist_with_multiple_host_mac_addresses',
    inputFile:
      'sample_jsons/checklist_mapper/sample_input_report/multiple_mac_addresses_metadata.ckl',
    expectedFile:
      'sample_jsons/checklist_mapper/multiple_mac_addresses_metadata.json',
    options: {includeRaw: false}
  }
];

describe('Checklist Mapper Tests', () => {
  testCases.forEach(({description, inputFile, expectedFile, options}) => {
    it(`Successfully converts Checklists for ${description}`, () => {
      const mapper = new ChecklistResults(
        readFile(inputFile),
        options.includeRaw
      );
      const results = mapper.toHdf();
      expect(omitVersions(results)).toEqual(
        omitVersions(parseJsonFile(expectedFile))
      );
    });
  });

  it('Successfully creates jsonix object', () => {
    const mapper = new ChecklistResults(
      readFile(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl'
      )
    );
    const results = mapper.getJsonix();
    expect(results).toEqual(
      parseJsonFile('sample_jsons/checklist_mapper/checklist_jsonix_data.json')
    );
  });

  it('Successfully creates intermediate checklist object', () => {
    const mapper = new ChecklistResults(
      readFile(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl'
      )
    );
    const jsonixData = mapper.getJsonix();
    const results = mapper.toIntermediateObject(jsonixData);
    expect(results).toEqual(
      parseJsonFile(
        'sample_jsons/checklist_mapper/checklist_intermediate_object.json'
      )
    );
  });

  it('Throws InvalidChecklistFormatException when trying to convert checklist with invalid metadata', () => {
    const fileContents = readFile(
      'sample_jsons/checklist_mapper/sample_input_report/invalid_metadata.ckl'
    );
    expect(() => new ChecklistResults(fileContents)).toThrowError(
      InvalidChecklistMetadataException
    );
  });
});
