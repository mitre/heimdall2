export class CciNistMappingItem {
  cci: string;
  nistId: string;

  constructor(cci_value: string, nistId_value: string) {
    this.cci = cci_value;
    this.nistId = nistId_value;
  }
}
