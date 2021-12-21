import fs from 'fs';
import {XCCDFResultsMapper} from '../../../src/xccdf-results-mapper';
import {omitVersions} from '../../utils';

describe('xccdf_mapper', () => {
  it('SCC', () => {
    const mapper = new XCCDFResultsMapper(
      fs.readFileSync(
        'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results-scc-rhel7.xml',
        {encoding: 'utf-8'}
      )
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel7-hdf.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });
  it('OpenSCAP', () => {
    const mapper = new XCCDFResultsMapper(
      fs.readFileSync(
        'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results-openscap-rhel8.xml',
        {encoding: 'utf-8'}
      )
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel8-hdf.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });
});
