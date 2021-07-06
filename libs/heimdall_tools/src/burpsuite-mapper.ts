import parser from 'fast-xml-parser';
import * as htmlparser from 'htmlparser2';
import {
  ControlDescription,
  ControlResultStatus,
  ExecJSON
} from 'inspecjs/dist/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, LookupPath, MappedTransform} from './base-converter';

// Constant
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['information', 0.3]
]);
const startTime = '';

// const CWE_NIST_MAPPING_FILE = '../../data/cwe-nist-mapping.csv'
// const CWE_NIST_MAPPING = new CweNistMapping(CWE_NIST_MAPPING_FILE)
// const DEFAULT_NIST_TAG = ['SA-11', 'RA-5']

// Transformation Functions
function formatCodeDesc(issue: object): string {
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
function parseHtml(input: string) {
  const textData = new Array<string>();
  const myParser = new htmlparser.Parser({
    ontext(text: string) {
      textData.push(text);
    }
  });
  myParser.write(input);
  return textData.join(' ');
}
function impactMapping(severity: string | number): number {
  return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
}
function formatDesc(input: object): Array<ControlDescription> {
  // let output = []
  // output.push({
  //   data: _.get(input, 'issueBackground'),
  //   label: 'check'
  // })
  // output.push({
  //   data: _.get(input, 'remediationBackground'),
  //   label: 'fix'
  // })
  return [];
}
function getStartTime(_input: string) {
  return BaseConverter.startTime;
}
function idToString(id: number): string {
  return id.toString();
}
function formatCweId(input: string) {
  return parseHtml(input).slice(2, -2);
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
            nist: {path: 'vulnerabilityClassification'},
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
              start_time: {transformer: getStartTime}
            }
          ]
        }
      ],
      sha256: ''
    }
  ]
};

export class BurpSuiteMapper extends BaseConverter {
  constructor(burpsXml: string) {
    const options = {
      attributeNamePrefix: '',
      textNodeName: 'text',
      ignoreAttributes: false
    };
    const burpsJson = parser.parse(burpsXml, options);
    super(burpsJson, mappings, 'issues.exportTime');
  }
}
