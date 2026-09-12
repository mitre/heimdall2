import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {
  DEFAULT_UPDATE_REMEDIATION_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

// For OS-vendor-maintained packages Prisma Cloud passes through the vendor's
// severity string verbatim instead of NVD's, so distro vocabulary reaches the
// report alongside Prisma's own tiers (mitre/heimdall2#8611; see the vendor
// table in Prisma's CVSS-scoring doc). The no-rating values — 'unassigned',
// 'not yet assigned', and Ubuntu's 'untriaged' — take the conservative
// medium, matching dependency-track's 'unassigned' and grype's 'unknown'.
// 'negligible' (Ubuntu: "technically a security problem" but theoretical/no
// real damage) and 'unimportant' (Debian: the problem does not affect the
// shipped binary package — Prisma ranks it even below negligible) are the
// minimal ratings: 0.1 rather than 0.0 because the 0.0 tier is reserved for
// informational non-findings across this codebase, and impact 0 exports as
// Not_Applicable in checklists, hiding a finding the scanner reported.
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['important', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['moderate', 0.5],
  ['unassigned', 0.5],
  ['not yet assigned', 0.5],
  ['untriaged', 0.5],
  ['low', 0.3],
  ['unimportant', 0.1],
  ['negligible', 0.1]
]);

export class TwistlockResults {
  data: Record<string, unknown>;
  withRaw: boolean;
  constructor(twistlockJson: string, withRaw = false) {
    this.data = JSON.parse(twistlockJson);
    this.withRaw = withRaw;

    // Add a wrapper to the data for the repository scan case which doesn't include the `results` key
    if (!_.has(this.data, 'results')) {
      this.data = {results: [this.data]};
    }
  }

  toHdf(): ExecJSON.Execution {
    return new TwistlockMapper(this.data, this.withRaw).toHdf();
  }
}

export class TwistlockMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {path: ['results[0].name', 'results[0].repository']}
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        path: 'results',
        name: 'Twistlock Scan',
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
            pathTransform: (value) => (Array.isArray(value) ? value : []),
            tags: {
              nist: DEFAULT_UPDATE_REMEDIATION_NIST_TAGS,
              cci: getCCIsForNISTTags(DEFAULT_UPDATE_REMEDIATION_NIST_TAGS),
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
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2)
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
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        let resultsData = _.get(data, 'results');
        if (Array.isArray(resultsData)) {
          resultsData = resultsData.map((result: Record<string, unknown>) =>
            _.omit(result, [
              'name',
              'collections',
              'complianceDistribution',
              'vulnerabilities',
              'vulnerabilityDistribution'
            ])
          );
        }
        return {
          auxiliary_data: [
            {
              name: 'Twistlock',
              data: {
                results: resultsData,
                consoleURL: _.get(data, 'consoleURL')
              }
            }
          ],
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(twistlockJson: Record<string, unknown>, withRaw = false) {
    super(twistlockJson, true);
    this.withRaw = withRaw;
  }
}
