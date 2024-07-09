import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';

const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);

function nistTag(input: Record<string, unknown>): string[] {
  const cwe = [`${_.get(input, 'id')}`];
  return CWE_NIST_MAPPING.nistFilter(cwe, DEFAULT_NIST_TAG);
}

// Check `nosec` and `suppressions` fields which denote whether the gosec rule violation should be suppressed/skipped
function formatStatus(input: Record<string, unknown>): string {
  return `${_.get(input, 'nosec')}` === 'false' &&
    `${_.get(input, 'suppressions')}` === 'null'
    ? ExecJSON.ControlResultStatus.Failed
    : ExecJSON.ControlResultStatus.Skipped;
}

// If a gosec rule violation is suppressed, forward the given justification
function formatSkipMessage(input: Record<string, unknown>): string {
  return `${_.get(input, 'suppressions')}` !== 'null'
    ? `${_.get(input, 'suppressions[0].justification')}`
    : '';
}

// Report gosec rule violation and violation location
function formatCodeDesc(input: Record<string, unknown>): string {
  return `Rule ${_.get(input, 'rule_id')} violation detected at:\nFile: ${_.get(input, 'file')}\nLine: ${_.get(input, 'line')}\nColumn: ${_.get(input, 'column')}`;
}

// Report confidence of violation and specific offending code
function formatMessage(input: Record<string, unknown>): string {
  return `${_.get(input, 'confidence')} confidence of rule violation at:\n${_.get(input, 'code')}`;
}

export class GoSecMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: 'gosec Scan',
        title: 'gosec Scan',
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
              cwe: {path: 'cwe'}
            },
            refs: [],
            source_location: {},
            title: {path: 'details'},
            id: {path: 'rule_id'},
            desc: '',
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            results: [
              {
                status: {transformer: formatStatus},
                skip_message: {transformer: formatSkipMessage},
                code_desc: {transformer: formatCodeDesc},
                message: {transformer: formatMessage},
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              name: 'gosec',
              data: {
                'Golang errors': _.get(data, 'Golang errors'),
                'Stats': _.get(data, 'Stats')
              }
            }
          ],
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(gosecJson: string, withRaw = false) {
    super(JSON.parse(gosecJson));
    this.withRaw = withRaw;
  }
}
