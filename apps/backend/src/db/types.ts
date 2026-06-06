import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import type * as schema from './schema';
import type * as relations from './relations';

export type DbSchema = typeof schema & typeof relations;
export type TypedDb = NodePgDatabase<DbSchema>;
