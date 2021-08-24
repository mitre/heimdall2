import {INIKJSONID} from './NiktoNistMapping';

export class NiktoNistMappingItem {
  id: number;
  pluginCategory: string;
  nistId: string;
  osvdb: number;

  constructor(values: INIKJSONID) {    
    if (values['NIKTO-ID'] === undefined) {
      throw new Error('Nikto Nist Mapping Data must contain an id.');
    } else {
      this.id = values['NIKTO-ID'];
    }
    if (values['PLUGIN-CATEGORY'] === undefined) {
      throw new Error(
        'Nikto Nist Mapping Data must contain a plugin category.'
      );
    } else {
      this.pluginCategory = values['PLUGIN-CATEGORY'];
    }
    if (values['NIST-ID'] === undefined) {
      this.nistId = '';
    } else {
      this.nistId = values['NIST-ID'];
    }
    this.osvdb = values['OSVDB'];
  }
}
