import fs from 'fs';
import {GosecMapper} from '../../../src/gosec-mapper';
import {omitVersions} from '../../utils';

describe('gosec_mapper_grype', () => {
  it('Successfully converts Grype gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Grype_gosec_results.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/grype-gosec-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/gosec_mapper/grype-gosec-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });

  it('Successfully converts withRaw flagged Grype gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Grype_gosec_results.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/grype-gosec-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/gosec_mapper/grype-gosec-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('gosec_mapper_go_ethereum_unsuppressed', () => {
  it('Successfully converts unsuppressed Go Ethereum gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_unsuppressed.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/go-ethereum-unsuppressed-gosec-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/gosec_mapper/go-ethereum-unsuppressed-gosec-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });

  it('Successfully converts withRaw flagged unsuppressed Go Ethereum gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_unsuppressed.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/go-ethereum-unsuppressed-gosec-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/gosec_mapper/go-ethereum-unsuppressed-gosec-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('gosec_mapper_go_ethereum_suppressed', () => {
  it('Successfully converts suppressed Go Ethereum gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_suppressed.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/go-ethereum-suppressed-gosec-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/gosec_mapper/go-ethereum-suppressed-gosec-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });

  it('Successfully converts withRaw flagged suppressed Go Ethereum gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_suppressed.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/go-ethereum-suppressed-gosec-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/gosec_mapper/go-ethereum-suppressed-gosec-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
