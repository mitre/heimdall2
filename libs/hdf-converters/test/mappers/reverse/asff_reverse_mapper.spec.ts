import fs from 'fs';
import {FromHdfToAsffMapper} from '../../../src/converters-from-hdf/asff/reverse-asff-mapper';
import {omitASFFTimes, omitASFFTitle, omitASFFVersions} from '../../utils';

describe('ASFF Reverse Mapper', () => {
  it('Successfully converts a one-layer HDF into ASFF', () => {
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/sample_input_report/rhel7-results.json',
        {encoding: 'utf-8'}
      )
    );

    //The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    const converted = new FromHdfToAsffMapper(inputData, {
      input: 'rhel7-results.json',
      awsAccountId: '12345678910',
      target: 'reverse-proxy',
      region: 'us-east-2'
    }).toAsff();

    const profileInformation = [converted[converted.length - 1] || {}];

    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json',
    //   JSON.stringify(converted, null, 2)
    // );
    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json.p0.json',
    //   JSON.stringify(profileInformation, null, 2)
    // );

    const expectedJSON = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json',
        {encoding: 'utf-8'}
      )
    );

    const expectedProfileInfo = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json.p0.json',
        {encoding: 'utf-8'}
      )
    );

    expect(omitASFFVersions(omitASFFTimes(omitASFFTitle(converted)))).toEqual(
      omitASFFVersions(omitASFFTimes(omitASFFTitle(expectedJSON)))
    );
    expect(
      omitASFFVersions(omitASFFTimes(omitASFFTitle(profileInformation)))
    ).toEqual(
      omitASFFVersions(omitASFFTimes(omitASFFTitle(expectedProfileInfo)))
    );
  });

  it('Successfully converts a three-layer HDF into ASFF', () => {
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/sample_input_report/example-3-layer-overlay_03062022.json',
        {encoding: 'utf-8'}
      )
    );

    //The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    const converted = new FromHdfToAsffMapper(inputData, {
      input: 'example-3-layer-overlay_03062022.json',
      awsAccountId: '12345678910',
      target: 'reverse-proxy',
      region: 'us-east-2'
    }).toAsff();

    const profileInformation = [converted[converted.length - 1] || {}];

    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/example-3-layer-overlay_03062022.asff.json',
    //   JSON.stringify(converted, null, 2)
    // );
    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/example-3-layer-overlay_03062022.asff.json.p0.json',
    //   JSON.stringify(profileInformation, null, 2)
    // );

    const expectedJSON = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/example-3-layer-overlay_03062022.asff.json',
        {encoding: 'utf-8'}
      )
    );

    const expectedProfileInfo = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/example-3-layer-overlay_03062022.asff.json.p0.json',
        {encoding: 'utf-8'}
      )
    );

    expect(omitASFFVersions(omitASFFTimes(omitASFFTitle(converted)))).toEqual(
      omitASFFVersions(omitASFFTimes(omitASFFTitle(expectedJSON)))
    );
    expect(
      omitASFFVersions(omitASFFTimes(omitASFFTitle(profileInformation)))
    ).toEqual(
      omitASFFVersions(omitASFFTimes(omitASFFTitle(expectedProfileInfo)))
    );
  });

  it('Successfully processes HDF files with no controls', () => {
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/sample_input_report/snyk-no-results.json',
        {encoding: 'utf-8'}
      )
    );

    const converted = new FromHdfToAsffMapper(inputData, {
      input: 'snyk-no-results.json',
      awsAccountId: '12345678910',
      target: 'storybook-link',
      region: 'us-east-2'
    }).toAsff();

    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/snyk-no-results.asff.json',
    //   JSON.stringify(converted, null, 2)
    // );

    const expectedJSON = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/snyk-no-results.asff.json',
        {encoding: 'utf-8'}
      )
    );

    expect(omitASFFVersions(omitASFFTimes(omitASFFTitle(converted)))).toEqual(
      omitASFFVersions(omitASFFTimes(omitASFFTitle(expectedJSON)))
    );
  });

  it('Successfully processes and modifies HDF files to meet certain ASFF / AWS SecurityHub restrictions', () => {
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/sample_input_report/restrictions-test-rhel7-results.json',
        {encoding: 'utf-8'}
      )
    );

    const converted = new FromHdfToAsffMapper(inputData, {
      input: 'subset-results.json',
      awsAccountId: '12345678910',
      target: 'rhel7subset',
      region: 'us-east-2'
    }).toAsff();

    // fs.writeFileSync(
    //   'sample_jsons/asff_reverse_mapper/restrictions-test-results.asff.json',
    //   JSON.stringify(converted, null, 2)
    // );

    const expectedJSON = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/restrictions-test-results.asff.json',
        {encoding: 'utf-8'}
      )
    );

    expect(omitASFFVersions(omitASFFTimes(omitASFFTitle(converted)))).toEqual(
      omitASFFVersions(omitASFFTimes(omitASFFTitle(expectedJSON)))
    );
  });
});
