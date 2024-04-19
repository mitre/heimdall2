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
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

interface ICweEntry {
  cweId: number;
  name: string;
}

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 0.9],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['unassigned', 0]
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
        title: {path: 'project.title'},
        summary: {path: 'project.summary'},
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
              componentVersion: {path: 'component.version'},
              componentLatestVersion: {path: 'component.latestVersion'},
              vulnerabilityUuid: {path: 'vulnerability.uuid'},
              vulnerabilitySource: {path: 'vulnerability.source'},
              vulnerabilityVulnId: {path: 'vulnerability.vulnId'},
              vulnerabilitySeverityRank: {path: 'vulnerability.severityRank'},
              // Schema is deprecating these attributes: cweId, cweName
              vulnerabilityCweId: {path: 'vulnerability.cweId'},
              vulnerabilityCweName: {path: 'vulnerability.cweName'},
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
