import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform,
  parseHtml,
  parseXml
} from './base-converter';
import {CciNistMapping} from './mappings/CciNistMapping';
import {NessusPluginsNistMapping} from './mappings/NessusPluginsNistMapping';

// Constants
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['4', 0.9],
  ['3', 0.7],
  ['i', 0.7],
  ['2', 0.5],
  ['ii', 0.5],
  ['1', 0.3],
  ['iii', 0.3],
  ['0', 0.0]
]);
const COMPLIANCE_PATH = 'compliance-reference';
const COMPLIANCE_CHECK_NAME = 'compliance-check-name';
const COMPLIANCE_INFO = 'compliance-info';
const COMPLIANCE_SOLUTION = 'compliance-solution';
const COMPLIANCE_RESULT = 'compliance-result';
const COMPLIANCE_ACTUAL_VALUE = 'compliance-actual-value';
const NA_PLUGIN_OUTPUT = 'This Nessus Plugin does not provide output message.';
const NESSUS_PLUGINS_NIST_MAPPING = new NessusPluginsNistMapping();
const CCI_NIST_MAPPING = new CciNistMapping();
const DEFAULT_NIST_TAG: string[] = [];

let policyName: string;
let version: string;

function getPolicyName(): string {
  return 'Nessus ' + policyName;
}
function getVersion(): string {
  return version;
}

function getId(item: unknown): string {
  if (_.has(item, COMPLIANCE_PATH)) {
    return parseRef(
      _.get(item, COMPLIANCE_PATH) as unknown as string,
      'Vuln-ID'
    )[0];
  } else {
    return _.get(item, 'pluginID') as unknown as string;
  }
}
function getTitle(item: unknown): string {
  if (_.has(item, COMPLIANCE_CHECK_NAME)) {
    return _.get(item, COMPLIANCE_CHECK_NAME) as unknown as string;
  } else {
    return _.get(item, 'pluginName') as unknown as string;
  }
}
function getDesc(item: unknown): string {
  if (_.has(item, COMPLIANCE_INFO)) {
    return parseHtml(_.get(item, COMPLIANCE_INFO));
  } else {
    return parseHtml(formatDesc(item));
  }
}
function formatDesc(issue: unknown): string {
  const desc = [];
  desc.push(`Plugin Family: ${_.get(issue, 'pluginFamily')}`);
  desc.push(`Port: ${_.get(issue, 'port')}`);
  desc.push(`Protocol: ${_.get(issue, 'protocol')}`);
  return desc.join('; ') + ';';
}
function pluginNistTag(item: unknown): string[] {
  const family = _.get(item, 'pluginFamily') as unknown as string;
  const id = _.get(item, 'pluginID') as unknown as string;
  return NESSUS_PLUGINS_NIST_MAPPING.nistFilter(family, id, DEFAULT_NIST_TAG);
}
function cciNistTag(input: string): string[] {
  const identifiers: string[] = parseRef(input, 'CCI');
  return CCI_NIST_MAPPING.nistFilter(identifiers, DEFAULT_NIST_TAG, false);
}

function parseRef(input: string, key: string): string[] {
  const matches = input.split(',').filter((element) => element.startsWith(key));
  return matches.map((element) => element.split('|')[1]);
}
function getImpact(item: unknown): number {
  if (_.has(item, COMPLIANCE_PATH)) {
    return impactMapping(IMPACT_MAPPING)(
      parseRef(_.get(item, COMPLIANCE_PATH) as unknown as string, 'CAT').join(
        ''
      )
    );
  } else {
    return impactMapping(IMPACT_MAPPING)(_.get(item, 'severity'));
  }
}

function getCheck(item: unknown): string {
  if (_.has(item, COMPLIANCE_SOLUTION)) {
    return parseHtml(_.get(item, COMPLIANCE_SOLUTION));
  } else {
    return '';
  }
}

function getFix(item: unknown): string {
  const fix = _.get(item, 'solution');
  if (fix && fix !== 'n/a') {
    return fix;
  }
  return '';
}

function getNist(item: unknown): string[] {
  if (_.has(item, COMPLIANCE_PATH)) {
    return cciNistTag(_.get(item, COMPLIANCE_PATH) as unknown as string);
  } else {
    return pluginNistTag(item);
  }
}
function getCci(item: unknown): string[] {
  if (_.has(item, COMPLIANCE_PATH)) {
    return parseRef(_.get(item, COMPLIANCE_PATH) as unknown as string, 'CCI');
  } else {
    return [];
  }
}
function getRid(item: unknown): string {
  if (_.has(item, COMPLIANCE_PATH)) {
    return parseRef(
      _.get(item, COMPLIANCE_PATH) as unknown as string,
      'Rule-ID'
    ).join(',');
  } else {
    return _.get(item, 'pluginID') as unknown as string;
  }
}
function getStig(item: unknown): string {
  if (_.has(item, COMPLIANCE_PATH)) {
    return parseRef(
      _.get(item, COMPLIANCE_PATH) as unknown as string,
      'STIG-ID'
    ).join(',');
  } else {
    return '';
  }
}
function getStatus(item: unknown): ExecJSON.ControlResultStatus {
  const result: string = _.get(item, COMPLIANCE_RESULT, '');
  switch (result) {
    case 'PASSED':
      return ExecJSON.ControlResultStatus.Passed;
    case 'WARNING':
      return ExecJSON.ControlResultStatus.Skipped;
    case 'ERROR':
      return ExecJSON.ControlResultStatus.Error;
    default:
      return ExecJSON.ControlResultStatus.Failed;
  }
}
function formatCodeDesc(item: unknown): string {
  if (_.has(item, 'description')) {
    return parseHtml(_.get(item, 'description') || NA_PLUGIN_OUTPUT);
  } else {
    return parseHtml(_.get(item, 'plugin_output') || NA_PLUGIN_OUTPUT);
  }
}
function getStartTime(tag: unknown): string {
  if (Array.isArray(tag)) {
    return _.get(
      tag.find((element) => {
        return _.get(element, 'name') === 'HOST_START';
      }),
      'text'
    );
  } else {
    return _.get(tag, 'text') as unknown as string;
  }
}

