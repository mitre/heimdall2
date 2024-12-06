import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_CCI_TAGS,
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
} from './mappings/CciNistMappingData';
const CONVEYOR_MAX_SCORE = 1000;
enum scannerType {
  ClamAV = 'Clamav',
  CodeQuality = 'CodeQuality',
  Moldy = 'Moldy',
  Stigma = 'Stigma'
}

/*
Uses score to determine pass or fail. Non-zero score is fail
*/
function determineStatus(score: number): ExecJSON.ControlResultStatus {
  if (score === 0) {
    return ExecJSON.ControlResultStatus.Passed;
  }
  return ExecJSON.ControlResultStatus.Failed;
}

/*
Groups findings by scanner (service) for final json
*/
function groupByScanner(
  processed: Record<string, unknown>[]
): Record<string, unknown> {
  const groups = _.groupBy(processed, (result) => {
    return _.get(result, 'response.service_name');
  });
  return groups;
}

/*
Goes through api_response.file_tree finding children of each file(sorted by hash), pulling out 
filename sha pairs
*/
function collateShaAndFilenames(
  currLevel: Record<string, unknown>
): string[][] {
  const shaFilePairs: string[][] = [];
  for (const [sha, file] of Object.entries(currLevel)) {
    if (_.has(file, 'name')) {
      //name always array of size 1
      const name: string = _.get(file, 'name[0]') || '';
      shaFilePairs.push([sha, name]);
    }
    if (_.has(file, 'children')) {
      const nextLevel: Record<string, unknown> = _.get(file, 'children') || {};
      for (const nextLevelPairs of collateShaAndFilenames(nextLevel)) {
        shaFilePairs.push(nextLevelPairs);
      }
    }
  }
  return shaFilePairs;
}

/*
Uses file_tree from json to build map of hash values to filenames
*/
function mapSha2Filename(
  results: Record<string, unknown>
): Record<string, unknown> {
  const toplevel = _.get(results, 'api_response.file_tree') as Record<
    string,
    unknown
  >;
  const shaMappings = {};
  const shaFilePairs = collateShaAndFilenames(toplevel);
  for (const [sha, filename] of shaFilePairs) {
    _.set(shaMappings, sha || '', filename || '');
  }
  return shaMappings;
}
/*
Builds the code_desc field using values from data. Varies based on service
*/
function createDescription(
  data: Record<string, unknown>,
  score: number,
  date: string,
  scannerName: string,
  endTime: string
): Record<string, unknown> {
  const desc = () => {
    if (
      scannerName === scannerType.Moldy ||
      scannerName === scannerType.Stigma ||
      scannerName === scannerType.ClamAV
    ) {
      return `title_text:${_.get(data, 'title_text') as string}
      body:${_.get(data, 'body')}
      body_format:${_.get(data, 'body_format') as string}
      classificaton:${_.get(data, 'classification') as string}
      depth:${_.get(data, 'depth') as string}
      heuristic_heur_id:${_.get(data, 'heuristic.heur_id') as string}
      heuristic_score:${_.get(data, 'heuristic.score') as string}
      heuristic_name:${_.get(data, 'heuristic.name') as string}`.replace(
        '\\"',
        ''
      );
    } else if (scannerName === scannerType.CodeQuality) {
      return `body:${_.get(data, 'body')}
      body_format:${_.get(data, 'body_format') as string}
      classificaton:${_.get(data, 'classification') as string}
      depth:${_.get(data, 'depth') as string}
      title_text:${_.get(data, 'title_text') as string}`.replace('\\"', '');
    } else {
      return JSON.stringify(data).replace('\\"', '');
    }
  };
  return {
    status: determineStatus(score),
    code_desc: desc(),
    start_time: date,
    run_time: new Date(endTime).valueOf() - new Date(date).valueOf()
  };
}

