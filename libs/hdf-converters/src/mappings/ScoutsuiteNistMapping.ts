import {data} from './ScoutsuiteNistMappingData';
import {ScoutsuiteNistMappingItem} from './ScoutsuiteNistMappingItem';

export interface ISCOUTSUITEJSONID {
  RULE: string;
  'NIST-ID': string;
}
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5'];

export class ScoutsuiteNistMapping {
  data: ScoutsuiteNistMappingItem[];

  constructor() {
    this.data = [];

    if (Array.isArray(data)) {
      this.data = data.map((line) => new ScoutsuiteNistMappingItem(line));
    }
  }
  nistTag(rule: string): string[] {
    if (rule === '' || rule === undefined) {
      return DEFAULT_NIST_TAG;
    } else {
      const item = this.data.find((element) => element.rule === rule);
      if (item !== null && item !== undefined) {
        return item.nistId.split('|');
      } else {
        return DEFAULT_NIST_TAG;
      }
    }
  }
}
