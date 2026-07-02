import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { GosecMapper } from '../../../src/gosec-mapper';
import { loadFixture, omitVersions } from '../../utils';

describe('gosec_mapper_grype', () => {
  it('Successfully converts Grype gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Grype_gosec_results.json',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/grype-gosec-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/gosec_mapper/grype-gosec-hdf.json')),
    );
  });

  it('Successfully converts withRaw flagged Grype gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Grype_gosec_results.json',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/grype-gosec-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/gosec_mapper/grype-gosec-hdf-withraw.json')),
    );
  });
});

describe('gosec_mapper_go_ethereum_external_suppressed', () => {
  it('Successfully converts unsuppressed Go Ethereum gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_external_suppressed.json',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/go-ethereum-external-unsuppressed-gosec-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/gosec_mapper/go-ethereum-external-unsuppressed-gosec-hdf.json')),
    );
  });

  it('Successfully converts withRaw flagged unsuppressed Go Ethereum gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_external_suppressed.json',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/go-ethereum-external-unsuppressed-gosec-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/gosec_mapper/go-ethereum-external-unsuppressed-gosec-hdf-withraw.json')),
    );
  });
});

describe('gosec_mapper_go_ethereum_all_suppressed', () => {
  it('Successfully converts suppressed Go Ethereum gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_all_suppressed.json',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/go-ethereum-all-unsuppressed-gosec-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/gosec_mapper/go-ethereum-all-unsuppressed-gosec-hdf.json')),
    );
  });

  it('Successfully converts withRaw flagged suppressed Go Ethereum gosec reports', () => {
    const mapper = new GosecMapper(
      fs.readFileSync(
        'sample_jsons/gosec_mapper/sample_input_report/Go_Ethereum_gosec_results_all_suppressed.json',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/gosec_mapper/go-ethereum-all-unsuppressed-gosec-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/gosec_mapper/go-ethereum-all-unsuppressed-gosec-hdf-withraw.json')),
    );
  });
});
