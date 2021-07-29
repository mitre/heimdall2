import parser from 'fast-xml-parser';
import * as htmlparser from 'htmlparser2';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import path from 'path';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CciNistMapping} from './mappings/CciNistMapping';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);

const RULE_DESCRIPTION = 'cdf:Rule.cdf:description'
const CCI_REGEX = /CCI-(\d*)/;
const CCI_NIST_MAPPING_FILE = path.resolve(__dirname, '../data/U_CCI_List.xml');
const CCI_NIST_MAPPING = new CciNistMapping(CCI_NIST_MAPPING_FILE);
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5', 'Rev_4'];

let counter = '';

function impactMapping(severity: unknown): number {
  if (typeof severity === 'string' || typeof severity === 'number') {
    return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
  } else {
    return 0;
  }
}
function getStatus(file: unknown): ExecJSON.ControlResultStatus {
  const match = _.get(file, 'cdf:rule-result').find(
    (element: Record<string, unknown>) => _.get(element, 'idref') === counter
  );
  if (_.get(match, 'cdf:result') === 'pass') {
    return ExecJSON.ControlResultStatus.Passed;
  } else {
    return ExecJSON.ControlResultStatus.Failed;
  }
}
function extractCci(input: unknown[]): string[] {
  const output: string[] = [];
  input.forEach((element) => {
    if (_.get(element, 'text').match(CCI_REGEX)) {
      output.push(_.get(element, 'text'));
    }
  });
  return output;
}
function nistTag(input: unknown[]): string[] {
  const identifiers: string[] = extractCci(input);
  return CCI_NIST_MAPPING.nistFilter(identifiers, DEFAULT_NIST_TAG);
}
function parseXml(xml: string) {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };
  return parser.parse(xml, options);
}
function parseHtml(input: unknown): string {
  const textData: string[] = [];
  const myParser = new htmlparser.Parser({
    ontext(text: string) {
      textData.push(text);
    }
  });
  if (typeof input === 'string') {
    myParser.write(input);
  }
  return textData.join('');
}
export class XCCDFResultsMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
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
              path: 'cdf:Rule.id',
              transformer: (input: unknown): string => {
                if (typeof input === 'string') {
                  counter = input;
                  return input.split('_S')[1].split('r')[0];
                } else {
                  return '';
                }
              }
            },
            title: {path: 'cdf:Rule.cdf:title'},
            desc: {
              path: RULE_DESCRIPTION,
              transformer: (input: unknown): string => {
                if (typeof input === 'string') {
                  return parseHtml(input.split('Satisfies')[0]);
                } else {
                  return '';
                }
              }
            },
            descriptions: [
              {
                data: {
                  path: RULE_DESCRIPTION,
                  transformer: (input: unknown): string => {
                    if (typeof input === 'string') {
                      return parseHtml(input);
                    } else {
                      return '';
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
                data: {
                  path: 'cdf:Rule.cdf:check.cdf:check-content-ref.name',
                  transformer: parseHtml
                },
                label: 'check'
              },
              {
                data: {
                  path: 'cdf:Rule.cdf:fixtext.text',
                  transformer: parseHtml
                },
                label: 'fix'
              }
            ],
            impact: {path: 'cdf:Rule.severity', transformer: impactMapping},
            refs: [],
            tags: {
              severity: null,
              gtitle: {path: 'cdf:title'},
              satisfies: {
                path: RULE_DESCRIPTION,
                transformer: (input: string): string[] => {
                  if (input.split('Satisfies: ')[1] !== undefined) {
                    return input
                      .split('Satisfies: ')[1]
                      .split('&lt')[0]
                      .replace(/', /gi, ',')
                      .split(',');
                  } else {
                    return [];
                  }
                }
              },
              gid: {
                path: 'cdf:Rule.id',
                transformer: (input: string): string => {
                  return input.split('_').slice(-2, -1)[0].split('r')[0];
                }
              },
              legacy_id: {path: 'cdf:Rule.cdf:ident[2].text'},
              rid: {path: 'cdf:Rule.cdf:ident[1].text'},
              stig_id: {path: '$.cdf:Benchmark.id'},
              fix_id: {path: 'cdf:Rule.cdf:fix.id'},
              cci: {path: 'cdf:Rule.cdf:ident', transformer: extractCci},
              nist: {path: 'cdf:Rule.cdf:ident', transformer: nistTag}
            },
            code: '',
            source_location: {},
            results: [
              {
                status: {
                  path: '$.cdf:Benchmark.cdf:TestResult',
                  transformer: getStatus
                },
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
