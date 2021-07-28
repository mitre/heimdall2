import parser from 'fast-xml-parser';
import {
  ExecJSON
} from 'inspecjs';
import _ from 'lodash';
import { version as HeimdallToolsVersion } from '../package.json';
import { MappedTransform, LookupPath, BaseConverter, generateHash } from './base-converter'
import { NessusPluginsNistMapping } from './mappings/NessusPluginsNistMapping'
import path from 'path'

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

function getPolicyName(_input: object) {
  return 'Nessus ' + policyName
}
function getVersion(_input: object) {
  return version
}
function formatDesc(issue: object) {
  let desc = []
  desc.push(`Plugin Family: ${_.get(issue, 'pluginFamily')}`)
  desc.push(`Port: ${_.get(issue, 'port')}`)
  desc.push(`Protocol: ${_.get(issue, 'protocol')}`)
  return desc.join('; ') + ';'
}
function nistTag(item: object) {
  let family = _.get(item, 'pluginFamily')
  let id = _.get(item, 'pluginID')
  return NESSUS_PLUGINS_NIST_MAPPING.nistFilter(family, id, DEFAULT_NIST_TAG)
}
function impactMapping(severity: string) {
  return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0;
}
function getStatus(item: object) {
  if (_.has(item, 'cm:compliance-result')) {
    if (_.get(item, 'cm:compliance-result') === 'PASSED') {
      return ExecJSON.ControlResultStatus.Passed
    } else {
      return ExecJSON.ControlResultStatus.Failed
    }
  } else {
    return ExecJSON.ControlResultStatus.Failed
  }
}
function formatCodeDesc(item: object) {
  if (_.has(item, 'description')) {
    return _.get(item, 'description') || NA_PLUGIN_OUTPUT
  } else {
    return _.get(item, 'plugin_output') || NA_PLUGIN_OUTPUT
  }
}
function getStartTime(tag: object) {
  if (Array.isArray(tag)) {
    return _.get(tag.find(element => { return _.get(element, 'name') === 'HOST_START' }), 'text')
  } else {
    return _.get(tag, 'text')
  }
}

export class NessusResults {
  data: object
  customMapping?: MappedTransform<ExecJSON.Execution, LookupPath>
  constructor(nessusXml: string) {
    this.data = parseXml(nessusXml)
  }

  toHdf() {
    let results: ExecJSON.Execution[] = []
    policyName = _.get(this.data, 'NessusClientData_v2.Policy.policyName')
    version = _.get(_.get(this.data, 'NessusClientData_v2.Policy.Preferences.ServerPreferences.preference').find((element: object) => { return _.get(element, 'name') === 'sc_version' }), 'value') || ''
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
  setMappings(customMapping: MappedTransform<ExecJSON.Execution, LookupPath>) {
    this.customMapping = customMapping
  }
}

export class NessusMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, LookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: { path: 'name' }
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: { transformer: getPolicyName },
        version: { transformer: getVersion },
        title: { transformer: getPolicyName },
        maintainer: null,
        summary: { transformer: getPolicyName },
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
            path: 'ReportItem',
            key: 'id',
            tags: {
              nist: { transformer: nistTag },
              rid: { path: 'pluginID' }
            },
            descriptions: [],
            refs: [],
            source_location: {},
            id: { path: 'pluginID' },
            title: { path: 'pluginName' },
            desc: { transformer: formatDesc },
            impact: { path: 'severity', transformer: impactMapping },
            code: '',
            results: [
              {
                status: { transformer: getStatus },
                code_desc: { transformer: formatCodeDesc },
                run_time: 0,
                start_time: { path: '$.HostProperties.tag', transformer: getStartTime }
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
