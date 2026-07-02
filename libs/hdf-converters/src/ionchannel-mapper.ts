import type { AxiosInstance } from 'axios';
import axios from 'axios';
import type { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ContextualizedDependency,
  Dependency,
  IonChannelAnalysisResponse,
} from '../types/ionchannelAnalysis';
import type { Project } from '../types/ionchannelProjects';
import type { Team } from '../types/ionchannelTeams';
import type { ILookupPath, MappedTransform } from './base-converter';
import { BaseConverter } from './base-converter';
import {
  DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';
import { createHeimdallPassthrough } from './utils/heimdall_metadata';

export class IonChannelAPIMapper {
  analysisId?: string;
  apiClient: AxiosInstance;
  apiKey: string;
  projectId?: string;

  teamId?: string;

  constructor(
    apiKey: string,
    projectId?: string,
    teamId?: string,
    analysisId?: string,
  ) {
    this.apiKey = apiKey;
    this.projectId = projectId;
    this.teamId = teamId;
    this.analysisId = analysisId;

    this.apiClient = axios.create();
    this.apiClient.defaults.headers.common.Authorization
      = `Bearer ${this.apiKey}`;
    this.apiClient.defaults.headers.common.Accept
      = 'application/json, text/plain, */*';
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
    const { data } = await this.apiClient
      .get('https://api.ionchannel.io/v1/report/getAnalysis', {
        params: {
          analysis_id: this.analysisId,
          project_id: this.projectId,
          team_id: this.teamId,
        },
      });
    return data.data;
  }

  async getProjects(): Promise<Project[]> {
    if (!this.apiKey) {
      throw new Error('No API-Key Defined');
    }
    if (!this.teamId) {
      throw new Error('No Team ID Defined');
    }
    const { data } = await this.apiClient
      .get('https://api.ionchannel.io/v1/report/getProjects', { params: { team_id: this.teamId } });
    return data.data;
  }

  async getTeams(): Promise<Team[]> {
    if (!this.apiKey) {
      throw new Error('No API-Key Set');
    }
    const { data } = await this.apiClient
      .get('https://api.ionchannel.io/v1/teams/getTeams');
    return data.data;
  }

  async setProject(projectName: string) {
    const availableProjects = await this.getProjects();
    const foundProject = availableProjects.find(
      project => project.name.toLowerCase() === projectName.toLowerCase(),
    );
    if (!foundProject) {
      throw new Error(
        `Project ${projectName} not found in available projects: ${availableProjects
          .map(project => project.name)
          .join(', ')}`,
      );
    }
    this.projectId = foundProject.id;
    this.analysisId = foundProject.analysis_summary.analysis_id;
  }

  async setTeam(teamName: string) {
    const availableTeams = await this.getTeams();
    const foundTeam = availableTeams.find(
      team => team.name.toLowerCase() === teamName.toLowerCase(),
    );
    if (!foundTeam) {
      throw new Error(
        `Team ${teamName} not found in available teams: ${availableTeams
          .map(team => team.name)
          .join(', ')}`,
      );
    }
    this.teamId = foundTeam.id;
  }

  async toHdf(): Promise<ExecJSON.Execution> {
    const analysis = await this.getAnalysis();
    const mapper = new IonChannelMapper(JSON.stringify(analysis.analysis));
    return mapper.toHdf();
  }
}

export class IonChannelMapper extends BaseConverter {
  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return createHeimdallPassthrough('ionchannel', { ionchannel_metadata: _.get(data, 'metadata') });
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: { path: 'metadata.project_id' },
    },
    profiles: [
      {
        attributes: [],
        controls: [
          {
            code: {
              transformer: (dependency: Dependency) =>
                JSON.stringify(dependency, null, 2),
            },
            desc: '',
            descriptions: [],
            id: {
              transformer: (dependency: ContextualizedDependency) => {
                return `dependency-${dependency.org}/${dependency.name}`;
              },
            },
            impact: 0,
            key: 'id',
            path: 'scans.dependency.contextualizedDependencies',
            refs: [],
            results: [],
            source_location: {},
            tags: {
              transformer: (dependency: Dependency) => {
                return Array.isArray(dependency.dependencies)
                  ? {
                    ..._.omit(dependency, 'dependencies'),
                    cci: getCCIsForNISTTags(
                      DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS,
                    ),
                    dependencies: dependency.dependencies.map(
                      subDependency => subDependency.name,
                    ),
                    nist: DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS,
                  }
                  : {
                    ..._.omit(dependency, 'dependencies'),
                    cci: getCCIsForNISTTags(
                      DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS,
                    ),
                    nist: DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS,
                  };
              },
            },
            title: {
              transformer: (dependency: Dependency) => {
                // Specific to Python requirements, commonly called requirements.txt or requirements_dev.txt
                if (
                  dependency.type === 'pypi'
                  && dependency.package === 'egg'
                  && dependency.name === '-e'
                ) {
                  return `Python requirements file ${dependency.file}`;
                }

                let title = `Dependency ${dependency.name} `;
                if (dependency.org && dependency.org.toLowerCase() !== 'n/a') {
                  title += `from ${dependency.org} `;
                }
                if (
                  dependency.version
                  && dependency.version.toLowerCase() !== 'n/a'
                ) {
                  title += `@ ${dependency.version} `;
                }
                if (
                  dependency.requirement
                  && dependency.requirement.toLowerCase() !== 'n/a'
                ) {
                  title += `(Required ${dependency.requirement}) `;
                }
                return title.trim();
              },
            },
          },
        ],
        copyright: null,
        copyright_email: null,
        depends: [],
        groups: [],
        license: null,
        maintainer: 'saf@groups.mitre.org',
        name: 'IonChannel SBOM Analysis',
        sha256: '',
        status: 'loaded',
        summary: '',
        supports: [],
        title: {
          path: 'metadata.source',
          transformer: (source?: string) => `IonChannel Analysis of ${source}`,
        },
        version: '',
      },
    ],
    statistics: { duration: null },
    version: HeimdallToolsVersion,
  };

  constructor(ionchannelJson: string) {
    super(preprocessIonChannelData(ionchannelJson));
  }
}

