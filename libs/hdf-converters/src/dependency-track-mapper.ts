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
import { CweNistMapping } from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';
import { createHeimdallPassthrough } from './utils/heimdall_metadata';

type ICweEntry = {
  cweId: number;
  name: string;
};

const IMPACT_MAPPING = new Map<string, number>([
  ['critical', 0.9],
  ['high', 0.7],
  ['info', 0],
  ['low', 0.3],
  ['medium', 0.5],
  ['unassigned', 0.5],
]);
const CWE_NIST_MAPPING = new CweNistMapping();

export class DependencyTrackMapper extends BaseConverter {
  shouldIncludeRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return createHeimdallPassthrough('dependencyTrack', { ...(this.shouldIncludeRaw && { raw: data }) });
      },
    },
    platform: {
      name: { path: 'meta.application' },
      release: { transformer: getVersion },
      target_id: { path: 'meta.baseUrl' },
    },
    profiles: [
      {
        ...DEFAULT_PROFILE_FIELDS,
        controls: [
          {
            code: {
              transformer: (finding: Record<string, unknown>): string =>
                JSON.stringify(finding, null, 2),
            },
            desc: { path: 'vulnerability.description' },
            descriptions: [
              {
                data: { path: 'vulnerability.description' },
                label: 'check',
              },
              {
                data: { path: 'vulnerability.recommendation' },
                label: 'fix',
              },
            ],
            id: { path: 'matrix' },
            impact: {
              path: 'vulnerability.severity',
              transformer: impactMapping(IMPACT_MAPPING),
            },
            key: 'id',
            path: 'findings',
            refs: [],
            results: [
              {
                // recommendation not always present in vulnerability
                code_desc: { path: 'vulnerability.recommendation' },
                start_time: { path: '$.meta.timestamp' },
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: {},
            tags: {
              analysisIsSuppressed: { path: 'analysis.isSuppressed' },
              analysisState: { path: 'analysis.state' },
              attributionAlternateIdentifier: { path: 'attribution.alternateIdentifier' },
              attributionAnalyzerIdentity: { path: 'attribution.analyzerIdentity' },
              attributionAttributedOn: { path: 'attribution.attributedOn' },
              attributionReferenceUrl: { path: 'attribution.referenceUrl' },
              cci: {
                path: 'vulnerability.cwes',
                transformer: (cwes: ICweEntry[]) =>
                  getCCIsForNISTTags(nistTags(getCweIds(cwes))),
              },
              componentCpe: { path: 'component.cpe' },
              componentGroup: { path: 'component.group' },
              componentLatestVersion: { path: 'component.latestVersion' },
              componentName: { path: 'component.name' },
              componentProject: { path: 'component.project' },
              componentPurl: { path: 'component.purl' },
              componentUuid: { path: 'component.uuid' },
              componentVersion: { path: 'component.version' },
              // cwes not always present in vulnerability
              cweIds: { path: 'vulnerability.cwes', transformer: getCweIds },
              cweNames: { path: 'vulnerability.cwes', transformer: getCweNames },
              nist: {
                path: 'vulnerability.cwes',
                transformer: (cwes: ICweEntry[]) => nistTags(getCweIds(cwes)),
              },
              vulnerabilityAliases: {
                path: 'vulnerability.aliases',
                transformer: (aliases: Record<string, string>[]): string =>
                  JSON.stringify(aliases, null, 2),
              },
              vulnerabilityCvssV2BaseScore: { path: 'vulnerability.cvssV2BaseScore' },
              vulnerabilityCvssV3BaseScore: { path: 'vulnerability.cvssV3BaseScore' },
              // Schema is deprecating these attributes: cweId, cweName
              vulnerabilityCweId: { path: 'vulnerability.cweId' },
              vulnerabilityCweName: { path: 'vulnerability.cweName' },
              vulnerabilityEpssPercentile: { path: 'vulnerability.epssPercentile' },
              vulnerabilityEpssScore: { path: 'vulnerability.epssScore' },
              vulnerabilityOwaspBusinessImpactScore: { path: 'vulnerability.owaspBusinessImpactScore' },
              vulnerabilityOwaspLikelihoodScore: { path: 'vulnerability.owaspLikelihoodScore' },
              vulnerabilityOwaspTechnicalImpactScore: { path: 'vulnerability.owaspTechnicalImpactScore' },
              vulnerabilitySeverityRank: { path: 'vulnerability.severityRank' },
              vulnerabilitySource: { path: 'vulnerability.source' },
              vulnerabilitySubtitle: { path: 'vulnerability.subtitle' },
              vulnerabilityTitle: { path: 'vulnerability.title' },
              vulnerabilityUuid: { path: 'vulnerability.uuid' },
              vulnerabilityVulnId: { path: 'vulnerability.vulnId' },
            },
            title: { transformer: getTitle },
          },
        ],
        name: { path: 'project.uuid' },
        summary: { path: 'project.description' },
        title: { path: 'project.name' },
        version: { path: 'project.version' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(dtJson: string, shouldIncludeRaw = false) {
    super(JSON.parse(dtJson));
    this.shouldIncludeRaw = shouldIncludeRaw;
  }
}

function getCweIds(cwes: ICweEntry[] | undefined) {
  if (!cwes) {
    return [];
  }
  return cwes.map(({ cweId }) => cweId);
}

function getCweNames(cwes: ICweEntry[] | undefined) {
  if (!cwes) {
    return [];
  }
  return cwes.map(({ name }) => name);
}

function getTitle(finding: unknown) {
  const title = _.get(finding, 'vulnerability.title');
  return `${String(_.get(finding, 'component.purl'))}${title ? ` - ${String(title)}` : ''}`;
}

function getVersion(file: unknown): string {
  return `${_.get(file, 'version')} ${_.get(file, 'meta.version')}`;
}

function nistTags(input: number[]): string[] {
  const cwes = input.map((cweId: number) => cweId.toString());
  return CWE_NIST_MAPPING.nistFilter(
    cwes,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  );
}
