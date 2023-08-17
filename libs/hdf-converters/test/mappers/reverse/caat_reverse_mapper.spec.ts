import fs from 'fs';
import * as XLSX from 'xlsx';
import {FromHDFToCAATMapper} from '../../../index';

describe('CAAT Results Reverse Mapper', () => {
  it('Successfully converts two RHEL HDF and a RHEL triple overlay HDF into CAAT', () => {
    const rhelData = fs.readFileSync(
      'sample_jsons/caat_reverse_mapper/sample_input_report/red_hat_good.json',
      {encoding: 'utf-8'}
    );
    const tripleData = fs.readFileSync(
      'sample_jsons/caat_reverse_mapper/sample_input_report/triple_overlay_profile_example.json',
      {encoding: 'utf-8'}
    );

    const mapper = new FromHDFToCAATMapper([
      {
        data: rhelData,
        filename: 'red_hat_good.json'
      },
      {
        data: rhelData,
        filename: 'red_hat_good.json' // test dedup functionality
      },
      {
        data: tripleData,
        filename: 'triple_overlay_profile_example.json'
      }
    ]);

    const converted: XLSX.WorkBook = mapper.toCAAT(true);

    const expected = XLSX.readFile(
      'sample_jsons/caat_reverse_mapper/caat.xlsx',
      {type: 'file'}
    );

    // convert workbooks to json to compare just the content instead of random bits of xlsx structure
    expect(
      converted.SheetNames.map((name) =>
        XLSX.utils.sheet_to_json(expected.Sheets[name])
      )
    ).toEqual(
      expected.SheetNames.map((name) =>
        XLSX.utils.sheet_to_json(expected.Sheets[name])
      )
    );
    // however, we do care about one bit of xlsx structure: the sheet names
    expect(converted.SheetNames).toEqual(expected.SheetNames);
  });
});
