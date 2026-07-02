import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { ScoutsuiteMapper } from '../../../src/scoutsuite-mapper';
import { loadFixture, omitVersions } from '../../utils';

describe('scoutsuite_mapper', () => {
  it('Successfully converts Scoutsuite data', () => {
    const mapper = new ScoutsuiteMapper(
      fs.readFileSync(
        'sample_jsons/scoutsuite_mapper/sample_input_report/scoutsuite_sample.js',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/scoutsuite_mapper/scoutsuite-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/scoutsuite_mapper/scoutsuite-hdf.json')),
    );
  });
});

describe('scoutsuite_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Scoutsuite data', () => {
    const mapper = new ScoutsuiteMapper(
      fs.readFileSync(
        'sample_jsons/scoutsuite_mapper/sample_input_report/scoutsuite_sample.js',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/scoutsuite_mapper/scoutsuite-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/scoutsuite_mapper/scoutsuite-hdf-withraw.json')),
    );
  });
});
