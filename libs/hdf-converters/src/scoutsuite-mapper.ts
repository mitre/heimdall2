import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {ScoutsuiteNistMapping} from './mappings/ScoutsuiteNistMapping';
import {NIST2CCI} from './mappings/CciNistMapping';

const INSPEC_INPUTS_MAPPING = {
  string: 'String',
  numeric: 'Numeric',
  regexp: 'Regexp',
  array: 'Array',
  hash: 'Hash',
  boolean: 'Boolean',
  any: 'Any'
};
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['danger', 0.7],
  ['warning', 0.5]
]);

const SCOUTSUITE_NIST_MAPPING = new ScoutsuiteNistMapping();

function getRulesetName(file: unknown) {
  return _.get(file, 'last_run.ruleset_name');
}
function formatTargetId(file: unknown): string {
  return `${getRulesetName(file)} ruleset:${_.get(
    file,
    'provider_name'
  )}:${_.get(file, 'account_id')}`;
}
function formatTitle(file: unknown): string {
  return `Scout Suite Report using ${getRulesetName(file)} ruleset on ${_.get(
    file,
    'provider_name'
  )} with account ${_.get(file, 'account_id')}`;
}
function compliance(input: unknown): string {
  if (Array.isArray(input)) {
    return input
      .map(
        (element) =>
          `Compliant with ${_.get(element, 'name')}, reference ${_.get(
            element,
            'reference'
          )}, version ${_.get(element, 'version')}`
      )
      .join('\n');
  } else {
    return '';
  }
}
function getStatus(input: unknown): ExecJSON.ControlResultStatus {
  if (_.get(input, 'checked_items') === 0) {
    return ExecJSON.ControlResultStatus.Skipped;
  } else if (_.get(input, 'flagged_items') === 0) {
    return ExecJSON.ControlResultStatus.Passed;
  } else {
    return ExecJSON.ControlResultStatus.Failed;
  }
}
function checkSkip(input: unknown): string {
  if (_.get(input, 'checked_items') === 0) {
    return 'Skipped because no items were checked';
  } else {
    return '';
  }
}
function getMessage(input: unknown): string {
  if (_.get(input, 'checked_items') === 0) {
    return '';
  } else if (_.get(input, 'flagged_items') === 0) {
    return `0 flagged items out of ${_.get(
      input,
      'checked_items'
    )} checked items`;
  } else {
    return `${_.get(input, 'flagged_items')} flagged items out of ${_.get(
      input,
      'checked_items'
    )} checked items:\n${(_.get(input, 'items') as unknown as string[]).join(
      '\n'
    )}`;
  }
}
function nistTag(rule: string): string[] {
  return SCOUTSUITE_NIST_MAPPING.nistTag(rule);
}
function checkArray(input: unknown[] | string): string {
  if (typeof input === 'string') {
    return input;
  }
  return input.join(', ');
}

function collapseServices(
  file: Record<string, unknown>
): Record<string, unknown> {
  const services = Object.values(
    _.get(file, 'services') as Record<string, unknown>
  );
  const findings: Record<string, unknown>[] = [];
  services.forEach((element) => {
    findings.push(
      _.get(element, 'findings') as unknown as Record<string, unknown>
    );
  });
  const entries: [string, unknown][] = [];
  Object.values(findings).forEach((element) => {
    Object.entries(element).forEach((subElement) => {
      entries.push(subElement);
    });
  });
  _.set(file, 'services', entries);
  return file;
}
export class ScoutsuiteMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {transformer: formatTargetId}
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: 'Scout Suite Multi-Cloud Security Auditing Tool',
        version: {path: 'last_run.version'},
        title: {transformer: formatTitle},
        summary: {path: 'last_run.ruleset_about'},
        supports: [],
        attributes: [
          {
            name: 'account_id',
            options: {
              value: {path: 'account_id'},
              required: true,
              sensitive: false,
              type: INSPEC_INPUTS_MAPPING.string
            }
          },
          {
            name: 'environment',
            options: {
              value: {path: 'environment'}
            }
          },
          {
            name: 'ruleset',
            options: {
              value: {path: 'last_run.ruleset_name'}
            }
          },
          {
            name: 'run_parameters_excluded_regions',
            options: {
              value: {
                path: 'last_run.run_parameters.excluded_region',
                transformer: checkArray
              }
            }
          },
          {
            name: 'run_parameters_regions',
            options: {
              value: {
                path: 'last_run.run_parameters.regions',
                transformer: checkArray
              }
            }
          },
          {
            name: 'run_parameters_services',
            options: {
              value: {
                path: 'last_run.run_parameters.services',
                transformer: checkArray
              }
            }
          },
          {
            name: 'run_parameters_skipped_services',
            options: {
              value: {
                path: 'last_run.run_parameters.skipped_services',
                transformer: checkArray
              }
            }
          },
          {
            name: 'time',
            options: {
              value: {path: 'last_run.time'}
            }
          },
          {
            name: 'partition',
            options: {
              value: {path: 'partition'}
            }
          },
          {
            name: 'provider_code',
            options: {
              value: {path: 'provider_code'}
            }
          },
          {
            name: 'provider_name',
            options: {
              value: {path: 'provider_name'}
            }
          }
        ],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'services',
            key: 'id',
            tags: {
              nist: {path: '[0]', transformer: nistTag},
              cci: {
                path: '[0]',
                transformer: (data: string) => NIST2CCI(nistTag(data))
              }
            },
            refs: [
              {url: {path: '[1].references[0]'}},
              {ref: {path: '[1].compliance', transformer: compliance}}
            ],
            source_location: {},
            title: {path: '[1].description'},
            id: {path: '[0]'},
            desc: {path: '[1].rationale'},
            descriptions: [
              {data: {path: '[1].remediation'}, label: 'fix'},
              {data: {path: '[1].service'}, label: 'service'},
              {data: {path: '[1].path'}, label: 'path'},
              {data: {path: '[1].id_suffix'}, label: 'id_suffix'}
            ],
            impact: {
              path: '[1].level',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            code: {
              transformer: (vulnerability: Record<string, unknown>): string =>
                JSON.stringify(vulnerability, null, 2)
            },
            results: [
              {
                status: {path: '[1]', transformer: getStatus},
                skip_message: {path: '[1]', transformer: checkSkip},
                code_desc: {path: '[1].description'},
                message: {path: '[1]', transformer: getMessage},
                start_time: {path: '$.last_run.time'}
              }
            ]
          }
        ],
        sha256: ''
      }
    ],
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        const auxData = _.omit(data, [
          'account_id',
          'environment',
          'partition',
          'provider_code',
          'provider_name',
          'services'
        ]);
        auxData.last_run = _.pick(auxData.last_run, ['summary']);
        return {
          auxiliary_data: auxData,
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(scoutsuiteJson: string, withRaw = false) {
    super(collapseServices(JSON.parse(scoutsuiteJson.split('\n', 2)[1])));
    this.withRaw = withRaw;
  }
}
