import {default as data} from '../../data/nessus-plugins-nist-mapping.json';
import {NessusPluginsNistMappingItem} from './NessusPluginsNistMappingItem';

//type PluginId = string | number;
//type Revision = string | number;

export interface INESSUSJSONID {
  'pluginFamily': string;
  'pluginID': string | number;
  'NIST-ID': string;
  'Rev': string | number;
}

export class NessusPluginsNistMapping {
  data: NessusPluginsNistMappingItem[];

  constructor() {
    this.data = [];

    if (Array.isArray(data)) {
      data.forEach((line: INESSUSJSONID) => {
        this.data.push(new NessusPluginsNistMappingItem(line));
      });
    }
  }
  nistFilter(family: string, id: string, defaultNist: string[]): string[] {
    const DEFAULT_NIST_TAG = defaultNist;
    const matches: string[] = [];
    const item = this.data.find((element) => {
      return (
        element.pluginFamily === family &&
        (element.pluginId === '*' || element.pluginId === id) &&
        element.nistId !== ''
      );
    });

    if (
      item !== null &&
      item !== undefined &&
      item.nistId !== '' &&
      matches.indexOf(item.nistId) === -1
    ) {
      item.nistId.split('|').forEach((element) => {
        matches.push(element);
      });
    }
    if (matches.length === 0) {
      return DEFAULT_NIST_TAG;
    } else {
      matches.push('Rev_4');
    }
    return matches;
  }
}
