import {encode} from 'html-entities';
import _ from 'lodash';

// eslint-disable-next-line @typescript-eslint/ban-types
export function getFirewallManager(): Record<string, Function> {
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
