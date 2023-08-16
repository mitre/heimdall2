import {encode} from 'html-entities';
import * as _ from 'lodash';
import {AwsConfigMapping} from '../mappings/AwsConfigMapping';
const FINDING_STANDARDS_CONTROL_ARN = 'ProductFields.StandardsControlArn';

function correspondingControl(controls: unknown[], finding: unknown) {
  return controls.find(
    (control) =>
      _.get(control, 'StandardsControlArn') ===
      _.get(finding, FINDING_STANDARDS_CONTROL_ARN)
  );
}

function securityhubSupportingDocs(standards: string[] | undefined) {
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
}

function findingId(
  finding: unknown,
  {controls = null}: {controls: unknown[] | null}
) {
  let control;
  if (
    controls !== null &&
    (control = correspondingControl(controls, finding)) !== null
  ) {
    return encode(_.get(control, 'ControlId'));
  } else if (_.has(finding, 'ProductFields.ControlId')) {
    // AWS Standards
    return _.get(finding, 'ProductFields.ControlId');
  } else if (_.has(finding, 'ProductFields.RuleId')) {
    // CIS
    return encode(_.get(finding, 'ProductFields.RuleId'));
  } else {
    return encode(
      (_.get(finding, 'GeneratorId') as unknown as string)
        .split('/')
        .slice(-1)[0]
    );
  }
}

function findingImpact(
  finding: unknown,
  {controls = null}: {controls: unknown[] | null}
) {
  let impact: string | number;
  let control;
  if (
    controls !== null &&
    (control = correspondingControl(controls, finding)) !== null
  ) {
    impact = _.get(control, 'SeverityRating') as unknown as string;
  } else {
    // severity is required, but must include either 'label' or 'normalized' internally with 'label' being preferred.  other values can be in here too such as the original severity rating.
    impact =
      _.get(finding, 'Severity.Label') ||
      (_.get(finding, 'Severity.Normalized') as unknown as number) / 100.0;
    // securityhub asff file does not contain accurate severity information by setting things that shouldn't be informational to informational: when additional context, i.e. standards, is not provided, set informational to medium.
    if (typeof impact === 'string' && impact === 'INFORMATIONAL') {
      impact = 'MEDIUM';
    }
  }
  return impact;
}

function findingNistTag(
  finding: unknown,
  {awsConfigMapping}: {awsConfigMapping: AwsConfigMapping}
) {
  if (
    _.get(finding, 'ProductFields.RelatedAWSResources:0/type') !==
    'AWS::Config::ConfigRule'
  ) {
    return [];
  }
  return awsConfigMapping.searchNIST([
    _.get(
      finding,
      'ProductFields.RelatedAWSResources:0/name'
    ) as unknown as string
  ]);
}

function findingTitle(
  finding: unknown,
  {controls = null}: {controls: unknown[] | null}
) {
  let control;
  if (
    controls !== null &&
    (control = correspondingControl(controls, finding)) !== null
  ) {
    return encode(_.get(control, 'Title'));
  } else {
    return encode(_.get(finding, 'Title'));
  }
}

function productName(
  findings: Record<string, unknown> | Record<string, unknown>[]
) {
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
}

function filename(
  findingInfo: [Record<string, unknown>, Record<string, unknown>[]]
) {
  return `${productName(findingInfo[0])}.json`;
}

export function getSecurityHub(): Record<string, (...inputs: any) => any> {
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
