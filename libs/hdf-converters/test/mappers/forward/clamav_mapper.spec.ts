import fs from 'fs';
import type { ExecJSON } from 'inspecjs';
import { describe, expect, it } from 'vitest';
import { ClamAvResults } from '../../../src/clamav_mapper';
import { omitVersions } from '../../utils';

describe('clamav_mapper', () => {
  it('Successfully converts ClamAV data with matching filenames in different directories', () => {
    const mapper = new ClamAvResults(
      fs.readFileSync('sample_jsons/clamav_mapper/sample_input_report/clamav.txt', { encoding: 'utf8' }),
    );

    // fs.writeFileSync(
    //   'sample_jsons/clamav_mapper/clamav-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expected: ExecJSON.Execution = JSON.parse(fs.readFileSync('sample_jsons/clamav_mapper/clamav-hdf.json', { encoding: 'utf8' }));
    expect(omitVersions(mapper.toHdf() as ExecJSON.Execution)).toEqual(omitVersions(expected));
  });
});

describe('clamav_mapper_withraw', () => {
  it('Successfully converts ClamAV data with matching filenames in different directories and raw output', () => {
    const mapper = new ClamAvResults(
      fs.readFileSync('sample_jsons/clamav_mapper/sample_input_report/clamav.txt', { encoding: 'utf8' }),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/clamav_mapper/clamav-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expected: ExecJSON.Execution = JSON.parse(fs.readFileSync('sample_jsons/clamav_mapper/clamav-hdf-withraw.json', { encoding: 'utf8' }));
    expect(omitVersions(mapper.toHdf() as ExecJSON.Execution)).toEqual(omitVersions(expected));
  });
});

describe('clamav_mapper_empty_file', () => {
  it('Successfully converts a single empty file', () => {
    const mapper = new ClamAvResults(
      fs.readFileSync('sample_jsons/clamav_mapper/sample_input_report/empty_file.txt', { encoding: 'utf8' }),
    );

    // fs.writeFileSync(
    //   'sample_jsons/clamav_mapper/clamav-empty-file-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expected: ExecJSON.Execution = JSON.parse(fs.readFileSync('sample_jsons/clamav_mapper/clamav-empty-file-hdf.json', { encoding: 'utf8' }));
    expect(omitVersions(mapper.toHdf() as ExecJSON.Execution)).toEqual(omitVersions(expected));
  });
});

describe('clamav_mapper_empty_file_withraw', () => {
  it('Successfully converts a single empty file with raw output', () => {
    const mapper = new ClamAvResults(
      fs.readFileSync('sample_jsons/clamav_mapper/sample_input_report/empty_file.txt', { encoding: 'utf8' }),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/clamav_mapper/clamav-empty-file-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expected: ExecJSON.Execution = JSON.parse(fs.readFileSync('sample_jsons/clamav_mapper/clamav-empty-file-hdf-withraw.json', { encoding: 'utf8' }));
    expect(omitVersions(mapper.toHdf() as ExecJSON.Execution)).toEqual(omitVersions(expected));
  });
});

describe('clamav_mapper_no_files', () => {
  it('Successfully converts a scan with no files', () => {
    const mapper = new ClamAvResults(
      fs.readFileSync('sample_jsons/clamav_mapper/sample_input_report/no_files.txt', { encoding: 'utf8' }),
    );

    // fs.writeFileSync(
    //   'sample_jsons/clamav_mapper/clamav-no-files-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expected: ExecJSON.Execution = JSON.parse(fs.readFileSync('sample_jsons/clamav_mapper/clamav-no-files-hdf.json', { encoding: 'utf8' }));
    expect(omitVersions(mapper.toHdf() as ExecJSON.Execution)).toEqual(omitVersions(expected));
  });
});

describe('clamav_mapper_no_files_withraw', () => {
  it('Successfully converts a scan with no files with raw output', () => {
    const mapper = new ClamAvResults(
      fs.readFileSync('sample_jsons/clamav_mapper/sample_input_report/no_files.txt', { encoding: 'utf8' }),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/clamav_mapper/clamav-no-files-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expected: ExecJSON.Execution = JSON.parse(fs.readFileSync('sample_jsons/clamav_mapper/clamav-no-files-hdf-withraw.json', { encoding: 'utf8' }));
    expect(omitVersions(mapper.toHdf() as ExecJSON.Execution)).toEqual(omitVersions(expected));
  });
});

describe('clamav_mapper_database_error', () => {
  it('Successfully converts a database-loading failure', () => {
    const mapper = new ClamAvResults(
      fs.readFileSync('sample_jsons/clamav_mapper/sample_input_report/database_error.txt', { encoding: 'utf8' }),
    );

    // fs.writeFileSync(
    //   'sample_jsons/clamav_mapper/clamav-database-error-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expected: ExecJSON.Execution = JSON.parse(fs.readFileSync('sample_jsons/clamav_mapper/clamav-database-error-hdf.json', { encoding: 'utf8' }));
    expect(omitVersions(mapper.toHdf() as ExecJSON.Execution)).toEqual(omitVersions(expected));
  });
});

describe('clamav_mapper_database_error_withraw', () => {
  it('Successfully converts a database-loading failure with raw output', () => {
    const mapper = new ClamAvResults(
      fs.readFileSync('sample_jsons/clamav_mapper/sample_input_report/database_error.txt', { encoding: 'utf8' }),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/clamav_mapper/clamav-database-error-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expected: ExecJSON.Execution = JSON.parse(fs.readFileSync('sample_jsons/clamav_mapper/clamav-database-error-hdf-withraw.json', { encoding: 'utf8' }));
    expect(omitVersions(mapper.toHdf() as ExecJSON.Execution)).toEqual(omitVersions(expected));
  });
});

describe('clamav_mapper_concatenated_log', () => {
  it('Successfully converts concatenated ClamAV logs', () => {
    const mapper = new ClamAvResults(
      fs.readFileSync('sample_jsons/clamav_mapper/sample_input_report/concatenated_log.txt', { encoding: 'utf8' }),
    );

    // fs.writeFileSync(
    //   'sample_jsons/clamav_mapper/clamav-concatenated-log-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expected: ExecJSON.Execution[] = JSON.parse(fs.readFileSync('sample_jsons/clamav_mapper/clamav-concatenated-log-hdf.json', { encoding: 'utf8' }));
    expect((mapper.toHdf() as ExecJSON.Execution[]).map(execution => omitVersions(execution))).toEqual(expected.map(execution => omitVersions(execution)));
  });
});

describe('clamav_mapper_concatenated_log_withraw', () => {
  it('Successfully converts concatenated ClamAV logs with raw output', () => {
    const mapper = new ClamAvResults(
      fs.readFileSync('sample_jsons/clamav_mapper/sample_input_report/concatenated_log.txt', { encoding: 'utf8' }),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/clamav_mapper/clamav-concatenated-log-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    const expected: ExecJSON.Execution[] = JSON.parse(fs.readFileSync('sample_jsons/clamav_mapper/clamav-concatenated-log-hdf-withraw.json', { encoding: 'utf8' }));
    expect((mapper.toHdf() as ExecJSON.Execution[]).map(execution => omitVersions(execution))).toEqual(expected.map(execution => omitVersions(execution)));
  });
});
