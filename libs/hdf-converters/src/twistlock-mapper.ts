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

export class TwistlockMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {path: 'results[0].name'}
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        path: 'results',
        name: 'Twistlock Scan',
        title: {
          transformer: (data: Record<string, unknown>): string => {
            const projectArr = _.has(data, 'collections')
              ? _.get(data, 'collections')
              : 'N/A';
            const projectName = Array.isArray(projectArr)
              ? projectArr.join(' / ')
              : projectArr;
            return `Twistlock Project: ${projectName}`;
          }
        },
        summary: {
          transformer: (data: Record<string, unknown>): string => {
            const vulnerabilityTotal = _.has(data, 'vulnerabilityDistribution')
              ? `${JSON.stringify(
                  _.get(data, 'vulnerabilityDistribution.total')
                )}`
              : 'N/A';
            const complianceTotal = _.has(data, 'complianceDistribution')
              ? `${JSON.stringify(_.get(data, 'complianceDistribution.total'))}`
              : 'N/A';
            return `Package Vulnerability Summary: ${vulnerabilityTotal} Application Compliance Issue Total: ${complianceTotal}`;
          }
        },
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'vulnerabilities',
            key: 'id',
            tags: {
              nist: ['SI-2', 'RA-5'],
              cci: ['CCI-002605', 'CCI-001643'],
              cveid: {path: 'id'}
            },
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
                return JSON.stringify(vulnerability, null, 2);
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
                    const impactedVersions = _.has(data, 'impactedVersions')
                      ? `${JSON.stringify(_.get(data, 'impactedVersions'))}`
                      : 'N/A';
                    return `Package ${packageName} should be updated to latest version above impacted versions ${impactedVersions}`;
                  }
                },
                message: {
                  transformer: (data: Record<string, unknown>): string => {
                    const packageName = _.has(data, 'packageName')
                      ? `${JSON.stringify(_.get(data, 'packageName'))}`
                      : 'N/A';
                    const packageVersion = _.has(data, 'packageVersion')
                      ? `${JSON.stringify(_.get(data, 'packageVersion'))}`
                      : 'N/A';
                    return `Expected latest version of ${packageName}\nDetected vulnerable version ${packageVersion} of ${packageName}`;
                  }
                },
                start_time: {path: 'discoveredDate'}
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      other_source_tool_data: {
        transformer: (data: Record<string, any>): Record<string, unknown> => {
          data.results[0] = _.omit(data.results[0], [
            'name',
            'collections',
            'complianceDistribution',
            'vulnerabilities',
            'vulnerabilityDistribution'
          ]);
          return data;
        }
      },
      raw: {
        transformer: (
          data: Record<string, unknown>
        ): Record<string, unknown> | string => {
          return this.withRaw ? data : '';
        }
      }
    }
  };
  constructor(twistlockJson: string, withRaw = false) {
    super(JSON.parse(twistlockJson), true);
    this.withRaw = withRaw;
  }
}
