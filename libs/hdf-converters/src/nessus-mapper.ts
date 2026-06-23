import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  buildParseHtmlFunc,
  impactMapping,
  parseXml,
} from './base-converter';
import { CciNistMapping } from './mappings/CciNistMapping';
import { NessusPluginsNistMapping } from './mappings/NessusPluginsNistMapping';
import { HeimdallToolsVersion } from './utils/global';
import { createHeimdallPassthrough } from './utils/heimdall_metadata';

// Constants
const IMPACT_MAPPING = new Map<string, number>([
  ['0', 0],
  ['1', 0.3],
  ['2', 0.5],
  ['3', 0.7],
  ['4', 0.9],
  ['i', 0.7],
  ['ii', 0.5],
  ['iii', 0.3],
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

let parseHtml: (input: unknown) => string;

let policyName: string;
let version: string;

export class NessusMapper extends BaseConverter {
  withRaw: boolean;

  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    passthrough: {
      transformer: (data: Record<string, unknown>): Record<string, unknown> => {
        return createHeimdallPassthrough('nessus', {
          auxiliary_data: [
            {
              data: _.omit(data, ['name', 'ReportItem']),
              name: 'Nessus',
            },
          ],
          ...(this.withRaw && { raw: data }),
        });
      },
    },
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: { path: 'name' },
    },
    profiles: [
      {
        attributes: [],
        controls: [
          {
            arrayTransformer: cleanData,
            code: {
              transformer: (reportItem: unknown) =>
                JSON.stringify(reportItem, null, 2),
            },
            desc: { transformer: getDesc },
            descriptions: [
              {
                data: { transformer: getCheck },
                label: 'check',
              },
              {
                data: { transformer: getFix },
                label: 'fix',
              },
            ],
            id: { transformer: getId },
            impact: { transformer: getImpact },
            key: 'id',
            path: 'ReportItem',
            refs: [
              { url: { path: 'see_also' } },
            ],
            results: [
              {
                code_desc: { transformer: formatCodeDesc },
                message: {
                  path: ['plugin_output', COMPLIANCE_ACTUAL_VALUE],
                  transformer: (value: unknown) => {
                    if (value == null) {
                      return value;
                    }
                    return typeof value === 'string' ? value : JSON.stringify(value);
                  },
                },
                start_time: {
                  path: '$.HostProperties.tag',
                  transformer: getStartTime,
                },
                status: { transformer: getStatus },
              },
            ],
            source_location: {},
            tags: {
              cci: { transformer: getCci },
              cvss3_base_score: { path: 'cvss3_base_score' },
              cvss_base_score: { path: 'cvss_base_score' },
              fname: { path: 'fname' },
              nist: { transformer: getNist },
              plugin_publication_date: { path: 'plugin_publication_date' },
              plugin_type: { path: 'plugin_type' },
              rid: { transformer: getRid },
              risk_factor: { path: 'risk_factor' },
              stig_id: { transformer: getStig },
            },
            title: { transformer: getTitle },
          },
        ],
        groups: [],
        name: { transformer: getPolicyName },
        sha256: '',
        status: 'loaded',
        summary: { transformer: getPolicyName },
        supports: [],
        title: { transformer: getPolicyName },
        version: { transformer: getVersion },
      },
    ],
    statistics: {},
    version: HeimdallToolsVersion,
  };

  constructor(nessusJson: Record<string, unknown>, withRaw = false) {
    super(nessusJson);
    this.withRaw = withRaw;
  }
}
export class NessusResults {
  customMapping?: MappedTransform<ExecJSON.Execution, ILookupPath>;
  data: Record<string, unknown>;
  withRaw: boolean;
  constructor(nessusXml: string, withRaw = false) {
    this.data = parseXml(nessusXml);
    this.withRaw = withRaw;
  }

  async toHdf(): Promise<ExecJSON.Execution | ExecJSON.Execution[]> {
    parseHtml = await buildParseHtmlFunc();

    const results: ExecJSON.Execution[] = [];
    policyName = _.get(
      this.data,
      'NessusClientData_v2.Policy.policyName',
    ) as string;
    const preference = _.get(
      this.data,
      'NessusClientData_v2.Policy.Preferences.ServerPreferences.preference',
    );
    if (Array.isArray(preference)) {
      version
        = _.get(
          preference.find((element: Record<string, unknown>) => {
            return _.get(element, 'name') === 'sc_version';
          }),
          'value',
        ) || '';
    }
    const reportHost = _.get(
      this.data,
      'NessusClientData_v2.Report.ReportHost',
    );
    if (Array.isArray(reportHost)) {
      for (const element of reportHost) {
        const entry = new NessusMapper(element, this.withRaw);
        if (this.customMapping !== undefined) {
          entry.setMappings(this.customMapping);
        }
        results.push(entry.toHdf());
      }
      return results;
    } else {
      const result = new NessusMapper(
        reportHost as Record<string, unknown>,
        this.withRaw,
      );
      if (this.customMapping !== undefined) {
        result.setMappings(this.customMapping);
      }
      return result.toHdf();
    }
  }
}

