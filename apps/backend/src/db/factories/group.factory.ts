import {randomUUID} from 'node:crypto';
import {groups} from '../schema';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

type GroupInsert = typeof groups.$inferInsert;
type GroupSelect = typeof groups.$inferSelect;

let counter = 0;

export const groupFactory = {
  build(overrides?: Partial<GroupInsert>): GroupInsert {
    counter++;
    const now = new Date().toISOString();
    return {
      name: `Test Group ${counter}-${randomUUID().slice(0, 8)}`,
      public: false,
      desc: '',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  },

  async create(
    db: NodePgDatabase<Record<string, unknown>>,
    overrides?: Partial<GroupInsert>
  ): Promise<GroupSelect> {
    const data = groupFactory.build(overrides);
    const [group] = await db.insert(groups).values(data).returning();
    return group;
  },
};
