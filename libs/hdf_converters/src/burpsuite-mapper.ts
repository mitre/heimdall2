import parser from 'fast-xml-parser';
import * as htmlparser from 'htmlparser2';
import {
  ExecJSON,
} from 'inspecjs'
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json'
import {BaseConverter, LookupPath, MappedTransform} from './base-converter'
import {CweNistMapping} from './mappings/CweNistMapping';
import path from 'path'

// Constant
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['information', 0.3]
]);

const CWE_NIST_MAPPING_FILE = path.resolve(
  __dirname,
  '../data/cwe-nist-mapping.csv'
);
const CWE_NIST_MAPPING = new CweNistMapping(CWE_NIST_MAPPING_FILE);
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5'];

// Transformation Functions
function formatCodeDesc(issue: unknown): string {
  //TODO: Ask if we can put "NOT_PROVIDED" instead of leaving fields blank
  const text = [];
  if (_.has(issue, 'host.ip') && _.has(issue, 'host.text')) {
    text.push(
      `Host: ip: ${_.get(issue, 'host.ip')}, url: ${_.get(issue, 'host.text')}`
    );
  } else {
    text.push('Host: ip: , url: ');
  }
  if (_.has(issue, 'location')) {
    text.push(`Location: ${parseHtml(_.get(issue, 'location'))}`);
  } else {
    text.push('Location: ');
  }
  if (_.has(issue, 'issueDetail')) {
    text.push(`issueDetail: ${parseHtml(_.get(issue, 'issueDetail'))}`);
  }
  if (_.has(issue, 'confidence')) {
    text.push(`confidence: ${parseHtml(_.get(issue, 'confidence'))}`);
  } else {
    text.push('confidence: ');
  }
  return text.join('\n') + '\n';
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
function idToString(id: unknown): string {
  if (typeof id === 'string' || typeof id === 'number') {
    return id.toString();
  } else {
    return '';
  }
}
function formatCweId(input: string): string {
  return parseHtml(input).slice(2, -2).trimLeft();
}
function nistTag(input: string): string[] {
  let cwe = formatCweId(input).split('CWE-');
  cwe.shift();
  cwe = cwe.map((x) => x.split(':')[0]);
  return CWE_NIST_MAPPING.nistFilter(cwe, DEFAULT_NIST_TAG).concat(['Rev_4']);
}

// Mappings
function parseXml(xml: string): Record<string, unknown> {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };
  return parser.parse(xml, options);
}
export class BurpSuiteMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON, LookupPath> = {
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
        name: 'BurpSuite Pro Scan',
        version: {path: 'issues.burpVersion'},
        title: 'BurpSuite Pro Scan',
        maintainer: null,
        summary: 'BurpSuite Pro Scan',
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
            path: 'issues.issue',
            key: 'id',
            id: {path: 'type', transformer: idToString},
            title: {path: 'name'},
            desc: {path: 'issueBackground', transformer: parseHtml},
            impact: {path: 'severity', transformer: impactMapping},
            tags: {
              nist: {
                path: 'vulnerabilityClassifications',
                transformer: nistTag
              },
              cweid: {
                path: 'vulnerabilityClassifications',
                transformer: formatCweId
              },
              confidence: {path: 'confidence'}
            },
            descriptions: [
              {
                data: {path: 'issueBackground', transformer: parseHtml},
                label: 'check'
              },
              {
                data: {path: 'remediationBackground', transformer: parseHtml},
                label: 'fix'
              }
            ],
            refs: [],
            source_location: {},
            code: '',
            results: [
              {
                status: ControlResultStatus.Failed,
                code_desc: {transformer: formatCodeDesc},
                run_time: 0,
                start_time: {path: '$.issues.exportTime'}
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(burpsXml: string) {
    super(parseXml(burpsXml));
  }
  setMappings(customMappings: MappedTransform<ExecJSON, LookupPath>) {
    super.setMappings(customMappings);
  }
}
