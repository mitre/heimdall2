import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {SonarQubeResults} from '../../../src/sonarqube-mapper';
import {omitVersions} from '../../utils';

describe('sonarqube_mapper', () => {
  it('Successfully pulls SonarQube vulnerabilities', async () => {
    const mapper = new SonarQubeResults(
      'http://127.0.0.1:3001',
      'xss',
      'NotARealKey'
    );
    const result: ExecJSON.Execution = await mapper.toHdf();
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
});
