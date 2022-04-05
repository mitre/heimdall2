import parser from 'fast-xml-parser';
import * as htmlparser from 'htmlparser2';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform,
  parseHtml,
  parseXml
} from './base-converter';
import {CciNistMapping} from './mappings/CciNistMapping';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './utils/global'

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);

const CCI_NIST_MAPPING = new CciNistMapping();

const RULE_RESULT_PATHS = ['cdf:rule-result', 'rule-result'];

let idTracker = '';
let valueIdTracker: string | undefined = undefined;

function getRuleResultItem(
  testResult: Record<string, unknown>,
  pathRuleResultPossibilities: string[],
  pathIdRefPossibilities: string[] = ['idref'],
  pathItemPossibilities: string[] | undefined = undefined
): unknown {
  for (const pathRuleResult of pathRuleResultPossibilities) {
    const ruleResult: Record<string, unknown>[] | undefined = _.get(
      testResult,
      pathRuleResult
    ) as Record<string, unknown>[] | undefined;
    if (ruleResult === undefined) {
      continue;
    }
    const match = ruleResult.find((element: Record<string, unknown>) =>
      _.some(
        pathIdRefPossibilities.map(
          (pathIDRef) => _.get(element, pathIDRef) === idTracker
        ),
        Boolean
      )
    );
    if (pathItemPossibilities === undefined) {
      return match;
    }
    for (const pathItem of pathItemPossibilities) {
      const item = _.get(match, pathItem);
      if (item !== undefined) {
        return item;
      }
    }
  }
  return undefined;
}

function getStatus(
  testResult: Record<string, unknown>
): ExecJSON.ControlResultStatus {
  const status = getRuleResultItem(
    testResult,
    RULE_RESULT_PATHS,
    ['idref'],
    ['cdf:result', 'result']
  ) as string | undefined;
  if (typeof status === 'string' && status === 'pass') {
    return ExecJSON.ControlResultStatus.Passed;
  } else {
    return ExecJSON.ControlResultStatus.Failed;
  }
}

function getStartTime(testResult: Record<string, unknown>): string {
  const time = getRuleResultItem(
    testResult,
    RULE_RESULT_PATHS,
    ['idref'],
    ['time']
  ) as string | undefined;
  if (typeof time === 'string') {
    return time;
  } else {
    return '';
  }
}

function convertEncodedXmlIntoJson(
  encodedXml: string
): Record<string, unknown> {
  const xmlChunks: string[] = [];
  const htmlParser = new htmlparser.Parser({
    ontext(text: string) {
      xmlChunks.push(text);
    }
  });
  htmlParser.write(encodedXml);
  htmlParser.end();
  const xmlParsed = xmlChunks.join('');

  return parser.parse(xmlParsed);
}

type ProfileKey = 'id' | 'description' | 'title';

function extractProfile(
  profile: Record<string, unknown>,
  pathProfileItemPossibilities: Record<ProfileKey, string[]>
) {
  const profileInfo: Record<ProfileKey, unknown> = {
    id: '',
    description: '',
    title: ''
  };
  for (const profileKey of Object.keys(pathProfileItemPossibilities)) {
    for (const pathProfileItem of pathProfileItemPossibilities[
      profileKey as ProfileKey
    ]) {
      const item = _.get(profile, pathProfileItem) as string | undefined;
      if (item) {
        if (profileKey === 'description') {
          profileInfo[profileKey as ProfileKey] =
            convertEncodedXmlIntoJson(item);
        } else {
          profileInfo[profileKey as ProfileKey] = item;
        }
      }
    }
  }
  return profileInfo;
}

function getProfiles(
  profiles: Record<string, unknown>[],
  pathSelectPossibilities: string[],
  pathProfileItemPossibilities: Record<ProfileKey, string[]>
): Record<ProfileKey, unknown>[] {
  const profileInfos = [];
  for (const profile of profiles) {
    for (const pathSelect of pathSelectPossibilities) {
      const select: Record<string, string>[] | undefined = _.get(
        profile,
        pathSelect
      ) as Record<string, string>[] | undefined;
      if (select === undefined) {
        continue;
      }
      const selected = _.some(
        select,
        (element: Record<string, string>) =>
          idTracker.replace('rule_SV', 'group_V').replace(/r\d+_rule/, '') ===
            _.get(element, 'idref') && _.get(element, 'selected') === 'true'
      );
      if (selected) {
        profileInfos.push(
          extractProfile(profile, pathProfileItemPossibilities)
        );
      }
    }
  }
  return profileInfos;
}

