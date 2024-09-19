import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  filterString
} from './utils/global';
import {CweNistMapping} from './mappings/CweNistMapping';

const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAGS = ['SI-10', 'RA-5'];

function cweTags(description: string): string[] {
  const regex = /CWE-\d{3}/g;
  return description.match(regex)?.flat() || [];
}

function nistTags(cweTags: string[]): string[] {
  const identifiers = cweTags
    .map((tag) => tag.match(/\d{3}/g)?.[0] || [])
    .flat();
  return CWE_NIST_MAPPING.nistFilter(identifiers, DEFAULT_NIST_TAGS);
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
              cvss: {
                path: 'vectors_v3',
                transformer: cvssTag
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
    super(JSON.parse(exportJson), true);
    this.withRaw = withRaw;
  }
}
