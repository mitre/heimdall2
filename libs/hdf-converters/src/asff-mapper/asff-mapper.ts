import {encode} from 'html-entities';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from '../base-converter';
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from '../utils/global';
import {getFirewallManager} from './case-firewall-manager';
import {getHDF2ASFF} from './case-hdf2asff';
import {getProwler} from './case-prowler';
import {getSecurityHub} from './case-security-hub';
import {getTrivy} from './case-trivy';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['CRITICAL', 0.9],
  ['HIGH', 0.7],
  ['MEDIUM', 0.5],
  ['LOW', 0.3],
  ['INFORMATIONAL', 0.0]
]);

const SEVERITY_LABEL = 'Severity.Label';
const COMPLIANCE_STATUS = 'Compliance.Status';

// Sometimes certain ASFF file types require massaging in order to generate good HDF files.  These are the supported special cases and a catchall 'Default'.  'Default' files and non-special cased methods for otherwise special cased files do the pre-defined default behaviors when generating the HDF file.
export enum SpecialCasing {
  FirewallManager = 'AWS Firewall Manager',
  Prowler = 'Prowler',
  SecurityHub = 'AWS Security Hub',
  Trivy = 'Aqua Trivy',
  HDF2ASFF = 'MITRE SAF HDF2ASFF',
  Default = 'Default'
}

function whichSpecialCase(finding: Record<string, unknown>): SpecialCasing {
  const productArn = _.get(finding, 'ProductArn') as string;
  if (
    productArn.match(
      /^arn:[^:]+:securityhub:[^:]+:[^:]*:product\/aws\/firewall-manager$/
    )
  ) {
    return SpecialCasing.FirewallManager;
  } else if (
    productArn.match(
      /^arn:[^:]+:securityhub:[^:]+:[^:]*:product\/prowler\/prowler$/
    )
  ) {
    return SpecialCasing.Prowler;
  } else if (
    productArn.match(
      /^arn:[^:]+:securityhub:[^:]+:[^:]*:product\/aws\/securityhub$/
    )
  ) {
    return SpecialCasing.SecurityHub;
  } else if (
    productArn.match(
      /^arn:[^:]+:securityhub:[^:]+:[^:]*:product\/aquasecurity\/aquasecurity$/
    )
  ) {
    return SpecialCasing.Trivy;
  } else if (
    _.some(
      _.get(finding, 'FindingProviderFields.Types') as string[],
      (type: string) => {
        const version = type.split('/')[2].split('-')[0];
        const [major, minor, patch] = version.split('.');
        if (
          parseInt(major) > 1 &&
          parseInt(minor) > 5 &&
          parseInt(patch) > 20
        ) {
          return _.startsWith(type, 'MITRE/SAF/');
        } else {
          return false;
        }
      }
    )
  ) {
    return SpecialCasing.HDF2ASFF;
  } else {
    return SpecialCasing.Default;
  }
}

const SPECIAL_CASE_MAPPING: Map<
  SpecialCasing,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Record<string, Function>
> = new Map([
  [SpecialCasing.FirewallManager, getFirewallManager()],
  [SpecialCasing.Prowler, getProwler()],
  [SpecialCasing.SecurityHub, getSecurityHub()],
  [SpecialCasing.Trivy, getTrivy()],
  [SpecialCasing.HDF2ASFF, getHDF2ASFF()]
]);

function externalProductHandler<T>(
  context: ASFFMapper | ASFFResults,
  product: SpecialCasing,
  data: unknown,
  func: string,
  defaultVal: T | (() => T)
): T {
  if (
    product !== SpecialCasing.Default &&
    _.has(SPECIAL_CASE_MAPPING.get(product), func)
  ) {
    let keywords: Record<string, unknown> = {};
    if (context.supportingDocs.has(product)) {
      keywords = {...context.supportingDocs.get(product)};
    }
    return _.get(SPECIAL_CASE_MAPPING.get(product), func)?.apply(context, [
      data,
      keywords
    ]);
  } else {
    if (typeof defaultVal === 'function') {
      return (defaultVal as () => T)();
    } else {
      return defaultVal;
    }
  }
}

