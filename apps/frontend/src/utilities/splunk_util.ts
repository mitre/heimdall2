import splunkjs, {SplunkConfig} from '@mitre/splunk-sdk-no-env';
import ProxyHTTP from '@mitre/splunk-sdk-no-env/lib/platform/client/jquery_http';
import {ExecJSON} from 'inspecjs';
import {group_by, map_hash} from './helper_util';

export type JobID = number;

export interface GenericPayloadWithMetaData {
  meta: FileMetaData;
  [key: string]: never[] | Record<string, unknown>;
}

export interface FileMetaData {
  guid: string;
  start_time: Date;
  subtype: string;
  hdf_splunk_schema: string;
  filetype: string;
  parse_time: Date;
  filename: string;
  profile_sha256: string;
  [key: string]: never[] | unknown;
}

export class SplunkClient {
  service: splunkjs.Service;

  constructor(config: SplunkConfig) {
    this.service = new splunkjs.Service(new ProxyHTTP.JQueryHttp(''), config);
  }

  validateCredentials(): boolean {
    return this.service.login((error, success) => {
      if (error) {
        throw error;
      } else {
        return success;
      }
    });
  }
}

export function consolidate_payloads(
  payloads: GenericPayloadWithMetaData[]
): ExecJSON.Execution[] {
  // Group by exec id
  const grouped = group_by(payloads, (pl) => pl.meta.guid);

  const built = map_hash(grouped, consolidateFilePayloads);
  return Object.values(built);
}

export function replaceKeyValueDescriptions(
  controls: (ExecJSON.Control &
    GenericPayloadWithMetaData & {
      descriptions?: {[key: string]: string} | ExecJSON.ControlDescription[];
    })[]
) {
  return controls.map((control) => {
    if (control.descriptions && !Array.isArray(control.descriptions)) {
      const extractedDescriptions: ExecJSON.ControlDescription[] = [];
      Object.entries(control.descriptions).forEach(([key, value]) => {
        extractedDescriptions.push({label: key, data: value as string});
      });
      control.descriptions = extractedDescriptions;
    }
    return control;
  });
}

function consolidateFilePayloads(
  filePayloads: GenericPayloadWithMetaData[]
): ExecJSON.Execution {
  // In the end we wish to produce a single evaluation EventPayload which in fact contains all data for the guid
  // Group by subtype
  const subtypes = group_by(filePayloads, (event) => event.meta.subtype);
  const execEvents = (subtypes['header'] ||
    []) as Partial<ExecJSON.Execution>[];
  const profileEvents = (subtypes['profile'] ||
    []) as unknown as (ExecJSON.Profile & GenericPayloadWithMetaData)[];
  const controlEvents = (subtypes['control'] ||
    []) as unknown as (ExecJSON.Control & GenericPayloadWithMetaData)[];

  // Verify we only have one exec event
  if (execEvents.length !== 1) {
    throw new Error(
      `Incorrect # of Evaluation events. Expected 1, got ${execEvents.length}`
    );
  }

  // Pull it out
  const exec = execEvents[0];

  // Put all the profiles into the exec
  exec.profiles?.push(...profileEvents);

  // Group controls, and then put them into the profiles
  const shaGroupedControls = group_by(
    controlEvents,
    (ctrl) => ctrl.meta.profile_sha256
  );
  for (const profile of profileEvents) {
    profile.controls = [];
    // Get the corresponding controls, and put them into the profile
    const sha = profile.meta.profile_sha256;
    const corrControls = shaGroupedControls[sha] || [];
    profile.controls.push(
      ...replaceKeyValueDescriptions(
        corrControls as unknown as (ExecJSON.Control &
          GenericPayloadWithMetaData & {
            descriptions?:
              | {[key: string]: string}
              | ExecJSON.ControlDescription[];
          })[]
      )
    );
  }

  return exec as unknown as ExecJSON.Execution;
}

// export async function getExecution(
//   splunkClient: SplunkClient,
//   guid: string
// ): Promise<ExecJSON.Execution> {
//   const jobId = await createSearch(splunkClient, `"meta.guid"=${guid}`);
//   const executionPayloads = waitForJob(splunkClient, jobId);
//   return executionPayloads
//     .then((payloads) => consolidate_payloads(payloads))
//     .then((executions) => executions[0]);
// }

// export async function getAllExecutions(
//   splunkClient: SplunkClient,
//   searchQuery: string
// ): Promise<FileMetaData[]> {
//   const jobId = await createSearch(splunkClient, searchQuery);
//   return waitForJob(splunkClient, jobId).then(
//     (executions: GenericPayloadWithMetaData[]) =>
//       executions.map((execution) => execution.meta)
//   );
// }

// export async function createSearch(
//   splunkClient: SplunkClient,
//   searchString?: string
//   // We basically can't, and really shouldn't, do typescript here. Output is changes depending on the job called
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// ): Promise<JobID> {
//   const fullQuery = `search=search ${searchString || ''}`;
//   return apiClient({
//     method: 'POST',
//     url: `${splunkClient.host}/services/search/jobs?output_mode=json`,
//     headers: {
//       'Content-Type': 'text/plain'
//     },
//     data: fullQuery
//   }).then(({data}) => {
//     return _.get(data, 'sid');
//   });
// }
