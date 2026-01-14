import axios, {AxiosError} from 'axios';
import * as _ from 'lodash';
import {coerce, lt} from 'semver';
import {ExecJSON} from 'inspecjs';
import {inspect} from 'util';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {OwaspNistMapping} from './mappings/OwaspNistMapping';
import {
  conditionallyProvideAttribute,
  createWinstonLogger,
  getCCIsForNISTTags
} from './utils/global';

const logger = createWinstonLogger('SonarQube2HDF');

// the Sonarqube schema typings are meant to support the four versions out right now (8, 9, 10, and 2025/25).  9 and 25 are supposed to be LTS releases.  8 is currently used by the Sonarcloud deployment though Sonarqube POCs say that it is no longer supported / they do not see many deployments of it.
enum SonarqubeVersion {
  Eight = '8.0.0',
  Nine = '9.0.0',
  Ten = '10.0.0',
  Twenty_five = '2025.0.0'
}

// intentionally open ended to support versions less than 8, but it is unlikely that they will be out there based on discussions with Sonar engineers
function isSonarqubeVersionEight(
  version: string
): version is SonarqubeVersion.Eight {
  const nextHigherVersion = SonarqubeVersion.Nine;
  const v = coerce(version);
  if (v === null) {
    throw new Error(
      `Was not able to coerce ${version} into a semver compatible version string`
    );
  }
  return lt(v, nextHigherVersion);
}

function isSonarqubeVersionNine(
  version: string
): version is SonarqubeVersion.Nine {
  const nextHigherVersion = SonarqubeVersion.Ten;
  const v = coerce(version);
  if (v === null) {
    throw new Error(
      `Was not able to coerce ${version} into a semver compatible version string`
    );
  }
  return lt(v, nextHigherVersion);
}

function isSonarqubeVersionTen(
  version: string
): version is SonarqubeVersion.Ten {
  const nextHigherVersion = SonarqubeVersion.Twenty_five;
  const v = coerce(version);
  if (v === null) {
    throw new Error(
      `Was not able to coerce ${version} into a semver compatible version string`
    );
  }
  return lt(v, nextHigherVersion);
}

function isSonarqubeVersionTwenty_five(
  version: string
): version is SonarqubeVersion.Twenty_five {
  const nextHigherVersion = '2026.0.0'; // using 26 for now, but I am unsure what the actual next major version will be - this function can be changed once we identify the next version that contains impactful breaking changes
  const v = coerce(version);
  if (v === null) {
    throw new Error(
      `Was not able to coerce ${version} into a semver compatible version string`
    );
  }
  return lt(v, nextHigherVersion);
}

type SonarqubeVersionMapping = {
  [SonarqubeVersion.Eight]: {issue: Issue_8; ruleInformation: Rule_8};
  [SonarqubeVersion.Nine]: {issue: Issue_9; ruleInformation: Rule_9};
  [SonarqubeVersion.Ten]: {issue: Issue_10; ruleInformation: Rule_10};
  [SonarqubeVersion.Twenty_five]: {issue: Issue_10; ruleInformation: Rule_25};
};

// many of these attributes show up in the API example responses, but not in our locally generated samples.
// a few of them are mentioned in the changelog, but do not show up in samples or the examples
// several of these attributes show up in sonarcloud (which is marked as major version 8) even though the documentation says that they should first only show up in latter versions.  to that end, I've marked them as optional for lack of any other action we can take.
type Issue_8 = {
  actions?: string[];
  attr?: {'jira-issue-key'?: string};
  author: string;
  cleanCodeAttribute?: string;
  cleanCodeAttributeCategory?: string;
  comments?: {
    key: string;
    login: string;
    htmlText: string;
    markdown: string;
    updatable: boolean;
    createdAt: string;
  }[];
  component: string;
  creationDate: string;
  debt: string;
  effort: string;
  flows: {
    locations: {
      textRange: {
        startLine: number;
        endLine: number;
        startOffset: number;
        endOffset: number;
      };
      msg: string;
      msgFormattings?: {start: number; end: number; type: string}[];
      component: string;
    }[];
  }[];
  fromHotspot?: unknown;
  hash: string;
  impacts?: {severity: string; softwareQuality: string}[];
  issueStatus?: string;
  key: string;
  line: number;
  message: string;
  messageFormattings?: {start: number; end: number; type: string}[];
  organization?: string;
  project: string;
  projectName?: string;
  resolution?: string; // the changelog for the endpoint mentions something about 'resolutions' which might be the same as this endpoint?
  rule: string;
  scope?: string;
  severity: string;
  status: string;
  tags: string[];
  textRange: {
    endLine: number;
    endOffset: number;
    startLine: number;
    startOffset: number;
  };
  transitions?: string[];
  type: string;
  updateDate: string;
};

