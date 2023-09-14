import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';

const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];

function nistTag(input: Record<string, unknown>): string[] {
  const cwe = [`${_.get(input, 'id')}`];
  return CWE_NIST_MAPPING.nistFilter(cwe, DEFAULT_NIST_TAG);
}

function formatMessage(input: Record<string, unknown>): string {
  return `${_.get(input, 'file')}, line:${_.get(input, 'line')}, column:${_.get(
    input,
    'column'
  )}`;
}

export class GoSecMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              name: 'Gosec',
              data: {
                'Golang errors': _.get(data, 'Golang errors')
              }
            }
          ],
          ...(this.withRaw && {raw: data})
        };
      }
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: 'Gosec scanner',
        title: 'gosec',
        version: {path: 'GosecVersion'},
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'Issues',
            key: 'id',
            tags: {
              nist: {
                path: 'cwe',
                transformer: nistTag
              },
              cwe: {path: 'cwe'},
              nosec: {path: 'nosec'},
              suppressions: {path: 'suppressions'},
              severity: {path: 'severity'},
              confidence: {path: 'confidence'}
            },
            refs: [],
            source_location: {},
            title: {path: 'details'},
            id: {path: 'rule_id'},
            desc: '',
            impact: 0.5,
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {path: 'code'},
                message: {transformer: formatMessage},
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(gosecJson: string, withRaw = false) {
    super(JSON.parse(gosecJson));
    this.withRaw = withRaw;
  }
}
