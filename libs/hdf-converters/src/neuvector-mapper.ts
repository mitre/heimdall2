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

const CWE_NIST_MAPPING = new CweNistMapping();

function cweTags(description: string): string[] {
  const regex = /CWE-\d{3}/g;
  return description.match(regex)?.flat() || [];
}

function nistTags(cweTags: string[]): string[] {
  const identifiers = cweTags
    .map((tag) => tag.match(/\d{3}/g)?.[0] || [])
    .flat();
  return CWE_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_UPDATE_REMEDIATION_NIST_TAGS
  );
}

function cvssTag(vectors: string): string {
  const regex = /CVSS:(\d+.\d)/;
  const tag = vectors.match(regex)?.[1];
  return tag || '';
}

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);

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
      target_id: null //Insert data
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null //Insert data
    },
    profiles: [
      {
        name: 'Neuvector', //Insert data
        title: null, //Insert data
        version: null, //Insert data
        maintainer: null, //Insert data
        summary: null, //Insert data
        license: null, //Insert data
        copyright: null, //Insert data
        copyright_email: null, //Insert data
        supports: [], //Insert data
        attributes: [], //Insert data
        depends: [], //Insert data
        groups: [], //Insert data
        status: 'loaded', //Insert data
        controls: [
          {
            path: 'report.vulnerabilities',
            key: 'id',
            tags: {
              cve: {path: 'cves'},
              cwe: {
                path: 'description',
                transformer: cweTags
              },
              nist: {
                path: 'description',
                transformer: (description: string) =>
                  nistTags(cweTags(description))
              },
              cvss: {
                path: 'vectors_v3',
                transformer: cvssTag
              },
              severity: {
                path: 'severity'
              },
              source: {
                path: 'package_name',
                transformer: (packageName: string) =>
                  this.getModule(packageName)?.source
              }
            }, //Insert data
            descriptions: [], //Insert data
            refs: [], //Insert data
            source_location: {ref: {path: 'file_name'}}, //Insert data
            title: null, //Insert data
            id: {path: 'name'}, //Insert data
            desc: {path: 'description'}, //Insert data
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING)
            }, //Insert data
            code: null, //Insert data
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed, //Insert data
                code_desc: '', //Insert data
                message: {
                  transformer: (data: Record<string, any>) => {
                    const {package_name, package_version, fixed_version} = data;
                    if (!fixed_version) {
                      return `Vulnerable package ${package_name} is at version ${package_version}. No fixed version available.`;
                    }
                    return `Vulnerable package ${package_name} is at version ${package_version}. Update to fixed version ${fixed_version}.`;
                  }
                }, //Insert data
                run_time: null, //Insert data
                start_time: '' //Insert data
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
    // TODO or to-answer: does it matter that collapseResults is true or false?
    super(rawParams, true);
    this.withRaw = withRaw;
    this.rawData = rawParams;
    this.getModule = this.memoizedGetModule();
  }
}
