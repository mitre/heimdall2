import fs from 'fs';
import {NiktoMapper} from '../../../src/nikto-mapper';
import {omitVersions} from '../../utils';

describe('nikto_mapper', () => {
  it('Successfully converts Nikto data', () => {
    const mapper = new NiktoMapper(
      fs.readFileSync(
        'sample_jsons/nikto_mapper/sample_input_report/zero.webappsecurity.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/nikto_mapper/nikto-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/nikto_mapper/nikto-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
