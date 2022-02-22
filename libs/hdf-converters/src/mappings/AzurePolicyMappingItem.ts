export class AzurePolicyMappingItem {
  policyName: string;
  nistId: string;
  nistRevision: number;

  constructor(
    AzurePolicyName: string,
    nistId: string,
    revision: number
  ) {
    if (!AzurePolicyName) {
      throw new Error('Azure Policy must contain a name.');
    } else {
      this.policyName = AzurePolicyName;
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
