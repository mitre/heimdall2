import type { ICWEJSONID } from './CweNistMapping';

export class CweNistMappingItem {
  id: number;
  name: string;
  nistId: string;
  nistName: string;
  rev: number;

  constructor(values: ICWEJSONID) {
    if (values['CWE-ID'] === undefined) {
      throw new Error('CWE Nist Mapping Data must contain an ID.');
    } else {
      this.id = values['CWE-ID'];
    }
    if (values['CWE Name'] === undefined) {
      throw new Error('CWE Nist Mapping Data must contain a name.');
    } else {
      this.name = values['CWE Name'].trim();
    }
    this.nistId = values['NIST-ID'] === undefined ? '' : values['NIST-ID'];
    if (values.Rev === undefined) {
      throw new Error('CWE Nist Mapping Data must contain a rev.');
    } else {
      this.rev = values.Rev;
    }
    this.nistName = values['NIST Name'];
  }
}
