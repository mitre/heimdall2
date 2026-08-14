import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {FromHDFToSplunkMapper} from '../../../src/converters-from-hdf/splunk/reverse-splunk-mapper';

describe('Describe Splunk Reverse Mapper', () => {
  it('Successfully converts HDF into Splunk', async () => {
    // The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/sample_input_report/rhel7-results.json',
        {encoding: 'utf8'}
      )
    );

    // Currently tests are to make sure there are no errors during upload to
    // Splunk; toSplunk resolves with the upload's GUID string.
    const guid = await new FromHDFToSplunkMapper(inputData).toSplunk(
      {
        host: '127.0.0.1',
        username: 'admin',
        password: 'Valid_password!',
        index: 'main',
        scheme: 'http'
      },
      'rhel7-results.json'
    );
    expect(guid).toBeTypeOf('string');
  });
});
