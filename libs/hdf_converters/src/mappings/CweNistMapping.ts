import parse from 'csv-parse/lib/sync';
import * as fs from 'fs';
import {CweNistMappingItem} from './CweNistMappingItem';

export class CweNistMapping {
  data: CweNistMappingItem[];

  constructor(csvDataPath: string) {
    this.data = [];
    const contents = parse(fs.readFileSync(csvDataPath, {encoding: 'utf-8'}), {
      skip_empty_lines: true
    });
    if (Array.isArray(contents)) {
      contents.slice(1).forEach((line: string[]) => {
        this.data.push(new CweNistMappingItem(line));
      });
    }
  }
  nistFilter(identifiers: string[], defaultNist: string[]) {
    const DEFAULT_NIST_TAG = defaultNist;
    if (identifiers.length === 0) {
      return DEFAULT_NIST_TAG;
    } else {
      const matches = new Array<string>();
      identifiers.forEach((id) => {
        const key = parseInt(id);
        const item = this.data.find((element) => element.id === key);
        if (
          item !== null &&
          item !== undefined &&
          item.nistId !== '' &&
          matches.indexOf(item.nistId) === -1
        ) {
          matches.push(item.nistId);
        }
      });
      if (matches.length === 0) {
        return DEFAULT_NIST_TAG;
      }
      return matches;
    }
  }
  nistFilterNoDefault(identifiers: string[] | string) {
    if (Array.isArray(identifiers)) {
      if (identifiers.length === 0) {
        return [];
      } else {
        const matches = new Array<string>();
        identifiers.forEach((id) => {
          const key = parseInt(id);
          const item = this.data.find((element) => element.id === key);
          if (
            item !== null &&
            item !== undefined &&
            item.nistId !== '' &&
            matches.indexOf(item.nistId) === -1
          ) {
            matches.push(item.nistId);
          }
        });
        return matches;
      }
    } else {
      const key = parseInt(identifiers);
      const matches = new Array<string>();
      const item = this.data.find((element) => element.id === key);
      if (
        item !== null &&
        item !== undefined &&
        item.nistId !== '' &&
        matches.indexOf(item.nistId) === -1
      ) {
        matches.push(item.nistId);
      }
      return matches;
    }
  }
}
