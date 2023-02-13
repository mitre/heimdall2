import {IOWASPJSONID} from './OwaspNistMapping';

export class OwaspNistMappingItem {
  id: string;
  name: string;
  nistId: string;
  rev: number;
  nistName: string;

  constructor(values: IOWASPJSONID) {
    if (values['OWASP-ID'] === undefined) {
      throw new Error('OWASP Nist Mapping Data must contain an ID.');
    } else {
      this.id = values['OWASP-ID'];
    }
    if (values['OWASP Name'] === undefined) {
      throw new Error('OWASP Nist Mapping Data must contain a name.');
    } else {
      this.name = values['OWASP Name'];
    }
    if (values['NIST-ID'] === undefined) {
      this.nistId = '';
    } else {
      this.nistId = values['NIST-ID'];
    }
    this.rev = values['Rev'];
    if (values['NIST Name'] === undefined) {
      throw new Error('OWASP Nist Mapping Data must contain a nist name.');
    } else {
      this.nistName = values['NIST Name'];
    }
  }
}
