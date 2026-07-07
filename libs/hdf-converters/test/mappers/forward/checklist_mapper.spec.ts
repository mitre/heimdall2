import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { ChecklistResults } from '../../../src/ckl-mapper/checklist-mapper';
import { InvalidChecklistMetadataException } from '../../../src/ckl-mapper/checklist-metadata-utils';
import { omitVersions } from '../../utils';

// To write the output to a file for visual inspection, follow the example below:
// fs.writeFileSync(
//   'sample_jsons/checklist_mapper/FILENAME.json',
//   JSON.stringify(mapper.toHdf(), null, 2)
// );

const readFile = (path: fs.PathOrFileDescriptor) =>
  fs.readFileSync(path, { encoding: 'utf8' });
const parseJsonFile = (path: fs.PathOrFileDescriptor) =>
  JSON.parse(readFile(path));

const testCases = [
  {
    description: 'checklist_mapper_single_stig',
    expectedFile: 'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json',
    inputFile:
      'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
    options: {},
  },
  {
    description: 'checklist_mapper_single_stig_with_raw',
    expectedFile:
      'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf-with-raw.json',
    inputFile:
      'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
    options: { includeRaw: true },
  },
  {
    description: 'checklist_mapper_with_severity_overrides',
    expectedFile: 'sample_jsons/checklist_mapper/small_overrides_hdf.json',
    inputFile:
      'sample_jsons/checklist_mapper/sample_input_report/small_ckl_overrides.ckl',
    options: { includeRaw: true },
  },
  {
    description: 'checklist_mapper_multi_stig_wrapper',
    expectedFile: 'sample_jsons/checklist_mapper/three_stig_checklist-hdf.json',
    inputFile:
      'sample_jsons/checklist_mapper/sample_input_report/three_stig_checklist.ckl',
    options: {},
  },
  {
    description: 'checklist_with_multiple_host_mac_addresses',
    expectedFile:
      'sample_jsons/checklist_mapper/multiple_mac_addresses_metadata.json',
    inputFile:
      'sample_jsons/checklist_mapper/sample_input_report/multiple_mac_addresses_metadata.ckl',
    options: { includeRaw: false },
  },
  {
    description: 'checklist_with_multiple_host_ip_addresses',
    expectedFile:
      'sample_jsons/checklist_mapper/multiple_ip_addresses_metadata.json',
    inputFile:
      'sample_jsons/checklist_mapper/sample_input_report/multiple_ip_addresses_metadata.ckl',
    options: { includeRaw: false },
  },
];

describe('Checklist Mapper Tests', () => {
  for (const { description, expectedFile, inputFile, options } of testCases) {
    it(`Successfully converts Checklists for ${description}`, () => {
      const mapper = new ChecklistResults(
        readFile(inputFile),
        options.includeRaw,
      );
      const results = mapper.toHdf();
      expect(omitVersions(results)).toEqual(
        omitVersions(parseJsonFile(expectedFile)),
      );
    });
  }

  it('Successfully creates jsonix object', () => {
    const mapper = new ChecklistResults(
      readFile(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
      ),
    );
    const results = mapper.getJsonix();
    expect(results).toEqual(
      parseJsonFile('sample_jsons/checklist_mapper/checklist_jsonix_data.json'),
    );
  });

  it('Successfully creates intermediate checklist object', () => {
    const mapper = new ChecklistResults(
      readFile(
        'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.ckl',
      ),
    );
    const jsonixData = mapper.getJsonix();
    const results = mapper.toIntermediateObject(jsonixData);
    expect(results).toEqual(
      parseJsonFile(
        'sample_jsons/checklist_mapper/checklist_intermediate_object.json',
      ),
    );
  });

  it('Throws InvalidChecklistFormatException when trying to convert checklist with invalid metadata', () => {
    const fileContents = readFile(
      'sample_jsons/checklist_mapper/sample_input_report/invalid_metadata.ckl',
    );
    expect(() => new ChecklistResults(fileContents)).toThrowError(
      InvalidChecklistMetadataException,
    );
  });
});
