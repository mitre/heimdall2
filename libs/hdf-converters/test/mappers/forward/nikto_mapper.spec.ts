import {describe, expect, it} from 'vitest';
import {NiktoMapper} from '../../../src/nikto-mapper';
import {omitVersions, readSample} from '../../utils';

describe('nikto_mapper', () => {
  it('Successfully converts Nikto data', () => {
    const mapper = new NiktoMapper(
      readSample(
        'nikto_mapper/sample_input_report/zero.webappsecurity.json'
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/nikto_mapper/nikto-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          readSample('nikto_mapper/nikto-hdf.json')
        )
      )
    );
  });
});

describe('nikto_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Nikto data', () => {
    const mapper = new NiktoMapper(
      readSample(
        'nikto_mapper/sample_input_report/zero.webappsecurity.json'
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/nikto_mapper/nikto-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          readSample('nikto_mapper/nikto-hdf-withraw.json')
        )
      )
    );
  });
});
