import fs from 'fs';
import {TrufflehogMapper} from '../../../src/trufflehog-mapper';
import {omitVersions} from '../../utils';

describe('trufflehog_mapper', () => {
  it('Successfully converts trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogMapper(
      fs.readFileSync(
        'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog.json',
        {encoding: 'utf-8'}
      )
    );

      // fs.writeFileSync(
      //   'sample_jsons/trufflehog_mapper/trufflehog-hdf.json',
      //   JSON.stringify(mapper.toHdf(), null, 2)
      // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/trufflehog_mapper/trufflehog-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('trufflehog_mapper_withraw', () => {
  it('Successfully converts withraw flagged trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogMapper(
      fs.readFileSync(
        'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog.json',
        {encoding: 'utf-8'}
      ),
      true
    );

      // fs.writeFileSync(
      //   'sample_jsons/trufflehog_mapper/trufflehog-hdf-withraw.json',
      //   JSON.stringify(mapper.toHdf(), null, 2)
      // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/trufflehog_mapper/trufflehog-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('trufflehog_docker_mapper', () => {
  it('Successfully converts trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogMapper(
      fs.readFileSync(
        'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog_docker_example.json',
        {encoding: 'utf-8'}
      )
    );

      // fs.writeFileSync(
      //   'sample_jsons/trufflehog_mapper/trufflehog-docker-hdf.json',
      //   JSON.stringify(mapper.toHdf(), null, 2)
      // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/trufflehog_mapper/trufflehog-docker-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('trufflehog_docker_mapper_withraw', () => {
  it('Successfully converts withraw flagged trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogMapper(
      fs.readFileSync(
        'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog_docker_example.json',
        {encoding: 'utf-8'}
      ),
      true
    );

      // fs.writeFileSync(
      //   'sample_jsons/trufflehog_mapper/trufflehog-docker-hdf-withraw.json',
      //   JSON.stringify(mapper.toHdf(), null, 2)
      // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/trufflehog_mapper/trufflehog-docker-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});