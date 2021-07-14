export class NessusPluginsNistMappingItem {
  pluginFamily: string;
  pluginId: string;
  nistId: string;
  rev: number;

  constructor(values: string[]) {
    if (values[0] === undefined) {
      throw new Error(
        'Nessus Plugins Nist Mapping Data must contain a plugin family.'
      );
    } else {
      this.pluginFamily = values[0];
    }
    this.pluginId = values[1];
    if (values[2] === undefined) {
      this.nistId = '';
    } else {
      this.nistId = values[2];
    }
    // Could possibly be NaN, which is a 'number'
    this.rev = parseInt(values[3]);
  }
}
