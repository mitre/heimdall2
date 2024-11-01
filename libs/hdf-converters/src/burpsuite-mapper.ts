import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform,
  parseHtml,
  parseXml
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './utils/global';
import {getCCIsForNISTTags} from './mappings/CciNistMapping';

// Constant
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['information', 0.3]
]);
const NAME = 'BurpSuite Pro Scan';
const CWE_NIST_MAPPING = new CweNistMapping();

// Transformation Functions
function formatCodeDesc(issue: unknown): string {
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
function idToString(id: unknown): string {
  if (typeof id === 'string' || typeof id === 'number') {
    return id.toString();
  } else {
    return '';
  }
}
function formatCweId(input: string): string {
  return parseHtml(input).slice(1, -1).trimStart();
}

function nistTag(input: string): string[] {
  let cwe = formatCweId(input).split('CWE-');
  cwe.shift();
  cwe = cwe.map((x) => x.split(':')[0]);
  return CWE_NIST_MAPPING.nistFilter(
    cwe,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

export class BurpSuiteMapper extends BaseConverter {
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
        name: NAME,
        version: {path: 'issues.burpVersion'},
        title: NAME,
        summary: NAME,
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'issues.issue',
            key: 'id',
            tags: {
              nist: {
                path: 'vulnerabilityClassifications',
                transformer: nistTag
              },
              cweid: {
                path: 'vulnerabilityClassifications',
                transformer: formatCweId
              },
              cci: {
                path: 'vulnerabilityClassifications',
                transformer: (data: string) => getCCIsForNISTTags(nistTag(data))
              },
              confidence: {path: 'confidence'}
            },
            refs: [],
            source_location: {},
            title: {path: 'name'},
            id: {path: 'type', transformer: idToString},
            desc: {path: 'issueBackground', transformer: parseHtml},
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
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2)
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: formatCodeDesc},
                start_time: {path: '$.issues.exportTime'}
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
  constructor(burpsXml: string, withRaw = false) {
    super(parseXml(burpsXml));
    this.withRaw = withRaw;
  }
}
