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

function impactMappingcvss(severity: number): number {
  return severity/10;
}

function getVuln(input: unknown): Record<string, unknown>[] {
  if (!Array.isArray(input)) {
    input = [input];
  }
  return input as Record<string, unknown>[];
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
    ['Description', 'description']
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
    'cvss_score',
    'severity',
    'cwe_id',
    'first_found_date',
    'cve_summary',
    'severity_desc',
    'mitigation',
    'vulnerability_affects_policy_compliance'
  ];
  if (_.has(input, 'cve_id')) {
    flawDesc = `cve_id: ${_.get(input, 'cve_id')}\n`;
    flawDesc += _.compact(
      categories.map((value: string) => {
        if (_.has(input, value)) {
          return `${value}: ${_.get(input, value)}`;
        } else {
          return '';
        }
      })
    ).join('\n');
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

function controlMappingCve(): MappedTransform<
  ExecJSON.Control & ILookupPath,
  ILookupPath
> {
  return {
    id: {path: 'component_id'},
    title: {path: 'file_name'},
    desc: {path: 'description'},
    impact: {path: 'max_cvss_score', transformer: impactMappingcvss},
    refs: [
    ],
    tags: {
      sha1: {path:'sha1'},
      library_id: {path:'library_id'},
      library: {path:'library'},
      vendor: {path:'vendor'},
      component_affects_policy_compliance:{path:'compoenent_affects_policy_compliance'},
      added_date: {path: 'added_date'},
      nist: {
        path: 'cwe_id',
        transformer: (value: string | string[]) => {
          if (!Array.isArray(value)) {
            value = [value];
          }
          return CWE_NIST_MAPPING.nistFilter(value, DEFAULT_NIST_TAG);
        }
      },
      licenses:{path:'licenses'}
    },
    source_location: {
      ref: {path:'file_paths.file_path.value'}
    },
    results: [
      {
        path: 'vulnerabilities.vulnerability',
        pathTransform: getVuln,
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
              path: 'detailedreport.software_composition_analysis.vulnerable_components.component',
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
              // pathTransform: componentTransform,
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
