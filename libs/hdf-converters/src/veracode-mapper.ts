import parser from 'fast-xml-parser';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
const CWE_LENGTH = 'cwe.length';
const SCA_VULNERABILITIES =
  'detailedreport.software_composition_analysis.vulnerabilities[';
const REPORT_SEVERITY = 'detailedreport.severity[';
const SCA_CVES = 'detailedreport.software_composition_analysis.cves[';
const CATEGORY = '].category[';
const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['5', 0.9],
  ['4', 0.7],
  ['3', 0.5],
  ['2', 0.3],
  ['1', 0.1],
  ['0', 0.0]
]);

function impactMapping(severity: number): number {
  return IMPACT_MAPPING.get(severity.toString()) || 0.1;
}

function nistTag(input: Record<string, unknown>): string[] {
  const cwes = []
  if (Array.isArray(_.get(input, 'cwe'))){
    cwes.push(...(_.get(input, 'cwe') as Record<string, unknown>[]).map((value: Record<string, unknown>) => _.get(value, 'cweid')));
  }
  else {
    cwes.push([_.get(input, 'cwe')].map((value) =>  _.get(value, 'cweid')));
  }
  return CWE_NIST_MAPPING.nistFilter(cwes as string[], DEFAULT_NIST_TAG);
}

function formatRecommendations(input: Record<string, unknown>): string {
  let text: string[] = [];
  if (_.has(input, 'recommendations.para')) {
    if (_.has(input, 'recommendations.para.text')) {
      text.push(`${_.get(input, 'recommendations.para.text')}`);
    }
    else {
      text.push(...(_.get(input, `recommendations.para`) as Record<string, unknown>[]).map( (value: Record<string,unknown>) => (_.get(value, 'text') as string)));
    }
  }
  if (_.has(input, 'recommendations.para.bulletitem')) {
    text.push(...(_.get(input, `recommendations.para.bulletitem`) as Record<string, unknown>[]).map( (value: Record<string, unknown>) => (_.get(value, 'text') as string)));
  }
  return text.join('\n');
}

function formatDesc(input: Record<string, unknown>): string {
  const text = [];
  if (_.has(input, 'desc.para')) {
    if (_.has(input, 'desc.para.text')) {
      text.push(`${_.get(input, 'desc.para.text')}`);
    } else {
      const len = Number(`${_.get(input, 'desc.para.length')}`);
      text.push(...(_.get(input, `desc.para`) as Record<string, unknown>[]).map((value) => _.get(value, 'text')))
    }
  }
  return text.join('\n');
}

function formatCweData(input: Record<string, unknown>): string {
  const text = [];
  const categories = [
    'pcrirelated',
    'owasp',
    'owasp2013',
    'sans',
    'certc',
    'certccp',
    'certjava',
    'owaspmobile'
  ];
  if (_.has(input, 'cwe')) {
    if (Array.isArray(_.get(input, 'cwe'))){ 
      const len = Number(`${_.get(input, CWE_LENGTH)}`);
      for (let index = 0; index < len; index++) {
        let cwe = `CWE-${_.get(input, `cwe[${index}].cweid`)}: `;
        const cwename = `cwe[${index}].cwename`;
        cwe += `${_.get(input, cwename)}`;
        cwe += categories.map((value: string)  => {
          if (_.has(input, `cwe[${index}].${value}`)) {
              return `${value}: ${_.get(input, `cwe[${index}].${value}`)}\n`;
          }
          else{
              return ''
          }
        }).join('');
        text.push(cwe);
      }
    }
    else {
      let cwe = `CWE-${_.get(input, `cwe.cweid`)}: `;
        const cwename = `cwe.cwename`;
        cwe += `${_.get(input, cwename)}`;
        cwe += categories.map((value: string)  => {
          if (_.has(input, `cwe.${value}`)) {
              return `${value}: ${_.get(input, `cwe.${value}`)}\n`;
          }
          else{
              return ''
          }
        }).join('');
        text.push(cwe);
    }
  }
  return text.join('\n');
}

function formatCweDesc(input: Record<string, unknown>): string {
  const text = [];
  if (_.has(input, 'cwe')) {
    if(Array.isArray(_.get(input, 'cwe'))){
      text.push(...((_.get(input, 'cwe') as Record<string,unknown>[]).map((value: Record<string,unknown>) =>  
      `CWE-${_.get(value, 'cweid')}: ${_.get(value, 'cwename')} Description: ${_.get(value, 'description.text.text')}; `
      )));
    }
    else{
      text.push(...([(_.get(input, 'cwe') as Record<string,unknown>)].map((value: Record<string,unknown>) =>  
      `CWE-${_.get(value, 'cweid')}: ${_.get(value, 'cwename')} Description: ${_.get(value, 'description.text.text')}; `
      )));
    }
  }
  return text.join('\n');
}

