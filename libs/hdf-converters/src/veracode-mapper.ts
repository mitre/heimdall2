import parser from 'fast-xml-parser';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
const CWE_LENGTH = 'cwe.length';
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
  const text: string[] = [];
  if (_.has(input, 'recommendations.para')) {
    if (_.has(input, 'recommendations.para.text')) {
      text.push(`${_.get(input, 'recommendations.para.text')}`);
    }
    else {
      text.push(...(_.get(input, `recommendations.para`) as Record<string, unknown>[]).map( (value: Record<string,unknown>) => (_.get(value, 'text') as string)));
    }
  }
  if (_.has(input, 'recommendations.para.bulletitem')) {
    if (Array.isArray(_.get(input, `recommendations.para.bulletitem`))) {
      text.push(...(_.get(input, `recommendations.para.bulletitem`) as Record<string, unknown>[]).map( (value: Record<string, unknown>) => (_.get(value, 'text') as string)));
   }
  }
  return text.join('\n');
}

function formatDesc(input: Record<string, unknown>): string {
  const text = [];
  if (_.has(input, 'desc.para')) {
    if (_.has(input, 'desc.para.text')) {
      text.push(`${_.get(input, 'desc.para.text')}`);
    } else {
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
  const flawArr: string[] = [];
  if (Array.isArray(input)) {
    for(const value of input){
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
      flawArr.push(..._.get((input as Record<string, unknown>[])[0], 'staticflaws.flaw') as string[]);
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
  const flawArr: string[] = [];
  if (Array.isArray(input)) {
    for(const value of input) {
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
      flawArr.push(..._.get(input[0], 'staticflaws.flaw') as string[]);
    }
  }
 return flawArr.map((value) => _.get(value, 'sourcefile')).join('\n') 
}

function onetoone(input: any){
  const mapping: Record<string,unknown>[] = [];
  for(const component of _.get(input, 'vulnerable_components') as Record<string, unknown>[]){
    if(_.get(component, 'vulnerabilities') !== ''){
      for(const vuln of _.get(component, 'vulnerabilites.vulnerability') as Record<string, unknown>[]){
        _.set(vuln, 'component', _.omit(component, 'vulnerabilities'))
        mapping.push(vuln)
      }
    }
  }
  return mapping
}

function componenttransform(input: any) {
  const componentlist = [];
  for (const value of _.get(input, `component`)) {
    if (_.get(value,`vulnerabilities`) !== '') {
      componentlist.push(value);
    }
  }


  const vulnarr = [];
  for ( const component of componentlist) {
    if (Array.isArray(_.get(component, `vulnerabilities.vulnerability`))){
      for ( let vuln of  _.get(component, `vulnerabilities.vulnerability`)) {
        vulnarr.push(vuln);
      }
    }
    else {
      vulnarr.push( _.get(component, `vulnerabilities.vulnerability`));
    }
  }

  for (const vuln of vulnarr) {
    const components = [];
    let location = '';
    const currcve = _.get(vuln, `cve_id`);
    const cwe = [];
    cwe.push(_.get(vuln, `cwe_id`));
    const tag = CWE_NIST_MAPPING.nistFilter(cwe, DEFAULT_NIST_TAG);
    _.set(vuln, `nist`, tag);
    const impact = impactMapping(_.get(vuln, `severity`));
    _.set(vuln, `impact`, impact);
    for ( let component of componentlist) {
      let hascve = false;
      if(Array.isArray(_.get(component, `vulnerabilities.vulnerability`))){
        for (const compcve of _.get(component, `vulnerabilities.vulnerability`)) {
          if (_.get(compcve, 'cve_id') === currcve) {
            hascve = true;
            location +=` ${_.get(component,`file_paths.file_path.value`)}`;
            _.set(vuln, `paths`, location);
          }
        }
      }
      else{
        if (_.get(component, 'vulnerabilities.vulnerability.cve_id') === currcve) {
          hascve = true;
          location +=` ${_.get(component,`file_paths.file_path.value`)}`;
          _.set(vuln, `paths`, location);
        }

      }
      if (hascve === true) {
        const proxy = _.cloneDeep(component)
        components.push( _.omit(proxy, `vulnerabilities`));
      }
    }
    _.set(vuln, `components`, components);
  }
  return vulnarr
}


function parseXml(xml: string) {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };

  const parsedXML = parser.parse(xml, options);
  if (_.has(parsedXML, 'summaryreport')) {
    throw new Error('Current mapper does not accept summary reports');
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

export class VeracodeMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution & {passthrough: unknown}, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: ''
    },
    passthrough: {
      'xmlns:xsi': { path: 'detailedreport.xmlns:xsi'},
      xmlns: {path: 'detailedreport.xmlns'},
      'xsi:schemaLocation': {path:'detailedreport.xsi:schemaLocation'},
      report_format_version: {path: 'detailedreport.report_fomrat_version'},
      account_id: {path: 'detailedreport.account_id'},
      app_name: {path: 'detailedreport.app_name'},
      analysis_id: {path: 'detailedreport.analysis_id'},
      static_analysis_unit_id: {path: 'detailedreport.static_analysis_unit_id'},
      sandbox_id: {path: 'detailedreport.sandbox_id'},
      version: {path: 'detailedreport.version'},
      build_id: {path: 'detailedreport.build_id'},
      submitter: {path: 'detailedreport.submitter'},
      platform: {path: 'detailedreport.platform'},
      assurance_level: {path: 'detailedreport.assurance_level'},
      business_criticality: {path: 'detailedreport.business_criticality'},
      generation_date: {path: 'detailedreport.generation_data'},
      veracode_level: {path: 'detailedreport.veracode_level'},
      total_flaws: {path: 'detailedreport.total_flaws'},
      flaws_not_mitigated: {path: 'detailedreport.flaws_not_mitigated'},
      teams: {path: 'detailedreport.teams'},
      life_cycle_stage: {path: 'detailedreport.life_cycle_stage'},
      planned_deployment_date: {path: 'detailedreport.planned_deployment_date'},
      last_update_time: {path: 'detailedreport.last_update_time'},
      is_latest_build: {path: 'detailedreport.is_latest_build'},
      policy_name: {path: 'detailedreport.policy_name'},
      policy_version: {path: 'detailedreport.policy_version'},
      policy_compliance_status: {path: 'detailedreport.plolicy_compliance_status'},
      policy_rules_status: {path: 'detailedreport.plolicy_rules_status'},
      grace_period_expired: {path: 'detailedreport.grace_period_expired'},
      scan_overdue: {path: 'detailedreport.scan_overdue'},
      business_owner: {path: 'detailedreport.business_owner'},
      business_unit: {path: 'detailedreport.business_unit'},
      tags: {path: 'detailedreport.tags'},
      legacy_scan_engine: {path: 'detailedreport.legacy_scan_engtine'},
      custom_fields: {path: 'detailedreport.custom_fields'}

    },
    version: HeimdallToolsVersion,
    statistics: {
    },
    profiles: [
      {
        name: {path: 'detailedreport.policy_name'},
        version: {path: 'detailedreport.version'},
        title: {path: 'detailedreport.static-analysis.modules.module.name'},
        copyright: 'Copyright Veracode, Inc., 2014.',
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
            path: 'detailedreport.software_composition_analysis.vulnerable_components',
            pathTransform: componenttransform,
            id: {path: "cve_id"},
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
            results:[
              {
                path: 'components',
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: formatSCACodeDesc},
                start_time: {path: '$.detailedreport.first_build_submitted_date'}
              }
            ]
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
