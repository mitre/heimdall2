import {describe, expect, it} from 'vitest';
import {NetsparkerResults} from '../../../src/netsparker-mapper';
import {omitVersions, readSample} from '../../utils';

describe('netsparker_mapper_check', () => {
  it('Successfully converts Netsparker scan targeted at a local/cloned repository data', async () => {
    const mapper = new NetsparkerResults(
      readSample('netsparker_mapper/sample_input_report/sample-netsparker-invicti.xml')
    );

    expect(omitVersions(await mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('netsparker_mapper/netsparker-hdf.json'))
      )
    );
  });
});

describe('netsparker_mapper_check_withraw', () => {
  it('Successfully converts withRaw flagged Netsparker scan', async () => {
    const mapper = new NetsparkerResults(
      readSample('netsparker_mapper/sample_input_report/sample-netsparker-invicti.xml'),
      true
    );

    expect(omitVersions(await mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(readSample('netsparker_mapper/netsparker-hdf-withraw.json'))
      )
    );
  });
});
