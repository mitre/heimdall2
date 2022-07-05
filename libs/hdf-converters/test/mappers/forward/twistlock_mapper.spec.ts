import fs from 'fs';
import {TwistlockMapper} from '../../../src/twistlock-mapper';
import {omitVersions} from '../../utils';

describe('twistlock_mapper', () => {
  it('Successfully converts Twistlock targeted at a local/cloned repository data', () => {
    const mapper = new TwistlockMapper(
      fs.readFileSync(
        'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-sample-1.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/twistlock_mapper/twistlock-twistcli-sample-1-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/twistlock_mapper/twistlock-twistcli-sample-1-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
