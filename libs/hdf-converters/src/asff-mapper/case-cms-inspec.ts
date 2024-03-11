import {encode} from 'html-entities';
import * as _ from 'lodash';

function findingId(finding: Record<string, unknown>): string {
  return encode(
    (_.get(finding, 'ProductFields.aws/securityhub/FindingId') as string)
      .split('/')
      .slice(-1)[0]
      .split('-')
      .slice(0, -1)
      .join('-')
  );
}

function findingTitle(finding: Record<string, unknown>): string {
  return encode(
    (_.get(finding, 'Description') as string)
      .slice(`${_.get(finding, 'Title') as string} titled `.length)
      .split(' : ')[0]
  );
}

function findingDescription(finding: Record<string, unknown>): string {
  return findingTitle(finding);
}

function subfindingsCodeDesc(finding: Record<string, unknown>): string {
  return encode(
    (_.get(finding, 'Description') as string)
      .slice(`${_.get(finding, 'Title') as string} titled `.length)
      .split(' : ')[1]
  );
}

function titlePrefix(): string {
  return '';
}

function productName(
  findings: Record<string, unknown> | Record<string, unknown>[]
): string {
  const finding = Array.isArray(findings) ? findings[0] : findings;
  return `cms_chef_inspec-${encode(
    (_.get(finding, 'ProductFields.aws/securityhub/FindingId') as string)
      .split('/')
      .slice(-2)[0]
  )}`;
}

function filename(
  findingInfo: [Record<string, unknown>, Record<string, unknown>[]]
): string {
  return `${productName(findingInfo[0])}.json`;
}

export function getCMSInSpec(): Record<string, (...inputs: any) => any> {
  return {
    findingId,
    findingTitle,
    findingDescription,
    subfindingsCodeDesc,
    titlePrefix,
    productName,
    filename
  };
}
