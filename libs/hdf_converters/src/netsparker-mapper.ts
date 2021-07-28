import parser from 'fast-xml-parser';
import * as htmlparser from 'htmlparser2';
import {
  ExecJSON
} from 'inspecjs';
import _ from 'lodash';
import path from 'path';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, LookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {OwaspNistMapping} from './mappings/OwaspNistMapping';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 1.0],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['best_practice', 0.0],
  ['information', 0.0]
]);
const CWE_NIST_MAPPING_FILE = path.resolve(
  __dirname,
  '../data/cwe-nist-mapping.csv'
);
const CWE_NIST_MAPPING = new CweNistMapping(CWE_NIST_MAPPING_FILE);
const OWASP_NIST_MAPPING_FILE = path.resolve(
  __dirname,
  '../data/owasp-nist-mapping.csv'
);
const OWASP_NIST_MAPPING = new OwaspNistMapping(OWASP_NIST_MAPPING_FILE);
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5'];

function parseXml(xml: string): Record<string, unknown> {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };
  return parser.parse(xml, options);
}
function parseHtml(input: unknown): string {
  const textData = new Array<string>();
  const myParser = new htmlparser.Parser({
    ontext(text: string) {
      textData.push(text);
    }
  });
  if (typeof input === 'string') {
    myParser.write(input);
  }
  return textData.join('');
}

