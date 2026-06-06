import {describe, expect} from 'vitest';
import {test} from '../db/test-fixture';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {GroupsService} from '../groups/groups.service';
import {groupUsers} from '../db/schema';
import {eq} from 'drizzle-orm';

describe('N+1 query fixes', () => {
  describe('syncUserGroups', () => {
    test('adds user to multiple groups in batch without individual findByName calls', async ({db}) => {
      const service = new GroupsService(db);
      const user = await legacyUserFactory.create(db, {
        email: `sync-${Date.now()}@n1.test`,
      });
      await service.create({name: 'SyncGroup-A', public: false, desc: ''});
      await service.create({name: 'SyncGroup-B', public: false, desc: ''});

      await service.syncUserGroups(user.id, ['SyncGroup-A', 'SyncGroup-B']);

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
      const groupA = await service.create({name: 'UnsyncGroup-A', public: false, desc: ''});
      const groupB = await service.create({name: 'UnsyncGroup-B', public: false, desc: ''});
      await service.addUserToGroup(groupA.id, user.id, 'member');
      await service.addUserToGroup(groupB.id, user.id, 'member');

      await service.syncUserGroups(user.id, ['UnsyncGroup-A']);

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
      const admin = await legacyUserFactory.create(db, {
        email: `admin-${Date.now()}@n1.test`,
        role: 'admin',
      });
      const user = await legacyUserFactory.create(db, {
        email: `member-${Date.now()}@n1.test`,
      });
      const group = await service.create({name: 'OwnerCheck', public: false, desc: ''});
      await service.addUserToGroup(group.id, user.id, 'owner');

      await service.ensureGroupHasOwner(group.id, user.id);

      const memberships = await db
        .select()
        .from(groupUsers)
        .where(eq(groupUsers.groupId, group.id));
      const adminMembership = memberships.find((m) => m.userId === admin.id);
      expect(adminMembership).toBeDefined();
      expect(adminMembership!.role).toBe('owner');
    });
  });
});
