/*import fs from 'fs';
import {NetsparkerMapper} from '../../../src/netsparker-mapper';
import {omitVersions} from '../../utils';

describe('netsparker_mapper_check', () => {
  it('Successfully converts Netsparker scan targeted at a local/cloned repository data', () => {
    const mapper = new NetsparkerMapper(
      fs.readFileSync(
        'sample_jsons/netsparker_mapper/sample_input_report/{HERE}',
        {encoding: 'utf-8'}
      )
    );

    // fs.writeFileSync(
    //   'sample_jsons/netsparker_mapper/sample_input_report/{HERE}',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/netsparker_mapper/{HERE}', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});

describe('netsparker_mapper_check_withraw', () => {
  it('Successfully converts withRaw flagged Netsparker scan', () => {
    const mapper = new NetsparkerMapper(
      fs.readFileSync(
        'sample_jsons/netsparker_mapper/sample_input_report/{HERE}',
        {encoding: 'utf-8'}
      ),
      true
    );

    // fs.writeFileSync(
    //   'sample_jsons/netsparker_mapper/{HERE}',
    //   JSON.stringify(mapper.toHdf(), null, 2)
    // );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/netsparker_mapper/{HERE}', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
*/
