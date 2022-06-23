import fs from 'fs';
import {ZapMapper} from '../../../src/zap-mapper';
import {omitVersions} from '../../utils';

describe('zap_mapper', () => {
  it('Successfully converts webgoat.json', () => {
    const mapper = new ZapMapper(
      fs.readFileSync(
        'sample_jsons/zap_mapper/sample_input_report/webgoat.json',
        {encoding: 'utf-8'}
      ),
      'http://mymac.com:8191'
    );

    // fs.writeFileSync(
    //   'sample_jsons/zap_mapper/zap-webgoat-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/zap_mapper/zap-webgoat-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
  it('Successfully converts zero.webappsecurity.json', () => {
    const mapper = new ZapMapper(
      fs.readFileSync(
        'sample_jsons/zap_mapper/sample_input_report/zero.webappsecurity.json',
        {encoding: 'utf-8'}
      ),
      'http://zero.webappsecurity.com'
    );

    // fs.writeFileSync(
    //   'sample_jsons/zap_mapper/zap-webappsecurity-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/zap_mapper/zap-webappsecurity-hdf.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });
});
