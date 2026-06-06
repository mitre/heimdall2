import {describe, expect, it} from 'vitest';
import {ConveyorResults} from '../../../src/conveyor-mapper';
import {omitVersions, readSample} from '../../utils';
describe('conveyor_mapper', () => {
  it('Successfully converts Conveyor reports', () => {
    const mapper = new ConveyorResults(
      readSample('conveyor_mapper/sample_input_report/sample-results.json')
    );
    const mapped = mapper.toHdf();
    expect(omitVersions(mapped['Moldy'])).toEqual(
      omitVersions(
        JSON.parse(readSample('conveyor_mapper/conveyor-moldy-hdf.json'))
      )
    );
    expect(omitVersions(mapped['Stigma'])).toEqual(
      omitVersions(
        JSON.parse(readSample('conveyor_mapper/conveyor-stigma-hdf.json'))
      )
    );
    expect(omitVersions(mapped['Clamav'])).toEqual(
      omitVersions(
        JSON.parse(readSample('conveyor_mapper/conveyor-clamav-hdf.json'))
      )
    );
  });
});
