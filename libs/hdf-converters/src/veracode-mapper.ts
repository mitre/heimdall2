/* eslint-disable prettier/prettier */
import { integer } from 'aws-sdk/clients/cloudfront';
import parser from 'fast-xml-parser';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
const CWE_LENGTH = 'cwe.length'
const SCA_VULNERABILITIES = 'detailedreport.software_composition_analysis.vulnerabilities['
const REPORT_SEVERITY = 'detailedreport.severity['
const SCA_CVES = 'detailedreport.software_composition_analysis.cves['
const CATEGORY = '].category['
const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['Si-2', 'RA-5'];
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['5', 0.9],
  ['4', 0.7],
  ['3', 0.5],
  ['2', 0.3],
  ['1', 0.1],
  ['0', 0.0]
]);

function impactMapping(severity: number): number {
  if (typeof severity === 'string' || typeof severity === 'number') {
    return IMPACT_MAPPING.get(severity.toString().toLowerCase()) || 0.1;
  } else {
    return 0.1;
  }
}

function nistTag(input: string): string[] {
  const len = Number(`${_.get(input, CWE_LENGTH)}`)
  const cwes = []
  for (let index = 0; index < len; index++) {
    cwes.push(`${_.get(input, 'cwe.cweid')}`)
  }
  return CWE_NIST_MAPPING.nistFilter(cwes, DEFAULT_NIST_TAG).concat(['Rev_4']);
}

function formatRecommendations(input: unknown): string {
  const text = [];
  if (_.has(input, 'recommendations.para')) {
    if (`${_.get(input, 'recommendations.para.text')}` !== "undefined") {
      text.push(
        `${_.get(input, 'recommendations.para.text')}`
      );
    }
    else {
      const len = Number(`${_.get(input, 'recommendations.para.length')}`)
      for (let index = 0; index < len; index++) {
        const topush = `recommendations.para[${index}].text`
        text.push(`${_.get(input, topush)}`)
      }
    }
  }
  if (_.has(input, 'recommendations.para.bulletitem')) {
    const len = Number(`${_.get(input, 'recommendations.para.bulletitem.length')}`)
    for (let index = 0; index < len; index++) {
      const bulletitem = `recommendations.para.bulletitem[${index}].text`
      text.push(`${_.get(input, bulletitem)}`)
    }
  }
  return text.join('\n');
}

function formatDesc(input: unknown): string {
  const text = [];
  if (_.has(input, 'desc.para')) {
    if (`${_.get(input, 'desc.para.text')}` !== "undefined") {
      text.push(
        `${_.get(input, 'desc.para.text')}`
      );
    }
    else {
      const len = Number(`${_.get(input, 'desc.para.length')}`)
      for (let index = 0; index < len; index++) {
        const paratext = `desc.para[${index}].text`
        text.push(`${_.get(input, paratext)}`)
      }
    }
  }
  return text.join('\n');
}

function cweloop(input: unknown, index:integer ): string{

  let inputstr = `cwe[${index}].cweid`
      let cwe = 'CWE-'.concat(`${_.get(input, inputstr)}`) + ': ';
      const cwename = `cwe[${index}].cwename`
      cwe += `${_.get(input, cwename)}`
      inputstr = `cwe[${index}].pcirelated`
      if (`${_.get(input, inputstr)}` !== 'undefined') {
        cwe += '; pcirelated: ' + `${_.get(input, inputstr)}`
      }
      inputstr = `cwe[${index}].owasp`
      if (`${_.get(input, inputstr)}` !== 'undefined') {
        cwe += '; owasp: ' + `${_.get(input, inputstr)}`
      }
      inputstr = `cwe[${index}].owasp2013`
      if (`${_.get(input, inputstr)}` !== 'undefined') {
        cwe += '; owasp2013: ' + `${_.get(input, inputstr)}`
      }
      inputstr = `cwe[${index}].sans`
      if (`${_.get(input, inputstr)}` !== 'undefined') {
        cwe += '; sans: ' + `${_.get(input, inputstr)}`
      }
      inputstr = `cwe[${index}].certc`
      if (`${_.get(input, inputstr)}` !== 'undefined') {
        cwe += '; certc: ' + `${_.get(input, inputstr)}`
      }
      inputstr = `cwe[${index}].certcpp`
      if (`${_.get(input, inputstr)}` !== 'undefined') {
        cwe += '; certcpp: ' + `${_.get(input, inputstr)}`
      }
      inputstr = `cwe[${index}].certjava`
      if (`${_.get(input, inputstr)}` !== 'undefined') {
        cwe += '; certjava: ' + `${_.get(input, inputstr)}`
      }
      inputstr = `cwe[${index}].owaspmobile`
      if (`${_.get(input, inputstr)}` !== 'undefined') {
        cwe += '; owaspmobile: ' + `${_.get(input, inputstr)}`
      }
      return cwe
}

