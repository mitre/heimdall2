import parse from 'csv-parse/';
import fs from 'fs';

export class CweNistMapping {
  data: CweNistMappingItem[];

  constructor(csvDataPath: string) {
    this.data = new Array<CweNistMappingItem>();
    // parse({ from_line: 2 }, fs.readFileSync(csvDataPath, { encoding: 'utf-8' }), { skip_empty_lines: true }, function (err, line) {
    // if (!err === undefined) {
    //   throw err
    // } else {
    //   data.push(new CweNistMappingItem(line))
    // }
    // })
    fs.createReadStream(csvDataPath).pipe(
      parse({from_line: 2}, (error, row) => {
        if (error === undefined) {
          this.data.push(new CweNistMappingItem(row));
        }
      })
    );
  }
}
