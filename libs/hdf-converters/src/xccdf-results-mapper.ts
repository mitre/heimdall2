import { ExecJSON, is_control, parse_nist } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  buildParseHtmlFunc,
  impactMapping,
  parseXml,
} from './base-converter';
import { CciNistMapping } from './mappings/CciNistMapping';
import {
  conditionallyProvideAttribute,
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  HeimdallToolsVersion,
} from './utils/global';

const IMPACT_MAPPING = new Map<string, number>([
  ['critical', 0.9],
  ['high', 0.7],
  ['low', 0.3],
  ['medium', 0.5],
]);

const CCI_NIST_MAPPING = new CciNistMapping();
const CCI_REGEX = /CCI-\d*/v;

let parseHtml: (input: unknown) => string;

type IIdent = {
  system: string;
  text: string;
};

export class XCCDFResultsMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
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
        auxData = { Benchmark: auxData };
        return {
          auxiliary_data: [
            {
              data: auxData,
              name: 'XCCDF',
            },
          ],
          ...(this.withRaw && { raw: data }),
        };
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: { path: 'Benchmark.platform.idref' },
    },
    profiles: [
      {
        attributes: [],
        controls: [
          {
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(
                  _.omit(vulnerability, [
                    'group',
                    'ruleResult',
                    'profiles',
                    'values',
                  ]),
                  null,
                  2,
                ),
            },
            desc: {
              path: ['description.text', 'description'],
              transformer: (description: string): string =>
                parseHtml(
                  _.get(
                    parseXml(description),
                    'ProfileDescription',
                    description,
                  ),
                ),
            },
            descriptions: [
              {
                path: ['check.check-content-ref.name'],
                transformer: (
                  data: string | string[],
                ): ExecJSON.ControlDescription => ({
                  data: asArray(data).join('\n'),
                  label: 'check',
                }),
              } as unknown as ExecJSON.ControlDescription,
              {
                path: ['fixtext.text', 'fix.text'],
                transformer: (
                  data: string | string[],
                ): ExecJSON.ControlDescription => ({
                  data: asArray(data).map(item => parseHtml(item)).join('\n'),
                  label: 'fix',
                }),
              } as unknown as ExecJSON.ControlDescription,
              {
                path: ['rationale.text'],
                transformer: (
                  data: string | string[],
                ): ExecJSON.ControlDescription => ({
                  data: asArray(data).map(item => parseHtml(item)).join('\n'),
                  label: 'rationale',
                }),
              } as unknown as ExecJSON.ControlDescription,
              {
                path: ['warning.text'],
                transformer: (
                  data: string | string[],
                ): ExecJSON.ControlDescription => ({
                  data: asArray(data).map(item => parseHtml(item)).join('\n'),
                  label: 'warning',
                }),
              } as unknown as ExecJSON.ControlDescription,
            ],
            id: { path: ['id'] },
            impact: {
              transformer: (vulnerability: Record<string, unknown>): number => {
                const ruleResult = _.get(vulnerability, 'ruleResult') as Record<
                  string,
                  unknown
                >;
                if (ruleResult) {
                  const result = _.get(ruleResult, 'result') as string;
                  if (
                    result === 'notselected'
                    || result === 'notapplicable'
                    || result === 'informational'
                  ) {
                    return 0;
                  }
                }
                return impactMapping(IMPACT_MAPPING)(
                  _.get(vulnerability, 'severity'),
                );
              },
            },
            key: 'id',
            path: 'Benchmark',
            pathTransform: getRulesInBenchmark,
            refs: [
              {
                path: 'reference',
                transformer: (
                  data: Record<string, unknown>,
                ): ExecJSON.Reference => ({
                  ref:
                    _.has(data, 'publisher')
                    || _.has(data, 'identifier')
                    || _.has(data, 'type')
                      ? [
                        {
                          ...conditionallyProvideAttribute(
                            'text',
                            _.get(data, 'text'),
                            _.has(data, 'text'),
                          ),
                          ...conditionallyProvideAttribute(
                            'publisher',
                            _.get(data, 'publisher'),
                            _.has(data, 'publisher'),
                          ),
                          ...conditionallyProvideAttribute(
                            'identifier',
                            _.get(data, 'identifier'),
                            _.has(data, 'identifier'),
                          ),
                          ...conditionallyProvideAttribute(
                            'type',
                            _.get(data, 'type'),
                            _.has(data, 'type'),
                          ),
                        },
                      ]
                      : (_.has(data, 'text')
                        ? (_.get(data, 'text') as string)
                        : undefined),
                  ...conditionallyProvideAttribute(
                    'url',
                    _.get(data, 'href'),
                    _.has(data, 'href') && _.get(data, 'href') !== '',
                  ),
                }),
              },
            ],
            results: [
              {
                code_desc: {
                  path: ['description.text', 'description'],
                  transformer: (description: string): string =>
                    parseHtml(
                      _.get(
                        parseXml(description),
                        'VulnDiscussion',
                        description,
                      ),
                    ),
                },
                start_time: { path: ['ruleResult.time'] },
                status: {
                  path: ['ruleResult.result'],
                  transformer: getStatus,
                },
              },
            ],
            source_location: {},
            tags: {
              cci: {
                path: ['ident', 'reference'],
                transformer: extractCci,
              },
              check: {
                path: 'check',
                transformer: (
                  data: Record<string, unknown> | Record<string, unknown>[],
                ) => JSON.stringify(data, null, 2),
              },
              description: {
                path: ['description.text', 'description'],
                transformer: (description: string): string =>
                  parseHtml(
                    _.get(
                      parseXml(description),
                      'VulnDiscussion',
                      description,
                    ),
                  ),
              },
              fix_id: { path: 'fix.id' },
              fixtext_fixref: {
                path: ['fixtext.fixref.text', 'fixtext.fixref'],
                transformer: (text: string) => parseHtml(text) || undefined,
              },
              group_description: {
                path: ['group.description.text', 'group.description'],
                transformer: (description: string): string =>
                  parseHtml(
                    _.get(
                      parseXml(description),
                      'GroupDescription',
                      description,
                    ),
                  ),
              },
              group_id: { path: 'group.id' },
              group_title: { path: ['group.title.text', 'group.title'] },
              ident: {
                path: 'ident',
                transformer: (text: string) => text || undefined,
              },
              nist: {
                path: ['ident', 'reference'],
                transformer: nistTag,
              },
              profiles: [
                {
                  description: {
                    path: ['description.text', 'description'],
                    transformer: (description: string): string =>
                      parseHtml(
                        _.get(
                          parseXml(description),
                          'ProfileDescription',
                          description,
                        ),
                      ),
                  },
                  id: { path: ['id'] },
                  path: ['profiles'],
                  title: { path: ['title.text', 'title'] },
                },
              ],
              reference: {
                path: 'reference',
                transformer: (data: Record<string, unknown>) => ({ references: data }),
              },
              rule_id: { path: 'id' },
              rule_result: { path: ['ruleResult'] },
              selected: { path: 'selected' },
              severity: { path: 'severity' },
              transformer: (data: Record<string, unknown>) => ({
                ...conditionallyProvideAttribute(
                  'version',
                  _.get(data, 'version.text'),
                  _.has(data, 'version.text'),
                ),
              }),
              value: {
                path: ['values'],
                transformer: (
                  values: Record<string, unknown> | Record<string, unknown>[],
                ) =>
                  asArray(values).map(value => ({
                    description: parseHtml(
                      _.get(value, 'description.text')
                      || _.get(value, 'description'),
                    ),
                    Id: _.get(value, 'Id'),
                    id: _.get(value, 'id'),
                    interactive: _.get(value, 'interactive'),
                    title: _.get(value, 'title.text') || _.get(value, 'title'),
                    type: _.get(value, 'type'),
                    value: _.get(value, 'value'),
                    warning: parseHtml(
                      _.get(value, 'warning.text') || _.get(value, 'warning'),
                    ),
                  })),
              },
              weight: { path: 'weight' },
            },
            title: { path: ['title.text', 'title'] },
          },
        ],
        copyright: { path: 'Benchmark.metadata.creator' },
        copyright_email: 'disa.stig_spt@mail.mil', // this should only be specified if that email address is in Benchmark.description
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
              ['TestResult.version'],
            ];
            const fullDescription: Record<string, unknown> = {};
            for (const paths of descriptionPaths) {
              for (const path of paths) {
                const item = _.get(input, path);
                if (item !== undefined) {
                  fullDescription[path] = typeof item === 'string' ? parseHtml(item) : item;
                }
              }
            }
            return JSON.stringify(fullDescription, null, 2);
          },
        },
        groups: [],
        license: { path: 'Benchmark.notice.id' },
        maintainer: { path: 'Benchmark.reference.publisher' },
        name: { path: 'Benchmark.id' },
        sha256: '',
        status: 'loaded',
        summary: {
          path: ['Benchmark.description.text', 'Benchmark.description'],
          transformer: parseHtml,
        },
        supports: [],
        title: { path: ['Benchmark.title.text', 'Benchmark.title'] },
        version: { path: 'Benchmark.style' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
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
          '*.description',
        ],
      }),
    );
    this.withRaw = withRaw;
  }
}

