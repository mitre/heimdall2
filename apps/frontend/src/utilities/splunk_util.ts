import {parse, schemas_1_0} from 'inspecjs';
import {ElementCompact, xml2js} from 'xml-js';
import {delay} from './async_util';
import {basic_auth, group_by, map_hash} from './helper_util';

export type JobID = string;

// Interfaces
/** The parent type to other interfaces, to save duplication */
interface AbsMetaInfo {
  /** The file this came from */
  filename: string;

  /** The type of the file (NOT of this event!) */
  filetype: 'evaluation' | 'profile';

  /** The subtype of this specific event */
  subtype: 'header' | 'profile' | 'control';

  /** A randomly generated GUID capturing all of the events in this file */
  guid: string;

  /** When this event was parsed */
  parse_time: string;

  /** The schema version: */
  hdf_splunk_schema: string;

  /** The sha256 hash of the profile that is/contains this event */
  profile_sha256: string;

  /** The start time of the control in ISO format */
  startTime: string;

  /** The control ID, repeated for convenience in splunk searches */
  control_id: string;
}

/** The meta information for an event with the "evaluation" subtype */
export interface ExecutionMetaInfo
  extends Omit<AbsMetaInfo, 'control_id' | 'startTime' | 'profile_sha256'> {
  subtype: 'header';
}

/** The meta information for an event with the "profile" subtype */
export interface ProfileMetaInfo
  extends Omit<AbsMetaInfo, 'control_id' | 'startTime'> {
  subtype: 'profile';
}

/** The meta information for an event with the "control" subtype */
export interface ControlMetaInfo extends AbsMetaInfo {
  subtype: 'control';
}

/** This is what we expect to find in every parsed event representing an Evaluation
 * Note that Profiles will typically be initially empty
 */
export interface ExecutionPayload {
  meta: ExecutionMetaInfo;
  profiles: ProfilePayload[];
}

/** This is what we expect to find in every parsed event representing a Profile.
 * Note that controls will typically be initially empty
 */
export interface ProfilePayload {
  meta: ProfileMetaInfo;
  controls: ControlPayload[];
}

/** This is what we expect to find in every parsed event representing a Control */
export interface ControlPayload {
  meta: ControlMetaInfo;
}

// Could be any!
export type UnknownPayload = ExecutionPayload | ProfilePayload | ControlPayload;

/* Job states */
type CompleteJobStatus = 'succeeded' | 'failed';
type PendingJobStatus = 'pending'; // There are others, but we don't handle them for now
type JobStatus = CompleteJobStatus | PendingJobStatus;
interface JobState {
  status: JobStatus;
  jobId: JobID;
}

/** This info is used to negotiate splunk connections */
export class SplunkEndpoint {
  /** The full host information, including port (typically 8089).
   * EX: https://localhost:8089
   */
  host: string;

  /** Username to use for authentication */
  username: string;

  /** Password to use for authentication */
  password: string;

  constructor(host: string, username: string, password: string) {
    this.host = host;
    this.username = username;
    this.password = password;
  }

  /** Checks whether we're able to successfully get jobs,
   * which indicates proper auth.
   *
   * Will error if we aren't
   */

  process_response(response: Response) {
    if (!response.ok) {
      throw process_error(response);
    }
    return response.text();
  }

  async check_auth(): Promise<void> {
    return fetch(`${this.host}/services/search/jobs`, {
      headers: {
        Authorization: this.authString
      },
      method: 'GET'
    }).then(
      (response) => {
        if (!response.ok) {
          throw process_error(response);
        }
      },
      (failure) => {
        throw process_error(failure);
      }
    );
  }

