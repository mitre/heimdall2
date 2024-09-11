import fs from 'fs';
import {CycloneDXSBOMResults} from '../../../src/cyclonedx-sbom-mapper';
import {omitVersions} from '../../utils';

describe('sbom_mapper_saf', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/generated-saf-sbom.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-saf-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-saf-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/generated-saf-sbom.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-saf-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-saf-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('sbom_mapper_dropwizard_vulns', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vulns.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vulns.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vulns-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('sbom_mapper_dropwizard_no_vulns', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-no-vulns.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-no-vulns.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-no-vulns-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('sbom_mapper_dropwizard_vex', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vex.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/dropwizard-vex.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-dropwizard-vex-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('sbom_mapper_vex', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/vex.json',
        {
          encoding: 'utf-8'
        }
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-vex-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-vex-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/vex.json',
        {
          encoding: 'utf-8'
        }
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-vex-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-vex-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('sbom_mapper_syft_alpine_container', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/syft-scan-alpine-container.json',
        {
          encoding: 'utf-8'
        }
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/syft-scan-alpine-container.json',
        {
          encoding: 'utf-8'
        }
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-syft-alpine-container-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('sbom_mapper_converted_spdx', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/spdx-to-cyclonedx.json',
        {
          encoding: 'utf-8'
        }
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-converted-spdx-hdf.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-converted-spdx-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/spdx-to-cyclonedx.json',
        {
          encoding: 'utf-8'
        }
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/cyclonedx_sbom_mapper/sbom-converted-spdx-hdf-withraw.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/cyclonedx_sbom_mapper/sbom-converted-spdx-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