type Issue_9 = Omit<Issue_8, 'fromHotspot'> & {
  quickFixAvailable?: boolean;
  ruleDescriptionContextKey?: string;
};

type Issue_10 = Issue_9 & {
  codeVariants: string[];
  prioritizedRule: boolean;
};

type Search<T extends SonarqubeVersion> = {
  components: {
    enabled: boolean;
    key: string;
    longName: string;
    name: string;
    organization?: string;
    path?: string;
    qualifier: string;
    uuid?: string;
  }[];
  effortTotal: number;
  facets: {property: string; values: {val: string; count: number}[]}[];
  issues: SonarqubeVersionMapping[T]['issue'][];
  organizations?: {key: string; name: string}[];
  p?: number; // deprecated as of 9.8
  paging: {pageIndex: number; pageSize: number; total: number};
  ps?: number; // deprecated as of 9.8
  rules?: {
    key: string;
    name: string;
    status: string;
    lang: string;
    langName: string;
  }[];
  total?: number; // deprecated as of 9.8
  users?: {login: string; name: string; active: boolean; avatar: string}[];
};

type Rule_8 = {
  cleanCodeAttribute?: string;
  cleanCodeAttributeCategory?: string;
  createdAt: string;
  debtOverloaded: boolean;
  debtRemFnCoeff?: unknown;
  debtRemFnOffset: string;
  debtRemFnType: string;
  defaultDebtRemFnCoeff?: unknown;
  defaultDebtRemFnOffset: string;
  defaultDebtRemFnType: string;
  defaultRemFnBaseEffort: string;
  defaultRemFnType: string;
  descriptionSections?: {content: string; key: string}[]; // sonarqube changelog says it was added in 9.5 if I'm interpreting "The field 'descriptionSections' has been added to the payload" properly, but sonarcloud (which is v8 nominally) has it too
  effortToFixDescription?: unknown;
  htmlDesc: string;
  impacts?: {severity: string; softwareQuality: string}[];
  isExternal: boolean;
  isTemplate: boolean;
  key: string;
  lang: string;
  langName: string;
  mdDesc: string;
  name: string;
  params: {key: string; desc: string; defaultValue: string}[];
  remFnBaseEffort: string;
  remFnOverloaded: boolean;
  remFnType: string;
  repo: string;
  scope: string;
  securityStandards?: unknown[];
  severity: string;
  status: string;
  sysTags: string[];
  tags: unknown[];
  type: string;
};

type Rule_9 = Rule_8 & {
  educationPrinciples?: unknown[];
};

type Rule_10 = Omit<
  Rule_9,
  | 'debtOverloaded'
  | 'debtRemFnCoeff'
  | 'debtRemFnOffset'
  | 'defaultDebtRemFnCoeff'
  | 'defaultDebtRemFnOffset'
  | 'effortToFixDescription'
> & {
  updatedAt: string;
};

type Rule_25 = Omit<Rule_10, 'htmlDesc' | 'mdDesc'>;

type Rule<T extends SonarqubeVersion> = {
  actives: {
    qProfile: string;
    inherit: string;
    severity: string;
    params: {key: string; value: string}[];
  }[];
  rule: SonarqubeVersionMapping[T]['ruleInformation'];
};

type IssueExtensions<T extends SonarqubeVersion> = {
  codeSnippet: string;
  ruleInformation: Rule<T>;
};

type Data<T extends SonarqubeVersion> = {
  search: Omit<Search<T>, 'issues'> & {
    issues: (SonarqubeVersionMapping[T]['issue'] & IssueExtensions<T>)[];
  };
  sonarqubeVersion: string;
  sonarqubeHost: string;
  projectKey: string;
  branchName?: string;
  pullRequestID?: string;
  organization?: string;
};

// https://docs.sonarsource.com/sonarqube-server/latest/user-guide/rules/overview/#how-severities-are-assigned
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['blocker', 1.0],
  ['critical', 0.7],
  ['major', 0.5],
  ['minor', 0.3],
  ['info', 0.0]
]);

