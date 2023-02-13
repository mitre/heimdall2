import fs from 'fs';
import {ScoutsuiteMapper} from '../../../src/scoutsuite-mapper';
import {omitVersions} from '../../utils';

describe('scoutsuite_mapper', () => {
  it('Successfully converts Scoutsuite data', () => {
    const mapper = new ScoutsuiteMapper(
      fs.readFileSync(
        'sample_jsons/scoutsuite_mapper/sample_input_report/scoutsuite_sample.js',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/scoutsuite_mapper/scoutsuite-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/scoutsuite_mapper/scoutsuite-hdf.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });
});

describe('scoutsuite_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Scoutsuite data', () => {
    const mapper = new ScoutsuiteMapper(
      fs.readFileSync(
        'sample_jsons/scoutsuite_mapper/sample_input_report/scoutsuite_sample.js',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/scoutsuite_mapper/scoutsuite-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/scoutsuite_mapper/scoutsuite-hdf-withraw.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });
});
