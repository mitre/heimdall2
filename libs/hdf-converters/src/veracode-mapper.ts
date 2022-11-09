import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform,
  parseXml
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {getCCIsForNISTTags} from './utils/global';
const STATIC_FLAWS = 'staticflaws.flaw';
const SEVERITY = 'detailedreport.severity';
const FILE_PATH_VALUE = 'file_paths.file_path.value';
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
  const cwes = [];
  let cwe = _.get(input, 'cwe');
  if (!Array.isArray(cwe)) {
    cwe = [cwe];
  }
  cwes.push(
    ...(cwe as Record<string, unknown>[]).map(
      (value: Record<string, unknown>) => _.get(value, 'cweid')
    )
  );
  return CWE_NIST_MAPPING.nistFilter(cwes as string[], DEFAULT_NIST_TAG);
}

function formatRecommendations(input: Record<string, unknown>): string {
  const text: string[] = [];
  if (_.has(input, 'recommendations.para')) {
    if (_.has(input, 'recommendations.para.text')) {
      text.push(`${_.get(input, 'recommendations.para.text')}`);
    } else {
      text.push(
        ...(
          _.get(input, `recommendations.para`) as Record<string, unknown>[]
        ).map(
          (value: Record<string, unknown>) => _.get(value, 'text') as string
        )
      );
    }
  }
  if (_.has(input, 'recommendations.para.bulletitem')) {
    if (Array.isArray(_.get(input, `recommendations.para.bulletitem`))) {
      text.push(
        ...(
          _.get(input, `recommendations.para.bulletitem`) as Record<
            string,
            unknown
          >[]
        ).map(
          (value: Record<string, unknown>) => _.get(value, 'text') as string
        )
      );
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
      text.push(
        ...(_.get(input, `desc.para`) as Record<string, unknown>[]).map(
          (value) => _.get(value, 'text')
        )
      );
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
    let cweInput = _.get(input, 'cwe');
    if (!Array.isArray(cweInput)) {
      cweInput = [cweInput];
    }
    text.push(
      ...(cweInput as Record<string, unknown>[]).map((cweinfo) => {
        let cwe = `CWE-${_.get(cweinfo, 'cweid')}: `;
        cwe += `${_.get(cweinfo, 'cwename')}`;
        cwe += categories
          .map((value: string) => {
            if (_.has(cweinfo, value)) {
              return `${value}: ${_.get(cweinfo, value)}\n`;
            } else {
              return '';
            }
          })
          .join('');
        return cwe;
      })
    );
  }
  return text.join('\n');
}

function formatCweDesc(input: Record<string, unknown>): string {
  const text = [];
  if (_.has(input, 'cwe')) {
    let cwe = _.get(input, 'cwe');
    if (!Array.isArray(cwe)) {
      cwe = [cwe];
    }
    text.push(
      ...(cwe as Record<string, unknown>[]).map(
        (value: Record<string, unknown>) =>
          `CWE-${_.get(value, 'cweid')}: ${_.get(
            value,
            'cwename'
          )} Description: ${_.get(value, 'description.text.text')}; `
      )
    );
  }
  return text.join('\n');
}

function getFlaws(input: unknown): Record<string, unknown>[] {
  const flawArr: Record<string, unknown>[] = [];
  if (!Array.isArray(input)) {
    input = [input];
  }
  for (const value of input as Record<string, unknown>[]) {
    // change name
    let staticFlaw = _.get(value, STATIC_FLAWS) as
      | Record<string, unknown>
      | Record<string, unknown>[];
    if (!Array.isArray(staticFlaw)) {
      staticFlaw = [staticFlaw];
    }
    flawArr.push(...staticFlaw);
  }
  return flawArr;
}
function formatCodeDesc(input: Record<string, unknown>[]): string {
  let flawDesc = '';
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
    ['Description', 'description'],
    ['Source File', 'sourcefile'],
    ['Scope', 'scope'],
    ['CIA Impact', 'cia_impact'],
    ['PCI Related', 'pcirelated'],
    ['Function Prototype', 'functionprototype'],
    ['Function Relative Location', 'functionrelativelocation']
  ];
  if (_.has(input, 'sourcefilepath')) {
    flawDesc = `Sourcefile Path: ${_.get(input, 'sourcefilepath')}\n`;
    flawDesc += categories
      .map(([title, name]) => {
        if (_.has(input, name)) {
          return `${title}: ${_.get(input, name)}\n`;
        } else {
          return '';
        }
      })
      .join('');
  }
  return flawDesc;
}