  /** Provides a list of Evaluation meta headers from recent executions.
   * We should eventually change this to allow more specific criteria
   */
  async fetch_execution_list(): Promise<ExecutionMetaInfo[]> {
    // This search lists evaluation headers
    const getExecutionsSearch =
      'spath "meta.subtype" | search "meta.subtype"=header';

    return this.hdf_event_search(getExecutionsSearch).then((events) => {
      // Because we only searched for headers, we can assume these to be eval events
      const evalEvents = events as ExecutionPayload[];

      // Could perhaps just return e but I'd rather people didn't screw themselves
      return evalEvents.map((e) => e.meta);
    });
  }

  async get_execution_events(executionGuid: string): Promise<UnknownPayload[]> {
    // This search, provided a guid, returns all headers for that guid
    const specificEvaluation = `spath "meta.guid" | search "meta.guid"=${executionGuid}`;
    return this.hdf_event_search(specificEvaluation);
  }

  async get_execution(
    executionGuid: string
  ): Promise<schemas_1_0.ExecJSON.Execution> {
    return this.get_execution_events(executionGuid)
      .then((events) => consolidate_payloads(events))
      .then((execs) => {
        if (execs.length !== 1) {
          throw SplunkErrorCode.InvalidGUID;
        } else {
          return execs[0];
        }
      })
      .then((fullEvent) => {
        // This is dumb and we should make the inspecjs layer more accepting of many file types
        let result: parse.ConversionResult;
        try {
          result = parse.convertFile(JSON.stringify(fullEvent));
        } catch (e) {
          throw SplunkErrorCode.SchemaViolation;
        }

        // Determine what sort of file we (hopefully) have, then add it
        if (result['1_0_ExecJson']) {
          // Handle as exec
          return result['1_0_ExecJson'];
        } else {
          throw SplunkErrorCode.SchemaViolation;
        }
      });
  }

  /** Creates a proper base64 encoded auth string, using this objects credentials. */
  private get authString(): string {
    return basic_auth(this.username, this.password);
  }

  /** Performs the entire process of search string -> results array
   *  Performs no consolidation.
   *  Assumes your search string is properly constrained to the hdf index
   */
  async hdf_event_search(searchString: string): Promise<UnknownPayload[]> {
    return this.create_search(searchString)
      .then((jobId) => this.pend_job(jobId, 500))
      .then((jobState) => {
        if (jobState.status === 'failed') {
          throw SplunkErrorCode.SearchFailed;
        }

        return this.get_search_results(jobState.jobId);
      })
      .catch((error) => {
        throw process_error(error);
      });
  }

  /** Returns the job id */
  private async create_search(searchString: string): Promise<JobID> {
    return fetch(`${this.host}/services/search/jobs`, {
      method: 'POST',
      headers: new Headers({
        Authorization: this.authString
      }),
      body: `search=search index="hdf" | ${searchString}`
    })
      .then(this.process_response)
      .then((text) => {
        // Parse the xml
        const xml = xml2js(text, {
          compact: true
        }) as ElementCompact;
        return xml.response.sid._text as string;
      });
  }

  /** Returns the current state of the job */
  private async check_job(jobId: JobID): Promise<JobState> {
    return fetch(`${this.host}/services/search/jobs/${jobId}`, {
      method: 'GET',
      headers: new Headers({
        Authorization: this.authString
      })
    })
      .then(this.process_response)
      .then((text) => {
        // Parse the xml
        const xml = xml2js(text, {
          compact: true
        }) as ElementCompact;

        // Get the keys, and find the one with name "dispatchState"
        const keys = xml.entry.content['s:dict']['s:key'];
        let state: string | undefined;
        for (const k of keys) {
          if (k._attributes.name === 'dispatchState') {
            state = k._text;
          }
        }

        // Check we found state
        if (!state) {
          // It probably failed if we can't find it lol
          state = 'FAILED';
        }

        // Decide result based on state
        let status: JobStatus;
        if (state === 'DONE') {
          status = 'succeeded';
        } else if (state === 'FAILED') {
          status = 'failed';
        } else {
          status = 'pending';
        }

        // Construct the state
        return {
          status,
          jobId
        };
      });
  }

