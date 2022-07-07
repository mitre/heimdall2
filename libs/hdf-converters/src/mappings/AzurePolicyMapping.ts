import {default as data} from '../../data/azure-policy-mapping.json';
import {AzurePolicyMappingItem} from './AzurePolicyMappingItem';

export class AzurePolicyMapping {
  data: AzurePolicyMappingItem[];

  constructor() {
    this.data = [];
    Object.entries(data).forEach((item) => {
      this.data.push(
        new AzurePolicyMappingItem(
          item[1].AzurePolicyName,
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
      identifiers.forEach((policyName) => {
        const item = this.data.find(
          (element) => element.policyName === policyName
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