function formatSCACodeDesc(input: Record<string, unknown>): string {
  let flawDesc = '';
  const categories = [
    'sha1',
    'file_name',
    'max_cvss_score',
    'version',
    'library',
    'library_id',
    'vendor',
    'description',
    'added_date',
    'component_affects_policy_compliance'
  ];
  if (_.has(input, 'component_id')) {
    flawDesc = `component_id: ${_.get(input, 'component_id')}\n`;
    flawDesc += _.compact(
      categories.map((value: string) => {
        if (_.has(input, value)) {
          return `${value}: ${_.get(input, value)}`;
        } else {
          return '';
        }
      })
    ).join('\n');
    if (_.has(input, FILE_PATH_VALUE)) {
      flawDesc += `\nfile_path: ${_.get(input, FILE_PATH_VALUE)}\n`;
    }
  }
  return flawDesc;
}

function formatSourceLocation(input: Record<string, unknown>[]): string {
  const flawArr: string[] = [];
  if (!Array.isArray(input)) {
    input = [input];
  }
  for (const value of input) {
    if (!Array.isArray(_.get(value, STATIC_FLAWS))) {
      flawArr.push(_.get(value, STATIC_FLAWS) as string);
    } else {
      flawArr.push(...(_.get(value, STATIC_FLAWS) as string[]));
    }
  }
  return flawArr.map((value) => _.get(value, 'sourcefile')).join('\n');
}

function componentListCreate(input: unknown): Record<string, unknown>[] {
  const componentList: Record<string, unknown>[] = [];
  let component = _.get(input, 'component');
  if (!Array.isArray(component)) {
    component = [component];
  }
  for (const value of component as Record<string, unknown>[]) {
    if (_.get(value, `vulnerabilities`) !== '') {
      componentList.push(value);
    }
  }
  return componentList;
}

function componentTransform(input: unknown): Record<string, unknown>[] {
  const componentList: Record<string, unknown>[] = componentListCreate(input);

  const vulns: Record<string, unknown>[] = componentList
    .map((component) => {
      let vulnerability = _.get(component, 'vulnerabilities.vulnerability') as
        | Record<string, unknown>
        | Record<string, unknown>[];
      if (!Array.isArray(vulnerability)) {
        vulnerability = [vulnerability];
      }
      vulnerability = vulnerability.map((vuln) => ({
        ...vuln,
        components: [component]
      }));
      return vulnerability;
    })
    .flat()
    .reduce((acc: Record<string, unknown>[], cur: Record<string, unknown>) => {
      const cveId = _.get(cur, 'cve_id');
      const index = acc.findIndex(({cve_id}) => cveId === cve_id);
      if (index === -1) {
        return [...acc, cur];
      } else {
        (_.get(acc[index], 'components') as Record<string, unknown>[]).push(
          ...(_.get(cur, 'components') as Record<string, unknown>[])
        );
        return acc;
      }
    }, []);
  return vulns;
}

function controlMappingCve(): MappedTransform<
  ExecJSON.Control & ILookupPath,
  ILookupPath
