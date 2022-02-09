import fs from 'fs';
import {ASFFMapper} from '../../../src/asff-mapper';
import {omitVersions} from '../../utils';

describe('ASFF Mapper', () => {
  it('Successfully converts Native ASFF', () => {
    const mapper = new ASFFMapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/asff_sample.json',
        {encoding: 'utf-8'}
      )
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/asff_mapper/asff-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });

  it('Successfully converts Prowler ASFF as Array', () => {
    const mapper = new ASFFMapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/prowler_sample.json',
        {encoding: 'utf-8'}
      ),
      undefined,
      {name: 'Prowler', title: 'Prowler Findings'}
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
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
    const mapper = new ASFFMapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/prower-sample.asff-json',
        {encoding: 'utf-8'}
      ),
      undefined,
      {name: 'Prowler', title: 'Prowler Findings'}
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
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
    const mapper = new ASFFMapper(
      fs.readFileSync(
        'sample_jsons/asff_mapper/sample_input_report/trivy-image_golang-1.12-alpine_sample.json',
        {encoding: 'utf-8'}
      ),
      undefined,
      {name: 'Trivy', title: 'Trivy Findings'}
    );
    expect(omitVersions(mapper.toHdf())).toEqual(
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
});