const CWE_NIST_MAPPING = new CweNistMapping();
const OWASP_NIST_MAPPING = new OwaspNistMapping();

function parseOwaspInSysTags<T extends SonarqubeVersion>(
  issue: SonarqubeVersionMapping[T]['issue'] & IssueExtensions<T>
): string[] {
  return issue.ruleInformation.rule.sysTags
    .filter((s) => s.toLowerCase().startsWith('owasp-'))
    .map((t) => t.substring('owasp-'.length).toUpperCase()); // this will just look like 'A3'
}

function parseOwaspTags<T extends SonarqubeVersion>(
  issue: SonarqubeVersionMapping[T]['issue'] & IssueExtensions<T>
): string[] | undefined {
  let searchSpace = '';
  const rule = issue.ruleInformation.rule;
  if ('htmlDesc' in rule) {
    searchSpace += rule.htmlDesc;
  }
  if (rule.descriptionSections) {
    searchSpace += rule.descriptionSections.map((s) => s.content).join('');
  }
  const searchSpaceMatches = [
    ...searchSpace.matchAll(/> ?OWASP.*?(Top .*?A\d\d?)/gu)
  ].map((m) => m[1]); // get the capture group which looks like 'Top 10 2021 Category A1'
  const sysTagMatches = parseOwaspInSysTags<T>(issue);
  const totalMatches = searchSpaceMatches.concat(sysTagMatches);

  if (totalMatches.length) {
    return totalMatches;
  }
  return undefined;
}

function parseCweTags<T extends SonarqubeVersion>(
  issue: SonarqubeVersionMapping[T]['issue'] & IssueExtensions<T>
): string[] | undefined {
  let searchSpace = '';
  const rule = issue.ruleInformation.rule;
  if ('htmlDesc' in rule) {
    searchSpace += rule.htmlDesc;
  }
  if (rule.descriptionSections) {
    searchSpace += rule.descriptionSections.map((s) => s.content).join('');
  }
  const uniqueCwes = _.uniq(searchSpace.match(/CWE-\d\d\d?\d?\d?\d?\d/gi)); // CWE IDs are embedded inside of the HTML

  if (uniqueCwes.length) {
    return uniqueCwes;
  }
  return undefined;
}

function parseNistTags<T extends SonarqubeVersion>(
  issue: SonarqubeVersionMapping[T]['issue'] & IssueExtensions<T>
): string[] | undefined {
  const uniqueNist = _.uniq(
    (parseCweTags<T>(issue) ?? [])
      .flatMap((t) => CWE_NIST_MAPPING.nistFilter(t.split('-')[1]))
      .concat(
        // adding in the systags' owasp tag since in older sonarqube versions sometimes no other guidance alignment is provided
        (parseOwaspInSysTags<T>(issue) ?? []).flatMap((t) =>
          OWASP_NIST_MAPPING.nistFilterNoDefault(t)
        )
      )
  );

  if (uniqueNist.length) {
    return uniqueNist;
  }

  return ['SA-11']; // Sonarqube is a static code analysis tool so we'll use SA-11 (DEVELOPER SECURITY TESTING AND EVALUATION) to handle all the bugs and code smells as a default for whenever it doesn't have security guidance to give us.  Explicitly not using RA-5 (VULNERABILITY SCANNING) since all of those seem to have guidance associated with them.
}

export class SonarqubeMapper<T extends SonarqubeVersion> extends BaseConverter<
  Data<T>
