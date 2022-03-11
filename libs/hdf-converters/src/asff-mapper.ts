import {encode} from 'html-entities';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {AwsConfigMapping} from './mappings/AwsConfigMapping';
import {AwsConfigMappingItem} from './mappings/AwsConfigMappingItem';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['CRITICAL', 0.9],
  ['HIGH', 0.7],
  ['MEDIUM', 0.5],
  ['LOW', 0.3],
  ['INFORMATIONAL', 0.0]
]);

const DEFAULT_NIST_TAG = ['SA-11', 'RA-5'];
const SEVERITY_LABEL = 'Severity.Label';
const COMPLIANCE_STATUS = 'Compliance.Status';

const FROM_ASFF_TYPES_SLASH_REPLACEMENT = /{{{SLASH}}}/gi; // The "Types" field of ASFF only supports a maximum of 2 slashes, and will get replaced with this text. Note that the default AWS CLI doesn't support UTF-8 encoding

// Use to extract control set specific data
const FIREWALL_MANAGER_REGEX =
  /arn:.+:securityhub:.+:.*:product\/aws\/firewall-manager/;
const PROWLER_REGEX = /arn:.+:securityhub:.+:.*:product\/prowler\/prowler/;
const SECURITYHUB_REGEX = /arn:.+:securityhub:.+:.*:product\/aws\/securityhub/;
const TRIVY_REGEX =
  /arn:.+:securityhub:.+:.*:product\/aquasecurity\/aquasecurity/;

// eslint-disable-next-line @typescript-eslint/ban-types
const PRODUCT_ARN_MAPPING: Map<RegExp, Record<string, Function>> = new Map([
  [FIREWALL_MANAGER_REGEX, getFirewallManager()],
  [PROWLER_REGEX, getProwler()],
  [SECURITYHUB_REGEX, getSecurityHub()],
  [TRIVY_REGEX, getTrivy()]
]);

type ExternalProductHandlerOutputs =
  | (() => string | number)
  | (() => string | undefined)
  | number
  | string
  | string[];

function replaceTypesSlashes(data: {Findings: {Types?: string[]}[]}) {
  const findings = data.Findings.map((finding) => {
    return {
      ...finding,
      Types: finding.Types?.map((type) =>
        type.replace(FROM_ASFF_TYPES_SLASH_REPLACEMENT, '/')
      )
    };
  });
  return {Findings: findings};
}

