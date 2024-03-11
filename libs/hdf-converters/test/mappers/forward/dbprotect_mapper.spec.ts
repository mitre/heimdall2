import fs from 'fs';
import {DBProtectMapper} from '../../../src/dbprotect-mapper';
import {omitVersions} from '../../utils';

describe('dbprotect_mapper_check', () => {
  it('Successfully converts DBProtect check scan targeted at a local/cloned repository data', () => {
    const mapper = new DBProtectMapper(
      fs.readFileSync(
        'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Check-Results-Details-XML-Sample.xml',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/dbprotect_mapper/sample_input_report/dbprotect-check-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/dbprotect_mapper/dbprotect-check-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('dbprotect_mapper_findings', () => {
  it('Successfully converts DBProtect findings scan targeted at a local/cloned repository data', () => {
    const mapper = new DBProtectMapper(
      fs.readFileSync(
        'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Findings-Detail-XML-Sample.xml',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/dbprotect_mapper/dbprotect-findings-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/dbprotect_mapper/dbprotect-findings-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('dbprotect_mapper_check_withraw', () => {
  it('Successfully converts withRaw flagged DBProtect check scan', () => {
    const mapper = new DBProtectMapper(
      fs.readFileSync(
        'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Check-Results-Details-XML-Sample.xml',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/dbprotect_mapper/dbprotect-check-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/dbprotect_mapper/dbprotect-check-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('dbprotect_mapper_findings_withraw', () => {
  it('Successfully converts withRaw flagged DBProtect findings scan', () => {
    const mapper = new DBProtectMapper(
      fs.readFileSync(
        'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Findings-Detail-XML-Sample.xml',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/dbprotect_mapper/dbprotect-findings-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/dbprotect_mapper/dbprotect-findings-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
