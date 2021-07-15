import parse from 'csv-parse/lib/sync';
import fs from 'fs';
import { NiktoNistMappingItem } from './NiktoNistMappingItem';

const DEFAULT_NIST_TAG = ['SA-11', 'RA-5']

export class NiktoNistMapping {
  data: NiktoNistMappingItem[];

  constructor(csvDataPath: string) {
    this.data = []
    const contents = parse(fs.readFileSync(csvDataPath, { encoding: 'utf-8' }), { skip_empty_lines: true })
    if (Array.isArray(contents)) {
      contents.slice(1).forEach((line: string[]) => {
        this.data.push(new NiktoNistMappingItem(line))
      })
    }
  }
  nistTag(id: string): string[] {
    if (id === '' || id === undefined) {
      return DEFAULT_NIST_TAG
    } else {
      let key = parseInt(id)
      let item = this.data.find((element) => element.id === key)
      if (item !== null && item !== undefined) {
        return [item.nistId]
      } else {
        return DEFAULT_NIST_TAG
      }
    }
  }
}
