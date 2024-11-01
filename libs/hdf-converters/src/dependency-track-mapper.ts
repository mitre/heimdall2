import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './utils/global';
import {getCCIsForNISTTags} from './mappings/CciNistMapping';

interface ICweEntry {
  cweId: number;
  name: string;
}

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['info', 0],
  ['unassigned', 0.5]
]);
const CWE_NIST_MAPPING = new CweNistMapping();

function nistTags(input: number[]): string[] {
  const cwes = input.map((cweId: number) => cweId.toString());
  return CWE_NIST_MAPPING.nistFilter(
    cwes,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

function getVersion(file: unknown): string {
  return `${_.get(file, 'version')} ${_.get(file, 'meta.version')}`;
}

function getTitle(finding: unknown) {
  const title = _.get(finding, 'vulnerability.title');
  return `${_.get(finding, 'component.purl')}${title ? ' - ' + title : ''}`;
}

function getCweIds(cwes: ICweEntry[] | undefined) {
  if (!cwes) {
    return [];
  }
  return cwes.map(({cweId}) => cweId);
}

function getCweNames(cwes: ICweEntry[] | undefined) {
  if (!cwes) {
    return [];
  }
  return cwes.map(({name}) => name);
}

export class DependencyTrackMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: {path: 'meta.application'},
      release: {transformer: getVersion},
      target_id: {path: 'meta.baseUrl'}
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: {path: 'project.uuid'},
        version: {path: 'project.version'},
        title: {path: 'project.name'},
        summary: {path: 'project.description'},
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'findings',
            key: 'id',
            tags: {
              // cwes not always present in vulnerability
              cweIds: {path: 'vulnerability.cwes', transformer: getCweIds},
              cweNames: {path: 'vulnerability.cwes', transformer: getCweNames},
              nist: {
                path: 'vulnerability.cwes',
                transformer: (cwes: ICweEntry[]) => nistTags(getCweIds(cwes))
              },
              cci: {
                path: 'vulnerability.cwes',
                transformer: (cwes: ICweEntry[]) =>
                  getCCIsForNISTTags(nistTags(getCweIds(cwes)))
              },
              componentUuid: {path: 'component.uuid'},
              componentName: {path: 'component.name'},
              componentGroup: {path: 'component.group'},
              componentVersion: {path: 'component.version'},
              componentLatestVersion: {path: 'component.latestVersion'},
              componentPurl: {path: 'component.purl'},
              componentCpe: {path: 'component.cpe'},
              componentProject: {path: 'component.project'},
              vulnerabilityUuid: {path: 'vulnerability.uuid'},
              vulnerabilitySource: {path: 'vulnerability.source'},
              vulnerabilityVulnId: {path: 'vulnerability.vulnId'},
              vulnerabilityTitle: {path: 'vulnerability.title'},
              vulnerabilitySubtitle: {path: 'vulnerability.subtitle'},
              vulnerabilityAliases: {
                path: 'vulnerability.aliases',
                transformer: (aliases: Array<Record<string, string>>): string =>
                  JSON.stringify(aliases, null, 2)
              },
              vulnerabilityCvssV2BaseScore: {
                path: 'vulnerability.cvssV2BaseScore'
              },
              vulnerabilityCvssV3BaseScore: {
                path: 'vulnerability.cvssV3BaseScore'
              },
              vulnerabilityOwaspLikelihoodScore: {
                path: 'vulnerability.owaspLikelihoodScore'
              },
              vulnerabilityOwaspTechnicalImpactScore: {
                path: 'vulnerability.owaspTechnicalImpactScore'
              },
              vulnerabilityOwaspBusinessImpactScore: {
                path: 'vulnerability.owaspBusinessImpactScore'
              },
              vulnerabilitySeverityRank: {path: 'vulnerability.severityRank'},
              vulnerabilityEpssScore: {path: 'vulnerability.epssScore'},
              vulnerabilityEpssPercentile: {
                path: 'vulnerability.epssPercentile'
              },
              // Schema is deprecating these attributes: cweId, cweName
              vulnerabilityCweId: {path: 'vulnerability.cweId'},
              vulnerabilityCweName: {path: 'vulnerability.cweName'},
              attributionAnalyzerIdentity: {
                path: 'attribution.analyzerIdentity'
              },
              attributionAttributedOn: {path: 'attribution.attributedOn'},
              attributionAlternateIdentifier: {
                path: 'attribution.alternateIdentifier'
              },
              attributionReferenceUrl: {path: 'attribution.referenceUrl'},
              analysisState: {path: 'analysis.state'},
              analysisIsSuppressed: {path: 'analysis.isSuppressed'}
            },
            refs: [],
            source_location: {},
            title: {transformer: getTitle},
            id: {path: 'matrix'},
            desc: {path: 'vulnerability.description'},
            descriptions: [
              {
                data: {path: 'vulnerability.description'},
                label: 'check'
              },
              {
                data: {path: 'vulnerability.recommendation'},
                label: 'fix'
              }
            ],
            impact: {
              path: 'vulnerability.severity',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            code: {
              transformer: (finding: Record<string, unknown>): string =>
                JSON.stringify(finding, null, 2)
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                // recommendation not always present in vulnerability
                code_desc: {path: 'vulnerability.recommendation'},
                start_time: {path: '$.meta.timestamp'}
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return {
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(dtJson: string, withRaw = false) {
    super(JSON.parse(dtJson));
    this.withRaw = withRaw;
  }
}
