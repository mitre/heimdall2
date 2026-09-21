import {data} from './HadolintNistMappingData';
import {HadolintNistMappingItem} from './HadolintNistMappingItem';
import {DEFAULT_TESTING_NIST_TAGS} from '../utils/global';

export class HadolintNistMapping {
  data: HadolintNistMappingItem[];

  constructor() {
    this.data = Object.entries(data).map(
      ([rule, control]) => new HadolintNistMappingItem(rule, control)
    );
  }

  controlForRule(rule: string): string | undefined {
    return this.data.find((item) => item.rule === rule)?.control;
  }

  nistTag(rule: string): string[] {
    const control = this.controlForRule(rule);
    return control === undefined ? DEFAULT_TESTING_NIST_TAGS : [control];
  }
}