/*
parsed - parsed conveyor data
mappings - sha to file name mappings 
sets new variable in each api_response.result: filename and sets it to the filename 
mapped to its sha value. Then it transforms the result.sections property to 
have properly formatted HDF controls 
*/
function preprocessObject(
  parsed: Record<string, unknown>,
  mappings: Record<string, unknown>
): Record<string, unknown>[] {
  const results = _.get(parsed, 'api_response.results') as Record<
    string,
    Record<string, unknown>
  >;
  const newSections: Record<string, unknown>[] = [];
  for (const result of Object.values(results)) {
    const sha: string = _.get(result, 'sha256', '') as string;
    _.set(result, 'filename', _.get(mappings, sha));
    const descriptions = _.map(
      _.get(result, 'result.sections') as Record<string, unknown>[],
      (section) =>
        createDescription(
          section as Record<string, unknown>,
          _.get(result, 'result.score') as number,
          _.get(result, 'response.milestones.service_started') as string,
          _.get(result, 'response.service_name') as string,
          _.get(result, 'response.milestones.service_completed') as string
        )
    );
    _.set(result, 'result.sections', descriptions);
    newSections.push(result);
  }
  return newSections;
}

/*
Builds everything under profiles.controls using results.sections data from Conveyor JSON.
*/
function controlMappingConveyor(): MappedTransform<
  ExecJSON.Control & ILookupPath,
  ILookupPath
> {
  return {
    id: {path: 'sha256'}, // sha256 of file analyzed
    title: {path: 'filename'}, // Name of file scanned per Conveyor. Will include conveyor-generated files (.clamav, .moldy, etc)
    desc: '', // Empty placeholder
    impact: {
      path: 'result.score', // Score from Conveyor
      transformer: (value) => {
        return value / CONVEYOR_MAX_SCORE; // normalize score from Conveyor
      }
    },
    refs: [],
    tags: {
      service_context: {path: 'response.service_context'},
      service_debug_info: {path: 'response.service_debug_info'},
      service_tool_version: {path: 'response.service_tool_version'},
      supplementary: {path: 'response.supplementary'},
      created: {path: 'created'},
      archive_ts: {path: 'archive_ts'},
      classification: {path: 'classification'},
      expiry_ts: {path: 'expiry_ts'},
      size: {path: 'size'},
      type: {path: 'type'},
      nist: DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
      cci: DEFAULT_STATIC_CODE_ANALYSIS_CCI_TAGS
    },
    source_location: {},
    results: [
      // Data from heuristics and scan supplemental data
      {
        path: 'result.sections',
        status: {path: 'status'},
        code_desc: {path: 'code_desc'},
        start_time: {path: 'start_time'},
        run_time: {path: 'run_time'}
      }
    ]
  };
}

/*
Builds profile portion of HDF results. Uses date at results level of Conveyor JSON
*/
export class ConveyorMapper extends BaseConverter {
  scannerName: string;
  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    passthrough: {path: 'api_response'},
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion
    },
    version: {path: 'api_server_version'},
    statistics: {},
    profiles: [
      // Each profile is service's results
      {
        name: {path: 'api_response.results[0].response.service_name'},
        sha256: '',
        version: {path: 'api_response.results[0].response.service_version'},
        title: {path: 'api_response.params.description'},
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          // Each control is a service/file result pair
          {
            path: 'api_response.results',
            ...controlMappingConveyor()
          }
        ]
      }
    ]
  };
  constructor(
    remappedConveyorResults: Record<string, unknown>,
    data: Record<string, unknown>,
    scannerName: string
  ) {
    _.set(data, 'api_response.results', remappedConveyorResults);
    super(data);
    this.scannerName = scannerName;
  }
}

export class ConveyorResults {
  data: Record<string, unknown>;
  constructor(conveyorJson: string) {
    const parsed = JSON.parse(conveyorJson);
    const mappings = mapSha2Filename(parsed);
    const processed = preprocessObject(parsed, mappings);
    this.data = _.set(
      parsed,
      'api_response.results',
      groupByScanner(processed)
    );
  }

  toHdf(): Record<string, ExecJSON.Execution> {
    const scannerRecordInput = (
      Object.entries(
        _.get(this.data, 'api_response.results') as Record<string, unknown>
      ) as [string, Record<string, unknown>][]
    ).map(([scannerName, scannerData]) => [
      scannerName,
      new ConveyorMapper(scannerData, this.data, scannerName).toHdf()
    ]);
    return Object.fromEntries(scannerRecordInput);
  }
}
