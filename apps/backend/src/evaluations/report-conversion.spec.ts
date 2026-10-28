/* eslint-disable unicorn/filename-case, unicorn/prefer-module, security/detect-non-literal-fs-filename -- Match existing CommonJS modules and load checked-in fixtures. */
import { readFileSync } from 'fs';
import path from 'node:path';
import { ASFFResults, SarifMapper } from '@mitre/hdf-converters';
import { BadRequestException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { convertReport } from './report-conversion';

const hdf = {
  passthrough: { custom: 'preserved' },
  platform: { name: 'test', release: '1' },
  profiles: [],
  statistics: {},
  version: '5.0',
};
const samples = path.resolve(__dirname, '../../../../libs/hdf-converters/sample_jsons');
const readSample = (filename: string) => readFileSync(path.resolve(samples, filename), 'utf8');
const sarif = readSample('sarif_mapper/sample_input_report/sarif_input.sarif');

afterEach(() => vi.restoreAllMocks());

describe('API report conversion', () => {
  it('preserves valid HDF including extra fields', async () => {
    expect(await convertReport(JSON.stringify(hdf), 'report.json')).toEqual([hdf]);
  });

  it('accepts an HDF profile as frontend intake does', async () => {
    const profile = readFileSync(path.resolve(__dirname,
      '../../../../libs/inspecjs/parse_testbed/redhat7-inspec-profile-disa_stig-el7.json'), 'utf8');
    expect(await convertReport(profile, 'profile.json')).toEqual([JSON.parse(profile)]);
  });

  it('fingerprints and converts a real SARIF report', async () => {
    const results = await convertReport(sarif, 'report.sarif');
    expect(results).toHaveLength(1);
    expect(results[0]).toHaveProperty('profiles.0.controls.0.id');
    expect(results[0]).toHaveProperty('platform');
  });

  it('converts non-JSON Nessus reports and awaits asynchronous mappers', async () => {
    const results = await convertReport(readSample('nessus_mapper/sample_input_report/sample.nessus'), 'scan.nessus');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('profiles.0.controls.0.id');
  });

  it('expands ASFF reports into multiple HDF evaluations', async () => {
    const results = await convertReport(readSample('asff_mapper/sample_input_report/asff_sample.json'), 'scan.json');
    expect(results.length).toBeGreaterThan(1);
    for (const result of results) {
      expect(result).toHaveProperty('profiles');
    }
  });

  it.each(['{}', 'null', '[]', 'not a report', '{"profiles": []}', '{"profiles":'])('rejects unsupported or malformed data: %s', async (input) => {
    await expect(convertReport(input, 'invalid.json')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('includes the filename and converter error in the API error', async () => {
    vi.spyOn(SarifMapper.prototype, 'toHdf').mockImplementation(() => {
      throw new Error('Missing rules');
    });
    await expect(convertReport(sarif, 'broken.sarif')).rejects.toThrow('Unable to convert "broken.sarif" to HDF: Missing rules');
  });

  it('rejects mapper output that does not validate as HDF', async () => {
    vi.spyOn(SarifMapper.prototype, 'toHdf').mockReturnValue({} as never);
    await expect(convertReport(sarif, 'broken.sarif')).rejects.toThrow('Conversion did not produce valid HDF');
  });

  it('rejects empty mapper output', async () => {
    vi.spyOn(ASFFResults.prototype, 'toHdf').mockReturnValue({});
    await expect(convertReport(readSample('asff_mapper/sample_input_report/asff_sample.json'), 'empty.asff')).rejects.toThrow('Conversion produced no evaluations');
  });
});
/* eslint-enable unicorn/filename-case, unicorn/prefer-module, security/detect-non-literal-fs-filename */
