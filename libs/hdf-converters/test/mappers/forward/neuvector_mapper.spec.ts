import fs from 'fs';
import {NeuvectorMapper} from '../../../src/neuvector-mapper';
import {omitVersions} from '../../utils';

const INPUT_FILE_INDICES = [1, 2, 3, 4];

describe('neuvector_mapper', () => {
  it('Successfully converts neuvector targeted at a local/cloned repository data', () => {
    INPUT_FILE_INDICES.map((index) => {
      const mapper = new NeuvectorMapper(
        fs.readFileSync(
          `sample_jsons/neuvector_mapper/sample_input_report/neuvector-${index}.json`,
          {encoding: 'utf-8'}
        )
      );

      fs.writeFileSync(
        `sample_jsons/neuvector_mapper/neuvector-hdf-${index}.json`,
        JSON.stringify(mapper.toHdf(), null, 2)
      );

      expect(omitVersions(mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              `sample_jsons/neuvector_mapper/neuvector-hdf-${index}.json`,
              {
                encoding: 'utf-8'
              }
            )
          )
        )
      );
    });
  });
});

describe('neuvector_mapper_withraw', () => {
  it('Successfully converts withraw flagged neuvector targeted at a local/cloned repository data', () => {
    INPUT_FILE_INDICES.map((index) => {
      const mapper = new NeuvectorMapper(
        fs.readFileSync(
          `sample_jsons/neuvector_mapper/sample_input_report/neuvector-${index}.json`,
          {encoding: 'utf-8'}
        ),
        true
      );

      fs.writeFileSync(
        `sample_jsons/neuvector_mapper/neuvector-hdf-withraw-${index}.json`,
        JSON.stringify(mapper.toHdf(), null, 2)
      );

      expect(omitVersions(mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              `sample_jsons/neuvector_mapper/neuvector-hdf-withraw-${index}.json`,
              {encoding: 'utf-8'}
            )
          )
        )
      );
    });
  });
});
