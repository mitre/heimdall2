import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['error', 0.7],
  ['warning', 0.5],
  ['note', 0.3]
]);
const MESSAGE_TEXT = 'message.text';
const CWE_NIST_MAPPING = new CweNistMapping();

function extractCwe(text: string): string[] {
  let output = text.split('(').slice(-1)[0].slice(0, -2).split(', ');
  if (output.length === 1) {
    output = text.split('(').slice(-1)[0].slice(0, -2).split('!/');
  }
  return output;
}
function impactMapping(severity: unknown): number {
  if (typeof severity === 'string' || typeof severity === 'number') {
    return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0.1;
  } else {
    return 0.1;
  }
}
function formatCodeDesc(input: unknown): string {
  const output = [];
  output.push(`URL : ${_.get(input, 'artifactLocation.uri')}`);
  output.push(`LINE : ${_.get(input, 'region.startLine')}`);
  output.push(`COLUMN : ${_.get(input, 'region.startColumn')}`);
  return output.join(' ');
}
function nistTag(text: string): string[] {
  let identifiers = extractCwe(text);
  identifiers = identifiers.map((element) => element.split('-')[1]);
  return CWE_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

export class SarifMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: 'Static Analysis Results Interchange Format'
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        path: 'runs',
        name: 'SARIF',
        version: {path: '$.version'},
        title: 'Static Analysis Results Interchange Format',
        maintainer: null,
        summary: '',
        license: null,
        copyright: null,
        copyright_email: null,
        supports: [],
        attributes: [],
        depends: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'results',
            key: 'id',
            tags: {
              cci: {
                path: 'vulnerabilityClassifications',
                transformer: (data: string) => getCCIsForNISTTags(nistTag(data))
              },
              cwe: {
                path: MESSAGE_TEXT,
                transformer: extractCwe
              },
              nist: {path: MESSAGE_TEXT, transformer: nistTag}
            },
            descriptions: [],
            refs: [],
            source_location: {
              transformer: (control: unknown) => {
                return _.omitBy(
                  {
                    ref: _.get(
                      control,
                      'locations[0].physicalLocation.artifactLocation.uri'
                    ),
                    line: _.get(
                      control,
                      'locations[0].physicalLocation.region.startLine'
                    )
                  },
                  (value) => value === ''
                );
              }
            },
            title: {
              path: MESSAGE_TEXT,
              transformer: (text: unknown): string => {
                if (typeof text === 'string') {
                  return text.split(': ')[0];
                } else {
                  return '';
                }
              }
            },
            id: {path: 'ruleId'},
            desc: {
              path: MESSAGE_TEXT,
              transformer: (text: unknown): string => {
                if (typeof text === 'string') {
                  return text.split(': ')[1];
                } else {
                  return '';
                }
              }
            },
            impact: {path: 'level', transformer: impactMapping},
            code: '',
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {
                  path: 'locations[0].physicalLocation',
                  transformer: formatCodeDesc
                },
                run_time: 0,
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(sarifJson: string) {
    super(JSON.parse(sarifJson));
  }
}
