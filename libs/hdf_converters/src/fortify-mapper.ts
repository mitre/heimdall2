import parser from 'fast-xml-parser';
import * as htmlparser from 'htmlparser2';
import {
  ExecJSON
} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, LookupPath, MappedTransform} from './base-converter';

const NIST_REFERENCE_NAME =
  'Standards Mapping - NIST Special Publication 800-53 Revision 4';
const DEFAULT_NIST_TAG = ['unmapped', 'Rev_4'];

function parseXml(xml: string): Record<string, unknown> {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };
  return parser.parse(xml, options);
}
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
      return _.get(tag, 'Title')
        .match(/[a-zA-Z][a-zA-Z]-\d{1,2}/)
        .concat(['Rev_4']);
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
  output.push(`Code:\n${_.get(input, 'Text').trim()}`);

  return output.join('');
}
function filterVuln(input: unknown[], file: unknown): ExecJSONControl[] {
  input.forEach((element) => {
    if (element instanceof Object) {
      _.set(
        element,
        'results',
        _.get(element, 'results').filter((result: ControlResult) => {
          const code_desc = _.get(result, 'code_desc').split('<=SNIPPET');
          const snippetid = code_desc[0];
          const classid = _.get(element, 'id');
          _.set(result, 'code_desc', code_desc[1]);

          let isMatch = false;
          const matches = _.get(
            file,
            'FVDL.Vulnerabilities.Vulnerability'
          ).filter((element: Record<string, unknown>) => {
            return _.get(element, 'ClassInfo.ClassID') === classid;
          });
          matches.forEach((match: Record<string, unknown>) => {
            let traces = _.get(match, 'AnalysisInfo.Unified.Trace');
            if (!Array.isArray(traces)) {
              traces = [traces];
            }
            if (Array.isArray(traces)) {
              traces.forEach((trace: Record<string, unknown>) => {
                let entries = _.get(trace, 'Primary.Entry');
                if (!Array.isArray(entries)) {
                  entries = [entries];
                }
                if (Array.isArray(entries)) {
                  const filteredEntries = entries.filter(
                    (entry: Record<string, unknown>) => {
                      return _.has(entry, 'Node.SourceLocation.snippet');
                    }
                  );
                  filteredEntries.forEach((entry: Record<string, unknown>) => {
                    if (
                      _.get(entry, 'Node.SourceLocation.snippet') === snippetid
                    ) {
                      isMatch = true;
                    }
                  });
                }
              });
            }
          });
          return isMatch;
        })
      );
      _.set(
        element,
        'impact',
        impactMapping(_.get(element, 'impact'), _.get(element, 'id'))
      );
    } else {
      return element;
    }
  });
  return input as ExecJSONControl[];
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

export class FortifyMapper extends BaseConverter {
  startTime: string;
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
        name: 'Fortify Static Analyzer Scan',
        version: {path: 'FVDL.EngineData.EngineVersion'},
        title: 'Fortify Static Analyzer Scan',
        maintainer: null,
        summary: {
          path: 'FVDL.UUID',
          transformer: (uuid: unknown) => {
            return `Fortify Static Analyzer Scan of UUID: ${uuid}`;
          }
        },
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
            arrayTransformer: filterVuln,
            path: 'FVDL.Description',
            key: 'id',
            id: {path: 'classID'},
            title: {path: 'Abstract', transformer: parseHtml},
            desc: {path: 'Explanation', transformer: parseHtml},
            impact: {path: '$.FVDL.Vulnerabilities.Vulnerability'},
            tags: {
              nist: {transformer: nistTag}
            },
            descriptions: [],
            refs: [],
            source_location: {},
            code: '',
            results: [
              {
                path: '$.FVDL.Snippets.Snippet',
                status: ControlResultStatus.Failed,
                code_desc: {transformer: processEntry},
                run_time: 0,
                start_time: {
                  path: '$.FVDL.CreatedTS',
                  transformer: (input: unknown) => {
                    return _.get(input, 'date') + ' ' + _.get(input, 'time');
                  }
                }
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(fvdl: string) {
    super(parseXml(fvdl));
    this.startTime =
      _.get(this.data, 'FVDL.CreatedTS.date') +
      ' ' +
      _.get(this.data, 'FVDL.CreatedTS.time');
  }
  setMappings(customMappings: MappedTransform<ExecJSON, LookupPath>) {
    super.setMappings(customMappings);
  }
}
