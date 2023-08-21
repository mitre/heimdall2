import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  generateHash,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

// Constants
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);

const CWE_PATH = 'component_versions.more_details.cves[0].cwe';

const CWE_NIST_MAPPING = new CweNistMapping();

// Transformation Functions
function hashId(vulnerability: unknown): string {
  if (_.get(vulnerability, 'id') === '') {
    return generateHash(
      (_.get(vulnerability, 'summary') as unknown as string).toString(),
      'md5'
    );
  } else {
    return _.get(vulnerability, 'id') as unknown as string;
  }
}
function formatDesc(vulnerability: unknown): string {
  const text = [];
  if (_.has(vulnerability, 'description')) {
    text.push(
      (_.get(vulnerability, 'description') as unknown as string).toString()
    );
  }
  if (_.has(vulnerability, 'cves')) {
    const re1 = /":/gi;
    const re2 = /,/gi;
    text.push(
      `cves: ${JSON.stringify(_.get(vulnerability, 'cves'))
        .replace(re1, '"=>')
        .replace(re2, ', ')}`
    );
  }
  return text.join('<br>');
}
function formatCodeDesc(vulnerability: unknown): string {
  const codeDescArray: string[] = [];
  const re = /,/gi;
  if (_.has(vulnerability, 'source_comp_id')) {
    codeDescArray.push(
      `source_comp_id : ${_.get(vulnerability, 'source_comp_id')}`
    );
  } else {
    codeDescArray.push('source_comp_id : ');
  }
  if (_.has(vulnerability, 'component_versions.vulnerable_versions')) {
    codeDescArray.push(
      `vulnerable_versions : ${JSON.stringify(
        _.get(vulnerability, 'component_versions.vulnerable_versions')
      )}`
    );
  } else {
    codeDescArray.push('vulnerable_versions : ');
  }
  if (_.has(vulnerability, 'component_versions.fixed_versions')) {
    codeDescArray.push(
      `fixed_versions : ${JSON.stringify(
        _.get(vulnerability, 'component_versions.fixed_versions')
      )}`
    );
  } else {
    codeDescArray.push('fixed_versions : ');
  }
  if (_.has(vulnerability, 'issue_type')) {
    codeDescArray.push(`issue_type : ${_.get(vulnerability, 'issue_type')}`);
  } else {
    codeDescArray.push('issue_type : ');
  }
  if (_.has(vulnerability, 'provider')) {
    codeDescArray.push(`provider : ${_.get(vulnerability, 'provider')}`);
  } else {
    codeDescArray.push('provider : ');
  }
  return codeDescArray.join('\n').replace(re, ', ');
}
function nistTag(identifier: Record<string, unknown>): string[] {
  const identifiers: string[] = [];
  if (Array.isArray(identifier)) {
    identifier.forEach((element) => {
      if (element.split('CWE-')[1]) {
        identifiers.push(element.split('CWE-')[1]);
      }
    });
  }
  return CWE_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

// Mappings
export class JfrogXrayMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: 'JFrog Xray Scan',
        title: 'JFrog Xray Scan',
        summary: 'Continuous Security and Universal Artifact Analysis',
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'data',
            key: 'id',
            tags: {
              cci: {
                path: CWE_PATH,
                transformer: (identifier: Record<string, unknown>) =>
                  getCCIsForNISTTags(nistTag(identifier))
              },
              nist: {
                path: CWE_PATH,
                transformer: nistTag
              },
              cweid: {path: CWE_PATH}
            },
            refs: [],
            source_location: {},
            id: {transformer: hashId},
            title: {path: 'summary'},
            desc: {
              path: 'component_versions.more_details',
              transformer: formatDesc
            },
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
                code_desc: {transformer: formatCodeDesc},
                start_time: ''
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
          auxiliary_data: [
            {
              name: 'JFrog Xray',
              data: _.pick(data, ['total_count'])
            }
          ],
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(xrayJson: string, withRaw = false) {
    super(JSON.parse(xrayJson), true);
    this.withRaw = withRaw;
  }
}
