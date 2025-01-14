import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './CciNistMappingData';
import {data} from './ScoutsuiteNistMappingData';
import {ScoutsuiteNistMappingItem} from './ScoutsuiteNistMappingItem';

export interface ISCOUTSUITEJSONID {
  RULE: string;
  'NIST-ID': string;
}

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
      return DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
    } else {
      const item = this.data.find((element) => element.rule === rule);
      if (item !== null && item !== undefined) {
        return item.nistId.split('|');
      } else {
        return DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
      }
    }
  }
}
