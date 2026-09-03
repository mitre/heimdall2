import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {HadolintMapper} from '../../../src/hadolint-mapper';
import {HadolintNistMapping} from '../../../src/mappings/HadolintNistMapping';
import {omitVersions} from '../../utils';

describe('hadolint_mapper', () => {
  it('Successfully converts Hadolint data', async () => {
    const mapper = new HadolintMapper(
      fs.readFileSync(
        'sample_jsons/hadolint/sample_input_report/heimdall_dockerfile.hadolint.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/hadolint/hadolint-hdf.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(await mapper.toHdf())).toEqual(
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
  it('Successfully converts withRaw flagged Hadolint data', async () => {
    const mapper = new HadolintMapper(
      fs.readFileSync(
        'sample_jsons/hadolint/sample_input_report/heimdall_dockerfile.hadolint.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/hadolint/hadolint-hdf-withraw.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(await mapper.toHdf())).toEqual(
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
  it('Successfully converts Hadolint ShellCheck data', async () => {
    const mapper = new HadolintMapper(
      fs.readFileSync(
        'sample_jsons/hadolint/sample_input_report/heimdall_dockerfile.hadolint_shellcheck.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/hadolint/hadolint-shellcheck-hdf.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(await mapper.toHdf())).toEqual(
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
  it('Successfully converts withRaw flagged Hadolint ShellCheck data', async () => {
    const mapper = new HadolintMapper(
      fs.readFileSync(
        'sample_jsons/hadolint/sample_input_report/heimdall_dockerfile.hadolint_shellcheck.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/hadolint/hadolint-shellcheck-hdf-withraw.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(await mapper.toHdf())).toEqual(
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

describe('hadolint_mapper_rule_descriptions', () => {
  it('retrieves rule descriptions from the appropriate wiki', async () => {
    const mapper = new HadolintMapper(
      fs.readFileSync(
        'sample_jsons/hadolint/sample_input_report/heimdall_dockerfile.hadolint_shellcheck.json',
        {encoding: 'utf-8'}
      ),
      false,
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/hadolint/hadolint-shellcheck-hdf-with-rule-descriptions.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(await mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/hadolint/hadolint-shellcheck-hdf-with-rule-descriptions.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });
});