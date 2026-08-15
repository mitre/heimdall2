import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {CycloneDXSBOMResults} from '../../../src/cyclonedx-sbom-mapper';
import {omitVersions} from '../../utils';

describe('sbom_mapper_saf', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new CycloneDXSBOMResults(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/generated-saf-sbom.json',
        {encoding: 'utf8'}
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
              encoding: 'utf8'
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
        {encoding: 'utf8'}
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
              encoding: 'utf8'
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
        {encoding: 'utf8'}
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
              encoding: 'utf8'
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
        {encoding: 'utf8'}
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
              encoding: 'utf8'
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
        {encoding: 'utf8'}
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
              encoding: 'utf8'
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
        {encoding: 'utf8'}
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
              encoding: 'utf8'
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
        {encoding: 'utf8'}
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
              encoding: 'utf8'
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
        {encoding: 'utf8'}
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
              encoding: 'utf8'
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
          encoding: 'utf8'
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
              encoding: 'utf8'
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
          encoding: 'utf8'
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
              encoding: 'utf8'
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
          encoding: 'utf8'
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
              encoding: 'utf8'
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
          encoding: 'utf8'
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
              encoding: 'utf8'
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
          encoding: 'utf8'
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
              encoding: 'utf8'
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
          encoding: 'utf8'
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
              encoding: 'utf8'
            }
          )
        )
      )
    );
  });
});

describe('sbom_mapper_credits', () => {
  // Pins the removal of the template wrap around the credits optional chain.
  // The wrap rendered a missing `individuals` as the LITERAL STRING 'undefined'
  // rather than leaving the tag unset. No fixture covers this: vex.json's only
  // credited vulnerability HAS individuals, so the golden output never exercises
  // the missing branch. This test builds that case from the real document so the
  // only variable is the absent `individuals` array.
  it('leaves credits unset when a vulnerability has credits but no individuals', () => {
    const raw = JSON.parse(
      fs.readFileSync(
        'sample_jsons/cyclonedx_sbom_mapper/sample_input_report/vex.json',
        {encoding: 'utf8'}
      )
    );
    const credited = raw.vulnerabilities.find(
      (vulnerability: {credits?: unknown}) => vulnerability.credits
    );
    expect(credited).toBeDefined();
    // The credits object stays truthy — only the individuals list goes away,
    // which is exactly the branch the optional chain guards.
    delete credited.credits.individuals;

    const hdf = new CycloneDXSBOMResults(JSON.stringify(raw)).toHdf();
    const tags = hdf.profiles[0].controls[0].tags;

    expect(tags.credits).not.toBe('undefined');
    expect(tags.credits).toBeUndefined();
  });
});
