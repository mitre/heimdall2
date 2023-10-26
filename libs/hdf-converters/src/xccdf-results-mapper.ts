import {ExecJSON, is_control, parse_nist} from 'inspecjs';
import * as _ from 'lodash';
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
import {
  conditionallyProvideAttribute,
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
} from './utils/global';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);

const CCI_NIST_MAPPING = new CciNistMapping();

function asArray<T>(arg: T | T[]): T[] {
  if (Array.isArray(arg)) {
    return arg;
  } else if (arg === undefined || arg === null) {
    return [];
  } else {
    return [arg];
  }
}

function getRuleResult(
  ruleId: string,
  benchmark: Record<string, unknown>
): Record<string, unknown> | undefined {
  const ruleResults = asArray(
    _.get(benchmark, 'TestResult.rule-result') as
      | Record<string, unknown>
      | Record<string, unknown>[]
  );
  return ruleResults.find((element) => _.get(element, 'idref') === ruleId);
}

function getStatus(testResultStatus: string): ExecJSON.ControlResultStatus {
  switch (testResultStatus) {
    case 'pass':
      return ExecJSON.ControlResultStatus.Passed;
    case 'fail':
      return ExecJSON.ControlResultStatus.Failed;
    case 'error':
      return ExecJSON.ControlResultStatus.Error;
    case 'unknown':
      return ExecJSON.ControlResultStatus.Error;
    case 'notapplicable':
      return ExecJSON.ControlResultStatus.Skipped;
    case 'notchecked':
      return ExecJSON.ControlResultStatus.Skipped;
    case 'notselected':
      return ExecJSON.ControlResultStatus.Skipped;
    case 'informational':
      return ExecJSON.ControlResultStatus.Skipped;
    case 'fixed':
      return ExecJSON.ControlResultStatus.Passed;
    default:
      return ExecJSON.ControlResultStatus.Error;
  }
}

function getValues(
  rule: Record<string, unknown>,
  group: Record<string, unknown>,
  benchmark: Record<string, unknown>
): Record<string, unknown>[] {
  const checks = asArray(_.get(rule, 'check'));
  if (!checks) {
    return [];
  }
  const ruleValueIds: string[] = [];
  for (const check of checks as Record<string, unknown>[]) {
    const valueId = _.get(check, 'check-export.value-id') as string;
    if (valueId) {
      ruleValueIds.push(valueId);
    }
  }
  const matchingValues: Record<string, unknown>[] = [];
  for (const values of [_.get(group, 'Value'), _.get(benchmark, 'Value')]) {
    if (!values) {
      continue;
    }
    matchingValues.push(
      ...(asArray(values) as Record<string, unknown>[]).filter((value) =>
        ruleValueIds.includes(_.get(value, 'id') as string)
      )
    );
  }
  return matchingValues;
}

function getProfiles(
  ids: string[],
  benchmark: Record<string, unknown>
): Record<string, unknown>[] {
  const matchingProfiles: Record<string, unknown>[] = [];
  const profiles = asArray(
    _.get(benchmark, 'Profile') as
      | Record<string, unknown>
      | Record<string, unknown>[]
  );
  for (const profile of profiles) {
    const selects = asArray(
      _.get(profile, 'select') as
        | Record<string, unknown>
        | Record<string, unknown>[]
    );
    if (
      selects.find(
        (select) =>
          ids.includes(_.get(select, 'idref') as string) &&
          _.get(select, 'selected') === 'true'
      )
    ) {
      matchingProfiles.push(profile);
    }
  }
  return matchingProfiles;
}

interface IIdent {
  system: string;
  text: string;
}

function extractCci(input: IIdent | IIdent[]): string[] {
  const inputArray = asArray(input);

  const CCI_REGEX = /CCI-(\d*)/;

  const output: string[] = [];
  for (const element of inputArray) {
    const text = _.get(element, 'text');
    if (!!text && CCI_REGEX.exec(text)) {
      output.push(text);
    }
  }
  return output;
}

function nistTag(input: IIdent | IIdent[]): string[] {
  return _.uniq(
    CCI_NIST_MAPPING.nistFilter(
      extractCci(input),
      DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
      false
    ).concat(
      asArray(input)
        .filter((x) => !!x)
        .map((x) => x.text)
        .map(parse_nist)
        .filter((x) => !!x)
        .filter(is_control)
        .map((x) => x.canonize())
    )
  );
}

/**
 * Given a group, returns all the rules within it (including rules in groups nested within the group).
 *
 * @param allRules a mutable list that will be populated with the rules.
 * @param benchmark The benchmark being operated upon.
 * @param group The group for which rules are to be retrieved.
 */
