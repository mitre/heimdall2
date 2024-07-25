import fs from 'fs';
import {SBOMResults} from '../../../src/sbom-mapper';
import {omitVersions} from '../../utils';

describe('sbom_mapper_saf', () => {
  it('Successfully converts SBOM data', () => {
    const mapper = new SBOMResults(
      fs.readFileSync(
        'sample_jsons/sbom_mapper/sample_input_report/generated-saf-sbom.json',
        {encoding: 'utf-8'}
      )
    );

     fs.writeFileSync(
       'sample_jsons/sbom_mapper/sbom-saf-hdf.json',
       JSON.stringify(mapper.toHdf(), null, 2)
     );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/sbom_mapper/sbom-saf-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new SBOMResults(
      fs.readFileSync(
        'sample_jsons/sbom_mapper/sample_input_report/generated-saf-sbom.json',
        {encoding: 'utf-8'}
      ),
      true
    );

     fs.writeFileSync(
       'sample_jsons/sbom_mapper/sbom-saf-hdf-withraw.json',
       JSON.stringify(mapper.toHdf(), null, 2)
     );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/sbom_mapper/sbom-saf-hdf-withraw.json',
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
    const mapper = new SBOMResults(
      fs.readFileSync(
        'sample_jsons/sbom_mapper/sample_input_report/dropwizard-vulns.json',
        {encoding: 'utf-8'}
      )
    );

     fs.writeFileSync(
       'sample_jsons/sbom_mapper/sbom-dropwizard-vulns-hdf.json',
       JSON.stringify(mapper.toHdf(), null, 2)
     );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/sbom_mapper/sbom-dropwizard-vulns-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });

  it('Successfully converts withraw flagged SBOM data', () => {
    const mapper = new SBOMResults(
      fs.readFileSync(
        'sample_jsons/sbom_mapper/sample_input_report/dropwizard-vulns.json',
        {encoding: 'utf-8'}
      ),
      true
    );

     fs.writeFileSync(
       'sample_jsons/sbom_mapper/sbom-dropwizard-vulns-hdf-withraw.json',
       JSON.stringify(mapper.toHdf(), null, 2)
     );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/sbom_mapper/sbom-dropwizard-vulns-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
