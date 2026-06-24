import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { PrismaMapper } from '../../../src/prisma-mapper';
import { loadFixture, omitVersions } from '../../utils';

describe('prisma_mapper', () => {
  it('Successfully converts Prisma reports', () => {
    const mapper = new PrismaMapper(
      fs.readFileSync(
        'sample_jsons/prisma_mapper/sample_input_report/prismacloud_sample.csv',
        { encoding: 'utf8' },
      ),
    );
    for (const obj of Object.values(mapper.toHdf())) {
      const fileName = `sample_jsons/prisma_mapper/${obj.platform.target_id}.json`;

      // fs.writeFileSync(fileName, JSON.stringify(obj, null, 2));

      expect(omitVersions(obj)).toEqual(
        omitVersions(loadFixture(fileName)),
      );
    }
  });
});
