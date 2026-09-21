import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {NetsparkerResults} from '../../../src/netsparker-mapper';
import {omitVersions} from '../../utils';

describe('netsparker_mapper_check', () => {
  it('Successfully converts Netsparker scan targeted at a local/cloned repository data', async () => {
    const mapper = new NetsparkerResults(
      fs.readFileSync(
        'sample_jsons/netsparker_mapper/sample_input_report/sample-netsparker-invicti.xml',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/netsparker_mapper/netsparker-hdf.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(await mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/netsparker_mapper/netsparker-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

describe('netsparker_mapper_check_withraw', () => {
  it('Successfully converts withRaw flagged Netsparker scan', async () => {
    const mapper = new NetsparkerResults(
      fs.readFileSync(
        'sample_jsons/netsparker_mapper/sample_input_report/sample-netsparker-invicti.xml',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/netsparker_mapper/netsparker-hdf-withraw.json',
    //   JSON.stringify(await mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(await mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/netsparker_mapper/netsparker-hdf-withraw.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});
