import {randomBytes, randomUUID} from 'node:crypto';
import {apiKeys} from '../schema';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

type ApiKeyInsert = typeof apiKeys.$inferInsert;
type ApiKeySelect = typeof apiKeys.$inferSelect;

type ApiKeyRequired = Pick<ApiKeyInsert, 'userId'>;

let counter = 0;

export const apiKeyFactory = {
  build(
    overrides: ApiKeyRequired & Partial<ApiKeyInsert>
  ): ApiKeyInsert {
    counter++;
    const now = new Date().toISOString();
    return {
      name: `test-key-${counter}-${randomUUID().slice(0, 8)}`,
      apiKey: randomBytes(32).toString('hex'),
      type: 'personal',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  },

  async create(
    db: NodePgDatabase<Record<string, unknown>>,
    overrides: ApiKeyRequired & Partial<ApiKeyInsert>
  ): Promise<ApiKeySelect> {
    const data = apiKeyFactory.build(overrides);
    const [key] = await db.insert(apiKeys).values(data).returning();
    return key;
  },
};
