import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  DEFAULT_PROFILE_FIELDS,
  impactMapping,
} from './base-converter';
import {
  DEFAULT_UPDATE_REMEDIATION_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';

const IMPACT_MAPPING = new Map<string, number>([
  ['critical', 0.9],
  ['high', 0.7],
  ['important', 0.9],
  ['low', 0.3],
  ['medium', 0.5],
  ['moderate', 0.5],
]);

export class TwistlockMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        let resultsData = _.get(data, 'results');
        if (Array.isArray(resultsData)) {
          resultsData = resultsData.map((result: Record<string, unknown>) =>
            _.omit(result, [
              'name',
              'collections',
              'complianceDistribution',
              'vulnerabilities',
              'vulnerabilityDistribution',
            ]),
          );
        }
        return {
          auxiliary_data: [
            {
              data: {
                consoleURL: _.get(data, 'consoleURL'),
                results: resultsData,
              },
              name: 'Twistlock',
            },
          ],
          ...(this.withRaw && { raw: data }),
        };
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: { path: ['results[0].name', 'results[0].repository'] },
    },
    profiles: [
      {
        ...DEFAULT_PROFILE_FIELDS,
        controls: [
          {
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2),
            },
            desc: { path: 'description' },
            id: { path: 'id' },
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING),
            },
            key: 'id',
            path: 'vulnerabilities',
            pathTransform: value => (Array.isArray(value) ? value : []),
            refs: [],
            results: [
              {
                code_desc: {
                  transformer: (data: Record<string, unknown>): string => {
                    const packageName = _.has(data, 'packageName')
                      ? `${JSON.stringify(_.get(data, 'packageName'))}`
                      : 'N/A';
                    const impactedVersions = _.has(data, 'impactedVersions')
                      ? `${JSON.stringify(_.get(data, 'impactedVersions'))}`
                      : 'N/A';
                    return `Package ${packageName} should be updated to latest version above impacted versions ${impactedVersions}`;
                  },
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
                  },
                },
                start_time: { path: 'discoveredDate' },
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: {},
            tags: {
              cci: getCCIsForNISTTags(DEFAULT_UPDATE_REMEDIATION_NIST_TAGS),
              cveid: { path: 'id' },
              nist: DEFAULT_UPDATE_REMEDIATION_NIST_TAGS,
            },
            title: { path: 'id' },
          },
        ],
        name: 'Twistlock Scan',
        path: 'results',
        summary: {
          transformer: (data: Record<string, unknown>): string => {
            const vulnerabilityTotal = _.has(data, 'vulnerabilityDistribution')
              ? `${JSON.stringify(
                _.get(data, 'vulnerabilityDistribution.total'),
              )}`
              : 'N/A';
            const complianceTotal = _.has(data, 'complianceDistribution')
              ? `${JSON.stringify(_.get(data, 'complianceDistribution.total'))}`
              : 'N/A';
            return `Package Vulnerability Summary: ${vulnerabilityTotal} Application Compliance Issue Total: ${complianceTotal}`;
          },
        },
        title: {
          transformer: (data: Record<string, unknown>): string => {
            let projectArr: unknown = 'N/A';
            if (_.has(data, 'collections')) {
              projectArr = _.get(data, 'collections');
            }
            if (_.has(data, 'repository')) {
              projectArr = _.get(data, 'repository');
            }
            const projectName = Array.isArray(projectArr)
              ? projectArr.join(' / ')
              : projectArr;
            return `Twistlock Project: ${projectName}`;
          },
        },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(twistlockJson: Record<string, unknown>, withRaw = false) {
    super(twistlockJson, true);
    this.withRaw = withRaw;
  }
}

export class TwistlockResults {
  data: Record<string, unknown>;
  withRaw: boolean;
  constructor(twistlockJson: string, withRaw = false) {
    this.data = JSON.parse(twistlockJson);
    this.withRaw = withRaw;

    // Add a wrapper to the data for the repository scan case which doesn't include the `results` key
    if (!_.has(this.data, 'results')) {
      this.data = { results: [this.data] };
    }
  }

  toHdf(): ExecJSON.Execution {
    return new TwistlockMapper(this.data, this.withRaw).toHdf();
  }
}
