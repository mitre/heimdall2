import axios, {AxiosError} from 'axios';
import axiosRetry from 'axios-retry';
import * as _ from 'lodash';
import {coerce, lt} from 'semver';
import {ExecJSON} from 'inspecjs';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {OwaspNistMapping} from './mappings/OwaspNistMapping';
import {getCCIsForNISTTags} from './utils/global';

// default number of retry attempts is 3
axiosRetry(axios, {
  retryDelay: axiosRetry.exponentialDelay,
  onRetry: (retryCount, error, _requestConfig) => {
    console.log(
      `Retry #${retryCount}/3 on ${error.config?.url}${error.request._options.search} due to ${error.code}`
    );
  }
});

// the Sonarqube schema typings are meant to support the four versions out right now (8, 9, 10, and 2025/25).  9 and 25 are supposed to be LTS releases.  8 is currently used by the Sonarcloud deployment though Sonarqube POCs say that it is no longer supported / they do not see many deployments of it.
enum SonarqubeVersion {
  Eight = '8.0.0',
  Nine = '9.0.0',
  Ten = '10.0.0',
  Twenty_five = '25.0.0'
}

// intentionally open ended to support versions less than 8, but it is unlikely that they will be out there based on discussions with Sonar engineers
function isSonarqubeVersionEight(
  version: string
): version is SonarqubeVersion.Eight {
  const nextHigherVersion = SonarqubeVersion.Nine;
  return lt(coerce(version) || nextHigherVersion, nextHigherVersion);
}

function isSonarqubeVersionNine(
  version: string
): version is SonarqubeVersion.Nine {
  const nextHigherVersion = SonarqubeVersion.Ten;
  return lt(coerce(version) || nextHigherVersion, nextHigherVersion);
}

function isSonarqubeVersionTen(
  version: string
): version is SonarqubeVersion.Ten {
  const nextHigherVersion = SonarqubeVersion.Twenty_five;
  return lt(coerce(version) || nextHigherVersion, nextHigherVersion);
}

function isSonarqubeVersionTwenty_five(
  version: string
): version is SonarqubeVersion.Twenty_five {
  const nextHigherVersion = '26.0.0'; // using 26 for now, but I am unsure what the actual next major version will be - this function can be changed once we identify the next version that contains impactful breaking changes
  return lt(coerce(version) || nextHigherVersion, nextHigherVersion);
}

type SonarqubeVersionMapping = {
  [SonarqubeVersion.Eight]: {issue: Issue_8; ruleInformation: Rule_8};
  [SonarqubeVersion.Nine]: {issue: Issue_9; ruleInformation: Rule_9};
  [SonarqubeVersion.Ten]: {issue: Issue_10; ruleInformation: Rule_10};
  [SonarqubeVersion.Twenty_five]: {issue: Issue_10; ruleInformation: Rule_25};
};

type Issue_8 = {
  actions?: string[]; // shows up in api sample responses but not in our locally generated samples
  attr?: {'jira-issue-key'?: string}; // shows up in api sample responses but not in our locally generated samples
  author: string;
  comments?: {
    key: string;
    login: string;
    htmlText: string;
    markdown: string;
    updatable: boolean;
    createdAt: string;
  }[]; // shows up in api sample responses but not in our locally generated samples
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
  fromHotspot?: unknown; // the changelog mentions this attribute but it does not appear in the sonarcloud generated samples
  hash: string;
  key: string;
  line: number;
  message: string;
  messageFormattings?: {start: number; end: number; type: string}[];
  organization?: string;
  project: string;
  projectName?: string;
  resolution?: string; // shows up in api sample responses but not in our locally generated samples; the changelog for the endpoint mentions something about 'resolutions' which might be the same as this endpoint?
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
  transitions?: string[]; // shows up in api sample responses but not in our locally generated samples
  type: string;
  updateDate: string;
};

type Issue_9 = Omit<Issue_8, 'fromHotspot'> & {
  quickFixAvailable?: boolean;
  ruleDescriptionContextKey?: string; // shows up in api sample responses but not in our locally generated samples
};

type Issue_10 = Issue_9 & {
  cleanCodeAttribute: string;
  cleanCodeAttributeCategory: string;
  codeVariants: string[];
  impacts: {severity: string; softwareQuality: string}[];
  issueStatus: string;
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
  }[]; // shows up in api sample responses but not in our locally generated samples
  total?: number; // deprecated as of 9.8
  users?: {login: string; name: string; active: boolean; avatar: string}[]; // shows up in api sample responses but not in our locally generated samples
};

type Rule_8 = {
  createdAt: string;
  debtOverloaded: boolean;
  debtRemFnCoeff?: unknown; // shows up in changelog but not in our locally generated samples
  debtRemFnOffset: string;
  debtRemFnType: string;
  defaultDebtRemFnCoeff?: unknown; // shows up in changelog but not in our locally generated samples
  defaultDebtRemFnOffset: string;
  defaultDebtRemFnType: string;
  defaultRemFnBaseEffort: string;
  defaultRemFnType: string;
  descriptionSections?: {content: string; key: string}[]; // sonarqube changelog says it was added in 9.5 if I'm interpreting "The field 'descriptionSections' has been added to the payload" properly, but sonarcloud (which is v8 nominally) has it too
  effortToFixDescription?: unknown; // shows up in changelog but not in our locally generated samples
  htmlDesc: string;
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
  cleanCodeAttribute: string;
  cleanCodeAttributeCategory: string;
  impacts: {severity: string; softwareQuality: string}[];
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
  return undefined;
}

export class SonarqubeMapper<T extends SonarqubeVersion> extends BaseConverter<
  Data<T>
