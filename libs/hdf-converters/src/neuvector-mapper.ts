import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {DEFAULT_UPDATE_REMEDIATION_NIST_TAGS} from './utils/global';

/* Types are generated with Tygo, from original Golang source code to TypeScript, and tweaked to reflect actual outputted JSON. */
type RESTVulnerability = {
  name: string;
  score: number /* float32 */;
  severity: string;
  vectors: string;
  description: string;
  file_name: string;
  package_name: string;
  package_version: string;
  fixed_version: string;
  link: string;
  score_v3: number /* float32 */;
  vectors_v3: string;
  published_timestamp: number /* int64 */;
  last_modified_timestamp: number /* int64 */;
  cpes?: string[];
  cves?: string[];
  feed_rating: string;
  in_base_image?: boolean;
  tags?: string[];
};

type RESTScanModule = {
  name: string;
  file: string;
  version: string;
  source: string;
  cves?: RESTModuleCve[];
  cpes?: string[];
};

type RESTModuleCve = {
  name: string;
  status: string;
};

type RESTBenchItem = {
  level: string;
  evidence?: string;
  location?: string;
  message: string[];
  group?: string;
} & RESTBenchCheck;

type RESTBenchCheck = {
  test_number: string;
  category: string;
  type: string;
  profile: string;
  scored: boolean;
  automated: boolean;
  description: string;
  remediation: string;
  tags?: string[]; // Tags provide list of compliance that related to the cis test item.
  tags_v2?: Record<string, any /* share.TagDetails */>; // TagsV2 provide compliance details for each compliance tag
};

type RESTScanSecret = {
  type: string; // the secret description
  evidence: string; // found in a cloaked string
  path: string; // file path
  suggestion: string; // Todo:
};

type RESTScanSetIdPerm = {
  type: string; // the set id descriptions
  evidence: string; // file attributes
  path: string; // file path
};

type RESTScanSignatureInfo = {
  verifiers?: string[];
  verification_timestamp: string;
};

type RESTScanReport = {
  vulnerabilities: RESTVulnerability[];
  modules?: RESTScanModule[];
  checks?: RESTBenchItem[];
  secrets?: RESTScanSecret[];
  setid_perms?: RESTScanSetIdPerm[];
  envs?: string[];
  labels?: Record<string, string>;
  cmds?: string[];
  signature_data?: RESTScanSignatureInfo;
};

type RESTScanRepoReport = {
  verdict?: string;
  image_id: string;
  registry: string;
  repository: string;
  tag: string;
  digest: string;
  size: number /* int64 */;
  author: string;
  base_os: string;
  created_at: string;
  cvedb_version: string;
  cvedb_create_time: string;
  layers: RESTScanLayer[];
} & RESTScanReport;

type RESTScanLayer = {
  digest: string;
  cmds: string;
  vulnerabilities: RESTVulnerability[];
  size: number /* int64 */;
};

export type NeuvectorScanJson = {
  report: RESTScanRepoReport;
  error_message: string;
};

enum DockerSecurityBenchCheckResult {
  Pass = 'PASS',
  Warn = 'WARN',
  Note = 'NOTE',
  Info = 'INFO'
}

const CWE_NIST_MAPPING = new CweNistMapping();

function cweTags(description: string): string[] {
  const regex = /CWE-\d{3}/g;
  return description.match(regex)?.flat() || [];
}

function nistTags(cweTags: string[]): string[] {
  const identifiers = cweTags
    .map((tag) => tag.match(/\d{3}/g)?.[0] ?? [])
    .flat();
  return CWE_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_UPDATE_REMEDIATION_NIST_TAGS
  );
}

function cveIdMatches(cveName: string): (value: RESTModuleCve) => boolean {
  return (cve: RESTModuleCve) => cve.name === cveName;
}

export class NeuvectorMapper extends BaseConverter {
  withRaw: boolean;
  rawData: NeuvectorScanJson;
  getModule: (moduleName: string) => RESTScanModule | undefined;

