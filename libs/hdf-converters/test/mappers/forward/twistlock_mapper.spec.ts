import fs from 'fs';
import {TwistlockResults} from '../../../src/twistlock-mapper';
import {omitVersions} from '../../utils';

describe('twistlock_mapper', () => {
  it('Successfully converts Twistlock targeted at a local/cloned repository data', () => {
    const mapper = new TwistlockResults(
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
          fs.readFileSync('sample_jsons/twistlock_mapper/twistlock-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('twistlock_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Twistlock data', () => {
    const mapper = new TwistlockResults(
      fs.readFileSync(
        'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-sample-1.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/twistlock_mapper/twistlock-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/twistlock_mapper/twistlock-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
