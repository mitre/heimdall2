import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform,
  parseXml
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {getCCIsForNISTTags} from './utils/global';
const FILE_PATH_VALUE = 'file_paths.file_path.value';
const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['5', 0.9],
  ['4', 0.7],
  ['3', 0.5],
  ['2', 0.3],
  ['1', 0.1],
  ['0', 0.0]
]);

function arrayifyObject(
    output: Record<string, unknown>
  ): Record<string, unknown>[] {
    let res = _.get(output, 'api_response.results') as Record<string, unknown>
    let newout : Record<string, unknown>[] = []
    _.forEach(res, function(value, key) {
      if(_.get(value, 'response.service_name') == 'Moldy')
      newout.push(value as Record<string, unknown>)
    } )
    console.log(newout[1])
    return newout;
  }
  

function nistTag(input: Record<string, unknown>): string[] {
  return DEFAULT_NIST_TAG;
}

function formatDesc(input: Record<string, unknown>): string {
  const text = [];
  if (_.has(input, 'desc.para')) {
    if (_.has(input, 'desc.para.text')) {
      text.push(`${_.get(input, 'desc.para.text')}`);
    } else {
      text.push(
        ...(_.get(input, `desc.para`) as Record<string, unknown>[]).map(
          (value) => _.get(value, 'text')
        )
      );
    }
  }
  return text.join('\n');
}

function controlMappingConveyor(): MappedTransform<
  ExecJSON.Control & ILookupPath,
  ILookupPath
> {
  return {
    id: {path: 'sha256'},
    title: {path: 'type'},
    desc: {path: 'cve_summary'},
    impact: {path: 'result.score'},
    refs: [],
    tags: {
      nist: DEFAULT_NIST_TAG
    },
    source_location: {
      ref: {path: 'sha256'}
    },
    results: [
      {
        status: ExecJSON.ControlResultStatus.Failed,
        code_desc: {path: 'result.sections[0].body'},
        start_time: {path: 'response.milestones.service_started'}
      }
    ]
  };
}

export class ConveyorMapper extends BaseConverter {
  originalData: unknown;
  defaultMapping(
    withRaw = false
  ): MappedTransform<ExecJSON.Execution, ILookupPath> {
    return {
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion
      },
      version: HeimdallToolsVersion,
      statistics: {},
      profiles: [
        {
          name: 'Conveyor',
          version: 'tbd',
          title: {path: 'api_response.params.description'},
          supports: [],
          attributes: [],
          groups: [],
          status: 'loaded',
          controls: [
            {
              path: 'api_response.results2',
              ...controlMappingConveyor()
            }
          ],
          sha256: ''
        }
      ]
    };
  }
  constructor(conveyor: string, withRaw = false) {
    const data = JSON.parse(conveyor)
    const newres:Record<string, unknown>[] = arrayifyObject(data)
    _.set(data, 'api_response.results2', newres);
    super(data);
    this.originalData = conveyor;
    this.setMappings(this.defaultMapping(withRaw));
  }
}