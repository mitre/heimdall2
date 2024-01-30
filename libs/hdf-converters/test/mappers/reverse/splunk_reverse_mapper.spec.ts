import fs from 'fs';
import {FromHDFToSplunkMapper} from '../../../src/converters-from-hdf/splunk/reverse-splunk-mapper';

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Describe Splunk Reverse Mapper', () => {
  it('Successfully converts HDF into Splunk', async () => {
    // The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/sample_input_report/rhel7-results.json',
        {encoding: 'utf-8'}
      )
    );

    // Currently tests are to make sure there are no errors during upload to Splunk
    new FromHDFToSplunkMapper(inputData).toSplunk(
      {
        host: '127.0.0.1',
        username: 'admin',
        password: 'Valid_password!',
        index: 'main',
        scheme: 'http'
      },
      'rhel7-results.json'
    );
  });
});
