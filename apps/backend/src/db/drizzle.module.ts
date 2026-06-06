import {Global, Module} from '@nestjs/common';
import {drizzle} from 'drizzle-orm/node-postgres';
import {getDrizzleConnectionConfig} from './connection';
import * as schema from './schema';
import * as relations from './relations';

export const DRIZZLE = Symbol('DRIZZLE');

const drizzleProvider = {
  provide: DRIZZLE,
  useFactory: () => {
    const config = getDrizzleConnectionConfig(10);
    return drizzle({connection: config, schema: {...schema, ...relations}});
  },
};

@Global()
@Module({
  providers: [drizzleProvider],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
