import {describe, expect, it} from 'vitest';
import {DependencyTrackMapper} from '../../../src/dependency-track-mapper';
import {omitVersions, readSample} from '../../utils';

describe('dependency_track_mapper', () => {
  it('Successfully converts Dependency Track targeted at a local/cloned repository data', () => {
    const mapper = new DependencyTrackMapper(
      readSample('dependency_track_mapper/sample_input_report/fpf-default.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('dependency_track_mapper/hdf-default.json')))
    );
  });
});

describe('dependency_track_mapper_withraw', () => {
  it('Successfully converts withraw flagged Dependency Track targeted at a local/cloned repository data', () => {
    const mapper = new DependencyTrackMapper(
      readSample('dependency_track_mapper/sample_input_report/fpf-default.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('dependency_track_mapper/hdf-default-withraw.json')))
    );
  });
});

describe('dependency_track_mapper_optional_attributes', () => {
  it('Successfully converts Dependency Track targeted at a local/cloned repository data with optional attributes (e.g. vulnerability.cwes, analysis.state, etc.)', () => {
    const mapper = new DependencyTrackMapper(
      readSample('dependency_track_mapper/sample_input_report/fpf-optional-attributes.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('dependency_track_mapper/hdf-optional-attributes.json')))
    );
  });
});

describe('dependency_track_mapper_no_vulnerabilities', () => {
  it('Successfully converts Dependency Track targeted at a local/cloned repository data with no vulnerabilities', () => {
    const mapper = new DependencyTrackMapper(
      readSample('dependency_track_mapper/sample_input_report/fpf-no-vulnerabilities.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('dependency_track_mapper/hdf-no-vulnerabilities.json')))
    );
  });
});

describe('dependency_track_mapper_with_attributions', () => {
  it('Successfully converts Dependency Track targeted at a local/cloned repository data with the attribution field', () => {
    const mapper = new DependencyTrackMapper(
      readSample('dependency_track_mapper/sample_input_report/fpf-with-attributions.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('dependency_track_mapper/hdf-with-attributions.json')))
    );
  });
});

describe('dependency_track_mapper_info_vulnerability', () => {
  it('Successfully converts Dependency Track targeted at a local/cloned repository data with an info level vulnerability', () => {
    const mapper = new DependencyTrackMapper(
      readSample('dependency_track_mapper/sample_input_report/fpf-info-vulnerability.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('dependency_track_mapper/hdf-info-vulnerability.json')))
    );
  });
});
