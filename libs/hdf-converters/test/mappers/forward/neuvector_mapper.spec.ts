import fs from 'fs';
import {NeuVectorMapper} from '../../../src/neuvector-mapper';
import {omitVersions} from '../../utils';

const INPUT_REPOSITORY_NAMES = [
  'mitre-caldera',
  'mitre-heimdall',
  'mitre-heimdall2',
  'mitre-vulcan'
];

describe('neuvector_mapper', () => {
  it('Successfully converts NeuVector targeted at a local/cloned repository data', () => {
    for (const name of INPUT_REPOSITORY_NAMES) {
      const mapper = new NeuVectorMapper(
        fs.readFileSync(
          `sample_jsons/neuvector_mapper/sample_input_report/neuvector-${name}.json`,
          {encoding: 'utf-8'}
        )
      );

      // fs.writeFileSync(
      //   `sample_jsons/neuvector_mapper/neuvector-hdf-${name}.json`,
      //   JSON.stringify(mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              `sample_jsons/neuvector_mapper/neuvector-hdf-${name}.json`,
              {
                encoding: 'utf-8'
              }
            )
          )
        )
      );
    }
  });
});

describe('neuvector_mapper_withraw', () => {
  it('Successfully converts withraw flagged NeuVector targeted at a local/cloned repository data', () => {
    for (const name of INPUT_REPOSITORY_NAMES) {
      const mapper = new NeuVectorMapper(
        fs.readFileSync(
          `sample_jsons/neuvector_mapper/sample_input_report/neuvector-${name}.json`,
          {encoding: 'utf-8'}
        ),
        true
      );

      // fs.writeFileSync(
      //   `sample_jsons/neuvector_mapper/neuvector-hdf-withraw-${name}.json`,
      //   JSON.stringify(mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              `sample_jsons/neuvector_mapper/neuvector-hdf-withraw-${name}.json`,
              {encoding: 'utf-8'}
            )
          )
        )
      );
    }
  });
});
