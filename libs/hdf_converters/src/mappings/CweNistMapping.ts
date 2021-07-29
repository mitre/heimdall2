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
  nistFilter(identifiers: string[] | string, defaultNist?: string[]): string[] {
    const DEFAULT_NIST_TAG = defaultNist;
    if (!Array.isArray(identifiers)) {
      identifiers = [identifiers]
    }
    if (identifiers.length === 0) {
      if (DEFAULT_NIST_TAG !== undefined) {
        return DEFAULT_NIST_TAG;
      } else {
        return []
      }
    } else {
      const matches: string[] = [];
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
      if (matches.length === 0 && DEFAULT_NIST_TAG !== undefined) {
        return DEFAULT_NIST_TAG;
      }
      return matches;
    }
  }
}
