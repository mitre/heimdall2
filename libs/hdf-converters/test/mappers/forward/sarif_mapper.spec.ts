import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { SarifMapper } from '../../../src/sarif-mapper';
import { loadFixture, omitVersions } from '../../utils';

describe('sarif_mapper', () => {
  it('Successfully converts Sarif data', () => {
    const mapper = new SarifMapper(
      fs.readFileSync(
        'sample_jsons/sarif_mapper/sample_input_report/sarif_input.sarif',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/sarif_mapper/sarif-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/sarif_mapper/sarif-hdf.json')),
    );
  });
});
describe('sarif_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Sarif data', () => {
    const mapper = new SarifMapper(
      fs.readFileSync(
        'sample_jsons/sarif_mapper/sample_input_report/sarif_input.sarif',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/sarif_mapper/sarif-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/sarif_mapper/sarif-hdf-withraw.json')),
    );
  });
});
