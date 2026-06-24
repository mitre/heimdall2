import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  buildParseHtmlFunc,
} from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';
import { createHeimdallPassthrough } from './utils/heimdall_metadata';

const CWE_NIST_MAPPING = new CweNistMapping();

let parseHtml: (input: unknown) => string;

export class ZapMapper extends BaseConverter {
  shouldIncludeRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return createHeimdallPassthrough('zap', {
          auxiliary_data: [
            {
              data: _.pick(data, ['site.@port', 'site.@ssl']),
              name: 'OWASP ZAP',
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
        attributes: [],
        controls: [
          {
            arrayTransformer: deduplicateId,
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2),
            },
            desc: { path: 'desc', transformer: parseHtml },
            descriptions: [
              {
                data: { transformer: checkText },
                label: 'check',
              },
            ],
            id: { path: 'pluginid' },
            impact: { path: 'riskcode', transformer: impactMapping },
            path: 'site.alerts',
            refs: [],
            results: [
              {
                code_desc: { transformer: formatCodeDesc },
                path: 'instances',
                start_time: { path: '$.@generated' },
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: {},
            tags: {
              cci: {
                path: 'cweid',
                transformer: (cwe: string) => getCCIsForNISTTags(nistTag(cwe)),
              },
              confidence: { path: 'confidence' },
              cweid: { path: 'cweid' },
              nist: { path: 'cweid', transformer: nistTag },
              riskdesc: { path: 'riskdesc' },
              sourceid: { path: 'sourceid' },
              wascid: { path: 'wascid' },
            },
            title: { path: 'name' },
          },
        ],
        groups: [],
        name: 'OWASP ZAP Scan',
        sha256: '',
        status: 'loaded',
        summary: {
          path: 'site.@host',
          transformer: (input: unknown): string => {
            return `OWASP ZAP Scan of Host: ${String(input)}`;
          },
        },
        supports: [],
        title: {
          path: 'site.@host',
          transformer: (input: unknown): string => {
            return `OWASP ZAP Scan of Host: ${String(input)}`;
          },
        },
        version: { path: '@version' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(zapJson: string, name?: string, shouldIncludeRaw = false) {
    super(
      _.set(
        JSON.parse(zapJson),
        'site',
        filterSite(_.get(JSON.parse(zapJson), 'site'), name),
      ),
      false,
    );
    this.shouldIncludeRaw = shouldIncludeRaw;
  }

  toHdf(): ExecJSON.Execution {
    const original = super.toHdf();
    for (const profile of _.get(original, 'profiles')) {
      for (const control of _.get(profile, 'controls')) {
        _.set(
          control,
          'results',
          _.get(control, 'results').filter(function (
            element: ExecJSON.ControlResult,
            index: number,
            self: ExecJSON.ControlResult[],
          ) {
            return index === self.indexOf(element);
          }),
        );
      }
    }
    return original;
  }
}
export class ZapResults {
  constructor(readonly zapJson: string, readonly name?: string, readonly shouldIncludeRaw = false) {}

  async toHdf(): Promise<ExecJSON.Execution> {
    parseHtml = await buildParseHtmlFunc();

    return (new ZapMapper(this.zapJson, this.name, this.shouldIncludeRaw)).toHdf();
  }
}
function checkText(input: Record<string, unknown>): string {
  const text = [
    _.get(input, 'solution'),
    _.get(input, 'otherinfo'),
    _.get(input, 'otherinfo'),
  ];
  return text.join('\n');
}
function deduplicateId(input: unknown[]): ExecJSON.Control[] {
  const controlId = input.map((element) => {
    return _.get(element, 'id');
  });
  const dupId = _.chain(controlId)
    .groupBy()
    .pickBy(value => value.length > 1)
    .keys()
    .value();
  for (const id of dupId) {
    let index = 1;
    for (const element of input
      .filter(element => _.get(element, 'id') === id)) {
      if (element instanceof Object) {
        _.set(element, 'id', `${id}.${index.toString()}`);
      }
      index++;
    }
  }
  return input as ExecJSON.Control[];
}
function filterSite<T>(input: T[], name?: string) {
  // Choose passed site if provided
  if (name) {
    return input.find(
      element => (_.get(element, '@name') as unknown as string) === name,
    );
  }
  let best = input[0];
  for (const item of input) {
    if ((_.get(item, 'alerts') as unknown as Record<string, unknown>[]).length
      > (_.get(best, 'alerts') as unknown as Record<string, unknown>[]).length) {
      best = item;
    }
  }
  return best;
}
function formatCodeDesc(input: unknown): string {
  const text: string[] = [];
  if (input instanceof Object) {
    for (const key of Object.keys(input)) {
      text.push(
        `${key.charAt(0).toUpperCase() + key.slice(1)}: ${_.get(input, key)}`,
      );
    }
  }
  return text.join('\n') + '\n';
}

function impactMapping(input: unknown): number {
  if (typeof input === 'string') {
    const impact = Number.parseInt(input);
    if (0 <= impact && impact <= 1) {
      return 0.3;
    }
    if (impact === 2) {
      return 0.5;
    }
    return impact >= 3 ? 0.7 : 0;
  }
  return 0;
}

function nistTag(cweid: string): string[] {
  return CWE_NIST_MAPPING.nistFilter(
    [cweid],
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  );
}
