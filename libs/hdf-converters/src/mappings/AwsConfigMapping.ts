import {default as data} from '../../data/aws-config-mapping.json';
import {AwsConfigMappingItem} from './AwsConfigMappingItem';

export class AwsConfigMapping {
  data: AwsConfigMappingItem[];

  constructor() {
    this.data = [];
    Object.entries(data).forEach((item) => {
      this.data.push(
        new AwsConfigMappingItem(
          item[1].AwsConfigRuleSourceIdentifier,
          item[1].AwsConfigRuleName,
          item[1]['NIST-ID'],
          item[1].Rev
        )
      );
    });
  }
  nistFilter(identifiers: string[]): string[] | null {
    if (identifiers.length === 0) {
      return null;
    } else {
      let matches: string[] = [];
      identifiers.forEach((sourceIdentifier) => {
        const item = this.data.find(
          (element) => element.configRuleSourceIdentifier === sourceIdentifier
        );
        if (
          item !== null &&
          item !== undefined &&
          item.nistId !== '' &&
          matches.indexOf(item.nistId) === -1
        ) {
          matches = matches.concat(item.nistId.split('|'));
        }
      });
      if (matches.length === 0) {
        return null;
      }
      return matches;
    }
  }
}
