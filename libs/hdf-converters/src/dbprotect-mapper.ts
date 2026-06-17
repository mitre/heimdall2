import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  impactMapping,
  parseXml,
} from './base-converter';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';

const IMPACT_MAPPING = new Map<string, number>([
  ['high', 0.7],
  ['informational', 0],
  ['low', 0.3],
  ['medium', 0.5],
]);

export class DBProtectMapper extends BaseConverter {
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
            desc: { transformer: formatDesc },
            id: { path: 'Check ID', transformer: idToString },
            impact: {
              path: 'Risk DV',
              transformer: impactMapping(IMPACT_MAPPING),
            },
            key: 'id',
            path: 'data',
            refs: [],
            results: [
              {
                code_desc: { path: 'Details' },
                start_time: { path: 'Date' },
                status: { path: 'Result Status', transformer: getStatus },
              },
            ],
            source_location: {},
            tags: {
              cci: getCCIsForNISTTags(DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS),
              nist: DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
            },
            title: { path: 'Check' },
          },
        ],
        groups: [],
        name: { path: 'data.[0].Policy' },
        sha256: '',
        status: 'loaded',
        summary: { path: 'data.[0]', transformer: formatSummary },
        supports: [],
        title: { path: 'data.[0].Job Name' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(dbProtectXml: string, withRaw = false) {
    super(compileFindings(parseXml(dbProtectXml)));
    this.withRaw = withRaw;
  }
}
function compileFindings(
  input: Record<string, unknown>,
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
        }),
      );
    });
  }
  return Object.fromEntries([['data', output]]);
}
function formatDesc(entry: unknown): string {
  const text = [];
  text.push(`Task : ${_.get(entry, 'Task')}`);
  text.push(`Check Category : ${_.get(entry, 'Check Category')}`);
  return text.join('; ');
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
      'IP Address, Port, Instance',
    )} `,
  );
  return text.join('\n');
}
function getStatus(input: unknown): ExecJSON.ControlResultStatus {
  switch (input) {
    case 'Fact': {
      return ExecJSON.ControlResultStatus.Skipped;
    }
    case 'Failed': {
      return ExecJSON.ControlResultStatus.Failed;
    }
    case 'Finding': {
      return ExecJSON.ControlResultStatus.Failed;
    }
    case 'Not A Finding': {
      return ExecJSON.ControlResultStatus.Passed;
    }
  }
  return ExecJSON.ControlResultStatus.Skipped;
}

function idToString(id: unknown): string {
  return typeof id === 'string' || typeof id === 'number' ? id.toString() : '';
}
