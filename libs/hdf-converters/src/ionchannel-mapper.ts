import axios, {AxiosInstance} from 'axios';
import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  ContextualizedDependency,
  Dependency,
  IonChannelAnalysisResponse,
  ScanSummary
} from '../types/ionchannelAnalysis';
import {Project} from '../types/ionchannelProjects';
import {Team} from '../types/ionchannelTeams';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {NIST2CCI} from './mappings/CciNistMapping';
import {DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS} from './mappings/CciNistMappingData';

// Extracts all levels of dependencies from any dependency (including sub-dependencies)
function extractAllDependencies(
  dependency: Dependency
): ContextualizedDependency[] {
  const result: ContextualizedDependency[] = [];
  result.push({
    ...dependency,
    parentDependencies: []
  });
  if (Array.isArray(dependency.dependencies)) {
    dependency.dependencies.forEach((subDependency) => {
      result.push(...extractAllDependencies(subDependency));
    });
  }

  return result;
}

function preprocessIonChannelData(ionchannelData: string) {
  const result = {
    metadata: {},
    scans: {
      vulnerability: [], // Not Implemented yet
      dependency: {
        dependencies: [] as Dependency[],
        contextualizedDependencies: [] as ContextualizedDependency[] // Dependencies with their parent info
      },
      ecosystems: [], // Not Implemented yet
      community: [], // Not Implemented yet
      buildsystems: [], // Not Implemented yet
      virus: [], // Not Implemented yet
      license: [], // Not Implemented yet
      difference: [], // Not Implemented yet
      about_yml: [] // Not Implemented yet
    }
  };
  const parsed = JSON.parse(ionchannelData);
  const scanSummaries = _.get(parsed, 'scan_summaries');

  result.metadata = _.omit(parsed, 'scan_summaries');

  if (!Array.isArray(scanSummaries)) {
    throw new Error(
      `Ion Channel scan_summaries invalid summary data (expecting array, got ${typeof scanSummaries})`
    );
  }

  scanSummaries.forEach((scanSummary: ScanSummary) => {
    switch (scanSummary.name) {
      case 'dependency':
        if (!scanSummary.results.data.dependencies) {
          throw new Error('Dependency scan contains no dependencies array');
        }
        result.scans.dependency.dependencies =
          scanSummary.results.data.dependencies;
        break;
      // We only care about dependencies at the moment
      default:
        break;
    }
  });

  const dependencyGraph: Record<string, ContextualizedDependency> = {};

  // Flatten dependency tree
  result.scans.dependency.dependencies.forEach((topLevelDependency) => {
    const flatDependencies = extractAllDependencies(topLevelDependency);
    flatDependencies.forEach((dependency) => {
      dependencyGraph[`${dependency.org}/${dependency.name}`] = dependency;
    });
  });

  // Associate dependencies with each-other
  Object.entries(dependencyGraph).forEach(([, dependency]) => {
    if (Array.isArray(dependency.dependencies)) {
      dependency.dependencies.forEach((subDependency) => {
        dependencyGraph[
          `${subDependency.org}/${subDependency.name}`
        ].parentDependencies.push(`${dependency.org}/${dependency.name}`);
      });
    }
  });

  Object.entries(dependencyGraph).forEach(([, dependency]) => {
    result.scans.dependency.contextualizedDependencies.push(dependency);
  });

  return result;
}

export class IonChannelAPIMapper {
  apiKey: string;
  projectId?: string;
  teamId?: string;
  analysisId?: string;

  apiClient: AxiosInstance;

  constructor(
    apiKey: string,
    projectId?: string,
    teamId?: string,
    analysisId?: string
  ) {
    this.apiKey = apiKey;
    this.projectId = projectId;
    this.teamId = teamId;
    this.analysisId = analysisId;

    this.apiClient = axios.create();
    this.apiClient.defaults.headers.common['Authorization'] =
      `Bearer ${this.apiKey}`;
    this.apiClient.defaults.headers.common['Accept'] =
      'application/json, text/plain, */*';
  }

  async toHdf(): Promise<ExecJSON.Execution> {
    const analysis = await this.getAnalysis();
    const mapper = new IonChannelMapper(JSON.stringify(analysis.analysis));
    return mapper.toHdf();
  }

  async setTeam(teamName: string) {
    const availableTeams = await this.getTeams();
    const foundTeam = availableTeams.find(
      (team) => team.name.toLowerCase() === teamName.toLowerCase()
    );
    if (!foundTeam) {
      throw new Error(
        `Team ${teamName} not found in available teams: ${availableTeams
          .map((team) => team.name)
          .join(', ')}`
      );
    }
    this.teamId = foundTeam.id;
  }