> {
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
        name: 'SonarQube Scan',
        version: {
          transformer: (data: Data<T>): string =>
            `SonarQube v${data.sonarqubeVersion}`
        },
        title: {
          transformer: (data: Data<T>): string => {
            const branch = data.branchName ? ` branch ${data.branchName}` : '';
            const pullrequest = data.pullRequestID
              ? ` pull request ${data.pullRequestID}`
              : '';
            const org = data.organization
              ? ` organization ${data.organization}`
              : '';
            return `SonarQube Scan of project ${data.projectKey} on ${data.sonarqubeHost} at ${new Date().toISOString()}${data.branchName || data.pullRequestID || data.organization ? ' using' : ''}${[branch, pullrequest, org].filter((s) => s).join(',')}`;
          }
        },
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'search.issues',
            key: 'id',
            desc: {
              transformer: (
                issue: SonarqubeVersionMapping[T]['issue'] & IssueExtensions<T>
              ): string => {
                const rule = issue.ruleInformation.rule;
                if ('htmlDesc' in rule) {
                  return rule.htmlDesc;
                }
                if (!rule.descriptionSections) {
                  return '';
                }
                const def = rule.descriptionSections.find(
                  (d) => d.key === 'default'
                );
                if (def) {
                  return def.content;
                }
                const introduction = rule.descriptionSections.find(
                  (d) => d.key === 'introduction'
                );
                const rootcause = rule.descriptionSections.find(
                  (d) => d.key === 'root_cause'
                );
                return [introduction, rootcause]
                  .filter(
                    (s): s is {key: string; content: string} => s !== undefined
                  )
                  .map((s) => s.content)
                  .join('\n');
              }
            },
            refs: [],
            source_location: {},
            id: {path: 'rule'},
            title: {path: 'ruleInformation.rule.name'},
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            tags: {
              cci: {
                transformer: (
                  issue: SonarqubeVersionMapping[T]['issue'] &
                    IssueExtensions<T>
                ): string[] => getCCIsForNISTTags(parseNistTags(issue) ?? [])
              },
              nist: {transformer: parseNistTags},
              cweid: {transformer: parseCweTags},
              owasp: {transformer: parseOwaspTags},
              createdAt: {path: 'ruleInformation.rule.createdAt'},
              debtRemFnType: {path: 'ruleInformation.rule.debtRemFnType'},
              defaultDebtRemFnType: {
                path: 'ruleInformation.rule.defaultDebtRemFnType'
              },
              isExternal: {path: 'ruleInformation.rule.isExternal'},
              isTemplate: {path: 'ruleInformation.rule.isTemplate'},
              langName: {path: 'ruleInformation.rule.langName'},
              remFnBaseEffort: {path: 'ruleInformation.rule.remFnBaseEffort'},
              remFnOverloaded: {path: 'ruleInformation.rule.remFnOverloaded'},
              remFnType: {path: 'ruleInformation.rule.remFnType'},
              repo: {path: 'ruleInformation.rule.repo'},
              scope: {path: 'ruleInformation.rule.scope'},
              ruleSeverity: {path: 'ruleInformation.rule.severity'},
              status: {path: 'ruleInformation.rule.status'},
              transformer: (
                issue: SonarqubeVersionMapping[T]['issue'] & IssueExtensions<T>
              ) => ({
                ...conditionallyProvideAttribute(
                  'Actives',
                  issue.ruleInformation.actives,
                  issue.ruleInformation.actives.length !== 0
                ),
                ...conditionallyProvideAttribute(
                  'Clean Code Attribute',
                  issue.ruleInformation.rule.cleanCodeAttribute,
                  issue.ruleInformation.rule.cleanCodeAttribute?.length !== 0
                ),
                ...conditionallyProvideAttribute(
                  'Clean Code Attribute Category',
                  issue.ruleInformation.rule.cleanCodeAttributeCategory,
                  issue.ruleInformation.rule.cleanCodeAttributeCategory
                    ?.length !== 0
                ),
                ...conditionallyProvideAttribute(
                  'Debt Overloaded',
                  'debtOverloaded' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.debtOverloaded,
                  'debtOverloaded' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.debtOverloaded !== undefined
                ),
                ...conditionallyProvideAttribute(
                  'Debt Rem Fn Coeff',
                  'debtRemFnCoeff' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.debtRemFnCoeff,
                  'debtRemFnCoeff' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.debtRemFnCoeff !== undefined
                ),
                ...conditionallyProvideAttribute(
                  'Debt Rem Fn Offset',
                  'debtRemFnOffset' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.debtRemFnOffset,
                  'debtRemFnOffset' in issue.ruleInformation.rule
                ),
                ...conditionallyProvideAttribute(
                  'Default Debt Rem Fn Coeff',
                  'defaultDebtRemFnCoeff' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.defaultDebtRemFnCoeff,
                  'defaultDebtRemFnCoeff' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.defaultDebtRemFnCoeff !==
                      undefined
                ),
                ...conditionallyProvideAttribute(
                  'Default Debt Rem Fn Offset',
                  'defaultDebtRemFnOffset' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.defaultDebtRemFnOffset,
                  'defaultDebtRemFnOffset' in issue.ruleInformation.rule
                ),
                ...conditionallyProvideAttribute(
                  'Education Principles',
                  'educationPrinciples' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.educationPrinciples,
                  'educationPrinciples' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.educationPrinciples?.length !== 0
                ),
                ...conditionallyProvideAttribute(
                  'Effort To Fix Description',
                  'effortToFixDescription' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.effortToFixDescription,
                  'effortToFixDescription' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.effortToFixDescription !==
                      undefined
                ),
                ...conditionallyProvideAttribute(
                  'Impacts',
                  issue.ruleInformation.rule.impacts,
                  issue.ruleInformation.rule.impacts?.length !== 0
                ),
                ...conditionallyProvideAttribute(
                  'Issue Type Vulnerability',
                  true,
                  issue.type === 'VULNERABILITY'
                ),
                ...conditionallyProvideAttribute(
                  'Issue Type Bug',
                  true,
                  issue.type === 'BUG'
                ),
                ...conditionallyProvideAttribute(
                  'Issue Type Code Smell',
                  true,
                  issue.type === 'CODE_SMELL'
                ),
                ...conditionallyProvideAttribute(
                  'Params',
                  issue.ruleInformation.rule.params,
                  issue.ruleInformation.rule.params?.length !== 0
                ),
                ...conditionallyProvideAttribute(
                  'Security Standards',
                  issue.ruleInformation.rule.securityStandards,
                  issue.ruleInformation.rule.securityStandards?.length !== 0
                ),
                ...conditionallyProvideAttribute(
                  'Sys Tags',
                  issue.ruleInformation.rule.sysTags,
                  issue.ruleInformation.rule.sysTags?.length !== 0
                ),
                ...conditionallyProvideAttribute(
                  'Tags',
                  issue.ruleInformation.rule.tags,
                  issue.ruleInformation.rule.tags?.length !== 0
                ),
                ...conditionallyProvideAttribute(
                  'Updated At',
                  'updatedAt' in issue.ruleInformation.rule &&
                    issue.ruleInformation.rule.updatedAt,
                  'updatedAt' in issue.ruleInformation.rule
                )
              })
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {path: 'codeSnippet'},
                start_time: {path: 'creationDate'},
                message: {
                  transformer: (
                    issue: SonarqubeVersionMapping[T]['issue'] &
                      IssueExtensions<T>
                  ) =>
                    JSON.stringify(
                      {
                        // Explanation of the violation
                        Message: issue.message,

                        // Useful information
                        Author: issue.author,
                        'Creation Date': issue.creationDate,
                        Debt: issue.debt,
                        Effort: issue.effort,
                        ...conditionallyProvideAttribute(
                          'Issue Status',
                          issue.issueStatus,
                          issue.issueStatus?.length !== 0
                        ),
                        ...conditionallyProvideAttribute(
                          'Resolution',
                          issue.resolution,
                          issue.resolution?.length !== 0
                        ),
                        Status: issue.status,
                        'Update Date': issue.updateDate,

                        // all the rest
                        ...conditionallyProvideAttribute(
                          'Actions',
                          issue.actions,
                          issue.actions?.length !== 0
                        ),
                        ...conditionallyProvideAttribute(
                          'Attr',
                          issue.attr,
                          issue.attr !== undefined
                        ),
                        ...conditionallyProvideAttribute(
                          'Code Variants',
                          'codeVariants' in issue && issue.codeVariants,
                          'codeVariants' in issue &&
                            issue.codeVariants?.length !== 0
                        ),
                        ...conditionallyProvideAttribute(
                          'Comments',
                          issue.comments,
                          issue.comments?.length !== 0
                        ),
                        ...conditionallyProvideAttribute(
                          'Flows',
                          issue.flows,
                          issue.flows?.length !== 0
                        ),
                        ...conditionallyProvideAttribute(
                          'From Hotspot',
                          'fromHotspot' in issue && issue.fromHotspot,
                          'fromHotspot' in issue &&
                            issue.fromHotspot !== undefined &&
                            issue.fromHotspot !== null
                        ),
                        Hash: issue.hash,
                        Key: issue.key,
                        ...conditionallyProvideAttribute(
                          'Message Formattings',
                          issue.messageFormattings,
                          issue.messageFormattings?.length !== 0
                        ),
                        ...conditionallyProvideAttribute(
                          'Prioritized Rule',
                          'prioritizedRule' in issue && issue.prioritizedRule,
                          'prioritizedRule' in issue
                        ),
                        ...conditionallyProvideAttribute(
                          'Project Name',
                          issue.projectName,
                          issue.projectName?.length !== 0
                        ),
                        ...conditionallyProvideAttribute(
                          'Quick Fix Available',
                          'quickFixAvailable' in issue &&
                            issue.quickFixAvailable,
                          'quickFixAvailable' in issue &&
                            issue.quickFixAvailable !== undefined
                        ),
                        ...conditionallyProvideAttribute(
                          'Rule Description Context Key',
                          'ruleDescriptionContextKey' in issue &&
                            issue.ruleDescriptionContextKey,
                          'ruleDescriptionContextKey' in issue &&
                            issue.ruleDescriptionContextKey?.length !== 0
                        ),
                        ...conditionallyProvideAttribute(
                          'Tags',
                          issue.tags,
                          issue.tags?.length !== 0
                        ),
                        ...conditionallyProvideAttribute(
                          'Transitions',
                          issue.transitions,
                          issue.transitions?.length !== 0
                        )
                      },
                      null,
                      2
                    )
                }
              }
            ],
            transformer: () => ({
              descriptions: {
                transformer: (
                  issue: SonarqubeVersionMapping[T]['issue'] &
                    IssueExtensions<T>
                ): ExecJSON.ControlDescription[] | null => {
                  const rule = issue.ruleInformation.rule;
                  if (
                    rule.descriptionSections &&
                    rule.descriptionSections.length > 0
                  ) {
                    const def = rule.descriptionSections.find(
                      (d) => d.key === 'default'
                    );
                    const introduction = rule.descriptionSections.find(
                      (d) => d.key === 'introduction'
                    );
                    const rootcause = rule.descriptionSections.find(
                      (d) => d.key === 'root_cause'
                    );
                    const check = rule.descriptionSections.find(
                      (d) => d.key === 'assess_the_problem'
                    );
                    const fix = rule.descriptionSections.find(
                      (d) => d.key === 'how_to_fix'
                    );
                    const remainder = rule.descriptionSections.filter(
                      (d) =>
                        ![
                          'default',
                          'introduction',
                          'root_cause',
                          'assess_the_problem',
                          'how_to_fix'
                        ].includes(d.key)
                    );
                    const sections = [
                      def,
                      def ? introduction : undefined,
                      def ? rootcause : undefined,
                      check,
                      fix,
                      ...remainder
                    ]
                      .filter(
                        (s): s is {key: string; content: string} =>
                          s !== undefined
                      )
                      .map((s) => ({
                        data: s.content,
                        label:
                          s.key === 'assess_the_problem'
                            ? 'check'
                            : s.key === 'how_to_fix'
                              ? 'fix'
                              : s.key
                      }));
                    if (sections) {
                      return sections;
                    }
                  }
                  return null;
                }
              }
            })
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Data<T>): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              name: 'SonarQube',
              data: {
                ..._.omit(data, 'search.issues')
              }
            }
          ],
          ...conditionallyProvideAttribute('raw', data, this.withRaw)
        };
      }
    }
  };

  constructor(
    public readonly data: Data<T>,
    withRaw = false
  ) {
    super(data);
    this.withRaw = withRaw;
  }
}

