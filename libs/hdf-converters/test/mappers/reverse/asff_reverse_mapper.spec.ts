import fs from 'fs';
import {FromHdfToAsffMapper} from '../../../src/converters-from-hdf/asff/reverse-asff-mapper';
import {omitASFFTimes, omitASFFTitle, omitASFFVersions} from '../../utils';

describe('Describe ASFF Reverse Mapper', () => {
  it('Successfully converts HDF into ASFF', () => {
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

    const expectedProfileInfo = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json.p0.json',
        {encoding: 'utf-8'}
      )
    );

    const profileInformation = [converted.pop() || {}];

    const expectedJSON = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json',
        {encoding: 'utf-8'}
      )
    );

    expect(
      omitASFFVersions(omitASFFTimes(omitASFFTitle(expectedProfileInfo)))
    ).toEqual(omitASFFTimes(omitASFFTitle(profileInformation)));
    expect(omitASFFVersions(omitASFFTimes(converted))).toEqual(
      omitASFFTimes(expectedJSON)
    );
  });
});