export class XCCDFResultsResults {
  constructor(readonly scapXml: string, readonly withRaw = false) {}

  async toHdf(): Promise<ExecJSON.Execution> {
    parseHtml = await buildParseHtmlFunc();

    return (new XCCDFResultsMapper(this.scapXml, this.withRaw)).toHdf();
  }
}

function asArray<T>(arg: T | T[]): T[] {
  if (Array.isArray(arg)) {
    return arg;
  } else if (arg === undefined || arg === null) {
    return [];
  } else {
    return [arg];
  }
}

function extractCci(input: IIdent | IIdent[]): string[] {
  const inputArray = asArray(input);

  const output: string[] = [];
  for (const element of inputArray) {
    const text = _.get(element, 'text');
    if (!!text && CCI_REGEX.test(text)) {
      output.push(text);
    }
  }
  return output;
}

function getProfiles(
  ids: string[],
  benchmark: Record<string, unknown>,
): Record<string, unknown>[] {
  const matchingProfiles: Record<string, unknown>[] = [];
  const profiles = asArray(
    _.get(benchmark, 'Profile') as
    | Record<string, unknown>
    | Record<string, unknown>[],
  );
  for (const profile of profiles) {
    const selects = asArray(
      _.get(profile, 'select') as
      | Record<string, unknown>
      | Record<string, unknown>[],
    );
    if (
      selects.some(select =>
        ids.includes(_.get(select, 'idref') as string)
        && _.get(select, 'selected') === 'true')
    ) {
      matchingProfiles.push(profile);
    }
  }
  return matchingProfiles;
}

