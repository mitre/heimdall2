import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {describe, expect, it} from 'vitest';
import {FromHDFToXCCDFMapper} from '../../../index';
import {replaceXCCDFVersion, readSample} from '../../utils';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB_ROOT = path.resolve(__dirname, '../../..');
const outputTemplate = fs
  .readFileSync(
    path.join(LIB_ROOT, 'src/converters-from-hdf/xccdf/hdf2xccdf-results-template.xml')
  )
  .toString();

describe('XCCDF Results Reverse Mapper', () => {
  it('Successfully converts RHEL7 HDF into XCCDF-Results', () => {
    const inputData = readSample(
      'xccdf_reverse_mapper/sample_input_report/rhel7-results.json'
    );
    const mapper = new FromHDFToXCCDFMapper(inputData, outputTemplate, true);

    const converted = mapper.toXCCDF();

    // Write out to a file so we can do schema validation
    // fs.writeFileSync(
    //   'sample_jsons/xccdf_reverse_mapper/rhel7-xccdf-results.xml',
    //   converted
    // );

    const expected = readSample('xccdf_reverse_mapper/rhel7-xccdf-results.xml');

    expect(converted).toEqual(replaceXCCDFVersion(expected));
  });

  it('Successfully converts a 3 layer overlay HDF into XCCDF-Results', () => {
    const inputData = readSample(
      'xccdf_reverse_mapper/sample_input_report/example-3-layer-overlay.json'
    );
    const mapper = new FromHDFToXCCDFMapper(inputData, outputTemplate, true);

    const converted = mapper.toXCCDF();

    // Write out to a file so we can do schema validation
    // fs.writeFileSync(
    //   'sample_jsons/xccdf_reverse_mapper/example-3-layer-overlay-xccdf-results.xml',
    //   converted
    // );

    const expected = readSample('xccdf_reverse_mapper/example-3-layer-overlay-xccdf-results.xml');

    expect(converted).toEqual(replaceXCCDFVersion(expected));
  });
});
