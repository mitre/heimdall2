import fs from 'fs';
import {TrufflehogResults} from '../../../src/trufflehog-mapper';
import {omitVersions} from '../../utils';

describe('trufflehog_mapper', () => {
  it('Successfully converts trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
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
    const mapper = new TrufflehogResults(
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
    const mapper = new TrufflehogResults(
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
    const mapper = new TrufflehogResults(
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

describe('trufflehog_saf_example_mapper', () => {
  it('Successfully converts trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      fs.readFileSync(
        'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog_saf_example.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/trufflehog_mapper/trufflehog-saf-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/trufflehog_mapper/trufflehog-saf-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('trufflehog_saf_example_mapper_withraw', () => {
  it('Successfully converts withraw flagged trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      fs.readFileSync(
        'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog_saf_example.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/trufflehog_mapper/trufflehog-saf-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/trufflehog_mapper/trufflehog-saf-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('trufflehog_example_mapper', () => {
  it('Successfully converts withraw flagged trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      fs.readFileSync(
        'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog-report-example.json',
        {encoding: 'utf-8'}
      ),
      false
    );

    // fs.writeFileSync(
    //   'sample_jsons/trufflehog_mapper/trufflehog-report-example-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/trufflehog_mapper/trufflehog-report-example-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('trufflehog_example_mapper', () => {
  it('Successfully converts withraw flagged trufflehog targeted at a local/cloned repository data', () => {
    const mapper = new TrufflehogResults(
      fs.readFileSync(
        'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog-report-example.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/trufflehog_mapper/trufflehog-report-example-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/trufflehog_mapper/trufflehog-report-example-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('trufflehog_dup_ndjson', () => {
  it('Successfully converts trufflehog in ndjson format with duplicate findings', () => {
    const mapper = new TrufflehogResults(
      fs.readFileSync(
        'sample_jsons/trufflehog_mapper/sample_input_report/trufflehog_dup.ndjson',
        {encoding: 'utf-8'}
      ),
      false
    );

    // fs.writeFileSync(
    //   'sample_jsons/trufflehog_mapper/trufflehog-ndjson-dup-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/trufflehog_mapper/trufflehog-ndjson-dup-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});