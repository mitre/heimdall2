import { ExecJSON } from 'inspecjs';
import _ from 'lodash';
import type {
  NeuVectorScanJson,
  RESTModuleCve,
  RESTScanModule,
  RESTScanRepoReport,
  RESTVulnerability,
} from '../types/neuvector-types';
import type { ILookupPath, MappedTransform } from './base-converter';
import { BaseConverter } from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import { DEFAULT_UPDATE_REMEDIATION_NIST_TAGS, HeimdallToolsVersion } from './utils/global';

const CWE_NIST_MAPPING = new CweNistMapping();

export class NeuVectorMapper extends BaseConverter {
  getModules: (moduleName: string) => RESTScanModule['source'] | undefined;
  rawData: NeuVectorScanJson;
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (
        data: NeuVectorScanJson,
      ): Record<string, unknown> & { raw?: NeuVectorScanJson } => {
        return {
          auxiliary_data: [
            {
              data: _.omit([
                'reports.vulnerabilities',
                'reports.cmds',
                'reports.envs',
                'reports.registry',
                'reports.repository',
                'reports.tag',
                'reports.digest',
                'reports.image_id',
              ]),
              name: 'NeuVector',
            },
          ],
          ...(this.withRaw && { raw: data }),
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
            desc: { path: 'description' },
            id: {
              transformer: (data: RESTVulnerability) =>
                `${data.name}/${data.package_name}/${data.package_version}`,
            },
            impact: { transformer: (data: RESTVulnerability) => data.score_v3 / 10 },
            key: 'id',
            path: 'report.vulnerabilities',
            refs: [],
            results: [
              {
                code_desc: '',
                message: {
                  transformer: (data: RESTVulnerability) => {
                    const { fixed_version, package_name, package_version } = data;
                    if (!fixed_version) {
                      return `Vulnerable package ${package_name} is at version ${package_version}. No fixed version available.`;
                    }
                    return `Vulnerable package ${package_name} is at version ${package_version}. Update to fixed version ${fixed_version}.`;
                  },
                },
                start_time: '',
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: { ref: { path: 'file_name' } },
            tags: {
              cmds: {
                path: '$.report.cmds',
                transformer: (cmds?: string[]) =>
                  cmds ? cmds.join('\n') : undefined,
              },
              cpes: { path: 'cpes' },
              cves: { path: 'cves' },
              cwe: {
                path: 'description',
                transformer: cweTags,
              },
              envs: {
                path: '$.report.envs',
                transformer: (envs?: string[]) =>
                  envs ? envs.join('\n') : undefined,
              },
              feed_rating: { path: 'feed_rating' },
              in_base_image: { path: 'in_base_image' },
              last_modified_timestamp: { path: 'last_modified_timestamp' },
              link: { path: 'link' },
              nist: {
                path: 'description',
                transformer: (description: string) =>
                  nistTags(cweTags(description)),
              },
              published_timestamp: { path: 'published_timestamp' },
              score: { path: 'score' },
              score_v3: { path: 'score_v3' },
              severity: { path: 'severity' },
              source: {
                path: 'package_name',
                transformer: (packageName: string) =>
                  this.getModules(packageName),
              },
              status: {
                path: 'name',
                transformer: (name: string) =>
                  this.rawData.report.modules
                    ?.find(module => module.cves?.find(cveIdMatches(name)))
                    ?.cves?.find(cveIdMatches(name))?.status,
              },
              tags: {
                path: 'tags',
                transformer: (tags: string[]) => JSON.stringify(tags, null, 2),
              },
              vectors: { path: 'vectors' },
              vectors_v3: { path: 'vectors_v3' },
            },
            title: {
              transformer: (data: RESTVulnerability) =>
                `NeuVector found a vulnerability to ${data.name} in ${data.package_name}/${data.package_version}.`,
            },
          },
        ],
        groups: [],
        name: 'NeuVector Scan',
        sha256: '',
        status: 'loaded',
        supports: [],
        title: {
          path: 'report',
          transformer: (data: RESTScanRepoReport) =>
            `${data.registry}/${data.repository}:${data.tag} - Digest: ${data.digest} - Image ID: ${data.image_id}`,
        },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(exportJson: string, withRaw = false) {
    const rawParams = JSON.parse(exportJson);
    super(rawParams);
    this.withRaw = withRaw;
    this.rawData = rawParams;
    this.getModules = this.memoizedGetModules();
  }

  memoizedGetModules(): (
    moduleName: string,
  ) => RESTScanModule['source'] | undefined {
    const cache: Record<string, RESTScanModule['source'] | undefined> = {};

    return (moduleName: string) => {
      if (Object.hasOwn(cache, moduleName)) {
        return cache[moduleName];
      }
      cache[moduleName] = (this.data as NeuVectorScanJson).report.modules?.find(
        value => value.name === moduleName,
      )?.source;
      return cache[moduleName];
    };
  }
}

function cveIdMatches(cveName: string): (value: RESTModuleCve) => boolean {
  return (cve: RESTModuleCve) => cve.name === cveName;
}

function cweTags(description: string): string[] | undefined {
  const regex = /CWE-\d{3}/gv;
  return description.match(regex) ?? undefined;
}

function nistTags(cweTags: string[] | undefined): string[] {
  const identifiers = cweTags?.map((tag: string) => tag.slice(-3)) ?? [];
  return CWE_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_UPDATE_REMEDIATION_NIST_TAGS,
  );
}
