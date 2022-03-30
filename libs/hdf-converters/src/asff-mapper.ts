import {encode} from 'html-entities';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {BaseConverter, ILookupPath, MappedTransform} from './base-converter';
import {AwsConfigMapping} from './mappings/AwsConfigMapping';

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

// Sometimes certain ASFF file types require massaging in order to generate good HDF files.  These are the supported special cases and a catchall 'Default'.  'Default' files and non-special cased methods for otherwise special cased files do the pre-defined default behaviors when generating the HDF file.
enum SpecialCasing {
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
      (type: string) => _.startsWith(type, 'MITRE/SAF/')
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

type ExternalProductHandlerOutputs =
  | (() => string | number)
  | (() => string | undefined)
  | number
  | string
  | string[]
  | Record<string, unknown>
  | Map<SpecialCasing, Record<string, Record<string, unknown>>>
  | MappedTransform<ExecJSON.Execution, ILookupPath>
  | undefined;

function externalProductHandler(
  context: ASFFMapper | ASFFResults,
  product: SpecialCasing,
  data: unknown,
  func: string,
  defaultVal: ExternalProductHandlerOutputs
): ExternalProductHandlerOutputs {
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
      return defaultVal();
    } else {
      return defaultVal;
    }
  }
}

// consolidate the array of controls which were generated 1:1 with findings in order to have subfindings/results
function consolidate(
  context: ASFFMapper,
  input: unknown[],
  file: Record<string, unknown>
): ExecJSON.Control[] {
  // Group Sub-findings by HDF ID
  const allFindings = _.get(file, 'Findings') as Record<string, unknown>[];
  if (input.length !== allFindings.length) {
    throw new Error(
      'The number of generated controls should be the same as the number of findings at this point in the process.'
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
      ) as string;
    }
  ) as Record<string, [ExecJSON.Control, Record<string, unknown>][]>;

  const output: ExecJSON.Control[] = [];
  Object.entries(idGroups).forEach((idGroup) => {
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

    const item: ExecJSON.Control = {
      // Add productName to ID if any ID's are the same across products
      id: id,
      title: `${productName}: ${_.uniq(group.map((d) => d.title)).join(';')}`,
      tags: _.mergeWith(
        {},
        ...group.map((d) => d.tags),
        (acc: unknown, cur: unknown) => {
          if (acc === undefined || cur === undefined) {
            return undefined;
          } else if (_.isEqual(acc, cur)) {
            return acc;
          } else {
            return _.uniq(_.concat([], acc, cur));
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
      ) as string,
      descriptions: group
        .map((d) => d.descriptions)
        .flat()
        .filter(
          (element, index, arr) =>
            element !== null &&
            element !== undefined &&
            element.data !== '' &&
            index ===
              arr.findIndex(
                (e) => e !== null && e !== undefined && e.data === element.data
              ) // https://stackoverflow.com/a/36744732/645647
        ) as ExecJSON.ControlDescription[],
      refs: group
        .map((d) => d.refs)
        .flat()
        .filter(
          (element) => _.get(element, 'url') !== undefined
        ) as ExecJSON.Reference[],
      source_location: {},
      code: JSON.stringify({Findings: findings}, null, 2),
      results: group.map((d) => d.results).flat() as ExecJSON.ControlResult[]
    };
    output.push(item);
  });
  return output;
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

// eslint-disable-next-line @typescript-eslint/ban-types
function getFirewallManager(): Record<string, Function> {
  const findingId = (finding: Record<string, unknown>): string =>
    encode(_.get(finding, 'Title') as string);
  const productName = (
    findings: Record<string, unknown> | Record<string, unknown>[]
  ): string => {
    const finding = Array.isArray(findings) ? findings[0] : findings;
    return encode(
      `${_.get(finding, 'ProductFields.aws/securityhub/CompanyName')} ${_.get(
        finding,
        'ProductFields.aws/securityhub/ProductName'
      )}`
    );
  };
  const filename = (
    findingInfo: [Record<string, unknown>, Record<string, unknown>[]]
  ): string => {
    return `${productName(findingInfo[1])}.json`;
  };
  return {
    findingId,
    productName,
    filename
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
  const productName = (
    findings: Record<string, unknown> | Record<string, unknown>[]
  ): string => {
    const finding = Array.isArray(findings) ? findings[0] : findings;
    return encode(_.get(finding, 'ProductFields.ProviderName') as string);
  };
  const desc = (): string => ' ';
  const filename = (
    findingInfo: [Record<string, unknown>, Record<string, unknown>[]]
  ): string => {
    return `${productName(findingInfo[1])}.json`;
  };
  const meta = (): Record<string, string> => {
    return {name: 'Prowler', title: 'Prowler Findings'};
  };
  return {
    subfindingsCodeDesc,
    findingId,
    productName,
    desc,
    filename,
    meta
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
  const securityhubSupportingDocs = (standards: string[] | undefined) => {
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
    return awsConfigMapping.searchNIST([
      _.get(finding, 'ProductFields.RelatedAWSResources:0/name')
    ]);
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
  const productName = (
    findings: Record<string, unknown> | Record<string, unknown>[]
  ): string => {
    const finding = Array.isArray(findings) ? findings[0] : findings;
    // `${_.get(findings[0], 'ProductFields.aws/securityhub/CompanyName')} ${_.get(findings[0], 'ProductFields.aws/securityhub/ProductName')}`
    // not using above due to wanting to provide the standard's name instead
    let standardName: string;
    if (
      (_.get(finding, 'Types[0]') as string)
        .split('/')
        .slice(-1)[0]
        .replace(/-/gi, ' ')
        .toLowerCase() ===
      (_.get(finding, FINDING_STANDARDS_CONTROL_ARN) as string)
        .split('/')
        .slice(-4)[0]
        .replace(/-/gi, ' ')
        .toLowerCase()
    ) {
      standardName = (_.get(finding, 'Types[0]') as string)
        .split('/')
        .slice(-1)[0]
        .replace(/-/gi, ' ');
    } else {
      standardName = (_.get(finding, FINDING_STANDARDS_CONTROL_ARN) as string)
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
        (_.get(finding, FINDING_STANDARDS_CONTROL_ARN) as string)
          .split('/')
          .slice(-2)[0]
      }`
    );
  };
  const filename = (
    findingInfo: [Record<string, unknown>, Record<string, unknown>[]]
  ): string => {
    return `${productName(findingInfo[0])}.json`;
  };
  return {
    securityhubSupportingDocs,
    findingId,
    findingImpact,
    findingNistTag,
    findingTitle,
    productName,
    filename
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
function getTrivy(): Record<string, Function> {
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
  const productName = (): string => {
    return 'Aqua Security - Trivy';
  };
  const filename = (): string => {
    return `${productName()}.json`;
  };
  const meta = (): Record<string, string> => {
    return {name: 'Trivy', title: 'Trivy Findings'};
  };
  return {
    findingId,
    findingNistTag,
    subfindingsStatus,
    subfindingsMessage,
    productName,
    filename,
    meta
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
function getHDF2ASFF(): Record<string, Function> {
  const TYPE_NIST_TAG = 'Tags/nist/';
  const replaceTypesSlashes = <T>(type: T): T | string => {
    if (!_.isString(type)) {
      return type;
    }
    const FROM_ASFF_TYPES_SLASH_REPLACEMENT = /{{{SLASH}}}/gi; // The "Types" field of ASFF only supports a maximum of 2 slashes, and will get replaced with this text. Note that the default AWS CLI doesn't support UTF-8 encoding
    return type.replace(FROM_ASFF_TYPES_SLASH_REPLACEMENT, '/');
  };
  const getFilteredTypes = (
    finding: unknown,
    {
      startsWith = [''],
      doesNotStartWith = []
    }: {startsWith?: string[]; doesNotStartWith?: string[]} = {}
  ): string[] => {
    return _.filter(
      _.get(finding, 'FindingProviderFields.Types'),
      (type) =>
        _.some(startsWith, (beginning) => _.startsWith(type, beginning)) &&
        _.every(doesNotStartWith, (beginning) => !_.startsWith(type, beginning))
    );
  };
  const convertClassifierStringToExpectedType = (
    c: string
  ): string | string[] => {
    // brittle since the assumption is that if the classifier is an array, it can be tokenized via commas, i.e. the tokens themselves don't contain any commas
    if (c.startsWith('[') && c.endsWith(']')) {
      return c.slice(1, -1).split(', ');
    }
    return c;
  };
  const findExecutionFindingIndex = (
    asffOrFindings: Record<string, unknown> | Record<string, unknown>[]
  ): number => {
    return _.findIndex(
      Array.isArray(asffOrFindings)
        ? asffOrFindings
        : (_.get(asffOrFindings, 'Findings') as Record<string, unknown>[]),
      (finding) => (_.get(finding, 'Id') as string).split('/').length === 2
    );
  };
  const preprocessingASFF = (
    asff: Record<string, unknown>
  ): Record<string, unknown> => {
    const clone = _.cloneDeep(asff);
    const index = findExecutionFindingIndex(clone);
    _.pullAt(_.get(clone, 'Findings') as Record<string, unknown>[], index);
    return clone;
  };
  const supportingDocs = (
    input: [
      Record<string, unknown>,
      Map<SpecialCasing, Record<string, Record<string, unknown>>>
    ]
  ): Map<SpecialCasing, Record<string, Record<string, unknown>>> => {
    const [asff, docs] = input;
    const index = findExecutionFindingIndex(asff);
    const docsClone = _.cloneDeep(docs);
    docsClone.set(SpecialCasing.HDF2ASFF, {
      execution: _.get(asff, `Findings[${index}]`) as Record<string, unknown>
    });
    return docsClone;
  };
  const findingByTopLevelObject = (finding: unknown, objectName: string): Record<string, unknown> => {
    return _.reduce(
      getFilteredTypes(finding, {
        startsWith: [objectName]
      }),
      (acc: Record<string, unknown>, cur: string) => {
        const [, category, classifier] = cur.split('/');
        if (classifier === '[]') {
          return {...acc, [replaceTypesSlashes(category)]: []};
        } else if (classifier === '""') {
          return {...acc, [replaceTypesSlashes(category)]: ''};
        } else {
          return {
            ...acc,
            [replaceTypesSlashes(category)]:
              convertClassifierStringToExpectedType(
                replaceTypesSlashes(classifier)
              )
          };
        }
      },
      {}
    );
  };
  const productName = (
    findings: Record<string, unknown> | Record<string, unknown>[]
  ): string => {
    const finding = Array.isArray(findings) ? findings[0] : findings;
    const name = _.get(finding, 'Id') as string;
    return encode(name.split('/').slice(0, 2).join(' - '));
  };
  const filename = (
    findingInfo: [Record<string, unknown>, Record<string, unknown>[]]
  ): string => {
    const finding = findingInfo[0];
    return getFilteredTypes(finding, {startsWith: ['File/Input/']})[0]
      .split('/')
      .slice(-1)[0];
  };
  const mapping = (
    context: ASFFMapper
  ): MappedTransform<ExecJSON.Execution, ILookupPath> => {
    const execution = _.get(
      context.supportingDocs.get(SpecialCasing.HDF2ASFF),
      'execution'
    );
    // NOTE: waiting on inspecjs to include passthrough as a potential value in the type
    /*
    const passthroughTag = getFilteredTypes(execution, {
      startsWith: ['Execution/passthrough/']
    });
    */
    const profileNames = _.chain(
      getFilteredTypes(execution, {
        doesNotStartWith: ['MITRE', 'File', 'Execution']
      })
    )
      .map((type) => type.split('/')[0])
      .uniq()
      .value();
    const ret = {
      platform: JSON.parse(
        getFilteredTypes(execution, {
          startsWith: ['Execution/platform/']
        })[0]
          .split('/')
          .slice(2)[0]
      ),
      version: getFilteredTypes(execution, {
        startsWith: ['Execution/version/']
      })[0]
        .split('/')
        .slice(2)[0],
      statistics: JSON.parse(
        getFilteredTypes(execution, {
          startsWith: ['Execution/statistics/']
        })[0]
          .split('/')
          .slice(2)[0]
      ),
      /*
      ...(passthroughTag.length > 0 && {
        passthrough: JSON.parse(passthroughTag[0].split('/').slice(2)[0])
      }),
      */
      profiles: _.map(profileNames, (profileName: string) => {
        return {
          name:
            replaceTypesSlashes(
              getFilteredTypes(execution, {
                startsWith: [`${profileName}/name/`]
              })[0]
                ?.split('/')
                .slice(2)[0]
            ) ?? 'AWS Security Finding Format',
          version:
            replaceTypesSlashes(
              getFilteredTypes(execution, {
                startsWith: [`${profileName}/version/`]
              })[0]
                ?.split('/')
                .slice(2)[0]
            ) ?? '',
          title:
            replaceTypesSlashes(
              getFilteredTypes(execution, {
                startsWith: [`${profileName}/title/`]
              })[0]
                ?.split('/')
                .slice(2)[0]
            ) ?? 'ASFF Findings',
          maintainer:
            replaceTypesSlashes(
              getFilteredTypes(execution, {
                startsWith: [`${profileName}/maintainer/`]
              })[0]
                ?.split('/')
                .slice(2)[0]
            ) ?? null,
          summary:
            replaceTypesSlashes(
              getFilteredTypes(execution, {
                startsWith: [`${profileName}/summary/`]
              })[0]
                ?.split('/')
                .slice(2)[0]
            ) ?? '',
          license:
            replaceTypesSlashes(
              getFilteredTypes(execution, {
                startsWith: [`${profileName}/license/`]
              })[0]
                ?.split('/')
                .slice(2)[0]
            ) ?? null,
          copyright:
            replaceTypesSlashes(
              getFilteredTypes(execution, {
                startsWith: [`${profileName}/copyright/`]
              })[0]
                ?.split('/')
                .slice(2)[0]
            ) ?? null,
          copyright_email:
            replaceTypesSlashes(
              getFilteredTypes(execution, {
                startsWith: [`${profileName}/copyright_email/`]
              })[0]
                ?.split('/')
                .slice(2)[0]
            ) ?? null,
          supports: [],
          attributes: JSON.parse(
            replaceTypesSlashes(
              getFilteredTypes(execution, {
                startsWith: [`${profileName}/inputs/`]
              })[0]
                ?.split('/')
                .slice(2)[0]
            ) ?? '[]'
          ),
          depends: JSON.parse(
            replaceTypesSlashes(
              getFilteredTypes(execution, {
                startsWith: [`${profileName}/depends/`]
              })[0]
                ?.split('/')
                .slice(2)[0]
            ) ?? '[]'
          ),
          groups: [],
          status: 'loaded',
          controls: consolidate(
            context,
            _.map(
              _.get(context.data, 'Findings') as Record<string, unknown>[],
              (finding: Record<string, unknown>) => {
                return {
                  id:
                    replaceTypesSlashes(
                      getFilteredTypes(execution, {
                        startsWith: ['Control/ID/']
                      })[0]
                        ?.split('/')
                        .slice(2)[0]
                    ) ?? '',
                  title:
                    replaceTypesSlashes(
                      getFilteredTypes(execution, {
                        startsWith: ['Control/Title/']
                      })[0]
                        ?.split('/')
                        .slice(2)[0]
                    ) ?? '',
                  desc: '',
                  impact: JSON.parse(
                    replaceTypesSlashes(
                      getFilteredTypes(execution, {
                        startsWith: ['Control/Impact/']
                      })[0]
                        ?.split('/')
                        .slice(2)[0]
                    ) ?? '0'
                  ),
                  tags: {
                    ...findingByTopLevelObject(finding, 'Tags/'),
                    target: replaceTypesSlashes(
                      (_.get(execution, 'Id') as string).split('/')[0]
                    )
                  },
                  descriptions: _.map(Object.entries(findingByTopLevelObject(finding, 'Descriptions/')), ([key, value]) => ({ 'label': key, 'data': value })),
                  refs: [],
                  source_location: {},
                  code:
                    replaceTypesSlashes(
                      getFilteredTypes(execution, {
                        startsWith: ['Control/Code/']
                      })[0]
                        ?.split('/')
                        .slice(2)[0]
                    ) ?? '',
                  results: [findingByTopLevelObject(finding, 'Segment/')]
                };
              }
            ),
            context.data
          ),
          sha256:
            replaceTypesSlashes(
              getFilteredTypes(execution, {
                startsWith: [`${profileName}/sha256/`]
              })[0]
                ?.split('/')
                .slice(2)[0]
            ) ?? ''
        };
      })
    };
    console.log(ret);
    return ret;
  };
  return {
    preprocessingASFF,
    supportingDocs,
    productName,
    filename,
    mapping
  };
}

export class ASFFMapper extends BaseConverter {
  meta: Record<string, string | undefined> | undefined;
  supportingDocs: Map<SpecialCasing, Record<string, Record<string, unknown>>>;

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

  setMappings(): void {
    this.mappings = externalProductHandler(
      this,
      whichSpecialCase(
        _.get(this.data, 'Findings[0]') as Record<string, unknown>
      ),
      this,
      'mapping',
      {
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
                arrayTransformer: consolidate.bind(this, this),
                id: {
                  transformer: (finding: Record<string, unknown>): string =>
                    externalProductHandler(
                      this,
                      whichSpecialCase(finding),
                      finding,
                      'findingId',
                      encode(_.get(finding, 'GeneratorId') as string)
                    ) as string
                },
                title: {
                  transformer: (finding: Record<string, unknown>): string =>
                    externalProductHandler(
                      this,
                      whichSpecialCase(finding),
                      finding,
                      'findingTitle',
                      encode(_.get(finding, 'Title') as string)
                    ) as string
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
                      impact = externalProductHandler(
                        this,
                        whichSpecialCase(finding),
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
                    transformer: (
                      finding: Record<string, unknown>
                    ): string[] => {
                      const tags = externalProductHandler(
                        this,
                        whichSpecialCase(finding),
                        finding,
                        'findingNistTag',
                        []
                      ) as string[];
                      if (tags.length === 0) {
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
                      transformer: (
                        finding: Record<string, unknown>
                      ): string => {
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
                          _.get(finding, 'Resources') as Record<
                            string,
                            unknown
                          >[]
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
                        ) as string | undefined;
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
      }
    ) as MappedTransform<ExecJSON.Execution, ILookupPath>;
    console.log('mappings defined');
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
      const ret = new ASFFMapper(
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
        ) as Map<SpecialCasing, Record<string, Record<string, unknown>>>,
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
      console.log('created an hdf file');
      return ret;
    });
  }
}