// Extracts all levels of dependencies from any dependency (including sub-dependencies)
function extractAllDependencies(
  dependency: Dependency,
): ContextualizedDependency[] {
  const result: ContextualizedDependency[] = [{
    ...dependency,
    parentDependencies: [],
  }];
  if (Array.isArray(dependency.dependencies)) {
    for (const subDependency of dependency.dependencies) {
      result.push(...extractAllDependencies(subDependency));
    }
  }

  return result;
}

function preprocessIonChannelData(ionchannelData: string) {
  const result = {
    metadata: {},
    scans: {
      about_yml: [], // Not Implemented yet
      buildsystems: [], // Not Implemented yet
      community: [], // Not Implemented yet
      dependency: {
        contextualizedDependencies: [] as ContextualizedDependency[], // Dependencies with their parent info
        dependencies: [] as Dependency[],
      },
      difference: [], // Not Implemented yet
      ecosystems: [], // Not Implemented yet
      license: [], // Not Implemented yet
      virus: [], // Not Implemented yet
      vulnerability: [], // Not Implemented yet
    },
  };
  const parsed = JSON.parse(ionchannelData);
  const scanSummaries = _.get(parsed, 'scan_summaries');

  result.metadata = _.omit(parsed, 'scan_summaries');

  if (!Array.isArray(scanSummaries)) {
    throw new TypeError(
      `Ion Channel scan_summaries invalid summary data (expecting array, got ${typeof scanSummaries})`,
    );
  }

  for (const scanSummary of scanSummaries) {
    switch (scanSummary.name) {
      case 'dependency': {
        if (!scanSummary.results.data.dependencies) {
          throw new Error('Dependency scan contains no dependencies array');
        }
        result.scans.dependency.dependencies
          = scanSummary.results.data.dependencies;
        break;
      }
      // We only care about dependencies at the moment
      default: {
        break;
      }
    }
  }

  const dependencyGraph: Record<string, ContextualizedDependency> = {};

  // Flatten dependency tree
  for (const topLevelDependency of result.scans.dependency.dependencies) {
    const flatDependencies = extractAllDependencies(topLevelDependency);
    for (const dependency of flatDependencies) {
      dependencyGraph[`${dependency.org}/${dependency.name}`] = dependency;
    }
  }

  // Associate dependencies with each-other
  for (const dependency of Object.values(dependencyGraph)) {
    if (Array.isArray(dependency.dependencies)) {
      for (const subDependency of dependency.dependencies) {
        dependencyGraph[
          `${subDependency.org}/${subDependency.name}`
        ].parentDependencies.push(`${dependency.org}/${dependency.name}`);
      }
    }
  }

  for (const dependency of Object.values(dependencyGraph)) {
    result.scans.dependency.contextualizedDependencies.push(dependency);
  }

  return result;
}
