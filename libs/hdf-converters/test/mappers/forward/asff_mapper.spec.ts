import fs from 'fs';
import * as _ from 'lodash';
import {ASFFResults as Mapper} from '../../../src/asff-mapper/asff-mapper';
import {omitVersions} from '../../utils';

describe('ASFF Mapper', () => {
  it('Successfully converts SecurityHub benchmark ASFFs', () => {
    const mapper = new Mapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/asff_sample.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/asff_mapper/asff-cis_aws-foundations_benchmark_v1.2.0-hdf.json',
    //   JSON.stringify(
    //     mapper.toHdf()['CIS AWS Foundations Benchmark v1.2.0.json'],
    //     null,
    //     2
    //   )
    // );

    // fs.writeFileSync(
    //   'sample_jsons/asff_mapper/asff-aws_foundational_security_best_practices_v1.0.0-hdf.json',
    //   JSON.stringify(
    //     mapper.toHdf()['AWS Foundational Security Best Practices v1.0.0.json'],
    //     null,
    //     2
    //   )
    // );

    expect(_.mapValues(mapper.toHdf(), omitVersions)).toEqual({
      'CIS AWS Foundations Benchmark v1.2.0.json': omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/asff_mapper/asff-cis_aws-foundations_benchmark_v1.2.0-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      ),
      'AWS Foundational Security Best Practices v1.0.0.json': omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/asff_mapper/asff-aws_foundational_security_best_practices_v1.0.0-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    });
  });

  it('Successfully converts Prowler ASFF as Array', () => {
    const mapper = new Mapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/prowler_sample.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/asff_mapper/prowler-hdf.json',
    //   JSON.stringify(mapper.toHdf()['Prowler.json'], null, 2)
    // );

    expect(omitVersions(mapper.toHdf()['Prowler.json'])).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/asff_mapper/prowler-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });

  it('Successfully converts Prowler ASFF as Objects delimited by newline', () => {
    const mapper = new Mapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/prowler-sample.asff-json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/asff_mapper/prowler-hdf.json',
    //   JSON.stringify(mapper.toHdf()['Prowler.json'], null, 2)
    // );

    expect(omitVersions(mapper.toHdf()['Prowler.json'])).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/asff_mapper/prowler-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });

  it('Successfully converts Trivy ASFF as Array', () => {
    const mapper = new Mapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/trivy-image_golang-1.12-alpine_sample.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/asff_mapper/trivy-image_golang-1.12-alpine-hdf.json',
    //   JSON.stringify(mapper.toHdf()['Aqua Security - Trivy.json'], null, 2)
    // );

    expect(omitVersions(mapper.toHdf()['Aqua Security - Trivy.json'])).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/asff_mapper/trivy-image_golang-1.12-alpine-hdf.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });

  it('Successfully converts HDF2ASFF / Previously HDF', () => {
    let mapper = new Mapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/rhel7_V-71931_asff.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/asff_mapper/rhel7_V-71931-hdf.json',
    //   JSON.stringify(
    //     mapper.toHdf()['rhel7_V-71931.json-this-is-a-test.json'],
    //     null,
    //     2
    //   )
    // );

    expect(
      omitVersions(mapper.toHdf()['rhel7_V-71931.json-this-is-a-test.json'])
    ).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/asff_mapper/rhel7_V-71931-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
    mapper = new Mapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/example-3-layer-overlay_asff.json',
        {
          encoding: 'utf-8'
        }
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/asff_mapper/example-3-layer-overlay_hdf.json',
    //   JSON.stringify(
    //     mapper.toHdf()[
    //       'example-3-layer-overlay_03062022.json-this-is-a-test.json'
    //     ],
    //     null,
    //     2
    //   )
    // );

    expect(
      omitVersions(
        mapper.toHdf()[
          'example-3-layer-overlay_03062022.json-this-is-a-test.json'
        ]
      )
    ).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/asff_mapper/example-3-layer-overlay_hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
