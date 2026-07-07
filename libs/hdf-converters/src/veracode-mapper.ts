import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  DEFAULT_PROFILE_FIELDS,
  parseXml,
} from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import { getCCIsForNISTTags, HeimdallToolsVersion } from './utils/global';
import { createHeimdallPassthrough } from './utils/heimdall_metadata';
const STATIC_FLAWS = 'staticflaws.flaw';
const SEVERITY = 'detailedreport.severity';
const FILE_PATH_VALUE = 'file_paths.file_path.@_.value';
const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];
const IMPACT_MAPPING = new Map<string, number>([
  ['0', 0],
  ['1', 0.1],
  ['2', 0.3],
  ['3', 0.5],
  ['4', 0.7],
  ['5', 0.9],
]);

export class VeracodeMapper extends BaseConverter {
  originalData: unknown;
  constructor(xml: string, shouldIncludeRaw = false) {
    // the default textNodeName that we're using ('text') clobbers any attributes that also are named 'text' of which there are many in this format
    // the attribute group names are necessary since there are many times that attributes and inner tags share the same name within a tag (ex. 'vulnerabilities' the attribute is a count whereas as an inner tag it is an array detailing the vulnerabilities) where it seems that the attribute clobbers the inner tag
    const parsedXML = parseXml(xml, {
      attributesGroupName: '@_',
      textNodeName: 'text_',
    });
    if (_.has(parsedXML, 'summaryreport')) {
      throw new Error('Current mapper does not accept summary reports');
    }
    const arrayedControls = (_.get(parsedXML, SEVERITY) as []).map(
      (control: { category: unknown; level: string }) => {
        if (Array.isArray(control.category)) {
          return { category: control.category, level: control.level };
        }
        return control.category ? { category: [control.category], level: control.level } : { level: control.level };
      },
    );
    _.set(parsedXML, SEVERITY, arrayedControls);
    super(parsedXML);
    this.originalData = xml;
    this.setMappings(this.defaultMapping(shouldIncludeRaw));
  }