function getFlaws(input: unknown): string[] {
  let flawArr: string[] = [];
  if (Array.isArray(input)) {
    for(let value of input){
      if (!Array.isArray(_.get(value, 'staticflaws.flaw'))) {
        flawArr.push(_.get(value, 'staticflaws.flaw') as string);
      } 
      else {
        flawArr.push(..._.get(value, 'staticflaws.flaw') as string[]);
      }
    }
  } else {
    input = [input];
    if (!Array.isArray(_.get((input as Record<string, unknown>[])[0], 'staticflaws.flaw'))) {
      flawArr.push(_.get((input as Record<string, unknown>[])[0], 'staticflaws.flaw') as string);
    } else {
      flawArr = flawArr.concat(_.get((input as Record<string, unknown>[])[0], 'staticflaws.flaw') as string[]);
    }
  }
  return flawArr
}
function formatCodeDesc(input: Record<string, unknown>[]): string {
  let flawDesc = ''
  const categories = [
    ['Line Number', 'line'],
    ['Affect Policy Compliance', 'affects_policy_compliance'],
    ['Remediation Effort', 'remediationeffort'],
    ['Exploit level', 'exploitLevel'],
    ['Issue ID', 'issueid'],
    ['Module', 'module'],
    ['Type', 'type'],
    ['CWE ID', 'cweid'],
    ['Date First Occurence', 'date_first_occurence'],
    ['CIA Impact', 'cia_impact'],
    ['Description', 'description']
  ];
  if (_.has(input, 'sourcefilepath')) {
    flawDesc = `Sourcefile Path: ${_.get(input, 'sourcefilepath')}\n`;

    flawDesc += categories.map(function([title, name]) {
      if (_.has(input, name)) {
          return `${title}: ${_.get(input, name)}\n`;
      }
      else{
          return ''
      }
    }).join('');
  }
  return flawDesc;
}

function formatSCACodeDesc(input: Record<string, unknown>): string {
  let flawDesc = ''
  const categories = [
    'sha1',
    'max_cvss_score',
    'version',
    'library',
    'vendor',
    'descritpion',
    'added_date',
    'component_affects_policy_compliance'
  ];
  if (_.has(input, 'component_id')) {
    flawDesc = `component_id: ${_.get(input, 'component_id')};`;
    flawDesc += categories.map(function(value: string) {
      if (_.has(input, value)) {
          return `${value}: ${_.get(input, value)}`;
      }
      else{
          return ''
      }
    }).join('\n');
    if (_.has(input, 'file_paths.file_path.value')) {
      flawDesc += `file_path: ${_.get(input, 'file_paths.file_path.value')}`;
    }
  }
  return flawDesc;
}

function formatSourceLocation(input: Record<string,unknown>[]): string {
  let flawArr: string[] = [];
  if (Array.isArray(input)) {
    for(let value of input) {
        if (!Array.isArray(_.get(value, 'staticflaws.flaw'))) {
          flawArr.push(_.get(value, 'staticflaws.flaw') as string);
        } 
        else {
          flawArr.push(..._.get(value, 'staticflaws.flaw') as string[]);
        }
    }
  } else {
    input = [input];
    if (!Array.isArray(_.get(input[0], 'staticflaws.flaw'))) {
      flawArr.push(_.get(input[0], 'staticflaws.flaw') as string);
    } else {
      flawArr = flawArr.concat(_.get(input[0], 'staticflaws.flaw') as string[]);
    }
  }
 return flawArr.map((value) => _.get(value, 'sourcefile')).join('\n') 
}

function onetoone(input: any): Record<string, unknown>[][]{
  const mapping: Record<string,unknown>[][] = [];
  for(let component of _.get(input, 'vulnerable_components')){
    if(_.get(component, 'vulnerabilities') != ''){
      for(let vuln of _.get(component, 'vulnerabilites.vulnerability')){
        const entry = []
        entry.push(_.omit(component, 'vulnerabilities'))
        entry.push(vuln)
        mapping.push(entry)
      }
    }
  }
   return mapping
}

