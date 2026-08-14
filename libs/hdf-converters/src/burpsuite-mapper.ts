import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import type {
  ILookupPath,
  MappedTransform,
  ParseHtmlFunc} from './base-converter';
import {
  BaseConverter,
  impactMapping,
  buildParseHtmlFunc,
  parseXml
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

// Constant
const IMPACT_MAPPING = new Map<string, number>([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['information', 0.3]
]);
const NAME = 'BurpSuite Pro Scan';
const CWE_NIST_MAPPING = new CweNistMapping();

// Transformation Functions
function formatCodeDesc(parseHtml: ParseHtmlFunc, issue: unknown): string {
  const text = [];
  if (_.has(issue, 'host.ip') && _.has(issue, 'host.text')) {
    text.push(
      `Host: ip: ${String(_.get(issue, 'host.ip'))}, url: ${String(_.get(issue, 'host.text'))}`
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
function formatCweId(parseHtml: ParseHtmlFunc, input: string): string {
  return parseHtml(input).slice(1, -1).trimStart();
}

function nistTag(parseHtml: ParseHtmlFunc, input: string): string[] {
  let cwe = formatCweId(parseHtml, input).split('CWE-');
  cwe.shift();
  cwe = cwe.map((x) => x.split(':', 1)[0]);
  return CWE_NIST_MAPPING.nistFilter(
    cwe,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

export class BurpSuiteResults {
  constructor(readonly burpsXml: string, readonly withRaw = false) {}

  async toHdf(): Promise<ExecJSON.Execution> {
    const parseHtml = await buildParseHtmlFunc();

    return new BurpSuiteMapper(this.burpsXml, parseHtml, this.withRaw).toHdf();
  }
}

export class BurpSuiteMapper extends BaseConverter {
  withRaw: boolean;
  parseHtml: ParseHtmlFunc;

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
                transformer: (input: string) => nistTag(this.parseHtml, input)
              },
              cweid: {
                path: 'vulnerabilityClassifications',
                transformer: (input: string) =>
                  formatCweId(this.parseHtml, input)
              },
              cci: {
                path: 'vulnerabilityClassifications',
                transformer: (data: string) =>
                  getCCIsForNISTTags(nistTag(this.parseHtml, data))
              },
              confidence: {path: 'confidence'}
            },
            refs: [],
            source_location: {},
            title: {path: 'name'},
            id: {path: 'type', transformer: idToString},
            desc: {
              path: 'issueBackground',
              transformer: (input: unknown) => this.parseHtml(input)
            },
            descriptions: [
              {
                data: {
                  path: 'issueBackground',
                  transformer: (input: unknown) => this.parseHtml(input)
                },
                label: 'check'
              },
              {
                data: {
                  path: 'remediationBackground',
                  transformer: (input: unknown) => this.parseHtml(input)
                },
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
                code_desc: {
                  transformer: (issue: unknown) =>
                    formatCodeDesc(this.parseHtml, issue)
                },
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

  constructor(burpsXml: string, parseHtml: ParseHtmlFunc, withRaw = false) {
    super(parseXml(burpsXml));
    this.parseHtml = parseHtml;
    this.withRaw = withRaw;
  }
}
