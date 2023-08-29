import fs from 'fs';
import {ConveyorResults} from '../../../src/conveyor-mapper';
import {omitVersions} from '../../utils';
describe('conveyor_mapper', () => {
  it('Successfully converts Conveyor reports', () => {
    const mapper = new ConveyorResults(
      fs.readFileSync(
        'sample_jsons/conveyor_mapper/sample_input_report/sample-results.json',
        {encoding: 'utf-8'}
      )
    );
    const mapped = mapper.toHdf();
    //fs.writeFileSync(
    //  'sample_jsons/conveyor_mapper/conveyor-moldy-hdf.json',
    //  JSON.stringify(mapped['Moldy'], null, 2)
    //);
    //fs.writeFileSync(
    //  'sample_jsons/conveyor_mapper/conveyor-stigma-hdf.json',
    //  JSON.stringify(mapped['Stigma'], null, 2)
    //);
    //fs.writeFileSync(
    //  'sample_jsons/conveyor_mapper/conveyor-codequality-hdf.json',
    //  JSON.stringify(mapped['CodeQuality'], null, 2)
    //);
    //fs.writeFileSync(
    //  'sample_jsons/conveyor_mapper/conveyor-clamav-hdf.json',
    //  JSON.stringify(mapped['Clamav'], null, 2)
    //);
    //fs.writeFileSync(
    //  'sample_jsons/conveyor_mapper/conveyor-hdf.json',
    //  JSON.stringify(mapped, null, 2)
    //);
    expect(omitVersions(mapped['Moldy'])).toEqual(
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
    expect(omitVersions(mapped['Stigma'])).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/conveyor_mapper/conveyor-stigma-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
    expect(omitVersions(mapped['Clamav'])).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/conveyor_mapper/conveyor-clamav-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
