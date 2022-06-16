import axios, {AxiosInstance} from 'axios';
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
  issues: Record<string, unknown>;
  dependencyGraph: Record<string, unknown>;
  dependencyChains: Record<string, string[][]>;
};

export class SnykResults {
  data?: Record<string, unknown>[] | SnykDatum[];

  apiInput?: SnykUserInputDatum[];
  usingApi = false;
  apiToken?: string;
  apiVersion?: 1; // can be 1 or (to be implemented) 3
  apiClient?: AxiosInstance;

  constructor(snykJson?: string) {
    if (snykJson !== undefined) {
      this.data = JSON.parse(snykJson);
    }
    if (this.data !== undefined && !Array.isArray(this.data)) {
      this.data = [this.data];
    }
  }

  // api constructor
  static SnykAPI(
    apiToken: string,
    apiVersion: 1 = 1,
    ids?: string[] // should be in the form of organizationId or organizationId:projectId
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

    // TODO: gotta come up with some way to handle ratelimiting properly.  currently it's 2k/min which is a hell of a lot so I'm not too worried for this one, but we should probably try to find/write something to handle this generally for all of our api stuff.  probably gonna make this an issue and not part of this pr.
    ret.apiClient = axios.create();
    ret.apiClient.defaults.headers.common['Content-Type'] =
      'application/json; charset=utf-8';
    ret.apiClient.defaults.headers.common[
      'Authorization'
    ] = `token ${apiToken}`;
    ret.apiClient.defaults.baseURL = `https://snyk.io/api/v${apiVersion}/`;

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
      allpaths.map((path) => path.map((pkg) => _.get(graph[pkg], 'pkgId')))
    );
    return dependencyChains;
  }

  async getDataFromApi() {
    if (this.apiToken === undefined) {
      throw new Error("Can't use the Snyk API without an API token.");
    }

    let organizations: Record<string, unknown>[] = await this.apiClient!.get(
      'orgs'
    ).then(({data: {orgs}}) => orgs);

    if (this.apiInput === undefined) {
      this.apiInput = organizations.map(({id}) => ({
        organization: id as string
      }));
    } else if (this.apiInput.length > 0) {
      organizations = organizations.filter(({id}) =>
        this.apiInput!.map(({organization}) => organization).includes(
          id as string
        )
      );

      if (
        _.difference(
          this.apiInput!.map(({organization}) => organization),
          organizations.map(({id}) => id)
        ).length !== 0
      ) {
        throw new Error(
          `Please make sure that the API token is correct and/or has sufficient permissions since the following expected organizations were not in the data returned by the Snyk API: ${_.difference(
            this.apiInput!.map(({organization}) => organization),
            organizations.map(({id}) => id)
          ).join(', ')}`
        );
      }
    }

    this.data = [];
    await Promise.all(
      this.apiInput.map(
        async (input) =>
          await this.apiClient!.post(`org/${input.organization}/projects`).then(
            async ({data: {projects}}) => {
              const pushToData = async (
                i: SnykUserInputDatum & {project: string},
                organization: Record<string, unknown>,
                project: Record<string, unknown>
              ) => {
                console.log('input', i);
                const issues = _.get(
                  await this.apiClient!.post(
                    `org/${i.organization}/project/${i.project}/aggregated-issues`,
                    {
                      includeDescription: true,
                      includeIntroducedThrough: true,
                      filters: {types: ['vuln']}
                    }
                  ),
                  'data'
                ) as Record<string, unknown>;
                const dependencyGraph = _.get(
                  await this.apiClient!.get(
                    `org/${i.organization}/project/${i.project}/dep-graph`
                  ),
                  'data'
                ) as Record<string, unknown>;
                const packages = (
                  _.get(issues, 'issues') as Record<string, unknown>[]
                )
                  .map(({pkgName, pkgVersions}: Record<string, unknown>) =>
                    (pkgVersions as string[]).map(
                      version => `${pkgName}@${version}` // TODO: template strings break highlighting for me every now and again, but here if i wrap 'version' in parentheses it causes some wild stuff to happen with the subsequent template string.  gotta file a bug report against the plugin
                    )
                  )
                  .flat();
                this.data!.push({
                  ...i,
                  organizationData: organization,
                  projectData: project,
                  issues,
                  dependencyGraph,
                  dependencyChains:
                    (_.get(issues, 'issues') as Record<string, unknown>[])
                      .length === 0
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
                  organizations.find(({id}) => id === input.organization)!,
                  projects.find(
                    ({id}: Record<string, unknown>) => id === input.project
                  )!
                );
              } else {
                const monitoredProjects = projects.filter(
                  ({isMonitored}: Record<string, unknown>) => isMonitored
                );
                for (const project of monitoredProjects) {
                  await pushToData(
                    {...input, project: _.get(project, 'id')},
                    organizations.find(
                      ({id}: Record<string, unknown>) =>
                        id === input.organization
                    )!,
                    project
                  );
                }
              }
            }
          )
      )
    );
  }

  async toHdf(): Promise<ExecJSON.Execution[] | ExecJSON.Execution> {
    let isApi: {apiVersion: 1} | undefined = undefined;
    if (this.usingApi) {
      await this.getDataFromApi();
      isApi = {apiVersion: this.apiVersion!};
    }

    const results: ExecJSON.Execution[] = [];
    this.data?.forEach((element) => {
      const entry = new SnykMapper(element, isApi);
      results.push(entry.toHdf());
    });
    return results.length === 1 ? results[0] : results;
  }
}

