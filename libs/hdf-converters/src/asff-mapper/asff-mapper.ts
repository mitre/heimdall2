// ASFF (AWS Security Finding Format) is intended as being another data exchange format to be used in displaying data within AWS SecurityHub - in this regard, it is analogous to HDF and Heimdall.
// Like in every scenario where there is an open specification, people interpret the intent of each of the attributes in slightly different ways.  Consequently, while many products provide 'ASFF' output, providing a mapper back to HDF can be complicated.

import { compare, validate } from 'compare-versions';
import { encode } from 'html-entities';
import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import { BaseConverter, DEFAULT_PROFILE_FIELDS } from '../base-converter';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from '../utils/global';
import { getCMSInSpec } from './case-cms-inspec';
import { getFirewallManager } from './case-firewall-manager';
import { getGuardDuty } from './case-guardduty';
import { getInspector } from './case-inspector';
import { getPreviouslyHDF } from './case-previously-hdf';
import { getProwler } from './case-prowler';
import { getSecurityHub } from './case-security-hub';
import { getTrivy } from './case-trivy';

const IMPACT_MAPPING = new Map<string, number>([
  ['CRITICAL', 0.9],
  ['HIGH', 0.7],
  ['INFORMATIONAL', 0],
  ['LOW', 0.3],
  ['MEDIUM', 0.5],
]);

const ARN_FIREWALL_MANAGER_RE = /^arn:[^:]+:securityhub:[^:]+:[^:]*:product\/aws\/firewall-manager$/v;
const ARN_GUARDDUTY_RE = /^arn:[^:]+:securityhub:[^:]+:[^:]*:product\/aws\/guardduty$/v;
const ARN_INSPECTOR_RE = /^arn:[^:]+:securityhub:[^:]+:[^:]*:product\/aws\/inspector$/v;
const ARN_PROWLER_RE = /^arn:[^:]+:securityhub:[^:]+:[^:]*:product\/prowler\/prowler$/v;
const ARN_SECURITYHUB_RE = /^arn:[^:]+:securityhub:[^:]+:[^:]*:product\/aws\/securityhub$/v;
const ARN_TRIVY_RE = /^arn:[^:]+:securityhub:[^:]+:[^:]*:product\/aquasecurity\/aquasecurity$/v;

const SEVERITY_LABEL = 'Severity.Label';
const COMPLIANCE_STATUS = 'Compliance.Status';

// Sometimes certain ASFF file types require massaging in order to generate good HDF files.  These are the supported special cases and a catchall 'Default'.  'Default' files and non-special cased methods for otherwise special cased files do the pre-defined default behaviors when generating the HDF file.
export enum SpecialCasing {
  CMSInSpec = 'CMS Chef InSpec',
  Default = 'Default',
  FirewallManager = 'AWS Firewall Manager',
  GuardDuty = 'AWS GuardDuty',
  Inspector = 'AWS Inspector',
  PreviouslyHDF = 'MITRE SAF HDF2ASFF',
  Prowler = 'Prowler',
  SecurityHub = 'AWS Security Hub',
  Trivy = 'Aqua Trivy',
}

// typically you can just look at the ProductArn field to get information on the product type but we also support some custom formats/products that require alternative means of identification
function whichSpecialCase(finding: Record<string, unknown>): SpecialCasing {
  const productArn = _.get(finding, 'ProductArn') as string;
  if (
    _.get(finding, 'ProductName') === 'Default'
    && _.get(finding, 'GeneratorId') === 'cms.Chef Inspec'
  ) {
    return SpecialCasing.CMSInSpec;
  }
  if (
    ARN_FIREWALL_MANAGER_RE.test(productArn)
  ) {
    return SpecialCasing.FirewallManager;
  }
  if (
    ARN_GUARDDUTY_RE.test(productArn)
  ) {
    return SpecialCasing.GuardDuty;
  }
  if (
    _.some(
      _.get(finding, 'FindingProviderFields.Types') as string[],
      (type: string) => {
        // 'type' should look like "MITRE/SAF/2.6.29-hdf2asff"
        if (!_.startsWith(type, 'MITRE/SAF/')) {
          return false;
        }
        const version = type.split('/').pop()?.split('-', 1)[0] ?? '';
        return validate(version) && compare(version, '2.6.20', '>'); // older versions aren't supported by the 'PreviouslyHDF' specialcasing and instead use the default casing
      },
    )
  ) {
    return SpecialCasing.PreviouslyHDF;
  }
  if (
    ARN_INSPECTOR_RE.test(productArn)
  ) {
    return SpecialCasing.Inspector;
  }
  if (
    ARN_PROWLER_RE.test(productArn)
  ) {
    return SpecialCasing.Prowler;
  }
  if (
    ARN_SECURITYHUB_RE.test(productArn)
  ) {
    return SpecialCasing.SecurityHub;
  }
  return ARN_TRIVY_RE.test(productArn) ? SpecialCasing.Trivy : SpecialCasing.Default;
}

