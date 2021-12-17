import parser from 'fast-xml-parser';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform,
  parseHtml
} from './base-converter';
import {CciNistMapping} from './mappings/CciNistMapping';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);

const RULE_DESCRIPTION = ['cdf:Rule.cdf:description', 'Rule.description.text'];
const CCI_REGEX = /CCI-(\d*)/;
const CCI_NIST_MAPPING = new CciNistMapping();
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5', 'Rev_4'];

let counter = ''; // TODO: why is it called counter when it doesn't count anything - it's a matching key/identifier

// TODO: why is it called 'file' when it's just being passed a normal object?
function getStatus(file: unknown): ExecJSON.ControlResultStatus {
  const paths = [
    ['cdf:rule-result', 'rule-result'],
    ['idref'],
    ['cdf:result', 'result']
  ];

  for (const pathRuleResult of paths[0]) {
    const ruleResult = _.get(file, pathRuleResult);
    if (ruleResult === undefined) {
      continue;
    }
    const match = ruleResult.find((element: Record<string, unknown>) =>
      _.some(
        paths[1].map((pathIDRef) => _.get(element, pathIDRef) === counter),
        Boolean
      )
    );
    for (const pathResult of paths[2]) {
      if (_.get(match, pathResult) === 'pass') {
        return ExecJSON.ControlResultStatus.Passed;
      }
    }
  }
  return ExecJSON.ControlResultStatus.Failed;
}
function extractCci(input: unknown | unknown[]): string[] {
  let inputArray;
  if (Array.isArray(input)) {
    inputArray = input;
  } else {
    inputArray = [input];
  }

  const output: string[] = [];
  inputArray.forEach((element) => {
    if (_.get(element, 'text').match(CCI_REGEX)) {
      output.push(_.get(element, 'text'));
    }
  });
  return output;
}
function nistTag(input: unknown | unknown[]): string[] {
  const identifiers: string[] = extractCci(input);
  return CCI_NIST_MAPPING.nistFilter(identifiers, DEFAULT_NIST_TAG, false);
}
// TODO: move this into base-converter as well as a utility?  or split some of the utility functions out of base-converter into their own module
function parseXml(xml: string) {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };
  return parser.parse(xml, options);
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
        name: {path: ['cdf:Benchmark.id', 'Benchmark.id']},
        version: {path: ['cdf:Benchmark.style', 'Benchmark.style']},
        title: {path: ['cdf:Benchmark.cdf:title', 'Benchmark.title.text']}, // first instance where not just the path but also the underlying object is different
        maintainer: {
          path: [
            'cdf:Benchmark.cdf:reference.dc:publisher',
            'Benchmark.reference.dc:publisher'
          ]
        },
        summary: {
          path: ['cdf:Benchmark.cdf:description', 'Benchmark.description.text']
        },
        license: {path: ['cdf:Benchmark.cdf:notice.id', 'Benchmark.notice.id']},
        copyright: {
          path: [
            'cdf:Benchmark.cdf:metadata.dc:creator',
            'Benchmark.metadata.dc:creator.text'
          ]
        },
        copyright_email: 'disa.stig_spt@mail.mil',
        supports: [],
        attributes: [],
        depends: [],
        groups: [],
        status: 'loaded', // TODO: ask to figure out what 'loaded' means
        controls: [
          {
            path: ['cdf:Benchmark.cdf:Group', 'Benchmark.Group'],
            key: 'id',
            id: {
              path: ['cdf:Rule.id', 'Rule.id'],
              transformer: (input: unknown): string => {
                if (typeof input === 'string') {
                  counter = input;
                  return input.split('_S')[1].split('r')[0];
                } else {
                  return '';
                }
              }
            },
            title: {path: ['cdf:Rule.cdf:title', 'Rule.title.text']},
            desc: {
              path: RULE_DESCRIPTION,
              transformer: (input: unknown): string => {
                if (typeof input === 'string') {
                  return parseHtml(input.split('Satisfies')[0]); // TODO: doesn't seem to work for as intended (cut off the SRG number and then the massive block of html thing things like text<>text<text<text<>text) for at least the first of their results
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
                  path: [
                    'cdf:Rule.cdf:check.cdf:check-content-ref.name',
                    'Rule.check.check-content-ref.name'
                  ],
                  transformer: parseHtml
                },
                label: 'check'
              },
              {
                data: {
                  path: ['cdf:Rule.cdf:fixtext.text', 'Rule.fixtext.text'],
                  transformer: parseHtml
                },
                label: 'fix'
              }
            ],
            impact: {
              path: ['cdf:Rule.severity', 'Rule.severity'],
              transformer: impactMapping(IMPACT_MAPPING)
            },
            refs: [],
            tags: {
              severity: null,
              gtitle: {path: ['cdf:title', 'title.text']},
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
                path: ['cdf:Rule.id', 'Rule.id'],
                transformer: (input: string): string => {
                  return input.split('_').slice(-2, -1)[0].split('r')[0];
                }
              },
              legacy_id: {path: 'cdf:Rule.cdf:ident[2].text'}, // TODO: doesn't seem like legacy ids are being provided in the new one.  this should work through default values
              rid: {path: 'cdf:Rule.cdf:ident[1].text'}, // TODO: same ^
              stig_id: {path: ['$.cdf:Benchmark.id', '$.Benchmark.id']},
              fix_id: {path: ['cdf:Rule.cdf:fix.id', 'Rule.fix.id']},
              cci: {
                path: ['cdf:Rule.cdf:ident', 'Rule.ident'],
                transformer: extractCci
              },
              nist: {
                path: ['cdf:Rule.cdf:ident', 'Rule.ident'],
                transformer: nistTag
              }
            },
            code: '', // TODO: ask if we should just stuff some of the converted xml into here (if it's feasible)
            source_location: {},
            results: [
              {
                status: {
                  path: [
                    '$.cdf:Benchmark.cdf:TestResult',
                    '$.Benchmark.TestResult'
                  ],
                  transformer: getStatus
                },
                code_desc: '',
                run_time: 0, // TODO: ask if we should calculate this since we're given both a starttime and an endtime
                start_time: {
                  path: [
                    '$.cdf:Benchmark.cdf:TestResult.start-time',
                    '$.Benchmark.TestResult.start-time'
                  ]
                },
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
