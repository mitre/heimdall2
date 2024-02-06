import axios, {AxiosInstance, AxiosResponse} from 'axios';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {Logger} from 'winston';
import {SplunkConfig} from '../types/splunk-config-types';
import {SplunkReport} from '../types/splunk-report-types';
import {createWinstonLogger} from './utils/global';
import {
  checkSplunkCredentials,
  generateHostname,
  handleSplunkErrorResponse
} from './utils/splunk-tools';

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

let logger = createWinstonLogger('Splunk2HDF');

// Groups items by using the provided key function
export function groupBy<T>(
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
export function mapHash<T, G>(old: Hash<T>, mapFunction: (v: T) => G): Hash<G> {
  const result: Hash<G> = {};
  for (const key in old) {
    result[key] = mapFunction(old[key]);
  }
  return result;
}

export function consolidatePayloads(
  payloads: SplunkReport[]
): ExecJSON.Execution[] {
  // Group by exec id
  const grouped = groupBy(payloads, (pl) => pl.meta.guid);

  const built = mapHash(grouped, consolidateFilePayloads);
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
      for (const [key, value] of Object.entries(control.descriptions)) {
        extractedDescriptions.push({label: key, data: value as string});
      }
      control.descriptions = extractedDescriptions;
    }
    return control;
  });
}