function fixFileInput(asffJson: string) {
  try {
    let output = JSON.parse(asffJson);
    if (!_.has(output, 'Findings')) {
      if (Array.isArray(output)) {
        output = {Findings: output};
      } else {
        output = {Findings: [output]};
      }
    }
    return replaceTypesSlashes(output);
  } catch {
    // Prowler gives us JSON Lines format but we need regular JSON
    const fixedInput = `[${asffJson
      .trim()
      .replace(/}\n/g, '},\n')
      .replace(/\},\n\$/g, '')}]`;
    let output = JSON.parse(fixedInput);
    if (!_.has(output, 'Findings')) {
      if (Array.isArray(output)) {
        output = {Findings: output};
      } else {
        output = {Findings: [output]};
      }
    }
    // Pre-process all types fields, fixes
    return replaceTypesSlashes(output);
  }
}
// eslint-disable-next-line @typescript-eslint/ban-types
function getFirewallManager(): Record<string, Function> {
  const findingId = (finding: unknown): string =>
    encode(_.get(finding, 'Title'));
  const productName = (findings: unknown[]): string =>
    encode(
      `${_.get(
        findings[0],
        'ProductFields.aws/securityhub/CompanyName'
      )} ${_.get(findings[0], 'ProductFields.aws/securityhub/ProductName')}`
    );
  return {
    findingId,
    productName
  };
}
// eslint-disable-next-line @typescript-eslint/ban-types
function getProwler(): Record<string, Function> {
  const subfindingsCodeDesc = (finding: unknown): string =>
    encode(_.get(finding, 'Description'));
  const findingId = (finding: unknown): string => {
    const generatorId = _.get(finding, 'GeneratorId');
    const hyphenIndex = generatorId.indexOf('-');
    return encode(generatorId.slice(hyphenIndex + 1));
  };
  const productName = (findings: unknown[]): string =>
    encode(_.get(findings[0], 'ProductFields.ProviderName'));
  const desc = (): string => ' ';
  return {
    subfindingsCodeDesc,
    findingId,
    productName,
    desc
  };
}
// eslint-disable-next-line @typescript-eslint/ban-types
function getSecurityHub(): Record<string, Function> {
  const FINDING_STANDARDS_CONTROL_ARN = 'ProductFields.StandardsControlArn';
  const correspondingControl = (controls: unknown[], finding: unknown) => {
    return controls.find(
      (control) =>
        _.get(control, 'StandardsControlArn') ===
        _.get(finding, FINDING_STANDARDS_CONTROL_ARN)
    );
  };
  const supportingDocs = (standards: string[] | undefined) => {
    let controls: null | unknown[];
    try {
      if (Array.isArray(standards)) {
        controls = standards
          .map((standard) => _.get(JSON.parse(standard), 'Controls'))
          .flat();
      } else {
        controls = null;
      }
    } catch (error) {
      throw new Error(
        `Invalid supporting docs for Security Hub:\nException: ${error}`
      );
    }
    const AWS_CONFIG_MAPPING = new AwsConfigMapping();
    return {
      controls,
      awsConfigMapping: AWS_CONFIG_MAPPING
    };
  };
  const findingId = (
    finding: unknown,
    {controls = null}: {controls: unknown[] | null}
  ) => {
    let output: string;
    let control;
    if (
      controls !== null &&
      (control = correspondingControl(controls, finding)) !== null
    ) {
      output = _.get(control, 'ControlId');
    } else if (_.has(finding, 'ProductFields.ControlId')) {
      // check if aws
      output = _.get(finding, 'ProductFields.ControlId');
    } else if (_.has(finding, 'ProductFields.RuleId')) {
      // check if cis
      output = _.get(finding, 'ProductFields.RuleId');
    } else {
      output = _.get(finding, 'GeneratorId').split('/').slice(-1)[0];
    }
    return encode(output);
  };
  const findingImpact = (
    finding: unknown,
    {controls = null}: {controls: unknown[] | null}
  ) => {
    let impact: string | number;
    let control;
    if (
      controls !== null &&
      (control = correspondingControl(controls, finding)) !== null
    ) {
      impact = _.get(control, 'SeverityRating');
    } else {
      // severity is required, but can be either 'label' or 'normalized' internally with 'label' being preferred.  other values can be in here too such as the original severity rating.
      impact =
        _.get(finding, SEVERITY_LABEL) ||
        _.get(finding, 'Severity.Normalized') / 100.0;
      // securityhub asff file does not contain accurate severity information by setting things that shouldn't be informational to informational: when additional context, i.e. standards, is not provided, set informational to medium.
      if (typeof impact === 'string' && impact === 'INFORMATIONAL') {
        impact = 'MEDIUM';
      }
    }
    return impact;
  };
  const findingNistTag = (
    finding: unknown,
    {awsConfigMapping}: {awsConfigMapping: AwsConfigMapping}
  ) => {
    if (
      _.get(finding, 'ProductFields.RelatedAWSResources:0/type') !==
      'AWS::Config::ConfigRule'
    ) {
      return [];
    }
    const matches = awsConfigMapping.data.filter(
      (element: AwsConfigMappingItem) =>
        _.get(finding, 'ProductFields.RelatedAWSResources:0/name')?.includes(
          element.configRuleName
        )
    );
    return _.uniq(
      matches.map((rule: AwsConfigMappingItem) => rule.nistId.split('|')).flat()
    ); // Broken until CSV is fixed
  };
  const findingTitle = (
    finding: unknown,
    {controls = null}: {controls: unknown[] | null}
  ) => {
    let control;
    if (
      controls !== null &&
      (control = correspondingControl(controls, finding)) !== null
    ) {
      return encode(_.get(control, 'Title'));
    } else {
      return encode(_.get(finding, 'Title'));
    }
  };
  const productName = (findings: unknown[]): string => {
    // `${_.get(findings[0], 'ProductFields.aws/securityhub/CompanyName')} ${_.get(findings[0], 'ProductFields.aws/securityhub/ProductName')}`
    // not using above due to wanting to provide the standard's name instead
    let standardName: string;
    if (
      _.get(findings[0], 'Types[0]')
        .split('/')
        .slice(-1)[0]
        .replace(/-/gi, ' ')
        .toLowerCase() ===
      _.get(findings[0], FINDING_STANDARDS_CONTROL_ARN)
        .split('/')
        .slice(-4)[0]
        .replace(/-/gi, ' ')
        .toLowerCase()
    ) {
      standardName = _.get(findings[0], 'Types[0]')
        .split('/')
        .slice(-1)[0]
        .replace(/-/gi, ' ');
    } else {
      standardName = _.get(findings[0], FINDING_STANDARDS_CONTROL_ARN)
        .split('/')
        .slice(-4)[0]
        .replace(/-/gi, ' ')
        .split(/\s+/)
        .map((element: string) => {
          return element.charAt(0).toUpperCase() + element.slice(1);
        })
        .join(' ');
    }
    return encode(
      `${standardName} v${
        _.get(findings[0], FINDING_STANDARDS_CONTROL_ARN)
          .split('/')
          .slice(-2)[0]
      }`
    );
  };
  return {
    supportingDocs,
    findingId,
    findingImpact,
    findingNistTag,
    findingTitle,
    productName
  };
}

