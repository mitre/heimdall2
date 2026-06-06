import {groupUsers} from '../schema';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

type GroupUserInsert = typeof groupUsers.$inferInsert;
type GroupUserSelect = typeof groupUsers.$inferSelect;

type GroupMemberRequired = Pick<GroupUserInsert, 'userId' | 'groupId'>;

export const groupMemberFactory = {
  build(
    overrides: GroupMemberRequired & Partial<GroupUserInsert>
  ): GroupUserInsert {
    const now = new Date().toISOString();
    return {
      role: 'member',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  },

  async create(
    db: NodePgDatabase<Record<string, unknown>>,
    overrides: GroupMemberRequired & Partial<GroupUserInsert>
  ): Promise<GroupUserSelect> {
    const data = groupMemberFactory.build(overrides);
    const [membership] = await db
      .insert(groupUsers)
      .values(data)
      .returning();
    return membership;
  },
};
