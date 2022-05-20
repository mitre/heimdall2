/* eslint-disable prettier/prettier */
import { String } from 'aws-sdk/clients/acm';
import parser from 'fast-xml-parser';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import fs from 'fs';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform,
  parseHtml
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';

const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5'];
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
  const len = Number(`${_.get(input, 'cwe.length')}`)
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
        text.push(`${_.get(input, 'recommendations.para[' + index + '].text')}`)
      }
    }
  }
  if (_.has(input, 'recommendations.para.bulletitem')) {
    const len = Number(`${_.get(input, 'recommendations.para.bulletitem.length')}`)
    for (let index = 0; index < len; index++) {
      text.push(`${_.get(input, 'recommendations.para.bulletitem[' + index + '].text')}`)
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
        text.push(`${_.get(input, 'desc.para[' + index + '].text')}`)
      }
    }
  }
  return text.join('\n');
}

function formatCweData(input: unknown): string {
  const text = [];
  if (_.has(input, 'cwe')) {
    const len = Number(`${_.get(input, 'cwe.length')}`)
    for (let index = 0; index < len; index++) {
      let cwe = 'CWE-'.concat(`${_.get(input, 'cwe[' + index + '].cweid')}`) + ': ';
      cwe += `${_.get(input, 'cwe[' + index + '].cwename')}`
      if (`${_.get(input, 'cwe[' + index + '].pcirelated')}` !== 'undefined') {
        cwe += '; pcirelated: ' + `${_.get(input, 'cwe[' + index + '].pcirelated')}`
      }
      if (`${_.get(input, 'cwe[' + index + '].owasp')}` !== 'undefined') {
        cwe += '; owasp: ' + `${_.get(input, 'cwe[' + index + '].owasp')}`
      }
      if (`${_.get(input, 'cwe[' + index + '].owasp2013')}` !== 'undefined') {
        cwe += '; owasp2013: ' + `${_.get(input, 'cwe[' + index + '].owasp2013')}`
      }
      if (`${_.get(input, 'cwe[' + index + '].sans')}` !== 'undefined') {
        cwe += '; sans: ' + `${_.get(input, 'cwe[' + index + '].sans')}`
      }
      if (`${_.get(input, 'cwe[' + index + '].certc')}` !== 'undefined') {
        cwe += '; certc: ' + `${_.get(input, 'cwe[' + index + '].certc')}`
      }
      if (`${_.get(input, 'cwe[' + index + '].certcpp')}` !== 'undefined') {
        cwe += '; certcpp: ' + `${_.get(input, 'cwe[' + index + '].certcpp')}`
      }
      if (`${_.get(input, 'cwe[' + index + '].certjava')}` !== 'undefined') {
        cwe += '; certjava: ' + `${_.get(input, 'cwe[' + index + '].certjava')}`
      }
      if (`${_.get(input, 'cwe[' + index + '].owaspmobile')}` !== 'undefined') {
        cwe += '; owaspmobile: ' + `${_.get(input, 'cwe[' + index + '].owaspmobile')}`
      }
      text.push(cwe);
    }
  }
  return text.join('\n');
}

function formatCweDesc(input: unknown): string {
  const text = [];
  if (_.has(input, 'cwe')) {
    const len = Number(`${_.get(input, 'cwe.length')}`)
    for (let index = 0; index < len; index++) {
      let cwe = 'CWE-'.concat(`${_.get(input, 'cwe[' + index + '].cweid')}`) + ': ';
      cwe += `${_.get(input, 'cwe[' + index + '].cwename')}` + ': ';
      cwe += `${_.get(input, 'cwe[' + index + '].description.text.text')}`;
      text.push(cwe);
    }  
  }
  return text.join('\n');
}

function formatSourceLocation(input: unknown): string {
  const text = []
  const len = Number(`${_.get(input, 'length')}`)
  for (let index = 0; index < len; index++) {
    text.push(`${_.get(input, '[' + index + '].sourcefile')}`)
  }
  return text.join('\n');
}

function formatCodeDesc(input: unknown): string {
  const text = []
  if (`${_.get(input, 'sourcefilepath')}` !== "undefined") {
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
    text.push(flawDesc);
  }
  return text.join('\n');
}

