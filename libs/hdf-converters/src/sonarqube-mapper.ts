import { inspect } from 'util';
import type { AxiosError, AxiosInstance } from 'axios';
import axios from 'axios';
import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import * as rax from 'retry-axios';
import { coerce, lt } from 'semver';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  impactMapping,
} from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import { OwaspNistMapping } from './mappings/OwaspNistMapping';
import {
  conditionallyProvideAttribute,
  createWinstonLogger,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';

const logger = createWinstonLogger('SonarQube2HDF');

function applyLineNumber(snippet: string): string {
  return snippet
    .split('\n')
    .map((l, i) => `${i + 1} ${l}`)
    .join('\n');
}

// the Sonarqube schema typings are meant to support the four versions out right now (8, 9, 10, and 2025/25).  9 and 25 are supposed to be LTS releases.  8 is currently used by the Sonarcloud deployment though Sonarqube POCs say that it is no longer supported / they do not see many deployments of it.
enum SonarqubeVersion {
  Eight = '8.0.0',
  Nine = '9.0.0',
  Ten = '10.0.0',
  Twenty_five = '2025.0.0',
}

type ComponentSearch = {
  baseComponent: {
    description: string;
    isAiCodeFixEnabled?: boolean;
    key: string;
    name?: string;
    organization?: string;
    qualifier: string;
    tags: string[];
    visibility: string;
  };
  components: {
    key: string;
    language: string;
    name: string;
    organization?: string;
    path: string;
    qualifier: string;
  }[];
  paging: { pageIndex: number; pageSize: number; total: number };
};

type Data<T extends SonarqubeVersion> = {
  branchName?: string;
  organization?: string;
  projectKey: string;
  pullRequestID?: string;
  search: Omit<Search<T>, 'issues'> & { issues: (IssueExtensions<T> & SonarqubeVersionMapping[T]['issue'])[] };
  sonarqubeHost: string;
  sonarqubeVersion: string;
};

// many of these attributes show up in the API example responses, but not in our locally generated samples.
// a few of them are mentioned in the changelog, but do not show up in samples or the examples
// several of these attributes show up in sonarcloud (which is marked as major version 8) even though the documentation says that they should first only show up in latter versions.  to that end, I've marked them as optional for lack of any other action we can take.
type Issue_8 = {
  actions?: string[];
  attr?: { 'jira-issue-key'?: string };
  author: string;
  cleanCodeAttribute?: string;
  cleanCodeAttributeCategory?: string;
  comments?: {
    createdAt: string;
    htmlText: string;
    key: string;
    login: string;
    markdown: string;
    updatable: boolean;
  }[];
  component: string;
  creationDate: string;
  debt: string;
  effort: string;
  flows: {
    locations: {
      component: string;
      msg: string;
      msgFormattings?: { end: number; start: number; type: string }[];
      textRange: {
        endLine: number;
        endOffset: number;
        startLine: number;
        startOffset: number;
      };
    }[];
  }[];
  fromHotspot?: unknown;
  hash: string;
  impacts?: { severity: string; softwareQuality: string }[];
  issueStatus?: string;
  key: string;
  line: number;
  message: string;
  messageFormattings?: { end: number; start: number; type: string }[];
  organization?: string;
  project: string;
  projectName?: string;
  resolution?: string; // the changelog for the endpoint mentions something about 'resolutions' which might be the same as this endpoint?
  rule: string;
  scope?: string;
  severity: string;
  status: string;
  tags: string[];
  textRange?: {
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

type Issue_25 = Issue_10 & {
  fromSonarQubeUpdate: boolean;
  internalTags: unknown[];
  linkedTicketStatus: string;
};

type IssueExtensions<T extends SonarqubeVersion> = {
  codeSnippet: string;
  ruleInformation: Rule<T>;
};

type Rule<T extends SonarqubeVersion> = {
  actives: {
    inherit: string;
    params: { key: string; value: string }[];
    qProfile: string;
    severity: string;
  }[];
  rule: SonarqubeVersionMapping[T]['ruleInformation'];
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
  descriptionSections?: { content: string; key: string }[]; // sonarqube changelog says it was added in 9.5 if I'm interpreting "The field 'descriptionSections' has been added to the payload" properly, but sonarcloud (which is v8 nominally) has it too
  effortToFixDescription?: unknown;
  htmlDesc: string;
  impacts?: { severity: string; softwareQuality: string }[];
  isExternal: boolean;
  isTemplate: boolean;
  key: string;
  lang: string;
  langName: string;
  mdDesc: string;
  name: string;
  params: { defaultValue: string; desc: string; key: string }[];
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

type Rule_9 = Rule_8 & { educationPrinciples?: unknown[] };

type Rule_10 = Omit<
  Rule_9,
  | 'debtOverloaded'
  | 'debtRemFnCoeff'
  | 'debtRemFnOffset'
  | 'defaultDebtRemFnCoeff'
  | 'defaultDebtRemFnOffset'
  | 'effortToFixDescription'
> & { updatedAt: string };

type Rule_25 = Omit<Rule_10, 'htmlDesc' | 'mdDesc'>;

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
  facets: { property: string; values: { count: number; val: string }[] }[];
  issues: SonarqubeVersionMapping[T]['issue'][];
  organizations?: { key: string; name: string }[];
  p?: number; // deprecated as of 9.8
  paging: { pageIndex: number; pageSize: number; total: number };
  ps?: number; // deprecated as of 9.8
  rules?: {
    key: string;
    lang: string;
    langName: string;
    name: string;
    status: string;
  }[];
  total?: number; // deprecated as of 9.8
  users?: { active: boolean; avatar: string; login: string; name: string }[];
};

type SonarqubeVersionMapping = {
  [SonarqubeVersion.Eight]: { issue: Issue_8; ruleInformation: Rule_8 };
  [SonarqubeVersion.Nine]: { issue: Issue_9; ruleInformation: Rule_9 };
  [SonarqubeVersion.Ten]: { issue: Issue_10; ruleInformation: Rule_10 };
  [SonarqubeVersion.Twenty_five]: { issue: Issue_25; ruleInformation: Rule_25 };
};

function isBeforeSonarqubeVersion(
  version: string,
  comparisonVersion: string,
): boolean {
  const v = coerce(version);
  if (v === null) {
    throw new Error(
      `Was not able to coerce ${version} into a semver compatible version string`,
    );
  }
  const cv = coerce(comparisonVersion);
  if (cv === null) {
    throw new Error(
      `Was not able to coerce ${comparisonVersion} into a semver compatible version string`,
    );
  }
  return lt(v, cv);
}

// intentionally open ended to support versions less than 8, but it is unlikely that they will be out there based on discussions with Sonar engineers
function isSonarqubeVersionEight(
  version: string,
): version is SonarqubeVersion.Eight {
  const nextHigherVersion = SonarqubeVersion.Nine;
  const v = coerce(version);
  if (v === null) {
    throw new Error(
      `Was not able to coerce ${version} into a semver compatible version string`,
    );
  }
  return lt(v, nextHigherVersion);
}

function isSonarqubeVersionNine(
  version: string,
): version is SonarqubeVersion.Nine {
  const nextHigherVersion = SonarqubeVersion.Ten;
  const v = coerce(version);
  if (v === null) {
    throw new Error(
      `Was not able to coerce ${version} into a semver compatible version string`,
    );
  }
  return lt(v, nextHigherVersion);
}

function isSonarqubeVersionTen(
  version: string,
): version is SonarqubeVersion.Ten {
  const nextHigherVersion = SonarqubeVersion.Twenty_five;
  const v = coerce(version);
  if (v === null) {
    throw new Error(
      `Was not able to coerce ${version} into a semver compatible version string`,
    );
  }
  return lt(v, nextHigherVersion);
}

function isSonarqubeVersionTwenty_five(
  version: string,
): version is SonarqubeVersion.Twenty_five {
  const nextHigherVersion = '2026.0.0'; // using 26 for now, but I am unsure what the actual next major version will be - this function can be changed once we identify the next version that contains impactful breaking changes
  const v = coerce(version);
  if (v === null) {
    throw new Error(
      `Was not able to coerce ${version} into a semver compatible version string`,
    );
  }
  return lt(v, nextHigherVersion);
}

// https://docs.sonarsource.com/sonarqube-server/latest/user-guide/rules/overview/#how-severities-are-assigned
const IMPACT_MAPPING = new Map<string, number>([
  ['blocker', 1],
  ['critical', 0.7],
  ['info', 0],
  ['major', 0.5],
  ['minor', 0.3],
]);

const CWE_NIST_MAPPING = new CweNistMapping();
const OWASP_NIST_MAPPING = new OwaspNistMapping();

// Sonarqube used to require using the user token as the username and supplying no password, but added the bearer token method as an option in 10.x.  The bearer token method became the only allowed version in 25.x.
enum AuthenticationMethod {
  TokenAsUsername,
  BearerToken,
}

export class SonarqubeMapper<T extends SonarqubeVersion> extends BaseConverter<
  Data<T>
> {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Data<T>): Record<string, unknown> => {
        return {
          auxiliary_data: [
            {
              data: { ..._.omit(data, 'search.issues') },
              name: 'SonarQube',
            },
          ],
          ...conditionallyProvideAttribute('raw', data, this.withRaw),
        };
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
    },
    profiles: [
      {
        attributes: [],
        controls: [
          {
            desc: {
              transformer: (
                issue: IssueExtensions<T> & SonarqubeVersionMapping[T]['issue'],
              ): string => {
                const rule = issue.ruleInformation.rule;
                if ('htmlDesc' in rule) {
                  return rule.htmlDesc;
                }
                if (!rule.descriptionSections) {
                  return '';
                }
                const def = rule.descriptionSections.find(
                  d => d.key === 'default',
                );
                if (def) {
                  return def.content;
                }
                const introduction = rule.descriptionSections.find(
                  d => d.key === 'introduction',
                );
                const rootcause = rule.descriptionSections.find(
                  d => d.key === 'root_cause',
                );
                return [introduction, rootcause]
                  .filter(
                    (s): s is { content: string; key: string } => s !== undefined,
                  )
                  .map(s => s.content)
                  .join('\n');
              },
            },
            id: { path: 'rule' },
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING),
            },
            key: 'id',
            path: 'search.issues',
            refs: [],
            results: [
              {
                code_desc: { path: 'codeSnippet' },
                message: {
                  transformer: (
                    issue: IssueExtensions<T>
                      & SonarqubeVersionMapping[T]['issue'],
                  ) =>
                    JSON.stringify(
                      {
                        // Useful information
                        Author: issue.author,

                        'Creation Date': issue.creationDate,
                        Debt: issue.debt,
                        Effort: issue.effort,
                        // Explanation of the violation
                        Message: issue.message,
                        ...conditionallyProvideAttribute(
                          'Issue Status',
                          issue.issueStatus,
                          issue.issueStatus?.length !== 0,
                        ),
                        ...conditionallyProvideAttribute(
                          'Resolution',
                          issue.resolution,
                          issue.resolution?.length !== 0,
                        ),
                        Status: issue.status,
                        'Update Date': issue.updateDate,

                        // all the rest
                        ...conditionallyProvideAttribute(
                          'Actions',
                          issue.actions,
                          issue.actions?.length !== 0,
                        ),
                        ...conditionallyProvideAttribute(
                          'Attr',
                          issue.attr,
                          issue.attr !== undefined,
                        ),
                        ...conditionallyProvideAttribute(
                          'Code Variants',
                          'codeVariants' in issue && issue.codeVariants,
                          'codeVariants' in issue
                          && issue.codeVariants?.length !== 0,
                        ),
                        ...conditionallyProvideAttribute(
                          'Comments',
                          issue.comments,
                          issue.comments?.length !== 0,
                        ),
                        ...conditionallyProvideAttribute(
                          'Flows',
                          issue.flows,
                          issue.flows?.length !== 0,
                        ),
                        ...conditionallyProvideAttribute(
                          'From Hotspot',
                          'fromHotspot' in issue && issue.fromHotspot,
                          'fromHotspot' in issue
                          && issue.fromHotspot !== undefined
                          && issue.fromHotspot !== null,
                        ),
                        Hash: issue.hash,
                        Key: issue.key,
                        ...conditionallyProvideAttribute(
                          'Message Formattings',
                          issue.messageFormattings,
                          issue.messageFormattings?.length !== 0,
                        ),
                        ...conditionallyProvideAttribute(
                          'Prioritized Rule',
                          'prioritizedRule' in issue && issue.prioritizedRule,
                          'prioritizedRule' in issue,
                        ),
                        ...conditionallyProvideAttribute(
                          'Project Name',
                          issue.projectName,
                          issue.projectName?.length !== 0,
                        ),
                        ...conditionallyProvideAttribute(
                          'Quick Fix Available',
                          'quickFixAvailable' in issue
                          && issue.quickFixAvailable,
                          'quickFixAvailable' in issue
                          && issue.quickFixAvailable !== undefined,
                        ),
                        ...conditionallyProvideAttribute(
                          'Rule Description Context Key',
                          'ruleDescriptionContextKey' in issue
                          && issue.ruleDescriptionContextKey,
                          'ruleDescriptionContextKey' in issue
                          && issue.ruleDescriptionContextKey?.length !== 0,
                        ),
                        ...conditionallyProvideAttribute(
                          'Tags',
                          issue.tags,
                          issue.tags?.length !== 0,
                        ),
                        ...conditionallyProvideAttribute(
                          'Transitions',
                          issue.transitions,
                          issue.transitions?.length !== 0,
                        ),
                      },
                      null,
                      2,
                    ),
                },
                start_time: { path: 'creationDate' },
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: {},
            tags: {
              cci: {
                transformer: (
                  issue: IssueExtensions<T>
                    & SonarqubeVersionMapping[T]['issue'],
                ): string[] => getCCIsForNISTTags(parseNistTags(issue) ?? []),
              },
              createdAt: { path: 'ruleInformation.rule.createdAt' },
              cweid: { transformer: parseCweTags },
              debtRemFnType: { path: 'ruleInformation.rule.debtRemFnType' },
              defaultDebtRemFnType: { path: 'ruleInformation.rule.defaultDebtRemFnType' },
              isExternal: { path: 'ruleInformation.rule.isExternal' },
              isTemplate: { path: 'ruleInformation.rule.isTemplate' },
              langName: { path: 'ruleInformation.rule.langName' },
              nist: { transformer: parseNistTags },
              owasp: { transformer: parseOwaspTags },
              remFnBaseEffort: { path: 'ruleInformation.rule.remFnBaseEffort' },
              remFnOverloaded: { path: 'ruleInformation.rule.remFnOverloaded' },
              remFnType: { path: 'ruleInformation.rule.remFnType' },
              repo: { path: 'ruleInformation.rule.repo' },
              ruleSeverity: { path: 'ruleInformation.rule.severity' },
              scope: { path: 'ruleInformation.rule.scope' },
              status: { path: 'ruleInformation.rule.status' },
              transformer: (
                issue: IssueExtensions<T> & SonarqubeVersionMapping[T]['issue'],
              ) => ({
                ...conditionallyProvideAttribute(
                  'Actives',
                  issue.ruleInformation.actives,
                  issue.ruleInformation.actives.length > 0,
                ),
                ...conditionallyProvideAttribute(
                  'Clean Code Attribute',
                  issue.ruleInformation.rule.cleanCodeAttribute,
                  issue.ruleInformation.rule.cleanCodeAttribute?.length !== 0,
                ),
                ...conditionallyProvideAttribute(
                  'Clean Code Attribute Category',
                  issue.ruleInformation.rule.cleanCodeAttributeCategory,
                  issue.ruleInformation.rule.cleanCodeAttributeCategory
                    ?.length !== 0,
                ),
                ...conditionallyProvideAttribute(
                  'Debt Overloaded',
                  'debtOverloaded' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.debtOverloaded,
                  'debtOverloaded' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.debtOverloaded !== undefined,
                ),
                ...conditionallyProvideAttribute(
                  'Debt Rem Fn Coeff',
                  'debtRemFnCoeff' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.debtRemFnCoeff,
                  'debtRemFnCoeff' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.debtRemFnCoeff !== undefined,
                ),
                ...conditionallyProvideAttribute(
                  'Debt Rem Fn Offset',
                  'debtRemFnOffset' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.debtRemFnOffset,
                  'debtRemFnOffset' in issue.ruleInformation.rule,
                ),
                ...conditionallyProvideAttribute(
                  'Default Debt Rem Fn Coeff',
                  'defaultDebtRemFnCoeff' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.defaultDebtRemFnCoeff,
                  'defaultDebtRemFnCoeff' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.defaultDebtRemFnCoeff
                  !== undefined,
                ),
                ...conditionallyProvideAttribute(
                  'Default Debt Rem Fn Offset',
                  'defaultDebtRemFnOffset' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.defaultDebtRemFnOffset,
                  'defaultDebtRemFnOffset' in issue.ruleInformation.rule,
                ),
                ...conditionallyProvideAttribute(
                  'Education Principles',
                  'educationPrinciples' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.educationPrinciples,
                  'educationPrinciples' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.educationPrinciples?.length !== 0,
                ),
                ...conditionallyProvideAttribute(
                  'Effort To Fix Description',
                  'effortToFixDescription' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.effortToFixDescription,
                  'effortToFixDescription' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.effortToFixDescription
                  !== undefined,
                ),
                ...conditionallyProvideAttribute(
                  'Impacts',
                  issue.ruleInformation.rule.impacts,
                  issue.ruleInformation.rule.impacts?.length !== 0,
                ),
                ...conditionallyProvideAttribute(
                  'Issue Type Vulnerability',
                  true,
                  issue.type === 'VULNERABILITY',
                ),
                ...conditionallyProvideAttribute(
                  'Issue Type Bug',
                  true,
                  issue.type === 'BUG',
                ),
                ...conditionallyProvideAttribute(
                  'Issue Type Code Smell',
                  true,
                  issue.type === 'CODE_SMELL',
                ),
                ...conditionallyProvideAttribute(
                  'Params',
                  issue.ruleInformation.rule.params,
                  issue.ruleInformation.rule.params?.length !== 0,
                ),
                ...conditionallyProvideAttribute(
                  'Security Standards',
                  issue.ruleInformation.rule.securityStandards,
                  issue.ruleInformation.rule.securityStandards?.length !== 0,
                ),
                ...conditionallyProvideAttribute(
                  'Sys Tags',
                  issue.ruleInformation.rule.sysTags,
                  issue.ruleInformation.rule.sysTags?.length !== 0,
                ),
                ...conditionallyProvideAttribute(
                  'Tags',
                  issue.ruleInformation.rule.tags,
                  issue.ruleInformation.rule.tags?.length !== 0,
                ),
                ...conditionallyProvideAttribute(
                  'Updated At',
                  'updatedAt' in issue.ruleInformation.rule
                  && issue.ruleInformation.rule.updatedAt,
                  'updatedAt' in issue.ruleInformation.rule,
                ),
              }),
            },
            title: { path: 'ruleInformation.rule.name' },
            transformer: () => ({
              descriptions: {
                transformer: (
                  issue: IssueExtensions<T>
                    & SonarqubeVersionMapping[T]['issue'],
                ): ExecJSON.ControlDescription[] | null => {
                  const rule = issue.ruleInformation.rule;
                  if (
                    rule.descriptionSections
                    && rule.descriptionSections.length > 0
                  ) {
                    const def = rule.descriptionSections.find(
                      d => d.key === 'default',
                    );
                    const introduction = rule.descriptionSections.find(
                      d => d.key === 'introduction',
                    );
                    const rootcause = rule.descriptionSections.find(
                      d => d.key === 'root_cause',
                    );
                    const check = rule.descriptionSections.find(
                      d => d.key === 'assess_the_problem',
                    );
                    const fix = rule.descriptionSections.find(
                      d => d.key === 'how_to_fix',
                    );
                    const remainder = rule.descriptionSections.filter(
                      d =>
                        ![
                          'assess_the_problem',
                          'default',
                          'how_to_fix',
                          'introduction',
                          'root_cause',
                        ].includes(d.key),
                    );
                    const sections = [
                      def,
                      def ? introduction : undefined,
                      def ? rootcause : undefined,
                      check,
                      fix,
                      ...remainder,
                    ]
                      .filter(
                        (s): s is { content: string; key: string } =>
                          s !== undefined,
                      )
                      .map(s => ({
                        data: s.content,
                        label:
                          s.key === 'assess_the_problem'
                            ? 'check'
                            : (s.key === 'how_to_fix'
                              ? 'fix'
                              : s.key),
                      }));
                    if (sections) {
                      return sections;
                    }
                  }
                  return null;
                },
              },
            }),
          },
        ],
        groups: [],
        name: 'SonarQube Scan',
        sha256: '',
        status: 'loaded',
        supports: [],
        title: {
          transformer: (data: Data<T>): string => {
            const branch = data.branchName ? ` branch ${data.branchName}` : '';
            const pullrequest = data.pullRequestID
              ? ` pull request ${data.pullRequestID}`
              : '';
            const org = data.organization
              ? ` organization ${data.organization}`
              : '';
            return `SonarQube Scan of project ${data.projectKey} on ${data.sonarqubeHost} at ${new Date().toISOString()}${data.branchName || data.pullRequestID || data.organization ? ' using' : ''}${[branch, pullrequest, org].filter(Boolean).join(',')}`;
          },
        },
        version: {
          transformer: (data: Data<T>): string =>
            `SonarQube v${data.sonarqubeVersion}`,
        },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(
    public readonly data: Data<T>,
    withRaw = false,
  ) {
    super(data);
    this.withRaw = withRaw;
  }
}

export class SonarqubeResults {
  // Default statuses to exclude from results (deny-list approach)
  // Pre-10.4 legacy: CLOSED issues are end-of-life (rule deleted/disabled or component removed)
  // 10.4+: FALSE_POSITIVE (user says not real), FIXED (no longer in code, purged after 30 days)
  static readonly DEFAULT_DENY_LIST_LEGACY = ['CLOSED'];
  static readonly DEFAULT_DENY_LIST_MODERN = ['FALSE_POSITIVE', 'FIXED'];
  authMethod?: AuthenticationMethod;

  axiosClient: AxiosInstance;

  constructor(
    public readonly sonarqubeHost: string,
    public readonly projectKey: string,
    private readonly userToken: string,
    public readonly branchName?: string, // if branch/pr are not specified, then sonarqube uses the default branch
    public readonly pullRequestID?: string,
    public readonly organization?: string, // sometimes the organization parameter is required for the api/rules/show endpoint - we try to grab it from the issue, but this is here to ensure a fallback if necessary
    public readonly withRaw = false,
    public readonly excludeIssueStatuses?: string, // user-supplied comma-separated list of additional issue statuses to EXCLUDE from results
  ) {
    this.axiosClient = axios.create();
    const MAX_RETRIES = 5;
    this.axiosClient.defaults.raxConfig = {
      onError: (e) => {
        const cfg = rax.getConfig(e);
        if (
          cfg?.currentRetryAttempt !== null
          && cfg?.currentRetryAttempt !== undefined
        ) {
          logger.debug(
            `Error occurred: retry attempt #${cfg?.currentRetryAttempt}/${MAX_RETRIES} will happen after backoff`,
          );
        } else {
          this.logAxiosError(e);
        }
      },
      retry: MAX_RETRIES,
    };
    rax.attach(this.axiosClient);
  }

  async discoverIssueStatuses(sonarqubeVersion: string): Promise<string> {
    const isLegacy = isBeforeSonarqubeVersion(sonarqubeVersion, '10.4.0');
    const statusParamKey = isLegacy ? 'statuses' : 'issueStatuses';

    // Step 1: Discover all valid statuses from the server via /api/webservices/list
    let allStatuses: string[];

    try {
      const response = await this.axiosClient.get(
        `${this.sonarqubeHost}/api/webservices/list`,
        {
          ...(this.authMethod === AuthenticationMethod.TokenAsUsername && { auth: { password: '', username: this.userToken } }),
          ...(this.authMethod === AuthenticationMethod.BearerToken && { headers: { Authorization: `Bearer ${this.userToken}` } }),
        },
      );

      const issuesService = response.data.webServices?.find(
        (ws: { path: string }) => ws.path === 'api/issues',
      );
      const searchAction = issuesService?.actions?.find(
        (a: { key: string }) => a.key === 'search',
      );
      const statusParam = searchAction?.params?.find(
        (p: { key: string }) => p.key === statusParamKey,
      );

      if (statusParam?.possibleValues?.length) {
        allStatuses = statusParam.possibleValues.map((s: string) =>
          s.toUpperCase(),
        );
        logger.info(
          `Available issue statuses from server: ${allStatuses.join(',')}`,
        );
      } else {
        throw new Error(
          `Webservices list returned no possibleValues for ${statusParamKey}. `
          + `Raw param data: ${JSON.stringify(statusParam)}`,
        );
      }
    } catch (error) {
      // Step 2: Fallback to hardcoded full status list if discovery fails
      allStatuses = isLegacy
        ? ['OPEN', 'REOPENED', 'CONFIRMED', 'RESOLVED', 'CLOSED']
        : [
          'OPEN',
          'CONFIRMED',
          'FALSE_POSITIVE',
          'ACCEPTED',
          'FIXED',
          'IN_SANDBOX',
        ];
      logger.warn(
        `Could not discover statuses from server, using fallback: ${allStatuses.join(',')}`,
      );
      logger.debug(inspect(error, { depth: 3 }));
    }

    // Step 3: Determine which deny-list to use
    const defaultDenyList = isLegacy
      ? SonarqubeResults.DEFAULT_DENY_LIST_LEGACY
      : SonarqubeResults.DEFAULT_DENY_LIST_MODERN;
    let denySet: Set<string>;

    if (this.excludeIssueStatuses) {
      // User-supplied deny-list REPLACES the defaults entirely
      const userExclusions = this.excludeIssueStatuses
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);
      denySet = new Set(userExclusions);

      // Smart nag: compare user list against defaults
      const defaultSet = new Set(defaultDenyList);
      const sameAsDefault = defaultSet.symmetricDifference(denySet).size === 0;

      if (sameAsDefault) {
        logger.info(
          `Exclusion list matches the defaults (${[...defaultSet].join(',')}). `
          + 'You can omit --excludeIssueStatuses unless you want to be explicit.',
        );
      } else {
        logger.warn(
          `Custom status exclusions applied: ${userExclusions.join(',')} `
          + `(replaces defaults: ${defaultDenyList.join(',')}). `
          + 'If this exclusion should be a default, please consider filing an issue at '
          + 'https://github.com/mitre/heimdall2/issues',
        );
      }
    } else {
      // No user override — use defaults
      denySet = new Set(defaultDenyList);
      logger.info(
        `Using default status exclusions: ${defaultDenyList.join(',')}`,
      );
    }

    // Step 4: Filter statuses and log the result
    const excluded = allStatuses.filter(s => denySet.has(s));
    const result = allStatuses.filter(s => !denySet.has(s));

    if (result.length === 0) {
      logger.warn(
        'All statuses were excluded by the deny-list. This will likely return no results. '
        + `Available: ${allStatuses.join(',')} | Excluded: ${excluded.join(',')}`,
      );
    }

    logger.info(
      `Querying with issue statuses: ${result.join(',')} (excluded: ${excluded.join(',')})`,
    );
    return result.join(',');
  }

  async generateHdf<T extends SonarqubeVersion>(
    sonarqubeVersion: string,
  ): Promise<ExecJSON.Execution> {
    const searchResults = await this.getSearchResults<T>(sonarqubeVersion);
    logger.debug(`Got ${searchResults.issues.length} issues`);
    const codeSnippets = await this.getCodeSnippets<T>(searchResults.issues);
    logger.debug(`Got ${codeSnippets.length} code snippets`);
    const rules = await this.getRules<T>(searchResults.issues);
    logger.debug(`Got ${rules.length} rules`);
    const data: Data<T> = {
      branchName: this.branchName,
      organization: this.organization,
      projectKey: this.projectKey,
      pullRequestID: this.pullRequestID,
      search: {
        ...searchResults,
        issues: searchResults.issues.map((issue, index) => ({
          ...issue,
          codeSnippet: codeSnippets[index],
          ruleInformation: rules[index],
        })),
      },
      sonarqubeHost: this.sonarqubeHost,
      sonarqubeVersion,
    };
    return new SonarqubeMapper<T>(data, this.withRaw).toHdf();
  }

  async getCodeSnippets<T extends SonarqubeVersion>(
    issues: SonarqubeVersionMapping[T]['issue'][],
  ): Promise<string[]> {
    const getFullFile = async (component: string): Promise<string> => {
      return this.axiosClient
        .get<string>(`${this.sonarqubeHost}/api/sources/raw`, {
          ...(this.authMethod === AuthenticationMethod.TokenAsUsername && { auth: { password: '', username: this.userToken } }),
          ...(this.authMethod === AuthenticationMethod.BearerToken && { headers: { Authorization: `Bearer ${this.userToken}` } }),
          params: {
            key: component,
            ...(this.branchName && { branch: this.branchName }),
            ...(this.pullRequestID && { pullRequest: this.pullRequestID }),
          },
          responseType: 'text',
        })
        .then(({ data }) => data)
        .catch((error) => {
          this.logAxiosError(error);
          throw new Error(
            `Failed at getting Sonarqube code snippet for ${component}`,
          );
        });
    };
    const getContextualizedSnippet = (
      fullFiles: Record<string, string>,
      component: string,
      startLine: number,
      endLine: number,
      msg?: string,
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
      issues.flatMap(issue =>
        issue.flows.length > 0
          ? issue.flows.flatMap(flow =>
            flow.locations.map(location => location.component),
          )
          : [issue.component],
      ),
    );
    const fullFilePromises = await Promise.all(
      components.map(component => getFullFile(component)),
    );
    const fullFiles = Object.fromEntries(_.zip(components, fullFilePromises));

    const snippets = issues.map((issue) => {
      if (issue.flows.length > 0) {
        return issue.flows
          .flatMap(flow =>
            flow.locations.map(location =>
              getContextualizedSnippet(
                fullFiles,
                location.component,
                location.textRange.startLine,
                location.textRange.endLine,
                location.msg,
              ),
            ),
          )
          .join('\n');
      } else if (issue.textRange) {
        return getContextualizedSnippet(
          fullFiles,
          issue.component,
          issue.textRange.startLine,
          issue.textRange.endLine,
        );
      } else {
        return '';
      }
    });
    return snippets;
  }

  async getRules<T extends SonarqubeVersion>(
    issues: SonarqubeVersionMapping[T]['issue'][],
  ): Promise<Rule<T>[]> {
    const getRule = async (
      rule: string,
      organization?: string,
    ): Promise<Rule<T>> =>
      this.axiosClient
        .get<Rule<T>>(`${this.sonarqubeHost}/api/rules/show`, {
          ...(this.authMethod === AuthenticationMethod.TokenAsUsername && { auth: { password: '', username: this.userToken } }),
          ...(this.authMethod === AuthenticationMethod.BearerToken && { headers: { Authorization: `Bearer ${this.userToken}` } }),
          params: {
            key: rule,
            ...((organization || this.organization) && { organization: organization || this.organization }), // seems to be required for sonarcloud at least
          },
        })
        .then(({ data }) => data)
        .catch((error) => {
          this.logAxiosError(error);
          throw new Error(`Failed at getting Sonarqube rule: ${rule}`);
        });

    const rulesAndOrgs: [string, string | undefined][] = _.uniqWith(
      issues.map(issue => [issue.rule, issue.organization]),
      _.isEqual,
    );
    const fullRulePromises = await Promise.all(
      rulesAndOrgs.map(ruleAndOrg => getRule(...ruleAndOrg)),
    );
    const fullRules = Object.fromEntries(
      _.zip(
        rulesAndOrgs.map(ruleAndOrg => ruleAndOrg.join('\n')),
        fullRulePromises,
      ),
    );

    const rules = issues.map(
      issue => fullRules[[issue.rule, issue.organization].join('\n')],
    );
    return rules;
  }

  async getSearchResults<T extends SonarqubeVersion>(
    sonarqubeVersion: string,
  ): Promise<Search<T>> {
    const UPPER_LIMIT = 10_000; // there is an upper limit of 10000 search results provided for any given search query (i.e. everything aside from the paging information): https://community.sonarsource.com/t/cannot-get-more-than-10000-results-through-web-api/3662
    const discoveredStatuses
      = await this.discoverIssueStatuses(sonarqubeVersion);
    const PAGE_SIZE = 100;

    const createSearch = async (
      component: string,
      page: number,
      pageSize = PAGE_SIZE,
    ) => {
      return this.axiosClient.get<Search<T>>(
        `${this.sonarqubeHost}/api/issues/search`,
        {
          ...(this.authMethod === AuthenticationMethod.TokenAsUsername && { auth: { password: '', username: this.userToken } }),
          ...(this.authMethod === AuthenticationMethod.BearerToken && { headers: { Authorization: `Bearer ${this.userToken}` } }),
          params: {
            [isBeforeSonarqubeVersion(sonarqubeVersion, '10.2.0')
              ? 'componentKeys'
              : 'components']: component,
            ...(isBeforeSonarqubeVersion(sonarqubeVersion, '10.4.0')
              ? { statuses: discoveredStatuses }
              : { issueStatuses: discoveredStatuses }),
            p: page,
            ps: pageSize,
            ...(this.branchName && { branch: this.branchName }),
            ...(this.pullRequestID && { pullRequest: this.pullRequestID }),
          },
        },
      );
    };

    const createComponentSearch = async (
      component: string,
      page: number,
      pageSize = PAGE_SIZE,
    ) => {
      return this.axiosClient.get<Search<T>>(
        `${this.sonarqubeHost}/api/components/tree`,
        {
          ...(this.authMethod === AuthenticationMethod.TokenAsUsername && { auth: { password: '', username: this.userToken } }),
          ...(this.authMethod === AuthenticationMethod.BearerToken && { headers: { Authorization: `Bearer ${this.userToken}` } }),
          params: {
            component: component,
            p: page,
            ps: pageSize,
            strategy: 'children',
            ...(this.branchName && { branch: this.branchName }),
            ...(this.pullRequestID && { pullRequest: this.pullRequestID }),
          },
        },
      );
    };

    // intentionally doing the await in a loop so as to slow down requests a tad bit in order to avoid any rate limit issues
    const collectPagedSearch = async (component: string, sizeCheck = false) => {
      let paging = true;
      let page = 1;
      const results: Search<T> = {
        components: [],
        effortTotal: 0,
        facets: [],
        issues: [],
        paging: { pageIndex: 0, pageSize: 0, total: 0 },
      };
      while (sizeCheck ? page === 1 : paging) {
        console.log(results);
        await createSearch(component, page)
          .then(({ data }) => {
            _.mergeWith(results, data, (objValue, srcValue) =>
              _.isArray(objValue) ? [...objValue, srcValue] : undefined,
            );
            // only need to check if it exceeds the upper limit, if it's less than the upper limit and we request a page that goes past the page total then it just returns fewer results without throwing an error
            paging
              = data.paging.pageIndex * data.paging.pageSize <= data.paging.total;
            page += 1;
          })
          .catch((error) => {
            this.logAxiosError(error);
            throw new Error('Failed at retrieving Sonarqube issues');
          });
        if (page * PAGE_SIZE > UPPER_LIMIT) {
          logger.warn(
            `Exceeded SonarQube cap of ${UPPER_LIMIT} results for findings of or under the ${component} component.  Remaining findings may be truncated.`,
          );
          paging = false;
        }
      }
      results.components = _.uniqBy(results.components, 'key'); // sometimes components will be duplicated if an issue on one page applies to the same component as an issue on another page.  additionally at minimum the top level project will show up in every search result
      return results;
    };

    const collectPagedComponentSearch = async (component: string) => {
      let paging = true;
      let page = 1;
      const results: ComponentSearch = {
        baseComponent: {
          description: 'fake',
          key: 'fake',
          qualifier: 'fake',
          tags: [],
          visibility: 'false',
        },
        components: [],
        paging: { pageIndex: 0, pageSize: 0, total: 0 },
      };
      while (paging) {
        await createComponentSearch(component, page)
          .then(({ data }) => {
            _.mergeWith(results, data, (objValue, srcValue) =>
              _.isArray(objValue) ? [...objValue, srcValue] : undefined,
            );
            paging
              = data.paging.pageIndex * data.paging.pageSize <= data.paging.total;
            page += 1;
          })
          .catch((error) => {
            this.logAxiosError(error);
            throw new Error('Failed at retrieving the list of components');
          });
        if (page * PAGE_SIZE > UPPER_LIMIT) {
          logger.warn(
            `Exceeded SonarQube cap of ${UPPER_LIMIT} results for the search for children of the ${component} component.  Remaining set of components may be truncated.`,
          );
          paging = false;
        }
      }
      return results;
    };

    const results: Search<T> = await collectPagedSearch(this.projectKey, true);
    const queue = [this.projectKey];
    while (queue.length > 0) {
      const component = queue.shift();
      if (component === undefined) {
        // unreachable code since we check that there are items in the queue; however, it helps typescript narrow the type properly
        continue;
      }

      const sizeCheck = await collectPagedSearch(component, true);
      if (sizeCheck.paging.total > UPPER_LIMIT) {
        const componentSearch = await collectPagedComponentSearch(component);
        queue.push(...componentSearch.components.map(c => c.key));
      }

      const componentResults = await collectPagedSearch(component);
      _.mergeWith(results, componentResults, (objValue, srcValue) =>
        _.isArray(objValue) ? [...objValue, srcValue] : objValue,
      );
    }

    results.components = _.uniqBy(results.components, 'key');
    results.issues = _.uniqBy(results.issues, 'key');

    if (results.paging.total === results.issues.length) {
      logger.warn(
        'Alternative search queries were able to retrieve all findings.',
      );
    } else {
      logger.warn(
        `Alternative search queries were not able to retrieve all findings - ${results.paging.total - results.issues.length} findings were not retrieved.`,
      );
    }

    return results;
  }

  logAxiosError(e: AxiosError): void {
    if (e.response) {
      logger.debug('response');
      logger.debug(e.response.status);
      logger.debug(inspect(e.response.data, { depth: 3 }));
    }
    if (e.request) {
      logger.debug('request');
      logger.debug(inspect(e.request, { depth: 3 }));
    }
    if (e.message) {
      logger.debug('message');
      logger.debug('Error', e.message);
    }
  }

  async toHdf(): Promise<ExecJSON.Execution> {
    const sonarqubeVersion = await this.axiosClient
      .get<string>(`${this.sonarqubeHost}/api/server/version`)
      .then(({ data }) => data);
    logger.debug(
      `Generating HDF for ${this.sonarqubeHost} version: ${sonarqubeVersion}`,
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
        `Sonarqube version ${sonarqubeVersion} is not formally supported.  Please create an issue at https://github.com/mitre/heimdall2/issues if something is broken.`,
      );
      return this.generateHdf<SonarqubeVersion.Twenty_five>(sonarqubeVersion);
    }
  }
}

function parseCweTags<T extends SonarqubeVersion>(
  issue: IssueExtensions<T> & SonarqubeVersionMapping[T]['issue'],
): string[] | undefined {
  let searchSpace = '';
  const rule = issue.ruleInformation.rule;
  if ('htmlDesc' in rule) {
    searchSpace += rule.htmlDesc;
  }
  if (rule.descriptionSections) {
    searchSpace += rule.descriptionSections.map(s => s.content).join('');
  }
  const uniqueCwes = _.uniq(searchSpace.match(/cwe-\d{3,7}/giv)); // CWE IDs are embedded inside of the HTML

  if (uniqueCwes.length > 0) {
    return uniqueCwes;
  }
  return undefined;
}

function parseNistTags<T extends SonarqubeVersion>(
  issue: IssueExtensions<T> & SonarqubeVersionMapping[T]['issue'],
): string[] | undefined {
  const uniqueNist = _.uniq(
    [...(parseCweTags<T>(issue) ?? [])
      .flatMap(t => CWE_NIST_MAPPING.nistFilter(t.split('-')[1])), ...(parseOwaspInSysTags<T>(issue) ?? []).flatMap(t =>
      OWASP_NIST_MAPPING.nistFilterNoDefault(t),
    )],
  );

  if (uniqueNist.length > 0) {
    return uniqueNist;
  }

  return ['SA-11']; // Sonarqube is a static code analysis tool so we'll use SA-11 (DEVELOPER SECURITY TESTING AND EVALUATION) to handle all the bugs and code smells as a default for whenever it doesn't have security guidance to give us.  Explicitly not using RA-5 (VULNERABILITY SCANNING) since all of those seem to have guidance associated with them.
}

function parseOwaspInSysTags<T extends SonarqubeVersion>(
  issue: IssueExtensions<T> & SonarqubeVersionMapping[T]['issue'],
): string[] {
  return issue.ruleInformation.rule.sysTags
    .filter(s => s.toLowerCase().startsWith('owasp-'))
    .map(t => t.slice('owasp-'.length).toUpperCase()); // this will just look like 'A3'
}

function parseOwaspTags<T extends SonarqubeVersion>(
  issue: IssueExtensions<T> & SonarqubeVersionMapping[T]['issue'],
): string[] | undefined {
  let searchSpace = '';
  const rule = issue.ruleInformation.rule;
  if ('htmlDesc' in rule) {
    searchSpace += rule.htmlDesc;
  }
  if (rule.descriptionSections) {
    searchSpace += rule.descriptionSections.map(s => s.content).join('');
  }
  const searchSpaceMatches = Array.from(searchSpace.matchAll(/> ?OWASP.*?(?<topCategory>Top .*?A\d\d?)/gv), m => m.groups!.topCategory);
  const sysTagMatches = parseOwaspInSysTags<T>(issue);
  const totalMatches = [...searchSpaceMatches, ...sysTagMatches];

  if (totalMatches.length > 0) {
    return totalMatches;
  }
  return undefined;
}
