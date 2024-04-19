import fs from 'fs';
import {DependencyTrackMapper} from '../../../src/dependency-track-mapper';
import {omitVersions} from '../../utils';

describe('dependency_track_mapper', () => {
  it('Successfully converts Dependency Track targeted at a local/cloned repository data', () => {
    const mapper = new DependencyTrackMapper(
      fs.readFileSync(
        'sample_jsons/dependency_track_mapper/sample_input_report/fpf-default.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/dependency_track_mapper/hdf-default.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/dependency_track_mapper/hdf-default.json', {
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
        'sample_jsons/dependency_track_mapper/sample_input_report/fpf-default.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/dependency_track_mapper/hdf-default-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/dependency_track_mapper/hdf-default-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('dependency_track_mapper_optional_attributes', () => {
  it('Successfully converts Dependency Track targeted at a local/cloned repository data with optional attributes (e.g. vulnerability.cwes, analysis.state, etc.)', () => {
    const mapper = new DependencyTrackMapper(
      fs.readFileSync(
        'sample_jsons/dependency_track_mapper/sample_input_report/fpf-optional-attributes.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/dependency_track_mapper/hdf-optional-attributes.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/dependency_track_mapper/hdf-optional-attributes.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('dependency_track_mapper_no_vulnerabilities', () => {
  it('Successfully converts Dependency Track targeted at a local/cloned repository data with no vulnerabilities', () => {
    const mapper = new DependencyTrackMapper(
      fs.readFileSync(
        'sample_jsons/dependency_track_mapper/sample_input_report/fpf-no-vulnerabilities.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/dependency_track_mapper/hdf-no-vulnerabilities.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/dependency_track_mapper/hdf-no-vulnerabilities.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
