export class OwaspNistMappingItem {
  id: string;
  name: string;
  nistId: string;
  rev: number;
  nistName: string;

  constructor(values: string[]) {
    if (values[0] === undefined) {
      throw new Error('OWASP Nist Mapping Data must contain an ID.');
    } else {
      this.id = values[0];
    }
    if (values[1] === undefined) {
      throw new Error('OWASP Nist Mapping Data must contain a name.');
    } else {
      this.name = values[1];
    }
    if (values[2] === undefined) {
      this.nistId = '';
    } else {
      this.nistId = values[2];
    }
    this.rev = parseInt(values[3]);
    if (values[4] === undefined) {
      throw new Error('OWASP Nist Mapping Data must contain a nist name.');
    } else {
      this.nistName = values[4];
    }
  }
}
