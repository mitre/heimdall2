import parse from 'csv-parse/';
import fs from 'fs';

export class CweNistMapping {
  data: CweNistMappingItem[];

  constructor(csvDataPath: string) {
    let data = new Array()
    parse(fs.readFileSync(csvDataPath, { encoding: 'utf-8' }), { skip_empty_lines: true }, function (err, line) {
      if (!err === undefined) {
        throw err
      } else {
        data.push(new CweNistMappingItem(line))
      }
    })
    this.data = data;
  }
  lookupFilter(query: string): any {
    // do this later
  }
}
