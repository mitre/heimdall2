import fs from 'fs';
import {SarifMapper} from '../../../src/sarif-mapper';
import {omitVersions} from '../../utils';

describe('sarif_mapper', () => {
  // it('Successfully converts Sarif data', () => {
  //   const mapper = new SarifMapper(
  //     fs.readFileSync(
  //       'sample_jsons/sarif_mapper/sample_input_report/sarif_input.sarif',
  //       {encoding: 'utf-8'}
  //     )
  //   );

  //   // fs.writeFileSync(
  //   //   'sample_jsons/sarif_mapper/sarif-hdf.json',
  //   //   JSON.stringify(mapper.toHdf(), null, 2)
  //   // );

  //   expect(omitVersions(mapper.toHdf())).toEqual(
  //     omitVersions(
  //       JSON.parse(
  //         fs.readFileSync('sample_jsons/sarif_mapper/sarif-hdf.json', {
  //           encoding: 'utf-8'
  //         })
  //       )
  //     )
  //   );
  // });

  // it('Successfully converts withRaw flagged Sarif data', () => {
  //   const mapper = new SarifMapper(
  //     fs.readFileSync(
  //       'sample_jsons/sarif_mapper/sample_input_report/sarif_input.sarif',
  //       {encoding: 'utf-8'}
  //     ),
  //     true
  //   );

  //   // fs.writeFileSync(
  //   //   'sample_jsons/sarif_mapper/sarif-hdf-withraw.json',
  //   //   JSON.stringify(mapper.toHdf(), null, 2)
  //   // );

  //   expect(omitVersions(mapper.toHdf())).toEqual(
  //     omitVersions(
  //       JSON.parse(
  //         fs.readFileSync('sample_jsons/sarif_mapper/sarif-hdf-withraw.json', {
  //           encoding: 'utf-8'
  //         })
  //       )
  //     )
  //   );
  // });

  it('Successfully converts Trivy (SARIF reporter) data', () => {
    const mapper = new SarifMapper(
      fs.readFileSync(
        'sample_jsons/sarif_mapper/sample_input_report/python_3_alpine.sarif',
        {encoding: 'utf-8'}
      ),
      false,
      'Aqua Security Trivy'
    );

    fs.writeFileSync(
      'sample_jsons/sarif_mapper/trivy-hdf.json',
      JSON.stringify(mapper.toHdf(), null, 2)
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/sarif_mapper/trivy-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });

  it('Successfully converts withRaw flagged Trivy (SARIF reporter) data', () => {
    const mapper = new SarifMapper(
      fs.readFileSync(
        'sample_jsons/sarif_mapper/sample_input_report/python_3_alpine.sarif',
        {encoding: 'utf-8'}
      ),
      true,
      'Aqua Security Trivy'
    );

    fs.writeFileSync(
      'sample_jsons/sarif_mapper/trivy-hdf-withraw.json',
      JSON.stringify(mapper.toHdf(), null, 2)
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/sarif_mapper/trivy-hdf-withraw.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
