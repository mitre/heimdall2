import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { CycloneDXSBOMResults } from '../../../src/cyclonedx-sbom-mapper';
import { loadFixture, omitVersions } from '../../utils';

describe('sbom_mapper_saf', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/generated-saf-sbom.json',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-saf-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-saf-hdf.json')),
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/generated-saf-sbom.json',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-saf-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-saf-hdf-withraw.json')),
    );
  });
});

describe('sbom_mapper_dropwizard_vulns', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vulns.json',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf.json')),
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vulns.json',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf-withraw.json')),
    );
  });
});

describe('sbom_mapper_dropwizard_no_vulns', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-no-vulns.json',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf.json')),
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-no-vulns.json',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf-withraw.json')),
    );
  });
});

describe('sbom_mapper_dropwizard_vex', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vex.json',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf.json')),
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vex.json',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf-withraw.json')),
    );
  });
});

describe('sbom_mapper_vex', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/vex.json',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-vex-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-vex-hdf.json')),
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/vex.json',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-vex-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-vex-hdf-withraw.json')),
    );
  });
});

describe('sbom_mapper_syft_alpine_container', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/syft-scan-alpine-container.json',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf.json')),
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/syft-scan-alpine-container.json',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf-withraw.json')),
    );
  });
});

describe('sbom_mapper_converted_spdx', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/spdx-to-cyclonedx.json',
        { encoding: 'utf8' },
      ),
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-converted-spdx-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-converted-spdx-hdf.json')),
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/spdx-to-cyclonedx.json',
        { encoding: 'utf8' },
      ),
      true,
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-converted-spdx-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(loadFixture('sample_jsons/cyclonedx_sbom_mapper/sbom-converted-spdx-hdf-withraw.json')),
    );
  });
});
