import type { INESSUSJSONID } from './NessusPluginsNistMapping';

export class NessusPluginsNistMappingItem {
  nistId: string;
  pluginFamily: string;
  pluginId: string;

  constructor(values: INESSUSJSONID) {
    if (values.pluginFamily === undefined) {
      throw new Error(
        'Nessus Plugins Nist Mapping Data must contain a plugin family.',
      );
    } else {
      this.pluginFamily = values.pluginFamily;
    }
    // Could be a string "*" or a number
    this.pluginId = typeof values.pluginID === 'string' ? values.pluginID : values.pluginID.toString();
    this.nistId = values['NIST-ID'] === undefined ? '' : values['NIST-ID'];
  }
}