function consolidateFilePayloads(
  filePayloads: SplunkReport[]
): ExecJSON.Execution {
  // In the end we wish to produce a single evaluation EventPayload which in fact contains all data for the guid
  // Group by subtype
  const subtypes = groupBy(filePayloads, (event) => event.meta.subtype);
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
  const shaGroupedControls = groupBy(
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

function unixTimeToDate(unixTime: string): Date {
  // Splunk only currently returns ints but this could be a decimal for more precision
  return new Date(parseFloat(unixTime) * 1000);
}

export class SplunkMapper {
  config: SplunkConfig;
  axiosInstance: AxiosInstance;
  hostname: string;

  constructor(
    config: SplunkConfig,
    logService?: Logger,
    loggingLevel?: string
  ) {
    this.config = config;
    this.axiosInstance = axios.create({params: {output_mode: 'json'}});
    this.hostname = generateHostname(config);
    if (logService) {
      logger = logService;
    } else {
      logger = createWinstonLogger(MAPPER_NAME, loggingLevel || 'debug');
    }
    logger.debug(`Initialized ${this.constructor.name} successfully`);
  }

  async createJob(query: string): Promise<string> {
    logger.debug(`Creating job for query: ${query}`);
    // Post to {host}/services/search/jobs endpoint to queue search job for given query
    let jobSID: AxiosResponse;
    try {
      jobSID = await this.axiosInstance.post(
        `${this.hostname}/services/search/jobs`,
        `exec_mode=blocking&search=${query}`
      );
    } catch (error) {
      const errorCode = handleSplunkErrorResponse(error);
      throw new Error(`Failed to create search job - ${errorCode}`);
    }

    // Return unique search ID (SID) assigned to that search job for future reference
    if (_.has(jobSID, ['data', 'sid'])) {
      return jobSID.data.sid;
    } else {
      throw new Error(
        'Failed to create search job - Malformed search job creation response received'
      );
    }
  }

  async trackJob(job: string): Promise<void> {
    // All documented potential error states for a search job
    // Per https://docs.splunk.com/Documentation/Splunk/latest/RESTTUT/RESTsearches#Tips_on_accessing_searches
    const badState = new Set([
      'PAUSE',
      'INTERNAL_CANCEL',
      'USER_CANCEL',
      'BAD_INPUT_CANCEL',
      'QUIT',
      'FAILED'
    ]);
    // Arbitrary time values for waiting (in ms), change as necessary
    // Time to wait until killing search job
    const searchJobTimeout = 120000;
    // Time interval between checking on status of search job
    const searchJobPing = 50;
    let queryStatus: AxiosResponse;
    let continuePing = true;

    // Kill query after 2 minute of waiting
    // Arbitrary time used, change as needed
    const queryTimer = setTimeout(() => {
      continuePing = false;
      clearTimeout(queryTimer);
      throw new Error('Search job timed out - Unable to retrieve query');
    }, searchJobTimeout);

    // Ping Splunk instance every 50 ms on status of search job
    const awaitJob = setInterval(async () => {
      try {
        queryStatus = await this.axiosInstance.get(
          `${this.hostname}/services/search/jobs/${job}`
        );
      } catch (error) {
        clearTimeout(queryTimer);
        clearInterval(awaitJob);
        throw new Error(
          `Failed search job - ${handleSplunkErrorResponse(error)}`
        );
      }

      // Check if response schema is malformed
      if (_.has(queryStatus, ['data', 'entry'[0], 'content'])) {
        if (queryStatus.data.entry.length !== 1) {
          clearTimeout(queryTimer);
          clearInterval(awaitJob);
          throw new Error(
            `Failed search job - Detected malformed entry field length ${queryStatus.data.entry.length}`
          );
        }

        // If search job is complete, kill interval loop and exit
        if (
          queryStatus.data.entry[0].content.dispatchState === 'DONE' &&
          queryStatus.data.entry[0].content.isDone
        ) {
          clearTimeout(queryTimer);
          clearInterval(awaitJob);
        } else if (
          badState.has(queryStatus.data.entry[0].content.dispatchState)
        ) {
          // If search job returns a bad state result, kill interval loop and fail the query
          clearTimeout(queryTimer);
          clearInterval(awaitJob);
          throw new Error(
            `Failed search job - Detected dispatch state ${queryStatus.data.entry[0].content.dispatchState}`
          );
        }
      } else {
        clearTimeout(queryTimer);
        clearInterval(awaitJob);
        throw new Error(
          'Failed search job - Malformed search job response received'
        );
      }

      // Kill loop if search job times out
      if (!continuePing) {
        clearInterval(awaitJob);
      }
    }, searchJobPing);
  }

  parseSplunkResponse(
    query: string,
    results: {fields: string[]; rows: string[]}
  ): SplunkReport[] {
    logger.info(`Got results for query: ${query}`);

    // Our data parsed as Key/Value pairs
    const objects: SplunkReport[] = [];
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
    for (const value of results.rows) {
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
    }
    logger.debug('Successfully parsed and added timestamps');
    return objects;
  }

  async queryData(query: string): Promise<SplunkReport[]> {
    let queryJob: AxiosResponse;

    // Request session key for Axios instance
    const authToken = await checkSplunkCredentials(this.config);
    this.axiosInstance.defaults.headers.common['Authorization'] =
      `Bearer ${authToken}`;

    // Create new search job from given query
    const job = await this.createJob(query);

    // Track status of search job
    await this.trackJob(job);

    // Ping Splunk for search job results
    try {
      // returnCount specifies the number of found results to return, if set to 0 returns all
      // Per https://docs.splunk.com/Documentation/Splunk/9.0.5/RESTREF/RESTsearch#search.2Fv2.2Fjobs.2F.7Bsearch_id.7D.2Fresults
      const returnCount = 0;

      queryJob = await this.axiosInstance.get(
        `${this.hostname}/services/search/v2/jobs/${job}/results`,
        {
          params: {count: returnCount, output_mode: 'json_rows'}
        }
      );
    } catch (error) {
      throw new Error(
        `Failed search job - ${handleSplunkErrorResponse(error)}`
      );
    }

    // Return search job results
    if (_.has(queryJob, ['data'])) {
      return this.parseSplunkResponse(query, queryJob.data);
    } else {
      throw new Error(
        'Failed search job - Malformed search job results response received'
      );
    }
  }

  async toHdf(guid: string): Promise<ExecJSON.Execution> {
    logger.info(`Starting conversion of GUID ${guid}`);
    // Preliminary check of credentials
    // Not used for later logins
    await checkSplunkCredentials(this.config);
    logger.info(`Credentials valid, querying data for ${guid}`);

    // Start search job for query
    const executionData = await this.queryData(
      `search index="*" meta.guid="${guid}"`
    );
    logger.info(
      `Data received, consolidating payloads for ${executionData.length} items`
    );
    return consolidatePayloads(executionData)[0];
  }
}
