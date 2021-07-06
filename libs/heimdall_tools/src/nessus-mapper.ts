import parser from 'fast-xml-parser';
import {
  ControlResultStatus,
  ExecJSON
} from 'inspecjs/dist/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import { version as HeimdallToolsVersion } from '../package.json';
import { MappedTransform, LookupPath, BaseConverter, generateHash } from './base-converter'
// Constants
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['4', 0.9],
  ['IV', 0.9],
  ['3', 0.7],
  ['III', 0.7],
  ['2', 0.5],
  ['II', 0.5],
  ['1', 0.3],
  ['I', 0.3],
  ['0', 0.0]
]);
// const CWE_NIST_MAPPING_FILE = '../../data/cwe-nist-mapping.csv'
// const CWE_NIST_MAPPING = new CweNistMapping(CWE_NIST_MAPPING_FILE)
// const DEFAULT_NIST_TAG = ['SA-11', 'RA-5']

// Transformation Functions
function hashId(vulnerability: object): string {
  if (_.get(vulnerability, 'id') === '') {
    const hash = generateHash(_.get(vulnerability, 'summary').toString(), 'md5')
    return hash;
  } else {
    return _.get(vulnerability, 'id') as string;
  }
}
function formatDesc(vulnerability: object): string {
  const text = []
  if (_.has(vulnerability, 'description')) {
    text.push(_.get(vulnerability, 'description').toString());
  }
  if (_.has(vulnerability, 'cves')) {
    let re1 = /":/gi;
    let re2 = /,/gi;
    text.push(
      `cves: ${JSON.stringify(_.get(vulnerability, 'cves'))
        .replace(re1, '"=>')
        .replace(re2, ', ')}`
    );
  }
  return text.join('<br>');
}
function impactMapping(severity: string | number): number {
  return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || -1;
}
function formatCodeDesc(vulnerability: object): string {
  let codeDescArray = new Array<string>();
  let re = /,/gi;
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
function parseIdentifier(identifier: string): Array<string> {
  if (identifier.split('CWE-')[1]) {
    return [identifier.split('CWE-')[1]];
  } else {
    return [];
  }
}
// function nistTag(identifier: string): Array<string> {
//   let identifiers = parseIdentifier(identifier)
//   if (identifiers === []) {
//     return DEFAULT_NIST_TAG
//   } else {
//     // let matches = new Array<string>()
//     // identifiers.forEach(element => {
//     //   let key = parseInt(element)
//     //   matches.push(CWE_NIST_MAPPING.data.filter((element, index) => {
//     //     if (element.id = key) {
//     //       return true
//     //     }
//     //   })[0].nistId)
//     // })
//     // return matches
//     return DEFAULT_NIST_TAG
//   }
// }

// Mappings
const mappings: MappedTransform<ExecJSON, LookupPath> = {
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
            nist: { path: 'component_versions.more_details.cves[0].cwe[0]' },
            cweid: {
              path: 'component_versions.more_details.cves[0].cwe[0]',
              transformer: parseIdentifier
            }
          },
          descriptions: [],
          refs: [],
          source_location: {},
          id: { transformer: hashId },
          title: { path: 'summary' },
          desc: {
            path: 'component_versions.more_details',
            transformer: formatDesc
          },
          impact: { path: 'severity', transformer: impactMapping },
          code: '',
          results: [
            {
              status: ControlResultStatus.Failed,
              code_desc: { transformer: formatCodeDesc },
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

export class NessusMapper extends BaseConverter {
  constructor(nessusXml: string) {
    const options = {
      attributeNamePrefix: "",
      textNodeName: "text",
      ignoreAttributes: false

    }
    let burpsJson = parser.parse(nessusXml, options);
    super(burpsJson, mappings, 'issues.exportTime');
  }
}
