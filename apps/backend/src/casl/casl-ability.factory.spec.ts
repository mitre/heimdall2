import {subject} from '@casl/ability';
import {beforeEach, describe, expect, it} from 'vitest';
import {Action, CaslAbilityFactory} from './casl-ability.factory';

const USER_ID = '42';
const OTHER_USER_ID = '99';
const ADMIN_ID = '1';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;

  beforeEach(() => {
    factory = new CaslAbilityFactory();
  });

  describe('User subject', () => {
    it('user can read/update/delete their own user', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const self = subject('User', {id: USER_ID, email: 'me@test.com'});
      expect(abac.can(Action.Read, self)).toBe(true);
      expect(abac.can(Action.Update, self)).toBe(true);
      expect(abac.can(Action.Delete, self)).toBe(true);
    });

    it('user cannot read/update/delete another user', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const other = subject('User', {id: OTHER_USER_ID, email: 'other@test.com'});
      expect(abac.can(Action.Read, other)).toBe(false);
      expect(abac.can(Action.Update, other)).toBe(false);
      expect(abac.can(Action.Delete, other)).toBe(false);
    });

    it('user cannot perform admin actions on self', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const self = subject('User', {id: USER_ID});
      expect(abac.can(Action.DeleteNoPassword, self)).toBe(false);
      expect(abac.can(Action.UpdateNoPassword, self)).toBe(false);
      expect(abac.can(Action.SkipForcePasswordChange, self)).toBe(false);
      expect(abac.can(Action.UpdateRole, self)).toBe(false);
    });

    it('user can read slim users', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      expect(abac.can(Action.ReadSlim, 'User')).toBe(true);
    });

    it('admin can manage all users except themselves', () => {
      const abac = factory.createForUser({id: ADMIN_ID, role: 'admin'});
      const other = subject('User', {id: OTHER_USER_ID});
      const self = subject('User', {id: ADMIN_ID});
      expect(abac.can(Action.Manage, other)).toBe(true);
      expect(abac.can(Action.DeleteNoPassword, other)).toBe(true);
      expect(abac.can(Action.UpdateNoPassword, other)).toBe(true);
      expect(abac.can(Action.Manage, self)).toBe(false);
    });

    it('admin can skip force password change for others', () => {
      const abac = factory.createForUser({id: ADMIN_ID, role: 'admin'});
      const other = subject('User', {id: OTHER_USER_ID});
      expect(abac.can(Action.SkipForcePasswordChange, other)).toBe(true);
    });

    it('admin can update role of others', () => {
      const abac = factory.createForUser({id: ADMIN_ID, role: 'admin'});
      const other = subject('User', {id: OTHER_USER_ID});
      expect(abac.can(Action.UpdateRole, other)).toBe(true);
    });
  });

  describe('Group subject (Drizzle shape)', () => {
    it('user can read public groups', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const publicGroup = subject('Group', {
        id: '1', public: true, groupUsers: [],
      });
      expect(abac.can(Action.Read, publicGroup)).toBe(true);
    });

    it('user can read groups they are a member of', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const memberGroup = subject('Group', {
        id: '1', public: false,
        groupUsers: [{user: {id: USER_ID}, role: 'member'}],
      });
      expect(abac.can(Action.Read, memberGroup)).toBe(true);
    });

    it('user cannot read private groups they are not a member of', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const privateGroup = subject('Group', {
        id: '1', public: false,
        groupUsers: [{user: {id: OTHER_USER_ID}, role: 'owner'}],
      });
      expect(abac.can(Action.Read, privateGroup)).toBe(false);
    });

    it('group owner can manage their group', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const ownedGroup = subject('Group', {
        id: '1', public: false,
        groupUsers: [
          {user: {id: USER_ID}, role: 'owner'},
          {user: {id: OTHER_USER_ID}, role: 'member'},
        ],
      });
      expect(abac.can(Action.Manage, ownedGroup)).toBe(true);
      expect(abac.can(Action.Update, ownedGroup)).toBe(true);
      expect(abac.can(Action.Delete, ownedGroup)).toBe(true);
      expect(abac.can(Action.AddEvaluation, ownedGroup)).toBe(true);
      expect(abac.can(Action.RemoveEvaluation, ownedGroup)).toBe(true);
    });

    it('group member cannot manage the group', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const memberGroup = subject('Group', {
        id: '1', public: false,
        groupUsers: [
          {user: {id: OTHER_USER_ID}, role: 'owner'},
          {user: {id: USER_ID}, role: 'member'},
        ],
      });
      expect(abac.can(Action.Manage, memberGroup)).toBe(false);
      expect(abac.can(Action.Update, memberGroup)).toBe(false);
      expect(abac.can(Action.Delete, memberGroup)).toBe(false);
    });

    it('group member can add/remove evaluations', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const memberGroup = subject('Group', {
        id: '1', public: false,
        groupUsers: [{user: {id: USER_ID}, role: 'member'}],
      });
      expect(abac.can(Action.AddEvaluation, memberGroup)).toBe(true);
      expect(abac.can(Action.RemoveEvaluation, memberGroup)).toBe(true);
    });

    it('any user can create a group', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      expect(abac.can(Action.Create, 'Group')).toBe(true);
    });
  });

  describe('Evaluation subject (Drizzle shape)', () => {
    it('user can read public evaluations', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const publicEval = subject('Evaluation', {
        id: '1', public: true, userId: OTHER_USER_ID,
      });
      expect(abac.can(Action.Read, publicEval)).toBe(true);
    });

    it('user can manage their own evaluations', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const ownEval = subject('Evaluation', {
        id: '1', public: false, userId: USER_ID,
      });
      expect(abac.can(Action.Manage, ownEval)).toBe(true);
      expect(abac.can(Action.Update, ownEval)).toBe(true);
      expect(abac.can(Action.Delete, ownEval)).toBe(true);
    });

    it('user cannot manage evaluations owned by another user', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const otherEval = subject('Evaluation', {
        id: '1', public: false, userId: OTHER_USER_ID,
      });
      expect(abac.can(Action.Manage, otherEval)).toBe(false);
      expect(abac.can(Action.Read, otherEval)).toBe(false);
    });

    it('user can read evaluations in groups they belong to (Drizzle shape)', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const groupEval = subject('Evaluation', {
        id: '1', public: false, userId: OTHER_USER_ID,
        groupEvaluations: [{
          group: {
            id: '10',
            groupUsers: [{user: {id: USER_ID}, role: 'member'}],
          },
        }],
      });
      expect(abac.can(Action.Read, groupEval)).toBe(true);
    });

    it('group owner can manage evaluations in their group (Drizzle shape)', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      const groupEval = subject('Evaluation', {
        id: '1', public: false, userId: OTHER_USER_ID,
        groupEvaluations: [{
          group: {
            id: '10',
            groupUsers: [{user: {id: USER_ID}, role: 'owner'}],
          },
        }],
      });
      expect(abac.can(Action.Manage, groupEval)).toBe(true);
    });

    it('any user can create evaluations', () => {
      const abac = factory.createForUser({id: USER_ID, role: 'user'});
      expect(abac.can(Action.Create, 'Evaluation')).toBe(true);
    });
  });

  describe('anonymous', () => {
    it('anonymous user cannot manage anything', () => {
      const abac = factory.createForAnonymous();
      expect(abac.can(Action.Manage, 'all')).toBe(false);
      expect(abac.can(Action.Read, 'User')).toBe(false);
    });
  });
});