function formatCweData(input: unknown): string {
  const text = [];
  if (_.has(input, 'cwe')) {
    const len = Number(`${_.get(input, CWE_LENGTH)}`)
    for (let index = 0; index < len; index++) {
      const cwe = cweloop(input, index)
      text.push(cwe);
    }
  }
  return text.join('\n');
}

function formatCweDesc(input: unknown): string {
  const text = [];
  if (_.has(input, 'cwe')) {
    const len = Number(`${_.get(input, CWE_LENGTH)}`)
    for (let index = 0; index < len; index++) {
      const cweid = `cwe[${index}].cweid`
      let cwe = 'CWE-'.concat(`${_.get(input, cweid)}`) + ': ';
      const cwename = `cwe[${index}].cwename`
      const desc = `cwe[${index}].description.text.text`
      cwe += `${_.get(input, cwename)}` + ': ';
      cwe += `${_.get(input, desc)}`;
      text.push(cwe);
    }
  }
  return text.join('\n');
}

function formatSourceLocation(input: unknown): string {
  const text = []
  const len = Number(`${_.get(input, 'length')}`)
  for (let index = 0; index < len; index++) {
    const source = `[${index}].sourcefile`
    text.push(`${_.get(input, source)}`)
  }
  return text.join('\n');
}

function stringifyCodeDesc(input: unknown): string {
  let flawDesc = "Sourcefile Path: " + `${_.get(input, 'sourcefilepath')}` + ";"
    if (`${_.get(input, 'line')}` !== "undefined") {
      flawDesc += "Line Number: " + `${_.get(input, 'line')}` + ";"
    }
    if (`${_.get(input, 'affects_policy_compliance')}` !== "undefined") {
      flawDesc += "Affect Policy Compliance: " + `${_.get(input, 'affects_policy_compliance')}` + ";"
    }
    if (`${_.get(input, 'remediationeffort')}` !== "undefined") {
      flawDesc += "Remediation Effort: " + `${_.get(input, 'remediationeffort')}` + ";"
    }
    if (`${_.get(input, 'exploitLevel')}` !== "undefined") {
      flawDesc += "Exploit Level: " + `${_.get(input, 'exploitLevel')}` + ";"
    }
    if (`${_.get(input, 'issueid')}` !== "undefined") {
      flawDesc += "Issue ID: " + `${_.get(input, 'issueid')}` + ";"
    }
    if (`${_.get(input, 'module')}` !== "undefined") {
      flawDesc += "Module: " + `${_.get(input, 'module')}` + ";"
    }
    if (`${_.get(input, 'type')}` !== "undefined") {
      flawDesc += "Type: " + `${_.get(input, 'type')}` + ";"
    }
    if (`${_.get(input, 'cweid')}` !== "undefined") {
      flawDesc += "CWE ID: " + `${_.get(input, 'cweid')}` + ";"
    }
    if (`${_.get(input, 'date_first_occurrence')}` !== "undefined") {
      flawDesc += "Date First Occurrence: " + `${_.get(input, 'date_first_occurrence')}` + ";"
    }
    if (`${_.get(input, 'cia_impact')}` !== "undefined") {
      flawDesc += "CIA Impact: " + `${_.get(input, 'cia_impact')}` + ";"
    }
    if (`${_.get(input, 'description')}` !== "undefined") {
      flawDesc += "Description: " + `${_.get(input, 'description')}`
    }
    return flawDesc
}

