import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import { version as HeimdallToolsVersion } from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

// Interfaces
interface CweFpfEntry {
  cweId: number,
  name: string
}

// Constants
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['unassigned', 0]
]);
const CWE_NIST_MAPPING = new CweNistMapping();

// Transformation Functions
function numberToString(id: unknown): string {
  if (typeof id === 'string' || typeof id === 'number') {
    return id.toString();
  } else {
    return '';
  }
}

function nistTag(input: number): string[] {
  let cwe = input.toString();
  return CWE_NIST_MAPPING.nistFilter(
    cwe,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

function nistTags(input: number[]): string[] {
  let cwes = input.map((cweId: number) => cweId.toString());
  return CWE_NIST_MAPPING.nistFilter(
    cwes,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

function getVersion(file: any): string {
  return `${_.get(file, 'version')} ${_.get(file, 'meta.version')}`
}

function getTitle(finding: any) {
  const title = _.get(finding, 'vulnerability.title')
  if (title) {
    return `${_.get(finding, 'component.purl')} - ${title}}`
  } else {
    return `${_.get(finding, 'component.purl')}`
  }
}

function getCweIds(cwes: CweFpfEntry[]) {
  if (cwes) {
    return cwes.map(({ cweId }) => cweId)
  } else {
    return []
  }
}

function getCweNames(cwes: CweFpfEntry[]) {
  if (cwes) {
    return cwes.map(({ name }) => name)
  } else {
    return []
  }
}

// function createFindingMapping(fpfFinding: any) {
//   const finding = _.get(fpfFinding, 'vulnerability.cwes', []).reduce((result: any, { cweId, name }: CweFpfEntry, i: number) => {
//     result[`cweid${i}`] = cweId;
//     result[`cweName${i}`] = name;
//     const nistTags = nistTag(cweId);
//     result[`nist${i}`] = nistTags;
//     result[`cci${i}`] = getCCIsForNISTTags(nistTags)
//     return result
//   }, {});

//   const { uuid: componentUuid, name, version, latestVersion } = _.get(fpfFinding, 'component');
//   finding.componentUuid = componentUuid;
//   finding.componentName = name;
//   finding.componentVersion = version;
//   finding.componentLatestVersion = latestVersion;

//   const { uuid: vulnerabilityUuid, source, vulnId, severityRank, cweId, cweName } = _.get(fpfFinding, 'vulnerability');
//   finding.vulnerabilityUuid = vulnerabilityUuid;
//   finding.vulnerabilitySource = source;
//   finding.vulnerabilityVulnId = vulnId;
//   finding.vulnerabilitySeverityRank = numberToString(severityRank);
//   // TODO: deprecated, keep for now
//   finding.vulnerabilityCweId = numberToString(cweId)
//   // TODO: deprecated, keep for now
//   finding.vulnerabilityCweName = cweName;

//   const { state, isSuppressed } = _.get(fpfFinding, 'analysis');
//   finding.analysisState = state
//   finding.analysisIsSuppressed = isSuppressed
//   return finding
// }

export class DependencyTrackMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
      platform: {
        name: { path: 'meta.application' },
        release: { transformer: getVersion },
        target_id: { path: 'meta.baseUrl' }
      },
      version: HeimdallToolsVersion,
      statistics: {},
      profiles: [
        {
          name: { path: 'project.uuid' },
          version: { path: 'project.version' },
          title: { path: 'project.title' },
          summary: { path: 'project.summary' },
          supports: [],
          attributes: [],
          groups: [],
          status: 'loaded',
          controls: [
            {
              path: 'findings',
              key: 'id',
              tags: {
                cweId: { path: 'vulnerability.cwes', transformer: getCweIds },
                cweName: { path: 'vulnerability.cwes', transformer: getCweNames },
                nist: { path: 'vulnerability.cwes', transformer: (cwes: CweFpfEntry[]) => nistTags(getCweIds(cwes)) },
                cci: { path: 'vulnerability.cwes', transformer: (cwes: CweFpfEntry[]) => getCCIsForNISTTags(nistTags(getCweIds(cwes))) },
                componentUuid: { path: 'component.uuid' },
                componentName: { path: 'component.name' },
                componentVersion: { path: 'component.version' },
                componentLatestVersion: { path: 'component.latestVersion' },
                vulnerabilityUuid: { path: 'vulnerability.uuid' },
                vulnerabilitySource: { path: 'vulnerability.source' },
                vulnerabilityVulnId: { path: 'vulnerability.vulnId' },
                vulnerabilitySeverityRank: {
                  path: 'vulnerability.severityRank',
                  transformer: numberToString
                },
                // TODO: deprecated, keep for now
                vulnerabilyCweId: {
                  path: 'vulnerability.cweId',
                  transformer: numberToString
                },
                // TODO: deprecated, keep for now
                vulnerabilyCweName: { path: 'vulnerability.cweName' },
                analysisState: { path: 'analysis.state' },
                analysisIsSuppressed: { path: 'analysis.isSuppressed' }
              },
              refs: [],
              source_location: {},
              title: { transformer: getTitle },
              id: { path: 'matrix' },
              desc: { path: 'vulnerability.description' },
              descriptions: [
                {
                  data: { path: 'vulnerability.description' },
                  label: 'check'
                },
                {
                  data: { path: 'vulnerability.recommendation' },
                  label: 'fix'
                }
              ],
              impact: { path: 'vulnerability.severity', transformer: impactMapping(IMPACT_MAPPING) },
              results: [
                {
                  status: ExecJSON.ControlResultStatus.Failed,
                  code_desc: { path: 'vulnerability.recommendation' },
                  start_time: { path: '$.meta.timestamp' }
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
            ...(this.withRaw && { raw: data })
          };
        }
      }
    };
  constructor(dtJson: string, withRaw = false) {
    super(JSON.parse(dtJson));
    this.withRaw = withRaw;
  }
}