function getTrivy(): Record<
  string,
  (finding: unknown) => string | string[] | undefined
> {
  const findingId = (finding: unknown): string => {
    const generatorId = _.get(finding, 'GeneratorId');
    const cveId = _.get(finding, 'Resources[0].Details.Other.CVE ID');
    if (typeof cveId === 'string') {
      return encode(`${generatorId}/${cveId}`);
    } else {
      const id = _.get(finding, 'Id');
      return encode(`${generatorId}/${id}`);
    }
  };
  const findingNistTag = (finding: unknown): string[] => {
    const cveId = _.get(finding, 'Resources[0].Details.Other.CVE ID');
    if (typeof cveId === 'string') {
      return ['SI-2', 'RA-5'];
    } else {
      return [];
    }
  };
  const subfindingsStatus = (): ExecJSON.ControlResultStatus => {
    return ExecJSON.ControlResultStatus.Failed;
  };
  const subfindingsMessage = (finding: unknown): string | undefined => {
    const cveId = _.get(finding, 'Resources[0].Details.Other.CVE ID');
    if (typeof cveId === 'string') {
      const patchedPackage = _.get(
        finding,
        'Resources[0].Details.Other.Patched Package'
      );
      const patchedVersionMessage =
        patchedPackage.length === 0
          ? 'There is no patched version of the package.'
          : `The package has been patched since version(s): ${patchedPackage}.`;
      return `For package ${_.get(
        finding,
        'Resources[0].Details.Other.PkgName'
      )}, the current version that is installed is ${_.get(
        finding,
        'Resources[0].Details.Other.Installed Package'
      )}.  ${patchedVersionMessage}`;
    } else {
      return undefined;
    }
  };
  return {
    findingId,
    findingNistTag,
    subfindingsStatus,
    subfindingsMessage
  };
}

