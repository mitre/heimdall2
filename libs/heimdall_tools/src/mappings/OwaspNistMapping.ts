import parse from 'csv-parse/lib/sync';
import fs from 'fs';
import { OwaspNistMappingItem } from './OwaspNistMappingItem';

export class OwaspNistMapping {
  data: OwaspNistMappingItem[];

  constructor(csvDataPath: string) {
    this.data = []
    const contents = parse(fs.readFileSync(csvDataPath, { encoding: 'utf-8' }), { skip_empty_lines: true })
    if (Array.isArray(contents)) {
      contents.slice(1).forEach((line: string[]) => {
        this.data.push(new OwaspNistMappingItem(line))
      })
    }
  }
}
