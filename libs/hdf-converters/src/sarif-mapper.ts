import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
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

// CWE identifiers wherever they appear, in any of the forms producers emit:
// a rule tag ('CWE-79: Improper Neutralization ...'), a bare token, or a
// parenthesised list at the end of a message ('... (CWE-120, CWE-20).').
const CWE_PATTERN = /CWE-(\d+)/gi;

function extractCweIdentifiers(...sources: unknown[]): string[] {
  const identifiers = new Set<string>();
  for (const source of sources) {
    if (!_.isString(source)) {
      continue;
    }
    for (const match of source.matchAll(CWE_PATTERN)) {
      identifiers.add(`CWE-${match[1]}`);
    }
  }
  return [...identifiers];
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
function nistTag(cweIdentifiers: string[]): string[] {
  return CWE_NIST_MAPPING.nistFilter(
    cweIdentifiers.map((identifier) => identifier.split('-')[1]),
    DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS
  );
}

// SARIF carries rule metadata on the rule object, not on the result: a result
// only references its rule by id. Producers publish CWEs there in two places --
// `properties.tags` (Semgrep, CodeQL) and `relationships[].target.id` against a
// CWE taxonomy (the standards-blessed form) -- and a result's message may carry
// none at all. Indexing every rule once lets a result resolve its own.
function indexRuleCweIdentifiers(document: unknown): Map<string, string[]> {
  const index = new Map<string, string[]>();
  const runs: unknown = _.get(document, 'runs');
  if (!Array.isArray(runs)) {
    return index;
  }
  for (const run of runs) {
    const extensions = _.get(run, 'tool.extensions') as unknown;
    const components: unknown[] = [
      _.get(run, 'tool.driver'),
      ...(Array.isArray(extensions) ? extensions : [])
    ];
    for (const component of components) {
      const rules: unknown = _.get(component, 'rules');
      if (!Array.isArray(rules)) {
        continue;
      }
      for (const rule of rules) {
        const id: unknown = _.get(rule, 'id');
        if (!_.isString(id)) {
          continue;
        }
        const properties: unknown = _.get(rule, 'properties');
        const ruleTags = _.get(properties, 'tags') as unknown;
        const ruleCwe = _.get(properties, 'cwe') as unknown;
        const relationships = _.get(rule, 'relationships') as unknown;
        const identifiers = extractCweIdentifiers(
          ...(Array.isArray(ruleTags) ? ruleTags : []),
          ...(Array.isArray(ruleCwe) ? ruleCwe : [ruleCwe]),
          ...(Array.isArray(relationships)
            ? relationships.map((relationship) =>
                _.get(relationship, 'target.id')
              )
            : [])
        );
        if (identifiers.length > 0) {
          index.set(id, [
            ...new Set([...(index.get(id) ?? []), ...identifiers])
          ]);
        }
      }
    }
  }
  return index;
}

export class SarifMapper extends BaseConverter {
  withRaw: boolean;
  ruleCweIdentifiers: Map<string, string[]> = new Map();

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: 'Static Analysis Results Interchange Format'
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        path: 'runs',
        name: 'SARIF',
        version: {path: '$.version'},
        title: 'Static Analysis Results Interchange Format',
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'results',
            key: 'id',
            tags: {
              // All three derive from one CWE resolution. Previously each was
              // computed independently and `cci` read a path SARIF does not
              // define, so it always fell through to the default tags' CCIs --
              // which disagreed with the `nist` tag on the same control.
              transformer: (result: unknown): Record<string, unknown> => {
                const cwe = this.resolveCweIdentifiers(result);
                const nist = nistTag(cwe);
                return {cci: getCCIsForNISTTags(nist), nist, cwe};
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
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
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
  // Prefers the rule's own metadata and falls back to scraping the result
  // message. The fallback is what flawfinder-style producers rely on -- their
  // rules carry no properties and the CWEs appear only in the message text.
  resolveCweIdentifiers(result: unknown): string[] {
    const ruleId = _.get(result, 'ruleId');
    if (_.isString(ruleId)) {
      const fromRule = this.ruleCweIdentifiers.get(ruleId);
      if (fromRule !== undefined && fromRule.length > 0) {
        return fromRule;
      }
    }
    return extractCweIdentifiers(_.get(result, MESSAGE_TEXT));
  }

  constructor(sarifJson: string, withRaw = false) {
    super(JSON.parse(sarifJson));
    this.withRaw = withRaw;
    this.ruleCweIdentifiers = indexRuleCweIdentifiers(this.data);
  }
}
