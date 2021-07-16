import {ControlResultStatus, ExecJSON} from 'inspecjs/dist/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {MappedTransform, LookupPath, BaseConverter} from './base-converter'
import {CweNistMapping} from './mappings/CweNistMapping'
import path from 'path'

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['error', 0.7],
  ['warning', 0.5],
  ['note', 0.3]
]);

const CWE_NIST_MAPPING_FILE = path.resolve(__dirname, '../data/cwe-nist-mapping.csv')
const CWE_NIST_MAPPING = new CweNistMapping(CWE_NIST_MAPPING_FILE)
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5']

function extractCwe(text: string): string[] {
  let output = text.split('(').slice(-1)[0].slice(0, -2).split(', ')
  if (output.length === 1) {
    output = text.split('(').slice(-1)[0].slice(0, -2).split('!/')
  }
  return output
}
function impactMapping(severity: unknown): number {
  if (typeof severity === 'string' || typeof severity === 'number') {
    return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0.1
  } else {
    return 0.1
  }
}
function formatCodeDesc(input: unknown): string {
  let output = []
  output.push(`URL : ${_.get(input, 'artifactLocation.uri')}`)
  output.push(`LINE : ${_.get(input, 'region.startLine')}`)
  output.push(`COLUMN : ${_.get(input, 'region.startColumn')}`)
  return output.join(' ')
}
function nistTag(text: string): string[] {
  let identifiers = extractCwe(text)
  identifiers = identifiers.map(element => element.split('-')[1])
  return CWE_NIST_MAPPING.nistFilter(identifiers, DEFAULT_NIST_TAG)
}

export class SarifMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON, LookupPath> = {
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
              cwe: {
                path: 'message.text',
                transformer: extractCwe
              },
              nist: {path: 'message.text', transformer: nistTag}
            },
            descriptions: [],
            refs: [],
            source_location: {
              ref: {path: 'locations[0].physicalLocation.artifactLocation.uri'},
              line: {path: 'locations[0].physicalLocation.region.startLine'}
            },
            title: {
              path: 'message.text', transformer: (text: unknown) => {
                if (typeof text === 'string') {
                  return text.split(': ')[0]
                } else {
                  return ''
                }
              }
            },
            id: {path: 'ruleId'},
            desc: {
              path: 'message.text', transformer: (text: unknown) => {
                if (typeof text === 'string') {
                  return text.split(': ')[1]
                } else {
                  return ''
                }
              }
            },
            impact: {path: 'level', transformer: impactMapping},
            code: '',
            results: [
              {
                status: ControlResultStatus.Failed,
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
  setMappings(customMappings: MappedTransform<ExecJSON, LookupPath>) {
    super.setMappings(customMappings)
  }
}
