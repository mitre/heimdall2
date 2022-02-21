import fs from 'fs';
import {FromHDFToSplunkMapper} from '../../../src/converters-from-hdf/splunk/reverse-splunk-mapper';

describe('Describe ASFF Reverse Mapper', () => {
  it('Successfully converts HDF into ASFF', async () => {
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/sample_input_report/rhel7-results.json',
        {encoding: 'utf-8'}
      )
    );

    //The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    const guid = await new FromHDFToSplunkMapper(inputData).toSplunk(
      {
        token: '8181fb02-c3bf-4077-b7db-a0a11a7f661d',
        host: '127.0.0.1',
        protocol: 'http',
        port: 8088
      },
      'rhel7-results.json'
    );

    expect(typeof guid).toEqual('string');
  });
});
