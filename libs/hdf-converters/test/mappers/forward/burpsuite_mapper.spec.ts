import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {BurpSuiteMapper} from '../../../src/burpsuite-mapper';
import {omitVersions} from '../../utils';

describe('burpsuite_mapper', () => {
  it('Successfully converts Burpsuite reports', () => {
    const mapper = new BurpSuiteMapper(
      fs.readFileSync(
        'sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/burpsuite_mapper/burpsuite-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/burpsuite_mapper/burpsuite-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('burpsuite_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Burpsuite reports', () => {
    const mapper = new BurpSuiteMapper(
      fs.readFileSync(
        'sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/burpsuite_mapper/burpsuite-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/burpsuite_mapper/burpsuite-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
