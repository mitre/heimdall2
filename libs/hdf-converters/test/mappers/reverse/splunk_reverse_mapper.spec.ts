import {describe, it} from 'vitest';
import {FromHDFToSplunkMapper} from '../../../src/converters-from-hdf/splunk/reverse-splunk-mapper';
import {readSample} from '../../utils';

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Describe Splunk Reverse Mapper', () => {
  it('Successfully converts HDF into Splunk', async () => {
    // The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    const inputData = JSON.parse(
      readSample('asff_reverse_mapper', 'sample_input_report', 'rhel7-results.json')
    );

    // Currently tests are to make sure there are no errors during upload to Splunk
    await new FromHDFToSplunkMapper(inputData).toSplunk(
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