> {
  // TODO: withraw
  // TODO: flesh out mapping
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
              owasp: {transformer: parseOwaspTags}
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {path: 'codeSnippet'},
                start_time: {path: 'creationDate'}
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
    passthrough: {}
  };

  constructor(public readonly data: Data<T>) {
    super(data, true);
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
    public readonly organization?: string // sometimes the organization parameter is required for the api/rules/show endpoint - we try to grab it from the issue, but this is here to ensure a fallback if necessary
  ) {}

  logAxiosError(e: AxiosError): void {
    // https://axios-http.com/docs/handling_errors - based off of their example as the best way to just surface the error
    if (e.response) {
      console.log('response');
      console.log(e.response.status);
      console.log(e.response.data);
    }
    if (e.request) {
      console.log('request');
      console.log(e.request);
    }
    if (e.message) {
      console.log('message');
      console.log('Error', e.message);
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
            // VULNERABILITY, BUG, CODE_SMELL - enum values as far as I can tell
            // types: 'CODE_SMELL', // TODO: ask if we should keep it as vulnerabilities only or if we should expand to include everything, ex. code smells --- make type a tag in the control and make sure that heimdall can actually let you filter on tag:nameoftag=valueoftag and not just tag:nameoftag; if fixing the filtering takes too long then do three different hdf files for codesmells, vulns, and bugs
            statuses: 'OPEN,REOPENED,CONFIRMED,RESOLVED', // TODO: ask about this set of statuses - like do we want to keep 'resolved' as an active finding if the code author has marked it as being fine?  should we mark it as informational or even n/a?  what other statuses are out there? --- test what happens when using the workflow options in sonarqube and what kind of statuses come out; also test what happens if we resolve the problem - does it not return the issue anymore? if the issue isn't returned anymore, then we can ignore statuses entirely as a filter.  if the issue is returned, then we're going to have to handle the different statuses properly.  also it seems like these statuses might be changing between the major versions, at least 8 and 9
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
          return Promise.reject('Failed at getting Sonarqube issue');
        });
    }
    return results;
  }

  async getCodeSnippet<T extends SonarqubeVersion>(
    issue: SonarqubeVersionMapping[T]['issue']
  ): Promise<string> {
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
            `Failed at getting Sonarqube code snippet for ${component}`
          );
        });
    };
    const applyLineNumber = (snippet: string): string =>
      snippet
        .split('\n')
        .map((l, i) => `${i + 1} ${l}`)
        .join('\n');
    const getContextualizedSnippet = async (
      component: string,
      startLine: number,
      endLine: number,
      msg?: string
    ): Promise<string> => {
      const fullFile = await getFullFile(component);
      const linenumberedFile = applyLineNumber(fullFile);
      const snippet = linenumberedFile
        .split('\n')
        .slice(Math.max(startLine - 3, 0), endLine + 3)
        .join('\n')
        .trim(); // slice wraps around if the start is less than 0 so we want to put a bounds check there to ensure we start at the top of the file; however, if the end is past the end of the array then it just goes until the end of the array so no bounds check is required there
      const location = `${component}:${startLine}-${endLine}\n`;
      const message = msg ? `${msg}\n` : '';
      return `${location}${message}<pre>\n${snippet}\n</pre>`;
    };

    if (issue.flows.length) {
      return Promise.all(
        issue.flows.flatMap((flow) =>
          flow.locations.map((location) =>
            getContextualizedSnippet(
              location.component,
              location.textRange.startLine,
              location.textRange.endLine,
              location.msg
            )
          )
        )
      ).then((contextualizedSnippets) => contextualizedSnippets.join('\n'));
    } else {
      return getContextualizedSnippet(
        issue.component,
        issue.textRange.startLine,
        issue.textRange.endLine
      );
    }
  }

  async getRule<T extends SonarqubeVersion>(
    issue: SonarqubeVersionMapping[T]['issue']
  ): Promise<Rule<T>> {
    return axios
      .get<Rule<T>>(`${this.sonarqubeHost}/api/rules/show`, {
        ...(this.authMethod === AuthenticationMethod.TokenAsUsername && {
          auth: {username: this.userToken, password: ''}
        }),
        ...(this.authMethod === AuthenticationMethod.BearerToken && {
          headers: {Authorization: `Bearer ${this.userToken}`}
        }),
        params: {
          key: issue.rule,
          ...((issue.organization || this.organization) && {
            organization: issue.organization || this.organization
          }) // seems to be required for sonarcloud at least
        }
      })
      .then(({data}) => data)
      .catch((e) => {
        this.logAxiosError(e);
        return Promise.reject('Failed at getting Sonarqube rule');
      });
  }

  async generateHdf<T extends SonarqubeVersion>(
    sonarqubeVersion: string
  ): Promise<ExecJSON.Execution> {
    const searchResults = await this.getSearchResults<T>();
    const codeSnippets = await Promise.all(
      searchResults.issues.map((issue) => this.getCodeSnippet<T>(issue))
    );
    const rules = await Promise.all(
      searchResults.issues.map((issue) => this.getRule<T>(issue))
    );
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
    return new SonarqubeMapper<T>(data).toHdf();
  }

  async toHdf(): Promise<ExecJSON.Execution> {
    const sonarqubeVersion = await axios
      .get<string>(`${this.sonarqubeHost}/api/server/version`)
      .then(({data}) => data);
    console.log(`sonarqubeVersion: ${sonarqubeVersion}`);

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
      console.log(
        `Sonarqube version ${sonarqubeVersion} is not formally supported.  Please create an issue at https://github.com/mitre/heimdall2/issues if something is broken.`
      );
      return this.generateHdf<SonarqubeVersion.Twenty_five>(sonarqubeVersion);
    }
  }
}
