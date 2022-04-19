import splunkjs, {Job} from '@mitre/splunk-sdk-no-env';
import ProxyHTTP from '@mitre/splunk-sdk-no-env/lib/platform/client/jquery_http';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {SplunkConfig} from './converters-from-hdf/splunk/reverse-splunk-mapper';
import {createWinstonLogger} from './utils/global';

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

const MAPPER_NAME = 'Splunk2HDF';

let logger = createWinstonLogger("Splunk2HDF")

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

  logger.debug(`Have ${execEvents.length} execution events`);
  logger.debug(`Have ${profileEvents.length} profile events`);
  logger.debug(`Have ${controlEvents.length} control events`);

  // Verify we only have one exec event
  if (execEvents.length !== 1) {
    throw new Error(
      `Incorrect # of Evaluation events. Expected 1, got ${execEvents.length}`
    );
  }

  // Pull out the first (and only) execution event
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
    logger.debug(`Adding controls for profile with SHA256: ${sha}`);
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
    logger.debug(
      `Added ${profile.controls.length} controls to profile with SHA256 ${sha}`
    );
  }

  return exec as unknown as ExecJSON.Execution;
}

export async function checkSplunkCredentials(
  config: SplunkConfig,
  webCompatibility: boolean
): Promise<boolean> {
  let service: splunkjs.Service;
  if (webCompatibility) {
    service = new splunkjs.Service(new ProxyHTTP.JQueryHttp(''), config);
  } else {
    service = new splunkjs.Service(config);
  }
  return new Promise((resolve, reject) => {
    setTimeout(
      () =>
        reject(
          new Error(
            'Login timed out. Please check your CORS configuration or validate you have inputted the correct domain'
          )
        ),
      5000
    );
    service.login((error, result) => {
      try {
        if (error && error.status === 401) {
          if (error.status === 401) {
            reject('Incorrect Username or Password');
          } else if ('data' in error) {
            reject(_.get(error, 'data.messages[0].text'));
          }
          reject(error);
        } else if (result) {
          resolve(result);
        }
        reject(new Error('Failed to Login'));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function unixTimeToDate(unixTime: string): Date {
  // Splunk only currently returns ints but this could be a decimal for more precision
  return new Date(parseFloat(unixTime) * 1000);
}

export class SplunkMapper {
  config: SplunkConfig;
  service: splunkjs.Service;
  webCompatibility: boolean;

  constructor(
    config: SplunkConfig,
    webCompatibility = false,
    logService?: winston.Logger,
    loggingLevel?: string
  ) {
    this.config = config;
    this.webCompatibility = webCompatibility;
    if (logService) {
      logger = logService;
    } else {
      logger = createWinstonLogger(MAPPER_NAME, loggingLevel || 'debug');
    }
    logger.debug(`Initializing Splunk Client`);
    if (this.webCompatibility) {
      this.service = new splunkjs.Service(new ProxyHTTP.JQueryHttp(''), config);
    } else {
      this.service = new splunkjs.Service(config);
    }
    logger.debug(`Initialized ${this.constructor.name} successfully`);
  }

  async createJob(query: string): Promise<Job> {
    logger.debug(`Creating job for query: ${query}`);
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

  parseSplunkResponse(
    query: string,
    results: {fields: string[]; rows: string[]}
  ) {
    logger.info(`Got results for query: ${query}`);

    // Our data parsed as Key/Value pairs
    const objects: Record<string, unknown>[] = [];
    // Find _raw field, this contains our data
    let rawDataIndex = results?.fields.findIndex(
      (field) => field.toLowerCase() === '_raw'
    );

    if (rawDataIndex === -1) {
      logger.error(`Field _raw not found, using default index 3`);
      rawDataIndex = 3;
    }

    logger.debug(`Got field _raw at index ${rawDataIndex}`);

    // Find _indextime, this is when the data was imported into splunk
    let indexTimeIndex = results?.fields.findIndex(
      (field) => field.toLowerCase() === '_indextime'
    );

    if (indexTimeIndex === -1) {
      logger.error(`Field _indextime not found, using default index 2`);
      indexTimeIndex = 2;
    }

    logger.debug(`Got field _indextime at index ${indexTimeIndex}`);
    logger.verbose(`Parsing data returned by Splunk and appending timestamps`);
    results.rows.forEach((value) => {
      let object;
      try {
        object = JSON.parse(value[rawDataIndex]);
      } catch {
        throw new Error(
          'Unable to parse file. Have you configured EVENT_BREAKER? See https://github.com/mitre/saf/wiki/Splunk-Configuration'
        );
      }

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
    logger.debug('Successfully parsed and added timestamps');
    return objects;
  }

  async queryData(query: string): Promise<any[]> {
    const job = await this.createJob(query);
    return new Promise((resolve, reject) => {
      job.track(
        {},
        {
          done: () => {
            logger.debug(`Getting results for query: ${query}`);
            job.results({count: 100000}, (err, results) => {
              if (err) {
                reject(err);
              } else {
                try {
                  resolve(this.parseSplunkResponse(query, results));
                } catch (e) {
                  reject(e);
                }
              }
            });
          }
        }
      );
    });
  }

  async toHdf(guid: string): Promise<ExecJSON.Execution> {
    logger.info(`Starting conversion of guid ${guid}`);
    return checkSplunkCredentials(this.config, this.webCompatibility)
      .then(async () => {
        logger.info(`Credentials valid, querying data for ${guid}`);
        const executionData = await this.queryData(
          `search index="*" meta.guid="${guid}"`
        );
        logger.info(
          `Data received, consolidating payloads for ${executionData.length} items`
        );
        return consolidate_payloads(executionData)[0];
      })
      .catch((error) => {
        throw error;
      });
  }
}
