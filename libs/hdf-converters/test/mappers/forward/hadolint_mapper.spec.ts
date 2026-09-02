import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {HadolintMapper} from '../../../src/hadolint-mapper';
import {omitVersions} from '../../utils';

describe('hadolint_mapper', () => {
  it('Successfully converts Hadolint data', () => {
    const mapper = new HadolintMapper(
      fs.readFileSync(
        'sample_jsons/hadolint/sample_input_report/heimdall_dockerfile.hadolint.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/hadolint/hadolint-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/hadolint/hadolint-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('hadolint_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Hadolint data', () => {
    const mapper = new HadolintMapper(
      fs.readFileSync(
        'sample_jsons/hadolint/sample_input_report/heimdall_dockerfile.hadolint.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/hadolint/hadolint-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/hadolint/hadolint-hdf-withraw.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('hadolint_shellcheck_mapper', () => {
  it('Successfully converts Hadolint ShellCheck data', () => {
    const mapper = new HadolintMapper(
      fs.readFileSync(
        'sample_jsons/hadolint/sample_input_report/heimdall_dockerfile.hadolint_shellcheck.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/hadolint/hadolint-shellcheck-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/hadolint/hadolint-shellcheck-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('hadolint_shellcheck_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Hadolint ShellCheck data', () => {
    const mapper = new HadolintMapper(
      fs.readFileSync(
        'sample_jsons/hadolint/sample_input_report/heimdall_dockerfile.hadolint_shellcheck.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/hadolint/hadolint-shellcheck-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/hadolint/hadolint-shellcheck-hdf-withraw.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });
});