function handleIdGroup(
  context: ASFFMapper,
  idGroup: [string, [ExecJSON.Control, Record<string, unknown>][]]
): ExecJSON.Control {
  const [id, data] = idGroup;
  const group = data.map((d) => d[0]);
  const findings = data.map((d) => d[1]);

  const productInfo = (_.get(findings[0], 'ProductArn') as string)
    .split(':')
    .slice(-1)[0]
    .split('/');
  const productName = externalProductHandler(
    context,
    whichSpecialCase(findings[0]),
    findings,
    'productName',
    encode(`${productInfo[1]}/${productInfo[2]}`)
  );
  const hasNoTitlePrefix = externalProductHandler(
    context,
    whichSpecialCase(findings[0]),
    null,
    'doesNotHaveFindingTitlePrefix',
    false
  );
  const titlePrefix = hasNoTitlePrefix ? '' : `${productName}: `;
  const waiverData = externalProductHandler(
    context,
    whichSpecialCase(findings[0]),
    group,
    'waiverData',
    {}
  ) as ExecJSON.ControlWaiverData;

  return {
    // Add productName to ID if any ID's are the same across products
    id: id,
    title: `${titlePrefix}${_.uniq(group.map((d) => d.title)).join(';')}`,
    tags: _.mergeWith(
      {},
      ...group.map((d) => d.tags),
      (acc: unknown, cur: unknown) => {
        if (acc === undefined || cur === undefined) {
          return acc || cur;
        } else {
          return Array.isArray(acc) || Array.isArray(cur)
            ? _.uniq(_.concat([], acc, cur))
            : acc;
        }
      }
    ),
    impact: Math.max(...group.map((d) => d.impact)),
    desc: externalProductHandler(
      context,
      whichSpecialCase(findings[0]),
      group,
      'desc',
      _.uniq(group.map((d) => d.desc)).join('\n')
    ),
    descriptions: group
      .map((d) => d.descriptions)
      .flat()
      .filter(
        (element, index, arr) =>
          element &&
          element.data !== '' &&
          index ===
            arr.findIndex(
              (e) => e !== null && e !== undefined && e.data === element.data
            ) // https://stackoverflow.com/a/36744732/645647
      ) as ExecJSON.ControlDescription[],
    refs: group
      .map((d) => d.refs)
      .flat()
      .filter((element) => _.get(element, 'url') !== undefined),
    source_location: ((): ExecJSON.SourceLocation => {
      const locs = _.uniq(group.map((d) => d.source_location)).filter(
        (loc) => Object.keys(loc || {}).length !== 0
      );
      if (locs.length === 0) {
        return {};
      } else if (locs.length === 1) {
        return locs[0];
      } else {
        return {ref: JSON.stringify(locs)};
      }
    })(),
    ...(Object.keys(waiverData || {}).length !== 0 && {
      waiver_data: waiverData
    }),
    code: externalProductHandler(
      context,
      whichSpecialCase(findings[0]),
      group,
      'code',
      JSON.stringify({Findings: findings}, null, 2)
    ),
    results: group.map((d) => d.results).flat()
  } as ExecJSON.Control;
}

// consolidate the array of controls which were generated 1:1 with findings in order to have subfindings/results
export function consolidate(
  context: ASFFMapper,
  input: unknown[],
  file: Record<string, unknown>
): ExecJSON.Control[] {
  // Group Sub-findings by HDF ID
  const allFindings = _.get(file, 'Findings') as Record<string, unknown>[];
  if (input.length !== allFindings.length) {
    throw new Error(
      'The number of generated controls should be the same as the number of findings while consolidating.'
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
        _.get(hdfControl, 'id')
      );
    }
  ) as Record<string, [ExecJSON.Control, Record<string, unknown>][]>;

  return Object.entries(idGroups || {}).map((idGroup) =>
    handleIdGroup(context, idGroup)
  );
}