const SPECIAL_CASE_MAPPING = new Map<
  SpecialCasing,
  Record<string, (...args: any[]) => any>
>([
  [SpecialCasing.CMSInSpec, getCMSInSpec()],
  [SpecialCasing.FirewallManager, getFirewallManager()],
  [SpecialCasing.GuardDuty, getGuardDuty()],
  [SpecialCasing.Inspector, getInspector()],
  [SpecialCasing.PreviouslyHDF, getPreviouslyHDF()],
  [SpecialCasing.Prowler, getProwler()],
  [SpecialCasing.SecurityHub, getSecurityHub()],
  [SpecialCasing.Trivy, getTrivy()],
]);

// If a special casing has a function override, then do the override, otherwise return the default value.  This is how the 'massaging' described above is implemented.
function externalProductHandler<T>(
  context: ASFFMapper | ASFFResults,
  product: SpecialCasing,
  data: unknown,
  func: string,
  defaultVal: (() => T) | T,
): T {
  if (
    product !== SpecialCasing.Default
    && _.has(SPECIAL_CASE_MAPPING.get(product), func)
  ) {
    const keywords: Record<string, unknown> = context.supportingDocs.has(product)
      ? { ...context.supportingDocs.get(product) }
      : {};
    return _.get(SPECIAL_CASE_MAPPING.get(product), func)?.apply(context, [
      data,
      keywords,
    ]);
  }
  return typeof defaultVal === 'function' ? (defaultVal as () => T)() : defaultVal;
}

// helper function to take all the controls that have the same id and turn them into results/subtests within an overarching control
function handleIdGroup(
  context: ASFFMapper,
  idGroup: [string, [ExecJSON.Control, Record<string, unknown>][]],
): ExecJSON.Control {
  const [id, data] = idGroup;
  const group = data.map(d => d[0]);
  const findings = data.map(d => d[1]);

  const productInfo = ((_.get(findings[0], 'ProductArn') as string)
    .split(':')
    .at(-1) ?? '')
    .split('/');
  const productName = externalProductHandler(
    context,
    whichSpecialCase(findings[0]),
    findings,
    'productName',
    encode(`${productInfo[1]}/${productInfo[2]}`),
  );
  const titlePrefix = externalProductHandler(
    context,
    whichSpecialCase(findings[0]),
    findings,
    'titlePrefix',
    `${productName}: `,
  );
  const waiverData = externalProductHandler(
    context,
    whichSpecialCase(findings[0]),
    group,
    'waiverData',
    {},
  ) as ExecJSON.ControlWaiverData;

  return {
    desc: externalProductHandler(
      context,
      whichSpecialCase(findings[0]),
      group,
      'desc',
      _.uniq(group.map(d => d.desc)).join('\n'),
    ),
    descriptions: group
      .flatMap(d => d.descriptions)
      .filter(
        (element, index, arr) =>
          element
          && element.data !== ''
          && index
          === arr.findIndex(
            e => e?.data === element.data,
          ), // https://stackoverflow.com/a/36744732/645647
      ) as ExecJSON.ControlDescription[],
    id: id,
    impact: Math.max(...group.map(d => d.impact)),
    refs: group
      .flatMap(d => d.refs)
      .filter(element => _.get(element, 'url') !== undefined),
    source_location: ((): ExecJSON.SourceLocation => {
      const locs = _.uniq(group.map(d => d.source_location)).filter(
        loc => Object.keys(loc || {}).length > 0,
      );
      if (locs.length === 0) {
        return {};
      }
      return locs.length === 1 ? locs[0] : { ref: JSON.stringify(locs) };
    })(),
    tags: _.mergeWith(
      {},
      ...group.map(d => d.tags),
      (acc: unknown, cur: unknown) => {
        if (acc === undefined || cur === undefined) {
          return acc || cur;
        }
        return Array.isArray(acc) || Array.isArray(cur)
          ? _.uniq(_.concat([], acc, cur))
          : acc;
      },
    ),
    title: `${titlePrefix}${_.uniq(group.map(d => d.title)).join(';')}`,
    ...(Object.keys(waiverData || {}).length > 0 && { waiver_data: waiverData }),
    code: externalProductHandler(
      context,
      whichSpecialCase(findings[0]),
      group,
      'code',
      JSON.stringify({ Findings: findings }, null, 2),
    ),
    results: group.flatMap(d => d.results),
  };
}

