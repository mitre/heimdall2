import parse from 'csv-parse/lib/sync';
import fs from 'fs';
import {OwaspNistMappingItem} from './OwaspNistMappingItem';

export class OwaspNistMapping {
  data: OwaspNistMappingItem[];

  constructor(csvDataPath: string) {
    this.data = [];
    const contents = parse(fs.readFileSync(csvDataPath, {encoding: 'utf-8'}), {
      skip_empty_lines: true
    });
    if (Array.isArray(contents)) {
      contents.slice(1).forEach((line: string[]) => {
        this.data.push(new OwaspNistMappingItem(line));
      });
    }
  }
  nistFilterNoDefault(identifiers: string[]): string[] {
    if (Array.isArray(identifiers)) {
      if (identifiers.length === 0) {
        return [];
      } else {
        const matches: string[] = [];
        identifiers.forEach((id) => {
          const item = this.data.find((element) => element.id === id);
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
      const matches: string[] = [];
      const item = this.data.find((element) => element.id === identifiers);
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
