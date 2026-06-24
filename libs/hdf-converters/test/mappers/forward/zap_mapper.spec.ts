import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { ZapResults } from '../../../src/zap-mapper';
import { loadFixture, omitVersions } from '../../utils';

describe('zap_mapper', () => {
  it('Successfully converts webgoat.json', async () => {
    const mapper = new ZapResults(
      fs.readFileSync(
        'sample_jsons/zap_mapper/sample_input_report/webgoat.json',
        { encoding: 'utf8' },
      ),
      'http://mymac.com:8191', // eslint-disable-line unicorn/prefer-https -- test fixture uses http
    );

    // fs.writeFileSync(
    //   'sample_jsons/zap_mapper/zap-webgoat-hdf.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(await mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/zap_mapper/zap-webgoat-hdf.json')),
    );
  });
  it('Successfully converts zero.webappsecurity.json', async () => {
    const mapper = new ZapResults(
      fs.readFileSync(
        'sample_jsons/zap_mapper/sample_input_report/zero.webappsecurity.json',
        { encoding: 'utf8' },
      ),
      'http://zero.webappsecurity.com', // eslint-disable-line unicorn/prefer-https -- test fixture uses http
    );

    // fs.writeFileSync(
    //   'sample_jsons/zap_mapper/zap-webappsecurity-hdf.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(await mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/zap_mapper/zap-webappsecurity-hdf.json')),
    );
  });
});

describe('zap_mapper', () => {
  it('Successfully converts webgoat.json using withRaw flag', async () => {
    const mapper = new ZapResults(
      fs.readFileSync(
        'sample_jsons/zap_mapper/sample_input_report/webgoat.json',
        { encoding: 'utf8' },
      ),
      'http://mymac.com:8191', // eslint-disable-line unicorn/prefer-https -- test fixture uses http
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/zap_mapper/zap-webgoat-hdf-withraw.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(await mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/zap_mapper/zap-webgoat-hdf-withraw.json')),
    );
  });
  it('Successfully converts zero.webappsecurity.json using withRaw flag', async () => {
    const mapper = new ZapResults(
      fs.readFileSync(
        'sample_jsons/zap_mapper/sample_input_report/zero.webappsecurity.json',
        { encoding: 'utf8' },
      ),
      'http://zero.webappsecurity.com', // eslint-disable-line unicorn/prefer-https -- test fixture uses http
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/zap_mapper/zap-webappsecurity-hdf-withraw.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(await mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/zap_mapper/zap-webappsecurity-hdf-withraw.json')),
    );
  });
});
