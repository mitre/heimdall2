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
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './utils/global';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);

const CCI_NIST_MAPPING = new CciNistMapping();

const RULE_RESULT_PATHS = ['rule-result'];

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
    ['result']
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
  return parseXml(encodedXml);
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
        break;
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
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {
        path: 'Benchmark.platform.idref'
      }
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: {path: 'Benchmark.id'},
        version: {path: 'Benchmark.style'},
        title: {path: ['Benchmark.title.text', 'Benchmark.title']},
        maintainer: {
          path: 'Benchmark.reference.publisher'
        },
        summary: {
          path: ['Benchmark.description.text', 'Benchmark.description']
        },
        description: {
          path: 'Benchmark',
          transformer: (input: Record<string, unknown>): string => {
            const descriptionPaths = [
              ['description.text', 'description'],
              ['front-matter'],
              ['metadata'],
              ['model'],
              ['plain-text'],
              ['rear-matter'],
              ['reference'],
              ['status'],
              ['version'],
              ['xml:lang'],
              ['xmlns:cdf', 'xmlns'],
              ['xmlns:dc'],
              ['xmlns:dsi'],
              ['xsi:schemaLocation'],
              ['TestResult.benchmark'],
              ['TestResult.start-time'],
              ['TestResult.end-time'],
              ['TestResult.id'],
              ['TestResult.identity'],
              ['TestResult.organization'],
              [
                'TestResult.platform.idref'
              ],
              ['TestResult.profile.idref'],
              ['TestResult.score'],
              ['TestResult.set-value'],
              ['TestResult.target'],
              [
                'TestResult.target-address'
              ],
              ['TestResult.target-facts'],
              ['TestResult.target-id-ref'],
              ['TestResult.test-system'],
              ['TestResult.title'],
              ['TestResult.version']
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
        license: {path: 'Benchmark.notice.id'},
        copyright: {
          path: 'Benchmark.metadata.creator'
        },
        copyright_email: 'disa.stig_spt@mail.mil', // this should only be specified if that email address is in Benchmark.description
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'Benchmark.Group',
            key: 'id',
            tags: {
              cci: {
                path: 'Rule.ident',
                transformer: extractCci
              },
              nist: {
                path: 'Rule.ident',
                transformer: nistTag
              },
              severity: {path: 'Rule.severity'},
              description: {
                path: ['Rule.description.text', 'Rule.description'],
                transformer: (description: string) =>
                  JSON.stringify(
                    _.pickBy(convertEncodedXmlIntoJson(description), _.identity)
                  )
              },
              group_id: {path: 'id'},
              group_title: {path: ['title.text', 'title']},
              group_description: {
                path: ['description.text', 'description'],
                transformer: (description: string) =>
                  JSON.stringify(
                    _.pickBy(convertEncodedXmlIntoJson(description), _.identity)
                  )
              },
              rule_id: {path: 'Rule.id'},
              check: {path: 'Rule.check'},
              fix_id: {path: 'Rule.fix.id'},
              fixtext_fixref: {
                path: 'Rule.fixtext.fixref'
              },
              ident: {path: 'Rule.ident'},
              reference: {path: 'Rule.reference'},
              selected: {path: 'Rule.selected'},
              version: {path: 'Rule.version.text'},
              weight: {path: 'Rule.weight'},
              profiles: {
                path: '$.Benchmark.Profile',
                transformer: (
                  profiles: Record<string, unknown>[]
                ): Record<ProfileKey, unknown>[] => {
                  const pathsSelect = ['select'];
                  const paths = {
                    id: ['id'],
                    description: ['description.text', 'description'],
                    title: ['title.text', 'title']
                  };
                  return getProfiles(profiles, pathsSelect, paths);
                }
              },
              rule_result: {
                path: '$.Benchmark.TestResult',
                transformer: (testResult: Record<string, unknown>): unknown =>
                  getRuleResultItem(testResult, RULE_RESULT_PATHS)
              },
              value: {
                path: '$.Benchmark.Value',
                transformer: (values: Record<string, unknown>[]): unknown => {
                  return _.find(values, (value: Record<string, unknown>) => {
                    const id = _.get(value, 'id');
                    return id && id === valueIdTracker;
                  });
                }
              }
            },
            refs: [],
            source_location: {},
            title: {path: ['Rule.title.text', 'Rule.title']},
            id: {
              path: 'Rule',
              transformer: (input: Record<string, unknown>): string => {
                const valueIdPaths = [
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
            desc: {
              path: ['Rule.description.text', 'Rule.description'],
              transformer: (description: string): string => {
                const descTextJson = convertEncodedXmlIntoJson(description);
                return _.get(descTextJson, 'VulnDiscussion', '') as string;
              }
            },
            descriptions: [
              {
                data: {
                  path: 'Rule.check.check-content-ref.name',
                  transformer: parseHtml
                },
                label: 'check'
              },
              {
                data: {
                  path: 'Rule.fixtext.text',
                  transformer: parseHtml
                },
                label: 'fix'
              }
            ],
            impact: {
              path: 'Rule.severity',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2)
            },
            results: [
              {
                status: {
                  path: '$.Benchmark.TestResult',
                  transformer: getStatus
                },
                code_desc: '',
                start_time: {
                  path: '$.Benchmark.TestResult',
                  transformer: getStartTime
                }
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        let auxData = _.get(data, 'Benchmark') as Record<string, unknown>;
        if (auxData) {
          auxData = _.omit(auxData, [
            'id',
            'xml:lang',
            'style',
            'title',
            'description',
            'notice',
            'front-matter',
            'reference',
            'platform',
            'version',
            'model',
            'Group',
            'TestResult',
          ]);
        }
        auxData = {Benchmark: auxData};
        return {
          auxiliary_data: [
            {
              name: 'XCCDF',
              data: auxData
            }
          ],
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(scapXml: string, withRaw = false) {
    super(parseXml(scapXml));
    this.withRaw = withRaw;
  }
}
