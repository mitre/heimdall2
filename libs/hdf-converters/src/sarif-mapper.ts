import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {StaticAnalysisResultsFormatSARIFVersion210JSONSchema, Run} from '../types/sarif';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['error', 0.7],
  ['warning', 0.5],
  ['note', 0.3]
]);
const MESSAGE_TEXT = 'message.text';
const CWE_NIST_MAPPING = new CweNistMapping();

function extractCwe(text: string): string[] {
  let output = text.split('(').slice(-1)[0].slice(0, -2).split(', ');
  if (output.length === 1) {
    output = text.split('(').slice(-1)[0].slice(0, -2).split('!/');
  }
  return output;
}
function impactMapping(severity: unknown): number {
  if (typeof severity === 'string' || typeof severity === 'number') {
    return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0.1;
  } else {
    return 0.1;
  }
}
function formatCodeDesc(input: unknown): string {
  const output = [];
  output.push(`URL : ${_.get(input, 'artifactLocation.uri')}`);
  output.push(`LINE : ${_.get(input, 'region.startLine')}`);
  output.push(`COLUMN : ${_.get(input, 'region.startColumn')}`);
  return output.join(' ');
}
function nistTag(text: string): string[] {
  let identifiers = extractCwe(text);
  identifiers = identifiers.map((element) => element.split('-')[1]);
  return CWE_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

export class SarifMapper extends BaseConverter<StaticAnalysisResultsFormatSARIFVersion210JSONSchema> {
  index: number;
  withRaw: boolean;

  mapping(): MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > {
    return {
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion
      },
      version: HeimdallToolsVersion,
      statistics: {},
      profiles: [
        {
          name: {
            path: `runs[${this.index}]`,
            transformer: (run: Run) => `${ run.tool.driver.name } - Static Analysis Results Interchange Format (SARIF)`,
          },
          version: {path: '$.version'},
          supports: [],
          attributes: [],
          groups: [],
          status: 'loaded',
          controls: [
            {
              path: `runs[${this.index}].results`,
              key: 'id',
              tags: {
                cci: {
                  path: 'vulnerabilityClassifications',
                  transformer: (data: string) =>
                    getCCIsForNISTTags(nistTag(data))
                },
                nist: {path: MESSAGE_TEXT, transformer: nistTag},
                cwe: {
                  path: MESSAGE_TEXT,
                  transformer: extractCwe
                }
              },
              refs: [],
              source_location: {
                transformer: (control: unknown) => {
                  return _.omitBy(
                    {
                      ref: _.get(
                        control,
                        'locations[0].physicalLocation.artifactLocation.uri'
                      ),
                      line: _.get(
                        control,
                        'locations[0].physicalLocation.region.startLine'
                      )
                    },
                    (value) => value === ''
                  );
                }
              },
              title: {
                path: MESSAGE_TEXT,
                transformer: (text: unknown): string => {
                  if (typeof text === 'string') {
                    return text.split(': ')[0];
                  } else {
                    return '';
                  }
                }
              },
              id: {path: 'ruleId'},
              desc: {
                path: MESSAGE_TEXT,
                transformer: (text: unknown): string => {
                  if (typeof text === 'string') {
                    return text.split(': ')[1];
                  } else {
                    return '';
                  }
                }
              },
              impact: {path: 'level', transformer: impactMapping},
              code: {
                transformer: (vulnerability: Record<string, unknown>): string =>
                  JSON.stringify(vulnerability, null, 2)
              },
              results: [
                {
                  status: ExecJSON.ControlResultStatus.Failed,
                  code_desc: {
                    path: 'locations[0].physicalLocation',
                    transformer: formatCodeDesc
                  },

                  start_time: ''
                }
              ]
            }
          ],
          sha256: ''
        }
      ],
      passthrough: {
        transformer: (
          data: Record<string, unknown>
        ): Record<string, unknown> => {
          let runsData = _.get(data, 'runs');
          if (Array.isArray(runsData)) {
            runsData = runsData.map((run: Record<string, unknown>) =>
              _.omit(run, ['results'])
            );
          }
          return {
            auxiliary_data: [
              {
                name: 'SARIF',
                data: {
                  $schema: _.get(data, '$schema'),
                  runs: runsData
                }
              }
            ],
            ...(this.withRaw && {raw: data})
          };
        }
      }
    };
  }
  constructor(data: StaticAnalysisResultsFormatSARIFVersion210JSONSchema, index: number, withRaw = false) {
    super(data);
    this.index = index;
    this.withRaw = withRaw;
    this.setMappings(this.mapping());
  }
}

export class SarifResults {
  data: StaticAnalysisResultsFormatSARIFVersion210JSONSchema;
  filename: string;
  withRaw: boolean;
  // TODO: intentionally gonna push back on supporting the external properties stuff since it seems like a decent amount of work to handle it; if/when we get around to it probably gonna require another constructor param that is a Record<string, string> where the key=artifact location and value=the external sarif json as string; will also still not be handling it when we get a guid
  constructor(sarifJSON: string, sarifFilename: string, withRaw = false) {
    this.data = JSON.parse(sarifJSON);
    this.filename = sarifFilename;
    this.withRaw = withRaw;
  }

  toHdf(): Record<string, ExecJSON.Execution> {
    // https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/sarif-v2.1.0-os.html#_Toc34317482 - when the SARIF producer either fails when trying to get data or has no data, then `runs` should be `null` or of 0-length, respectively
    if (this.data.runs === null || this.data.runs.length === 0) {
      return ({ [this.filename]: {
        platform: {
          name: 'Heimdall Tools',
          release: HeimdallToolsVersion
        },
        version: HeimdallToolsVersion,
        statistics: {},
        profiles: [],
        passthrough: {
          auxiliary_data: [
            {
              name: 'SARIF',
              data: this.data
            }
          ]
        }
      } as ExecJSON.Execution & {passthrough: unknown}
      });
    }
    const sarifHDFs = this.data.runs.map((r: Run, i: number) => [`${this.filename}-${r.tool.driver.name}-${i}`, (new SarifMapper(this.data, i, this.withRaw)).toHdf()]);
    return Object.fromEntries(sarifHDFs);
  }
}
