import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];

function createDescription(
  data: Record<string, unknown>,
  type: string
): string {
  if (type == 'Moldy') {
    return (
      'body:' +
      _.get(data, 'result.sections[0].body') +
      '\nbody_format:' +
      (_.get(data, 'result.sections[0].body_format') as string) +
      '\nclassificaton:' +
      (_.get(data, 'result.sections[0].body_classification') as string) +
      '\nFinished_at' +
      (_.get(data, 'response.milestones.service_completed') as string) +
      '\n'
    );
  }
  if (type == 'Stigma') {
    return (
      'body0:' +
      _.get(data, 'result.sections[0].body') +
      '\nbody_format0:' +
      (_.get(data, 'result.sections[0].body_format') as string) +
      '\ntitle_text0:' +
      (_.get(data, 'result.sections[0].title_text') as string) +
      '\nclassificaton0:' +
      (_.get(data, 'result.sections[0].body_classification') as string) +
      '\nbody1:' +
      (_.get(data, 'result.sections[1].body') as string) +
      '\ntitle_text1:' +
      (_.get(data, 'result.sections[1].title_text') as string) +
      '\nFinished_at' +
      (_.get(data, 'response.milestones.service_completed') as string) +
      '\n'
    );
  }
  return JSON.stringify(_.get(data, 'result.sections[0]') as string);
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
    const description = createDescription(
      temp,
      _.get(temp, 'response.service_name') as string
    );
    _.set(temp, 'result.sections[0].body', description);
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
        return value / 100;
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
        status: ExecJSON.ControlResultStatus.Failed,
        code_desc: {path: 'result.sections[0].body'},
        message: '',
        start_time: {path: 'response.milestones.service_started'}
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
          version: 'na',
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
