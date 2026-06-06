import {describe, expect, it} from 'vitest';
import {PrismaMapper} from '../../../src/prisma-mapper';
import {omitVersions, readSample} from '../../utils';

describe('prisma_mapper', () => {
  it('Successfully converts Prisma reports', () => {
    const mapper = new PrismaMapper(
      readSample('prisma_mapper/sample_input_report/prismacloud_sample.csv')
    );
    Object.entries(mapper.toHdf()).forEach(([, obj]) => {
      expect(omitVersions(obj)).toEqual(
        omitVersions(
          JSON.parse(readSample('prisma_mapper', `${obj.platform.target_id}.json`))
        )
      );
    });
  });
});
