import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {SnykResults} from '../../../src/snyk-mapper';
import {omitVersions} from '../../utils';

describe('snyk_mapper', () => {
  it('Successfully converts Snyk cli targeted at a local/cloned repository data', async () => {
    const mapper = new SnykResults(
      fs.readFileSync(
        'sample_jsons/snyk_mapper/sample_input_report/nodejs-goof-local.json',
        {encoding: 'utf-8'}
      )
    );

    /*
    fs.writeFileSync(
      'sample_jsons/snyk_mapper/nodejs-goof-local-hdf.json',
      JSON.stringify(await mapper.toHdf(), null, 2),
      {encoding: 'utf-8'}
    );
    */

    expect(omitVersions((await mapper.toHdf()) as ExecJSON.Execution)).toEqual(
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
  it('Successfully converts Snyk cli targeted at a remote/online repository data', async () => {
    const mapper = new SnykResults(
      fs.readFileSync(
        'sample_jsons/snyk_mapper/sample_input_report/nodejs-goof-remote.json',
        {encoding: 'utf-8'}
      )
    );

    /*
    fs.writeFileSync(
      'sample_jsons/snyk_mapper/nodejs-goof-remote-hdf.json',
      JSON.stringify(await mapper.toHdf(), null, 2),
      {encoding: 'utf-8'}
    );
    */

    expect(omitVersions((await mapper.toHdf()) as ExecJSON.Execution)).toEqual(
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