// Sonarqube used to require using the user token as the username and supplying no password, but added the bearer token method as an option in 10.x.  The bearer token method became the only allowed version in 25.x.
enum AuthenticationMethod {
  TokenAsUsername,
  BearerToken
}

export class SonarqubeResults {
  authMethod?: AuthenticationMethod;
  constructor(
    public readonly sonarqubeHost: string,
    public readonly projectKey: string,
    private readonly userToken: string,
    public readonly branchName?: string, // if branch/pr are not specified, then sonarqube uses the default branch
    public readonly pullRequestID?: string,
    public readonly organization?: string, // sometimes the organization parameter is required for the api/rules/show endpoint - we try to grab it from the issue, but this is here to ensure a fallback if necessary
    public readonly withRaw = false
  ) {}

  logAxiosError(e: AxiosError): void {
    if (e.response) {
      logger.debug('response');
      logger.debug(e.response.status);
      logger.debug(inspect(e.response.data, {depth: 3}));
    }
    if (e.request) {
      logger.debug('request');
      logger.debug(inspect(e.request, {depth: 3}));
    }
    if (e.message) {
      logger.debug('message');
      logger.debug('Error', e.message);
    }
  }

  async getSearchResults<T extends SonarqubeVersion>(): Promise<Search<T>> {
    let paging = true;
    let page = 1;
    const results: Search<T> = {
      components: [],
      effortTotal: 0,
      facets: [],
      issues: [],
      paging: {pageIndex: 0, pageSize: 0, total: 0}
    };
    while (paging) {
      await axios
        .get<Search<T>>(`${this.sonarqubeHost}/api/issues/search`, {
          ...(this.authMethod === AuthenticationMethod.TokenAsUsername && {
            auth: {username: this.userToken, password: ''}
          }),
          ...(this.authMethod === AuthenticationMethod.BearerToken && {
            headers: {Authorization: `Bearer ${this.userToken}`}
          }),
          params: {
            componentKeys: this.projectKey,
            statuses: 'OPEN,REOPENED,CONFIRMED,RESOLVED',
            p: page,
            ...(this.branchName && {branch: this.branchName}),
            ...(this.pullRequestID && {pullRequest: this.pullRequestID})
          }
        })
        .then(({data}) => {
          _.mergeWith(results, data, (objValue, srcValue) =>
            _.isArray(objValue) ? objValue.concat(srcValue) : undefined
          );
          paging =
            data.paging.pageIndex * data.paging.pageSize <= data.paging.total;
          page += 1;
        })
        .catch((e) => {
          this.logAxiosError(e);
          return Promise.reject(new Error('Failed at getting Sonarqube issue'));
        });
    }
    return results;
  }

