import {encode} from 'html-entities';
import * as _ from 'lodash';

function findingId(finding: Record<string, unknown>): string {
  return encode(_.get(finding, 'Title') as string);
}

function productName(
  findings: Record<string, unknown> | Record<string, unknown>[]
): string {
  const finding = Array.isArray(findings) ? findings[0] : findings;
  return encode(
    `${_.get(finding, 'ProductFields.aws/securityhub/CompanyName')} ${_.get(
      finding,
      'ProductFields.aws/securityhub/ProductName'
    )}`
  );
}

function filename(
  findingInfo: [Record<string, unknown>, Record<string, unknown>[]]
): string {
  return `${productName(findingInfo[1])}.json`;
}

export function getFirewallManager(): Record<string, (...inputs: any) => any> {
  return {
    findingId,
    productName,
    filename
  };
}
