import {ExecJSON} from 'inspecjs';
import {describe, expect, it} from 'vitest';
import {SonarqubeResults} from '../../../src/sonarqube-mapper';
import {omitHDFTitle, omitVersions, readSample} from '../../utils';

const testURL = 'http://127.0.0.1:3001';

describe('sonarqube_mapper', () => {
  it('Successfully pulls SonarQube vulnerabilities', async () => {
    const mapper = new SonarqubeResults(testURL, 'xss', 'NotARealKey');
    const result: ExecJSON.Execution = await mapper.toHdf();

    // fs.writeFileSync(
    //   'sample_jsons/sonarqube_mapper/sonarqube-hdf.json',
    //   JSON.stringify(result, null, 2)
    // );

    expect(omitHDFTitle(omitVersions(result))).toEqual(
      omitHDFTitle(
        omitVersions(
          JSON.parse(
            readSample('sonarqube_mapper', 'sonarqube-hdf.json')
          )
        )
      )
    );
  });
  it('Successfully pulls SonarQube vulnerabilities from a particular branch', async () => {
    const mapper = new SonarqubeResults(
      testURL,
      'libc_unix',
      'NotARealKey',
      'release'
    );
    const result: ExecJSON.Execution = await mapper.toHdf();

    // fs.writeFileSync(
    //   'sample_jsons/sonarqube_mapper/sonarqube-branch-hdf.json',
    //   JSON.stringify(result, null, 2)
    // );

    expect(omitHDFTitle(omitVersions(result))).toEqual(
      omitHDFTitle(
        omitVersions(
          JSON.parse(
            readSample('sonarqube_mapper', 'sonarqube-branch-hdf.json')
          )
        )
      )
    );
  });
  it('Successfully pulls SonarQube vulnerabilities from a particular pull request', async () => {
    const mapper = new SonarqubeResults(
      testURL,
      'libc_unix',
      'NotARealKey',
      undefined,
      '123'
    );
    const result: ExecJSON.Execution = await mapper.toHdf();

    // fs.writeFileSync(
    //   'sample_jsons/sonarqube_mapper/sonarqube-pull-request-hdf.json',
    //   JSON.stringify(result, null, 2)
    // );

    expect(omitHDFTitle(omitVersions(result))).toEqual(
      omitHDFTitle(
        omitVersions(
          JSON.parse(
            readSample('sonarqube_mapper', 'sonarqube-pull-request-hdf.json')
          )
        )
      )
    );
  });
});