  async getCodeSnippets<T extends SonarqubeVersion>(
    issues: SonarqubeVersionMapping[T]['issue'][]
  ): Promise<string[]> {
    const getFullFile = async (component: string): Promise<string> => {
      return axios
        .get<string>(`${this.sonarqubeHost}/api/sources/raw`, {
          ...(this.authMethod === AuthenticationMethod.TokenAsUsername && {
            auth: {username: this.userToken, password: ''}
          }),
          ...(this.authMethod === AuthenticationMethod.BearerToken && {
            headers: {Authorization: `Bearer ${this.userToken}`}
          }),
          params: {
            key: component,
            ...(this.branchName && {branch: this.branchName}),
            ...(this.pullRequestID && {pullRequest: this.pullRequestID})
          },
          responseType: 'text'
        })
        .then(({data}) => data)
        .catch((e) => {
          this.logAxiosError(e);
          return Promise.reject(
            new Error(
              `Failed at getting Sonarqube code snippet for ${component}`
            )
          );
        });
    };
    const applyLineNumber = (snippet: string): string =>
      snippet
        .split('\n')
        .map((l, i) => `${i + 1} ${l}`)
        .join('\n');
    const getContextualizedSnippet = (
      fullFiles: Record<string, string>,
      component: string,
      startLine: number,
      endLine: number,
      msg?: string
    ): string => {
      const linenumberedFile = applyLineNumber(fullFiles[component]);
      const snippet = linenumberedFile
        .split('\n')
        .slice(Math.max(startLine - 3, 0), endLine + 3) // slice wraps around if the start is less than 0 so we want to put a bounds check there to ensure we start at the top of the file; however, if the end is past the end of the array then it just goes until the end of the array so no bounds check is required there
        .join('\n')
        .trim();
      const location = `${component}:${startLine}-${endLine}\n`;
      const message = msg ? `${msg}\n` : '';
      return `${location}${message}<pre>\n${snippet}\n</pre>`;
    };

    const components = _.uniq(
      issues.flatMap((issue) =>
        issue.flows.length
          ? issue.flows.flatMap((flow) =>
              flow.locations.map((location) => location.component)
            )
          : [issue.component]
      )
    );
    const fullFilePromises = await Promise.all(
      components.map((component) => getFullFile(component))
    );
    const fullFiles = Object.fromEntries(_.zip(components, fullFilePromises));

    const snippets = issues.map((issue) =>
      issue.flows.length
        ? issue.flows
            .flatMap((flow) =>
              flow.locations.map((location) =>
                getContextualizedSnippet(
                  fullFiles,
                  location.component,
                  location.textRange.startLine,
                  location.textRange.endLine,
                  location.msg
                )
              )
            )
            .join('\n')
        : getContextualizedSnippet(
            fullFiles,
            issue.component,
            issue.textRange.startLine,
            issue.textRange.endLine
          )
    );
    return snippets;
  }

