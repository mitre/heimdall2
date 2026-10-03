import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { ClamAvMapper } from '../../../src/clamav_mapper';
import { omitVersions } from '../../utils';

const inputPath = 'sample_txts/clamav_mapper/sample_input_report/clamav.txt';
const outputPath = 'sample_jsons/clamav_mapper/clamav-hdf.json';
const rawOutputPath = 'sample_jsons/clamav_mapper/clamav-hdf-withraw.json';

describe('clamav_mapper', () => {
  const report = fs.readFileSync(inputPath, { encoding: 'utf8' });

  it('converts a clamscan report to OHDF', () => {
    const mapper = new ClamAvMapper(report);
    const expected = JSON.parse(fs.readFileSync(outputPath, { encoding: 'utf8' }));

    expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
  });

  it('includes the original clamscan report when raw data is requested', () => {
    const mapper = new ClamAvMapper(report, true);
    const expected = JSON.parse(
      fs.readFileSync(rawOutputPath, { encoding: 'utf8' }),
    );

    expect(omitVersions(mapper.toHdf())).toEqual(omitVersions(expected));
    expect(expected.passthrough.raw).toBe(report);
  });
});
