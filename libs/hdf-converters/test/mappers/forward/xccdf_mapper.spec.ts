import {describe, expect, it} from 'vitest';
import {XCCDFResultsResults} from '../../../src/xccdf-results-mapper';
import {omitVersions, readSample} from '../../utils';

describe('xccdf_mapper', () => {
  describe('SCC', () => {
    it('rhel7', async () => {
      const mapper = new XCCDFResultsResults(
        readSample('xccdf_results_mapper/sample_input_report/xccdf-results-scc-rhel7.xml')
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel7-hdf.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            readSample('xccdf_results_mapper/xccdf-scc-rhel7-hdf.json')
          )
        )
      );
    });
    it('rhel8', async () => {
      const mapper = new XCCDFResultsResults(
        readSample('xccdf_results_mapper/sample_input_report/xccdf-results-scc-rhel8.xml')
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel8-hdf.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            readSample('xccdf_results_mapper/xccdf-scc-rhel8-hdf.json')
          )
        )
      );
    });
  });
  describe('OpenSCAP', () => {
    it('ubuntu1804', async () => {
      const mapper = new XCCDFResultsResults(
        readSample('xccdf_results_mapper/sample_input_report/xccdf-results-openscap-ComplianceAsCode-ubuntu1804.xml')
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-openscap-ComplianceAsCode-ubuntu1804-hdf.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            readSample('xccdf_results_mapper/xccdf-openscap-ComplianceAsCode-ubuntu1804-hdf.json')
          )
        )
      );
    });
    it('rhel7', async () => {
      const mapper = new XCCDFResultsResults(
        readSample('xccdf_results_mapper/sample_input_report/xccdf-results-openscap-rhel7.xml')
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel7-hdf.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            readSample('xccdf_results_mapper/xccdf-openscap-rhel7-hdf.json')
          )
        )
      );
    });
    it('rhel8', async () => {
      const mapper = new XCCDFResultsResults(
        readSample('xccdf_results_mapper/sample_input_report/xccdf-results-openscap-rhel8.xml')
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel8-hdf.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            readSample('xccdf_results_mapper/xccdf-openscap-rhel8-hdf.json')
          )
        )
      );
    });
  });
});

describe('xccdf_mapper_withraw', () => {
  describe('SCC using withRaw flag', () => {
    it('rhel7', async () => {
      const mapper = new XCCDFResultsResults(
        readSample('xccdf_results_mapper/sample_input_report/xccdf-results-scc-rhel7.xml'),
        true
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel7-hdf-withraw.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            readSample('xccdf_results_mapper/xccdf-scc-rhel7-hdf-withraw.json')
          )
        )
      );
    });
    it('rhel8', async () => {
      const mapper = new XCCDFResultsResults(
        readSample('xccdf_results_mapper/sample_input_report/xccdf-results-scc-rhel8.xml'),
        true
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel8-hdf-withraw.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            readSample('xccdf_results_mapper/xccdf-scc-rhel8-hdf-withraw.json')
          )
        )
      );
    });
  });
  describe('OpenSCAP using withRaw flag', () => {
    it('rhel7', async () => {
      const mapper = new XCCDFResultsResults(
        readSample('xccdf_results_mapper/sample_input_report/xccdf-results-openscap-rhel7.xml'),
        true
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel7-hdf-withraw.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            readSample('xccdf_results_mapper/xccdf-openscap-rhel7-hdf-withraw.json')
          )
        )
      );
    });
    it('rhel8', async () => {
      const mapper = new XCCDFResultsResults(
        readSample('xccdf_results_mapper/sample_input_report/xccdf-results-openscap-rhel8.xml'),
        true
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel8-hdf-withraw.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            readSample('xccdf_results_mapper/xccdf-openscap-rhel8-hdf-withraw.json')
          )
        )
      );
    });
  });
});
