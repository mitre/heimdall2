import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {XCCDFResultsResults} from '../../../src/xccdf-results-mapper';
import {omitVersions} from '../../utils';

describe('xccdf_mapper', () => {
  describe('SCC', () => {
    it('rhel7', async () => {
      const mapper = new XCCDFResultsResults(
        fs.readFileSync(
          'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results-scc-rhel7.xml',
          {encoding: 'utf-8'}
        )
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel7-hdf.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
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
    it('rhel8', async () => {
      const mapper = new XCCDFResultsResults(
        fs.readFileSync(
          'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results-scc-rhel8.xml',
          {encoding: 'utf-8'}
        )
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel8-hdf.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel8-hdf.json',
              {encoding: 'utf-8'}
            )
          )
        )
      );
    });
  });
  describe('OpenSCAP', () => {
    it('ubuntu1804', async () => {
      const mapper = new XCCDFResultsResults(
        fs.readFileSync(
          'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results-openscap-ComplianceAsCode-ubuntu1804.xml',
          {encoding: 'utf-8'}
        )
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-openscap-ComplianceAsCode-ubuntu1804-hdf.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              'sample_jsons/xccdf_results_mapper/xccdf-openscap-ComplianceAsCode-ubuntu1804-hdf.json',
              {encoding: 'utf-8'}
            )
          )
        )
      );
    });
    it('rhel7', async () => {
      const mapper = new XCCDFResultsResults(
        fs.readFileSync(
          'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results-openscap-rhel7.xml',
          {encoding: 'utf-8'}
        )
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel7-hdf.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel7-hdf.json',
              {encoding: 'utf-8'}
            )
          )
        )
      );
    });
    it('rhel8', async () => {
      const mapper = new XCCDFResultsResults(
        fs.readFileSync(
          'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results-openscap-rhel8.xml',
          {encoding: 'utf-8'}
        )
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel8-hdf.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
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
});

describe('xccdf_mapper_withraw', () => {
  describe('SCC using withRaw flag', () => {
    it('rhel7', async () => {
      const mapper = new XCCDFResultsResults(
        fs.readFileSync(
          'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results-scc-rhel7.xml',
          {encoding: 'utf-8'}
        ),
        true
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel7-hdf-withraw.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel7-hdf-withraw.json',
              {encoding: 'utf-8'}
            )
          )
        )
      );
    });
    it('rhel8', async () => {
      const mapper = new XCCDFResultsResults(
        fs.readFileSync(
          'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results-scc-rhel8.xml',
          {encoding: 'utf-8'}
        ),
        true
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel8-hdf-withraw.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              'sample_jsons/xccdf_results_mapper/xccdf-scc-rhel8-hdf-withraw.json',
              {encoding: 'utf-8'}
            )
          )
        )
      );
    });
  });
  describe('OpenSCAP using withRaw flag', () => {
    it('rhel7', async () => {
      const mapper = new XCCDFResultsResults(
        fs.readFileSync(
          'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results-openscap-rhel7.xml',
          {encoding: 'utf-8'}
        ),
        true
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel7-hdf-withraw.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel7-hdf-withraw.json',
              {encoding: 'utf-8'}
            )
          )
        )
      );
    });
    it('rhel8', async () => {
      const mapper = new XCCDFResultsResults(
        fs.readFileSync(
          'sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results-openscap-rhel8.xml',
          {encoding: 'utf-8'}
        ),
        true
      );

      // fs.writeFileSync(
      //   'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel8-hdf-withraw.json',
      //   JSON.stringify(await mapper.toHdf(), null, 2)
      // );

      expect(omitVersions(await mapper.toHdf())).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(
              'sample_jsons/xccdf_results_mapper/xccdf-openscap-rhel8-hdf-withraw.json',
              {encoding: 'utf-8'}
            )
          )
        )
      );
    });
  });
});