  async getTeams(): Promise<Team[]> {
    if (!this.apiKey) {
      throw new Error('No API-Key Set');
    }
    return this.apiClient
      .get('https://api.ionchannel.io/v1/teams/getTeams')
      .then(({data}) => data.data);
  }

  async setProject(projectName: string) {
    const availableProjects = await this.getProjects();
    const foundProject = availableProjects.find(
      (project) => project.name.toLowerCase() === projectName.toLowerCase()
    );
    if (!foundProject) {
      throw new Error(
        `Project ${projectName} not found in available projects: ${availableProjects
          .map((project) => project.name)
          .join(', ')}`
      );
    }
    this.projectId = foundProject.id;
    this.analysisId = foundProject.analysis_summary.analysis_id;
  }

  async getProjects(): Promise<Project[]> {
    if (!this.apiKey) {
      throw new Error('No API-Key Defined');
    }
    if (!this.teamId) {
      throw new Error('No Team ID Defined');
    }
    return this.apiClient
      .get('https://api.ionchannel.io/v1/report/getProjects', {
        params: {
          team_id: this.teamId
        }
      })
      .then(({data}) => data.data);
  }

  async getAnalysis(): Promise<IonChannelAnalysisResponse> {
    if (!this.apiKey) {
      throw new Error('No API-Key Defined');
    }
    if (!this.projectId) {
      throw new Error('No Project ID Defined');
    }
    if (!this.teamId) {
      throw new Error('No Team ID Defined');
    }
    if (!this.analysisId) {
      throw new Error('No Analysis ID Defined');
    }
    return this.apiClient
      .get('https://api.ionchannel.io/v1/report/getAnalysis', {
        params: {
          project_id: this.projectId,
          team_id: this.teamId,
          analysis_id: this.analysisId
        }
      })
      .then(({data}) => data.data);
  }
}

export class IonChannelMapper extends BaseConverter {
  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {path: 'metadata.project_id'}
    },
    passthrough: {
      ionchannel_metadata: {
        path: 'metadata'
      }
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'IonChannel SBOM Analysis',
        version: '',
        title: {
          path: 'metadata.source',
          transformer: (source?: string) => `IonChannel Analysis of ${source}`
        },
        maintainer: 'saf@groups.mitre.org',
        summary: '',
        license: null,
        copyright: null,
        copyright_email: null,
        supports: [],
        attributes: [],
        depends: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'scans.dependency.contextualizedDependencies',
            key: 'id',
            tags: {
              transformer: (dependency: Dependency) => {
                return Array.isArray(dependency.dependencies)
                  ? {
                      ..._.omit(dependency, 'dependencies'),
                      nist: DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS,
                      cci: NIST2CCI(
                        DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS
                      ),
                      dependencies: dependency.dependencies.map(
                        (subDependency) => `${subDependency.name}`
                      )
                    }
                  : {
                      ..._.omit(dependency, 'dependencies'),
                      nist: DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS,
                      cci: NIST2CCI(
                        DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS
                      )
                    };
              }
            },
            descriptions: [],
            refs: [],
            source_location: {},
            title: {
              transformer: (dependency: Dependency) => {
                // Specific to Python requirements, commonly called requirements.txt or requirements_dev.txt
                if (
                  dependency.type === 'pypi' &&
                  dependency.package === 'egg' &&
                  dependency.name === '-e'
                ) {
                  return `Python requirements file ${dependency.file}`;
                }

                let title = `Dependency ${dependency.name} `;
                if (dependency.org && dependency.org.toLowerCase() !== 'n/a') {
                  title += `from ${dependency.org} `;
                }
                if (
                  dependency.version &&
                  dependency.version.toLowerCase() !== 'n/a'
                ) {
                  title += `@ ${dependency.version} `;
                }
                if (
                  dependency.requirement &&
                  dependency.requirement.toLowerCase() !== 'n/a'
                ) {
                  title += `(Required ${dependency.requirement}) `;
                }
                return title.trim();
              }
            },
            id: {
              transformer: (dependency: ContextualizedDependency) => {
                return `dependency-${dependency.org}/${dependency.name}`;
              }
            },
            desc: '',
            impact: 0.0,
            code: {
              transformer: (dependency: Dependency) =>
                JSON.stringify(dependency, null, 2)
            },
            results: []
          }
        ],
        sha256: ''
      }
    ]
  };

  constructor(ionchannelJson: string) {
    super(preprocessIonChannelData(ionchannelJson));
  }
}
