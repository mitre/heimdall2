import type { INIKJSONID } from './NiktoNistMapping';

export class NiktoNistMappingItem {
  id: number;
  nistId: string;
  osvdb: number;
  pluginCategory: string;

  constructor(values: INIKJSONID) {
    if (values['NIKTO-ID'] === undefined) {
      throw new Error('Nikto Nist Mapping Data must contain an id.');
    }
    this.id = values['NIKTO-ID'];
    if (values['PLUGIN-CATEGORY'] === undefined) {
      throw new Error(
        'Nikto Nist Mapping Data must contain a plugin category.',
      );
    }
    this.pluginCategory = values['PLUGIN-CATEGORY'];
    this.nistId = values['NIST-ID'] === undefined ? '' : values['NIST-ID'];
    this.osvdb = values.OSVDB;
  }
}