function formatCodeDesc(input: unknown): string {
  const text = []
  if (`${_.get(input, 'sourcefilepath')}` !== "undefined") {
    const flawDesc = stringifyCodeDesc(input)
    text.push(flawDesc);
  }
  return text.join('\n');
}

function SCAstringify(input:unknown): string {
  let flawDesc = "component_id: " + `${_.get(input, 'component_id')}` + ";"
  if (`${_.get(input, 'file_name')}` !== "undefined") {
    flawDesc += "file_name: " + `${_.get(input, 'file_name')}` + ";"
  }
  if (`${_.get(input, 'sha1')}` !== "undefined") {
    flawDesc += "sha1: " + `${_.get(input, 'sha1')}` + ";"
  }
  if (`${_.get(input, 'max_cvss_score')}` !== "undefined") {
    flawDesc += "max_cvss_score: " + `${_.get(input, 'max_cvss_score')}` + ";"
  }
  if (`${_.get(input, 'version')}` !== "undefined") {
    flawDesc += "version: " + `${_.get(input, 'version')}` + ";"
  }
  if (`${_.get(input, 'library')}` !== "undefined") {
    flawDesc += "library: " + `${_.get(input, 'library')}` + ";"
  }
  if (`${_.get(input, 'vendor')}` !== "undefined") {
    flawDesc += "vendor: " + `${_.get(input, 'vender')}` + ";"
  }
  if (`${_.get(input, 'description')}` !== "undefined") {
    flawDesc += "description: " + `${_.get(input, 'description')}` + ";"
  }
  if (`${_.get(input, 'added_date')}` !== "undefined") {
    flawDesc += "added_date: " + `${_.get(input, 'added_date')}` + ";"
  }
  if (`${_.get(input, 'component_affects_policy_compliance')}` !== "undefined") {
    flawDesc += "component_affects_policy_compliance: " + `${_.get(input, 'component_affects_policy_compliance')}` + ";"
  }
  if (`${_.get(input, 'file_paths.file_path.value')}` !== "undefined") {
    flawDesc += "file_path: " + `${_.get(input, 'file_paths.file_path.value')}` + ";"
  }
  return flawDesc
}

function formatSCACodeDesc(input: unknown): string {
  const text = []
  if (`${_.get(input, 'component_id')}` !== "undefined") {
    const flawDesc = SCAstringify(input)
    text.push(flawDesc);
  }
  return text.join('\n');
}
function staticflawmanip(parsedXML: any, i: integer, k: integer){
  let flawArr: any[] = []
  let inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe`
  if (Array.isArray(_.get(parsedXML, inputstr))) {
    inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe.length`
    for (let j = 0; j < Number(_.get(parsedXML, inputstr)); j++) {
      inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe[${j}].staticflaws.flaw`
      if (!Array.isArray(_.get(parsedXML, inputstr))) {
        flawArr.push(_.get(parsedXML, inputstr))
      }
      else {
        inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe[${j}].staticflaws.flaw`
        flawArr = flawArr.concat(_.get(parsedXML, inputstr))
      }
      // maybe change this to unset
      inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe[${j}].staticflaws`
      _.set(parsedXML, inputstr, null)
    }
  }
  else {
    inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe`
    const cwes = [_.get(parsedXML, inputstr)]
    _.set(parsedXML, inputstr, cwes)
    inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe[0].staticflaws.flaw`
    if (!Array.isArray(_.get(parsedXML, inputstr))) {
      flawArr.push(_.get(parsedXML, inputstr))
    }
    else {
      flawArr = flawArr.concat(_.get(parsedXML, inputstr))
    }
    // maybe change this to unset
    inputstr =  `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe[0].staticflaws`
    _.set(parsedXML, inputstr , null)
  }
  const flaws = {flaw: flawArr}
  inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].staticflaws`
  _.set(parsedXML, inputstr, flaws)
  return parsedXML
}

