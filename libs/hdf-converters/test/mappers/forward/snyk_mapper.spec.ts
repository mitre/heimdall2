import {describe, expect, it} from 'vitest';
import {SnykMapper} from '../../../src/snyk-mapper';
import {omitVersions, readSample} from '../../utils';

describe('snyk_mapper', () => {
  it('Successfully converts Snyk cli targeted at a local/cloned repository data', () => {
    const mapper = new SnykMapper(
      JSON.parse(readSample('snyk_mapper/sample_input_report/nodejs-goof-local.json'))
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('snyk_mapper/nodejs-goof-local-hdf.json'))
      )
    );
  });
  it('Successfully converts Snyk cli targeted at a remote/online repository data', () => {
    const mapper = new SnykMapper(
      JSON.parse(readSample('snyk_mapper/sample_input_report/nodejs-goof-remote.json'))
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('snyk_mapper/nodejs-goof-remote-hdf.json'))
      )
    );
  });
});
