export class ScoutsuiteNistMappingItem {
  rule: string;
  nistId: string;

  constructor(values: string[]) {
    if (values[0] === undefined) {
      throw new Error('Scoutsuite Nist Mapping Data must contain a rule.');
    } else {
      this.rule = values[0];
    }
    if (values[1] === undefined) {
      this.nistId = '';
    } else {
      this.nistId = values[1];
    }
  }
}
