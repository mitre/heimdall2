import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  DEFAULT_PROFILE_FIELDS,
  impactMapping,
} from './base-converter';
import { ScoutsuiteNistMapping } from './mappings/ScoutsuiteNistMapping';
import { getCCIsForNISTTags, HeimdallToolsVersion } from './utils/global';
import { createHeimdallPassthrough } from './utils/heimdall_metadata';

const INSPEC_INPUTS_MAPPING = {
  any: 'Any',
  array: 'Array',
  boolean: 'Boolean',
  hash: 'Hash',
  numeric: 'Numeric',
  regexp: 'Regexp',
  string: 'String',
};
const IMPACT_MAPPING = new Map<string, number>([
  ['danger', 0.7],
  ['warning', 0.5],
]);

const SCOUTSUITE_NIST_MAPPING = new ScoutsuiteNistMapping();

export class ScoutsuiteMapper extends BaseConverter {
  shouldIncludeRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        const auxData = _.omit(data, [
          'account_id',
          'environment',
          'partition',
          'provider_code',
          'provider_name',
          'services',
        ]);
        auxData.last_run = _.pick(auxData.last_run, ['summary']);
        return createHeimdallPassthrough('scoutsuite', {
          auxiliary_data: auxData,
          ...(this.shouldIncludeRaw && { raw: data }),
        });
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: { transformer: formatTargetId },
    },
    profiles: [
      {
        ...DEFAULT_PROFILE_FIELDS,
        attributes: [
          {
            name: 'account_id',
            options: {
              required: true,
              sensitive: false,
              type: INSPEC_INPUTS_MAPPING.string,
              value: { path: 'account_id' },
            },
          },
          {
            name: 'environment',
            options: { value: { path: 'environment' } },
          },
          {
            name: 'ruleset',
            options: { value: { path: 'last_run.ruleset_name' } },
          },
          {
            name: 'run_parameters_excluded_regions',
            options: {
              value: {
                path: 'last_run.run_parameters.excluded_region',
                transformer: checkArray,
              },
            },
          },
          {
            name: 'run_parameters_regions',
            options: {
              value: {
                path: 'last_run.run_parameters.regions',
                transformer: checkArray,
              },
            },
          },
          {
            name: 'run_parameters_services',
            options: {
              value: {
                path: 'last_run.run_parameters.services',
                transformer: checkArray,
              },
            },
          },
          {
            name: 'run_parameters_skipped_services',
            options: {
              value: {
                path: 'last_run.run_parameters.skipped_services',
                transformer: checkArray,
              },
            },
          },
          {
            name: 'time',
            options: { value: { path: 'last_run.time' } },
          },
          {
            name: 'partition',
            options: { value: { path: 'partition' } },
          },
          {
            name: 'provider_code',
            options: { value: { path: 'provider_code' } },
          },
          {
            name: 'provider_name',
            options: { value: { path: 'provider_name' } },
          },
        ],
        controls: [
          {
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2),
            },
            desc: { path: '[1].rationale' },
            descriptions: [
              { data: { path: '[1].remediation' }, label: 'fix' },
              { data: { path: '[1].service' }, label: 'service' },
              { data: { path: '[1].path' }, label: 'path' },
              { data: { path: '[1].id_suffix' }, label: 'id_suffix' },
            ],
            id: { path: '[0]' },
            impact: {
              path: '[1].level',
              transformer: impactMapping(IMPACT_MAPPING),
            },
            key: 'id',
            path: 'services',
            refs: [
              { url: { path: '[1].references[0]' } },
              { ref: { path: '[1].compliance', transformer: compliance } },
            ],
            results: [
              {
                code_desc: { path: '[1].description' },
                message: { path: '[1]', transformer: getMessage },
                skip_message: { path: '[1]', transformer: checkSkip },
                start_time: { path: '$.last_run.time' },
                status: { path: '[1]', transformer: getStatus },
              },
            ],
            source_location: {},
            tags: {
              cci: {
                path: '[0]',
                transformer: (data: string) => getCCIsForNISTTags(nistTag(data)),
              },
              nist: { path: '[0]', transformer: nistTag },
            },
            title: { path: '[1].description' },
          },
        ],
        name: 'Scout Suite Multi-Cloud Security Auditing Tool',
        summary: { path: 'last_run.ruleset_about' },
        title: { transformer: formatTitle },
        version: { path: 'last_run.version' },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(scoutsuiteJson: string, shouldIncludeRaw = false) {
    const parsed = JSON.parse(scoutsuiteJson.split('\n', 2)[1]);
    super(collapseServices(parsed));
    this.shouldIncludeRaw = shouldIncludeRaw;
  }
}
function checkArray(input: string | unknown[]): string {
  if (typeof input === 'string') {
    return input;
  }
  return input.join(', ');
}
function checkSkip(input: unknown): string {
  return _.get(input, 'checked_items') === 0 ? 'Skipped because no items were checked' : '';
}
function collapseServices(
  file: Record<string, unknown>,
): Record<string, unknown> {
  const services = Object.values(
    _.get(file, 'services') as Record<string, unknown>,
  );
  const findings: Record<string, unknown>[] = Array.from(services, element => (_.get(element, 'findings') as unknown as Record<string, unknown>));
  const entries: [string, unknown][] = [];
  for (const element of Object.values(findings)) {
    for (const subElement of Object.entries(element)) {
      entries.push(subElement);
    }
  }
  _.set(file, 'services', entries);
  return file;
}
function compliance(input: unknown): string {
  return Array.isArray(input)
    ? input
      .map(
        element =>
          `Compliant with ${_.get(element, 'name')}, reference ${_.get(
            element,
            'reference',
          )}, version ${_.get(element, 'version')}`,
      )
      .join('\n')
    : '';
}
function formatTargetId(file: unknown): string {
  return `${getRulesetName(file)} ruleset:${_.get(
    file,
    'provider_name',
  )}:${_.get(file, 'account_id')}`;
}
function formatTitle(file: unknown): string {
  return `Scout Suite Report using ${getRulesetName(file)} ruleset on ${_.get(
    file,
    'provider_name',
  )} with account ${_.get(file, 'account_id')}`;
}
function getMessage(input: unknown): string {
  if (_.get(input, 'checked_items') === 0) {
    return '';
  }
  return _.get(input, 'flagged_items') === 0
    ? `0 flagged items out of ${_.get(
      input,
      'checked_items',
    )} checked items`
    : `${_.get(input, 'flagged_items')} flagged items out of ${_.get(
      input,
      'checked_items',
    )} checked items:\n${(_.get(input, 'items') as unknown as string[]).join(
      '\n',
    )}`;
}
function getRulesetName(file: unknown) {
  return _.get(file, 'last_run.ruleset_name');
}

function getStatus(input: unknown): ExecJSON.ControlResultStatus {
  if (_.get(input, 'checked_items') === 0) {
    return ExecJSON.ControlResultStatus.Skipped;
  }
  return _.get(input, 'flagged_items') === 0 ? ExecJSON.ControlResultStatus.Passed : ExecJSON.ControlResultStatus.Failed;
}
function nistTag(rule: string): string[] {
  return SCOUTSUITE_NIST_MAPPING.nistTag(rule);
}
