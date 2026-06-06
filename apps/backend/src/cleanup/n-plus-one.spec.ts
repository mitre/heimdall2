import {describe, expect} from 'vitest';
import {test} from '../db/test-fixture';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {GroupsService} from '../groups/groups.service';
import {groupUsers, users} from '../db/schema';
import {eq} from 'drizzle-orm';

describe('N+1 query fixes', () => {
  let nameCounter = 0;

  function uniqueGroupName(prefix: string): string {
    nameCounter += 1;
    return `${prefix}-${Date.now()}-${nameCounter}`;
  }

  describe('syncUserGroups', () => {
    test('adds user to multiple groups in batch without individual findByName calls', async ({db}) => {
      const service = new GroupsService(db);
      const user = await legacyUserFactory.create(db, {
        email: `sync-${Date.now()}@n1.test`,
      });
      const groupA = uniqueGroupName('SyncGroup-A');
      const groupB = uniqueGroupName('SyncGroup-B');
      await service.create({name: groupA, public: false, desc: ''});
      await service.create({name: groupB, public: false, desc: ''});

      await service.syncUserGroups(user.id, [groupA, groupB]);

      const memberships = await db
        .select()
        .from(groupUsers)
        .where(eq(groupUsers.userId, user.id));
      expect(memberships).toHaveLength(2);
    });

    test('removes user from groups not in the new list', async ({db}) => {
      const service = new GroupsService(db);
      const user = await legacyUserFactory.create(db, {
        email: `unsync-${Date.now()}@n1.test`,
        role: 'admin',
      });
      const groupAName = uniqueGroupName('UnsyncGroup-A');
      const groupBName = uniqueGroupName('UnsyncGroup-B');
      const groupA = await service.create({name: groupAName, public: false, desc: ''});
      const groupB = await service.create({name: groupBName, public: false, desc: ''});
      await service.addUserToGroup(groupA.id, user.id, 'member');
      await service.addUserToGroup(groupB.id, user.id, 'member');

      await service.syncUserGroups(user.id, [groupAName]);

      const memberships = await db
        .select()
        .from(groupUsers)
        .where(eq(groupUsers.userId, user.id));
      expect(memberships).toHaveLength(1);
    });

    test('skips nonexistent groups without error', async ({db}) => {
      const service = new GroupsService(db);
      const user = await legacyUserFactory.create(db, {
        email: `skip-${Date.now()}@n1.test`,
      });

      await expect(
        service.syncUserGroups(user.id, ['NonexistentGroup']),
      ).resolves.not.toThrow();
    });
  });

  describe('user removal group check', () => {
    test('ensureGroupHasOwner only checks groups the user belongs to', async ({db}) => {
      const service = new GroupsService(db);
      await legacyUserFactory.create(db, {
        email: `admin-${Date.now()}@n1.test`,
        role: 'admin',
      });
      const user = await legacyUserFactory.create(db, {
        email: `member-${Date.now()}@n1.test`,
      });
      const group = await service.create({
        name: uniqueGroupName('OwnerCheck'),
        public: false,
        desc: '',
      });
      await service.addUserToGroup(group.id, user.id, 'owner');

      await service.ensureGroupHasOwner(group.id, user.id);

      const memberships = await db
        .select()
        .from(groupUsers)
        .where(eq(groupUsers.groupId, group.id));
      const promotedOwners = memberships.filter(
        (membership) => membership.role === 'owner' && membership.userId !== user.id,
      );
      expect(promotedOwners).toHaveLength(1);

      const [promotedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, promotedOwners[0].userId));
      expect(promotedUser.role).toBe('admin');
    });
  });
});