  async getRules<T extends SonarqubeVersion>(
    issues: SonarqubeVersionMapping[T]['issue'][]
  ): Promise<Rule<T>[]> {
    const getRule = async (
      rule: string,
      organization?: string
    ): Promise<Rule<T>> =>
      axios
        .get<Rule<T>>(`${this.sonarqubeHost}/api/rules/show`, {
          ...(this.authMethod === AuthenticationMethod.TokenAsUsername && {
            auth: {username: this.userToken, password: ''}
          }),
          ...(this.authMethod === AuthenticationMethod.BearerToken && {
            headers: {Authorization: `Bearer ${this.userToken}`}
          }),
          params: {
            key: rule,
            ...((organization || this.organization) && {
              organization: organization || this.organization
            }) // seems to be required for sonarcloud at least
          }
        })
        .then(({data}) => data)
        .catch((e) => {
          this.logAxiosError(e);
          return Promise.reject(
            new Error(`Failed at getting Sonarqube rule: ${rule}`)
          );
        });

    const rulesAndOrgs: [string, string | undefined][] = _.uniqWith(
      issues.map((issue) => [issue.rule, issue.organization]),
      _.isEqual
    );
    const fullRulePromises = await Promise.all(
      rulesAndOrgs.map((ruleAndOrg) => getRule(...ruleAndOrg))
    );
    const fullRules = Object.fromEntries(
      _.zip(
        rulesAndOrgs.map((ruleAndOrg) => ruleAndOrg.join('\n')),
        fullRulePromises
      )
    );

    const rules = issues.map(
      (issue) => fullRules[[issue.rule, issue.organization].join('\n')]
    );
    return rules;
  }

