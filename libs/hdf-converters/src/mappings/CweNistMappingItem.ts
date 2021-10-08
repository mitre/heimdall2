import {ICWEJSONID} from './CweNistMapping';

export class CweNistMappingItem {
  id: number;
  name: string;
  nistId: string;
  rev: number;
  nistName: string;

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
    if (values['NIST-ID'] === undefined) {
      this.nistId = '';
    } else {
      this.nistId = values['NIST-ID'];
    }
    if (values.Rev === undefined) {
      throw new Error('CWE Nist Mapping Data must contain a rev.');
    } else {
      this.rev = values.Rev;
    }
    this.nistName = values['NIST Name'];
  }
}
