import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {SonarQubeResults} from '../../../src/sonarqube-mapper';
import {omitVersions} from '../../utils';

const testURL = 'http://127.0.0.1:3001';

describe('sonarqube_mapper', () => {
  it('Successfully pulls SonarQube vulnerabilities', async () => {
    const mapper = new SonarQubeResults(testURL, 'xss', 'NotARealKey');
    const result: ExecJSON.Execution = await mapper.toHdf();

    // fs.writeFileSync(
    //   'sample_jsons/sonarqube_mapper/sonarqube-hdf.json',
    //   JSON.stringify(result, null, 2)
    // );

    expect(omitVersions(result)).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/sonarqube_mapper/sonarqube-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
  it('Successfully pulls SonarQube vulnerabilities from a particular branch', async () => {
    const mapper = new SonarQubeResults(
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

    expect(omitVersions(result)).toEqual(
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
    );
  });
  it('Successfully pulls SonarQube vulnerabilities from a particular PullRequest', async () => {
    const mapper = new SonarQubeResults(
      testURL,
      'libc_unix',
      'NotARealKey',
      '',
      '123'
    );
    const result: ExecJSON.Execution = await mapper.toHdf();

    // fs.writeFileSync(
    //   'sample_jsons/sonarqube_mapper/sonarqube-pull-request-hdf.json',
    //   JSON.stringify(result, null, 2)
    // );

    expect(omitVersions(result)).toEqual(
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
    );
  });
});
