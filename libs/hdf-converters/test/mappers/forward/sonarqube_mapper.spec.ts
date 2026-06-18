import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {describe, expect, it} from 'vitest';
import {SonarqubeResults} from '../../../src/sonarqube-mapper';
import {isServiceAvailable, omitHDFTitle, omitVersions} from '../../utils';

const SONARQUBE_HOST = process.env.SONARQUBE_HOST ?? '127.0.0.1';
const SONARQUBE_PORT = Number(process.env.SONARQUBE_PORT ?? 3001);
const testURL = `http://${SONARQUBE_HOST}:${SONARQUBE_PORT}`;

const sonarqubeAvailable = await isServiceAvailable(SONARQUBE_HOST, SONARQUBE_PORT);

describe.skipIf(!sonarqubeAvailable)('sonarqube_mapper', () => {
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
            fs.readFileSync(
              'sample_jsons/sonarqube_mapper/sonarqube-hdf.json',
              {
                encoding: 'utf-8'
              }
            )
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
            fs.readFileSync(
              'sample_jsons/sonarqube_mapper/sonarqube-branch-hdf.json',
              {
                encoding: 'utf-8'
              }
            )
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
            fs.readFileSync(
              'sample_jsons/sonarqube_mapper/sonarqube-pull-request-hdf.json',
              {
                encoding: 'utf-8'
              }
            )
          )
        )
      )
    );
  });
});
