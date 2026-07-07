import type { IOWASPJSONID } from './OwaspNistMapping';

export class OwaspNistMappingItem {
  id: string;
  name: string;
  nistId: string;
  nistName: string;
  rev: number;

  constructor(values: IOWASPJSONID) {
    if (values['OWASP-ID'] === undefined) {
      throw new Error('OWASP Nist Mapping Data must contain an ID.');
    }
    this.id = values['OWASP-ID'];
    if (values['OWASP Name'] === undefined) {
      throw new Error('OWASP Nist Mapping Data must contain a name.');
    }
    this.name = values['OWASP Name'];
    this.nistId = values['NIST-ID'] === undefined ? '' : values['NIST-ID'];
    this.rev = values.Rev;
    if (values['NIST Name'] === undefined) {
      throw new Error('OWASP Nist Mapping Data must contain a nist name.');
    }
    this.nistName = values['NIST Name'];
  }
}
