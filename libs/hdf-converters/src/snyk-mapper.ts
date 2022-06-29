import axios, {AxiosInstance} from 'axios';
import axiosRetry from 'axios-retry';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './utils/global';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);
const CWE_NIST_MAPPING = new CweNistMapping();

function parseIdentifier(identifiers: unknown[] | unknown): string[] {
  const output: string[] = [];
  if (identifiers !== undefined && Array.isArray(identifiers)) {
    identifiers.forEach((element) => {
      const numbers = element.split('-');
      numbers.shift();
      output.push(numbers.join('-'));
    });
    return output;
  } else {
    return [];
  }
}
function nistTag(identifiers: unknown[]): string[] {
  return CWE_NIST_MAPPING.nistFilter(
    parseIdentifier(identifiers),
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

type SnykUserInputDatum = {
  organization: string;
  project?: string;
};

type SnykDatum = SnykUserInputDatum & {
  organizationData: Record<string, unknown>;
  project: string;
  projectData: Record<string, unknown>;
  issues: Record<string, unknown>[];
  dependencyGraph: Record<string, unknown>;
  dependencyChains: Record<string, string[][]>;
};

export class SnykResults {
  data?: Record<string, unknown>[] | SnykDatum[];
  withRaw: boolean;

  apiInput?: SnykUserInputDatum[];
  usingApi = false;
  apiToken?: string;
  apiVersion?: 1; // can be 1 or (to be implemented) 3
  apiClient?: AxiosInstance;

  constructor(snykJson?: string, withRaw = false) {
    if (snykJson !== undefined) {
      this.data = JSON.parse(snykJson);
    }
    if (this.data !== undefined && !Array.isArray(this.data)) {
      this.data = [this.data];
    }
    this.withRaw = withRaw;
  }

  // api constructor
  static SnykAPI(
    apiToken: string,
    apiVersion: 1 = 1,
    ids?: string[], // should be an array with items in the form of organizationId or organizationId:projectId
    withRaw = false
  ): SnykResults {
    const ret = new SnykResults();
    ret.usingApi = true;

    ret.apiToken = apiToken;

    ret.apiVersion = apiVersion;

    ret.apiInput = ids?.map((id) => {
      if (id.includes(':')) {
        const [organization, project] = id.split(':', 2);
        return {organization, project};
      }
      return {organization: id};
    });

    ret.apiClient = axios.create();
    ret.apiClient.defaults.headers.common['Content-Type'] =
      'application/json; charset=utf-8';
    ret.apiClient.defaults.headers.common[
      'Authorization'
    ] = `token ${apiToken}`;
    ret.apiClient.defaults.baseURL = `https://snyk.io/api/v${apiVersion}/`;
    axiosRetry(ret.apiClient, {
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        (_.has(error, 'response.status') &&
          _.get(error, 'response.status') === 429)
    });

    ret.withRaw = withRaw;

    return ret;
  }

  // BFS against the adjacency list representation of the dependency graph of a project in order to get all paths to all the packages with a vuln
  getDependencyChains(
    packages: string[],
    dependencyAdjacencyList: Record<string, unknown>
  ): Record<string, string[][]> {
    const graph = (
      _.get(dependencyAdjacencyList, 'nodes') as Record<string, unknown>[]
    ).reduce(
      (acc, cur) => ({
        ...acc,
        [_.get(cur, 'nodeId') as string]: {
          visited: false,
          pkgId: _.get(cur, 'pkgId'),
          deps: _.get(cur, 'deps')
        }
      }),
      {}
    ); // use object for O(1) access instead of searching through potentially quite a large list repeatedly
    _.set(
      graph[_.get(dependencyAdjacencyList, 'rootNodeId') as string] as Record<
        string,
        unknown
      >,
      'visited',
      true
    );

    let dependencyChains: Record<string, string[][]> = packages.reduce(
      (acc, cur) => ({...acc, [cur]: []}),
      {}
    ); // all paths per package with a vuln

    let path: string[] = [
      _.get(dependencyAdjacencyList, 'rootNodeId') as string
    ];
    const queue: string[][] = [path];

    while (queue.length > 0) {
      path = queue.shift() || []; // make typescript happy - this default value will never be hit due to the check in the while loop
      const currentNode = path[path.length - 1];

      if (packages.includes(currentNode)) {
        _.get(dependencyChains, currentNode).push(path);
      }

      for (const adjacentNode of _.get(graph[currentNode], 'deps').map(
        ({nodeId}: Record<string, string>) => nodeId
      )) {
        if (!_.get(graph[adjacentNode], 'visited')) {
          queue.push([...path, adjacentNode]);
        }
      }
    }

    // convert from nodeId to pkgId
    dependencyChains = _.mapKeys(dependencyChains, (_allpaths, pkg) =>
      _.get(graph[pkg], 'pkgId')
    );
    dependencyChains = _.mapValues(dependencyChains, (allpaths) =>
      allpaths.map((p) => p.map((pkg) => _.get(graph[pkg], 'pkgId')))
    );
    return dependencyChains;
  }

  async getDataFromApi() {
    if (this.apiToken === undefined || this.apiClient === undefined) {
      throw new Error("Can't use the Snyk API without an API token.");
    }

    let organizations: Record<string, unknown>[] = [];
    organizations = await this.apiClient
      .get('orgs')
      .then(({data: {orgs}}) => orgs);

    if (this.apiInput === undefined) {
      this.apiInput = organizations.map(({id}) => ({
        organization: id as string
      }));
    } else {
      organizations = organizations.filter(
        ({id}) =>
          this.apiInput &&
          this.apiInput
            .map(({organization}) => organization)
            .includes(id as string)
      );

      if (
        _.difference(
          this.apiInput.map(({organization}) => organization),
          organizations.map(({id}) => id)
        ).length !== 0
      ) {
        throw new Error(
          `Please make sure that the API token is correct and/or has sufficient permissions since the following expected organizations were not in the data returned by the Snyk API: ${_.difference(
            this.apiInput.map(({organization}) => organization),
            organizations.map(({id}) => id)
          ).join(', ')}`
        );
      }
    }

    this.data = [];
    await Promise.all(
      this.apiInput.map(async (input) =>
        this.apiClient
          ?.post(`org/${input.organization}/projects`)
          .then(async ({data: {projects}}) => {
            const pushToData = async (
              i: SnykUserInputDatum & {project: string},
              organization: Record<string, unknown>,
              project: Record<string, unknown>
            ) => {
              const issues = _(
                await this.apiClient
                  ?.post(
                    `org/${i.organization}/project/${i.project}/aggregated-issues`,
                    {
                      includeDescription: true,
                      includeIntroducedThrough: true,
                      filters: {types: ['vuln']} // nominally this should filter out anything but 'vuln' type issues, but we're still getting 'configuration' type issues so need to do a manual filter
                    }
                  )
                  .catch((error: Record<string, unknown>) => {
                    // on occasion, strange things happen (ex. 403) so just print it out and move on
                    console.log(
                      `Error occured with message "${_.get(
                        error,
                        'message'
                      )}".  Full call data: ${error}`
                    );
                    return {data: {issues: []}};
                  })
              )
                .get('data.issues')
                .filter(
                  ({issueType}: Record<string, unknown>) => issueType === 'vuln'
                ) as Record<string, unknown>[];
              const dependencyGraph = _.get(
                await this.apiClient?.get(
                  `org/${i.organization}/project/${i.project}/dep-graph`
                ),
                'data'
              ) as Record<string, unknown>;
              const packages = issues
                .map(({pkgName, pkgVersions}: Record<string, unknown>) =>
                  (pkgVersions as string[]).map(
                    (version) => `${pkgName}@${version}`
                  )
                )
                .flat();
              console.log(
                // TODO: logger
                'pushed',
                'input',
                i,
                'issues',
                issues,
                'issue count',
                issues.length,
                'packages',
                packages,
                'depgraph',
                dependencyGraph
              );
              this.data?.push({
                ...i,
                organizationData: organization,
                projectData: project,
                issues: issues,
                dependencyGraph,
                dependencyChains:
                  issues.length === 0
                    ? {}
                    : this.getDependencyChains(
                        packages,
                        _.get(dependencyGraph, 'depGraph.graph') as Record<
                          string,
                          unknown
                        >
                      )
              });
            };

            if (input.project) {
              if (
                !projects
                  .map(({id}: Record<string, unknown>) => id)
                  .includes(input.project)
              ) {
                throw new Error(
                  `Project ${input.project} not found in organization ${input.organization}`
                );
              }
              await pushToData(
                input as SnykUserInputDatum & {project: string},
                organizations.find(({id}) => id === input.organization) || {}, // should never hit these default cases since there is extensive pre-checking to make sure that the input aligns with these api calls
                projects.find(
                  ({id}: Record<string, unknown>) => id === input.project
                ) || {}
              );
            } else {
              const monitoredProjects = projects.filter(
                ({isMonitored}: Record<string, unknown>) => isMonitored
              );
              for (const project of monitoredProjects) {
                await pushToData(
                  {...input, project: _.get(project, 'id')},
                  organizations.find(
                    ({id}: Record<string, unknown>) => id === input.organization
                  ) || {},
                  project
                );
              }
            }
          })
      )
    );
  }

  async toHdf(): Promise<ExecJSON.Execution[] | ExecJSON.Execution> {
    let isApi: {apiVersion: 1} | undefined = undefined;
    if (this.usingApi) {
      await this.getDataFromApi();
      if (!this.apiVersion) {
        throw new Error('API version must be specified');
      }
      isApi = {apiVersion: this.apiVersion};
    }

    const results: ExecJSON.Execution[] = [];
    this.data?.forEach((element) => {
      const entry = new SnykMapper(element, isApi);
      results.push(entry.toHdf());
    });
    return results.length === 1 ? results[0] : results;
  }
}

const SNYK_API_ISSUE_DATA_PATH = 'issueData.';

export class SnykMapper extends BaseConverter {
  generateTitle(
    isApi: {apiVersion: 1} | undefined,
    data: Record<string, unknown>
  ): string {
    if (isApi?.apiVersion === 1) {
      return `Snyk Organization: ${_.get(
        data,
        'organizationData.name'
      )} Snyk Project: ${_.get(data, 'projectData.name')}`;
    }
    const projectName = _.has(data, 'projectName')
      ? `Snyk Project: ${_.get(data, 'projectName')} `
      : '';
    return `${projectName}Snyk Path: ${_.get(data, 'path')}`;
  }

  defaultMapping(
    isApi?: {
      apiVersion: 1;
    },
    withRaw?: boolean
  ): MappedTransform<ExecJSON.Execution & {passthrough: unknown}, ILookupPath> {
    return {
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion,
        target_id: {
          transformer: this.generateTitle.bind(this, isApi)
        }
      },
      version: HeimdallToolsVersion,
      statistics: {},
      profiles: [
        {
          name: 'Snyk Scan',
          title: {
            transformer: this.generateTitle.bind(this, isApi)
          },
          ...(!isApi && {
            summary: {
              path: 'summary',
              transformer: (summary: string): string => {
                return `Snyk Summary: ${summary}`;
              }
            }
          }),
          supports: [],
          attributes: [],
          groups: [],
          status: 'loaded',
          controls: [
            {
              path: isApi?.apiVersion === 1 ? 'issues' : 'vulnerabilities',
              key: 'id',
              tags: {
                nist: {
                  path: `${
                    isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                  }identifiers.CWE`,
                  transformer: nistTag
                },
                cweid: {
                  path: `${
                    isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                  }identifiers.CWE`,
                  transformer: (input: unknown) => input || []
                },
                cveid: {
                  path: `${
                    isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                  }identifiers.CVE`,
                  transformer: (input: unknown) => input || []
                },
                ghsaid: {
                  path: `${
                    isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                  }identifiers.GHSA`,
                  transformer: (input: unknown) => input || []
                },
                exploitMaturity: {
                  path: `${
                    isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                  }exploit${isApi?.apiVersion === 1 ? 'Maturity' : ''}`
                },
                CVSSv3: {
                  path: `${
                    isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                  }identifiers.CVSSv3`
                },
                cvssScore: {
                  path: `${
                    isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                  }identifiers.cvssScore`
                }
              },
              refs: [],
              source_location: {},
              title: {
                path: `${
                  isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                }title`
              },
              id: {path: 'id'},
              desc: {
                path: `${
                  isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                }description`,
                transformer: (description: string): string => {
                  return (
                    description
                      .split(/(?:^|\s)## /g)
                      .find((section) => section.startsWith('Overview'))
                      ?.substring('Overview'.length)
                      ?.trim() || description
                  );
                }
              },
              descriptions: [
                {
                  label: 'fix',
                  data: {
                    path: `${
                      isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                    }description`,
                    transformer: (description: string): string => {
                      return (
                        description
                          .split(/(?:^|\s)## /g)
                          .find((section) => section.startsWith('Remediation'))
                          ?.substring('Remediation'.length)
                          ?.trim() || ''
                      );
                    }
                  }
                },
                {
                  label: 'check',
                  data: {
                    path: `${
                      isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                    }description`,
                    transformer: (description: string): string => {
                      return (
                        description
                          .split(/(?:^|\s)## /g)
                          .find((section) => section.startsWith('Details'))
                          ?.substring('Details'.length)
                          ?.trim() || ''
                      );
                    }
                  }
                },
                {
                  label: 'refs',
                  data: {
                    path: `${
                      isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                    }description`,
                    transformer: (description: string): string => {
                      return (
                        description
                          .split(/(?:^|\s)## /g)
                          .find((section) => section.startsWith('References'))
                          ?.substring('References'.length)
                          ?.trim() || ''
                      );
                    }
                  }
                }
              ],
              impact: {
                path: `${
                  isApi?.apiVersion === 1 ? SNYK_API_ISSUE_DATA_PATH : ''
                }severity`,
                transformer: impactMapping(IMPACT_MAPPING)
              },
              code: {
                transformer: (item: Record<string, unknown>): string => {
                  return JSON.stringify(item, null, 2);
                }
              },
              results: [
                {
                  status: ExecJSON.ControlResultStatus.Failed,
                  code_desc: {
                    ...(!isApi && {path: 'from'}),
                    transformer: (input: unknown): string => {
                      let paths = input;
                      if (isApi?.apiVersion === 1) {
                        paths = Object.values(
                          _.pick(
                            _.get(this.unconvertedData, 'dependencyChains'),
                            (_.get(input, 'pkgVersions') as string[]).map(
                              (version) =>
                                `${_.get(input, 'pkgName')}@${version}`
                            )
                          )
                        );
                      }
                      if (Array.isArray(paths) && paths.length > 0) {
                        if (!Array.isArray(paths[0])) {
                          paths = [[paths]];
                        } else if (!Array.isArray(paths[0][0])) {
                          paths = [paths];
                        }
                        return (paths as string[][][]) // versions/multiple paths/specific path
                          .map((path) =>
                            path
                              .map((p) => `From : [ ${p.join(' , ')} ]`)
                              .join('\n')
                          )
                          .join('\n');
                      } else {
                        return '';
                      }
                    }
                  },
                  start_time: ''
                }
              ]
            }
          ],
          sha256: ''
        }
      ],
      passthrough: {
        transformer: (data: Record<string, unknown>): Record<string, unknown> =>
          isApi?.apiVersion === 1
            ? {
                snyk_unmapped_data: _.omit(data, [
                  'issues',
                  'organization',
                  'project',
                  'dependencyChains'
                ]),
                ...(withRaw && {
                  raw: _.omit(data, [
                    'organization',
                    'project',
                    'dependencyChains'
                  ])
                })
              }
            : {
                snyk_unmapped_data: _.omit(data, ['vulnerabilities']),
                ...(withRaw && {raw: data})
              }
      }
    };
  }
  constructor(
    snykJson: Record<string, unknown>,
    isApi?: {apiVersion: 1},
    withRaw = false
  ) {
    super(snykJson);
    this.setMappings(this.defaultMapping(isApi, withRaw));
  }
}
