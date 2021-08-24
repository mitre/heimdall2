import {ISCOUTSUITEJSONID} from './ScoutsuiteNistMapping';

export class ScoutsuiteNistMappingItem {
  rule: string;
  nistId: string;

  constructor(values: ISCOUTSUITEJSONID) {
    if (values['RULE'] === undefined) {
      throw new Error('Scoutsuite Nist Mapping Data must contain a rule.');
    } else {
      this.rule = values['RULE'];
    }
    if (values['NIST-ID'] === undefined) {
      this.nistId = '';
    } else {
      this.nistId = values['NIST-ID'];
    }
  }
}
