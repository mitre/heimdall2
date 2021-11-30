import axios from 'axios';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {basic_auth, group_by, map_hash} from './helper_util';

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
  meta: FileMetaData;
  profiles: never[];
}

export interface FileMetaData {
  guid: string;
  start_time: Date;
  subtype: string;
  hdf_splunk_schema: string;
  filetype: string;
  parse_time: Date;
  filename: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const completed = await apiClient
    .get(`${splunkClient.host}/services/search/jobs/${id}?output_mode=json`)
    .then(({data}) => data.entry[0].content.isDone);
  if (!completed) {
    return waitForJob(splunkClient, id);
  } else {
    const promise = axios
      .get(
        `${splunkClient.host}/services/search/jobs/${id}/results?output_mode=json&count=200000`,
        {
          headers: {
            Authorization: basic_auth(
              splunkClient.username,
              splunkClient.password
            )
          }
        }
      )
      .then(({data}) => {
        completedJobs[id] = data.results.map((result: {_raw: string}) => {
          return JSON.parse(result._raw);
        });
        return data.results.map((result: {_raw: string}) =>
          JSON.parse(result._raw)
        );
      });
    return promise;
  }
}

export function consolidate_payloads(payloads: any[]): ExecJSON.Execution[] {
  // Group by exec id
  const grouped = group_by(payloads, (pl) => pl.meta.guid);

  const built = map_hash(grouped, consolidate_file_payloads);
  return Object.values(built);
}

function consolidate_file_payloads(filePayloads: any[]): any {
  // In the end we wish to produce a single evaluation EventPayload which in fact contains all data for the guid
  // Group by subtype
  const subtypes = group_by(filePayloads, (event) => event.meta.subtype);
  const execEvents = (subtypes['header'] || []) as any[];
  const profileEvents = (subtypes['profile'] || []) as any[];
  const controlEvents = (subtypes['control'] || []) as any[];

  // Verify we only have one exec event
  if (execEvents.length !== 1) {
    throw new Error(
      `Incorrect # of Evaluation events. Expected 1, got ${execEvents.length}`
    );
  }

  // Pull it out
  const exec = execEvents[0];

  // Put all the profiles into the exec
  exec.profiles.push(...profileEvents);

  // Group controls, and then put them into the profiles
  const shaGroupedControls = group_by(
    controlEvents,
    (ctrl) => ctrl.meta.profile_sha256
  );
  for (const profile of profileEvents) {
    // Get the corresponding controls, and put them into the profile
    const sha = profile.meta.profile_sha256;
    const corrControls = shaGroupedControls[sha] || [];
    profile.controls.push(...corrControls);
  }

  return exec;
}

export async function getExecution(
  splunkClient: SplunkClient,
  guid: string
): Promise<ExecJSON.Execution> {
  const jobId = await createSearch(
    splunkClient,
    `spath "meta.guid" | search "meta.guid"=${guid}`
  );
  const executionPayloads = waitForJob(splunkClient, jobId);
  return executionPayloads
    .then((payloads) => consolidate_payloads(payloads))
    .then((executions) => executions[0]);
}

export async function getAllExecutions(
  splunkClient: SplunkClient
): Promise<FileMetaData[]> {
  const jobId = await createSearch(
    splunkClient,
    'spath "meta.subtype" | search "meta.subtype"=header'
  );
  return waitForJob(splunkClient, jobId).then((executions: MetaData[]) =>
    executions.map((execution) => execution.meta)
  );
}

export async function createSearch(
  splunkClient: SplunkClient,
  searchString?: string
  // We basically can't, and really shouldn't, do typescript here. Output is changes depending on the job called
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<JobID> {
  const fullQuery = `search=search index="hdf" | ${searchString || ''}`;
  return axios({
    method: 'POST',
    url: `${splunkClient.host}/services/search/jobs?output_mode=json`,
    headers: {
      Authorization: basic_auth(splunkClient.username, splunkClient.password),
      'Content-Type': 'text/plain'
    },
    data: fullQuery
  }).then(({data}) => {
    return _.get(data, 'sid');
  });
}
