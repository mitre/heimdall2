import fs from 'fs';
import {TwistlockResults} from '../../../src/twistlock-mapper';
import {omitVersions} from '../../utils';

describe('twistlock_mapper', () => {
  it('Successfully converts Twistlock docker image scan targeted at a local/cloned repository data', () => {
    const mapper = new TwistlockResults(
      fs.readFileSync(
        'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-sample-1.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    // 'sample_jsons/twistlock_mapper/twistlock-hdf.json',
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

describe('twistlock_mapper_code_repo', () => {
  it('Successfully converts Twistlock code repo scan targeted at a local/cloned repository data', () => {
    const mapper = new TwistlockResults(
      fs.readFileSync(
        'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-coderepo-scan-sample.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/twistlock_mapper/twistlock-coderepo-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/twistlock_mapper/twistlock-coderepo-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('twistlock_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Twistlock docker image scan', () => {
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

describe('twistlock_mapper_withraw', () => {
  it('Successfully converts withRaw flagged Twistlock code repo scan', () => {
    const mapper = new TwistlockResults(
      fs.readFileSync(
        'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-coderepo-scan-sample.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/twistlock_mapper/twistlock-coderepo-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/twistlock_mapper/twistlock-coderepo-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
