import parse from 'csv-parse/';
import fs from 'fs';

class OwaspNistMapping {
  data: OwaspNistMappingItem[];

  constructor(csvDataPath: string) {
    const data = [];
    parse(
      fs.readFileSync(csvDataPath, {encoding: 'utf-8'}),
      {skip_empty_lines: true},
      function (err, line) {
        if (!err === undefined) {
          throw err;
        } else {
          data.push(new OwaspNistMappingItem(line));
        }
      }
    );
    this.data = data;
  }
}