  defaultMapping(
    shouldIncludeRaw = false,
  ): MappedTransform<ExecJSON.Execution & { passthrough: unknown }, ILookupPath> {
    return {
      passthrough: {
        auxiliary_data: [
          {
            data: {
              transformer: (value: Record<string, unknown>) =>
                _.omit(
                  value,
                  SEVERITY,
                  'detailedreport.software_composition_analysis',
                ),
            },
            name: 'veracode',
          },
        ],
        components: {
          path: 'detailedreport.software_composition_analysis.vulnerable_components',
          transformer: (value: Record<string, unknown>) => {
            return (_.get(value, 'component') as Record<string, unknown>[])
              ? (
                _.get(value, 'component') as Record<string, unknown>[]
              ).map((component: Record<string, unknown>) =>
                componentPass(component),
              )
              : '';
          },
        },
        heimdall: { transformer: () => createHeimdallPassthrough('veracode').heimdall },
        ...(shouldIncludeRaw && { raw: this.originalData }),
      },
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion,
      },
      profiles: [
        {
          ...DEFAULT_PROFILE_FIELDS,
          controls: [
            ..._.range(0, 6).map(value => ({
              path: `detailedreport.severity[${value}].category`,
              ...controlMappingCwe(5 - value),
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
              ...controlMappingCve(),
            },
          ],
          name: { path: 'detailedreport.@_.policy_name' },
          title: { path: 'detailedreport.static-analysis.modules.module.@_.name' },
          version: { path: 'detailedreport.@_.policy_version' },
        },
      ],
      statistics: {},
      version: HeimdallToolsVersion,
    };
  }
}

function componentListCreate(input: unknown): Record<string, unknown>[] {
  const componentList: Record<string, unknown>[] = [];
  let component = _.get(input, 'component') as unknown as
    | Record<string, unknown>
    | Record<string, unknown>[];
  if (!Array.isArray(component)) {
    component = [component];
  }
  for (const value of component) {
    if (_.get(value, '@_.vulnerabilities') !== '0') {
      componentList.push(value);
    }
  }
  return componentList;
}

function componentPass(component: Record<string, unknown>) {
  const vulnList: string[] = [];
  _.set(component, 'control_ids', vulnList);
  if (_.get(component, 'vulnerabilities') !== '') {
    if (Array.isArray(_.get(component, 'vulnerabilities.vulnerability'))) {
      vulnList.push(
        ...(
          _.get(component, 'vulnerabilities.vulnerability') as Record<
            string,
            unknown
          >[]
        ).map(
          (vuln: Record<string, unknown>) => _.get(vuln, '@_.cve_id') as string,
        ),
      );
      _.set(component, 'control_ids', vulnList);
    } else {
      vulnList.push(
        _.get(component, 'vulnerabilities.vulnerability.@_.cve_id') as string,
      );
      _.set(component, 'control_ids', vulnList);
    }
  }
  return _.omit(component, 'vulnerabilities');
}

function componentTransform(input: unknown): Record<string, unknown>[] {
  const componentList: Record<string, unknown>[] = componentListCreate(input);

  const vulns: Record<string, unknown>[] = componentList
    .flatMap((component) => {
      let vulnerability = _.get(component, 'vulnerabilities.vulnerability') as
        | Record<string, unknown>
        | Record<string, unknown>[];
      if (!Array.isArray(vulnerability)) {
        vulnerability = [vulnerability];
      }
      vulnerability = vulnerability.map(vuln => ({
        ...vuln,
        components: [component],
      }));
      return vulnerability;
    })
    ;
  const grouped: Record<string, unknown>[] = [];
  for (const cur of vulns) {
    const cveId = _.get(cur, '@_.cve_id');
    const existing = grouped.find(vuln => cveId === _.get(vuln, '@_.cve_id'));
    if (existing) {
      (_.get(existing, 'components') as Record<string, unknown>[]).push(
        ...(_.get(cur, 'components') as Record<string, unknown>[]),
      );
    } else {
      grouped.push(cur);
    }
  }
  return grouped;
}

function controlMappingCve(): MappedTransform<
  ExecJSON.Control & ILookupPath,
  ILookupPath
> {
  return {
    desc: { path: '@_.cve_summary' },
    id: { path: '@_.cve_id' },
    impact: { path: '@_.severity', transformer: impactMapping },
    refs: [],
    results: [
      {
        code_desc: { transformer: formatSCACodeDesc },
        path: 'components',
        start_time: { path: '$.detailedreport.@_.first_build_submitted_date' },
        status: ExecJSON.ControlResultStatus.Failed,
      },
    ],
    source_location: {
      ref: {
        transformer: (vuln: Record<string, unknown>) =>
          (_.get(vuln, 'components') as Record<string, unknown>[])
            .map((comp: Record<string, unknown>) =>
              _.get(comp, FILE_PATH_VALUE),
            )
            .join('\n'),
      },
    },
    tags: {
      cwe: { path: '@_.cwe_id' },
      nist: {
        path: '@_.cwe_id',
        transformer: (value: string | string[]) => {
          if (!Array.isArray(value)) {
            value = [value];
          }

          return CWE_NIST_MAPPING.nistFilter(
            value.map((val: string) => val.slice(4)),
            DEFAULT_NIST_TAG,
          );
        },
      },
    },
    title: { path: '@_.cve_id' },
  };
}

function controlMappingCwe(
  severity: number,
): MappedTransform<ExecJSON.Control & ILookupPath, ILookupPath> {
  return {
    desc: { transformer: formatDesc },
    descriptions: [
      {
        data: { transformer: formatRecommendations },
        label: 'fix',
      },
    ],
    id: { path: '@_.categoryid' },
    impact: impactMapping(severity),
    refs: [],
    results: [
      {
        code_desc: { transformer: formatCodeDesc },
        message: { path: 'exploitability_adjustments.exploitability_adjustment.note' },
        path: 'cwe',
        pathTransform: getFlaws,
        start_time: { path: '$.detailedreport.@_.first_build_submitted_date' },
        status: ExecJSON.ControlResultStatus.Failed,
      },
    ],
    source_location: {
      ref: {
        path: 'cwe',
        transformer: formatSourceLocation,
      },
    },
    tags: {
      cci: {
        transformer: (data: Record<string, unknown>) =>
          getCCIsForNISTTags(nistTag(data)),
      },
      cweDescription: { transformer: formatCweDesc },
      cweid: { transformer: formatCweData },
      nist: { transformer: nistTag },
    },
    title: { path: '@_.categoryname' },
  };
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
    ['Function Relative Location', 'functionrelativelocation'],
  ];
  if (_.has(input, '@_.sourcefilepath')) {
    flawDesc = `Sourcefile Path: ${String(_.get(input, '@_.sourcefilepath'))}\n`;
    flawDesc += categories
      .map(([title, name]) => {
        if (_.has(input, `@_.${name}`)) {
          const nameVal = _.get(input, `@_.${name}`);
          return `${title}: ${String(nameVal)}\n`;
        }
        return '';
      })
      .join('');
  }
  return flawDesc;
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
    'owaspmobile',
  ];
  if (_.has(input, 'cwe')) {
    let cweInput = _.get(input, 'cwe');
    if (!Array.isArray(cweInput)) {
      cweInput = [cweInput];
    }
    text.push(
      ...(cweInput as Record<string, unknown>[]).map((cweinfo) => {
        let cwe = `CWE-${String(_.get(cweinfo, '@_.cweid'))}: `;
        cwe += String(_.get(cweinfo, '@_.cwename'));
        cwe += categories
          .map((value: string) => {
            if (_.has(cweinfo, `@_.${value}`)) {
              const val = _.get(cweinfo, `@_.${value}`);
              return `${value}: ${String(val)}\n`;
            }
            return '';
          })
          .join('');
        return cwe;
      }),
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
          `CWE-${String(_.get(value, '@_.cweid'))}: ${String(_.get(
            value,
            '@_.cwename',
          ))} Description: ${String(_.get(value, 'description.text.@_.text'))}; `,
      ),
    );
  }
  return text.join('\n');
}

