import {default as data} from '../../data/owasp-nist-mapping.json';
import {OwaspNistMappingItem} from './OwaspNistMappingItem';

export interface IOWASPJSONID {
  'OWASP-ID': string;
  'OWASP Name': string;
  'NIST-ID': string;
  'Rev': number;
  'NIST Name': string;
}

export class OwaspNistMapping {
  data: OwaspNistMappingItem[];

  constructor() {
    this.data = [];

    if (Array.isArray(data)) {
      data.forEach((line: IOWASPJSONID) => {
        this.data.push(new OwaspNistMappingItem(line));
      });
    }
  }
  nistFilterNoDefault(identifiers: string[]): string[] {
    if (Array.isArray(identifiers)) {
      if (identifiers.length === 0) {
        return [];
      } else {
        const matches: string[] = [];
        identifiers.forEach((id) => {
          const item = this.data.find((element) => element.id === id);
          if (
            item !== null &&
            item !== undefined &&
            item.nistId !== '' &&
            matches.indexOf(item.nistId) === -1
          ) {
            matches.push(item.nistId);
          }
        });
        return matches;
      }
    } else {
      const matches: string[] = [];
      const item = this.data.find((element) => element.id === identifiers);
      if (
        item !== null &&
        item !== undefined &&
        item.nistId !== '' &&
        matches.indexOf(item.nistId) === -1
      ) {
        matches.push(item.nistId);
      }
      return matches;
    }
  }
}
