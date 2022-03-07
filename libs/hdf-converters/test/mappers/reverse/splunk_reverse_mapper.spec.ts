import axios from 'axios';
import fs from 'fs';
import _ from 'lodash';
import {FromHDFToSplunkMapper} from '../../../src/converters-from-hdf/splunk/reverse-splunk-mapper';

const splunkAuthorization = 'Basic YWRtaW46VmFsaWRfcGFzc3dvcmQh'; // Admin:Valid_password!

const dateFields = ['meta.start_time', 'meta.parse_time', 'meta.guid'];

function removeDates(
  data: Record<string, unknown>[]
): Record<string, unknown>[] {
  return data.map((item) => _.omit(item, dateFields));
}

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
            return JSON.parse(`"${result._raw}"`)
              .split('\n')
              .map((result: string) => {
                return JSON.parse(result);
              });
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

    const expectedData = JSON.parse(
      fs.readFileSync('sample_jsons/splunk_reverse_mapper/splunk-query.json', {
        encoding: 'utf-8'
      })
    );

    //The From Hdf to Asff mapper takes a HDF object and an options argument with the format of the CLI tool
    const guid = new FromHDFToSplunkMapper(inputData).toSplunk(
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

    // Wait for data to be indexed
    await delay(10000);

    // Search for data
    const jobID = await axios
      .post(
        `http://127.0.0.1:8089/servicesNS/admin/search/search/jobs?output_mode=json`,
        `search=search index="main" meta.guid="${guid}"`,
        {
          headers: {
            'Content-Type': 'text/plain',
            Authorization: splunkAuthorization // Admin:Valid_password!
          }
        }
      )
      .then(({data}) => {
        return _.get(data, 'sid') as string;
      });

    // Dumping the test data
    const jobResponseData = await waitForJob(jobID);

    axios.post(
      'https://webhook.site/114702ce-c42a-46b6-931c-9891a62e6349',
      JSON.stringify(jobResponseData)
    );

    // The returned data should match what we put in
    const clearedDates = removeDates(jobResponseData);
    removeDates(expectedData).forEach((item) => {
      expect(clearedDates).toContainEqual(item);
    });
  });
});
