import { describe, expect, it } from 'vitest';
import { FromHdfToAsffMapper } from '../../../src/converters-from-hdf/asff/reverse-asff-mapper';
import { loadFixture, omitASFFTimes, omitASFFTitle, omitASFFVersions } from '../../utils';

function normalizeASFF<T>(input: T): T {
  return omitASFFVersions(omitASFFTimes(omitASFFTitle(input as any))) as T;
}

describe('ASFF Reverse Mapper', () => {
  it('Successfully converts a one-layer HDF into ASFF', () => {
    const inputData = loadFixture(
      'sample_jsons/asff_reverse_mapper/sample_input_report/rhel7-results.json',
    );

    // The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    const converted = new FromHdfToAsffMapper(inputData, {
      awsAccountId: '12345678910',
      input: 'rhel7-results.json',
      region: 'us-east-2',
      target: 'reverse-proxy',
    }).toAsff();

    const profileInformation = [converted.at(-1) || {}];

    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json',
    //   JSON.stringify(converted, null, 2)
    // );
    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json.p0.json',
    //   JSON.stringify(profileInformation, null, 2)
    // );

    const expectedJSON = loadFixture(
      'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json',
    );

    const expectedProfileInfo = loadFixture(
      'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json.p0.json',
    );

    expect(normalizeASFF(converted)).toEqual(
      normalizeASFF(expectedJSON),
    );
    expect(
      normalizeASFF(profileInformation),
    ).toEqual(
      normalizeASFF(expectedProfileInfo),
    );
  });

  it('Successfully converts a three-layer HDF into ASFF', () => {
    const inputData = loadFixture(
      'sample_jsons/asff_reverse_mapper/sample_input_report/example-3-layer-overlay_03062022.json',
    );

    // The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    const converted = new FromHdfToAsffMapper(inputData, {
      awsAccountId: '12345678910',
      input: 'example-3-layer-overlay_03062022.json',
      region: 'us-east-2',
      target: 'reverse-proxy',
    }).toAsff();

    const profileInformation = [converted.at(-1) || {}];

    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/example-3-layer-overlay_03062022.asff.json',
    //   JSON.stringify(converted, null, 2)
    // );
    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/example-3-layer-overlay_03062022.asff.json.p0.json',
    //   JSON.stringify(profileInformation, null, 2)
    // );

    const expectedJSON = loadFixture(
      'sample_jsons/asff_reverse_mapper/example-3-layer-overlay_03062022.asff.json',
    );

    const expectedProfileInfo = loadFixture(
      'sample_jsons/asff_reverse_mapper/example-3-layer-overlay_03062022.asff.json.p0.json',
    );

    expect(normalizeASFF(converted)).toEqual(
      normalizeASFF(expectedJSON),
    );
    expect(
      normalizeASFF(profileInformation),
    ).toEqual(
      normalizeASFF(expectedProfileInfo),
    );
  });

  it('Successfully processes HDF files with no controls', () => {
    const inputData = loadFixture(
      'sample_jsons/asff_reverse_mapper/sample_input_report/snyk-no-results.json',
    );

    const converted = new FromHdfToAsffMapper(inputData, {
      awsAccountId: '12345678910',
      input: 'snyk-no-results.json',
      region: 'us-east-2',
      target: 'storybook-link',
    }).toAsff();

    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/snyk-no-results.asff.json',
    //   JSON.stringify(converted, null, 2)
    // );

    const expectedJSON = loadFixture(
      'sample_jsons/asff_reverse_mapper/snyk-no-results.asff.json',
    );

    expect(normalizeASFF(converted)).toEqual(
      normalizeASFF(expectedJSON),
    );
  });

  it('Successfully processes and modifies HDF files to meet certain ASFF / AWS SecurityHub restrictions', () => {
    const inputData = loadFixture(
      'sample_jsons/asff_reverse_mapper/sample_input_report/restrictions-test-rhel7-results.json',
    );

    const converted = new FromHdfToAsffMapper(inputData, {
      awsAccountId: '12345678910',
      input: 'subset-results.json',
      region: 'us-east-2',
      target: 'rhel7subset',
    }).toAsff();

    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/restrictions-test-results.asff.json',
    //   JSON.stringify(converted, null, 2)
    // );

    const expectedJSON = loadFixture(
      'sample_jsons/asff_reverse_mapper/restrictions-test-results.asff.json',
    );

    expect(normalizeASFF(converted)).toEqual(
      normalizeASFF(expectedJSON),
    );
  });
});
