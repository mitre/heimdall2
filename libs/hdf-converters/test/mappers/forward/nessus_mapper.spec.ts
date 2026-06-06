import {ExecJSON} from 'inspecjs';
import {describe, expect, it} from 'vitest';
import {NessusResults} from '../../../src/nessus-mapper';
import {omitVersions, readSample} from '../../utils';

describe('nessus_mapper', () => {
  it('Successfully converts Nessus data', async () => {
    const mapper = new NessusResults(
      readSample('nessus_mapper/sample_input_report/sample.nessus')
    );

    const converted = await mapper.toHdf();

    const expectedSet = [
      JSON.parse(readSample('nessus_mapper/nessus-hdf-10.0.0.3.json')),
      JSON.parse(readSample('nessus_mapper/nessus-hdf-10.0.0.2.json')),
      JSON.parse(readSample('nessus_mapper/nessus-hdf-10.0.0.1.json'))
    ];

    expect(Array.isArray(converted)).toBe(true);

    if (Array.isArray(converted)) {
      expect(converted.map((resultsSet) => omitVersions(resultsSet))).toEqual(
        expectedSet.map((resultsSet: ExecJSON.Execution) =>
          omitVersions(resultsSet)
        )
      );
    }
  });
});

describe('nessus_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Nessus data', async () => {
    const mapper = new NessusResults(
      readSample('nessus_mapper/sample_input_report/sample.nessus'),
      true
    );

    const converted = await mapper.toHdf();

    const expectedSet = [
      JSON.parse(readSample('nessus_mapper/nessus-hdf-10.0.0.3-withraw.json')),
      JSON.parse(readSample('nessus_mapper/nessus-hdf-10.0.0.2-withraw.json')),
      JSON.parse(readSample('nessus_mapper/nessus-hdf-10.0.0.1-withraw.json'))
    ];

    expect(Array.isArray(converted)).toBe(true);

    if (Array.isArray(converted)) {
      expect(converted.map((resultsSet) => omitVersions(resultsSet))).toEqual(
        expectedSet.map((resultsSet: ExecJSON.Execution) =>
          omitVersions(resultsSet)
        )
      );
    }
  });
});