export class ASFFMapper extends BaseConverter {
  securityhubStandardsJsonArray: string[] | undefined;
  meta: Record<string, string | undefined> | null;
  supportingDocs: Map<RegExp, Record<string, Record<string, unknown>>>;
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: ''
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: {
          transformer: (): string => {
            return this.meta?.name || 'AWS Security Finding Format';
          }
        },
        version: '',
        title: {
          transformer: (): string => {
            return (_.get(this.meta, 'title') as string) || 'ASFF Findings';
          }
        },
        maintainer: null,
        summary: '',
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
            path: 'Findings',
            key: 'id',
            arrayTransformer: this.consolidate,
            id: {
              transformer: (finding): string =>
                this.externalProductHandler(
                  _.get(finding, 'ProductArn'),
                  finding,
                  'findingId',
                  encode(_.get(finding, 'GeneratorId'))
                ) as string
            },
            title: {
              transformer: (finding): string =>
                this.externalProductHandler(
                  _.get(finding, 'ProductArn'),
                  finding,
                  'findingTitle',
                  encode(_.get(finding, 'Title'))
                ) as string
            },
            desc: {
              path: 'Description',
              transformer: (input): string => encode(input as string)
            },
            impact: {
              transformer: (finding): number => {
                // There can be findings listed that are intentionally ignored due to the underlying control being superseded by a control from a different standard
                let impact: string | number;
                if (_.get(finding, 'Workflow.Status') === 'SUPPRESSED') {
                  impact = 'INFORMATIONAL';
                } else {
                  // Severity is required, but can be either 'label' or 'normalized' internally with 'label' being preferred.  other values can be in here too such as the original severity rating.
                  const defaultFunc = () =>
                    _.get(finding, SEVERITY_LABEL)
                      ? _.get(finding, SEVERITY_LABEL)
                      : _.get(finding, 'Severity.Normalized') / 100.0;
                  impact = this.externalProductHandler(
                    _.get(finding, 'ProductArn'),
                    finding,
                    'findingImpact',
                    defaultFunc
                  ) as string | number;
                }
                return typeof impact === 'string'
                  ? IMPACT_MAPPING.get(impact) || 0
                  : impact;
              }
            },
            tags: {
              nist: {
                transformer: (finding: unknown): string[] => {
                  const tags = this.externalProductHandler(
                    _.get(finding, 'ProductArn') as string,
                    finding,
                    'findingNistTag',
                    []
                  ) as string[];
                  if (!tags.length) {
                    return DEFAULT_NIST_TAG;
                  } else {
                    return tags;
                  }
                }
              }
            },
            descriptions: [
              {
                data: {
                  path: 'Remediation.Recommendation',
                  transformer: (input: unknown): string => {
                    const data: string[] = [];
                    if (_.has(input, 'Text')) {
                      data.push(_.get(input, 'Text'));
                    }
                    if (_.has(input, 'Url')) {
                      data.push(_.get(input, 'Url'));
                    }
                    return data.join('\n');
                  }
                },
                label: 'fix'
              }
            ],
            refs: [
              {
                url: {
                  path: 'SourceUrl',
                  transformer: (input): string | undefined =>
                    !Boolean(input) ? undefined : (input as string)
                }
              }
            ],
            source_location: {},
            code: '',
            results: [
              {
                status: {
                  transformer: (finding): ExecJSON.ControlResultStatus => {
                    const defaultFunc = () => {
                      if (_.has(finding, COMPLIANCE_STATUS)) {
                        switch (_.get(finding, COMPLIANCE_STATUS)) {
                          case 'PASSED':
                            return ExecJSON.ControlResultStatus.Passed;
                          case 'WARNING':
                            return ExecJSON.ControlResultStatus.Skipped;
                          case 'FAILED':
                            return ExecJSON.ControlResultStatus.Failed;
                          case 'NOT_AVAILABLE':
                            // primary meaning is that the check could not be performed due to a service outage or API error, but it's also overloaded to mean NOT_APPLICABLE so technically 'skipped' or 'error' could be applicable, but AWS seems to do the equivalent of skipped
                            return ExecJSON.ControlResultStatus.Skipped;
                          default:
                            // not a valid value for the status enum
                            return ExecJSON.ControlResultStatus.Error;
                        }
                      } else {
                        // if no compliance status is provided which is a weird but possible case, then skip
                        return ExecJSON.ControlResultStatus.Skipped;
                      }
                    };
                    return this.externalProductHandler(
                      _.get(finding, 'ProductArn'),
                      finding,
                      'subfindingsStatus',
                      defaultFunc
                    ) as ExecJSON.ControlResultStatus;
                  }
                },
                code_desc: {
                  transformer: (finding): string => {
                    let output = this.externalProductHandler(
                      _.get(finding, 'ProductArn'),
                      finding,
                      'subfindingsCodeDesc',
                      ''
                    ) as string;
                    if (output) {
                      output += '; ';
                    }
                    const resources = _.get(finding, 'Resources')
                      .map((resource: unknown) => {
                        let hash = `Type: ${encode(
                          _.get(resource, 'Type')
                        )}, Id: ${encode(_.get(resource, 'Id'))}`;
                        if (_.has(resource, 'Partition')) {
                          hash += `, Partition: ${encode(
                            _.get(resource, 'Partition')
                          )}`;
                        }
                        if (_.has(resource, 'Region')) {
                          hash += `, Region: ${encode(
                            _.get(resource, 'Region')
                          )}`;
                        }
                        return hash;
                      })
                      .join(', ');
                    output += `Resources: [${resources}]`;
                    return output;
                  }
                },
                message: {
                  transformer: (finding): string | undefined => {
                    const defaultFunc = () => {
                      const statusReason = this.statusReason(finding);
                      switch (_.get(finding, COMPLIANCE_STATUS)) {
                        case undefined: // Possible for Compliance.Status to not be there, in which case it's a skip_message
                          return undefined;
                        case 'PASSED':
                          return statusReason;
                        case 'WARNING':
                          return undefined;
                        case 'FAILED':
                          return statusReason;
                        case 'NOT_AVAILABLE':
                          return undefined;
                        default:
                          return statusReason;
                      }
                    };
                    return this.externalProductHandler(
                      _.get(finding, 'ProductArn'),
                      finding,
                      'subfindingsMessage',
                      defaultFunc
                    ) as string | undefined;
                  }
                },
                skip_message: {
                  transformer: (finding): string | undefined => {
                    const statusReason = this.statusReason(finding);
                    switch (_.get(finding, COMPLIANCE_STATUS)) {
                      case undefined: // Possible for Compliance.Status to not be there, in which case it's a skip_message
                        return statusReason;
                      case 'PASSED':
                        return undefined;
                      case 'WARNING':
                        return statusReason;
                      case 'FAILED':
                        return undefined;
                      case 'NOT_AVAILABLE':
                        // primary meaning is that the check could not be performed due to a service outage or API error, but it's also overloaded to mean NOT_APPLICABLE so technically 'skipped' or 'error' could be applicable, but AWS seems to do the equivalent of skipped
                        return statusReason;
                      default:
                        return undefined;
                    }
                  }
                },
                start_time: {
                  transformer: (finding): string =>
                    _.get(finding, 'LastObservedAt') ||
                    _.get(finding, 'UpdatedAt')
                }
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  statusReason(finding: unknown): string | undefined {
    return _.get(finding, 'Compliance.StatusReasons')
      ?.map((reason: Record<string, string>) =>
        Object.entries(reason).map(([key, value]: [string, string]) => {
          return `${encode(key)}: ${encode(value)}`;
        })
      )
      .flat()
      .join('\n');
  }

  externalProductHandler(
    product: string | RegExp,
    data: unknown,
    func: string,
    defaultVal: ExternalProductHandlerOutputs
  ): string | string[] | number | undefined {
    let arn = null;
    // eslint-disable-next-line @typescript-eslint/ban-types
    let mapping: Record<string, Function> | undefined;
    if (
      (product instanceof RegExp ||
        (arn = Array.from(PRODUCT_ARN_MAPPING.keys()).find((regex) =>
          regex.test(product)
        ))) &&
      (mapping = PRODUCT_ARN_MAPPING.get(arn || (product as RegExp))) !==
        undefined &&
      func in mapping
    ) {
      let keywords: Record<string, unknown> = {};
      if (this.supportingDocs.has(arn || (product as RegExp))) {
        keywords = {...this.supportingDocs.get(arn || (product as RegExp))};
      }
      return _.get(
        PRODUCT_ARN_MAPPING.get(arn || (product as RegExp)),
        func
      )?.apply(this, [data, keywords]);
    } else {
      if (typeof defaultVal === 'function') {
        return defaultVal();
      } else {
        return defaultVal;
      }
    }
  }
  consolidate(input: unknown[], file: unknown): ExecJSON.Control[] {
    const allFindings = _.get(file, 'Findings');
    // Group Sub-findings by ASFF Product ARN and HDF ID
    const productGroups: Map<
      RegExp,
      Map<string, Array<Array<unknown>>>
    > = new Map<RegExp, Map<string, Array<Array<unknown>>>>();
    input.forEach((item, index) => {
      let arn = Array.from(PRODUCT_ARN_MAPPING.keys()).find((regex) =>
        _.get(allFindings[index], 'ProductArn').match(regex)
      );
      if (!arn) {
        const productInfo = _.get(allFindings[index], 'ProductArn')
          .split(':')
          .slice(-1)[0];
        arn = new RegExp(
          `arn:.+:securityhub:.+:.*:product/${productInfo.split('/')[1]}/${
            productInfo.split('/')[2]
          }`
        );
      }
      if (!productGroups.has(arn)) {
        productGroups.set(arn, new Map<string, Array<Array<unknown>>>());
      }
      if (!productGroups.get(arn)?.has(_.get(item, 'id'))) {
        productGroups.get(arn)?.set(_.get(item, 'id'), []);
      }
      productGroups
        .get(arn)
        ?.get(_.get(item, 'id'))
        ?.push([item, allFindings[index]]);
    });

    const output: ExecJSON.Control[] = [];
    productGroups.forEach((idGroups, product) => {
      idGroups.forEach((data, id) => {
        const group = data.map((d) => d[0]);
        const findings = data.map((d) => d[1]);

        const productInfo = _.get(findings[0], 'ProductArn')
          .split(':')
          .slice(-1)[0]
          .split('/');
        const productName = this.externalProductHandler(
          product,
          findings,
          'productName',
          encode(`${productInfo[1]}/${productInfo[2]}`)
        );

        const item: ExecJSON.Control = {
          // Add productName to ID if any ID's are the same across products
          id:
            Array.from(
              new Map(
                [...productGroups].filter(([pg]) => pg !== product) // Check case when running into dupe ID's
              ).values()
            ).find((ig) => Array.from(ig.keys()).includes(id)) !== undefined
              ? `[${productName}] ${id}`
              : id,
          title: `${productName}: ${_.uniq(
            group.map((d) => _.get(d, 'title') as string)
          ).join(';')}`,
          tags: {
            nist: _.uniq(
              group.map((d) => _.get(d, 'tags.nist') as string[]).flat()
            )
          },
          impact: Math.max(...group.map((d) => _.get(d, 'impact'))),
          desc: this.externalProductHandler(
            product,
            group,
            'desc',
            _.uniq(group.map((d) => _.get(d, 'desc') as string)).join('\n')
          ) as string,
          descriptions: group
            .map((d) => _.get(d, 'descriptions'))
            .flat()
            .filter(
              (element, index, arr) =>
                element.data !== '' &&
                index === arr.findIndex((e) => e.data === element.data) // https://stackoverflow.com/a/36744732/645647
            ) as ExecJSON.ControlDescription[],
          refs: group
            .map((d) => _.get(d, 'refs'))
            .flat()
            .filter(
              (element) => _.get(element, 'url') !== undefined
            ) as ExecJSON.Reference[],
          source_location: {},
          code: JSON.stringify({Findings: findings}, null, 2),
          results: group
            .map((d) => _.get(d, 'results'))
            .flat() as ExecJSON.ControlResult[]
        };
        output.push(item);
      });
    });
    return output;
  }
  constructor(
    asffJson: string,
    securityhubStandardsJsonArray: undefined | string[] = undefined,
    meta: null | Record<string, string | undefined> = null
  ) {
    super(fixFileInput(asffJson));
    this.securityhubStandardsJsonArray = securityhubStandardsJsonArray;
    this.meta = meta;
    this.supportingDocs = new Map<
      RegExp,
      Record<string, Record<string, unknown>>
    >();
    const map = PRODUCT_ARN_MAPPING.get(SECURITYHUB_REGEX);
    if (map) {
      this.supportingDocs.set(
        SECURITYHUB_REGEX,
        _.get(map, 'supportingDocs')(this.securityhubStandardsJsonArray)
      );
    }
  }
  setMappings(
    customMappings: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    super.setMappings(customMappings);
  }
}
