import type { ISCOUTSUITEJSONID } from './ScoutsuiteNistMapping';

export class ScoutsuiteNistMappingItem {
  nistId: string;
  rule: string;

  constructor(values: ISCOUTSUITEJSONID) {
    if (values.RULE === undefined) {
      throw new Error('Scoutsuite Nist Mapping Data must contain a rule.');
    } else {
      this.rule = values.RULE;
    }
    this.nistId = values['NIST-ID'] === undefined ? '' : values['NIST-ID'];
  }
}
