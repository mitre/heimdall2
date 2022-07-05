import fs from 'fs';
import {SarifMapper} from '../../../src/sarif-mapper';
import {omitVersions} from '../../utils';

describe('sarif_mapper', () => {
  it('Successfully converts Sarif data', () => {
    const mapper = new SarifMapper(
      fs.readFileSync(
        'sample_jsons/sarif_mapper/sample_input_report/sarif_input.sarif',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/sarif_mapper/sarif-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/sarif_mapper/sarif-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
