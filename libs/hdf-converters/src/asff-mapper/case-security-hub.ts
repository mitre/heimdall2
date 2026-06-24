import { encode } from 'html-entities';
import * as _ from 'lodash';
import { AwsConfigMapping } from '../mappings/AwsConfigMapping';
const FINDING_STANDARDS_CONTROL_ARN = 'ProductFields.StandardsControlArn';
const WHITESPACE_RE = /\s+/v;

function correspondingControl(controls: unknown[], finding: unknown) {
  return controls.find(
    control =>
      _.get(control, 'StandardsControlArn')
      === _.get(finding, FINDING_STANDARDS_CONTROL_ARN),
  );
}

function securityhubSupportingDocs(standards: string[] | undefined) {
  let controls: null | unknown[];
  try {
    controls = Array.isArray(standards)
      ? standards
        .flatMap(standard => _.get(JSON.parse(standard), 'Controls'))
      : null;
  } catch (error) {
    throw new Error(
      `Invalid supporting docs for Security Hub:\nException: ${String(error)}`,
      { cause: error },
    );
  }
  const AWS_CONFIG_MAPPING = new AwsConfigMapping();
  return {
    awsConfigMapping: AWS_CONFIG_MAPPING,
    controls,
  };
}

function findingId(
  finding: unknown,
  { controls = null }: { controls: null | unknown[] },
) {
  let control;
  if (
    controls !== null
    && (control = correspondingControl(controls, finding)) !== null
  ) {
    return encode(_.get(control, 'ControlId'));
  }
  if (_.has(finding, 'ProductFields.ControlId')) {
    // AWS Standards
    return _.get(finding, 'ProductFields.ControlId');
  }
  if (_.has(finding, 'ProductFields.RuleId')) {
    // CIS
    return encode(_.get(finding, 'ProductFields.RuleId'));
  }
  return encode(
    (_.get(finding, 'GeneratorId') as unknown as string)
      .split('/')
      .at(-1),
  );
}

function findingImpact(
  finding: unknown,
  { controls = null }: { controls: null | unknown[] },
) {
  let impact: number | string;
  let control;
  if (
    controls !== null
    && (control = correspondingControl(controls, finding)) !== null
  ) {
    impact = _.get(control, 'SeverityRating') as unknown as string;
  } else {
    // severity is required, but must include either 'label' or 'normalized' internally with 'label' being preferred.  other values can be in here too such as the original severity rating.
    impact
      = _.get(finding, 'Severity.Label')
        || (_.get(finding, 'Severity.Normalized') as unknown as number) / 100;
    // securityhub asff file does not contain accurate severity information by setting things that shouldn't be informational to informational: when additional context, i.e. standards, is not provided, set informational to medium.
    if (typeof impact === 'string' && impact === 'INFORMATIONAL') {
      impact = 'MEDIUM';
    }
  }
  return impact;
}

function findingNistTag(
  finding: unknown,
  { awsConfigMapping }: { awsConfigMapping: AwsConfigMapping },
) {
  if (
    _.get(finding, 'ProductFields.RelatedAWSResources:0/type')
    !== 'AWS::Config::ConfigRule'
  ) {
    return [];
  }
  return awsConfigMapping.searchNIST([
    _.get(
      finding,
      'ProductFields.RelatedAWSResources:0/name',
    ) as unknown as string,
  ]);
}

function findingTitle(
  finding: unknown,
  { controls = null }: { controls: null | unknown[] },
) {
  let control;
  return controls !== null
    && (control = correspondingControl(controls, finding)) !== null
    ? encode(_.get(control, 'Title'))
    : encode(_.get(finding, 'Title'));
}

function productName(
  findings: Record<string, unknown> | Record<string, unknown>[],
) {
  const finding = Array.isArray(findings) ? findings[0] : findings;
  // `${_.get(findings[0], 'ProductFields.aws/securityhub/CompanyName')} ${_.get(findings[0], 'ProductFields.aws/securityhub/ProductName')}`
  // not using above due to wanting to provide the standard's name instead
  const standardName = ((_.get(finding, 'Types[0]') as string)
    .split('/')
    .at(-1) ?? '')
    .replaceAll('-', ' ')
    .toLowerCase()
    === (_.get(finding, FINDING_STANDARDS_CONTROL_ARN) as string)
      .split('/')
      .slice(-4)[0]
      .replaceAll('-', ' ')
      .toLowerCase()
    ? ((_.get(finding, 'Types[0]') as string)
      .split('/')
      .at(-1) ?? '')
      .replaceAll('-', ' ')
    : (_.get(finding, FINDING_STANDARDS_CONTROL_ARN) as string)
      .split('/')
      .slice(-4)[0]
      .replaceAll('-', ' ')
      .split(WHITESPACE_RE)
      .map((element: string) => {
        return element.charAt(0).toUpperCase() + element.slice(1);
      })
      .join(' ');
  return encode(
    `${standardName} v${
      (_.get(finding, FINDING_STANDARDS_CONTROL_ARN) as string)
        .split('/')
        .slice(-2)[0]
    }`,
  );
}

function filename(
  findingInfo: [Record<string, unknown>, Record<string, unknown>[]],
) {
  return `${productName(findingInfo[0])}.json`;
}

export function getSecurityHub(): Record<string, (...inputs: any) => any> {
  return {
    filename,
    findingId,
    findingImpact,
    findingNistTag,
    findingTitle,
    productName,
    securityhubSupportingDocs,
  };
}
