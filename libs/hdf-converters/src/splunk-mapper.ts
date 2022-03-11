import splunkjs, {Job} from '@mitre/splunk-sdk-no-env';
import ProxyHTTP from '@mitre/splunk-sdk-no-env/lib/platform/client/jquery_http';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {SplunkConfig} from './converters-from-hdf/splunk/reverse-splunk-mapper';

export type Hash<T> = {[key: string]: T};

export type SplunkConfigNoIndex = Omit<SplunkConfig, 'index'>;

export type GenericPayloadWithMetaData = {
  meta: FileMetaData;
  [key: string]: never[] | Record<string, unknown>;
};

export type FileMetaData = {
  guid: string;
  subtype: string;
  hdf_splunk_schema: string;
  filetype: string;
  filename: string;
  profile_sha256: string;
  [key: string]: never[] | unknown;
};

// Groups items by using the provided key function
export function group_by<T>(
  items: Array<T>,
  keyGetter: (v: T) => string
): Hash<Array<T>> {
  const result: Hash<Array<T>> = {};
  for (const i of items) {
    // Get the items key
    const key = keyGetter(i);

    // Get the list it should go in
    const corrList = result[key];
    if (corrList) {
      // If list exists, place
      corrList.push(i);
    } else {
      // List does not exist; create and put
      result[key] = [i];
    }
  }
  return result;
}

// Maps a hash to a new hash, with the same keys but each value replaced with a new (mapped) value
export function map_hash<T, G>(
  old: Hash<T>,
  mapFunction: (v: T) => G
): Hash<G> {
  const result: Hash<G> = {};
  for (const key in old) {
    result[key] = mapFunction(old[key]);
  }
  return result;
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

export async function checkSplunkCredentials(
  config: SplunkConfigNoIndex
): Promise<boolean> {
  const service = new splunkjs.Service(new ProxyHTTP.JQueryHttp(''), config);
  return new Promise((resolve, reject) => {
    try {
      service.login((error, result) => {
        if (error) {
          if ('status' in error) {
            if (error.status === 401) {
              reject('Incorrect Username or Password');
            }
            reject(_.get(error, 'data.messages[0].text'));
          } else {
            reject(error);
          }
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to Login'));
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function unixTimeToDate(unixTime: string): Date {
  // Splunk only currently returns ints but this could be a decimal for more precision
  return new Date(parseFloat(unixTime) * 1000);
}

export class SplunkMapper {
  config: SplunkConfig;
  service: splunkjs.Service;

  constructor(config: SplunkConfig) {
    this.config = config;
    this.service = new splunkjs.Service(new ProxyHTTP.JQueryHttp(''), config);
  }

  async createJob(query: string): Promise<Job> {
    return new Promise((resolve, reject) => {
      this.service
        .jobs()
        .create(
          query,
          {exec_mode: 'blocking'},
          (error: any, createdJob: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(createdJob);
            }
          }
        );
    });
  }

  async queryData(query: string): Promise<any[]> {
    const job = await this.createJob(query);
    return new Promise((resolve, reject) => {
      job.track(
        {},
        {
          done: (job) =>
            job.results({count: 100000}, (err, results) => {
              if (err) {
                reject(err);
              }
              // Our data parsed as Key/Value pairs
              const objects: Record<string, unknown>[] = [];
              // Find _raw field, this contains our data
              const rawDataIndex =
                results?.fields.findIndex(
                  (field) => field.toLowerCase() === '_raw'
                ) || 4;

              // Find _indextime, this is when the data was imported into splunk
              const indexTimeIndex =
                results?.fields.findIndex(
                  (field) => field.toLowerCase() === '_indextime'
                ) || 4;

              results.rows.forEach((value) => {
                const object = JSON.parse(value[rawDataIndex]);
                // Set the date from the _indextime
                try {
                  _.set(
                    object,
                    'meta.parse_time',
                    unixTimeToDate(value[indexTimeIndex]).toISOString()
                  );
                } catch {
                  // Parsing dates can be tricky sometimes
                  _.set(object, 'meta.parse_time', new Date().toISOString());
                }

                objects.push(object);
              });
              resolve(objects);
            })
        }
      );
    });
  }

  async toHdf(guid: string): Promise<ExecJSON.Execution> {
    return checkSplunkCredentials(this.config)
      .then(async () => {
        const executuiondata = await this.queryData(
          `search meta.guid="${guid}"`
        );
        return consolidate_payloads(executuiondata)[0];
      })
      .catch((error) => {
        throw error;
      });
  }
}