// consolidate the array of controls which were generated 1:1 with findings in order to have subfindings/results
// the way it does this is to group by HDF id which by default is the ASFF GeneratorId field
export function consolidate(
  context: ASFFMapper,
  input: unknown[],
  file: Record<string, unknown>,
): ExecJSON.Control[] {
  // Group Sub-findings by HDF ID
  const allFindings = _.get(file, 'Findings') as Record<string, unknown>[];
  if (input.length !== allFindings.length) {
    throw new Error(
      'The number of generated controls should be the same as the number of findings while consolidating.',
    );
  }
  const idGroups = _.groupBy(
    _.zip(input, allFindings),
    (value: [ExecJSON.Control, Record<string, unknown>]) => {
      const [hdfControl, asffFinding] = value;
      return externalProductHandler(
        context,
        whichSpecialCase(asffFinding),
        asffFinding,
        'subfindingsId',
        _.get(hdfControl, 'id'),
      );
    },
  ) as Record<string, [ExecJSON.Control, Record<string, unknown>][]>;

  return Object.entries(idGroups || {}).map(idGroup =>
    handleIdGroup(context, idGroup),
  );
}

// the schema specifies that the file should be `{ "Findings": [... findings array ...] }` but sometimes only the array or even a single finding is provided so this function corrects for those cases
function wrapWithFindingsObject(
  output:
    | Record<string, Record<string, unknown>[]>
    | Record<string, unknown>
    | Record<string, unknown>[],
): Record<string, Record<string, unknown>[]> {
  if (!_.has(output, 'Findings')) {
    output = Array.isArray(output) ? { Findings: output } : { Findings: [output] };
  }
  return output as Record<string, Record<string, unknown>[]>;
}

// some applications (like Prowler) give us new line seperated JSON objects (see JSON Lines or ndjson) but we need regular JSON
function fixFileInput(
  asffJson: string,
): Record<string, Record<string, unknown>[]> {
  let output;
  try {
    output = JSON.parse(asffJson);
  } catch {
    const fixedInput = `[${asffJson
      .trim()
      .replaceAll('}\n', '},\n')
      .replaceAll('},\n$', '')}]`;
    output = JSON.parse(fixedInput);
  }
  return wrapWithFindingsObject(output);
}

