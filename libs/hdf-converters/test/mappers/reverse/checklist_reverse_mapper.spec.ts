import fs from 'fs';
import {ChecklistResults} from '../../../src/ckl-mapper/checklist-mapper';
import {Stigdata, Checklist} from '../../../src/ckl-mapper/checklistJsonix';
import {replaceCKLVersion} from '../../utils';
import {InvalidChecklistMetadataException} from '../../../src/ckl-mapper/checklist-metadata-utils';

describe('previously_checklist_converted_hdf_to_checklist', () => {
  it('Successfully converts HDF to Checklist', () => {
    const hdfData = loadJsonFile(
      'sample_jsons/checklist_mapper/checklist-RHEL8V1R3-hdf.json'
    );
    const mapper = new ChecklistResults(hdfData);
    const expected = fs.readFileSync(
      'sample_jsons/checklist_mapper/converted-RHEL8V1R3.ckl',
      'utf-8'
    );
    const converted = mapper.toCkl();
    expect(converted).toEqual(replaceCKLVersion(expected));
  });

  it('Successfully converts HDF with multiple stigs to Checklist', () => {
    const hdfData = loadJsonFile(
      'sample_jsons/checklist_mapper/three_stig_checklist-hdf.json'
    );
    const mapper = new ChecklistResults(hdfData);
    const expected = fs.readFileSync(
      'sample_jsons/checklist_mapper/converted-three-stig-checklist.ckl',
      'utf-8'
    );
    const converted = mapper.toCkl();
    expect(converted).toEqual(replaceCKLVersion(expected));
  });
});

describe('non_checklist_converted_hdf_to_checklist', () => {
  it('Successfully converts HDF to Checklist', () => {
    const hdfData = loadJsonFile(
      'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.3.json'
    );
    const mapper = new ChecklistResults(hdfData);
    const expected = fs.readFileSync(
      'sample_jsons/checklist_mapper/converted-nessus.ckl',
      'utf-8'
    );
    const converted = mapper.toCkl();
    expect(converted).toEqual(replaceCKLVersion(expected));
  });
});

describe('Small RHEL8 HDF file', () => {
  it('can be successfully converted from HDF to Checklist', () => {
    const hdfData = loadJsonFile(
      'sample_jsons/attestations/rhel8_sample_oneOfEachControlStatus.json'
    );
    const mapper = new ChecklistResults(hdfData);
    const expected = fs.readFileSync(
      'sample_jsons/checklist_mapper/converted-rhel8_sample_oneOfEachControlStatus.ckl',
      'utf-8'
    );
    const converted = mapper.toCkl();
    expect(converted).toEqual(replaceCKLVersion(expected));
  });
});

describe('Small RHEL 7 with severity and severity override tags', () => {
  it('can be successfully converted from HDF to Checklist', () => {
    const hdfData = loadJsonFile(
      'sample_jsons/checklist_mapper/sample_input_report/RHEL7_overrides_hdf.json'
    );
    const mapper = new ChecklistResults(hdfData);
    const expected = fs.readFileSync(
      'sample_jsons/checklist_mapper/converted-rhel7_overrides.ckl',
      'utf-8'
    );
    const converted = mapper.toCkl();
    expect(converted).toEqual(replaceCKLVersion(expected));
  });
});

describe('hdf_profile_with_invalid_metadata', () => {
  it('Throws InvalidChecklistFormatException when trying to convert to checklist with invalid metadata', () => {
    const fileContents = loadJsonFile(
      'sample_jsons/checklist_mapper/sample_input_report/invalid_metadata.json'
    );
    expect(() => new ChecklistResults(fileContents)).toThrowError(
      InvalidChecklistMetadataException
    );
  });
});

describe('hdf_profile_with_multiple_mac_host_addresses', () => {
  it('can correctly provide multiple mac host addresses for the checklist file', () => {
    const hdfData = loadJsonFile(
      'sample_jsons/checklist_mapper/multiple_mac_addresses_metadata.json'
    );
    const mapper = new ChecklistResults(hdfData);
    const jsonixData = mapper.getJsonix();
    const hostmac = (jsonixData?.value as Stigdata).asset?.hostmac;
    const expectedHostMac =
      '02:B9:78:82:FE:DE\nEE:EE:EE:EE:EE:EE\n6E:8D:55:AB:10:5F';
    expect(hostmac).toEqual(expectedHostMac);
  });
});

describe('checklist_mapper_severity_mapping', () => {
  it('Maps control V-61867 to correct severity category', () => {
    const hdfData = loadJsonFile(
      'sample_jsons/attestations/triple_overlay_profile_sample.json'
    );
    const mapper = new ChecklistResults(hdfData);
    const jsonixData = mapper.getJsonix();
    const severity = extractSeverity(jsonixData, 2, 1);
    const status = extractStatus(jsonixData, 2);
    expect(severity).toBe('medium');
    expect(status).toBe('Not_Applicable');
  });
});

/**
 * Load and parse the file.
 * @param filePath Path to the file.
 * @returns Parsed data.
 */
function loadJsonFile(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, {encoding: 'utf-8'}));
}
/**
 * Extract the severity string for a specific control from the mapper.
 * @param jsonixData Checklist data in jsonix format.
 * @param vulnIndex Index of the vulnerability in the list.
 * @param stigdataIndex Index of the stigdata element.
 * @returns Severity string.
 */
function extractSeverity(
  jsonixData: Checklist,
  vulnIndex: number,
  stigdataIndex: number
): string | undefined {
  const istig = (jsonixData?.value as Stigdata)?.stigs?.istig[0];
  const vuln = istig?.vuln[vulnIndex];
  const stigdataElement = vuln?.stigdata[stigdataIndex];
  return stigdataElement?.attributedata ?? undefined;
}
/**
 * Extract the status string for a specific control from the mapper.
 * @param jsonixData Checklist data in jsonix format.
 * @param vulnIndex Index of the vulnerability in the list.
 * @returns Status string.
 */
function extractStatus(
  jsonixData: Checklist,
  vulnIndex: number
): string | undefined {
  const istig = (jsonixData?.value as Stigdata)?.stigs?.istig[0];
  const vuln = istig?.vuln[vulnIndex];
  const status = vuln?.status;
  return status;
}
/**
 * Save the CKL output to a file.
 * In the case that the expected output changes, the schema changes, or additional tests are created,
 * this function can be used as a convenience to update the expected output.
 * NOTE: Only use this function to generate the expected output once. Do not overwrite the expected output every time a test runs.
 * @param mapper ChecklistResults instance.
 * @param outputPath Path to save the CKL output.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function saveCklOutput(mapper: ChecklistResults, outputPath: string): void {
  const cklOutput = mapper.toCkl();
  fs.writeFileSync(outputPath, cklOutput);
}
