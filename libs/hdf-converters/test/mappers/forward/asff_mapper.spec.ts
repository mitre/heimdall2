import fs from 'fs';
import _ from 'lodash';
import {ASFFResults as Mapper} from '../../../src/asff-mapper';
import {omitVersions} from '../../utils';

describe('ASFF Mapper', () => {
  it('Successfully converts Native ASFF', () => {
    const mapper = new Mapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/asff_sample.json',
        {encoding: 'utf-8'}
      )
    );
    expect(_.mapValues(mapper.toHdf(), omitVersions)).toEqual({
      'CIS AWS Foundations Benchmark v1.2.0': omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/asff_mapper/asff-cis_aws-foundations_benchmark_v1.2.0-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      ),
      'AWS Foundational Security Best Practices v1.0.0': omitVersions(
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
      ),
      undefined,
      {name: 'Prowler', title: 'Prowler Findings'}
    );
    expect(omitVersions(mapper.toHdf()['Prowler'])).toEqual(
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
      ),
      undefined,
      {name: 'Prowler', title: 'Prowler Findings'}
    );
    expect(omitVersions(mapper.toHdf()['Prowler'])).toEqual(
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
      ),
      undefined,
      {name: 'Trivy', title: 'Trivy Findings'}
    );
    expect(omitVersions(mapper.toHdf()['Aqua Security - Trivy'])).toEqual(
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

  it('Successfully converts HDF2ASFF', () => {
    const mapper = new Mapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/example-3-layer-rh7-overlay-asff.json',
        {encoding: 'utf-8'}
      )
    );
    expect(
      omitVersions(
        mapper.toHdf()[
          'reverse-proxy - second-layer-example-inspec-overlay-profile-against-1st-layer-example-inspec-overlay-profile'
        ]
      )
    ).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/asff_mapper/example-3-layer-rh7-overlay-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
