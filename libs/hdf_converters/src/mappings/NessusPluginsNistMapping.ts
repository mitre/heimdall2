import parse from 'csv-parse/lib/sync';
import fs from 'fs';
import {NessusPluginsNistMappingItem} from './NessusPluginsNistMappingItem';

export class NessusPluginsNistMapping {
  data: NessusPluginsNistMappingItem[];

  constructor(csvDataPath: string) {
    this.data = [];
    const contents = parse(fs.readFileSync(csvDataPath, {encoding: 'utf-8'}), {
      skip_empty_lines: true
    });
    if (Array.isArray(contents)) {
      contents.slice(1).forEach((line: string[]) => {
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
