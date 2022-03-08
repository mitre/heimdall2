import fs from 'fs';
import {PrismaMapper} from '../../../src/prisma-mapper';
import {omitVersions} from '../../utils';

describe('prisma_mapper', () => {
  it('Successfully converts Prisma reports', () => {
    const mapper = new PrismaMapper(
      fs.readFileSync(
        'sample_jsons/prisma_mapper/sample_input_report/prismacloud_sample.csv',
        {encoding: 'utf-8'}
      )
    );

    fs.writeFileSync(
      'sample_jsons/prisma_mapper/prisma-hdf.json',
      JSON.stringify(mapper.toHdf())
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync('sample_jsons/prisma_mapper/prisma-hdf.json', {
            encoding: 'utf-8'
          })
        )
      )
    );
  });
});
