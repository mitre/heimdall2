/* eslint-disable prettier/prettier */
import parser from 'fast-xml-parser';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform,
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

function formatImpact(input: string): number {
  if (`${_.has(input, '*..severity')}`) {
    return Number(`${_.get(input, '*..severity')}`[0])
  }
  else {
    return 0
  }
}

function formatLineNumber(input: string): number {
  return parseInt(input, 10);
}

function combineRecommendations(input: unknown): string {
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

function combineDesc(input: unknown): string {
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

function combineCweData(input: unknown): string {
  const text = [];
  if (_.has(input, 'cwe')) {
    if (`${_.get(input, 'cwe.cweid')}` !== "undefined") {
      let cwe = 'CWE-'.concat(`${_.get(input, 'cwe.cweid')}`) + ': ';
      cwe += `${_.get(input, 'cwe.cwename')}`;
      if (`${_.get(input, 'cwe.pcirelated')}` !== 'undefined') {
        cwe += '; pcirelated: ' + `${_.get(input, 'cwe.pcirelated')}`
      }
      if (`${_.get(input, 'cwe.owasp')}` !== 'undefined') {
        cwe += '; owasp: ' + `${_.get(input, 'cwe.owasp')}`
      }
      if (`${_.get(input, 'cwe.owasp2013')}` !== 'undefined') {
        cwe += '; owasp2013: ' + `${_.get(input, 'cwe.owasp2013')}`
      }
      if (`${_.get(input, 'cwe.sans')}` !== 'undefined') {
        cwe += '; sans: ' + `${_.get(input, 'cwe.sans')}`
      }
      if (`${_.get(input, 'cwe.certc')}` !== 'undefined') {
        cwe += '; certc: ' + `${_.get(input, 'cwe.certc')}`
      }
      if (`${_.get(input, 'cwe.certcpp')}` !== 'undefined') {
        cwe += '; certcpp: ' + `${_.get(input, 'cwe.certcpp')}`
      }
      if (`${_.get(input, 'cwe.certjava')}` !== 'undefined') {
        cwe += '; certjava: ' + `${_.get(input, 'cwe.certjava')}`
      }
      if (`${_.get(input, 'cwe.owaspmobile')}` !== 'undefined') {
        cwe += '; owaspmobile: ' + `${_.get(input, 'cwe.owaspmobile')}`
      }
      text.push(cwe);
    }
    else {
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
  }
  return text.join('\n');
}

function combineCweDesc(input: unknown): string {
  const text = [];
  if (_.has(input, 'cwe')) {
    if (`${_.get(input, 'cwe.description')}` !== "undefined") {
      let cwe = 'CWE-'.concat(`${_.get(input, 'cwe.cweid')}`) + ': ';
      cwe += `${_.get(input, 'cwe.cwename')}` + ': ';
      cwe += `${_.get(input, 'cwe.description.text.text')}`
      text.push(cwe);
    }
    else {
      const len = Number(`${_.get(input, 'cwe.length')}`)
      for (let index = 0; index < len; index++) {
        let cwe = 'CWE-'.concat(`${_.get(input, 'cwe[' + index + '].cweid')}`) + ': ';
        cwe += `${_.get(input, 'cwe[' + index + '].cwename')}` + ': ';
        cwe += `${_.get(input, 'cwe[' + index + '].description.text.text')}`;
        text.push(cwe);
      }
    }
  }
  return text.join('\n');
}

function formatCodeDesc(input: unknown): string {
  const text = []
  if (`${_.get(input, 'sourcefilepath')}` !== "undefined") {
    let flawDesc = "Sourcefile Path: " + `${_.get(input, 'sourcefilepath')}` + ";"
    if (`${_.get(input, 'description')}` !== "undefined") {
      flawDesc += "Description: " + `${_.get(input, 'description')}`
    }
    if (`${_.get(input, 'description')}` !== "undefined") {
      flawDesc += "Description: " + `${_.get(input, 'description')}`
    }

    text.push(flawDesc);
  }
  else {
    const flawDesc = `${_.get(input, 'description')}`
    text.push(flawDesc)
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
  const arrayedControls = _.get(parsedXML, 'detailedreport.severity').map((control: {category: unknown, level: string}) => {
    if (Array.isArray(control.category)) {
      return {level: control.level, category: control.category}
    }
    else {
      return {level: control.level, category: [control.category]}
    }
  })
  _.set(parsedXML, 'detailedreport.severity', arrayedControls)
  return parsedXML
}

const resultsMapping = {
  status: ExecJSON.ControlResultStatus.Failed,
  code_desc: {transformer: formatCodeDesc},
  run_time: 0,
  start_time: {path: '$.detailedreport.first_build_submitted_date'},
  message: '',
  resource: ''
}

function controlMapping(level: number) {
  return {
    id: {path: 'categoryid'},
    title: {path: 'categoryname'},
    desc: {transformer: combineDesc},
    descriptions: [
      {
        data: {transformer: combineRecommendations},
        label: 'recommendations'
      }
    ],
    impact: {transformer: formatImpact},
    refs: [],
    tags: {
      cweid: {transformer: combineCweData},
      cweDescription: {transformer: combineCweDesc}
    },
    code: {path: ''},
    source_location: {
      ref: {path: ''},
      line: null
    },
    results: [
      {
        path: 'cwe.staticflaws.flaw',
        transformer: (text: unknown): any => {
          if (Array.isArray(text)) {
            return text
          }
          else {
            return [text]
          }
        },
        ...resultsMapping
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
            ...controlMapping(5)
          },
          {
            path: 'detailedreport.severity[1].category',
            ...controlMapping(4)
          },
          {
            path: 'detailedreport.severity[2].category',
            ...controlMapping(3)
          },
          {
            path: 'detailedreport.severity[3].category',
            ...controlMapping(2)
          },
          {
            path: 'detailedreport.severity[4].category',
            ...controlMapping(1)
          },
          {
            path: 'detailedreport.severity[5].category',
            ...controlMapping(0)
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
