import { DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS } from '../utils/global';
import { data } from './ScoutsuiteNistMappingData';
import { ScoutsuiteNistMappingItem } from './ScoutsuiteNistMappingItem';

export type ISCOUTSUITEJSONID = {
  'NIST-ID': string;
  RULE: string;
};

export class ScoutsuiteNistMapping {
  data: ScoutsuiteNistMappingItem[];

  constructor() {
    this.data = [];

    if (Array.isArray(data)) {
      this.data = data.map(line => new ScoutsuiteNistMappingItem(line));
    }
  }

  nistTag(rule: string): string[] {
    if (rule === '' || rule === undefined) {
      return DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
    } else {
      const item = this.data.find(element => element.rule === rule);
      return item !== null && item !== undefined ? item.nistId.split('|') : DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
    }
  }
}
