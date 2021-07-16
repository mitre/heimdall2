import parser from 'fast-xml-parser';
import {
  ExecJSON,
} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {MappedTransform, LookupPath, BaseConverter, generateHash} from './base-converter'
import {NessusPluginsNistMapping} from './mappings/NessusPluginsNistMapping'
import path from 'path'
import {CciNistMapping} from './mappings/CciNistMapping';

// Constants
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['4', 0.9],
  ['IV', 0.9],
  ['3', 0.7],
  ['III', 0.7],
  ['2', 0.5],
  ['II', 0.5],
  ['1', 0.3],
  ['I', 0.3],
  ['0', 0.0]
]);
const NA_PLUGIN_OUTPUT = 'This Nessus Plugin does not provide output message.'
const NESSUS_PLUGINS_NIST_MAPPING_FILE = path.resolve(__dirname, '../data/nessus-plugins-nist-mapping.csv')
const NESSUS_PLUGINS_NIST_MAPPING = new NessusPluginsNistMapping(NESSUS_PLUGINS_NIST_MAPPING_FILE)
const CCI_NIST_MAPPING_FILE = path.resolve(__dirname, '../data/U_CCI_List.xml')
const CCI_NIST_MAPPING = new CciNistMapping(CCI_NIST_MAPPING_FILE)
const DEFAULT_NIST_TAG = ['unmapped']

function parseXml(xml: string) {
  const options = {
    attributeNamePrefix: "",
    textNodeName: "text",
    ignoreAttributes: false

  }
  return parser.parse(xml, options);
}

var policyName: string
var version: string

function getPolicyName(_input: unknown) {
  return 'Nessus ' + policyName
}
function getVersion(_input: unknown) {
  return version
}

function getId(item: unknown): string {
  if (_.has(item, 'compliance-reference')) {
    return parseRef(_.get(item, 'compliance-reference'), 'Vuln-ID')[0]
  } else {
    return _.get(item, 'pluginID')
  }
}
function getTitle(item: unknown): string {
  if (_.has(item, 'compliance-check-name')) {
    return _.get(item, 'compliance-check-name')
  } else {
    return _.get(item, 'pluginName')
  }
}
function getDesc(item: unknown): string {
  if (_.has(item, 'compliance-info')) {
    return _.get(item, 'compliance-info')
  } else {
    return formatDesc(item)
  }
}
function formatDesc(issue: unknown) {
  let desc = []
  desc.push(`Plugin Family: ${_.get(issue, 'pluginFamily')}`)
  desc.push(`Port: ${_.get(issue, 'port')}`)
  desc.push(`Protocol: ${_.get(issue, 'protocol')}`)
  return desc.join('; ') + ';'
}
function pluginNistTag(item: unknown) {
  let family = _.get(item, 'pluginFamily')
  let id = _.get(item, 'pluginID')
  return NESSUS_PLUGINS_NIST_MAPPING.nistFilter(family, id, DEFAULT_NIST_TAG)
}
function cciNistTag(input: string): string[] {
  let identifiers: string[] = parseRef(input, 'CCI')
  return CCI_NIST_MAPPING.nistFilter(identifiers, DEFAULT_NIST_TAG)
}

