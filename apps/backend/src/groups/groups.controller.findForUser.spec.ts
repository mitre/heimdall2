import {describe, expect} from 'vitest';
import {test} from '../db/test-fixture';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {groupFactory} from '../db/factories/group.factory';
import {groupMemberFactory} from '../db/factories/group-member.factory';

describe('findGroupsForUser (Drizzle query)', () => {
  test('returns groups where user is a member', async ({db}) => {
    const user = await legacyUserFactory.create(db, {
      email: `member-${Date.now()}@findforuser.test`,
    });
    const group = await groupFactory.create(db);
    await groupMemberFactory.create(db, {
      userId: user.id,
      groupId: group.id,
      role: 'member',
    });

    const memberGroups = await db.query.groupUsers.findMany({
      where: (gu, {eq}) => eq(gu.userId, user.id),
      with: {group: {with: {groupUsers: {with: {user: true}}}}},
    });

    expect(memberGroups).toHaveLength(1);
    expect(memberGroups[0].group).toBeDefined();
    expect(memberGroups[0].group!.id).toBe(group.id);
  });

  test('returns empty when user has no groups', async ({db}) => {
    const user = await legacyUserFactory.create(db, {
      email: `nogroups-${Date.now()}@findforuser.test`,
    });

    const memberGroups = await db.query.groupUsers.findMany({
      where: (gu, {eq}) => eq(gu.userId, user.id),
      with: {group: true},
    });

    expect(memberGroups).toHaveLength(0);
  });
});