function getRuleResult(
  ruleId: string,
  benchmark: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const ruleResults = asArray(
    _.get(benchmark, 'TestResult.rule-result') as
    | Record<string, unknown>
    | Record<string, unknown>[],
  );
  return ruleResults.find(element => _.get(element, 'idref') === ruleId);
}

/**
 * Given groups or a group, returns all the rules.
 */
function getRulesInBenchmark(input: unknown): Record<string, unknown>[] {
  const benchmark = input as Record<string, unknown>;
  const groups = asArray(
    _.get(benchmark, 'Group') as
    | Record<string, unknown>
    | Record<string, unknown>[],
  );
  const allRules: Record<string, unknown>[] = [];
  for (const group of groups) {
    getRulesInGroup(allRules, benchmark, group);
  }
  return allRules;
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
  group: Record<string, unknown>,
) {
  const subGroups = asArray(
    _.get(group, 'Group') as Record<string, unknown> | Record<string, unknown>[],
  );
  if (subGroups) {
    for (const subGroup of subGroups) {
      getRulesInGroup(allRules, benchmark, subGroup);
    }
  }
  const rules = asArray(
    _.get(group, 'Rule') as Record<string, unknown> | Record<string, unknown>[],
  );
  if (rules) {
    for (const rule of rules) {
      allRules.push(
        _.merge({}, rule, {
          group: _.omit(group, ['Rule', 'Group']), // save the group as a new "group" property on the rule to allow the mapper to use the group
          profiles: getProfiles(
            [_.get(rule, 'id') as string, _.get(group, 'id') as string],
            benchmark,
          ), // save the profiles as a new "profiles" property on the rule to allow the mapper to use the profiles
          ruleResult: getRuleResult(_.get(rule, 'id') as string, benchmark), // save the ruleResult as a new "ruleResult" property on the rule to allow the mapper to use the ruleResult
          values: getValues(rule, group, benchmark), // save the values as a new "values" property on the rule to allow the mapper to use the values
        }),
      );
    }
  }
}

function getStatus(testResultStatus: string): ExecJSON.ControlResultStatus {
  switch (testResultStatus) {
    case 'error': {
      return ExecJSON.ControlResultStatus.Error;
    }
    case 'fail': {
      return ExecJSON.ControlResultStatus.Failed;
    }
    case 'fixed': {
      return ExecJSON.ControlResultStatus.Passed;
    }
    case 'informational': {
      return ExecJSON.ControlResultStatus.Skipped;
    }
    case 'notapplicable': {
      return ExecJSON.ControlResultStatus.Skipped;
    }
    case 'notchecked': {
      return ExecJSON.ControlResultStatus.Skipped;
    }
    case 'notselected': {
      return ExecJSON.ControlResultStatus.Skipped;
    }
    case 'pass': {
      return ExecJSON.ControlResultStatus.Passed;
    }
    case 'unknown': {
      return ExecJSON.ControlResultStatus.Error;
    }
    default: {
      return ExecJSON.ControlResultStatus.Error;
    }
  }
}

function getValues(
  rule: Record<string, unknown>,
  group: Record<string, unknown>,
  benchmark: Record<string, unknown>,
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
      ...(asArray(values) as Record<string, unknown>[]).filter(value =>
        ruleValueIds.includes(_.get(value, 'id') as string),
      ),
    );
  }
  return matchingValues;
}

function nistTag(input: IIdent | IIdent[]): string[] {
  return _.uniq(
    [...CCI_NIST_MAPPING.nistFilter(
      extractCci(input),
      DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
      false,
    ), ...asArray(input)
      .filter(x => !!x)
      .map(x => x.text)
      .map(x => parse_nist(x))
      .filter(x => !!x)
      .filter(x => is_control(x))
      .map(x => x.canonize())],
  );
}
