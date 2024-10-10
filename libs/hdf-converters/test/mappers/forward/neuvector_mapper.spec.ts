import fs from 'fs';
import {NeuVectorMapper} from '../../../src/neuvector-mapper';
import {omitVersions} from '../../utils';

describe('neuvector_mapper', () => {
  it('Successfully converts NeuVector targeted at mitre/caldera', () => {
    const mapper = new NeuVectorMapper(
      fs.readFileSync(
        'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-caldera.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-caldera.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-caldera.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });

  it('Successfully converts NeuVector targeted at mitre/heimdall', () => {
    const mapper = new NeuVectorMapper(
      fs.readFileSync(
        'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-heimdall.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-heimdall.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-heimdall.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });

  it('Successfully converts NeuVector targeted at mitre/heimdall2', () => {
    const mapper = new NeuVectorMapper(
      fs.readFileSync(
        'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-heimdall2.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-heimdall2.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-heimdall2.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });

  it('Successfully converts NeuVector targeted at mitre/vulcan', () => {
    const mapper = new NeuVectorMapper(
      fs.readFileSync(
        'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-vulcan.json',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-vulcan.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/neuvector_mapper/neuvector-hdf-mitre-vulcan.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });
});

describe('neuvector_mapper_withraw', () => {
  it('Successfully converts withraw flagged NeuVector targeted at mitre/caldera', () => {
    const mapper = new NeuVectorMapper(
      fs.readFileSync(
        'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-caldera.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-caldera.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-caldera.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });

  it('Successfully converts withraw flagged NeuVector targeted at mitre/heimdall', () => {
    const mapper = new NeuVectorMapper(
      fs.readFileSync(
        'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-heimdall.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-heimdall.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-heimdall.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });

  it('Successfully converts withraw flagged NeuVector targeted at mitre/heimdall2', () => {
    const mapper = new NeuVectorMapper(
      fs.readFileSync(
        'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-heimdall2.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-heimdall2.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-heimdall2.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });

  it('Successfully converts withraw flagged NeuVector targeted at mitre/vulcan', () => {
    const mapper = new NeuVectorMapper(
      fs.readFileSync(
        'sample_jsons/neuvector_mapper/sample_input_report/neuvector-mitre-vulcan.json',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-vulcan.json',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/neuvector_mapper/neuvector-hdf-withraw-mitre-vulcan.json',
            {encoding: 'utf-8'}
          )
        )
      )
    );
  });
});