function getRulesInGroup(
  allRules: Record<string, unknown>[],
  benchmark: Record<string, unknown>,
  group: Record<string, unknown>
) {
  const subGroups = asArray(
    _.get(group, 'Group') as Record<string, unknown> | Record<string, unknown>[]
  );
  if (subGroups) {
    for (const subGroup of subGroups) {
      getRulesInGroup(allRules, benchmark, subGroup);
    }
  }
  const rules = asArray(
    _.get(group, 'Rule') as Record<string, unknown> | Record<string, unknown>[]
  );
  if (rules) {
    for (const rule of rules) {
      allRules.push(
        _.merge({}, rule, {
          group: _.omit(group, ['Rule', 'Group']), // save the group as a new "group" property on the rule to allow the mapper to use the group
          ruleResult: getRuleResult(_.get(rule, 'id') as string, benchmark), // save the ruleResult as a new "ruleResult" property on the rule to allow the mapper to use the ruleResult
          profiles: getProfiles(
            [_.get(rule, 'id') as string, _.get(group, 'id') as string],
            benchmark
          ), // save the profiles as a new "profiles" property on the rule to allow the mapper to use the profiles
          values: getValues(rule, group, benchmark) // save the values as a new "values" property on the rule to allow the mapper to use the values
        })
      );
    }
  }
}

/**
 * Given groups or a group, returns all the rules.
 */
