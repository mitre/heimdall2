import fs from 'fs';
import {ConveyorMapper} from '../../../src/conveyor-mapper';
import {omitVersions} from '../../utils';
describe('veracode_mapper', () => {
  it('Successfully converts Conveyor reports', () => {
    const mapper = new ConveyorMapper(
      fs.readFileSync(
        'sample_jsons/conveyor_mapper/sample_input_report/large-results.json',
        {encoding: 'utf-8'}
      )
    );

     fs.writeFileSync(
       'sample_jsons/conveyor_mapper/conveyor-hdf.json',
       JSON.stringify(mapper.toHdf(), null, 2)
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/conveyor_mapper/empty.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
