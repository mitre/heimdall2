import {describe, expect, it} from 'vitest';
import {SarifMapper} from '../../../src/sarif-mapper';
import {omitVersions, readSample} from '../../utils';

describe('sarif_mapper', () => {
  it('Successfully converts Sarif data', () => {
    const mapper = new SarifMapper(
      readSample('sarif_mapper/sample_input_report/sarif_input.sarif')
    );

    // fs.writeFileSync(
    //   'sample_jsons/sarif_mapper/sarif-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          readSample('sarif_mapper/sarif-hdf.json')
        )
      )
    );
  });
});
describe('sarif_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Sarif data', () => {
    const mapper = new SarifMapper(
      readSample('sarif_mapper/sample_input_report/sarif_input.sarif'),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/sarif_mapper/sarif-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          readSample('sarif_mapper/sarif-hdf-withraw.json')
        )
      )
    );
  });
});
