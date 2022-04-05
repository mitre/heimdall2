import {encode} from 'html-entities';
import _ from 'lodash';

// eslint-disable-next-line @typescript-eslint/ban-types
export function getProwler(): Record<string, Function> {
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