export class ASFFMapper extends BaseConverter {
  meta: Record<string, string | undefined> | undefined;
  defaultMappings = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {
        transformer: (record: Record<string, unknown>) => {
          const productInfo = ((
            _.get(record, 'Findings[0].ProductArn') as string
          )
            .split(':')
            .at(-1) ?? '')
            .split('/');
          const defaultTargetId = `${productInfo[1]} - ${productInfo[2]}`;
          return externalProductHandler(
            this,
            whichSpecialCase(
              _.get(record, 'Findings[0]') as Record<string, unknown>,
            ),
            [_.get(record, 'Findings[0]'), record.Findings],
            'productName',
            encode(defaultTargetId),
          );
        },
      },
    },
    profiles: [
      {
        ...DEFAULT_PROFILE_FIELDS,
        controls: [
          {
            arrayTransformer: consolidate.bind(this, this),
            code: '',
            desc: {
              transformer: (finding: Record<string, unknown>): string =>
                externalProductHandler(
                  this,
                  whichSpecialCase(finding),
                  finding,
                  'findingDescription',
                  encode(_.get(finding, 'Description') as string),
                ),
            },
            descriptions: [
              {
                data: {
                  path: 'Remediation.Recommendation',
                  transformer: (input: Record<string, string>): string => {
                    const data: string[] = [];
                    if (_.has(input, 'Text')) {
                      data.push(_.get(input, 'Text'));
                    }
                    if (_.has(input, 'Url')) {
                      data.push(_.get(input, 'Url'));
                    }
                    return data.join('\n');
                  },
                },
                label: 'fix',
              },
            ],
            id: {
              transformer: (finding: Record<string, unknown>): string =>
                externalProductHandler(
                  this,
                  whichSpecialCase(finding),
                  finding,
                  'findingId',
                  encode(_.get(finding, 'GeneratorId') as string),
                ),
            },
            impact: {
              transformer: (finding: Record<string, unknown>): number => {
                // There can be findings listed that are intentionally ignored due to the underlying control being superseded by a control from a different standard
                let impact: number | string;
                if (_.get(finding, 'Workflow.Status') === 'SUPPRESSED') {
                  impact = 'INFORMATIONAL';
                } else {
                  // Severity is required, but can be either 'label' or 'normalized' internally with 'label' being preferred.  other values can be in here too such as the original severity rating.
                  const defaultFunc = (): number | string =>
                    (_.get(finding, SEVERITY_LABEL) as string | undefined)
                      ? (_.get(finding, SEVERITY_LABEL) as string)
                      : (_.get(finding, 'Severity.Normalized') as number)
                        / 100;
                  impact = externalProductHandler<number | string>(
                    this,
                    whichSpecialCase(finding),
                    finding,
                    'findingImpact',
                    defaultFunc,
                  );
                }
                return typeof impact === 'string'
                  ? IMPACT_MAPPING.get(impact) || 0
                  : impact;
              },
            },
            key: 'id',
            path: 'Findings',
            refs: [
              {
                transformer: (
                  finding: Record<string, unknown>,
                ): Record<string, unknown> => {
                  return { ...(_.has(finding, 'SourceUrl') && { url: _.get(finding, 'SourceUrl') }) };
                },
              },
            ],
            results: [
              {
                code_desc: {
                  transformer: (finding: Record<string, unknown>): string => {
                    let output = externalProductHandler(
                      this,
                      whichSpecialCase(finding),
                      finding,
                      'subfindingsCodeDesc',
                      '',
                    ) as string;
                    if (output) {
                      output += '; ';
                    }
                    const resources = (
                      _.get(finding, 'Resources') as Record<string, unknown>[]
                    )
                      .map((resource: unknown) => {
                        let hash = `Type: ${encode(
                          _.get(resource, 'Type'),
                        )}, Id: ${encode(_.get(resource, 'Id'))}`;
                        if (_.has(resource, 'Partition')) {
                          hash += `, Partition: ${encode(
                            _.get(resource, 'Partition'),
                          )}`;
                        }
                        if (_.has(resource, 'Region')) {
                          hash += `, Region: ${encode(
                            _.get(resource, 'Region'),
                          )}`;
                        }
                        return hash;
                      })
                      .join(', ');
                    output += `Resources: [${resources}]`;
                    return output;
                  },
                },
                start_time: {
                  transformer: (finding: Record<string, unknown>): string =>
                    (_.get(finding, 'LastObservedAt') as string)
                    || (_.get(finding, 'UpdatedAt') as string),
                },
                status: {
                  transformer: (
                    finding: Record<string, unknown>,
                  ): ExecJSON.ControlResultStatus => {
                    const defaultFunc = () => {
                      if (_.has(finding, COMPLIANCE_STATUS)) {
                        switch (_.get(finding, COMPLIANCE_STATUS)) {
                          case 'FAILED': {
                            return ExecJSON.ControlResultStatus.Failed;
                          }
                          case 'NOT_AVAILABLE': {
                            // primary meaning is that the check could not be performed due to a service outage or API error, but it's also overloaded to mean NOT_APPLICABLE so technically 'skipped' or 'error' could be applicable, but AWS seems to do the equivalent of skipped
                            return ExecJSON.ControlResultStatus.Skipped;
                          }
                          case 'PASSED': {
                            return ExecJSON.ControlResultStatus.Passed;
                          }
                          case 'WARNING': {
                            return ExecJSON.ControlResultStatus.Skipped;
                          }
                          default: {
                            // not a valid value for the status enum
                            return ExecJSON.ControlResultStatus.Error;
                          }
                        }
                      } else {
                        // if no compliance status is provided which is a weird but possible case, then fail
                        return ExecJSON.ControlResultStatus.Failed;
                      }
                    };
                    return externalProductHandler(
                      this,
                      whichSpecialCase(finding),
                      finding,
                      'subfindingsStatus',
                      defaultFunc,
                    );
                  },
                },
                transformer: (
                  finding: Record<string, unknown>,
                ): Record<string, unknown> => {
                  const message = (() => {
                    const defaultFunc = () => {
                      const statusReason = this.statusReason(finding);
                      switch (_.get(finding, COMPLIANCE_STATUS)) {
                        case 'FAILED': {
                          return statusReason;
                        }
                        case 'NOT_AVAILABLE': {
                          return;
                        }
                        case 'PASSED': {
                          return statusReason;
                        }
                        case undefined: { // Possible for Compliance.Status to not be there, in which case it's a skip_message
                          return;
                        }
                        case 'WARNING': {
                          return;
                        }
                        default: {
                          return statusReason;
                        }
                      }
                    };
                    return externalProductHandler(
                      this,
                      whichSpecialCase(finding),
                      finding,
                      'subfindingsMessage',
                      defaultFunc,
                    );
                  })();
                  const skipMessage = (() => {
                    const statusReason = this.statusReason(finding);
                    switch (_.get(finding, COMPLIANCE_STATUS)) {
                      case 'FAILED': {
                        return;
                      }
                      case 'NOT_AVAILABLE': {
                        // primary meaning is that the check could not be performed due to a service outage or API error, but it's also overloaded to mean NOT_APPLICABLE so technically 'skipped' or 'error' could be applicable, but AWS seems to do the equivalent of skipped
                        return statusReason;
                      }
                      case 'PASSED': {
                        return;
                      }
                      case undefined: { // Possible for Compliance.Status to not be there, in which case it's a skip_message
                        return statusReason;
                      }
                      case 'WARNING': {
                        return statusReason;
                      }
                      default: {
                        return;
                      }
                    }
                  })();
                  return {
                    ...(message !== undefined && { message }),
                    ...(skipMessage !== undefined && { skip_message: skipMessage }),
                  };
                },
              },
            ],
            source_location: {},
            tags: {
              cci: {
                transformer: (finding: Record<string, unknown>): string[] => {
                  const tags = externalProductHandler(
                    this,
                    whichSpecialCase(finding),
                    finding,
                    'findingNistTag',
                    [],
                  ) as string[];
                  return getCCIsForNISTTags(
                    tags.length === 0 ? DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS : tags,
                  );
                },
              },
              nist: {
                transformer: (finding: Record<string, unknown>): string[] => {
                  const tags = externalProductHandler(
                    this,
                    whichSpecialCase(finding),
                    finding,
                    'findingNistTag',
                    [],
                  ) as string[];
                  return tags.length === 0 ? DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS : tags;
                },
              },
              transformer: (
                finding: Record<string, unknown>,
              ): Record<string, unknown> | undefined =>
                externalProductHandler(
                  this,
                  whichSpecialCase(finding),
                  finding,
                  'findingTags',
                  {},
                ),
            },
            title: {
              transformer: (finding: Record<string, unknown>): string =>
                externalProductHandler(
                  this,
                  whichSpecialCase(finding),
                  finding,
                  'findingTitle',
                  encode(_.get(finding, 'Title') as string),
                ),
            },
          },
        ],
        name: {
          transformer: (): string => {
            return this.meta?.name || 'AWS Security Finding Format';
          },
        },
        summary: '',
        title: {
          transformer: (): string => {
            return (_.get(this.meta, 'title')!) || 'ASFF Findings';
          },
        },
        version: '',
      },
    ],
    statistics: { duration: null },
    version: HeimdallToolsVersion,
  };

  supportingDocs: Map<SpecialCasing, Record<string, Record<string, unknown>>>;

  constructor(
    asff: Record<string, unknown>,
    supportingDocs: Map<SpecialCasing, Record<string, Record<string, unknown>>>,
    meta?: Record<string, string | undefined>,
  ) {
    super(asff);
    this.meta = meta;
    this.supportingDocs = supportingDocs;
    this.setMappings();
  }

  setMappings(): void {
    this.mappings = externalProductHandler(
      this,
      whichSpecialCase(
        _.get(this.data, 'Findings[0]') as Record<string, unknown>,
      ),
      this,
      'mapping',
      this.defaultMappings,
    );
  }

  statusReason(finding: unknown): string | undefined {
    const statusReasons = _.get(finding, 'Compliance.StatusReasons') as
      | Record<string, string>[]
      | unknown;
    return statusReasons !== undefined
      && statusReasons !== null
      && _.isArray(statusReasons)
      ? statusReasons
        .flatMap((reason: Record<string, string>) =>
          Object.entries(reason || {}).map(([key, value]: [string, string]) => {
            return `${encode(key)}: ${encode(value)}`;
          }),
        )
        .join('\n')
      : undefined;
  }
}