  memoizedGetModule(): (moduleName: string) => RESTScanModule | undefined {
    return (moduleName: string) => {
      return this.rawData.report.modules?.find(
        (value: RESTScanModule) => value.name === moduleName
      );
    };
  }

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: null
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'Neuvector',
        title: null,
        version: null,
        maintainer: null,
        summary: null,
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
            path: 'report.vulnerabilities',
            key: 'id',
            tags: {
              cve: {path: 'name'},
              cwe: {
                path: 'description',
                transformer: cweTags
              },
              nist: {
                path: 'description',
                transformer: (description: string) =>
                  nistTags(cweTags(description))
              },
              // `score` is confirmed to be CVSS v2 in https://github.com/neuvector/scanner/blob/765fb1db2cf678ea6c6d386f3eb0f720311d745a/cvetools/cvesearch.go#L1416
              cvss_v2_score: {path: 'score'},
              cvss_v2_vector: {path: 'vectors'},
              // In the neuvector/scanner dashboard, the CVSS v2 and v3 scores are selectable by a dropdown.
              cvss_v3_vector: {path: 'vectors_v3'},
              cvss_v3_score: {path: 'score_v3'},
              severity: {path: 'severity'},
              source: {
                path: 'package_name',
                transformer: (packageName: string) =>
                  this.getModule(packageName)?.source
              },
              cve_status: {
                path: 'name',
                transformer: (name: string) =>
                  this.rawData.report.modules
                    ?.find((module) => module.cves?.find(cveIdMatches(name)))
                    ?.cves?.find(cveIdMatches(name))?.status
              },
              // Heimdall currently doesn't have a way to display passthrough data, and this information would be useful to view per vulnerability.
              envs: {path: '$.report.envs'},
              cmds: {path: '$.report.cmds'}
            },
            descriptions: [],
            refs: [],
            source_location: {ref: {path: 'file_name'}},
            title: null,
            id: {
              transformer: (data: Record<string, any>) =>
                `${data.name}/${data.package_name}/${data.package_version}`
            },
            desc: {path: 'description'},
            impact: {
              transformer: (data: Record<string, any>) => {
                const score = data.score_v3 ?? data.score;
                return Number((score / 10).toFixed(1));
              }
            },
            code: null,
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: '',
                message: {
                  transformer: (data: Record<string, any>) => {
                    const {package_name, package_version, fixed_version} = data;
                    if (!fixed_version) {
                      return `Vulnerable package ${package_name} is at version ${package_version}. No fixed version available.`;
                    }
                    return `Vulnerable package ${package_name} is at version ${package_version}. Update to fixed version ${fixed_version}.`;
                  }
                },
                // This is almost always going to be the number 0.
                // Looks like Unix epoch timestamps, which are in seconds.
                run_time: {
                  transformer: (data: Record<string, any>) =>
                    data.last_modified_timestamp - data.published_timestamp
                },
                // Unix epoch timestamp, in seconds.
                start_time: {
                  path: 'published_timestamp',
                  transformer: (startTime: number) => `${startTime}`
                }
              }
            ]
          },
          {
            path: 'report.checks',
            key: 'id',
            tags: {
              category: {path: 'category'},
              type: {path: 'type'},
              profile: {path: 'profile'},
              scored: {path: 'scored'},
              automated: {path: 'automated'},
              remediation: {path: 'remediation'}, // This field is always an empty string due to what seems to be a bug with Neuvector's reported JSON, which comes from a copy-pasted test script from docker/docker-security-bench.
              level: {path: 'level'}
            },
            descriptions: [],
            refs: [],
            source_location: {},
            title: {
              path: 'test_number',
              transformer: (testNumber: string) =>
                `Docker Security Benchmark ${testNumber}`
            },
            id: {path: 'test_number'},
            desc: {path: 'description'},
            impact: {
              path: 'level',
              transformer: (level: DockerSecurityBenchCheckResult) =>
                level === DockerSecurityBenchCheckResult.Warn ? 1 : 0
            },
            code: null,
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: '',
                message: {
                  path: 'message',
                  transformer: (message: string[]) => message.join('\n')
                },
                run_time: null,
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, any>): Record<string, unknown> => {
        return {
          auxiliary_data: [{name: '', data: _.omit([])}], //Insert service name and mapped fields to be removed
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(exportJson: string, withRaw = false) {
    const rawParams = JSON.parse(exportJson);
    super(rawParams);
    this.withRaw = withRaw;
    this.rawData = rawParams;
    this.getModule = this.memoizedGetModule();
  }
}
