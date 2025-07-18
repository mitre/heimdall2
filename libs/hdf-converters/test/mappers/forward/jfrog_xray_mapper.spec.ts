import fs from 'fs';
import {describe, expect, it} from 'vitest';
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

    // fs.writeFileSync(
    //   'sample_jsons/jfrog_xray_mapper/jfrog-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

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

describe('jfrog_xray_mapper_withraw', () => {
  it('Successfully converts withRaw flagged JFrog Xray data', () => {
    const mapper = new JfrogXrayMapper(
      fs.readFileSync(
        'sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/jfrog_xray_mapper/jfrog-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/jfrog_xray_mapper/jfrog-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
