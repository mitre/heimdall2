import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform,
  parseHtml,
  parseXml
} from './base-converter';
import {getCCIsForNISTTags} from './utils/global';

const NIST_REFERENCE_NAME =
  'Standards Mapping - NIST Special Publication 800-53 Revision 4';
const DEFAULT_NIST_TAG: string[] = [];

function impactMapping(input: Record<string, unknown>, id: string): number {
  if (Array.isArray(input)) {
    const matches = input.find((element) => {
      return _.get(element, 'ClassInfo.ClassID') === id;
    });
    return parseFloat(_.get(matches, 'ClassInfo.DefaultSeverity')) / 5;
  } else {
    return parseFloat(_.get(input, 'ClassInfo.DefaultSeverity') as string) / 5;
  }
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
    if (tag === null || tag === undefined) {
      return DEFAULT_NIST_TAG;
    } else {
      return _.get(tag, 'Title').match(/[a-zA-Z][a-zA-Z]-\d{1,2}/);
    }
  }
  return [];
}

function processEntry(input: unknown): string {
  const output = [];
  output.push(`${_.get(input, 'id')}<=SNIPPET`);
  output.push(`\nPath: ${_.get(input, 'File')}\n`);
  output.push(`StartLine: ${_.get(input, 'StartLine')}, `);
  output.push(`EndLine: ${_.get(input, 'EndLine')}\n`);
  output.push(`Code:\n${(_.get(input, 'Text') as unknown as string).trim()}`);

  return output.join('');
}
function makeArray(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input as unknown[];
  } else {
    return [input];
  }
}
function filterVuln(input: unknown[], file: unknown): ExecJSON.Control[] {
  input.forEach((element) => {
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
            matches.forEach((match: Record<string, unknown>) => {
              const traces: unknown[] = makeArray(
                _.get(match, 'AnalysisInfo.Unified.Trace')
              );
              traces.forEach((trace: unknown) => {
                const entries: unknown[] = makeArray(
                  _.get(trace, 'Primary.Entry')
                );
                const filteredEntries = entries.filter((entry: unknown) => {
                  return _.has(entry, 'Node.SourceLocation.snippet');
                });
                filteredEntries.forEach((entry: unknown) => {
                  if (
                    _.get(entry, 'Node.SourceLocation.snippet') === snippetid
                  ) {
                    isMatch = true;
                  }
                });
              });
            });
            return isMatch;
          }
        )
      );
      _.set(
        element,
        'impact',
        impactMapping(
          _.get(element, 'impact') as unknown as Record<string, unknown>,
          _.get(element, 'id') as unknown as string
        )
      );
    }
    return element;
  });
  return input as ExecJSON.Control[];
}

export class FortifyMapper extends BaseConverter {
  startTime: string;
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
        name: 'Fortify Static Analyzer Scan',
        version: {path: 'FVDL.EngineData.EngineVersion'},
        title: 'Fortify Static Analyzer Scan',
        summary: {
          path: 'FVDL.UUID',
          transformer: (uuid: unknown): string => {
            return `Fortify Static Analyzer Scan of UUID: ${uuid}`;
          }
        },
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            arrayTransformer: filterVuln,
            path: 'FVDL.Description',
            key: 'id',
            tags: {
              nist: {transformer: nistTag},
              cci: {
                transformer: (data: Record<string, unknown>) =>
                  getCCIsForNISTTags(nistTag(data))
              }
            },
            refs: [],
            source_location: {},
            title: {path: 'Abstract', transformer: parseHtml}, // there are embedded nodes that do not show up properly
            id: {path: 'classID'},
            desc: {path: 'Explanation', transformer: parseHtml},
            impact: {path: '$.FVDL.Vulnerabilities.Vulnerability'},
            code: {
              transformer: (vulnerability: Record<string, unknown>): string => {
                return JSON.stringify(vulnerability, null, 2);
              }
            },
            results: [
              {
                path: '$.FVDL.Snippets.Snippet',
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: processEntry},
                start_time: {
                  path: '$.FVDL.CreatedTS',
                  transformer: (input: unknown): string => {
                    return `${_.get(input, 'date')} ${_.get(input, 'time')}`;
                  }
                }
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        let auxData = _.get(data, 'FVDL');
        if (_.isObject(auxData)) {
          auxData = _.omit(auxData, [
            'CreatedTS',
            'UUID',
            'Description',
            'Snippets'
          ]);
        }
        return {
          auxiliary_data: [
            {
              name: 'Fortify',
              data: {FVDL: auxData}
            }
          ],
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(fvdl: string, withRaw = false) {
    super(
      parseXml(fvdl, {
        stopNodes: ['FVDL.Description.Abstract', 'FVDL.Description.Explanation']
      })
    );
    this.startTime = `${_.get(this.data, 'FVDL.CreatedTS.date')} ${_.get(
      this.data,
      'FVDL.CreatedTS.time'
    )}`;
    this.withRaw = withRaw;
  }
}
