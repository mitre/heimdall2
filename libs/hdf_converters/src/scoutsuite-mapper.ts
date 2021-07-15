import { ControlResultStatus, ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import { version as HeimdallToolsVersion } from '../package.json';
import { MappedTransform, LookupPath, BaseConverter } from './base-converter'
import { ScoutsuiteNistMapping } from './mappings/ScoutsuiteNistMapping';

const INSPEC_INPUTS_MAPPING = {
  string: 'String',
  numeric: 'Numeric',
  regexp: 'Regexp',
  array: 'Array',
  hash: 'Hash',
  boolean: 'Boolean',
  any: 'Any'
}
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['danger', 0.7],
  ['warning', 0.5],
]);

const SCOUTSUITE_NIST_MAPPING_FILE = 'libs/heimdall_tools/data/scoutsuite-nist-mapping.csv'
const SCOUTSUITE_NIST_MAPPING = new ScoutsuiteNistMapping(SCOUTSUITE_NIST_MAPPING_FILE)

function formatTargetId(file: object): string {
  return `${_.get(file, 'last_run.ruleset_name')} ruleset:${_.get(file, 'provider_name')}:${_.get(file, 'account_id')}`
}
function formatTitle(file: object): string {
  return `Scout Suite Report using ${_.get(file, 'last_run.ruleset_name')} ruleset on ${_.get(file, 'provider_name')} with account ${_.get(file, 'account_id')}}`
}
function joinArray(input: object) {
  if (Array.isArray(input)) {
    return input.join(', ')
  } else {
    return input
  }
}
function impactMapping(severity: string | number): number {
  return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
}
function compliance(input: object): string {
  if (Array.isArray(input)) {
    let output = input.map(element => `Compliant with ${_.get(element, 'name')}, reference ${_.get(element, 'reference')}, version ${_.get(element, 'version')}`).join('\n')
    return output
  } else {
    return input.toString()
  }
}
function getStatus(input: object): ControlResultStatus {
  if (_.get(input, 'checked_items') === 0) {
    return ControlResultStatus.Skipped
  } else if (_.get(input, 'flagged_items') === 0) {
    return ControlResultStatus.Passed
  } else {
    return ControlResultStatus.Failed
  }
}
function checkSkip(input: object): string {
  if (_.get(input, 'checked_items') === 0) {
    return 'Skipped because no items were checked'
  } else {
    return ''
  }
}
function getMessage(input: object): string {
  if (_.get(input, 'checked_items') === 0) {
    return ''
  } else if (_.get(input, 'flagged_items') === 0) {
    return `0 flagged items out of ${_.get(input, 'checked_items')} checked items`
  } else {
    return `${_.get(input, 'flagged_items')} flagged items out of ${_.get(input, 'checked_items')} checked items:\n${_.get(input, 'items').join("\n")}`
  }
}
function nistTag(rule: string) {
  return SCOUTSUITE_NIST_MAPPING.nistTag(rule)
}

function collapseServices(file: object): object {
  let services = Object.values(_.get(file, 'services'))
  let findings = new Array<object>()
  services.forEach(element => {
    findings.push(_.get(element, 'findings'))
  })
  let entries = new Array<object>()
  Object.values(findings).forEach(element => {
    Object.entries(element).forEach(subElement => {
      entries.push(subElement)
    })
  })
  _.set(file, 'services', entries)
  return file
}
export class ScoutsuiteMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON, LookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: { transformer: formatTargetId }
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'Scout Suite Multi-Cloud Security Auditing Tool',
        version: { path: 'last_run.version' },
        title: { transformer: formatTitle },
        maintainer: null,
        summary: { path: 'last_run.ruleset_about' },
        license: null,
        copyright: null,
        copyright_email: null,
        supports: [],
        attributes: [
          {
            name: 'account_id',
            options: {
              value: { path: 'account_id' },
              required: true,
              sensitive: false,
              type: INSPEC_INPUTS_MAPPING.string
            }
          },
          {
            name: 'environment',
            options: {
              value: { path: 'environment' }
            }
          },
          {
            name: 'ruleset',
            options: {
              value: { path: 'last_run.ruleset_name' }
            }
          },
          {
            name: 'run_parameters_excluded_regions',
            options: {
              value: { path: 'last_run.run_parameters.excluded_region', transformer: joinArray }
            }
          },
          {
            name: 'run_parameters_regions',
            options: {
              value: { path: 'last_run.run_parameters.regions', transformer: joinArray }
            }
          },
          {
            name: 'run_parameters_services',
            options: {
              value: { path: 'last_run.run_parameters.services', transformer: joinArray }
            }
          },
          {
            name: 'run_parameters_skipped_services',
            options: {
              value: { path: 'last_run.run_parameters.skipped_services', transformer: joinArray }
            }
          },
          {
            name: 'time',
            options: {
              value: { path: 'last_run.time' }
            }
          },
          {
            name: 'partition',
            options: {
              value: { path: 'partition' }
            }
          },
          {
            name: 'provider_code',
            options: {
              value: { path: 'provider_code' }
            }
          },
          {
            name: 'provider_name',
            options: {
              value: { path: 'provider_name' }
            }
          }
        ],
        depends: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'services',
            key: 'id',
            id: { path: '[0]' },
            title: { path: '[1].description' },
            tags: {
              nist: { path: '[0]', transformer: nistTag }
            },
            impact: { path: '[1].level', transformer: impactMapping },
            desc: { path: '[1].rationale' },
            descriptions: [
              { data: { path: '[1].remediation' }, label: 'fix' },
              { data: { path: '[1].service' }, label: 'service' },
              { data: { path: '[1].path' }, label: 'path' },
              { data: { path: '[1].id_suffix' }, label: 'id_suffix' }
            ],
            refs: [
              { url: { path: '[1].references[0]' } },
              { ref: { path: '[1].compliance', transformer: compliance } }
            ],
            source_location: {},
            code: '',
            results: [
              {
                status: { path: '[1]', transformer: getStatus },
                skip_message: { path: '[1]', transformer: checkSkip },
                message: { path: '[1]', transformer: getMessage },
                code_desc: { path: '[1].description' },
                start_time: { path: '$.last_run.time' }
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(scoutsuiteJson: string) {
    super(collapseServices(JSON.parse(scoutsuiteJson.split('\n', 2)[1])))
  }
  setMappings(customMappings: MappedTransform<ExecJSON, LookupPath>) {
    super.setMappings(customMappings)
  }
}
