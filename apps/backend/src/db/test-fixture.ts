import {test as baseTest} from 'vitest';
import {drizzle} from 'drizzle-orm/node-postgres';
import {TransactionRollbackError} from 'drizzle-orm';
import {createTestPool} from './test-utils';
import * as schema from './schema';
import * as relations from './relations';
import type {TypedDb} from './types';

export type TestDb = TypedDb;

const pool = createTestPool();
const db = drizzle(pool, {schema: {...schema, ...relations}}) as unknown as TestDb;

export const test = baseTest.extend<{db: TestDb}>({
  db: async ({}, use) => {
    await db
      .transaction(async (tx) => {
        await use(tx as unknown as TestDb);
        tx.rollback();
      })
      .catch((e) => {
        if (e instanceof TransactionRollbackError) return;
        throw e;
      });
  },
});