function cciNistTag(input: string): string[] {
  const identifiers: string[] = parseRef(input, 'CCI');
  return CCI_NIST_MAPPING.nistFilter(identifiers, DEFAULT_NIST_TAG, false);
}
function cleanData(control: unknown[]): ExecJSON.Control[] {
  const filteredControl = control as ExecJSON.Control[];
  for (const element of filteredControl) {
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
      element.refs = element.refs.filter(ref => ref.url);
      if (element.descriptions != null) {
        element.descriptions = element.descriptions.filter(
          description => description?.data,
        );
      }
    }
  }
  return filteredControl;
}
function formatCodeDesc(item: unknown): string {
  return _.has(item, 'description') ? parseHtml(_.get(item, 'description') || NA_PLUGIN_OUTPUT) : parseHtml(_.get(item, 'plugin_output') || NA_PLUGIN_OUTPUT);
}
function formatDesc(issue: unknown): string {
  const desc = [
    `Plugin Family: ${_.get(issue, 'pluginFamily')}`,
    `Port: ${_.get(issue, 'port')}`,
    `Protocol: ${_.get(issue, 'protocol')}`,
  ];
  return `${desc.join('; ')};`;
}
function getCci(item: unknown): string[] {
  return _.has(item, COMPLIANCE_PATH) ? parseRef(_.get(item, COMPLIANCE_PATH), 'CCI') : [];
}
function getCheck(item: unknown): string {
  return _.has(item, COMPLIANCE_SOLUTION) ? parseHtml(_.get(item, COMPLIANCE_SOLUTION)) : '';
}

function getDesc(item: unknown): string {
  return _.has(item, COMPLIANCE_INFO) ? parseHtml(_.get(item, COMPLIANCE_INFO)) : parseHtml(formatDesc(item));
}
function getFix(item: unknown): string {
  const fix = _.get(item, 'solution');
  if (fix && fix !== 'n/a') {
    return fix;
  }
  return '';
}

function getId(item: unknown): string {
  return _.has(item, COMPLIANCE_PATH)
    ? parseRef(
      _.get(item, COMPLIANCE_PATH),
      'Vuln-ID',
    )[0]
    : (_.get(item, 'pluginID') as unknown as string);
}

function getImpact(item: unknown): number {
  return _.has(item, COMPLIANCE_PATH)
    ? impactMapping(IMPACT_MAPPING)(
      parseRef(_.get(item, COMPLIANCE_PATH), 'CAT').join(
        '',
      ),
    )
    : impactMapping(IMPACT_MAPPING)(_.get(item, 'severity'));
}

function getNist(item: unknown): string[] {
  return _.has(item, COMPLIANCE_PATH) ? cciNistTag(_.get(item, COMPLIANCE_PATH)) : pluginNistTag(item);
}
function getPolicyName(): string {
  return 'Nessus ' + policyName;
}
function getRid(item: unknown): string {
  return _.has(item, COMPLIANCE_PATH)
    ? parseRef(
      _.get(item, COMPLIANCE_PATH),
      'Rule-ID',
    ).join(',')
    : (_.get(item, 'pluginID') as unknown as string);
}
function getStartTime(tag: unknown): string {
  return Array.isArray(tag)
    ? _.get(
      tag.find((element) => {
        return _.get(element, 'name') === 'HOST_START';
      }),
      'text',
    )
    : (_.get(tag, 'text') as unknown as string);
}
function getStatus(item: unknown): ExecJSON.ControlResultStatus {
  const result: string = _.get(item, COMPLIANCE_RESULT, '');
  switch (result) {
    case 'ERROR': {
      return ExecJSON.ControlResultStatus.Error;
    }
    case 'PASSED': {
      return ExecJSON.ControlResultStatus.Passed;
    }
    case 'WARNING': {
      return ExecJSON.ControlResultStatus.Skipped;
    }
    default: {
      return ExecJSON.ControlResultStatus.Failed;
    }
  }
}
function getStig(item: unknown): string {
  return _.has(item, COMPLIANCE_PATH)
    ? parseRef(
      _.get(item, COMPLIANCE_PATH),
      'STIG-ID',
    ).join(',')
    : '';
}
function getTitle(item: unknown): string {
  return _.has(item, COMPLIANCE_CHECK_NAME) ? (_.get(item, COMPLIANCE_CHECK_NAME)) : (_.get(item, 'pluginName') as unknown as string);
}

function getVersion(): string {
  return version;
}
function parseRef(input: string, key: string): string[] {
  const matches = input.split(',').filter(element => element.startsWith(key));
  return matches.map(element => element.split('|', 2)[1]);
}

function pluginNistTag(item: unknown): string[] {
  const family = _.get(item, 'pluginFamily') as unknown as string;
  const id = _.get(item, 'pluginID') as unknown as string;
  return NESSUS_PLUGINS_NIST_MAPPING.nistFilter(family, id, DEFAULT_NIST_TAG);
}
