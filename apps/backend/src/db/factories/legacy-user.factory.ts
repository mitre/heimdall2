import {randomUUID} from 'node:crypto';
import {users} from '../schema';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

type LegacyUserInsert = typeof users.$inferInsert;
type LegacyUserSelect = typeof users.$inferSelect;

let counter = 0;

export const legacyUserFactory = {
  build(overrides?: Partial<LegacyUserInsert>): LegacyUserInsert {
    counter++;
    const suffix = randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    return {
      email: `legacy-${counter}-${suffix}@test.heimdall.local`,
      encryptedPassword: '$2b$14$placeholder',
      creationMethod: 'local',
      role: 'user',
      loginCount: 0,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  },

  async create(
    db: NodePgDatabase<Record<string, unknown>>,
    overrides?: Partial<LegacyUserInsert>
  ): Promise<LegacyUserSelect> {
    const data = legacyUserFactory.build(overrides);
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },
};