function staticflawmover(parsedXML: any){
  for (let i = 0; i < 6; i++) {
    let inputstr1 = `${REPORT_SEVERITY}${i}].category[0]`
    if (_.has(parsedXML, inputstr1)) {
      inputstr1 = `${REPORT_SEVERITY}${i}].category.length`
      for (let k = 0; k <  Number(_.get(parsedXML, inputstr1)); k++) {
        _.set(parsedXML, '', staticflawmanip(parsedXML, i, k) )
      }
    }
  }
  return parsedXML
}

function setcomponents(parsedXML: any){
  for (let m = 0; m < Number(_.get(parsedXML, 'detailedreport.software_composition_analysis.cves.length')); m++){
    const components = []
    let location = ''
    const currcve = _.get(parsedXML, `${SCA_CVES}${m}].cve_id`)
    const cwe = []
    cwe.push(_.get(parsedXML, `${SCA_CVES}${m}].cwe_id`))
    const tag = CWE_NIST_MAPPING.nistFilter(cwe, DEFAULT_NIST_TAG).concat(['Rev_4']);
    _.set(parsedXML, `${SCA_CVES}${m}].nist`, tag)
    const impact = impactMapping(_.get(parsedXML, `${SCA_CVES}${m}].severity`))
    _.set(parsedXML, `${SCA_CVES}${m}].impact`, impact)
    for (let l = 0; l <  Number(_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities.length')); l++) {
        let hascve = false
        for(let n = 0; n < Number(_.get(parsedXML, `${SCA_VULNERABILITIES}${l}].cves.length`)); n++){
          const cve = _.get(parsedXML, `${SCA_VULNERABILITIES}${l}].cves[${n}]`)
          if (cve === currcve){
            hascve = true
            location += ' ' +  _.get(parsedXML, `${SCA_VULNERABILITIES}${l}].file_paths.file_path`)
            _.set(parsedXML, `${SCA_CVES}${m}].paths`, location)
          }
        }
        if(hascve === true){
          const proxy = _.cloneDeep(parsedXML)
          let omitted = _.omit(proxy, `${SCA_VULNERABILITIES}${l}].vulnerabilities`)
          omitted = _.omit(omitted, `${SCA_VULNERABILITIES}${l}].cves`)
          components.push(_.get(omitted, `${SCA_VULNERABILITIES}${l}]`))
        }
    }
    _.set(parsedXML, `${SCA_CVES}${m}].components`, components)
  }
  return parsedXML
}


function cvesformatter(parsedXML: any){
  const vulnarr = []
  for (let k = 0; k <  Number(_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities.length')); k++) {
    const cves = []
    for (let l = 0; l <  Number(_.get(parsedXML, `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability.length`)); l++) {
        cves.push(_.get(parsedXML, `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability[${l}].cve_id`))
        vulnarr.push(_.get(parsedXML, `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability[${l}]`))
    }
    const cvei = _.get(parsedXML, `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability.cve_id`)
    if(`${cvei}` !== "undefined"){
      cves.push(cvei)
      vulnarr.push(_.get(parsedXML, `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability`))
    }
    _.set(parsedXML, `${SCA_VULNERABILITIES}${k}].cves`, cves)
  }
  _.set(parsedXML, 'detailedreport.software_composition_analysis.cves', vulnarr)
  return parsedXML
}
function parseXml(xml: string) {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };

  const parsedXML = parser.parse(xml, options);
  if (_.has(parsedXML, 'summaryreport')) {
    throw new Error('Current mapper does not accept sumarry reports');
  }
  const arrayedControls = _.get(parsedXML, 'detailedreport.severity').map((control: {category: unknown, level: string}) => {
    if (Array.isArray(control.category)) {
      return {level: control.level, category: control.category}
    }
    else if (!control.category) {
      return {level: control.level}
    }
    else {
      return {level: control.level, category: [control.category]}
    }
  })
  _.set(parsedXML, 'detailedreport.severity', arrayedControls)

  // Sets cwe and flaw keys to be arrays
  // Moves staticflaws up one level for control mapping
  _.set(parsedXML, '', staticflawmover(parsedXML))


  // Moves cves up one level for control mapping
  const len = _.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerable_components.component.length')
  const cveArr = []
  for (let i = 0; i < len; i++) {
    if (_.get(parsedXML, `detailedreport.software_composition_analysis.vulnerable_components.component[${i}].vulnerabilities`) !== "") {
      cveArr.push(_.get(parsedXML, `detailedreport.software_composition_analysis.vulnerable_components.component[${i}]`))
    }
  }
  _.set(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities', cveArr)

//format software_composition_analysis for hdf
_.set(parsedXML, '', cvesformatter(parsedXML))

_.set(parsedXML, '', setcomponents(parsedXML))

  return parsedXML
}

function controlMappingCwe(severity: number) {
  return {
    id: {path: 'categoryid'},
    title: {path: 'categoryname'},
    desc: {transformer: formatDesc},
    descriptions: [
      {
        data: {transformer: formatRecommendations},
        label: 'fix'
      }
    ],
    impact: impactMapping(severity),
    refs: [],
    tags: {
      cweid: {transformer: formatCweData},
      cweDescription: {transformer: formatCweDesc},
      nist: {transformer: nistTag}
    },
    code: {path: ''},
    source_location: {
      ref: {
        path: 'staticflaws.flaw',
        transformer: formatSourceLocation
      },
      line: 0
    },
    results: [
      {
        path: 'staticflaws.flaw',
        status: ExecJSON.ControlResultStatus.Failed,
        code_desc: {transformer: formatCodeDesc},
        run_time: 0,
        start_time: {path: '$.detailedreport.first_build_submitted_date'},
        message: 'exploitability_adjustments.exploitability_adjustment.note',
        resource: ''
      }
    ]
  }
}

function controlMappingCve() {
    return {
      id: {path: 'cve_id'},
    title: {path: 'cve_id'},
    desc: {path: 'cve_summary'},
    impact: {path: 'impact'},
    refs: [],
    tags: {
      cwe: {path: 'cwe_id'},
      nist: {path: 'nist'}
    },
    code: {path: ''},
    source_location: {
      ref: {path: 'paths'},
      line: 0
    },
    results: [
      {
        path: 'components',
        status: ExecJSON.ControlResultStatus.Failed,
        code_desc: {transformer:formatSCACodeDesc},
        run_time: 0,
        start_time: {path: '$.detailedreport.first_build_submitted_date'},
        message: '',
        resource: ''
      }
    ]
  }
}


export class VeracodeMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: ''
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: 0
    },
    profiles: [
      {
        name: {path: 'detailedreport.policy_name'},
        version: {path: 'detailedreport.static-analysis.version'},
        title: {path: 'detailedreport.static-analysis.modules.module.name'},
        maintainer: null,
        summary: null,
        license: null,
        copyright: 'Copyright Veracode, Inc., 2014.',
        copyright_email: null,
        supports: [],
        attributes: [],
        depends: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'detailedreport.severity[0].category',
            ...controlMappingCwe(5)
          },
          {
            path: 'detailedreport.severity[1].category',
            ...controlMappingCwe(4)
          },
          {
            path: 'detailedreport.severity[2].category',
            ...controlMappingCwe(3)
          },
          {
            path: 'detailedreport.severity[3].category',
            ...controlMappingCwe(2)
          },
          {
            path: 'detailedreport.severity[4].category',
            ...controlMappingCwe(1)
          },
          {
            path: 'detailedreport.severity[5].category',
            ...controlMappingCwe(0)
          },
          {
            path: 'detailedreport.software_composition_analysis.cves',
            ...controlMappingCve()
          },
        ],
        sha256: ''
      }
    ]
  };
  constructor(xml: string) {
    super(parseXml(xml));
  }
  setMappings(
    customMappings: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    super.setMappings(customMappings);
  }
}
