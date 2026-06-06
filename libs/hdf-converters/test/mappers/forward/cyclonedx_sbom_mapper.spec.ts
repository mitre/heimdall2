import {describe, expect, it} from 'vitest';
import {CycloneDXSBOMResults} from '../../../src/cyclonedx-sbom-mapper';
import {omitVersions, readSample} from '../../utils';

describe('sbom_mapper_saf', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/generated-saf-sbom.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-saf-hdf.json')))
    );
  });
  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/generated-saf-sbom.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-saf-hdf-withraw.json')))
    );
  });
});

describe('sbom_mapper_dropwizard_vulns', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/dropwizard-vulns.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf.json')))
    );
  });
  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/dropwizard-vulns.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf-withraw.json')))
    );
  });
});

describe('sbom_mapper_dropwizard_no_vulns', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/dropwizard-no-vulns.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf.json')))
    );
  });
  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/dropwizard-no-vulns.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf-withraw.json')))
    );
  });
});

describe('sbom_mapper_dropwizard_vex', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/dropwizard-vex.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf.json')))
    );
  });
  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/dropwizard-vex.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf-withraw.json')))
    );
  });
});

describe('sbom_mapper_vex', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/vex.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-vex-hdf.json')))
    );
  });
  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/vex.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-vex-hdf-withraw.json')))
    );
  });
});

describe('sbom_mapper_syft_alpine_container', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/syft-scan-alpine-container.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf.json')))
    );
  });
  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/syft-scan-alpine-container.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf-withraw.json')))
    );
  });
});

describe('sbom_mapper_converted_spdx', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/spdx-to-cyclonedx.json')
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-converted-spdx-hdf.json')))
    );
  });
  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      readSample('cyclonedx_sbom_mapper/sample_input_report/spdx-to-cyclonedx.json'),
      true
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(JSON.parse(readSample('cyclonedx_sbom_mapper/sbom-converted-spdx-hdf-withraw.json')))
    );
  });
});
