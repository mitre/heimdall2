import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {FortifyMapper} from '../../../src/fortify-mapper';
import {omitVersions} from '../../utils';

describe('fortify_mapper', () => {
  it('Successfully converts Fortify reports', () => {
    const mapper = new FortifyMapper(
      fs.readFileSync(
        'sample_jsons/fortify_mapper/sample_input_report/fortify_webgoat_results.fvdl',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/fortify_mapper/fortify-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(JSON.stringify(omitVersions(mapper.toHdf()))).toEqual(
      JSON.stringify(
        omitVersions(
          JSON.parse(
            fs.readFileSync('sample_jsons/fortify_mapper/fortify-hdf.json', {
              encoding: 'utf-8'
            })
          )
        )
      )
    );
  });
});

describe('fortify_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Fortify reports', () => {
    const mapper = new FortifyMapper(
      fs.readFileSync(
        'sample_jsons/fortify_mapper/sample_input_report/fortify_webgoat_results.fvdl',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/fortify_mapper/fortify-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(JSON.stringify(omitVersions(mapper.toHdf()))).toEqual(
      JSON.stringify(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              'sample_jsons/fortify_mapper/fortify-hdf-withraw.json',
              {
                encoding: 'utf-8'
              }
            )
          )
        )
      )
    );
  });
});