interface IIdent {
  system: string;
  text: string;
}

function extractCci(input: IIdent | IIdent[]): string[] {
  let inputArray;
  if (Array.isArray(input)) {
    inputArray = input;
  } else {
    inputArray = [input];
  }

  const CCI_REGEX = /CCI-(\d*)/;

  const output: string[] = [];
  inputArray.forEach((element) => {
    const text = _.get(element, 'text');
    if (text.match(CCI_REGEX)) {
      output.push(text);
    }
  });
  return output;
}

function nistTag(input: IIdent | IIdent[]): string[] {
  const identifiers: string[] = extractCci(input);
  return CCI_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
    false
  );
}

export class XCCDFResultsMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {
        path: ['cdf:Benchmark.cdf:platform.idref', 'Benchmark.platform.idref']
      }
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: 0
    },
    profiles: [
      {
        name: {path: ['cdf:Benchmark.id', 'Benchmark.id']},
        version: {path: ['cdf:Benchmark.style', 'Benchmark.style']},
        title: {path: ['cdf:Benchmark.cdf:title', 'Benchmark.title.text']},
        maintainer: {
          path: [
            'cdf:Benchmark.cdf:reference.dc:publisher',
            'Benchmark.reference.dc:publisher'
          ]
        },
        summary: {
          path: ['cdf:Benchmark.cdf:description', 'Benchmark.description.text']
        },
        description: {
          path: ['cdf:Benchmark', 'Benchmark'],
          transformer: (input: Record<string, unknown>): string => {
            const descriptionPaths = [
              ['cdf:description', 'description'],
              ['cdf:front-matter', 'front-matter'],
              ['cdf:metadata', 'metadata'],
              ['model'],
              ['cdf:plain-text', 'plain-text'],
              ['cdf:rear-matter', 'rear-matter'],
              ['cdf:reference', 'reference'],
              ['cdf:status', 'status'],
              ['cdf:version', 'version'],
              ['xml:lang'],
              ['xmlns:cdf', 'xmlns'],
              ['xmlns:dc'],
              ['xmlns:dsi'],
              ['xsi:schemaLocation'],
              ['cdf:TestResult.cdf:benchmark', 'TestResult.benchmark'],
              ['cdf:TestResult.start-time', 'TestResult.start-time'],
              ['cdf:TestResult.end-time', 'TestResult.end-time'],
              ['cdf:TestResult.id', 'TestResult.id'],
              ['cdf:TestResult.cdf:identity', 'TestResult.identity'],
              ['cdf:TestResult.cdf:organization'],
              [
                'cdf:TestResult.cdf:platform.idref',
                'TestResult.platform.idref'
              ],
              ['cdf:TestResult.cdf:profile.idref', 'TestResult.profile.idref'], // this property makes me think that TestResult could be an array which will certainly cause this mapper to fail
              ['cdf:TestResult.cdf:score', 'TestResult.score'],
              ['cdf:TestResult.cdf:set-value', 'TestResult.set-value'],
              ['cdf:TestResult.cdf:target', 'TestResult.target'],
              [
                'cdf:TestResult.cdf:target-address',
                'TestResult.target-address'
              ],
              ['cdf:TestResult.cdf:target-facts', 'TestResult.target-facts'],
              ['cdf:TestResult.cdf:target-id-ref'],
              ['cdf:TestResult.test-system', 'TestResult.test-system'],
              ['TestResult.title'],
              ['cdf:TestResult.version', 'TestResult.version']
            ];
            const fullDescription: Record<string, unknown> = {};
            for (const paths of descriptionPaths) {
              for (const path of paths) {
                const item = _.get(input, path);
                if (item !== undefined) {
                  fullDescription[path] = item;
                }
              }
            }
            return JSON.stringify(fullDescription, null, 2);
          }
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
        status: 'loaded',
        controls: [
          {
            path: ['cdf:Benchmark.cdf:Group', 'Benchmark.Group'],
            key: 'id',
            id: {
              path: ['cdf:Rule', 'Rule'],
              transformer: (input: Record<string, unknown>): string => {
                const valueIdPaths = [
                  'cdf:check.cdf:check-export.value-id',
                  'check.check-export.value-id'
                ];
                let setValueIdTracker = false;
                for (const path of valueIdPaths) {
                  const valueId = _.get(input, path);
                  if (valueId !== undefined) {
                    valueIdTracker = valueId as string; // NOTE: global variable
                    setValueIdTracker = true;
                  }
                }
                if (!setValueIdTracker) {
                  valueIdTracker = undefined;
                }

                const id = _.get(input, 'id');
                if (typeof id === 'string') {
                  idTracker = id; // NOTE: global variable
                  return id.split('_S')[1].split('r')[0];
                } else {
                  return '';
                }
              }
            },
            title: {path: ['cdf:Rule.cdf:title', 'Rule.title.text']},
            desc: {
              path: ['cdf:Rule.cdf:description', 'Rule.description.text'],
              transformer: (description: string): string => {
                const descTextJson = convertEncodedXmlIntoJson(description);
                return _.get(descTextJson, 'VulnDiscussion', '') as string;
              }
            },
            descriptions: [
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
              cci: {
                path: ['cdf:Rule.cdf:ident', 'Rule.ident'],
                transformer: extractCci
              },
              nist: {
                path: ['cdf:Rule.cdf:ident', 'Rule.ident'],
                transformer: nistTag
              },
              severity: {path: ['cdf:Rule.severity', 'Rule.severity']},
              description: {
                path: ['cdf:Rule.cdf:description', 'Rule.description.text'],
                transformer: (description: string) =>
                  JSON.stringify(
                    _.pickBy(convertEncodedXmlIntoJson(description), _.identity)
                  )
              },
              group_id: {path: 'id'},
              group_title: {path: ['cdf:title', 'title.text']},
              group_description: {
                path: ['cdf:description', 'description.text'],
                transformer: (description: string) =>
                  JSON.stringify(
                    _.pickBy(convertEncodedXmlIntoJson(description), _.identity)
                  )
              },
              rule_id: {path: ['cdf:Rule.id', 'Rule.id']},
              check: {path: ['cdf:Rule.cdf:check', 'Rule.check']},
              fix_id: {path: ['cdf:Rule.cdf:fix.id', 'Rule.fix.id']},
              fixtext_fixref: {
                path: ['cdf:Rule.cdf:fixtext.fixref', 'Rule.fixtext.fixref']
              },
              ident: {path: ['cdf:Rule.cdf:ident', 'Rule.ident']},
              reference: {path: ['cdf:Rule.cdf:reference', 'Rule.reference']},
              selected: {path: 'Rule.selected'},
              version: {path: ['cdf:Rule.id', 'Rule.version.text']}, // dunno why the field is called version when it's just an old id
              weight: {path: ['cdf:Rule.weight', 'Rule.weight']},
              profiles: {
                path: ['$.cdf:Benchmark.cdf:Profile', '$.Benchmark.Profile'],
                transformer: (
                  profiles: Record<string, unknown>[]
                ): Record<ProfileKey, unknown>[] => {
                  const pathsSelect = ['cdf:select', 'select'];
                  const paths = {
                    id: ['id'],
                    description: ['cdf:description', 'description.text'],
                    title: ['cdf:title', 'title.text']
                  };
                  return getProfiles(profiles, pathsSelect, paths);
                }
              },
              rule_result: {
                path: [
                  '$.cdf:Benchmark.cdf:TestResult',
                  '$.Benchmark.TestResult'
                ],
                transformer: (testResult: Record<string, unknown>): unknown =>
                  getRuleResultItem(testResult, RULE_RESULT_PATHS)
              },
              value: {
                path: ['$.cdf:Benchmark.cdf:Value', '$.Benchmark.Value'],
                transformer: (values: Record<string, unknown>[]): unknown => {
                  return _.find(values, (value: Record<string, unknown>) => {
                    const id = _.get(value, 'id');
                    return id && id === valueIdTracker;
                  });
                }
              }
            },
            code: '',
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
                run_time: 0,
                start_time: {
                  path: [
                    '$.cdf:Benchmark.cdf:TestResult',
                    '$.Benchmark.TestResult'
                  ],
                  transformer: getStartTime
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
