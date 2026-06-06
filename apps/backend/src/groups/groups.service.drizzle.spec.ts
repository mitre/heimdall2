import {describe, expect} from 'vitest';
import {ForbiddenException, NotFoundException} from '@nestjs/common';
import {and, eq} from 'drizzle-orm';
import {test} from '../db/test-fixture';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {groupFactory} from '../db/factories/group.factory';
import {groupMemberFactory} from '../db/factories/group-member.factory';
import {evaluationFactory} from '../db/factories/evaluation.factory';
import {groupUsers, groupEvaluations, groups} from '../db/schema';
import {GroupsService} from './groups.service';

describe('GroupsService (Drizzle)', () => {
  describe('create', () => {
    test('creates a group via Drizzle and returns typed result with name and description', async ({db}) => {
      const service = new GroupsService(db);
      const group = await service.create({name: 'Security Team', public: false, desc: 'A test group'});
      expect(group.id).toBeTypeOf('number');
      expect(group.name).toBe('Security Team');
      expect(group.public).toBe(false);
      expect(group.desc).toBe('A test group');
      expect(group.createdAt).toBeDefined();
      expect(group.updatedAt).toBeDefined();
    });

    test('throws ForbiddenException when group name already exists', async ({db}) => {
      const service = new GroupsService(db);
      await service.create({name: 'Unique Team', public: false, desc: ''});
      await expect(
        service.create({name: 'Unique Team', public: false, desc: ''}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    test('returns all groups with users and their roles', async ({db}) => {
      const service = new GroupsService(db);
      const user = await legacyUserFactory.create(db, {email: `findall-${Date.now()}@groups-svc.test`});
      const group = await service.create({name: 'FindAll Team', public: false, desc: ''});
      await service.addUserToGroup(group.id, user.id, 'owner');

      const all = await service.findAll();
      const found = all.find((g) => g.id === group.id);
      expect(found).toBeDefined();
      expect(found!.groupUsers).toBeDefined();
      expect(found!.groupUsers.length).toBe(1);
      expect(found!.groupUsers[0].role).toBe('owner');
      expect(found!.groupUsers[0].user).toBeDefined();
      expect(found!.groupUsers[0].user!.email).toBe(user.email);
    });
  });

  describe('count', () => {
    test('returns count of groups', async ({db}) => {
      const service = new GroupsService(db);
      const created = await service.create({name: 'Count Team', public: false, desc: ''});
      const after = await service.count();
      expect(after).toBeGreaterThanOrEqual(1);
      const found = await service.findByPkBang(String(created.id));
      expect(found.name).toBe('Count Team');
    });
  });

  describe('findByPkBang', () => {
    test('finds a group by id with users', async ({db}) => {
      const service = new GroupsService(db);
      const user = await legacyUserFactory.create(db, {email: `findpk-${Date.now()}@groups-svc.test`});
      const group = await service.create({name: 'FindPk Team', public: false, desc: ''});
      await service.addUserToGroup(group.id, user.id, 'member');

      const found = await service.findByPkBang(String(group.id));
      expect(found.id).toBe(group.id);
      expect(found.name).toBe('FindPk Team');
      expect(found.groupUsers).toHaveLength(1);
    });

    test('throws NotFoundException for non-existent id', async ({db}) => {
      const service = new GroupsService(db);
      await expect(service.findByPkBang('999999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByName', () => {
    test('finds a group by name', async ({db}) => {
      const service = new GroupsService(db);
      await service.create({name: 'Named Team', public: true, desc: 'desc'});
      const found = await service.findByName('Named Team');
      expect(found.name).toBe('Named Team');
    });

    test('throws NotFoundException for non-existent name', async ({db}) => {
      const service = new GroupsService(db);
      await expect(service.findByName('Nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addUserToGroup', () => {
    test('adds a user to a group with a role', async ({db}) => {
      const service = new GroupsService(db);
      const user = await legacyUserFactory.create(db, {email: `adduser-${Date.now()}@groups-svc.test`});
      const group = await service.create({name: 'Add User Team', public: false, desc: ''});

      await service.addUserToGroup(group.id, user.id, 'member');

      const [membership] = await db.select().from(groupUsers)
        .where(and(eq(groupUsers.groupId, group.id), eq(groupUsers.userId, user.id)));
      expect(membership).toBeDefined();
      expect(membership.role).toBe('member');
    });
  });

  describe('removeUserFromGroup', () => {
    test('removes a user from a group', async ({db}) => {
      const service = new GroupsService(db);
      const owner = await legacyUserFactory.create(db, {email: `owner-${Date.now()}@groups-svc.test`, role: 'admin'});
      const member = await legacyUserFactory.create(db, {email: `member-${Date.now()}@groups-svc.test`});
      const group = await service.create({name: 'Remove User Team', public: false, desc: ''});
      await service.addUserToGroup(group.id, owner.id, 'owner');
      await service.addUserToGroup(group.id, member.id, 'member');

      await service.removeUserFromGroup(group.id, member.id);

      const memberships = await db.select().from(groupUsers)
        .where(and(eq(groupUsers.groupId, group.id), eq(groupUsers.userId, member.id)));
      expect(memberships).toHaveLength(0);
    });
  });

  describe('addEvaluationToGroup', () => {
    test('adds an evaluation to a group', async ({db}) => {
      const service = new GroupsService(db);
      const group = await service.create({name: 'Eval Team', public: false, desc: ''});
      const evaluation = await evaluationFactory.create(db);

      await service.addEvaluationToGroup(group.id, evaluation.id);

      const [link] = await db.select().from(groupEvaluations)
        .where(and(eq(groupEvaluations.groupId, group.id), eq(groupEvaluations.evaluationId, evaluation.id)));
      expect(link).toBeDefined();
    });
  });

  describe('removeEvaluationFromGroup', () => {
    test('removes an evaluation from a group', async ({db}) => {
      const service = new GroupsService(db);
      const group = await service.create({name: 'RemoveEval Team', public: false, desc: ''});
      const evaluation = await evaluationFactory.create(db);
      await service.addEvaluationToGroup(group.id, evaluation.id);

      await service.removeEvaluationFromGroup(group.id, evaluation.id);

      const links = await db.select().from(groupEvaluations)
        .where(and(eq(groupEvaluations.groupId, group.id), eq(groupEvaluations.evaluationId, evaluation.id)));
      expect(links).toHaveLength(0);
    });
  });

  describe('update', () => {
    test('updates group name and description', async ({db}) => {
      const service = new GroupsService(db);
      const group = await service.create({name: 'Old Name', public: false, desc: 'old'});

      const updated = await service.update(group.id, {name: 'New Name', public: true, desc: 'new'});
      expect(updated.name).toBe('New Name');
      expect(updated.public).toBe(true);
      expect(updated.desc).toBe('new');
    });

    test('throws ForbiddenException on duplicate name', async ({db}) => {
      const service = new GroupsService(db);
      await service.create({name: 'Existing', public: false, desc: ''});
      const other = await service.create({name: 'Other', public: false, desc: ''});

      await expect(
        service.update(other.id, {name: 'Existing', public: false, desc: ''}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    test('deletes a group and returns it', async ({db}) => {
      const service = new GroupsService(db);
      const group = await service.create({name: 'Delete Me', public: false, desc: ''});

      const deleted = await service.remove(group.id);
      expect(deleted.name).toBe('Delete Me');

      const remaining = await db.select().from(groups).where(eq(groups.id, group.id));
      expect(remaining).toHaveLength(0);
    });
  });

  describe('updateGroupUserRole', () => {
    test('updates role of a user in a group', async ({db}) => {
      const service = new GroupsService(db);
      const user = await legacyUserFactory.create(db, {email: `role-${Date.now()}@groups-svc.test`});
      const group = await service.create({name: 'Role Team', public: false, desc: ''});
      await service.addUserToGroup(group.id, user.id, 'member');

      const updated = await service.updateGroupUserRole(group.id, {
        userId: String(user.id),
        groupRole: 'owner',
      });
      expect(updated).toBeDefined();
      expect(updated!.role).toBe('owner');
    });
  });

  describe('ensureGroupHasOwner', () => {
    test('promotes admin when last owner is being removed', async ({db}) => {
      const service = new GroupsService(db);
      const admin = await legacyUserFactory.create(db, {
        email: `admin-${Date.now()}@groups-svc.test`,
        role: 'admin',
      });
      const owner = await legacyUserFactory.create(db, {email: `owner-${Date.now()}@groups-svc.test`});
      const group = await service.create({name: 'Owner Team', public: false, desc: ''});
      await service.addUserToGroup(group.id, owner.id, 'owner');

      await service.ensureGroupHasOwner(group.id, owner.id);

      const [adminMembership] = await db.select().from(groupUsers)
        .where(and(eq(groupUsers.groupId, group.id), eq(groupUsers.userId, admin.id)));
      expect(adminMembership).toBeDefined();
      expect(adminMembership.role).toBe('owner');
    });
  });
});
