import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {describe, expect, it} from 'vitest';
import {NessusResults} from '../../../src/nessus-mapper';
import {omitVersions} from '../../utils';

describe('nessus_mapper', () => {
  it('Successfully converts Nessus data', () => {
    const mapper = new NessusResults(
      fs.readFileSync(
        'sample_jsons/nessus_mapper/sample_input_report/sample.nessus',
        {encoding: 'utf-8'}
      )
    );

    const converted = mapper.toHdf();

    /*
    fs.writeFileSync(
      'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.3.json',
      JSON.stringify((converted as ExecJSON.Execution[])[0], null, 2)
    );
    fs.writeFileSync(
      'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.2.json',
      JSON.stringify((converted as ExecJSON.Execution[])[1], null, 2)
    );
    fs.writeFileSync(
      'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.1.json',
      JSON.stringify((converted as ExecJSON.Execution[])[2], null, 2)
    );
    */

    const expectedSet = [
      JSON.parse(
        fs.readFileSync('sample_jsons/nessus_mapper/nessus-hdf-10.0.0.3.json', {
          encoding: 'utf-8'
        })
      ),
      JSON.parse(
        fs.readFileSync('sample_jsons/nessus_mapper/nessus-hdf-10.0.0.2.json', {
          encoding: 'utf-8'
        })
      ),
      JSON.parse(
        fs.readFileSync('sample_jsons/nessus_mapper/nessus-hdf-10.0.0.1.json', {
          encoding: 'utf-8'
        })
      )
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
  it('Successfully converts withRaw flagged Nessus data', () => {
    const mapper = new NessusResults(
      fs.readFileSync(
        'sample_jsons/nessus_mapper/sample_input_report/sample.nessus',
        {encoding: 'utf-8'}
      ),
      true
    );

    const converted = mapper.toHdf();

    /*
    fs.writeFileSync(
      'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.3-withraw.json',
      JSON.stringify((converted as ExecJSON.Execution[])[0], null, 2)
    );
    fs.writeFileSync(
      'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.2-withraw.json',
      JSON.stringify((converted as ExecJSON.Execution[])[1], null, 2)
    );
    fs.writeFileSync(
      'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.1-withraw.json',
      JSON.stringify((converted as ExecJSON.Execution[])[2], null, 2)
    );
    */

    const expectedSet = [
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.3-withraw.json',
          {
            encoding: 'utf-8'
          }
        )
      ),
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.2-withraw.json',
          {
            encoding: 'utf-8'
          }
        )
      ),
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/nessus_mapper/nessus-hdf-10.0.0.1-withraw.json',
          {
            encoding: 'utf-8'
          }
        )
      )
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
