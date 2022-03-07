import axios from 'axios';
import fs from 'fs';
import {FromHDFToSplunkMapper} from '../../../src/converters-from-hdf/splunk/reverse-splunk-mapper';

const splunkAuthorization = 'Basic YWRtaW46VmFsaWRfcGFzc3dvcmQh'; // Admin:Valid_password!

async function waitForJob(id: string): Promise<any> {
  const completed = await axios
    .get(`http://127.0.0.1:8089/services/search/jobs/${id}?output_mode=json`, {
      headers: {
        Authorization: splunkAuthorization // Admin:Valid_password!
      }
    })
    .then(({data}) => data.entry[0].content.isDone);
  if (!completed) {
    return waitForJob(id);
  } else {
    return axios
      .get(
        `http://127.0.0.1:8089/services/search/jobs/${id}/results?output_mode=json&count=200000`,
        {
          headers: {
            Authorization: splunkAuthorization
          }
        }
      )
      .then(({data}) => {
        return data.results.map((result: {_raw: string}) => {
          if (typeof result._raw === 'string') {
            return result._raw;
          }
          return JSON.parse(result._raw);
        });
      });
  }
}

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
