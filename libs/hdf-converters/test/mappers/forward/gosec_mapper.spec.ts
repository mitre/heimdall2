import fs from 'fs';
import {GoSecMapper} from '../../../src/gosec-mapper';
import {omitVersions} from '../../utils';

describe('gosec_mapper', () => {
  it('Successfully converts gosec reports', () => {
    const mapper = new GoSecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Grype_gosec_results.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/gosec-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/gosec_mapper/gosec-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('gosec_mapper_withraw', () => {
  it('Successfully converts withRaw flagged gosec reports', () => {
    const mapper = new GoSecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Grype_gosec_results.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/gosec-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/gosec_mapper/gosec-hdf-withraw.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
