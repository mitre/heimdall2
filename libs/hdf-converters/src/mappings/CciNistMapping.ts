import {data} from './CciNistMappingData';
import {CciNistMappingItem} from './CciNistMappingItem';

export class CciNistMapping {
  data: CciNistMappingItem[];

  constructor() {
    this.data = [];

    if (typeof data === 'object') {
      Object.entries(data).forEach((item) => {
        this.data.push(new CciNistMappingItem(item[0], item[1]));
      });
    }
  }

  nistFilter(
    identifiers: string[],
    defaultNist: string[],
    collapse = true
  ): string[] {
    const DEFAULT_NIST_TAG = defaultNist;
    const matches: string[] = [];
    identifiers.forEach((id) => {
      const item = this.data.find((element) => element.cci === id);
      if (item && item.nistId) {
        if (collapse) {
          if (matches.indexOf(item.nistId) === -1) {
            matches.push(item.nistId);
          }
        } else {
          matches.push(item.nistId);
        }
      }
    });
    if (matches.length === 0) {
      return DEFAULT_NIST_TAG;
    }
    return matches;
  }
}
