import {describe, expect, it} from 'vitest';
import {TrufflehogResults} from '../../../src/trufflehog-mapper';
import {omitVersions, readSample} from '../../utils';

describe('trufflehog_mapper', () => {
  it('Successfully converts trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      readSample('trufflehog_mapper/sample_input_report/trufflehog.json')
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('trufflehog_mapper/trufflehog-hdf.json'))
      )
    );
  });
});

describe('trufflehog_mapper_withraw', () => {
  it('Successfully converts withraw flagged trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      readSample('trufflehog_mapper/sample_input_report/trufflehog.json'),
      true
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('trufflehog_mapper/trufflehog-hdf-withraw.json'))
      )
    );
  });
});

describe('trufflehog_docker_mapper', () => {
  it('Successfully converts trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      readSample('trufflehog_mapper/sample_input_report/trufflehog_docker_example.json')
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('trufflehog_mapper/trufflehog-docker-hdf.json'))
      )
    );
  });
});

describe('trufflehog_docker_mapper_withraw', () => {
  it('Successfully converts withraw flagged trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      readSample('trufflehog_mapper/sample_input_report/trufflehog_docker_example.json'),
      true
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('trufflehog_mapper/trufflehog-docker-hdf-withraw.json'))
      )
    );
  });
});

describe('trufflehog_saf_example_mapper', () => {
  it('Successfully converts trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      readSample('trufflehog_mapper/sample_input_report/trufflehog_saf_example.json')
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('trufflehog_mapper/trufflehog-saf-hdf.json'))
      )
    );
  });
});

describe('trufflehog_saf_example_mapper_withraw', () => {
  it('Successfully converts withraw flagged trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      readSample('trufflehog_mapper/sample_input_report/trufflehog_saf_example.json'),
      true
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('trufflehog_mapper/trufflehog-saf-hdf-withraw.json'))
      )
    );
  });
});

describe('trufflehog_example_mapper', () => {
  it('Successfully converts withraw flagged trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      readSample('trufflehog_mapper/sample_input_report/trufflehog-report-example.json'),
      false
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('trufflehog_mapper/trufflehog-report-example-hdf.json'))
      )
    );
  });
});

describe('trufflehog_example_mapper', () => {
  it('Successfully converts withraw flagged trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      readSample('trufflehog_mapper/sample_input_report/trufflehog-report-example.json'),
      true
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('trufflehog_mapper/trufflehog-report-example-hdf-withraw.json'))
      )
    );
  });
});

describe('trufflehog_dup_ndjson', () => {
  it('Successfully converts trufflehog in ndjson format with duplicate findings', () => {
    const mapper = new TrufflehogResults(
      readSample('trufflehog_mapper/sample_input_report/trufflehog_dup.ndjson'),
      false
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('trufflehog_mapper/trufflehog-ndjson-dup-hdf.json'))
      )
    );
  });
});