  /** Continually checks the job until resolution */
  private async pend_job(jobId: JobID, interval: number): Promise<JobState> {
    /* eslint-disable */
        while (true) {
            /* eslint-enable */
      const state = await this.check_job(jobId);
      if (state.status === 'pending') {
        await delay(interval);
      } else {
        return state;
      }
    }
  }

  /** Gets the search results for a given job id, if it is done */
  private async get_search_results(jobId: JobID): Promise<UnknownPayload[]> {
    return fetch(
      `${this.host}/services/search/jobs/${jobId}/results/?output_mode=json&count=0`,
      {
        headers: {
          Authorization: this.authString
        },
        method: 'GET'
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw process_error(response);
        }
        return response.json();
      })
      .then((data) => {
        // We basically can't, and really shouldn't, do typescript here. Output is 50% guaranteed to be wonk
        // Get all the raws
        const raws: Array<string> = data['results'].map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (datum: any) => datum._raw
        );

        // Parse to json, and freeze
        const parsed = [] as UnknownPayload[];
        for (const v of raws) {
          try {
            parsed.push(JSON.parse(v) as UnknownPayload);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn(err);
          }
        }

        return parsed;
      });
  }
}

/** Given: A list of all payloads from a search,
 * Produce: A list of Evaluation payloads containing all data properly reconstructed, recursively, into a "normal"
 * HDF heirarchy.
 *
 * TODO: Provide a mechanism for also returning orphaned items
 */
export function consolidate_payloads(
  payloads: UnknownPayload[]
): ExecutionPayload[] {
  // Group by exec id
  const grouped = group_by(payloads, (pl) => pl.meta.guid);

  const built = map_hash(grouped, consolidate_file_payloads);

  return Object.values(built);
}

/** Given: A list of all payloads from a search with the same GUID
 * Produce: A single EvaluationPayload containing all of these payloads reconstructed into the expected HDF heirarchy
 */
function consolidate_file_payloads(
  filePayloads: UnknownPayload[]
): ExecutionPayload {
  // In the end we wish to produce a single evaluation EventPayload which in fact contains all data for the guid
  // Group by subtype
  const subtypes = group_by(filePayloads, (event) => event.meta.subtype);
  const execEvents = (subtypes['header'] || []) as ExecutionPayload[];
  const profileEvents = (subtypes['profile'] || []) as ProfilePayload[];
  const controlEvents = (subtypes['control'] || []) as ControlPayload[];

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

  // Spit it back out
  return exec;
}

export enum SplunkErrorCode {
  BadNetwork, // Server could not be reached, either due to bad address or bad CORS
  BadUrl, // URL poorly formed
  PageNotFound, // Server gave error 404
  BadAuth, // Authorization credentials are no good
  SearchFailed, // For whatever reason, the splunk search failed
  ConsolidationFailed, // Something went wrong during event consolidation phase
  SchemaViolation, // The data we got out isn't valid HDF. Hope to not see this too often
  InvalidGUID, // If the provided GUID did not match to exactly one header
  UnknownError // No clue!
}

/** Converts Responses and Errorcodes into purely just errorcodes */
export function process_error(
  r: Response | SplunkErrorCode | TypeError
): SplunkErrorCode {
  if (r instanceof TypeError) {
    if (r.message.includes('NetworkError')) {
      return SplunkErrorCode.BadNetwork;
    } else if (r.message.includes('not a valid URL')) {
      return SplunkErrorCode.BadUrl;
    }
  } else if (r instanceof Response) {
    // Based on the network code, guess
    const response = r;
    switch (response.status) {
      case 401: // Bad username/password
        return SplunkErrorCode.BadAuth;
      case 404: // URL got borked
        return SplunkErrorCode.PageNotFound;
      default:
        return SplunkErrorCode.UnknownError;
    }
  } else if (typeof r === typeof SplunkErrorCode.UnknownError) {
    // It's already an error code - pass along
    return r;
  }
  // idk lol
  return SplunkErrorCode.UnknownError;
}
