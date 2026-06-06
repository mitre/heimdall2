import {describe, expect, it} from 'vitest';
import {VeracodeMapper} from '../../../src/veracode-mapper';
import {omitVersions, readSample} from '../../utils';
describe('veracode_mapper', () => {
  it('Successfully converts Veracode reports', () => {
    const mapper = new VeracodeMapper(
      readSample('veracode_mapper/sample_input_report/veracode.xml')
    );

    // fs.writeFileSync(
    //   'sample_jsons/veracode_mapper/veracode-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          readSample('veracode_mapper/veracode-hdf.json')
        )
      )
    );
  });
});
