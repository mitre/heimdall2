import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  BaseResults,
  buildParseHtmlFunc,
  DEFAULT_PROFILE_FIELDS,
  impactMapping,
  parseXml,
} from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';
import { createHeimdallPassthrough } from './utils/heimdall_metadata';

// Constant
const IMPACT_MAPPING = new Map<string, number>([
  ['high', 0.7],
  ['information', 0.3],
  ['low', 0.3],
  ['medium', 0.5],
]);
const NAME = 'BurpSuite Pro Scan';
const CWE_NIST_MAPPING = new CweNistMapping();

export class BurpSuiteMapper extends BaseConverter {
  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  >;

  parseHtml: (input: unknown) => string;
  shouldIncludeRaw: boolean;

  constructor(burpsXml: string, shouldIncludeRaw = false, parseHtml: (input: unknown) => string) {
    super(parseXml(burpsXml));
    this.parseHtml = parseHtml;
    this.shouldIncludeRaw = shouldIncludeRaw;
    this.mappings = {
      passthrough: {
        transformer: (data: Record<string, unknown>): Record<string, unknown> => {
          return createHeimdallPassthrough('burp', { ...(this.shouldIncludeRaw && { raw: data }) });
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
                transformer: (vulnerability: Record<string, unknown>): string =>
                  JSON.stringify(vulnerability, null, 2),
              },
              desc: { path: 'issueBackground', transformer: (input: unknown) => this.parseHtml(input) },
              descriptions: [
                {
                  data: { path: 'issueBackground', transformer: (input: unknown) => this.parseHtml(input) },
                  label: 'check',
                },
                {
                  data: { path: 'remediationBackground', transformer: (input: unknown) => this.parseHtml(input) },
                  label: 'fix',
                },
              ],
              id: { path: 'type', transformer: idToString },
              impact: {
                path: 'severity',
                transformer: impactMapping(IMPACT_MAPPING),
              },
              key: 'id',
              path: 'issues.issue',
              refs: [],
              results: [
                {
                  code_desc: { transformer: (v: unknown) => formatCodeDesc(v, this.parseHtml) },
                  start_time: { path: '$.issues.exportTime' },
                  status: ExecJSON.ControlResultStatus.Failed,
                },
              ],
              source_location: {},
              tags: {
                cci: {
                  path: 'vulnerabilityClassifications',
                  transformer: (data: string) => getCCIsForNISTTags(nistTag(data, this.parseHtml)),
                },
                confidence: { path: 'confidence' },
                cweid: {
                  path: 'vulnerabilityClassifications',
                  transformer: (input: string) => formatCweId(input, this.parseHtml),
                },
                nist: {
                  path: 'vulnerabilityClassifications',
                  transformer: (input: string) => nistTag(input, this.parseHtml),
                },
              },
              title: { path: 'name' },
            },
          ],
          name: NAME,
          summary: NAME,
          title: NAME,
          version: { path: 'issues.burpVersion' },
        },
      ],
      statistics: {},
      version: HeimdallToolsVersion,
    };
  }
}
export class BurpSuiteResults extends BaseResults {
  parseHtml!: (input: unknown) => string;
  shouldIncludeRaw: boolean;

  constructor(burpsXml: string, shouldIncludeRaw = false) {
    super(burpsXml);
    this.shouldIncludeRaw = shouldIncludeRaw;
  }

  protected parse(input: string): Record<string, unknown> {
    return { raw: input };
  }

  protected async init(): Promise<void> {
    this.parseHtml = await buildParseHtmlFunc();
  }

  protected createMapper(_data: unknown): BaseConverter {
    return new BurpSuiteMapper(this.rawInput, this.shouldIncludeRaw, this.parseHtml);
  }
}
// Transformation Functions
function formatCodeDesc(issue: unknown, parseHtml: (input: unknown) => string): string {
  const text = [];
  if (_.has(issue, 'host.ip') && _.has(issue, 'host.text')) {
    text.push(
      `Host: ip: ${String(_.get(issue, 'host.ip'))}, url: ${String(_.get(issue, 'host.text'))}`,
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

function formatCweId(input: string, parseHtml: (input: unknown) => string): string {
  return parseHtml(input).slice(1, -1).trimStart();
}

function idToString(id: unknown): string {
  return typeof id === 'string' || typeof id === 'number' ? id.toString() : '';
}

function nistTag(input: string, parseHtml: (input: unknown) => string): string[] {
  let cwe = formatCweId(input, parseHtml).split('CWE-');
  cwe.shift();
  cwe = cwe.map(x => x.split(':', 1)[0]);
  return CWE_NIST_MAPPING.nistFilter(
    cwe,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  );
}