function cleanData(control: unknown[]): ExecJSON.Control[] {
  const filteredControl = control as ExecJSON.Control[];
  filteredControl.forEach((element) => {
    if (element instanceof Object) {
      if (_.get(element.tags, 'cci').length === 0) {
        element.tags = _.omit(element.tags, 'cci');
      }
      if (_.get(element.tags, 'rid') === '') {
        element.tags = _.omit(element.tags, 'rid');
      }
      if (_.get(element.tags, 'stig_id') === '') {
        element.tags = _.omit(element.tags, 'stig_id');
      }
      element.refs = element.refs.filter((ref) => ref.url);
      if (element.descriptions !== undefined && element.descriptions !== null) {
        element.descriptions = element.descriptions.filter(
          (description) => description && description.data
        );
      }
    }
  });
  return filteredControl;
}
export class NessusResults {
  data: Record<string, unknown>;
  customMapping?: MappedTransform<ExecJSON.Execution, ILookupPath>;
  withRaw: boolean;
  constructor(nessusXml: string, withRaw = false) {
    this.data = parseXml(nessusXml);
    this.withRaw = withRaw;
  }

  toHdf(): ExecJSON.Execution[] | ExecJSON.Execution {
    const results: ExecJSON.Execution[] = [];
    policyName = _.get(
      this.data,
      'NessusClientData_v2.Policy.policyName'
    ) as string;
    const preference = _.get(
      this.data,
      'NessusClientData_v2.Policy.Preferences.ServerPreferences.preference'
    );
    if (Array.isArray(preference)) {
      version =
        _.get(
          preference.find((element: Record<string, unknown>) => {
            return _.get(element, 'name') === 'sc_version';
          }),
          'value'
        ) || '';
    }
    const reportHost = _.get(
      this.data,
      'NessusClientData_v2.Report.ReportHost'
    );
    if (Array.isArray(reportHost)) {
      reportHost.forEach((element: Record<string, unknown>) => {
        const entry = new NessusMapper(element, this.withRaw);
        if (this.customMapping !== undefined) {
          entry.setMappings(this.customMapping);
        }
        results.push(entry.toHdf());
      });
      return results;
    } else {
      const result = new NessusMapper(
        reportHost as Record<string, unknown>,
        this.withRaw
      );
      if (this.customMapping !== undefined) {
        result.setMappings(this.customMapping);
      }
      return result.toHdf();
    }
  }
}

export class NessusMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & {passthrough: unknown},
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {path: 'name'}
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: {transformer: getPolicyName},
        version: {transformer: getVersion},
        title: {transformer: getPolicyName},
        summary: {transformer: getPolicyName},
        supports: [],
        attributes: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            arrayTransformer: cleanData,
            path: 'ReportItem',
            key: 'id',
            tags: {
              nist: {transformer: getNist},
              cci: {transformer: getCci},
              rid: {transformer: getRid},
              stig_id: {transformer: getStig},
              risk_factor: {path: 'risk_factor'},
              plugin_type: {path: 'plugin_type'},
              plugin_publication_date: {path: 'plugin_publication_date'},
              fname: {path: 'fname'},
              cvss3_base_score: {path: 'cvss3_base_score'},
              cvss_base_score: {path: 'cvss_base_score'}
            },
            refs: [
              {
                url: {
                  path: 'see_also'
                }
              }
            ],
            source_location: {},
            title: {transformer: getTitle},
            id: {transformer: getId},
            desc: {transformer: getDesc},
            descriptions: [
              {
                data: {transformer: getCheck},
                label: 'check'
              },
              {
                data: {transformer: getFix},
                label: 'fix'
              }
            ],
            impact: {transformer: getImpact},
            code: {
              transformer: (reportItem: unknown) =>
                JSON.stringify(reportItem, null, 2)
            },
            results: [
              {
                status: {transformer: getStatus},
                code_desc: {transformer: formatCodeDesc},
                message: {
                  path: ['plugin_output', COMPLIANCE_ACTUAL_VALUE],
                  transformer: (value: unknown) => {
                    if (value === null || value === undefined) {
                      return value;
                    }
                    return String(value);
                  }
                },
                start_time: {
                  path: '$.HostProperties.tag',
                  transformer: getStartTime
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
        return {
          auxiliary_data: [
            {
              name: 'Nessus',
              data: _.omit(data, ['name', 'ReportItem'])
            }
          ],
          ...(this.withRaw && {raw: data})
        };
      }
    }
  };
  constructor(nessusJson: Record<string, unknown>, withRaw = false) {
    super(nessusJson);
    this.withRaw = withRaw;
  }
}
