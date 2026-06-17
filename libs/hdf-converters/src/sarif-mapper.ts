import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type { ILookupPath, MappedTransform } from './base-converter';
import { BaseConverter } from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';

const IMPACT_MAPPING = new Map<string, number>([
  ['error', 0.7],
  ['note', 0.3],
  ['warning', 0.5],
]);
const MESSAGE_TEXT = 'message.text';
const CWE_NIST_MAPPING = new CweNistMapping();

function extractCwe(text: string): string[] {
  const lastParen = text.split('(').at(-1) ?? '';
  let output = lastParen.slice(0, -2).split(', ');
  if (output.length === 1) {
    output = lastParen.slice(0, -2).split('!/');
  }
  return output;
}
function impactMapping(severity: unknown): number {
  return typeof severity === 'string' || typeof severity === 'number' ? IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0.1 : 0.1;
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
  identifiers = identifiers.map(element => element.split('-')[1]);
  return CWE_NIST_MAPPING.nistFilter(
    identifiers,
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  );
}

export class SarifMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        let runsData = _.get(data, 'runs');
        if (Array.isArray(runsData)) {
          runsData = runsData.map((run: Record<string, unknown>) =>
            _.omit(run, ['results']),
          );
        }
        return {
          auxiliary_data: [
            {
              data: {
                $schema: _.get(data, '$schema'),
                runs: runsData,
              },
              name: 'SARIF',
            },
          ],
          ...(this.withRaw && { raw: data }),
        };
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: 'Static Analysis Results Interchange Format',
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
            desc: {
              path: MESSAGE_TEXT,
              transformer: (text: unknown): string => {
                return typeof text === 'string' ? text.split(': ')[1] : '';
              },
            },
            id: { path: 'ruleId' },
            impact: { path: 'level', transformer: impactMapping },
            key: 'id',
            path: 'results',
            refs: [],
            results: [
              {
                code_desc: {
                  path: 'locations[0].physicalLocation',
                  transformer: formatCodeDesc,
                },
                start_time: '',

                status: ExecJSON.ControlResultStatus.Failed,
              },
            ],
            source_location: {
              transformer: (control: unknown) => {
                return _.omitBy(
                  {
                    line: _.get(
                      control,
                      'locations[0].physicalLocation.region.startLine',
                    ),
                    ref: _.get(
                      control,
                      'locations[0].physicalLocation.artifactLocation.uri',
                    ),
                  },
                  value => value === '',
                );
              },
            },
            tags: {
              cci: {
                path: 'vulnerabilityClassifications',
                transformer: (data: string) => getCCIsForNISTTags(nistTag(data)),
              },
              cwe: {
                path: MESSAGE_TEXT,
                transformer: extractCwe,
              },
              nist: { path: MESSAGE_TEXT, transformer: nistTag },
            },
            title: {
              path: MESSAGE_TEXT,
              transformer: (text: unknown): string => {
                return typeof text === 'string' ? text.split(': ')[0] : '';
              },
            },
          },
        ],
        groups: [],
        name: 'SARIF',
        path: 'runs',
        sha256: '',
        status: 'loaded',
        supports: [],
        title: 'Static Analysis Results Interchange Format',
        version: { path: '$.version' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(sarifJson: string, withRaw = false) {
    super(JSON.parse(sarifJson));
    this.withRaw = withRaw;
  }
}
