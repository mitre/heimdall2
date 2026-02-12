import fs from 'fs';
import {SarifResults} from '../../../src/sarif-mapper';
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
    const mapper = new SarifResults(
      fs.readFileSync(
        'sample_jsons/sarif_mapper/sample_input_report/python_3_alpine.sarif',
        {encoding: 'utf-8'}
      ),
      'python_3_alpine.sarif'
    );

    const converted = mapper.toHdf();

    const filename = 'python_3_alpine.sarif-Trivy-0';

    fs.writeFileSync(
      `sample_jsons/sarif_mapper/${filename}-hdf.json`,
      JSON.stringify(converted[filename], null, 2)
    );

    expect(omitVersions(converted[filename])).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(`sample_jsons/sarif_mapper/${filename}-hdf.json`, {
            encoding: 'utf-8'
          })
        )
      )
    );
  });

  // it('Successfully converts withRaw flagged Trivy (SARIF reporter) data', () => {
  //   const mapper = new SarifMapper(
  //     fs.readFileSync(
  //       'sample_jsons/sarif_mapper/sample_input_report/python_3_alpine.sarif',
  //       {encoding: 'utf-8'}
  //     ),
  //     true,
  //     'Aqua Security Trivy'
  //   );

  //   fs.writeFileSync(
  //     'sample_jsons/sarif_mapper/trivy-hdf-withraw.json',
  //     JSON.stringify(mapper.toHdf(), null, 2)
  //   );

  //   expect(omitVersions(mapper.toHdf())).toEqual(
  //     omitVersions(
  //       JSON.parse(
  //         fs.readFileSync('sample_jsons/sarif_mapper/trivy-hdf-withraw.json', {
  //           encoding: 'utf-8'
  //         })
  //       )
  //     )
  //   );
  // });

  // it('Successfully converts Trivy (SARIF reporter) data that had two runs', () => {
  //   const mapper = new SarifMapper(
  //     fs.readFileSync(
  //       'sample_jsons/sarif_mapper/sample_input_report/python_3_alpine_dup_run.sarif',
  //       {encoding: 'utf-8'}
  //     ),
  //     false,
  //     'Aqua Security Trivy'
  //   );

  //   fs.writeFileSync(
  //     'sample_jsons/sarif_mapper/trivy-dup-hdf.json',
  //     JSON.stringify(mapper.toHdf(), null, 2)
  //   );

  //   expect(omitVersions(mapper.toHdf())).toEqual(
  //     omitVersions(
  //       JSON.parse(
  //         fs.readFileSync('sample_jsons/sarif_mapper/trivy-dup-hdf.json', {
  //           encoding: 'utf-8'
  //         })
  //       )
  //     )
  //   );
  // });

  // it('Successfully converts withRaw flagged Trivy (SARIF reporter) data that had two runs', () => {
  //   const mapper = new SarifMapper(
  //     fs.readFileSync(
  //       'sample_jsons/sarif_mapper/sample_input_report/python_3_alpine_dup_run.sarif',
  //       {encoding: 'utf-8'}
  //     ),
  //     true,
  //     'Aqua Security Trivy'
  //   );

  //   fs.writeFileSync(
  //     'sample_jsons/sarif_mapper/trivy-dup-hdf-withraw.json',
  //     JSON.stringify(mapper.toHdf(), null, 2)
  //   );

  //   expect(omitVersions(mapper.toHdf())).toEqual(
  //     omitVersions(
  //       JSON.parse(
  //         fs.readFileSync('sample_jsons/sarif_mapper/trivy-dup-hdf-withraw.json', {
  //           encoding: 'utf-8'
  //         })
  //       )
  //     )
  //   );
  // });
});
