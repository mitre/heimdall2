import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  buildParseHtmlFunc,
  parseXml,
} from './base-converter';
import { getCCIsForNISTTags, HeimdallToolsVersion } from './utils/global';

const NIST_REFERENCE_NAME
  = 'Standards Mapping - NIST Special Publication 800-53 Revision 4';
const DEFAULT_NIST_TAG: string[] = [];
const NIST_CONTROL_PATTERN_RE = /[A-Za-z][A-Za-z]-\d{1,2}/v;

let parseHtml: (input: unknown) => string;

export class FortifyMapper extends BaseConverter {
  withRaw: boolean;
  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        let auxData = _.get(data, 'FVDL');
        if (_.isObject(auxData)) {
          auxData = _.omit(auxData, [
            'CreatedTS',
            'UUID',
            'Description',
            'Snippets',
          ]);
        }
        return {
          auxiliary_data: [
            {
              data: { FVDL: auxData },
              name: 'Fortify',
            },
          ],
          ...(this.withRaw && { raw: data }),
        };
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
            arrayTransformer: filterVuln,
            code: {
              transformer: (vulnerability: Record<string, unknown>): string => {
                return JSON.stringify(vulnerability, null, 2);
              },
            },
            desc: { path: 'Explanation', transformer: parseHtml },
            id: { path: 'classID' },
            impact: { path: '$.FVDL.Vulnerabilities.Vulnerability' },
            key: 'id',
            path: 'FVDL.Description',
            refs: [],
            results: [
              {
                code_desc: { transformer: processEntry },
                path: '$.FVDL.Snippets.Snippet',
                start_time: {
                  path: '$.FVDL.CreatedTS',
                  transformer: (input: unknown): string => {
                    return `${_.get(input, 'date')} ${_.get(input, 'time')}`;
                  },
                },
                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: {},
            tags: {
              cci: {
                transformer: (data: Record<string, unknown>) =>
                  getCCIsForNISTTags(nistTag(data)),
              },
              nist: { transformer: nistTag },
            },
            title: { path: 'Abstract', transformer: parseHtml }, // there are embedded nodes that do not show up properly
          },
        ],
        groups: [],
        name: 'Fortify Static Analyzer Scan',
        sha256: '',
        status: 'loaded',
        summary: {
          path: 'FVDL.UUID',
          transformer: (uuid: unknown): string => {
            return `Fortify Static Analyzer Scan of UUID: ${uuid}`;
          },
        },
        supports: [],
        title: 'Fortify Static Analyzer Scan',
        version: { path: 'FVDL.EngineData.EngineVersion' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  startTime: string;
  constructor(fvdl: string, withRaw = false) {
    super(
      parseXml(fvdl, { stopNodes: ['FVDL.Description.Abstract', 'FVDL.Description.Explanation'] }),
    );
    this.startTime = `${_.get(this.data, 'FVDL.CreatedTS.date')} ${_.get(
      this.data,
      'FVDL.CreatedTS.time',
    )}`;
    this.withRaw = withRaw;
  }
}

export class FortifyResults {
  constructor(readonly fvdl: string, readonly withRaw = false) {}

  async toHdf(): Promise<ExecJSON.Execution> {
    parseHtml = await buildParseHtmlFunc();

    return (new FortifyMapper(this.fvdl, this.withRaw)).toHdf();
  }
}

function filterVuln(input: unknown[], file: unknown): ExecJSON.Control[] {
  for (const element of input) {
    if (element instanceof Object) {
      _.set(
        element,
        'results',
        (_.get(element, 'results') as any).filter(
          (result: ExecJSON.ControlResult) => {
            const codedesc = _.get(result, 'code_desc').split('<=SNIPPET');
            const snippetid = codedesc[0];
            const classid = _.get(element, 'id');
            _.set(result, 'code_desc', codedesc[1]);

            let isMatch = false;
            const matches = (
              _.get(file, 'FVDL.Vulnerabilities.Vulnerability') as any
            ).filter((subElement: Record<string, unknown>) => {
              return _.get(subElement, 'ClassInfo.ClassID') === classid;
            });
            for (const match of matches) {
              const traces: unknown[] = makeArray(
                _.get(match, 'AnalysisInfo.Unified.Trace'),
              );
              for (const trace of traces) {
                const entries: unknown[] = makeArray(
                  _.get(trace, 'Primary.Entry'),
                );
                const filteredEntries = entries.filter((entry: unknown) => {
                  return _.has(entry, 'Node.SourceLocation.snippet');
                });
                for (const entry of filteredEntries) {
                  if (
                    _.get(entry, 'Node.SourceLocation.snippet') === snippetid
                  ) {
                    isMatch = true;
                  }
                }
              }
            }
            return isMatch;
          },
        ),
      );
      _.set(
        element,
        'impact',
        impactMapping(
          _.get(element, 'impact') as unknown as Record<string, unknown>,
          _.get(element, 'id') as unknown as string,
        ),
      );
    }
    continue;
  }
  return input as ExecJSON.Control[];
}
function impactMapping(input: Record<string, unknown>, id: string): number {
  if (Array.isArray(input)) {
    const matches = input.find((element) => {
      return _.get(element, 'ClassInfo.ClassID') === id;
    });
    return Number.parseFloat(_.get(matches, 'ClassInfo.DefaultSeverity')) / 5;
  } else {
    return Number.parseFloat(_.get(input, 'ClassInfo.DefaultSeverity') as string) / 5;
  }
}
function makeArray(input: unknown): unknown[] {
  return Array.isArray(input) ? (input as unknown[]) : [input];
}

function nistTag(rule: Record<string, unknown>): string[] {
  let references = _.get(rule, 'References.Reference');
  if (!Array.isArray(references)) {
    references = [references];
  }
  if (Array.isArray(references)) {
    const tag = references.find((element: Record<string, unknown>) => {
      return _.get(element, 'Author') === NIST_REFERENCE_NAME;
    });
    return tag === null || tag === undefined ? DEFAULT_NIST_TAG : _.get(tag, 'Title').match(NIST_CONTROL_PATTERN_RE);
  }
  return [];
}

function processEntry(input: unknown): string {
  const output = [
    `${_.get(input, 'id')}<=SNIPPET`,
    `\nPath: ${_.get(input, 'File')}\n`,
    `StartLine: ${_.get(input, 'StartLine')}, `,
    `EndLine: ${_.get(input, 'EndLine')}\n`,
    `Code:\n${(_.get(input, 'Text') as unknown as string).trim()}`,
  ];

  return output.join('');
}
