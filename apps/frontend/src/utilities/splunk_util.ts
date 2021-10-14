import axios from 'axios';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {basic_auth} from './helper_util';

export type JobID = number;

const apiClient = axios.create();

export const completedJobs: Record<number, unknown> = {};

export interface MetaData {
  statistics: {
    duration: number;
  };
  version: string;
  platform: {
    release: string;
    name: string;
  };
  meta: {
    guid: string;
    start_time: Date;
    subtype: string;
    hdf_splunk_schema: string;
    filetype: string;
    parse_time: Date;
    filename: string;
  };
  profiles: never[];
}

export class SplunkClient {
  host: string;
  username: string;
  password: string;

  constructor(host: string, username: string, password: string) {
    this.host = host;
    this.username = username;
    this.password = password;
  }

  async validateCredentials(): Promise<boolean> {
    // Call axios.create() to skip the default interceptors setup in main.ts
    return axios
      .create()
      .get(`${this.host}/services/search/jobs`, {
        headers: {
          Authorization: basic_auth(this.username, this.password)
        },
        method: 'GET'
      })
      .then(() => {
        apiClient.defaults.headers.common['Authorization'] = basic_auth(
          this.username,
          this.password
        );
        return true;
      })
      .catch(() => false);
  }
}

async function waitForJob(
  splunkClient: SplunkClient,
  id: JobID
): Promise<MetaData[]> {
  const completed = await apiClient
    .get(`${splunkClient.host}/services/search/jobs/${id}?output_mode=json`)
    .then(({data}) => data.entry[0].content.isDone);
  if (!completed) {
    return new Promise(() =>
      setTimeout(() => waitForJob(splunkClient, id), 1000)
    );
  } else {
    return apiClient
      .get(
        `${splunkClient.host}/services/search/jobs/${id}/results?output_mode=json`
      )
      .then(({data}) => {
        completedJobs[id] = data.results.map((result: {_raw: string}) =>
          JSON.parse(result._raw)
        );
        return data.results.map((result: {_raw: string}) =>
          JSON.parse(result._raw)
        );
      });
  }
}

export async function getExecution(
  splunkClient: SplunkClient,
  guid: string
): Promise<ExecJSON.Execution> {
  return createSearch(
    splunkClient,
    `spath "meta.guid" | search "meta.guid"=${guid}`
  ).then((searchresult) => {
    return searchresult;
  });
}

export async function getAllExecutions(
  splunkClient: SplunkClient
): Promise<MetaData[]> {
  return createSearch(
    splunkClient,
    'spath "meta.subtype" | search "meta.subtype"=header'
  ).then((executions) =>
    executions.map((execution: MetaData) => execution.meta)
  );
}

export async function createSearch(
  splunkClient: SplunkClient,
  searchString?: string
  // We basically can't, and really shouldn't, do typescript here. Output is changes depending on the job called
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  return apiClient
    .post(`${splunkClient.host}/services/search/jobs?output_mode=json`, {
      body: `search index="hdf" | ${searchString || ''}`
    })
    .then(({data}) => {
      const jobs = _.get(data, 'entry');
      const queryId = _.get(data, 'entry[0].content.sid');
      return waitForJob(splunkClient, queryId);
    });
}
