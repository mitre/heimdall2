import {INESSUSJSONID} from './NessusPluginsNistMapping';

export class NessusPluginsNistMappingItem {
  pluginFamily: string;
  pluginId: string;
  nistId: string;
  rev: number;

  constructor(values: INESSUSJSONID) {
    if (values['pluginFamily'] === undefined) {
      throw new Error(
        'Nessus Plugins Nist Mapping Data must contain a plugin family.'
      );
    } else {
      this.pluginFamily = values['pluginFamily'];
    }
    // Could be a string "*" or a number
    if (typeof values['pluginID'] === 'string') {
      this.pluginId = values['pluginID'];
    } else {
      this.pluginId = values['pluginID'].toString();
    }
    if (values['NIST-ID'] === undefined) {
      this.nistId = '';
    } else {
      this.nistId = values['NIST-ID'];
    }
    // Could possibly be number, string, or null
    if (typeof values['Rev'] === 'number') {
      this.rev = values['Rev'];
    } else {
      this.rev = 0
    }
  }
}
