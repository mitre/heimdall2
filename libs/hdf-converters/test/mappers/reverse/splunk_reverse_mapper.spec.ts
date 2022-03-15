import fs from 'fs';
import {FromHDFToSplunkMapper} from '../../../src/converters-from-hdf/splunk/reverse-splunk-mapper';

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Describe Splunk Reverse Mapper', () => {
  it('Successfully converts HDF into Splunk', async () => {
    jest.setTimeout(50000);
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/sample_input_report/rhel7-results.json',
        {encoding: 'utf-8'}
      )
    );

    // The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    // Currently tests are to make sure there are no errors during upload, this will be fixed in #2675
    new FromHDFToSplunkMapper(inputData).toSplunk(
      {
        host: '127.0.0.1',
        username: 'admin',
        password: 'Valid_password!',
        index: 'main',
        insecure: true,
        scheme: 'http'
      },
      'rhel7-results.json'
    );
  });
});
