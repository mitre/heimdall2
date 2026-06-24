import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { FortifyResults } from '../../../src/fortify-mapper';
import { loadFixture, omitVersions } from '../../utils';

describe('fortify_mapper', () => {
  it('Successfully converts Fortify reports', async () => {
    const mapper = new FortifyResults(
      fs.readFileSync(
        'sample_jsons/fortify_mapper/sample_input_report/fortify_webgoat_results.fvdl',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/fortify_mapper/fortify-hdf.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(JSON.stringify(omitVersions(await mapper.toHdf()))).toEqual(
      JSON.stringify(
        omitVersions(loadFixture('sample_jsons/fortify_mapper/fortify-hdf.json')),
      ),
    );
  });
});

describe('fortify_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Fortify reports', async () => {
    const mapper = new FortifyResults(
      fs.readFileSync(
        'sample_jsons/fortify_mapper/sample_input_report/fortify_webgoat_results.fvdl',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/fortify_mapper/fortify-hdf-withraw.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(JSON.stringify(omitVersions(await mapper.toHdf()))).toEqual(
      JSON.stringify(
        omitVersions(loadFixture('sample_jsons/fortify_mapper/fortify-hdf-withraw.json')),
      ),
    );
  });
});