function wrapWithFindingsObject(
  output:
    | Record<string, unknown>
    | Record<string, unknown>[]
    | Record<string, Record<string, unknown>[]>
): Record<string, Record<string, unknown>[]> {
  if (!_.has(output, 'Findings')) {
    if (Array.isArray(output)) {
      output = {Findings: output};
    } else {
      output = {Findings: [output]};
    }
  }
  return output as Record<string, Record<string, unknown>[]>;
}
function fixFileInput(
  asffJson: string
): Record<string, Record<string, unknown>[]> {
  let output = {};
  try {
    output = JSON.parse(asffJson);
  } catch {
    // Prowler gives us JSON Lines format but we need regular JSON
    const fixedInput = `[${asffJson
      .trim()
      .replace(/}\n/g, '},\n')
      .replace(/\},\n\$/g, '')}]`;
    output = JSON.parse(fixedInput);
  }
  return wrapWithFindingsObject(output);
}

export class ASFFMapper extends BaseConverter {
  meta: Record<string, string | undefined> | undefined;
  supportingDocs: Map<SpecialCasing, Record<string, Record<string, unknown>>>;

  defaultMappings = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {
        transformer: (record: Record<string, unknown>) => {
          const productInfo = (
            _.get(record, 'Findings[0].ProductArn') as string
          )
            .split(':')
            .slice(-1)[0]
            .split('/');
          const defaultTargetId = `${productInfo[1]} | ${productInfo[2]}`;
          return externalProductHandler(
            this,
            whichSpecialCase(
              _.get(record, 'Findings[0]') as Record<string, unknown>
            ),
            [_.get(record, 'Findings[0]'), record.Findings],
            'productName',
            encode(defaultTargetId)
          );
        }
      }
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
            arrayTransformer: consolidate.bind(this, this),
            id: {
              transformer: (finding: Record<string, unknown>): string =>
                externalProductHandler(
                  this,
                  whichSpecialCase(finding),
                  finding,
                  'findingId',
                  encode(_.get(finding, 'GeneratorId') as string)
                )
            },
            title: {
              transformer: (finding: Record<string, unknown>): string =>
                externalProductHandler(
                  this,
                  whichSpecialCase(finding),
                  finding,
                  'findingTitle',
                  encode(_.get(finding, 'Title') as string)
                )
            },
            desc: {
              path: 'Description',
              transformer: (input: string): string => encode(input)
            },
            impact: {
              transformer: (finding: Record<string, unknown>): number => {
                // There can be findings listed that are intentionally ignored due to the underlying control being superseded by a control from a different standard
                let impact: string | number;
                if (_.get(finding, 'Workflow.Status') === 'SUPPRESSED') {
                  impact = 'INFORMATIONAL';
                } else {
                  // Severity is required, but can be either 'label' or 'normalized' internally with 'label' being preferred.  other values can be in here too such as the original severity rating.
                  const defaultFunc = (): string | number =>
                    (_.get(finding, SEVERITY_LABEL) as string | undefined)
                      ? (_.get(finding, SEVERITY_LABEL) as string)
                      : (_.get(finding, 'Severity.Normalized') as number) /
                        100.0;
                  impact = externalProductHandler<string | number>(
                    this,
                    whichSpecialCase(finding),
                    finding,
                    'findingImpact',
                    defaultFunc
                  );
                }
                return typeof impact === 'string'
                  ? IMPACT_MAPPING.get(impact) || 0
                  : impact;
              }
            },
            tags: {
              transformer: (
                finding: Record<string, unknown>
              ): Record<string, unknown> | undefined =>
                externalProductHandler(
                  this,
                  whichSpecialCase(finding),
                  finding,
                  'findingTags',
                  {}
                ) as Record<string, unknown>,
              nist: {
                transformer: (finding: Record<string, unknown>): string[] => {
                  const tags = externalProductHandler(
                    this,
                    whichSpecialCase(finding),
                    finding,
                    'findingNistTag',
                    []
                  ) as string[];
                  if (tags.length === 0) {
                    return DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
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
                  transformer: (input: Record<string, string>): string => {
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
                transformer: (
                  finding: Record<string, unknown>
                ): Record<string, unknown> => {
                  return {
                    ...(_.has(finding, 'SourceUrl') && {
                      url: {
                        path: 'SourceUrl'
                      }
                    })
                  };
                }
              }
            ],
            source_location: {},
            code: '',
            results: [
              {
                status: {
                  transformer: (
                    finding: Record<string, unknown>
                  ): ExecJSON.ControlResultStatus => {
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
                    return externalProductHandler(
                      this,
                      whichSpecialCase(finding),
                      finding,
                      'subfindingsStatus',
                      defaultFunc
                    ) as ExecJSON.ControlResultStatus;
                  }
                },
                code_desc: {
                  transformer: (finding: Record<string, unknown>): string => {
                    let output = externalProductHandler(
                      this,
                      whichSpecialCase(finding),
                      finding,
                      'subfindingsCodeDesc',
                      ''
                    ) as string;
                    if (output) {
                      output += '; ';
                    }
                    const resources = (
                      _.get(finding, 'Resources') as Record<string, unknown>[]
                    )
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
                transformer: (
                  finding: Record<string, unknown>
                ): Record<string, unknown> => {
                  const message = (() => {
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
                    return externalProductHandler(
                      this,
                      whichSpecialCase(finding),
                      finding,
                      'subfindingsMessage',
                      defaultFunc
                    );
                  })();
                  const skipMessage = (() => {
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
                  })();
                  return {
                    ...(message !== undefined && {message}),
                    ...(skipMessage !== undefined && {
                      skip_message: skipMessage
                    })
                  };
                },
                start_time: {
                  transformer: (finding: Record<string, unknown>): string =>
                    (_.get(finding, 'LastObservedAt') as string) ||
                    (_.get(finding, 'UpdatedAt') as string)
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
        Object.entries(reason || {}).map(([key, value]: [string, string]) => {
          return `${encode(key)}: ${encode(value)}`;
        })
      )
      .flat()
      .join('\n');
  }

  setMappings(): void {
    this.mappings = externalProductHandler(
      this,
      whichSpecialCase(
        _.get(this.unconvertedData, 'Findings[0]') as Record<string, unknown>
      ),
      this,
      'mapping',
      this.defaultMappings
    ) as MappedTransform<ExecJSON.Execution, ILookupPath>;
  }

  constructor(
    asff: Record<string, unknown>,
    supportingDocs: Map<SpecialCasing, Record<string, Record<string, unknown>>>,
    meta: Record<string, string | undefined> | undefined = undefined
  ) {
    super(asff);
    this.meta = meta;
    this.supportingDocs = supportingDocs;
    this.setMappings();
  }
}

export class ASFFResults {
  data: Record<string, Record<string, unknown>[]>;
  meta: Record<string, string | undefined> | undefined;
  supportingDocs: Map<SpecialCasing, Record<string, Record<string, unknown>>>;
  constructor(
    asffJson: string,
    securityhubStandardsJsonArray: undefined | string[] = undefined,
    meta: Record<string, string | undefined> | undefined = undefined
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
            `supportingDocs function should've been defined: ${standards}`
          );
        }
      )(securityhubStandardsJsonArray)
    );
    const findings = _.get(fixFileInput(asffJson), 'Findings');
    this.data = _.groupBy(findings, (finding) => {
      const productInfo = (_.get(finding, 'ProductArn') as string)
        .split(':')
        .slice(-1)[0]
        .split('/');
      const defaultFilename = `${productInfo[1]} | ${productInfo[2]}.json`;
      return externalProductHandler(
        this,
        whichSpecialCase(finding),
        [finding, findings],
        'filename',
        encode(defaultFilename)
      );
    });
  }

  toHdf(): Record<string, ExecJSON.Execution> {
    return _.mapValues(this.data, (val) => {
      const wrapped = wrapWithFindingsObject(val);
      return new ASFFMapper(
        externalProductHandler(
          this,
          whichSpecialCase(
            _.get(wrapped, 'Findings[0]') as unknown as Record<string, unknown>
          ),
          wrapped,
          'preprocessingASFF',
          wrapped
        ) as Record<string, unknown>,
        externalProductHandler(
          this,
          whichSpecialCase(
            _.get(wrapped, 'Findings[0]') as unknown as Record<string, unknown>
          ),
          [wrapped, this.supportingDocs],
          'supportingDocs',
          this.supportingDocs
        ),
        externalProductHandler(
          this,
          whichSpecialCase(
            _.get(wrapped, 'Findings[0]') as unknown as Record<string, unknown>
          ),
          undefined,
          'meta',
          this.meta
        ) as Record<string, string>
      ).toHdf();
    });
  }
}
