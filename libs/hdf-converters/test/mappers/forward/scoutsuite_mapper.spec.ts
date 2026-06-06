import {describe, expect, it} from 'vitest';
import {ScoutsuiteMapper} from '../../../src/scoutsuite-mapper';
import {omitVersions, readSample} from '../../utils';

describe('scoutsuite_mapper', () => {
  it('Successfully converts Scoutsuite data', () => {
    const mapper = new ScoutsuiteMapper(
      readSample('scoutsuite_mapper/sample_input_report/scoutsuite_sample.js')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('scoutsuite_mapper/scoutsuite-hdf.json')))
    );
  });
});

describe('scoutsuite_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Scoutsuite data', () => {
    const mapper = new ScoutsuiteMapper(
      readSample('scoutsuite_mapper/sample_input_report/scoutsuite_sample.js'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('scoutsuite_mapper/scoutsuite-hdf-withraw.json')))
    );
  });
});
