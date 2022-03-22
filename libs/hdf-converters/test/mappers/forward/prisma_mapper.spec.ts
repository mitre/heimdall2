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
    Object.entries(mapper.toHdf()).forEach(([, obj]) => {
      const fileName = `sample_jsons/prisma_mapper/${obj.platform.target_id}.json`;
      expect(omitVersions(obj)).toEqual(
        omitVersions(
          JSON.parse(
            fs.readFileSync(fileName, {
              encoding: 'utf-8'
            })
          )
        )
      );
    });
  });
});
