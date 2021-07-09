export class CweNistMappingItem {
  id: number;
  name: string;
  nistId: string;
  rev: number;
  nistName: string;

  constructor(values: string[]) {
    if (values[0] === undefined) {
      throw new Error('CWE Nist Mapping Data must contain an ID.');
    } else {
      this.id = parseInt(values[0]);
    }
    if (values[1] === undefined) {
      throw new Error('CWE Nist Mapping Data must contain a name.');
    } else {
      this.name = values[1];
    }
    if (values[2] === undefined) {
      this.nistId = '';
    } else {
      this.nistId = values[2];
    }
    if (values[3] === undefined) {
      throw new Error('CWE Nist Mapping Data must contain a rev.');
    } else {
      this.rev = parseInt(values[3]);
    }
    this.nistName = values[4];
  }
}
