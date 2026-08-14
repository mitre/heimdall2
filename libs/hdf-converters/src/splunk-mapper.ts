import type {AxiosInstance, AxiosResponse} from 'axios';
import axios from 'axios';
import type {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import type {Logger} from 'winston';
import type {SplunkConfig} from '../types/splunk-config-types';
import type {SplunkReport} from '../types/splunk-report-types';
import {createWinstonLogger} from './utils/global';
import {
  checkSplunkCredentials,
  generateHostname,
  handleSplunkErrorResponse
} from './utils/splunk-tools';

export type Hash<T> = Record<string, T>;

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

// Groups items by using the provided key function
export function groupBy<T>(
  items: T[],
  keyGetter: (v: T) => string
): Hash<T[]> {
  // Grouped through a Map because the keys come from Splunk data: on a plain
  // object a key like 'constructor' resolves a prototype FUNCTION (whose
  // .push then throws), and '__proto__' hits the prototype setter instead of
  // storing. Object.fromEntries emits own data properties, so the returned
  // Hash keeps the published shape while every key stays inert data.
  const result = new Map<string, T[]>();
  for (const i of items) {
    const key = keyGetter(i);
    const corrList = result.get(key);
    if (corrList) {
      corrList.push(i);
    } else {
      result.set(key, [i]);
    }
  }
  return Object.fromEntries(result);
}

// Maps a hash to a new hash, with the same keys but each value replaced with a new (mapped) value
export function mapHash<T, G>(old: Hash<T>, mapFunction: (v: T) => G): Hash<G> {
  // Object.entries iterates OWN keys only (for-in also walked inherited
  // enumerables) and fromEntries writes own data properties — no computed
  // write remains for a hostile key to abuse.
  return Object.fromEntries(
    Object.entries(old).map(([key, value]) => [key, mapFunction(value)])
  );
}

export function consolidatePayloads(
  payloads: SplunkReport[],
  logger: Logger = createWinstonLogger(MAPPER_NAME)
): ExecJSON.Execution[] {
  // Group by exec id
  const grouped = groupBy(payloads, (pl) => pl.meta.guid);

  const built = mapHash(grouped, (filePayloads) =>
    consolidateFilePayloads(filePayloads, logger)
  );
  return Object.values(built);
}

export function replaceKeyValueDescriptions(
  controls: (ExecJSON.Control &
    GenericPayloadWithMetaData & {
      descriptions?: Record<string, string> | ExecJSON.ControlDescription[];
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
  filePayloads: SplunkReport[],
  logger: Logger
): ExecJSON.Execution {
  // In the end we wish to produce a single evaluation EventPayload which in fact contains all data for the guid
  // Group by subtype
  const subtypes = groupBy(filePayloads, (event) => event.meta.subtype);
  const execEvents = (subtypes.header ||
    []) as Partial<ExecJSON.Execution>[];
  const profileEvents = (subtypes.profile ||
    []) as unknown as (ExecJSON.Profile & GenericPayloadWithMetaData)[];
  const controlEvents = (subtypes.control ||
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
  // Map view for the dynamic read below: the sha comes from Splunk data, and
  // bracket access on the Hash would resolve prototype keys.
  const shaGroupedControls = new Map(
    Object.entries(
      groupBy(controlEvents, (ctrl) => ctrl.meta.profile_sha256)
    )
  );
  for (const profile of profileEvents) {
    profile.controls = [];
    // Get the corresponding controls, and put them into the profile
    const sha = profile.meta.profile_sha256;
    logger.debug(`Adding controls for profile with SHA256: ${sha}`);
    const corrControls = shaGroupedControls.get(sha) ?? [];
    profile.controls.push(
      ...replaceKeyValueDescriptions(
        corrControls as unknown as (ExecJSON.Control &
          GenericPayloadWithMetaData & {
            descriptions?:
              | Record<string, string>
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
  logger: Logger;

  constructor(
    config: SplunkConfig,
    logService?: Logger,
    loggingLevel?: string
  ) {
    this.config = config;
    this.axiosInstance = axios.create({params: {output_mode: 'json'}});
    this.hostname = generateHostname(config);
    this.logger =
      logService ?? createWinstonLogger(MAPPER_NAME, loggingLevel || 'debug');
    this.logger.debug(`Initialized ${this.constructor.name} successfully`);
  }

  async createJob(query: string): Promise<string> {
    this.logger.debug(`Creating job for query: ${query}`);
    // Post to {host}/services/search/jobs endpoint to queue search job for given query
    let jobSID: AxiosResponse;
    try {
      jobSID = await this.axiosInstance.post(
        `${this.hostname}/services/search/jobs`,
        `exec_mode=blocking&search=${query}`
      );
    } catch (error) {
      const errorCode = handleSplunkErrorResponse(error);
      throw new Error(`Failed to create search job - ${errorCode}`, {
        cause: error
      });
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

  // queryData awaits this before fetching results, so it must not resolve
  // until Splunk reports the job DONE. The previous implementation resolved
  // immediately while a detached setInterval kept polling — results could be
  // fetched for an unfinished job, and every throw inside the timer
  // callbacks was an unhandled rejection the caller never saw.
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
    const searchJobTimeout = 120_000;
    // Time interval between checking on status of search job
    const searchJobPing = 50;
    const deadline = Date.now() + searchJobTimeout;

    while (Date.now() < deadline) {
      let queryStatus: AxiosResponse;
      try {
        queryStatus = await this.axiosInstance.get(
          `${this.hostname}/services/search/jobs/${job}`,
          // Bound each poll by the remaining budget so a hung request cannot
          // outlive the overall search job timeout.
          {timeout: Math.max(1, deadline - Date.now())}
        );
      } catch (error) {
        if (
          _.get(error, 'code') === 'ECONNABORTED' ||
          _.get(error, 'code') === 'ETIMEDOUT'
        ) {
          throw new Error('Search job timed out - Unable to retrieve query', {
            cause: error
          });
        }
        throw new Error(
          `Failed search job - ${handleSplunkErrorResponse(error)}`,
          {cause: error}
        );
      }

      // Check if response schema is malformed
      if (!_.has(queryStatus, 'data.entry[0].content')) {
        throw new Error(
          'Failed search job - Malformed search job response received'
        );
      }
      if (queryStatus.data.entry.length !== 1) {
        throw new Error(
          `Failed search job - Detected malformed entry field length ${queryStatus.data.entry.length}`
        );
      }

      const {dispatchState, isDone} = queryStatus.data.entry[0].content;
      // If search job is complete, exit
      if (dispatchState === 'DONE' && isDone) {
        return;
      }
      // If search job returns a bad state result, fail the query
      if (badState.has(dispatchState)) {
        throw new Error(
          `Failed search job - Detected dispatch state ${dispatchState}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, searchJobPing));
    }
    throw new Error('Search job timed out - Unable to retrieve query');
  }

  parseSplunkResponse(
    query: string,
    // rows is an array of ROWS (each an array of column strings) — the old
    // string[] annotation only compiled because indexing a string also
    // typechecks; JSON.parse below consumes a whole column value.
    results: {fields: string[]; rows: string[][]}
  ): SplunkReport[] {
    this.logger.info(`Got results for query: ${query}`);

    // Our data parsed as Key/Value pairs
    const objects: SplunkReport[] = [];
    // Find _raw field, this contains our data
    let rawDataIndex = results?.fields.findIndex(
      (field) => field.toLowerCase() === '_raw'
    );

    if (rawDataIndex === -1) {
      this.logger.error(`Field _raw not found, using default index 3`);
      rawDataIndex = 3;
    }

    this.logger.debug(`Got field _raw at index ${rawDataIndex}`);

    // Find _indextime, this is when the data was imported into splunk
    let indexTimeIndex = results?.fields.findIndex(
      (field) => field.toLowerCase() === '_indextime'
    );

    if (indexTimeIndex === -1) {
      this.logger.error(`Field _indextime not found, using default index 2`);
      indexTimeIndex = 2;
    }

    this.logger.debug(`Got field _indextime at index ${indexTimeIndex}`);
    this.logger.verbose(
      `Parsing data returned by Splunk and appending timestamps`
    );
    for (const value of results.rows) {
      let object;
      try {
        // .at() with a '' fallback: an out-of-range index lands in this
        // same catch exactly as the old undefined-coercion path did.
        object = JSON.parse(value.at(rawDataIndex) ?? '');
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
          unixTimeToDate(value.at(indexTimeIndex) ?? '').toISOString()
        );
      } catch {
        // Parsing dates can be tricky sometimes
        _.set(object, 'meta.parse_time', new Date().toISOString());
      }

      objects.push(object);
    }
    this.logger.debug('Successfully parsed and added timestamps');
    return objects;
  }

  async queryData(query: string): Promise<SplunkReport[]> {
    let queryJob: AxiosResponse;

    // Request session key for Axios instance
    const authToken = await checkSplunkCredentials(this.config);
    this.axiosInstance.defaults.headers.common.Authorization =
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
        `Failed search job - ${handleSplunkErrorResponse(error)}`,
        {cause: error}
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
    this.logger.info(`Starting conversion of GUID ${guid}`);
    // Preliminary check of credentials
    // Not used for later logins
    await checkSplunkCredentials(this.config);
    this.logger.info(`Credentials valid, querying data for ${guid}`);

    // Start search job for query
    const executionData = await this.queryData(
      `search index="*" meta.guid="${guid}"`
    );
    this.logger.info(
      `Data received, consolidating payloads for ${executionData.length} items`
    );
    return consolidatePayloads(executionData, this.logger)[0];
  }
}
