import { data } from './NessusPluginNistMappingData';
import { NessusPluginsNistMappingItem } from './NessusPluginsNistMappingItem';

export type INESSUSJSONID = {
  'NIST-ID': string;
  pluginFamily: string;
  pluginID: number | string;
};

export class NessusPluginsNistMapping {
  data: NessusPluginsNistMappingItem[];

  constructor() {
    this.data = [];

    if (Array.isArray(data)) {
      for (const line of data) {
        this.data.push(new NessusPluginsNistMappingItem(line));
      }
    }
  }

  nistFilter(family: string, id: string, defaultNist: string[]): string[] {
    const DEFAULT_NIST_TAG = defaultNist;
    const matches: string[] = [];
    const item = this.data.find((element) => {
      return (
        element.pluginFamily === family
        && (element.pluginId === '*' || element.pluginId === id)
        && element.nistId !== ''
      );
    });

    if (
      item !== null
      && item !== undefined
      && item.nistId !== ''
      && !matches.includes(item.nistId)
    ) {
      for (const element of item.nistId.split('|')) {
        matches.push(element);
      }
    }
    if (matches.length === 0) {
      return DEFAULT_NIST_TAG;
    }
    return matches;
  }
}
