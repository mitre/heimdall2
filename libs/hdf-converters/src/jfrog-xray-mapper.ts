import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  DEFAULT_PROFILE_FIELDS,
  generateHash,
  impactMapping,
} from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';
import { createHeimdallPassthrough } from './utils/heimdall_metadata';

// Constants
const IMPACT_MAPPING = new Map<string, number>([
  ['high', 0.7],
  ['low', 0.3],
  ['medium', 0.5],
]);

const CWE_PATH = 'component_versions.more_details.cves[0].cwe';

const CWE_NIST_MAPPING = new CweNistMapping();

// Mappings
export class JfrogXrayMapper extends BaseConverter {
  shouldIncludeRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return createHeimdallPassthrough('jfrog', {
          auxiliary_data: [
            {
              data: _.pick(data, ['total_count']),
              name: 'JFrog Xray',
            },
          ],
          ...(this.shouldIncludeRaw && { raw: data }),
        });
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
    },
    profiles: [
      {
        ...DEFAULT_PROFILE_FIELDS,
        controls: [
          {
            code: {
              transformer: (vulnerability: Record<string, unknown>): string => {
                return JSON.stringify(vulnerability, null, 2);
              },
            },
            desc: {
              path: 'component_versions.more_details',
              transformer: formatDesc,
            },
            id: { transformer: hashId },
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING),
            },
            key: 'id',
            path: 'data',
            refs: [],
            results: [
              {
                code_desc: { transformer: formatCodeDesc },
                start_time: '',
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: {},
            tags: {
              cci: {
                path: CWE_PATH,
                transformer: (identifier: Record<string, unknown>) =>
                  getCCIsForNISTTags(nistTag(identifier)),
              },
              cweid: { path: CWE_PATH },
              nist: {
                path: CWE_PATH,
                transformer: nistTag,
              },
            },
            title: { path: 'summary' },
          },
        ],
        name: 'JFrog Xray Scan',
        summary: 'Continuous Security and Universal Artifact Analysis',
        title: 'JFrog Xray Scan',
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(xrayJson: string, shouldIncludeRaw = false) {
    super(JSON.parse(xrayJson), true);
    this.shouldIncludeRaw = shouldIncludeRaw;
  }
}
function formatCodeDesc(vulnerability: unknown): string {
  const codeDescArray: string[] = [];
  const re = /,/gv;
  if (_.has(vulnerability, 'source_comp_id')) {
    codeDescArray.push(
      `source_comp_id : ${String(_.get(vulnerability, 'source_comp_id'))}`,
    );
  } else {
    codeDescArray.push('source_comp_id : ');
  }
  if (_.has(vulnerability, 'component_versions.vulnerable_versions')) {
    codeDescArray.push(
      `vulnerable_versions : ${JSON.stringify(
        _.get(vulnerability, 'component_versions.vulnerable_versions'),
      )}`,
    );
  } else {
    codeDescArray.push('vulnerable_versions : ');
  }
  if (_.has(vulnerability, 'component_versions.fixed_versions')) {
    codeDescArray.push(
      `fixed_versions : ${JSON.stringify(
        _.get(vulnerability, 'component_versions.fixed_versions'),
      )}`,
    );
  } else {
    codeDescArray.push('fixed_versions : ');
  }
  if (_.has(vulnerability, 'issue_type')) {
    codeDescArray.push(`issue_type : ${String(_.get(vulnerability, 'issue_type'))}`);
  } else {
    codeDescArray.push('issue_type : ');
  }
  if (_.has(vulnerability, 'provider')) {
    codeDescArray.push(`provider : ${String(_.get(vulnerability, 'provider'))}`);
  } else {
    codeDescArray.push('provider : ');
  }
  return codeDescArray.join('\n').replaceAll(re, ', ');
}
function formatDesc(vulnerability: unknown): string {
  const text = [];
  if (_.has(vulnerability, 'description')) {
    text.push(
      (_.get(vulnerability, 'description') as unknown as string).toString(),
    );
  }
  if (_.has(vulnerability, 'cves')) {
    const re1 = /":/gv;
    const re2 = /,/gv;
    text.push(
      `cves: ${JSON.stringify(_.get(vulnerability, 'cves'))
        .replaceAll(re1, '"=>')
        .replaceAll(re2, ', ')}`,
    );
  }
  return text.join('<br>');
}
// Transformation Functions
function hashId(vulnerability: unknown): string {
  return _.get(vulnerability, 'id') === ''
    ? generateHash(
      (_.get(vulnerability, 'summary') as unknown as string).toString(),
      'md5',
    )
    : (_.get(vulnerability, 'id') as unknown as string);
}

function nistTag(identifier: Record<string, unknown>): string[] {
  const identifiers: string[] = [];
  if (Array.isArray(identifier)) {
    for (const element of identifier) {
      if (element.split('CWE-', 2)[1]) {
        identifiers.push(element.split('CWE-', 2)[1]);
      }
    }
  }
  return CWE_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  );
}
