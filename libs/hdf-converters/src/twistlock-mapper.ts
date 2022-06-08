import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['important', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['moderate', 0.5],
  ['low', 0.3]
]);

//Wrapper may be reused for compliance integration, if not then delete
export class TwistlockResults {
  data: Record<string, unknown>;
  customMapping?: MappedTransform<ExecJSON.Execution, ILookupPath>;
  constructor(twistlockJson: string) {
    this.data = JSON.parse(twistlockJson);
  }

  toHdf(): ExecJSON.Execution[] | ExecJSON.Execution {
    return new TwistlockMapper(this.data).toHdf();
  }
}

export class TwistlockMapper extends BaseConverter {
  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
      ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {path: 'results[0].name'}
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        path: 'results',
        name: 'Twistlock Scan',
        title: {
          transformer: (data: Record<string, unknown>): string => {
            const projectName = _.has(data, 'collections')
              ? `${_.get(data, 'collections[1]')}`
              : 'N/A';
            return `Twistlock Project: ${projectName}`;
          }
        },
        maintainer: null,
        summary: {
          transformer: (data: Record<string, unknown>): string => {
            const vulnerabilityTotal = _.has(data, 'vulnerabilityDistribution')
              ? `${JSON.stringify(
                _.get(data, 'vulnerabilityDistribution.total'))}`
              : 'N/A';
            const complianceTotal = _.has(data, 'complianceDistribution')
              ? `${JSON.stringify(_.get(data, 'complianceDistribution.total'))}`
              : 'N/A';
            return `Package Vulnerability Summary: ${vulnerabilityTotal} Application Compliance Issue Total: ${complianceTotal}`;
          }
        },
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
            path: 'vulnerabilities',
            key: 'id',
            tags: {
              nist: ['SI-2', 'RA-5'],
              cveid: {
                path: 'id',
                transformer: (idValue: string): string[] => {
                  const output: string[] = [];
                  const numbers = idValue.split('-');
                  numbers.shift();
                  output.push(numbers.join('-'));
                  return output;
                }
              }
            },
            descriptions: [],
            refs: [],
            source_location: {},
            title: {path: 'id'},
            id: {path: 'id'},
            desc: {path: 'description'},
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            code: {
              transformer: (vulnerability: Record<string, unknown>): string => {
                return JSON.stringify(
                  _.omit(vulnerability,
                    [
                    'packageName', 
                    'packageVersion',
                    'impactedVersions'
                    ]),
                  null,
                  2
                  );
              }
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {
                  transformer: (data: Record<string, unknown>): string => {
                    const packageName = _.has(data, 'packageName')
                      ? `${JSON.stringify(_.get(data, 'packageName'))}`
                      : 'N/A';
                    const packageVersion = _.has(data, 'packageVersion')
                      ? `${JSON.stringify(_.get(data, 'packageVersion'))}`
                      : 'N/A';
                    const impactedVersions = _.has(data, 'impactedVersions')
                      ? `${JSON.stringify(_.get(data, 'impactedVersions'))}`
                      : 'N/A';
                    return `Package: ${packageName} Version: ${packageVersion} Impacted Versions: ${impactedVersions}`;
                  }
                },
                run_time: 0,
                start_time: {path: 'discoveredDate'}
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      twistlock_metadata: {
        transformer: (
          data: Record<string, unknown>): Record<string, unknown> => {
          return data;
        }
      }
    }
  };
  constructor(twistlockJson: Record<string, unknown>) {
    super(twistlockJson);
  }
}
