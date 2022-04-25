import fs from 'fs';
import {IonChannelMapper} from '../../../src/ionchannel-mapper';
import {omitVersions} from '../../utils';

describe('ionchannel_mapper', () => {
  it('Successfully converts IonChannel data', () => {
    const mapper = new IonChannelMapper(
      fs.readFileSync(
        'sample_jsons/ionchannel_mapper/sample_input_report/ion_saf_8ab54671-df44-4626-a0e3-5f207ecaa0a0.json',
        {encoding: 'utf-8'}
      )
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/ionchannel_mapper/hdf-ion_saf_8ab54671-df44-4626-a0e3-5f207ecaa0a0.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
