import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  ContextualizedDependency,
  Dependency,
  ScanSummary
} from '../types/ionchannel';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT} from './utils/global';

// Extracts all levels of dependencies from any dependency (including sub-dependencies)
function extractAllDependencies(
  dependency: Dependency
): ContextualizedDependency[] {
  const result: ContextualizedDependency[] = [];
  result.push({
    ...dependency,
    parentDependencies: []
  });
  dependency.dependencies.forEach((subDependency) => {
    result.push(...extractAllDependencies(subDependency));
  });

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

  if (Array.isArray(scanSummaries)) {
    scanSummaries.forEach((scanSummary: ScanSummary) => {
      switch (scanSummary.name) {
        case 'dependency':
          if (scanSummary.results.data.dependencies) {
            result.scans.dependency.dependencies =
              scanSummary.results.data.dependencies;
          } else {
            throw new Error('Dependency scan contains no dependencies array');
          }
        // We only care about dependencies at the moment
        default:
          break;
      }
    });
  } else {
    throw new Error(
      `Ion Channel scan_summaries invalid summary data (expecting array, got ${typeof scanSummaries}`
    );
  }

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
    dependency.dependencies.forEach((subDependency) => {
      dependencyGraph[
        `${subDependency.org}/${subDependency.name}`
      ].parentDependencies.push(`${dependency.org}/${dependency.name}`);
    });
  });

  Object.entries(dependencyGraph).forEach(([, dependency]) => {
    result.scans.dependency.contextualizedDependencies.push(dependency);
  });

  return result;
}

export class IonChannelMapper extends BaseConverter {
  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Ion Channel',
      release: HeimdallToolsVersion,
      target_id: {path: 'metadata.project_id'}
    },
    passthrough: {
      path: 'metadata'
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
        summary: {},
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
                return {
                  ..._.omit(dependency, 'dependencies'),
                  nist: DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT,
                  dependencies: dependency.dependencies.map(
                    (subDependency) => `${subDependency.name}`
                  )
                };
              }
            },
            descriptions: [],
            refs: [],
            source_location: {},
            title: {
              transformer: (dependency: Dependency) => {
                return dependency.org
                  ? `Dependency ${dependency.name} from ${dependency.org} @ ${dependency.version} (Required "${dependency.requirement}")`
                  : `Dependency ${dependency.name} @ ${dependency.version} (Required "${dependency.requirement}")`;
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
  setMappings(
    customMappings: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    super.setMappings(customMappings);
  }
}
