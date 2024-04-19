import fs from 'fs';
import {DependencyTrackMapper} from '../../../src/dependency-track-mapper';
import {omitVersions} from '../../utils';

describe('dependency_track_mapper', () => {
  it('Successfully converts Dependency Track targeted at a local/cloned repository data', () => {
    const mapper = new DependencyTrackMapper(
      fs.readFileSync(
        'sample_jsons/dependency_track_mapper/sample_input_report/dt-fpf.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/dependency_track_mapper/dt-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/dependency_track_mapper/dt-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('dependency_track_mapper_withraw', () => {
  it('Successfully converts withraw flagged Dependency Track targeted at a local/cloned repository data', () => {
    const mapper = new DependencyTrackMapper(
      fs.readFileSync(
        'sample_jsons/dependency_track_mapper/sample_input_report/dt-fpf.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/dependency_track_mapper/dt-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/dependency_track_mapper/dt-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
