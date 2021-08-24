import {default as data} from '../../data/nikto-nist-mapping.json';
import {NiktoNistMappingItem} from './NiktoNistMappingItem';

export interface INIKJSONID {
  'NIKTO-ID': number;
  'PLUGIN-CATEGORY': string;
  'NIST-ID': string;
  OSVDB: number;
}
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5'];

export class NiktoNistMapping {
  data: NiktoNistMappingItem[];

  constructor() {
    this.data = [];

    if (Array.isArray(data)) {
      data.forEach((line: INIKJSONID) => {
        this.data.push(new NiktoNistMappingItem(line));
      });
    }
  }
  nistTag(id: string): string[] {
    if (id === '' || id === undefined) {
      return DEFAULT_NIST_TAG;
    } else {
      const key = parseInt(id);
      const item = this.data.find((element) => element.id === key);
      if (item !== null && item !== undefined) {
        return [item.nistId];
      } else {
        return DEFAULT_NIST_TAG;
      }
    }
  }
}