function getRulesInBenchmark(input: unknown): Record<string, unknown>[] {
  const benchmark = input as Record<string, unknown>;
  const groups = asArray(
    _.get(benchmark, 'Group') as
      | Record<string, unknown>
      | Record<string, unknown>[]
  );
  const allRules: Record<string, unknown>[] = [];
  for (const group of groups) {
    getRulesInGroup(allRules, benchmark, group);
  }
  return allRules;
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
          path: ['Benchmark.description.text', 'Benchmark.description'],
          transformer: parseHtml
        },
        description: {
          path: 'Benchmark',
          transformer: (input: Record<string, unknown>): string => {
            const descriptionPaths = [
              ['description.text'],
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
              ['TestResult.platform.idref'],
              ['TestResult.profile.idref'],
              ['TestResult.score'],
              ['TestResult.set-value'],
              ['TestResult.target'],
              ['TestResult.target-address'],
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
                  if (typeof item === 'string') {
                    fullDescription[path] = parseHtml(item);
                  } else {
                    fullDescription[path] = item;
                  }
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
            path: 'Benchmark',
            pathTransform: getRulesInBenchmark,
            key: 'id',
            tags: {
              cci: {
                path: ['ident', 'reference'],
                transformer: extractCci
              },
              nist: {
                path: ['ident', 'reference'],
                transformer: nistTag
              },
              severity: {path: 'severity'},
              description: {
                path: ['description.text', 'description'],
                transformer: (description: string): string =>
                  parseHtml(
                    _.get(
                      parseXml(description),
                      'VulnDiscussion',
                      description
                    ) as string
                  )
              },
              group_id: {path: 'group.id'},
              group_title: {path: ['group.title.text', 'group.title']},
              group_description: {
                path: ['group.description.text', 'group.description'],
                transformer: (description: string): string =>
                  parseHtml(
                    _.get(
                      parseXml(description),
                      'GroupDescription',
                      description
                    ) as string
                  )
              },
              rule_id: {path: 'id'},
              check: {
                path: 'check',
                transformer: (
                  data: Record<string, unknown> | Record<string, unknown>[]
                ) => JSON.stringify(data, null, 2)
              },
              fix_id: {path: 'fix.id'},
              fixtext_fixref: {
                path: ['fixtext.fixref.text', 'fixtext.fixref'],
                transformer: (text: string) => parseHtml(text) || undefined
              },
              ident: {
                path: 'ident',
                transformer: (text: string) => text || undefined
              },
              reference: {
                path: 'reference',
                transformer: (data: Record<string, unknown>) => ({
                  references: data
                })
              },
              selected: {path: 'selected'},
              weight: {path: 'weight'},
              profiles: [
                {
                  path: ['profiles'],
                  id: {path: ['id']},
                  description: {
                    path: ['description.text', 'description'],
                    transformer: (description: string): string =>
                      parseHtml(
                        _.get(
                          parseXml(description),
                          'ProfileDescription',
                          description
                        ) as string
                      )
                  },
                  title: {path: ['title.text', 'title']}
                }
              ],
              rule_result: {
                path: ['ruleResult']
              },
              value: {
                path: ['values'],
                transformer: (
                  values: Record<string, unknown> | Record<string, unknown>[]
                ) =>
                  asArray(values).map((value) => ({
                    title: _.get(value, 'title.text') || _.get(value, 'title'),
                    description: parseHtml(
                      _.get(value, 'description.text') ||
                        _.get(value, 'description')
                    ),
                    warning: parseHtml(
                      _.get(value, 'warning.text') || _.get(value, 'warning')
                    ),
                    value: _.get(value, 'value'),
                    Id: _.get(value, 'Id'),
                    id: _.get(value, 'id'),
                    type: _.get(value, 'type'),
                    interactive: _.get(value, 'interactive')
                  }))
              },
              transformer: (data: Record<string, unknown>) => ({
                ...conditionallyProvideAttribute(
                  'version',
                  _.get(data, 'version.text'),
                  _.has(data, 'version.text')
                )
              })
            },
            refs: [
              {
                path: 'reference',
                transformer: (
                  data: Record<string, unknown>
                ): ExecJSON.Reference => ({
                  ...conditionallyProvideAttribute(
                    'url',
                    _.get(data, 'href'),
                    _.has(data, 'href')
                  ),
                  ref: [
                    {
                      ...conditionallyProvideAttribute(
                        'text',
                        _.get(data, 'text'),
                        _.has(data, 'text')
                      ),
                      ...conditionallyProvideAttribute(
                        'publisher',
                        _.get(data, 'publisher'),
                        _.has(data, 'publisher')
                      ),
                      ...conditionallyProvideAttribute(
                        'identifier',
                        _.get(data, 'identifier'),
                        _.has(data, 'identifier')
                      ),
                      ...conditionallyProvideAttribute(
                        'type',
                        _.get(data, 'type'),
                        _.has(data, 'type')
                      )
                    }
                  ]
                }),
                ref: {
                  path: 'text',
                  transformer: (text: string) => text || undefined
                },
                url: {
                  path: 'href',
                  transformer: (text: string) => text || undefined
                }
              }
            ],
            source_location: {},
            title: {path: ['title.text', 'title']},
            id: {path: ['id']},
            desc: {
              path: ['description.text', 'description'],
              transformer: (description: string): string =>
                parseHtml(
                  _.get(
                    parseXml(description),
                    'ProfileDescription',
                    description
                  ) as string
                )
            },
            descriptions: [
              {
                path: ['check.check-content-ref.name'],
                transformer: (
                  data: string | string[]
                ): ExecJSON.ControlDescription => ({
                  data: asArray(data).join('\n'),
                  label: 'check'
                })
              } as unknown as ExecJSON.ControlDescription,
              {
                path: ['fixtext.text', 'fix.text'],
                transformer: (
                  data: string | string[]
                ): ExecJSON.ControlDescription => ({
                  data: asArray(data).map(parseHtml).join('\n'),
                  label: 'fix'
                })
              } as unknown as ExecJSON.ControlDescription,
              {
                path: ['rationale.text'],
                transformer: (
                  data: string | string[]
                ): ExecJSON.ControlDescription => ({
                  data: asArray(data).map(parseHtml).join('\n'),
                  label: 'rationale'
                })
              } as unknown as ExecJSON.ControlDescription,
              {
                path: ['warning.text'],
                transformer: (
                  data: string | string[]
                ): ExecJSON.ControlDescription => ({
                  data: asArray(data).map(parseHtml).join('\n'),
                  label: 'warning'
                })
              } as unknown as ExecJSON.ControlDescription
            ],
            impact: {
              transformer: (vulnerability: Record<string, unknown>): number => {
                const ruleResult = _.get(vulnerability, 'ruleResult') as Record<
                  string,
                  unknown
                >;
                if (ruleResult) {
                  const result = _.get(ruleResult, 'result') as string;
                  if (
                    result === 'notselected' ||
                    result === 'notapplicable' ||
                    result === 'informational'
                  ) {
                    return 0;
                  }
                }
                return impactMapping(IMPACT_MAPPING)(
                  _.get(vulnerability, 'severity')
                );
              }
            },
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(
                  _.omit(vulnerability, [
                    'group',
                    'ruleResult',
                    'profiles',
                    'values'
                  ]),
                  null,
                  2
                )
            },
            results: [
              {
                status: {
                  path: ['ruleResult.result'],
                  transformer: getStatus
                },
                code_desc: {
                  path: ['description.text', 'description'],
                  transformer: (description: string): string =>
                    parseHtml(
                      _.get(
                        parseXml(description),
                        'VulnDiscussion',
                        description
                      ) as string
                    )
                },
                start_time: {
                  path: ['ruleResult.time']
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
            'TestResult'
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
    super(
      parseXml(scapXml, {
        stopNodes: [
          '*.fixtext',
          '*.fix',
          '*.rationale',
          '*.warning',
          '*.title',
          '*.description'
        ]
      })
    );
    this.withRaw = withRaw;
  }
}
