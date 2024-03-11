import * as XLSX from '@e965/xlsx';
import fs from 'fs';
import * as _ from 'lodash';
import {CAATRow, FromHDFToCAATMapper} from '../../../index';

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

    // fs.writeFileSync(
    //   'sample_jsons/caat_reverse_mapper/converted.json',
    //   JSON.stringify(
    //     converted.SheetNames.map((name) =>
    //       XLSX.utils
    //         .sheet_to_json<CAATRow>(converted.Sheets[name])
    //         .map((sheet) =>
    //           Object.fromEntries(
    //             Object.entries(sheet).map(([k, v]) => [
    //               k,
    //               _.isString(v) ? FromHDFToCAATMapper.fix(v) : v
    //             ])
    //           )
    //         )
    //     ),
    //     null,
    //     2
    //   )
    // );

    // convert workbooks to json to compare just the content instead of random bits of xlsx structure
    // needs some processing to ensure all newlines are consistent otherwise it pitches a fit - if you open the sample up in excel, it might autoconvert the newlines so this is a safety measure
    expect(
      converted.SheetNames.map((name) =>
        XLSX.utils
          .sheet_to_json<CAATRow>(converted.Sheets[name])
          .map((sheet) =>
            Object.fromEntries(
              Object.entries(sheet).map(([k, v]) => [
                k,
                _.isString(v) ? FromHDFToCAATMapper.fix(v) : v
              ])
            )
          )
      )
    ).toEqual(
      expected.SheetNames.map((name) =>
        XLSX.utils
          .sheet_to_json<CAATRow>(expected.Sheets[name])
          .map((sheet) =>
            Object.fromEntries(
              Object.entries(sheet).map(([k, v]) => [
                k,
                _.isString(v) ? FromHDFToCAATMapper.fix(v) : v
              ])
            )
          )
      )
    );
    // however, we do care about one bit of xlsx structure: the sheet names
    expect(converted.SheetNames).toEqual(expected.SheetNames);
  });
});
