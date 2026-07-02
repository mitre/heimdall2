import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { NiktoMapper } from '../../../src/nikto-mapper';
import { loadFixture, omitVersions } from '../../utils';

describe('nikto_mapper', () => {
  it('Successfully converts Nikto data', () => {
    const mapper = new NiktoMapper(
      fs.readFileSync(
        'sample_jsons/nikto_mapper/sample_input_report/zero.webappsecurity.json',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/nikto_mapper/nikto-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/nikto_mapper/nikto-hdf.json')),
    );
  });
});

describe('nikto_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Nikto data', () => {
    const mapper = new NiktoMapper(
      fs.readFileSync(
        'sample_jsons/nikto_mapper/sample_input_report/zero.webappsecurity.json',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/nikto_mapper/nikto-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/nikto_mapper/nikto-hdf-withraw.json')),
    );
  });
});
