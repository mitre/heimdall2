import fs from 'fs';
import {ConveyorResults} from '../../../src/conveyor-mapper';
import {omitVersions} from '../../utils';
describe('conveyor_mapper', () => {
  it('Successfully converts Conveyor reports', () => {
    const mapper = new ConveyorResults(
      fs.readFileSync(
        'sample_jsons/conveyor_mapper/sample_input_report/large-results.json',
        {encoding: 'utf-8'}
      )
    );

    expect(omitVersions(mapper.toHdf()['Moldy'])).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/conveyor_mapper/conveyor-moldy-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