function formatSCACodeDesc(input: unknown): string {
  const text = []
  if (`${_.get(input, 'cve_id')}` !== "undefined") {
    let flawDesc = "cve_id: " + `${_.get(input, 'cve_id')}` + ";"
    if (`${_.get(input, 'cvss_score')}` !== "undefined") {
      flawDesc += "cvss_score: " + `${_.get(input, 'cvss_score')}` + ";"
    }
    if (`${_.get(input, 'severity')}` !== "undefined") {
      flawDesc += "severity: " + `${_.get(input, 'severity')}` + ";"
    }
    if (`${_.get(input, 'first_found_date')}` !== "undefined") {
      flawDesc += "first_found_date: " + `${_.get(input, 'first_found_date')}` + ";"
    }
    if (`${_.get(input, 'cve_summary')}` !== "undefined") {
      flawDesc += "cve_summary: " + `${_.get(input, 'cve_summary')}` + ";"
    }
    if (`${_.get(input, 'severity_desc')}` !== "undefined") {
      flawDesc += "severity_desc: " + `${_.get(input, 'severity_desc')}` + ";"
    }
    if (`${_.get(input, 'mititgation')}` !== "undefined") {
      flawDesc += "mitigation: " + `${_.get(input, 'mitigation')}` + ";"
    }
    if (`${_.get(input, 'vulnerability_affects_policy_compliance')}` !== "undefined") {
      flawDesc += "vulnerability_affects_policy_compliance: " + `${_.get(input, 'vulnerability_affects_policy_compliance')}` + ";"
    }
    text.push(flawDesc);
  }
  return text.join('\n');
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
  for (let i = 0; i < 6; i++) {
    if (_.has(parsedXML, 'detailedreport.severity[' + i + '].category[0]')) {
      for (let k = 0; k <  Number(_.get(parsedXML, 'detailedreport.severity[' + i + '].category.length')); k++) {
        let flawArr: any[] = []
        if (Array.isArray(_.get(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe'))) {
          for (let j = 0; j < Number(_.get(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe.length')); j++) {
            if (!Array.isArray(_.get(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe[' + j + '].staticflaws.flaw'))) {
              flawArr.push(_.get(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe[' + j + '].staticflaws.flaw'))
            }
            else {
              flawArr = flawArr.concat(_.get(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe[' + j + '].staticflaws.flaw'))
            }
            // maybe change this to unset
            _.set(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe[' + j + '].staticflaws', null)
          }
        }
        else {
          const cwes = [_.get(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe')]
          _.set(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe', cwes)
          if (!Array.isArray(_.get(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe[0].staticflaws.flaw'))) {
            flawArr.push(_.get(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe[0].staticflaws.flaw'))
          }
          else {
            flawArr = flawArr.concat(_.get(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe[0].staticflaws.flaw'))
          }
          // maybe change this to unset
          _.set(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].cwe[0].staticflaws', null)
        }
        const flaws = {flaw: flawArr}
        _.set(parsedXML, 'detailedreport.severity[' + i + '].category[' + k + '].staticflaws', flaws)
      }
    }
  }

  // Moves cves up one level for control mapping
  const len = _.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerable_components.component.length')
  const cveArr = []
  for (let i = 0; i < len; i++) {
    if (_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerable_components.component[' + i + '].vulnerabilities') !== "") {
      cveArr.push(_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerable_components.component[' + i + ']'))
    }
  }
  _.set(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities', cveArr)

//format software_composition_analysis for hdf, includes moving a severity level, along with tags for cves and nist tags up to component (software_composition_analysis.vulnerabilities)
//also turn software_composition_anlysis.vulnerabilities[].vulnberailities.vulnerability into an array in all instances were there is only one cve
let vulnarr = []  
for (let k = 0; k <  Number(_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities.length')); k++) {
    let cves = []
    for (let l = 0; l <  Number(_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities[' + k + '].vulnerabilities.vulnerability.length')); l++) {
        cves.push(_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities[' + k + '].vulnerabilities.vulnerability[' + l + '].cve_id'))
        vulnarr.push(_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities[' + k + '].vulnerabilities.vulnerability[' + l + ']'))
    }
    if(`${_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities[' + k + '].vulnerabilities.vulnerability.cve_id')}` !== "undefined"){
      cves.push(_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities[' + k + '].vulnerabilities.vulnerability.cve_id'))
      vulnarr.push(_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities[' + k + '].vulnerabilities.vulnerability'))
    }
    _.set(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities[' + k + '].cves', cves)
  }
  _.set(parsedXML, 'detailedreport.software_composition_analysis.cves', vulnarr)
 
  for (let m = 0; m < Number(_.get(parsedXML, 'detailedreport.software_composition_analysis.cves.length')); m++){
    let components = []
    let currcve = _.get(parsedXML, 'detailedreport.software_composition_analysis.cves[' + m + '].cve_id')
    for (let l = 0; l <  Number(_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities.length')); l++) {
        let hascve = false
        for(let n = 0; n < Number(_.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities[' + l + '].cves.length')); n++){
          let cve = _.get(parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities[' + l + '].cves[' + n + ']')
          if (cve == currcve){
            hascve = true
          }
        }
        if(hascve == true){
          let proxy = _.cloneDeep(parsedXML)
          let omitted = _.omit(proxy, 'detailedreport.software_composition_analysis.vulnerabilities[' + l + '].vulnerabilities')
          omitted = _.omit(omitted, 'detailedreport.software_composition_analysis.vulnerabilities[' + l + '].cves')
          components.push(_.get(omitted, 'detailedreport.software_composition_analysis.vulnerabilities[' + l + ']'))
        }
    }
    _.set(parsedXML, 'detailedreport.software_composition_analysis.cves['+ m + '].components', components)
  }
  fs.writeFileSync('sample_jsons/veracode_mapper/output.json', JSON.stringify(parsedXML))
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
      id: {path: 'component_id'},
    title: {path: 'library'},
    desc: {path: 'description'},
    impact: {path: 'severity'},
    refs: [],
    tags: {
      cves: {path: 'cves'},
      nist: {path: 'nist'}
    },
    code: {path: ''},
    source_location: {
      ref: {
        path: 'file_name',
      },
      line: 0
    },
    results: [
      {
        path: 'vulnerabilities.vulnerability',
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
