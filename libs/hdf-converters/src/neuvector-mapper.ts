import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './utils/global';
import {CweNistMapping} from './mappings/CweNistMapping';

const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAGS = ['SI-10', 'RA-5'];

function cweTag(description: string): string[] {
  const regex = /CWE-\d{3}}/g;
  return description.match(regex) || [];
}

function nistTags(cweTags: string[]): string[] {
  return CWE_NIST_MAPPING.nistFilter(cweTags, DEFAULT_NIST_TAGS);
}

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['Critical', 0.9],
  ['High', 0.7],
  ['Medium', 0.5],
  ['Low', 0.3]
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
                transformer: cweTag
              },
              nist: {
                path: 'description',
                transformer: (description: string) =>
                  nistTags(cweTag(description))
              }
            }, //Insert data
            descriptions: [], //Insert data
            refs: [], //Insert data
            source_location: {}, //Insert data
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
                message: null, //Insert data
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
