import fs from 'fs';
import {FromHDFToXCCDFMapper} from '../../../index';

describe('XCCDF Results Reverse Mapper', () => {
  it('Successfully converts HDF into XCCDF-Results', () => {
    const inputData = fs.readFileSync(
      'sample_jsons/xccdf_reverse_mapper/sample_input_report/rhel7-results.json',
      {encoding: 'utf-8'}
    );
    const outputTemplate = fs.readFileSync(
      'src/converters-from-hdf/xccdf/hdf2xccdf-results-template.xml'
    );
    const mapper = new FromHDFToXCCDFMapper(
      inputData,
      outputTemplate.toString(),
      true
    );

    const converted = mapper.toXCCDF();

    const expected = fs.readFileSync(
      'sample_jsons/xccdf_reverse_mapper/rhel7-xccdf-results.xml',
      'utf-8'
    );

    expect(converted).toEqual(expected);
  });
});
