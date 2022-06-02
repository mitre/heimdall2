import fs from 'fs';
import {TwistlockMapper} from '../../../src/twistlock-mapper';
//import {omitVersions} from '../../utils';

describe('twistlock_mapper', () => {
  it('Successfully converts Twist cli targeted at a local/cloned repository data', () => {
    const mapper = new TwistlockMapper(
      JSON.parse(
        fs.readFileSync(
          'sample_jsons/twistlock_mapper/sample_input_report/twistlock-twistcli-sample-1.json',
          {encoding: 'utf-8'}
        )
      )
    );
  //   expect(omitVersions(mapper.toHdf())).toEqual(
  //     omitVersions(
  //       JSON.parse(
  //         fs.readFileSync(
  //           'sample_jsons/snyk_mapper/nodejs-goof-local-hdf.json',
  //           {
  //             encoding: 'utf-8'
  //           }
  //         )
  //       )
  //     )
  //   );
  // });
  // it('Successfully converts Snyk cli targeted at a remote/online repository data', () => {
  //   const mapper = new SnykMapper(
  //     JSON.parse(
  //       fs.readFileSync(
  //         'sample_jsons/snyk_mapper/sample_input_report/nodejs-goof-remote.json',
  //         {encoding: 'utf-8'}
  //       )
  //     )
  //   );
  //   expect(omitVersions(mapper.toHdf())).toEqual(
  //     omitVersions(
  //       JSON.parse(
  //         fs.readFileSync(
  //           'sample_jsons/snyk_mapper/nodejs-goof-remote-hdf.json',
  //           {
  //             encoding: 'utf-8'
  //           }
  //         )
  //       )
  //     )
  //   );
   });
});
