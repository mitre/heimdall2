import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {
  NeuVectorScanJson,
  RESTModuleCve,
  RESTScanModule,
  RESTScanRepoReport,
  RESTVulnerability
} from '../types/neuvector-types';
import {DEFAULT_UPDATE_REMEDIATION_NIST_TAGS} from './mappings/CciNistMappingData';

const CWE_NIST_MAPPING = new CweNistMapping();

function cweTags(description: string): string[] | undefined {
  const regex = /CWE-\d{3}/g;
  return description.match(regex) ?? undefined;
}

function nistTags(cweTags: string[] | undefined): string[] {
  const identifiers = cweTags?.map((tag: string) => tag.slice(-3)) ?? [];
  return CWE_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_UPDATE_REMEDIATION_NIST_TAGS
  );
}

function cveIdMatches(cveName: string): (value: RESTModuleCve) => boolean {
  return (cve: RESTModuleCve) => cve.name === cveName;
}

export class NeuVectorMapper extends BaseConverter {
  withRaw: boolean;
  rawData: NeuVectorScanJson;
  getModules: (moduleName: string) => RESTScanModule['source'] | undefined;

  memoizedGetModules(): (
    moduleName: string
  ) => RESTScanModule['source'] | undefined {
    const cache: Record<string, RESTScanModule['source'] | undefined> = {};

    return (moduleName: string) => {
      if (Object.prototype.hasOwnProperty.call(cache, moduleName)) {
        return cache[moduleName];
      }
      cache[moduleName] = (this.data as NeuVectorScanJson).report.modules?.find(
        (value) => value.name === moduleName
      )?.source;
      return cache[moduleName];
    };
  }

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
        name: 'NeuVector Scan',
        title: {
          path: 'report',
          transformer: (data: RESTScanRepoReport) =>
            `${data.registry}/${data.repository}:${data.tag} - Digest: ${data.digest} - Image ID: ${data.image_id}`
        },
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'report.vulnerabilities',
            key: 'id',
            tags: {
              cves: {path: 'cves'},
              cpes: {path: 'cpes'},
              cwe: {
                path: 'description',
                transformer: cweTags
              },
              nist: {
                path: 'description',
                transformer: (description: string) =>
                  nistTags(cweTags(description))
              },
              score: {path: 'score'},
              vectors: {path: 'vectors'},
              vectors_v3: {path: 'vectors_v3'},
              score_v3: {path: 'score_v3'},
              severity: {path: 'severity'},
              source: {
                path: 'package_name',
                transformer: (packageName: string) =>
                  this.getModules(packageName)
              },
              status: {
                path: 'name',
                transformer: (name: string) =>
                  this.rawData.report.modules
                    ?.find((module) => module.cves?.find(cveIdMatches(name)))
                    ?.cves?.find(cveIdMatches(name))?.status
              },
              feed_rating: {path: 'feed_rating'},
              link: {path: 'link'},
              published_timestamp: {path: 'published_timestamp'},
              last_modified_timestamp: {path: 'last_modified_timestamp'},
              in_base_image: {path: 'in_base_image'},
              tags: {
                path: 'tags',
                transformer: (tags: string[]) => JSON.stringify(tags, null, 2)
              },
              envs: {
                path: '$.report.envs',
                transformer: (envs?: string[]) =>
                  envs ? envs.join('\n') : undefined
              },
              cmds: {
                path: '$.report.cmds',
                transformer: (cmds?: string[]) =>
                  cmds ? cmds.join('\n') : undefined
              }
            },
            refs: [],
            source_location: {ref: {path: 'file_name'}},
            title: {
              transformer: (data: RESTVulnerability) =>
                `NeuVector found a vulnerability to ${data.name} in ${data.package_name}/${data.package_version}.`
            },
            id: {
              transformer: (data: RESTVulnerability) =>
                `${data.name}/${data.package_name}/${data.package_version}`
            },
            desc: {path: 'description'},
            impact: {
              transformer: (data: RESTVulnerability) => data.score_v3 / 10
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: '',
                message: {
                  transformer: (data: RESTVulnerability) => {
                    const {package_name, package_version, fixed_version} = data;
                    if (!fixed_version) {
                      return `Vulnerable package ${package_name} is at version ${package_version}. No fixed version available.`;
                    }
                    return `Vulnerable package ${package_name} is at version ${package_version}. Update to fixed version ${fixed_version}.`;
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
      transformer: (
        data: NeuVectorScanJson
      ): Record<string, unknown> & {raw?: NeuVectorScanJson} => {
        return {
          auxiliary_data: [
            {
              name: 'NeuVector',
              data: _.omit([
                'reports.vulnerabilities',
                'reports.cmds',
                'reports.envs',
                'reports.registry',
                'reports.repository',
                'reports.tag',
                'reports.digest',
                'reports.image_id'
              ])
            }
          ],
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
    this.getModules = this.memoizedGetModules();
  }
}
