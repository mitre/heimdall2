import parser from 'fast-xml-parser';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import path from 'path';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform,
  parseHtml
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
const COMPLIANCE_PATH = 'cm:compliance-reference';
const NA_PLUGIN_OUTPUT = 'This Nessus Plugin does not provide output message.';
const NESSUS_PLUGINS_NIST_MAPPING_FILE = path.resolve(
  __dirname,
  '../data/nessus-plugins-nist-mapping.csv'
);
const NESSUS_PLUGINS_NIST_MAPPING = new NessusPluginsNistMapping(
  NESSUS_PLUGINS_NIST_MAPPING_FILE
);
const CCI_NIST_MAPPING_FILE = path.resolve(__dirname, '../data/U_CCI_List.xml');
const CCI_NIST_MAPPING = new CciNistMapping(CCI_NIST_MAPPING_FILE);
const DEFAULT_NIST_TAG = ['unmapped'];

function parseXml(xml: string): Record<string, unknown> {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };
  return parser.parse(xml, options);
}

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
    return parseRef(_.get(item, COMPLIANCE_PATH), 'Vuln-ID')[0];
  } else {
    return _.get(item, 'pluginID');
  }
}
function getTitle(item: unknown): string {
  if (_.has(item, 'cm:compliance-check-name')) {
    return _.get(item, 'cm:compliance-check-name');
  } else {
    return _.get(item, 'pluginName');
  }
}
function getDesc(item: unknown): string {
  if (_.has(item, 'cm:compliance-info')) {
    return parseHtml(_.get(item, 'cm:compliance-info'));
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
  const family = _.get(item, 'pluginFamily');
  const id = _.get(item, 'pluginID');
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
      parseRef(_.get(item, COMPLIANCE_PATH), 'CAT').join('')
    );
  } else {
    return impactMapping(IMPACT_MAPPING)(_.get(item, 'severity'));
  }
}
function getCheck(item: unknown): string {
  if (_.has(item, 'cm:compliance-solution')) {
    return parseHtml(_.get(item, 'cm:compliance-solution'));
  } else {
    return '';
  }
}
function getNist(item: unknown): string[] {
  if (_.has(item, COMPLIANCE_PATH)) {
    return cciNistTag(_.get(item, COMPLIANCE_PATH));
  } else {
    return pluginNistTag(item);
  }
}
function getCci(item: unknown): string[] {
  if (_.has(item, COMPLIANCE_PATH)) {
    return parseRef(_.get(item, COMPLIANCE_PATH), 'CCI');
  } else {
    return [];
  }
}
function getRid(item: unknown): string {
  if (_.has(item, COMPLIANCE_PATH)) {
    return parseRef(_.get(item, COMPLIANCE_PATH), 'Rule-ID').join(',');
  } else {
    return _.get(item, 'pluginID');
  }
}
function getStig(item: unknown): string {
  if (_.has(item, COMPLIANCE_PATH)) {
    return parseRef(_.get(item, COMPLIANCE_PATH), 'STIG-ID').join(',');
  } else {
    return '';
  }
}
function getStatus(item: unknown): ExecJSON.ControlResultStatus {
  const result = _.get(item, 'cm:compliance-result');
  switch (result) {
    case 'PASSED':
      return ExecJSON.ControlResultStatus.Passed;
    case 'WARNING':
      return ExecJSON.ControlResultStatus.Skipped;
    case 'ERROR':
      return ExecJSON.ControlResultStatus.Error;
    case 'FAILED':
      return ExecJSON.ControlResultStatus.Failed;
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
    return _.get(tag, 'text');
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
      if (element.descriptions !== undefined && element.descriptions !== null) {
        if (_.get(element.descriptions[0], 'data') === '') {
          element.descriptions = [];
        }
      }
    }
  });
  return filteredControl;
}
export class NessusResults {
  data: Record<string, unknown>;
  customMapping?: MappedTransform<ExecJSON.Execution, ILookupPath>;
  constructor(nessusXml: string) {
    this.data = parseXml(nessusXml);
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
        const entry = new NessusMapper(element);
        if (this.customMapping !== undefined) {
          entry.setMappings(this.customMapping);
        }
        results.push(entry.toHdf());
      });
      return results;
    } else {
      const result = new NessusMapper(reportHost as Record<string, unknown>);
      if (this.customMapping !== undefined) {
        result.setMappings(this.customMapping);
      }
      return result.toHdf();
    }
  }
  setMappings(
    customMapping: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    this.customMapping = customMapping;
  }
}

export class NessusMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {path: 'name'}
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: {transformer: getPolicyName},
        version: {transformer: getVersion},
        title: {transformer: getPolicyName},
        maintainer: null,
        summary: {transformer: getPolicyName},
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
            arrayTransformer: cleanData,
            path: 'ReportItem',
            key: 'id',
            tags: {
              nist: {transformer: getNist},
              cci: {transformer: getCci},
              rid: {transformer: getRid},
              stig_id: {transformer: getStig}
            },
            descriptions: [
              {
                data: {transformer: getCheck},
                label: 'check'
              }
            ],
            refs: [],
            source_location: {},
            id: {transformer: getId},
            title: {transformer: getTitle},
            desc: {transformer: getDesc},
            impact: {transformer: getImpact},
            code: '',
            results: [
              {
                status: {transformer: getStatus},
                code_desc: {transformer: formatCodeDesc},
                run_time: 0,
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
    ]
  };
  constructor(nessusJson: Record<string, unknown>) {
    super(nessusJson);
  }
}