// sometimes there is a need to change certain meta level information such as the profile name to make it clearer that the original ASFF file came from an external tool instead of SecHub
// some special cases can take in additional files aside from findings, ex. the guidelines which contain correct severity information
export class ASFFResults {
  data: Record<string, Record<string, unknown>[]>;
  meta: Record<string, string | undefined> | undefined;
  supportingDocs: Map<SpecialCasing, Record<string, Record<string, unknown>>>;
  constructor(
    asffJson: string,
    securityhubStandardsJsonArray?: string[],
    meta?: Record<string, string | undefined>,
  ) {
    this.meta = meta;
    this.supportingDocs = new Map<
      SpecialCasing,
      Record<string, Record<string, unknown>>
    >();
    this.supportingDocs.set(
      SpecialCasing.SecurityHub,
      _.get(
        SPECIAL_CASE_MAPPING.get(SpecialCasing.SecurityHub),
        'securityhubSupportingDocs',
        (standards: string[] | undefined) => {
          throw new Error(
            `supportingDocs function should've been defined: ${String(standards)}`,
          );
        },
      )(securityhubStandardsJsonArray),
    );

    // split input findings via product, each of which will get their own resultant HDF file
    const findings = _.get(fixFileInput(asffJson), 'Findings');
    this.data = _.groupBy(findings, (finding) => {
      const productInfo = ((_.get(finding, 'ProductArn') as string)
        .split(':')
        .at(-1) ?? '')
        .split('/');
      const defaultFilename = `${productInfo[1]} - ${productInfo[2]}.json`;
      return externalProductHandler(
        this,
        whichSpecialCase(finding),
        [finding, findings],
        'filename',
        encode(defaultFilename),
      );
    });
  }

  toHdf(): Record<string, ExecJSON.Execution> {
    return _.mapValues(this.data, (val) => {
      const wrapped = wrapWithFindingsObject(val);
      const firstFinding = _.get(wrapped, 'Findings[0]') as unknown as Record<string, unknown>;
      const specialCase = whichSpecialCase(firstFinding);
      return new ASFFMapper(
        externalProductHandler(this, specialCase, wrapped, 'preprocessingASFF', wrapped),
        externalProductHandler(this, specialCase, [wrapped, this.supportingDocs], 'supportingDocs', this.supportingDocs),
        externalProductHandler(this, specialCase, undefined, 'meta', this.meta),
      ).toHdf();
    });
  }
}
