import {describe, expect, it} from 'vitest';
import {AnchoreGrypeMapper} from '../../../src/anchore-grype-mapper';
import {omitVersions, readSample} from '../../utils';

describe('anchore-grype_mapper', () => {
  it('Successfully converts anchore_grype targeted at a local/cloned repository data', () => {
    const mapper = new AnchoreGrypeMapper(
      readSample('anchore_grype_mapper/sample_input_report/anchore_grype.json')
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('anchore_grype_mapper/anchore-grype-hdf.json')))
    );
  });
});

describe('anchore-grype_mapper_withraw', () => {
  it('Successfully converts withraw flagged anchore_grype targeted at a local/cloned repository data', () => {
    const mapper = new AnchoreGrypeMapper(
      readSample('anchore_grype_mapper/sample_input_report/anchore_grype.json'),
      true
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('anchore_grype_mapper/anchore-grype-withraw.json')))
    );
  });
});

describe('anchore-grype_mapper', () => {
  it('Successfully converts amazon.json targeted at a local/cloned repository data', () => {
    const mapper = new AnchoreGrypeMapper(
      readSample('anchore_grype_mapper/sample_input_report/amazon.json')
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('anchore_grype_mapper/amazon-grype-hdf.json')))
    );
  });
});

describe('anchore-grype_mapper_withraw', () => {
  it('Successfully converts withraw flagged amazon.json targeted at a local/cloned repository data', () => {
    const mapper = new AnchoreGrypeMapper(
      readSample('anchore_grype_mapper/sample_input_report/amazon.json'),
      true
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('anchore_grype_mapper/amazon-grype-withraw.json')))
    );
  });
});

describe('anchore-grype_mapper', () => {
  it('Successfully converts tensorflow.json targeted at a local/cloned repository data', () => {
    const mapper = new AnchoreGrypeMapper(
      readSample('anchore_grype_mapper/sample_input_report/tensorflow.json')
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('anchore_grype_mapper/tensorflow-grype-hdf.json')))
    );
  });
});

describe('anchore-grype_mapper_withraw', () => {
  it('Successfully converts withraw flagged tensorflow.json targeted at a local/cloned repository data', () => {
    const mapper = new AnchoreGrypeMapper(
      readSample('anchore_grype_mapper/sample_input_report/tensorflow.json'),
      true
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('anchore_grype_mapper/tensorflow-grype-withraw.json')))
    );
  });
});