function impactMapping(severity: unknown): number {
  if (typeof severity === 'string' || typeof severity === 'number') {
    return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
  } else {
    return 0;
  }
}
function nistTag(classification: Record<string, unknown>): string[] {
  let cweTag = _.get(classification, 'cwe');
  if (!Array.isArray(cweTag)) {
    cweTag = [cweTag];
  }
  let owaspTag = _.get(classification, 'owasp');
  if (!Array.isArray(owaspTag)) {
    owaspTag = [owaspTag];
  }
  const cwe = CWE_NIST_MAPPING.nistFilterNoDefault(cweTag as string[]);
  const owasp = OWASP_NIST_MAPPING.nistFilterNoDefault(owaspTag as string[]);
  const result = cwe.concat(owasp);
  if (result.length !== 0) {
    return result;
  } else {
    return DEFAULT_NIST_TAG;
  }
}
function formatControlDesc(vulnerability: unknown): string {
  const text: string[] = [];
  if (_.has(vulnerability, 'description')) {
    text.push(_.get(vulnerability, 'description'));
  }
  if (
    _.has(vulnerability, 'exploitation-skills') &&
    _.get(vulnerability, 'exploitation-skills') !== ''
  ) {
    text.push(
      `Exploitation-skills: ${_.get(vulnerability, 'exploitation-skills')}`
    );
  }
  if (
    _.has(vulnerability, 'extra-information') &&
    _.get(vulnerability, 'extra-information') !== ''
  ) {
    text.push(
      `Extra-information: ${JSON.stringify(
        _.get(vulnerability, 'extra-information')
      ).replace(/:/gi, '=>')}`
    );
  }
  if (
    _.has(vulnerability, 'classification') &&
    _.get(vulnerability, 'classification') !== ''
  ) {
    text.push(
      `Classification: ${JSON.stringify(
        _.get(vulnerability, 'classification')
      ).replace(/:/gi, '=>')}`
    );
  }
  if (_.has(vulnerability, 'impact') && _.get(vulnerability, 'impact') !== '') {
    text.push(`Impact: ${_.get(vulnerability, 'impact')}`);
  }
  if (
    _.has(vulnerability, 'FirstSeenDate') &&
    _.get(vulnerability, 'FirstSeenDate') !== ''
  ) {
    text.push(`FirstSeenDate: ${_.get(vulnerability, 'FirstSeenDate')}`);
  }
  if (
    _.has(vulnerability, 'LastSeenDate') &&
    _.get(vulnerability, 'LastSeenDate') !== ''
  ) {
    text.push(`LastSeenDate: ${_.get(vulnerability, 'LastSeenDate')}`);
  }
  if (
    _.has(vulnerability, 'certainty') &&
    _.get(vulnerability, 'certainty') !== ''
  ) {
    text.push(`Certainty: ${_.get(vulnerability, 'certainty')}`);
  }
  if (_.has(vulnerability, 'type') && _.get(vulnerability, 'type') !== '') {
    text.push(`Type: ${_.get(vulnerability, 'type')}`);
  }
  if (
    _.has(vulnerability, 'confirmed') &&
    _.get(vulnerability, 'confirmed') !== ''
  ) {
    text.push(`Confirmed: ${_.get(vulnerability, 'confirmed')}`);
  }
  return text.join('<br>');
}
function formatCheck(vulnerability: unknown): string {
  const text: string[] = [];
  if (_.has(vulnerability, 'exploitation-skills')) {
    text.push(
      `Exploitation-skills: ${_.get(vulnerability, 'exploitation-skills')}`
    );
  }
  if (_.has(vulnerability, 'proof-of-concept')) {
    text.push(`Proof-of-concept: ${_.get(vulnerability, 'proof-of-concept')}`);
  }
  return parseHtml(text.join('<br>'));
}
function formatFix(vulnerability: unknown): string {
  const text: string[] = [];
  if (_.has(vulnerability, 'remedial-actions')) {
    text.push(`Remedial-actions: ${_.get(vulnerability, 'remedial-actions')}`);
  }
  if (_.has(vulnerability, 'remedial-procedure')) {
    text.push(
      `Remedial-procedure: ${_.get(vulnerability, 'remedial-procedure')}`
    );
  }
  if (_.has(vulnerability, 'remedy-references')) {
    text.push(
      `Remedy-references: ${_.get(vulnerability, 'remedy-references')}`
    );
  }
  return text.join('<br>');
}
function formatCodeDesc(request: unknown): string {
  const text: string[] = [];
  text.push(`http-request : ${_.get(request, 'content')}`);
  text.push(`method : ${_.get(request, 'method')}`);
  return text.join('\n');
}
function formatMessage(response: unknown): string {
  const text: string[] = [];
  text.push(`http-response : ${_.get(response, 'content')}`);
  text.push(`duration : ${_.get(response, 'duration')}`);
  text.push(`status-code  : ${_.get(response, 'status-code')}`);
  return text.join('\n');
}
export class NetsparkerMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, LookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {path: 'netsparker-enterprise.target.url'}
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'Netsparker Enterprise Scan',
        version: '',
        title: {
          path: 'netsparker-enterprise.target',
          transformer: (input: unknown) => {
            return `Netsparker Enterprise Scan ID: ${_.get(
              input,
              'scan-id'
            )} URL: ${_.get(input, 'url')}`;
          }
        },
        maintainer: null,
        summary: 'Netsparker Enterprise Scan',
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
            path: 'netsparker-enterprise.vulnerabilities.vulnerability',
            key: 'id',
            id: {path: 'LookupId'},
            title: {path: 'name'},
            desc: {transformer: formatControlDesc},
            impact: {path: 'severity', transformer: impactMapping},
            tags: {
              nist: {path: 'classification', transformer: nistTag}
            },
            descriptions: [
              {
                data: {transformer: formatCheck},
                label: 'check'
              },
              {
                data: {transformer: formatFix},
                label: 'fix'
              }
            ],
            refs: [],
            source_location: {},
            code: '',
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {path: 'http-request', transformer: formatCodeDesc},
                message: {path: 'http-response', transformer: formatMessage},
                run_time: 0,
                start_time: {path: '$.netsparker-enterprise.target.initiated'}
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(netsparkerXml: string) {
    super(parseXml(netsparkerXml));
  }
  setMappings(customMappings: MappedTransform<ExecJSON.Execution, LookupPath>) {
    super.setMappings(customMappings);
  }
}
