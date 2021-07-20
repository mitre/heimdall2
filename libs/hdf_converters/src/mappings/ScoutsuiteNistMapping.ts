import parse from 'csv-parse/lib/sync';
import fs from 'fs';
import {ScoutsuiteNistMappingItem} from './ScoutsuiteNistMappingItem';

const DEFAULT_NIST_TAG = ['SA-11', 'RA-5'];

export class ScoutsuiteNistMapping {
  data: ScoutsuiteNistMappingItem[];

  constructor(csvDataPath: string) {
    this.data = [];
    const contents = parse(fs.readFileSync(csvDataPath, {encoding: 'utf-8'}), {
      skip_empty_lines: true
    });
    if (Array.isArray(contents)) {
      contents.slice(1).forEach((line: string[]) => {
        this.data.push(new ScoutsuiteNistMappingItem(line));
      });
    }
  }
  nistTag(rule: string): string[] {
    if (rule === '' || rule === undefined) {
      return DEFAULT_NIST_TAG;
    } else {
      const item = this.data.find((element) => element.rule === rule);
      if (item !== null && item !== undefined) {
        return item.nistId.split('|');
      } else {
        return DEFAULT_NIST_TAG;
      }
    }
  }
}
