import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  buildParseHtmlFunc,
  impactMapping,
  parseXml,
} from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';

// Constant
const IMPACT_MAPPING = new Map<string, number>([
  ['high', 0.7],
  ['information', 0.3],
  ['low', 0.3],
  ['medium', 0.5],
]);
const NAME = 'BurpSuite Pro Scan';
const CWE_NIST_MAPPING = new CweNistMapping();

let parseHtml: (input: unknown) => string;

export class BurpSuiteMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return { ...(this.withRaw && { raw: data }) };
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
    },
    profiles: [
      {
        attributes: [],
        controls: [
          {
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2),
            },
            desc: { path: 'issueBackground', transformer: parseHtml },
            descriptions: [
              {
                data: { path: 'issueBackground', transformer: parseHtml },
                label: 'check',
              },
              {
                data: { path: 'remediationBackground', transformer: parseHtml },
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
                code_desc: { transformer: formatCodeDesc },
                start_time: { path: '$.issues.exportTime' },
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: {},
            tags: {
              cci: {
                path: 'vulnerabilityClassifications',
                transformer: (data: string) => getCCIsForNISTTags(nistTag(data)),
              },
              confidence: { path: 'confidence' },
              cweid: {
                path: 'vulnerabilityClassifications',
                transformer: formatCweId,
              },
              nist: {
                path: 'vulnerabilityClassifications',
                transformer: nistTag,
              },
            },
            title: { path: 'name' },
          },
        ],
        groups: [],
        name: NAME,
        sha256: '',
        status: 'loaded',
        summary: NAME,
        supports: [],
        title: NAME,
        version: { path: 'issues.burpVersion' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(burpsXml: string, withRaw = false) {
    super(parseXml(burpsXml));
    this.withRaw = withRaw;
  }
}
export class BurpSuiteResults {
  constructor(readonly burpsXml: string, readonly withRaw = false) {}

  async toHdf(): Promise<ExecJSON.Execution> {
    parseHtml = await buildParseHtmlFunc();

    return (new BurpSuiteMapper(this.burpsXml, this.withRaw)).toHdf();
  }
}
// Transformation Functions
function formatCodeDesc(issue: unknown): string {
  const text = [];
  if (_.has(issue, 'host.ip') && _.has(issue, 'host.text')) {
    text.push(
      `Host: ip: ${_.get(issue, 'host.ip')}, url: ${_.get(issue, 'host.text')}`,
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

function formatCweId(input: string): string {
  return parseHtml(input).slice(1, -1).trimStart();
}

function idToString(id: unknown): string {
  return typeof id === 'string' || typeof id === 'number' ? id.toString() : '';
}

function nistTag(input: string): string[] {
  let cwe = formatCweId(input).split('CWE-');
  cwe.shift();
  cwe = cwe.map(x => x.split(':')[0]);
  return CWE_NIST_MAPPING.nistFilter(
    cwe,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  );
}
