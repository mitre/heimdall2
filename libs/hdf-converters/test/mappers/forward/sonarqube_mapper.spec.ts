import { type ExecJSON } from 'inspecjs';
import { describe, expect, it } from 'vitest';
import { SonarqubeResults } from '../../../src/sonarqube-mapper';
import { isServiceAvailable, loadFixture, omitHDFTitle, omitVersions } from '../../utils';

const SONARQUBE_HOST = process.env.SONARQUBE_HOST ?? '127.0.0.1';
const SONARQUBE_PORT = Number(process.env.SONARQUBE_PORT ?? 3001);
const testURL = `http://${SONARQUBE_HOST}:${SONARQUBE_PORT}`;

const isSonarqubeAvailable = await isServiceAvailable(SONARQUBE_HOST, SONARQUBE_PORT);

describe.skipIf(!isSonarqubeAvailable)('sonarqube_mapper', () => {
  it('Successfully pulls SonarQube vulnerabilities', async () => {
    const mapper = new SonarqubeResults(testURL, 'xss', 'NotARealKey');
    const result: ExecJSON.Execution = await mapper.toHdf();

    // fs.writeFileSync(
    //   'sample_jsons/sonarqube_mapper/sonarqube-hdf.json',
    //   JSON.stringify(result, null, 2)
    // );

    expect(omitHDFTitle(omitVersions(result))).toEqual(
      omitHDFTitle(
        omitVersions(loadFixture('sample_jsons/sonarqube_mapper/sonarqube-hdf.json')),
      ),
    );
  });
  it('Successfully pulls SonarQube vulnerabilities from a particular branch', async () => {
    const mapper = new SonarqubeResults(
      testURL,
      'libc_unix',
      'NotARealKey',
      'release',
    );
    const result: ExecJSON.Execution = await mapper.toHdf();

    // fs.writeFileSync(
    //   'sample_jsons/sonarqube_mapper/sonarqube-branch-hdf.json',
    //   JSON.stringify(result, null, 2)
    // );

    expect(omitHDFTitle(omitVersions(result))).toEqual(
      omitHDFTitle(
        omitVersions(loadFixture('sample_jsons/sonarqube_mapper/sonarqube-branch-hdf.json')),
      ),
    );
  });
  it('Successfully pulls SonarQube vulnerabilities from a particular pull request', async () => {
    const mapper = new SonarqubeResults(
      testURL,
      'libc_unix',
      'NotARealKey',
      undefined,
      '123',
    );
    const result: ExecJSON.Execution = await mapper.toHdf();

    // fs.writeFileSync(
    //   'sample_jsons/sonarqube_mapper/sonarqube-pull-request-hdf.json',
    //   JSON.stringify(result, null, 2)
    // );

    expect(omitHDFTitle(omitVersions(result))).toEqual(
      omitHDFTitle(
        omitVersions(loadFixture('sample_jsons/sonarqube_mapper/sonarqube-pull-request-hdf.json')),
      ),
    );
  });
});
