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

describe('nikto_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Nikto data', () => {
    const mapper = new NiktoMapper(
      fs.readFileSync(
        'sample_jsons/nikto_mapper/sample_input_report/zero.webappsecurity.json',
        {encoding: 'utf-8'}
      ),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/nikto_mapper/nikto-hdf-withraw.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
