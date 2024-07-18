import fs from 'fs';
import {TrufflehogMapper} from '../../../src/trufflehog-mapper';
import {omitVersions} from '../../utils';

describe('SKELETON_mapper', () => {
  it('Successfully converts SKELETON targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogMapper(
      fs.readFileSync(
        'sample_jsons/SKELETON_mapper/sample_input_report/SKELETON.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/SKELETON_mapper/SKELETON-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/SKELETON_mapper/SKELETON-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('SKELETON_mapper_withraw', () => {
  it('Successfully converts withraw flagged SKELETON targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogMapper(
      fs.readFileSync(
        'sample_jsons/SKELETON_mapper/sample_input_report/SKELETON.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/SKELETON_mapper/SKELETON-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/SKELETON_mapper/SKELETON-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});