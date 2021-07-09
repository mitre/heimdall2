export class AwsConfigMappingItem {
  configRuleSourceIdentifier: string;
  configRuleName: string;
  nistId: string;
  nistRevision: number;

  constructor(values: string[]) {
    if (values[0] === undefined) {
      throw new Error(
        'AWS Config Mapping Data must contain a config rule source identifier.'
      );
    } else {
      this.configRuleSourceIdentifier = values[0];
    }
    if (values[1] === undefined) {
      throw new Error('AWS Config Mapping Data must contain a rule name.');
    } else {
      this.configRuleName = values[1];
    }
    if (values[2] === undefined) {
      this.nistId = '';
    } else {
      this.nistId = values[2];
    }
    // Could possibly be NaN, which is a 'number'
    this.nistRevision = parseInt(values[3]);
  }
}
