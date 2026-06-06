import {describe, expect, it} from 'vitest';
import {NeuVectorMapper} from '../../../src/neuvector-mapper';
import {omitVersions, readSample} from '../../utils';

describe('neuvector_mapper', () => {
  it('Successfully converts NeuVector targeted at mitre/caldera', () => {
    const mapper = new NeuVectorMapper(
      readSample('neuvector_mapper/sample_input_report/neuvector-mitre-caldera.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('neuvector_mapper/neuvector-hdf-mitre-caldera.json')))
    );
  });

  it('Successfully converts NeuVector targeted at mitre/heimdall', () => {
    const mapper = new NeuVectorMapper(
      readSample('neuvector_mapper/sample_input_report/neuvector-mitre-heimdall.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('neuvector_mapper/neuvector-hdf-mitre-heimdall.json')))
    );
  });

  it('Successfully converts NeuVector targeted at mitre/heimdall2', () => {
    const mapper = new NeuVectorMapper(
      readSample('neuvector_mapper/sample_input_report/neuvector-mitre-heimdall2.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('neuvector_mapper/neuvector-hdf-mitre-heimdall2.json')))
    );
  });

  it('Successfully converts NeuVector targeted at mitre/vulcan', () => {
    const mapper = new NeuVectorMapper(
      readSample('neuvector_mapper/sample_input_report/neuvector-mitre-vulcan.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('neuvector_mapper/neuvector-hdf-mitre-vulcan.json')))
    );
  });
});

describe('neuvector_mapper_withraw', () => {
  it('Successfully converts withraw flagged NeuVector targeted at mitre/caldera', () => {
    const mapper = new NeuVectorMapper(
      readSample('neuvector_mapper/sample_input_report/neuvector-mitre-caldera.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('neuvector_mapper/neuvector-hdf-withraw-mitre-caldera.json')))
    );
  });

  it('Successfully converts withraw flagged NeuVector targeted at mitre/heimdall', () => {
    const mapper = new NeuVectorMapper(
      readSample('neuvector_mapper/sample_input_report/neuvector-mitre-heimdall.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('neuvector_mapper/neuvector-hdf-withraw-mitre-heimdall.json')))
    );
  });

  it('Successfully converts withraw flagged NeuVector targeted at mitre/heimdall2', () => {
    const mapper = new NeuVectorMapper(
      readSample('neuvector_mapper/sample_input_report/neuvector-mitre-heimdall2.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('neuvector_mapper/neuvector-hdf-withraw-mitre-heimdall2.json')))
    );
  });

  it('Successfully converts withraw flagged NeuVector targeted at mitre/vulcan', () => {
    const mapper = new NeuVectorMapper(
      readSample('neuvector_mapper/sample_input_report/neuvector-mitre-vulcan.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('neuvector_mapper/neuvector-hdf-withraw-mitre-vulcan.json')))
    );
  });
});
