import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  generateHash,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './utils/global';

// Constants
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3]
]);

const CWE_NIST_MAPPING = new CweNistMapping();

// Transformation Functions
function hashId(vulnerability: unknown): string {
  if (_.get(vulnerability, 'id') === '') {
    return generateHash(_.get(vulnerability, 'summary').toString(), 'md5');
  } else {
    return _.get(vulnerability, 'id') as string;
  }
}
function formatDesc(vulnerability: unknown): string {
  const text = [];
  if (_.has(vulnerability, 'description')) {
    text.push(_.get(vulnerability, 'description').toString());
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
function parseIdentifier(identifier: Record<string, unknown>): string[] {
  const output: string[] = [];
  if (Array.isArray(identifier)) {
    identifier.forEach((element) => {
      if (element.split('CWE-')[1]) {
        output.push(element.split('CWE-')[1]);
      }
    });
  }
  return output;
}
function nistTag(identifier: Record<string, unknown>): string[] {
  const identifiers = parseIdentifier(identifier);
  return CWE_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

// Mappings
export class JfrogXrayMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: ''
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'JFrog Xray Scan',
        version: '',
        title: 'JFrog Xray Scan',
        maintainer: null,
        summary: 'Continuous Security and Universal Artifact Analysis',
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
            path: 'data',
            key: 'id',
            tags: {
              nist: {
                path: 'component_versions.more_details.cves[0].cwe',
                transformer: nistTag
              },
              cweid: { path: 'component_versions.more_details.cves[0].cwe' }
            },
            descriptions: [],
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
            code: '',
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: formatCodeDesc},
                run_time: 0,
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(xrayJson: string) {
    super(JSON.parse(xrayJson), true);
  }
}
