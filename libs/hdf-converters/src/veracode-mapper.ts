import {integer} from 'aws-sdk/clients/cloudfront';
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

function nistTag(input: string): string[] {
  const cwes = _.get(input, 'cwe').map((value: any) => _.get(value, 'cweid'));
  return CWE_NIST_MAPPING.nistFilter(cwes, DEFAULT_NIST_TAG);
}

function formatRecommendations(input: Record<string, unknown>): string {
  let text: any[] = [];
  if (_.has(input, 'recommendations.para')) {
    if (_.has(input, 'recommendations.para.text')) {
      text.push(`${_.get(input, 'recommendations.para.text')}`);
    } 
    else {
      text = (_.get(input, `recommendations.para`) as Record<string, unknown>[]).map( function(value: any) { 
        return _.get(value, 'text')
      });
    }
  }
  if (_.has(input, 'recommendations.para.bulletitem')) {
    if (_.has(input, 'recommendations.para.bulletitem.text')) {
      text.push(`${_.get(input, 'recommendations.para.bulletitem.text')}`);
      
    }
    else {
      const text2 = (_.get(input, `recommendations.para.bulletitem`) as Record<string, unknown>[]).map( function(value: any) { 
        return _.get(value, 'text')
      });
      text = text.concat(text2)
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
      const len = Number(`${_.get(input, 'desc.para.length')}`);
      for (let index = 0; index < len; index++) {
        const paratext = `desc.para[${index}].text`;
        text.push(`${_.get(input, paratext)}`);
      }
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
    const len = Number(`${_.get(input, CWE_LENGTH)}`);
    for (let index = 0; index < len; index++) {
      let cwe = `CWE-${_.get(input, `cwe[${index}].cweid`)}: `;
      const cwename = `cwe[${index}].cwename`;
      cwe += `${_.get(input, cwename)}`;
      cwe += categories.map(function(value: string) {
        if (_.has(input, `cwe[${index}].${value}`)) {
            return `; ${value}: ${_.get(input, `cwe[${index}].${value}`)}`;
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
    const len = Number(`${_.get(input, CWE_LENGTH)}`);
    for (let index = 0; index < len; index++) {
      const cweid = `cwe[${index}].cweid`;
      let cwe = 'CWE-'.concat(`${_.get(input, cweid)}`) + ': ';
      const cwename = `cwe[${index}].cwename`;
      const desc = `cwe[${index}].description.text.text`;
      cwe += `${_.get(input, cwename)}` + ': ';
      cwe += `${_.get(input, desc)}`;
      text.push(cwe);
    }
  }
  return text.join('\n');
}

function formatSourceLocation(input: Record<string, unknown>): string {
  const text = [];
  const len = Number(`${_.get(input, 'length')}`);
  for (let index = 0; index < len; index++) {
    const source = `[${index}].sourcefile`;
    text.push(`${_.get(input, source)}`);
  }
  return text.join('\n');
}

function formatCodeDesc(input: Record<string, unknown>): string {
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
    flawDesc = `Sourcefile Path: ${_.get(input, 'sourcefilepath')};`;

    flawDesc += categories.map(function(value: string[]) {
      if (_.has(input, value[1])) {
          return `${value[0]}: ${_.get(input, value[1])};`;
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
          return `${value}: ${_.get(input, value)};`;
      }
      else{
          return ''
      }
    }).join('');
    if (_.has(input, 'file_paths.file_path.value')) {
      flawDesc += `file_path: ${_.get(input, 'file_paths.file_path.value')};`;
    }
  }
  return flawDesc;
}

function staticflawmanip(parsedXML: any, i: integer, k: integer) {
  let flawArr: any[] = [];
  let inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe`;
  if (Array.isArray(_.get(parsedXML, inputstr))) {
    inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe.length`;
    for (let j = 0; j < Number(_.get(parsedXML, inputstr)); j++) {
      inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe[${j}].staticflaws.flaw`;
      if (!Array.isArray(_.get(parsedXML, inputstr))) {
        flawArr.push(_.get(parsedXML, inputstr));
      } else {
        inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe[${j}].staticflaws.flaw`;
        flawArr = flawArr.concat(_.get(parsedXML, inputstr));
      }
      // maybe change this to unset
      inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe[${j}].staticflaws`;
      _.set(parsedXML, inputstr, null);
    }
  } else {
    inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe`;
    const cwes = [_.get(parsedXML, inputstr)];
    _.set(parsedXML, inputstr, cwes);
    inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe[0].staticflaws.flaw`;
    if (!Array.isArray(_.get(parsedXML, inputstr))) {
      flawArr.push(_.get(parsedXML, inputstr));
    } else {
      flawArr = flawArr.concat(_.get(parsedXML, inputstr));
    }
    // maybe change this to unset
    inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].cwe[0].staticflaws`;
    _.set(parsedXML, inputstr, null);
  }
  const flaws = {flaw: flawArr};
  inputstr = `${REPORT_SEVERITY}${i}${CATEGORY}${k}].staticflaws`;
  _.set(parsedXML, inputstr, flaws);
  return parsedXML;
}

function staticflawmover(parsedXML: any) {
  for (let i = 0; i < 6; i++) {
    let inputstr1 = `${REPORT_SEVERITY}${i}].category[0]`;
    if (_.has(parsedXML, inputstr1)) {
      inputstr1 = `${REPORT_SEVERITY}${i}].category.length`;
      for (let k = 0; k < Number(_.get(parsedXML, inputstr1)); k++) {
        _.set(parsedXML, '', staticflawmanip(parsedXML, i, k));
      }
    }
  }
  return parsedXML;
}

function setcomponents(parsedXML: any) {
  for (
    let m = 0;
    m <
    Number(
      _.get(
        parsedXML,
        'detailedreport.software_composition_analysis.cves.length'
      )
    );
    m++
  ) {
    const components = [];
    let location = '';
    const currcve = _.get(parsedXML, `${SCA_CVES}${m}].cve_id`);
    const cwe = [];
    cwe.push(_.get(parsedXML, `${SCA_CVES}${m}].cwe_id`));
    const tag = CWE_NIST_MAPPING.nistFilter(cwe, DEFAULT_NIST_TAG).concat([
      'Rev_4'
    ]);
    _.set(parsedXML, `${SCA_CVES}${m}].nist`, tag);
    const impact = impactMapping(_.get(parsedXML, `${SCA_CVES}${m}].severity`));
    _.set(parsedXML, `${SCA_CVES}${m}].impact`, impact);
    for (
      let l = 0;
      l <
      Number(
        _.get(
          parsedXML,
          'detailedreport.software_composition_analysis.vulnerabilities.length'
        )
      );
      l++
    ) {
      let hascve = false;
      for (
        let n = 0;
        n < Number(_.get(parsedXML, `${SCA_VULNERABILITIES}${l}].cves.length`));
        n++
      ) {
        const cve = _.get(parsedXML, `${SCA_VULNERABILITIES}${l}].cves[${n}]`);
        if (cve === currcve) {
          hascve = true;
          location +=
            ' ' +
            _.get(
              parsedXML,
              `${SCA_VULNERABILITIES}${l}].file_paths.file_path`
            );
          _.set(parsedXML, `${SCA_CVES}${m}].paths`, location);
        }
      }
      if (hascve === true) {
        const proxy = _.cloneDeep(parsedXML);
        let omitted = _.omit(
          proxy,
          `${SCA_VULNERABILITIES}${l}].vulnerabilities`
        );
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
  for (
    let k = 0;
    k <
    Number(
      _.get(
        parsedXML,
        'detailedreport.software_composition_analysis.vulnerabilities.length'
      )
    );
    k++
  ) {
    const cves = [];
    for (
      let l = 0;
      l <
      Number(
        _.get(
          parsedXML,
          `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability.length`
        )
      );
      l++
    ) {
      cves.push(
        _.get(
          parsedXML,
          `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability[${l}].cve_id`
        )
      );
      vulnarr.push(
        _.get(
          parsedXML,
          `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability[${l}]`
        )
      );
    }
    const cvei = _.get(
      parsedXML,
      `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability.cve_id`
    );
    if (
      _.has(
        parsedXML,
        `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability.cve_id`
      )
    ) {
      cves.push(cvei);
      vulnarr.push(
        _.get(
          parsedXML,
          `${SCA_VULNERABILITIES}${k}].vulnerabilities.vulnerability`
        )
      );
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

  // Sets cwe and flaw keys to be arrays
  // Moves staticflaws up one level for control mapping
  _.set(parsedXML, '', staticflawmover(parsedXML));
  // Moves cves up one level for control mapping
  const len = _.get(
    parsedXML,
    'detailedreport.software_composition_analysis.vulnerable_components.component.length'
  );
  const cveArr = [];
  for (let i = 0; i < len; i++) {
    if (
      _.get(
        parsedXML,
        `detailedreport.software_composition_analysis.vulnerable_components.component[${i}].vulnerabilities`
      ) !== ''
    ) {
      cveArr.push(
        _.get(
          parsedXML,
          `detailedreport.software_composition_analysis.vulnerable_components.component[${i}]`
        )
      );
    }
  }
  _.set(
    parsedXML,
    'detailedreport.software_composition_analysis.vulnerabilities',
    cveArr
  );

  //format software_composition_analysis for hdf
  _.set(parsedXML, '', cvesformatter(parsedXML));
  _.set(parsedXML, '', setcomponents(parsedXML));

  return parsedXML;
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
  };
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
        code_desc: {transformer: formatSCACodeDesc},
        run_time: 0,
        start_time: {path: '$.detailedreport.first_build_submitted_date'},
        message: '',
        resource: ''
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
          }
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
