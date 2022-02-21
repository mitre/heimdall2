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
        token: 'd9dfa42c-aa59-4fa3-a70a-072c32f6615d',
        host: '127.0.0.1',
        protocol: 'http',
        port: 8088
      },
      'rhel7-results.json'
    );

    console.log(guid);

    expect(typeof guid).toEqual('string');
  });
});
