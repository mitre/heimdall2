import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];

function createDescription(
  data: Record<string, unknown>,
  score: number,
  date: string,
  type: string
): Record<string, unknown> {
  let desc = '';
  if (type == 'Moldy') {
    desc =
      'body:' +
      _.get(data, 'body') +
      '\nbody_format:' +
      (_.get(data, 'body_format') as string) +
      '\nclassificaton:' +
      (_.get(data, 'classification') as string) +
      '\n';
  } else if (type == 'Stigma') {
    desc =
      'body:' +
      _.get(data, 'body') +
      '\nbody_format:' +
      (_.get(data, 'body_format') as string) +
      '\ntitle_text:' +
      (_.get(data, 'title_text') as string) +
      '\nclassificaton:' +
      (_.get(data, 'classification') as string) +
      '\n';
  } else if (type == 'CodeQuality') {
    desc =
      'body:' +
      _.get(data, 'body') +
      '\nbody_format:' +
      (_.get(data, 'body_format') as string) +
      '\nclassificaton:' +
      (_.get(data, 'classification') as string) +
      '\ndepth:' +
      (_.get(data, 'depth') as string) +
      '\nheuristic:' +
      (_.get(data, 'heuristic') as string) +
      '\ntitle_text:' +
      (_.get(data, 'title_text') as string) +
      '\n';
  } else {
    desc = JSON.stringify(data);
  }
  return {
    status: determineStatus(score),
    code_desc: desc,
    start_time: date
  };
}

function childrenfinder(output: Record<string, unknown>): string[][] {
  const arr: string[][] = [];
  _.forEach(output, (value, key) => {
    if (_.has(value, 'name')) {
      const temp: string = _.get(value, 'name[0]') || '';
      arr.push([key, temp]);
    }
    if (_.has(value, 'children')) {
      const temp: Record<string, unknown> = _.get(value, 'children') || {};
      _.forEach(childrenfinder(temp), function (value) {
        arr.push(value);
      });
    }
  });
  return arr;
}
function shafileMapper(
  output: Record<string, unknown>
): Record<string, unknown> {
  const toplevel = _.get(output, 'api_response.file_tree') as Record<
    string,
    unknown
  >;
  const shamappings = {};
  _.forEach(toplevel, (value) => {
    if (_.has(value, 'name')) {
      const temp: string = _.get(value, 'name[0]') || '';
      _.set(shamappings, temp, _.get(value, 'sha256'));
    }
    if (_.has(value, 'children')) {
      const temp: Record<string, unknown> = _.get(value, 'children') || {};
      const arr = childrenfinder(temp);
      _.forEach(arr, (value) => {
        const temp1: string = value[0] || '';
        const temp2: string = value[1] || '';
        _.set(shamappings, temp1, temp2);
      });
    }
  });
  return shamappings;
}
function determineStatus(score: number): ExecJSON.ControlResultStatus {
  if (score == 0) {
    return ExecJSON.ControlResultStatus.Passed;
  }
  return ExecJSON.ControlResultStatus.Failed;
}

function arrayifyObject(
  output: Record<string, unknown>,
  mapped: Record<string, unknown>
): unknown {
  const res = _.get(output, 'api_response.results') as Record<string, unknown>;
  const newout: Record<string, unknown>[] = [];
  _.forEach(res, (value) => {
    const temp = value as Record<string, unknown>;
    const temp2: string = _.get(value, 'sha256') || '';
    _.set(temp, 'filename', _.get(mapped, temp2));
    const descriptions = _.map(
      _.get(temp, 'result.sections') as Record<string, unknown>[],
      (val) =>
        createDescription(
          val as Record<string, unknown>,
          _.get(temp, 'result.score') as number,
          _.get(temp, 'response.milestones.service_started') as string,
          _.get(temp, 'response.service_name') as string
        )
    );
    if (descriptions.length == 0) {
      descriptions.push({
        status: ExecJSON.ControlResultStatus.Passed,
        code_desc: 'NA',
        start_time: _.get(temp, 'response.milestones.service_started') as string
      });
    }
    _.set(temp, 'result.sections', descriptions);
    newout.push(temp);
  });
  const groups = _.groupBy(newout, (value) => {
    return _.get(value, 'response.service_name');
  });
  return groups;
}

function controlMappingConveyor(): MappedTransform<
  ExecJSON.Control & ILookupPath,
  ILookupPath
> {
  return {
    id: {path: 'sha256'},
    title: {path: 'filename'},
    desc: {path: 'cve_summary'},
    impact: {
      path: 'result.score',
      transformer: (value) => {
        return value / 1000;
      }
    },
    refs: [],
    tags: {
      nist: DEFAULT_NIST_TAG
    },
    source_location: {
      ref: ''
    },
    results: [
      {
        path: 'result.sections',
        status: {path: 'status'},
        code_desc: {path: 'code_desc'},
        start_time: {path: 'start_time'}
      }
    ]
  };
}

export class ConveyorMapper extends BaseConverter {
  data: Record<string, unknown>;
  type: string;
  defaultMapping(): MappedTransform<ExecJSON.Execution, ILookupPath> {
    return {
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion
      },
      version: HeimdallToolsVersion,
      statistics: {},
      profiles: [
        {
          name: this.type,
          version: {path: 'api_server_version'},
          title: {path: 'api_response.params.description'},
          supports: [],
          attributes: [],
          groups: [],
          status: 'loaded',
          controls: [
            {
              path: 'api_response.results',
              ...controlMappingConveyor()
            }
          ],
          sha256: ''
        }
      ]
    };
  }
  constructor(
    conveyor: Record<string, unknown>,
    meta: Record<string, unknown>,
    type: string
  ) {
    const data = meta;
    _.set(data, 'api_response.results', conveyor);
    super(data);
    this.type = type;
    this.data = data;
    this.setMappings(this.defaultMapping());
  }
}

export class ConveyorResults {
  data: unknown;
  meta: Record<string, unknown>;
  constructor(ConveyorJson: string) {
    const data = JSON.parse(ConveyorJson);
    const mapped = shafileMapper(data);
    const newres = arrayifyObject(data, mapped);
    this.data = newres;
    this.meta = _.omit(data, 'api_response.results');
  }

  toHdf(): Record<string, ExecJSON.Execution> {
    const mapped = _.mapValues(
      this.data as Record<string, unknown>,
      (val, key) => {
        return new ConveyorMapper(
          val as Record<string, unknown>,
          this.meta,
          key
        ).toHdf();
      }
    );
    return mapped;
  }
}
