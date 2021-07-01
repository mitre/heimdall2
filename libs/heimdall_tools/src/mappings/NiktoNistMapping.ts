import parse from 'csv-parse/';
import fs from 'fs';

class NiktoNistMapping {
  data: NiktoNistMappingItem[];

  constructor(csvDataPath: string) {
    let data = new Array()
    parse(fs.readFileSync(csvDataPath, { encoding: 'utf-8' }), { skip_empty_lines: true }, function (err, line) {
      if (!err === undefined) {
        throw err
      } else {
        data.push(new NiktoNistMappingItem(line))
      }
    })
    this.data = data;
  }
}
