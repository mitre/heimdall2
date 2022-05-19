import fs from 'fs';
import {VeracodeMapper} from '../../../src/veracode-mapper';

describe('veracode_mapper', () => {
  it('Successfully converts Veracode reports', () => {
    const mapper = new VeracodeMapper(
      fs.readFileSync(
        'sample_jsons/veracode_mapper/sample_input_report/veracodeoutput.xml',
        {encoding: 'utf-8'}
      )
    );
    fs.writeFileSync(
      'sample_jsons/veracode_mapper/veracode-hdf.json',
      JSON.stringify(mapper.toHdf())
    );
    // expect(omitVersions(mapper.toHdf())).toEqual(
    //   omitVersions(
    //     JSON.parse(
    //       fs.readFileSync('sample_jsons/veracode_mapper/veracode-hdf.json', {
    //         encoding: 'utf-8'
    //       })
    //     )
    //   )
    // );
  });
});