function setcomponents(parsedXML: any) {
  for (let m = 0; m < Number(_.get( parsedXML,'detailedreport.software_composition_analysis.cves.length'));m++) {
    const components = [];
    let location = '';
    const currcve = _.get(parsedXML, `${SCA_CVES}${m}].cve_id`);
    const cwe = [];
    cwe.push(_.get(parsedXML, `${SCA_CVES}${m}].cwe_id`));
    const tag = CWE_NIST_MAPPING.nistFilter(cwe, DEFAULT_NIST_TAG);
    _.set(parsedXML, `${SCA_CVES}${m}].nist`, tag);
    const impact = impactMapping(_.get(parsedXML, `${SCA_CVES}${m}].severity`));
    _.set(parsedXML, `${SCA_CVES}${m}].impact`, impact);
    for ( let l = 0; l < Number( _.get( parsedXML, 'detailedreport.software_composition_analysis.vulnerabilities.length'));l++) {
      let hascve = false;
      for (let n = 0;n < Number(_.get(parsedXML, `${SCA_VULNERABILITIES}${l}].cves.length`)); n++) {
        const cve = _.get(parsedXML, `${SCA_VULNERABILITIES}${l}].cves[${n}]`);
        if (cve === currcve) {
          hascve = true;
          location +=' ' + _.get(parsedXML,`${SCA_VULNERABILITIES}${l}].file_paths.file_path.value`);
          _.set(parsedXML, `${SCA_CVES}${m}].paths`, location);
        }
      }
      if (hascve === true) {
        const proxy = _.cloneDeep(parsedXML);
        let omitted = _.omit(proxy,`${SCA_VULNERABILITIES}${l}].vulnerabilities`);
        omitted = _.omit(omitted, `${SCA_VULNERABILITIES}${l}].cves`);
        components.push(_.get(omitted, `${SCA_VULNERABILITIES}${l}]`));
      }
    }
    _.set(parsedXML, `${SCA_CVES}${m}].components`, components);
  }
  return parsedXML;
}

function cvesformatter(parsedXML: any) {
  const vulnarr = [];
  for ( let k = 0; k < Number( _.get( parsedXML,'detailedreport.software_composition_analysis.vulnerabilities.length')); k++) {
    const cves = [];
    for ( let l = 0; l < Number( _.get(parsedXML, `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability.length`));l++) {
      cves.push(_.get(  parsedXML,`${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability[${l}].cve_id`));
      vulnarr.push(_.get(parsedXML,`${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability[${l}]`));
    }
    const cvei = _.get(parsedXML, `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability.cve_id`);
    if ( _.has(parsedXML,`${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability.cve_id`)) {
      cves.push(cvei);
      vulnarr.push( _.get(parsedXML,`${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability`));
    }
    _.set(parsedXML, `${SCA_VULNERABILITIES}${k}].cves`, cves);
  }
  _.set(
    parsedXML,
    'detailedreport.software_composition_analysis.cves',
    vulnarr
  );
  return parsedXML;
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
  const arrayedControls = _.get(parsedXML, 'detailedreport.severity').map(
    (control: {category: unknown; level: string}) => {
      if (Array.isArray(control.category)) {
        return {level: control.level, category: control.category};
      } else if (!control.category) {
        return {level: control.level};
      } else {
        return {level: control.level, category: [control.category]};
      }
    }
  );
  _.set(parsedXML, 'detailedreport.severity', arrayedControls);

  // Moves cves up one level for control mapping
  const len = _.get(
    parsedXML,
    'detailedreport.software_composition_analysis.vulnerable_components.component.length'
  );
  const cveArr = [];
  for (let i = 0; i < len; i++) {
    if (_.get(parsedXML,`detailedreport.software_composition_analysis.vulnerable_components.component[${i}].vulnerabilities`) !== '') {
      cveArr.push(_.get( parsedXML,`detailedreport.software_composition_analysis.vulnerable_components.component[${i}]`));
    }
  }
  _.set(parsedXML,'detailedreport.software_composition_analysis.vulnerabilities',cveArr);

  //format software_composition_analysis for hdf
  _.set(parsedXML, '', cvesformatter(parsedXML));
  _.set(parsedXML, '', setcomponents(parsedXML));

  return parsedXML;
}

function controlMappingCwe(severity: number): MappedTransform<ExecJSON.Control & ILookupPath, ILookupPath> {
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
    source_location: {
      ref: {
        path: 'cwe',
        transformer: formatSourceLocation
      },
    },
    results: [
      {
        path: 'cwe',
        pathTransform: getFlaws,
        status: ExecJSON.ControlResultStatus.Failed,
        code_desc: {transformer: formatCodeDesc},
        start_time: {path: '$.detailedreport.first_build_submitted_date'},
        message: {path: 'exploitability_adjustments.exploitability_adjustment.note'}
      }
    ]
  };
}
function controlMappingCve(): MappedTransform<ExecJSON.Control & ILookupPath, ILookupPath> {
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
    source_location: {
      ref: {path: 'paths'}
    },
    results: [
      {
        path: 'components',
        status: ExecJSON.ControlResultStatus.Failed,
        code_desc: {transformer: formatSCACodeDesc},
        start_time: {path: '$.detailedreport.first_build_submitted_date'}
      }
    ]
  };
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
    },
    profiles: [
      {
        name: {path: 'detailedreport.policy_name'},
        version: {path: 'detailedreport.version'},
        title: {path: 'detailedreport.static-analysis.modules.module.name'},
        maintainer: null,
        summary: null,
        license: null,
        copyright: 'Copyright Veracode, Inc., 2014.',
        copyright_email: null,
        supports: [],
        attributes: [],
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
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(xml: string) {
    super(parseXml(xml));
  }
}
