import fs from 'fs';
import {JfrogXrayMapper} from '../../../src/jfrog-xray-mapper';
import {omitVersions} from '../../utils';

describe('jfrog_xray_mapper', () => {
  it('Successfully converts JFrog Xray data', () => {
    const mapper = new JfrogXrayMapper(
      fs.readFileSync(
        'sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json',
        {encoding: 'utf-8'}
      )
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/jfrog_xray_mapper/jfrog-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