  async generateHdf<T extends SonarqubeVersion>(
    sonarqubeVersion: string
  ): Promise<ExecJSON.Execution> {
    const searchResults = await this.getSearchResults<T>();
    logger.debug(`Got ${searchResults.issues.length} issues`);
    const codeSnippets = await this.getCodeSnippets<T>(searchResults.issues);
    logger.debug(`Got ${codeSnippets.length} code snippets`);
    const rules = await this.getRules<T>(searchResults.issues);
    logger.debug(`Got ${rules.length} rules`);
    const data: Data<T> = {
      sonarqubeVersion,
      sonarqubeHost: this.sonarqubeHost,
      projectKey: this.projectKey,
      branchName: this.branchName,
      pullRequestID: this.pullRequestID,
      organization: this.organization,
      search: {
        ...searchResults,
        issues: searchResults.issues.map((issue, index) => ({
          ...issue,
          codeSnippet: codeSnippets[index],
          ruleInformation: rules[index]
        }))
      }
    };
    return new SonarqubeMapper<T>(data, this.withRaw).toHdf();
  }

  async toHdf(): Promise<ExecJSON.Execution> {
    const sonarqubeVersion = await axios
      .get<string>(`${this.sonarqubeHost}/api/server/version`)
      .then(({data}) => data);
    logger.debug(
      `Generating HDF for ${this.sonarqubeHost} version: ${sonarqubeVersion}`
    );

    this.authMethod = isSonarqubeVersionNine(sonarqubeVersion)
      ? AuthenticationMethod.TokenAsUsername
      : AuthenticationMethod.BearerToken;

    if (isSonarqubeVersionEight(sonarqubeVersion)) {
      return this.generateHdf<SonarqubeVersion.Eight>(sonarqubeVersion);
    } else if (isSonarqubeVersionNine(sonarqubeVersion)) {
      return this.generateHdf<SonarqubeVersion.Nine>(sonarqubeVersion);
    } else if (isSonarqubeVersionTen(sonarqubeVersion)) {
      return this.generateHdf<SonarqubeVersion.Ten>(sonarqubeVersion);
    } else if (isSonarqubeVersionTwenty_five(sonarqubeVersion)) {
      return this.generateHdf<SonarqubeVersion.Twenty_five>(sonarqubeVersion);
    } else {
      logger.debug(
        `Sonarqube version ${sonarqubeVersion} is not formally supported.  Please create an issue at https://github.com/mitre/heimdall2/issues if something is broken.`
      );
      return this.generateHdf<SonarqubeVersion.Twenty_five>(sonarqubeVersion);
    }
  }
}