> {
  return {
    id: {path: 'cve_id'},
    title: {path: 'cve_id'},
    desc: {path: 'cve_summary'},
    impact: {path: 'severity', transformer: impactMapping},
    refs: [],
    tags: {
      cwe: {path: 'cwe_id'},
      nist: {
        path: 'cwe_id',
        transformer: (value: string | string[]) => {
          if (!Array.isArray(value)) {
            value = [value];
          }

          return CWE_NIST_MAPPING.nistFilter(
            value.map((val: string) => val.substring(4)),
            DEFAULT_NIST_TAG
          );
        }
      }
    },
    source_location: {
      ref: {
        transformer: (vuln: Record<string, unknown>) =>
          (_.get(vuln, 'components') as Record<string, unknown>[])
            .map((comp: Record<string, unknown>) =>
              _.get(comp, FILE_PATH_VALUE)
            )
            .join('\n')
      }
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

function controlMappingCwe(
  severity: number
): MappedTransform<ExecJSON.Control & ILookupPath, ILookupPath> {
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
      cci: {
        transformer: (data: Record<string, unknown>) =>
          getCCIsForNISTTags(nistTag(data))
      },
      nist: {transformer: nistTag}
    },
    source_location: {
      ref: {
        path: 'cwe',
        transformer: formatSourceLocation
      }
    },
    results: [
      {
        path: 'cwe',
        pathTransform: getFlaws,
        status: ExecJSON.ControlResultStatus.Failed,
        code_desc: {transformer: formatCodeDesc},
        start_time: {path: '$.detailedreport.first_build_submitted_date'},
        message: {
          path: 'exploitability_adjustments.exploitability_adjustment.note'
        }
      }
    ]
  };
}

function componentPass(component: Record<string, unknown>) {
  const vulnList: string[] = [];
  _.set(component, 'control_ids', vulnList);
  if (_.get(component, 'vulnerabilities.vulnerability')) {
    if (!Array.isArray(_.get(component, 'vulnerabilities.vulnerability'))) {
      vulnList.push(
        _.get(component, 'vulnerabilities.vulnerability.cve_id') as string
      );
      _.set(component, 'control_ids', vulnList);
    } else {
      vulnList.push(
        ...(
          _.get(component, 'vulnerabilities.vulnerability') as Record<
            string,
            unknown
          >[]
        ).map(
          (vuln: Record<string, unknown>) => _.get(vuln, 'cve_id') as string
        )
      );
      _.set(component, 'control_ids', vulnList);
    }
  }
  return _.omit(component, 'vulnerabilities');
}

export class VeracodeMapper extends BaseConverter {
  originalData: unknown;
  defaultMapping(
    withRaw = false
  ): MappedTransform<ExecJSON.Execution & {passthrough: unknown}, ILookupPath> {
    return {
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion
      },
      passthrough: {
        components: {
          path: 'detailedreport.software_composition_analysis.vulnerable_components',
          transformer: (value: Record<string, unknown>) =>
            (_.get(value, 'component') as Record<string, unknown>[]).map(
              (component: Record<string, unknown>) => componentPass(component)
            )
        },
        auxiliary_data: [
          {
            name: 'veracode',
            data: {
              transformer: (value: Record<string, unknown>) =>
                _.omit(
                  value,
                  SEVERITY,
                  'detailedreport.software_composition_analysis'
                )
            }
          }
        ],
        ...(withRaw && {raw: this.originalData})
      },
      version: HeimdallToolsVersion,
      statistics: {},
      profiles: [
        {
          name: {path: 'detailedreport.policy_name'},
          version: {path: 'detailedreport.policy_version'},
          title: {path: 'detailedreport.static-analysis.modules.module.name'},
          supports: [],
          attributes: [],
          groups: [],
          status: 'loaded',
          controls: [
            ..._.range(0, 6).map((value) => ({
              path: `detailedreport.severity[${value}].category`,
              ...controlMappingCwe(5 - value)
            })),
            {
              path: 'detailedreport.software_composition_analysis.vulnerable_components',
              /* The original formal of vulnerable_components is the following:

              [
                {
                  component_data (including file path)
                  vulnerabliities{
                    vulnerability[
                      cve_data
                    ]
                  }
                }
                ...
              ]

              these need to be switched to be:
              [
                {
                  cve_data
                  filepaths
                  components [
                    {component_data}
                  ]
                }
              ]
              this is because in heimdall, in general each control should be the error itself, with tests
              being specific failure instances having the cve, being listed as the control since it is an issue
              and the component, where the issue happened as being a test is a better aproximation of this.
              format.
              */
              pathTransform: componentTransform,
              ...controlMappingCve()
            }
          ],
          sha256: ''
        }
      ]
    };
  }
  constructor(xml: string, withRaw = false) {
    const parsedXML = parseXml(xml);
    if (_.has(parsedXML, 'summaryreport')) {
      throw new Error('Current mapper does not accept summary reports');
    }
    const arrayedControls = (_.get(parsedXML, SEVERITY) as []).map(
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
    _.set(parsedXML, SEVERITY, arrayedControls);
    super(parsedXML);
    this.originalData = xml;
    this.setMappings(this.defaultMapping(withRaw));
  }
}
