import fs from 'fs';
import {FileExportTypes, FromHDFToHTMLMapper} from '../../../index';
//import {version as hdfConvertersVersion} from '../../../package.json';

describe('HTML Reverse Mapper', () => {
  it('Successfully converts RHEL7 HDF into HTML (administrator output type)', () => {
    const inputData = [
      {
        data: fs.readFileSync(
          'sample_jsons/caat_reverse_mapper/sample_input_report/red_hat_good.json',
          {encoding: 'utf-8'}
        ),
        fileName: 'red_hat_good.json',
        fileID: '0'
      }
    ];
    const mapper = new FromHDFToHTMLMapper(
      inputData,
      'Administrator' as FileExportTypes
    );

    const converted = mapper.toHTML();
    const expected = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/red_hat_good_html.html',
      'utf-8'
    );

    converted.then((c) => {
      expect(c).toEqual(expected);
    });
  });

  it('Successfully combines two HDF inputs into a single output html (manager output type)', () => {
    const inputData = [
      {
        data: fs.readFileSync(
          'sample_jsons/caat_reverse_mapper/sample_input_report/triple_overlay_profile_example.json',
          {encoding: 'utf-8'}
        ),
        fileName: 'triple_overlay_profile_example.json',
        fileID: '0'
      },
      {
        data: fs.readFileSync(
          'sample_jsons/caat_reverse_mapper/sample_input_report/red_hat_good.json',
          {encoding: 'utf-8'}
        ),
        fileName: 'red_hat_good.json',
        fileID: '1'
      }
    ];

    const mapper = new FromHDFToHTMLMapper(
      inputData,
      'Manager' as FileExportTypes
    );

    const converted = mapper.toHTML();

    const expected = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/combined_hdf_output_html.html',
      'utf-8'
    );
    converted.then((c) => {
      expect(c).toEqual(expected);
    });
  });
});
