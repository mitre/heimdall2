import fs from 'fs';
import {FromHdfToAsffMapper} from '../../../src/converters-from-hdf/asff/reverse-asff-mapper';
import {omitASFFTimes, omitASFFTitle} from '../../utils';

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

    const profileInformation = [converted.pop() || {}];

    const expectedProfileInfo = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json.p0.json',
        {encoding: 'utf-8'}
      )
    );

    const expectedJSON = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/rhel7-results.asff.json',
        {encoding: 'utf-8'}
      )
    );

    expect(omitASFFTimes(omitASFFTitle(expectedProfileInfo))).toEqual(
      omitASFFTimes(omitASFFTitle(profileInformation))
    );
    expect(omitASFFTimes(converted)).toEqual(omitASFFTimes(expectedJSON));
  });

  it('Successfully converts HDF into ASFF When Code is Missing', () => {
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/sample_input_report/undefined-code.json',
        {encoding: 'utf-8'}
      )
    );

    //The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    const converted = new FromHdfToAsffMapper(inputData, {
      input: 'undefined-code.json',
      awsAccountId: '12345678910',
      target: 'project-example-analysis',
      region: 'us-east-2'
    }).toAsff();

    const profileInformation = [converted.pop() || {}];

    const expectedProfileInfo = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/undefined-code.asff.json.p0.json',
        {encoding: 'utf-8'}
      )
    );

    const expectedJSON = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/undefined-code.asff.json',
        {encoding: 'utf-8'}
      )
    );

    expect(omitASFFTimes(omitASFFTitle(expectedProfileInfo))).toEqual(
      omitASFFTimes(omitASFFTitle(profileInformation))
    );
    expect(omitASFFTimes(converted)).toEqual(omitASFFTimes(expectedJSON));
  });

  it('Successfully converts HDF into ASFF When Controls is Empty', () => {
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/sample_input_report/empty-controls.json',
        {encoding: 'utf-8'}
      )
    );

    //The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    const converted = new FromHdfToAsffMapper(inputData, {
      input: 'empty-controls.json',
      awsAccountId: '12345678910',
      target: 'project-example-analysis',
      region: 'us-east-2'
    }).toAsff();

    const profileInformation = [converted.pop() || {}];

    fs.writeFileSync(
      'sample_jsons/asff_reverse_mapper/empty-controls.asff.json.p0.json',
      JSON.stringify(profileInformation)
    );

    const expectedProfileInfo = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/empty-controls.asff.json.p0.json',
        {encoding: 'utf-8'}
      )
    );

    expect(omitASFFTimes(omitASFFTitle(expectedProfileInfo))).toEqual(
      omitASFFTimes(omitASFFTitle(profileInformation))
    );
    expect(omitASFFTimes(converted)).toEqual(omitASFFTimes([]));
  });
});