export class SnykMapper extends BaseConverter {
  defaultMapping(isApi?: {
    apiVersion: 1;
  }): MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > {
    return {
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion,
        target_id: {
          transformer: (data: Record<string, unknown>): string => {
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
        }
      },
      version: HeimdallToolsVersion,
      statistics: {},
      profiles: [
        {
          name: 'Snyk Scan',
          title: {
            transformer: (data: Record<string, unknown>): string => {
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
              path:
                isApi?.apiVersion === 1 ? 'issues.issues' : 'vulnerabilities',
              key: 'id',
              tags: {
                nist: {
                  path: `${
                    isApi?.apiVersion === 1 ? 'issueData.' : ''
                  }identifiers.CWE`,
                  transformer: nistTag
                },
                cweid: {
                  path: `${
                    isApi?.apiVersion === 1 ? 'issueData.' : ''
                  }identifiers.CWE`,
                  transformer: (input: unknown) => input || []
                },
                cveid: {
                  path: `${
                    isApi?.apiVersion === 1 ? 'issueData.' : ''
                  }identifiers.CVE`,
                  transformer: (input: unknown) => input || []
                },
                ghsaid: {
                  path: `${
                    isApi?.apiVersion === 1 ? 'issueData.' : ''
                  }identifiers.GHSA`,
                  transformer: (input: unknown) => input || []
                },
                exploitMaturity: {
                  path: `${isApi?.apiVersion === 1 ? 'issueData.' : ''}exploit${
                    isApi?.apiVersion === 1 ? 'Maturity' : ''
                  }`
                },
                CVSSv3: {
                  path: `${
                    isApi?.apiVersion === 1 ? 'issueData.' : ''
                  }identifiers.CVSSv3`
                },
                cvssScore: {
                  path: `${
                    isApi?.apiVersion === 1 ? 'issueData.' : ''
                  }identifiers.cvssScore`
                }
              },
              refs: [],
              source_location: {},
              title: {
                path: `${isApi?.apiVersion === 1 ? 'issueData.' : ''}title`
              },
              id: {path: 'id'},
              desc: {
                path: `${
                  isApi?.apiVersion === 1 ? 'issueData.' : ''
                }description`
              },
              impact: {
                path: `${isApi?.apiVersion === 1 ? 'issueData.' : ''}severity`,
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
                raw: _.omit(data, [
                  'organization',
                  'project',
                  'dependencyChains'
                ])
              }
            : {
                snyk_metadata: _.omit(data, ['vulnerabilities'])
              }
      }
    };
  }
  constructor(snykJson: Record<string, unknown>, isApi?: {apiVersion: 1}) {
    super(snykJson);
    this.setMappings(this.defaultMapping(isApi));
  }
}
