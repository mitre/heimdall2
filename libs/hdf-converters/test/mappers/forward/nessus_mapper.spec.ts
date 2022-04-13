import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {NessusResults} from '../../../src/nessus-mapper';
import {omitVersions} from '../../utils';

describe('nessus_mapper', () => {
  it('Successfully converts JFrog Xray data', () => {
    const mapper = new NessusResults(
      fs.readFileSync(
        'sample_jsons/nessus_mapper/sample_input_report/sample.nessus',
        {encoding: 'utf-8'}
      )
    );
    
    const converted = mapper.toHdf()
    
    expect(Array.isArray(converted)).toBe(true)

    if (Array.isArray(converted)) {
        expect(converted.map((resultsSet) => omitVersions(resultsSet))).toEqual(
            JSON.parse(
                fs.readFileSync('sample_jsons/nessus_mapper/nessus-converted.json', {
                  encoding: 'utf-8'
                })
            ).map((resultsSet: ExecJSON.Execution) => omitVersions(resultsSet))
        )
    }
  });
});
