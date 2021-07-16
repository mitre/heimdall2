import parser from 'fast-xml-parser';
import {
  ExecJSON,
  ControlResultStatus
} from 'inspecjs/dist/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, LookupPath, MappedTransform} from './base-converter';
import {CciNistMapping} from './mappings/CciNistMapping';
import path from 'path'

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);

const CCI_REGEX = /CCI-(\d*)/
const CCI_NIST_MAPPING_FILE = path.resolve(__dirname, '../data/U_CCI_List.xml')
const CCI_NIST_MAPPING = new CciNistMapping(CCI_NIST_MAPPING_FILE)
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5', 'Rev_4']

var counter: string = ''

function impactMapping(severity: unknown): number {
  if (typeof severity === 'string' || typeof severity === 'number') {
    return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
  } else {
    return 0
  }
}
function getStatus(file: unknown) {
  let match = _.get(file, 'cdf:rule-result').find((element: object) => _.get(element, 'idref') === counter)
  if (_.get(match, 'cdf:result') === 'pass') {
    return ControlResultStatus.Passed
  } else {
    return ControlResultStatus.Failed
  }
}
function extractCci(input: unknown[]): string[] {
  let output: string[] = []
  input.forEach(element => {
    if (_.get(element, 'text').match(CCI_REGEX)) {
      output.push(_.get(element, 'text'))
    }
  })
  return output
}
function nistTag(input: unknown[]): string[] {
  let identifiers: string[] = extractCci(input)
  return CCI_NIST_MAPPING.nistFilter(identifiers, DEFAULT_NIST_TAG)
}
function parseXml(xml: string) {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };
  return parser.parse(xml, options);
}
export class XCCDFResultsMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON, LookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: ''
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: 0
    },
    profiles: [
      {
        name: {path: 'cdf:Benchmark.id'},
        version: {path: 'cdf:Benchmark.style'},
        title: {path: 'cdf:Benchmark.cdf:title'},
        maintainer: {path: 'cdf:Benchmark.cdf:reference.dc:publisher'},
        summary: {path: 'cdf:Benchmark.cdf:description'},
        license: {path: 'cdf:Benchmark.cdf:notice.id'},
        copyright: {path: 'cdf:Benchmark.cdf:metadata.dc:creator'},
        copyright_email: 'disa.stig_spt@mail.mil',
        supports: [],
        attributes: [],
        depends: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'cdf:Benchmark.cdf:Group',
            key: 'id',
            id: {
              path: 'cdf:Rule.id', transformer: (input: unknown) => {
                if (typeof input === 'string') {
                  counter = input
                  return input.split('_S')[1].split('r')[0]
                } else {
                  return ''
                }
              }
            },
            title: {path: 'cdf:Rule.cdf:title'},
            desc: {
              path: 'cdf:Rule.cdf:description', transformer: (input: unknown) => {
                if (typeof input === 'string') {
                  return input.split('Satisfies')[0].replace(/&lt;/gi, '<').replace(/&gt;/gi, '>',)
                } else {
                  return ''
                }
              }
            },
            descriptions: [
              {
                data: {
                  path: 'cdf:Rule.cdf:description', transformer: (input: unknown) => {
                    if (typeof input === 'string') {
                      return input.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
                    } else {
                      return ''
                    }
                  }
                },
                label: 'default'
              },
              {
                data: 'NA',
                label: 'rationale'
              },
              {
                data: {path: 'cdf:Rule.cdf:check.cdf:check-content-ref.name'},
                label: 'check'
              },
              {
                data: {path: 'cdf:Rule.cdf:fixtext.text'},
                label: 'fix'
              }
            ],
            impact: {path: 'cdf:Rule.severity', transformer: impactMapping},
            refs: [],
            tags: {
              severity: null,
              gtitle: {path: 'cdf:title'},
              satisfies: {
                path: 'cdf:Rule.cdf:description', transformer: (input: string) => {
                  if (input.split('Satisfies: ')[1] !== undefined) {
                    return input.split('Satisfies: ')[1].split('&lt')[0].split(', ')
                  } else {
                    return []
                  }
                }
              },
              gid: {
                path: 'cdf:Rule.id', transformer: (input: string) => {
                  return input.split('_').slice(-2, -1)[0].split('r')[0]
                }
              },
              legacy_id: {path: 'cdf:Rule.cdf:ident[2].text'},
              rid: {path: 'cdf:Rule.cdf:ident[1].text'},
              stig_id: {path: '$.id'},
              fix_id: {path: 'cdf:Rule.cdf:fix.id'},
              cci: {path: 'cdf:Rule.cdf:ident', transformer: extractCci},
              nist: {path: 'cdf:Rule.cdf:ident', transformer: nistTag}
            },
            code: '',
            source_location: {},
            results: [
              {
                status: {path: '$.cdf:Benchmark.cdf:TestResult', transformer: getStatus},
                code_desc: '',
                run_time: 0,
                start_time: {path: '$.cdf:Benchmark.cdf:TestResult.start-time'},
                message: '',
                resource: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(scapXml: string) {
    super(parseXml(scapXml));
  }
}
