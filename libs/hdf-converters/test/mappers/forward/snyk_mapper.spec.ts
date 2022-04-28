import fs from 'fs';
import {SnykMapper} from '../../../src/snyk-mapper';
import {omitVersions} from '../../utils';

describe('snyk_mapper', () => {
  it('Successfully converts Snyk cli targeted at a local/cloned repository data', () => {
    const mapper = new SnykMapper(
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/snyk_mapper/sample_input_report/nodejs-goof-local.json',
          {encoding: 'utf-8'}
        )
      )
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/snyk_mapper/nodejs-goof-local-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
  it('Successfully converts Snyk cli targeted at a remote/online repository data', () => {
    const mapper = new SnykMapper(
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/snyk_mapper/sample_input_report/nodejs-goof-remote.json',
          {encoding: 'utf-8'}
        )
      )
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/snyk_mapper/nodejs-goof-remote-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
