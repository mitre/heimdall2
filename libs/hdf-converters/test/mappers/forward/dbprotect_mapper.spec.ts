import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { DBProtectMapper } from '../../../src/dbprotect-mapper';
import { loadFixture, omitVersions } from '../../utils';

describe('dbprotect_mapper_check', () => {
  it('Successfully converts DBProtect check scan targeted at a local/cloned repository data', () => {
    const mapper = new DBProtectMapper(
      fs.readFileSync(
        'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Check-Results-Details-XML-Sample.xml',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/dbprotect_mapper/dbprotect-check-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/dbprotect_mapper/dbprotect-check-hdf.json')),
    );
  });
});

describe('dbprotect_mapper_findings', () => {
  it('Successfully converts DBProtect findings scan targeted at a local/cloned repository data', () => {
    const mapper = new DBProtectMapper(
      fs.readFileSync(
        'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Findings-Detail-XML-Sample.xml',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/dbprotect_mapper/dbprotect-findings-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/dbprotect_mapper/dbprotect-findings-hdf.json')),
    );
  });
});

describe('dbprotect_mapper_check_withraw', () => {
  it('Successfully converts withRaw flagged DBProtect check scan', () => {
    const mapper = new DBProtectMapper(
      fs.readFileSync(
        'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Check-Results-Details-XML-Sample.xml',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/dbprotect_mapper/dbprotect-check-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/dbprotect_mapper/dbprotect-check-hdf-withraw.json')),
    );
  });
});

describe('dbprotect_mapper_findings_withraw', () => {
  it('Successfully converts withRaw flagged DBProtect findings scan', () => {
    const mapper = new DBProtectMapper(
      fs.readFileSync(
        'sample_jsons/dbprotect_mapper/sample_input_report/DbProtect-Findings-Detail-XML-Sample.xml',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/dbprotect_mapper/dbprotect-findings-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/dbprotect_mapper/dbprotect-findings-hdf-withraw.json')),
    );
  });
});
