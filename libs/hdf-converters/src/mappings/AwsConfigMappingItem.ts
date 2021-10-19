export class AwsConfigMappingItem {
  configRuleSourceIdentifier: string;
  configRuleName: string;
  nistId: string;
  nistRevision: number;

  constructor(
    AwsConfigRuleSourceIdentifier: string,
    AwsConfigRuleName: string,
    nistId: string,
    revision: number
  ) {
    if (!AwsConfigRuleSourceIdentifier) {
      throw new Error(
        'AWS Config Mapping Data must contain a config rule source identifier.'
      );
    } else {
      this.configRuleSourceIdentifier = AwsConfigRuleSourceIdentifier;
    }
    if (!AwsConfigRuleName) {
      throw new Error('AWS Config Mapping Data must contain a rule name.');
    } else {
      this.configRuleName = AwsConfigRuleName;
    }
    if (!nistId) {
      this.nistId = '';
    } else {
      this.nistId = nistId;
    }
    // Could possibly be NaN, which is a 'number'
    this.nistRevision = revision;
  }
}
