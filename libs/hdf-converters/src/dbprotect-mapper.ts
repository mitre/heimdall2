import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform,
  parseXml
} from './base-converter';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['informational', 0]
]);

function compileFindings(
  input: Record<string, unknown>
): Record<string, unknown> {
  const keys = _.get(input, 'dataset.metadata.item');
  const findings = _.get(input, 'dataset.data.row');

  let output: unknown[] = [];

  if (Array.isArray(keys) && Array.isArray(findings)) {
    const keyNames = keys.map((element: Record<string, unknown>): string => {
      return _.get(element, 'name') as string;
    });
    output = findings.map((element: Record<string, unknown>) => {
      return Object.fromEntries(
        keyNames.map(function (name: string, i: number) {
          return [name, _.get(element, `value[${i}]`)];
        })
      );
    });
  }
  return Object.fromEntries([['data', output]]);
}
function formatSummary(entry: unknown): string {
  const text = [];
  text.push(`Organization : ${_.get(entry, 'Organization')}`);
  text.push(`Asset : ${_.get(entry, 'Check Asset')}`);
  text.push(`Asset Type : ${_.get(entry, 'Asset Type')}`);
  text.push(`IP Address, Port, Instance : ${_.get(entry, 'Asset Type')}`);
  text.push(
    `IP Address, Port, Instance : ${_.get(
      entry,
      'IP Address, Port, Instance'
    )} `
  );
  return text.join('\n');
}
function formatDesc(entry: unknown): string {
  const text = [];
  text.push(`Task : ${_.get(entry, 'Task')}`);
  text.push(`Check Category : ${_.get(entry, 'Check Category')}`);
  return text.join('; ');
}
function getStatus(input: unknown): ExecJSON.ControlResultStatus {
  switch (input) {
    case 'Fact':
      return ExecJSON.ControlResultStatus.Skipped;
    case 'Failed':
      return ExecJSON.ControlResultStatus.Failed;
    case 'Finding':
      return ExecJSON.ControlResultStatus.Failed;
    case 'Not A Finding':
      return ExecJSON.ControlResultStatus.Passed;
  }
  return ExecJSON.ControlResultStatus.Skipped;
}
function getBacktrace(input: unknown): string {
  if (input === 'Failed') {
    return 'DB Protect Failed Check';
  } else {
    return '';
  }
}
function handleBacktrace(input: unknown): ExecJSON.ControlResult[] {
  if (Array.isArray(input)) {
    input = input.map((element) => {
      if (_.get(element, 'backtrace')[0] === '') {
        return _.omit(element, 'backtrace');
      } else {
        return element;
      }
    });
  }
  return input as ExecJSON.ControlResult[];
}
function idToString(id: unknown): string {
  if (typeof id === 'string' || typeof id === 'number') {
    return id.toString();
  } else {
    return '';
  }
}

export class DBProtectMapper extends BaseConverter {
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
        name: {path: 'data.[0].Policy'},
        title: {path: 'data.[0].Job Name'},
        summary: {path: 'data.[0]', transformer: formatSummary},
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'data',
            key: 'id',
            tags: {
              nist: DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
              cci: getCCIsForNISTTags(DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS)
            },
            refs: [],
            source_location: {},
            title: {path: 'Check'},
            id: {path: 'Check ID', transformer: idToString},
            desc: {transformer: formatDesc},
            impact: {
              path: 'Risk DV',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2)
            },
            results: [
              {
                arrayTransformer: handleBacktrace,
                status: {path: 'Result Status', transformer: getStatus},
                code_desc: {path: 'Details'},
                start_time: {path: 'Date'},
                backtrace: [{path: 'Result Status', transformer: getBacktrace}]
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return {...(this.withRaw && {raw: data})};
      }
    }
  };
  constructor(dbProtectXml: string, withRaw = false) {
    super(compileFindings(parseXml(dbProtectXml)));
    this.withRaw = withRaw;
  }
}
