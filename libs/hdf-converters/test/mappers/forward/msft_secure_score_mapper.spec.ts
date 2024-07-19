import fs from 'fs';
import {MsftConfigMapper} from '../../../src/msft-config-mapper';
import {omitVersions} from '../../utils';

describe('msft_secure_score_mapper', () => {
  it('Successfully converts Microsoft Secure Score reports', () => {
    const mapper = new MsftConfigMapper(
      JSON.stringify({
        secureScore: JSON.parse(
          fs.readFileSync(
            'sample_jsons/msft_secure_score_mapper/secureScore.json',
            {
              encoding: 'utf-8'
            }
          )
        ),
        profiles: JSON.parse(
          fs.readFileSync(
            'sample_jsons/msft_secure_score_mapper/profiles.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      })
    );

    /* tslint:disable */
    // fs.writeFileSync(
    //   'sample_jsons/msft_secure_score_mapper/secure_score-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );
    /* tslint:enable */

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/msft_secure_score_mapper/secure_score-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