function parseRef(input: string, key: string): string[] {
  let matches = input.split(', ').filter(element => element.startsWith(key))
  matches = matches.map(element => element.split('|')[1])
  return matches
}
function getImpact(item: unknown): number {
  if (_.has(item, 'compliance-reference')) {
    return impactMapping(parseRef(_.get(item, 'compliance-reference'), 'CAT').join(''))
  } else {
    return impactMapping(_.get(item, 'severity'))
  }
}
function getCheck(item: unknown) {
  if (_.has(item, 'compliance-solution')) {
    return _.get(item, 'compliance-solution')
  } else {
    return ''
  }
}
function impactMapping(severity: unknown) {
  if (typeof severity === 'string' || typeof severity === 'number') {
    return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
  } else {
    return 0
  }
}
function getNist(item: unknown): string[] {
  if (_.has(item, 'compliance-reference')) {
    return cciNistTag(_.get(item, 'compliance-reference'))
  } else {
    return pluginNistTag(item)
  }
}
function getCci(item: unknown): string[] {
  if (_.has(item, 'compliance-reference')) {
    return parseRef(_.get(item, 'compliance-reference'), 'CCI')
  } else {
    return []
  }
}
function getRid(item: unknown): string {
  if (_.has(item, 'compliance-reference')) {
    return parseRef(_.get(item, 'compliance-reference'), 'Rule-ID').join(',')
  } else {
    return _.get(item, 'pluginID')
  }
}
function getStig(item: unknown): string {
  if (_.has(item, 'compliance-reference')) {
    return parseRef(_.get(item, 'compliance-reference'), 'STIG-ID').join(',')
  } else {
    return ''
  }
}
function getStatus(item: unknown) {
  if (_.has(item, 'cm:compliance-result')) {
    if (_.get(item, 'cm:compliance-result') === 'PASSED') {
      return ControlResultStatus.Passed
    } else {
      return ControlResultStatus.Failed
    }
  } else {
    return ControlResultStatus.Failed
  }
}
function formatCodeDesc(item: unknown) {
  if (_.has(item, 'description')) {
    return _.get(item, 'description') || NA_PLUGIN_OUTPUT
  } else {
    return _.get(item, 'plugin_output') || NA_PLUGIN_OUTPUT
  }
}
function getStartTime(tag: unknown) {
  if (Array.isArray(tag)) {
    return _.get(tag.find(element => {return _.get(element, 'name') === 'HOST_START'}), 'text')
  } else {
    return _.get(tag, 'text')
  }
}
function cleanData(control: unknown[]): ExecJSONControl[] {
  let filteredControl = control as ExecJSONControl[]
  filteredControl.forEach(element => {
    if (element instanceof Object) {
      if (_.get(element.tags, 'cci').length === 0) {
        element.tags = _.omit(element.tags, 'cci')
      }
      if (_.get(element.tags, 'rid') === '') {
        element.tags = _.omit(element.tags, 'rid')
      }
      if (_.get(element.tags, 'stig_id') === '') {
        element.tags = _.omit(element.tags, 'stig_id')
      }
      if (element.descriptions !== undefined && element.descriptions !== null) {
        if (_.get(element.descriptions[0], 'data') === '') {
          element.descriptions = []
        }
      }
    }
  })
  return filteredControl
}
export class NessusResults {
  data: object
  customMapping?: MappedTransform<ExecJSON, LookupPath>
  constructor(nessusXml: string) {
    this.data = parseXml(nessusXml)
  }

  toHdf() {
    let results: ExecJSON[] = []
    policyName = _.get(this.data, 'NessusClientData_v2.Policy.policyName')
    version = _.get(_.get(this.data, 'NessusClientData_v2.Policy.Preferences.ServerPreferences.preference').find((element: object) => {return _.get(element, 'name') === 'sc_version'}), 'value') || ''
    if (Array.isArray(_.get(this.data, 'NessusClientData_v2.Report.ReportHost'))) {
      _.get(this.data, 'NessusClientData_v2.Report.ReportHost').forEach((element: object) => {
        let entry = new NessusMapper(element)
        if (this.customMapping !== undefined) {
          entry.setMappings(this.customMapping)
        }
        results.push(entry.toHdf())
      })
      return results
    } else {
      let result = new NessusMapper(_.get(this.data, 'NessusClientData_v2.Report.ReportHost'))
      if (this.customMapping !== undefined) {
        result.setMappings(this.customMapping)
      }
      return result.toHdf()
    }
  }
  setMappings(customMapping: MappedTransform<ExecJSON, LookupPath>) {
    this.customMapping = customMapping
  }
}

export class NessusMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON, LookupPath> = {
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
            descriptions: [{
              data: {transformer: getCheck},
              label: 'check'
            }],
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
                start_time: {path: '$.HostProperties.tag', transformer: getStartTime}
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(nessusJson: object) {
    super(nessusJson);
  }
}
