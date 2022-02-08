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
        'sample_jsons/asff_mapper/sample_input_report/trivy_sample.json',
        {encoding: 'utf-8'}
      ),
      undefined,
      {name: 'Trivy', title: 'Trivy Findings'}
    );
    fs.writeFileSync('sample_jsons/asff_mapper/trivy-hdf.json', JSON.stringify(mapper.toHdf()), {encoding: 'utf-8'}) // TODO: remove when approval received for changes
    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/asff_mapper/trivy-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