function formatDesc(input: Record<string, unknown>): string {
  const text = [];
  if (_.has(input, 'desc.para')) {
    if (_.has(input, 'desc.para.@_.text')) {
      text.push(String(_.get(input, 'desc.para.@_.text')));
    } else {
      text.push(
        ...(_.get(input, 'desc.para') as Record<string, unknown>[]).map(
          value => _.get(value, '@_.text'),
        ),
      );
    }
  }
  return text.join('\n');
}

function formatRecommendations(input: Record<string, unknown>): string {
  const text: string[] = [];
  if (_.has(input, 'recommendations.para')) {
    if (_.has(input, 'recommendations.para.@_.text')) {
      text.push(String(_.get(input, 'recommendations.para.@_.text')));
    } else {
      text.push(
        ...(
          _.get(input, 'recommendations.para') as Record<string, unknown>[]
        ).map(
          (value: Record<string, unknown>) => _.get(value, '@_.text') as string,
        ),
      );
    }
  }
  if (_.has(input, 'recommendations.para.bulletitem') && Array.isArray(_.get(input, 'recommendations.para.bulletitem'))) {
    text.push(
      ...(
        _.get(input, 'recommendations.para.bulletitem') as Record<
          string,
          unknown
        >[]
      ).map(
        (value: Record<string, unknown>) => _.get(value, '@_.text') as string,
      ),
    );
  }
  return text.join('\n');
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
    'component_affects_policy_compliance',
  ];
  if (_.has(input, '@_.component_id')) {
    flawDesc = `component_id: ${String(_.get(input, '@_.component_id'))}\n`;
    flawDesc += _.compact(
      categories.map((value: string) => {
        if (_.has(input, `@_.${value}`)) {
          const val = _.get(input, `@_.${value}`);
          return `${value}: ${String(val)}`;
        }
        return '';
      }),
    ).join('\n');
    if (_.has(input, FILE_PATH_VALUE)) {
      flawDesc += `\nfile_path: ${String(_.get(input, FILE_PATH_VALUE))}\n`;
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
    if (Array.isArray(_.get(value, STATIC_FLAWS))) {
      flawArr.push(...(_.get(value, STATIC_FLAWS) as string[]));
    } else {
      flawArr.push(_.get(value, STATIC_FLAWS) as string);
    }
  }
  return flawArr.map(value => _.get(value, '@_.sourcefile')).join('\n');
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

function impactMapping(severity: number | string): number {
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
      (value: Record<string, unknown>) => _.get(value, '@_.cweid'),
    ),
  );
  return CWE_NIST_MAPPING.nistFilter(cwes as string[], DEFAULT_NIST_TAG);
}
