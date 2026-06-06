import {ForbiddenError} from '@casl/ability';
import {BadRequestException} from '@nestjs/common';
import {describe, expect, vi} from 'vitest';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {groupFactory} from '../db/factories/group.factory';
import {groupMemberFactory} from '../db/factories/group-member.factory';

vi.stubEnv('API_KEY_SECRET', 'test-api-key-secret-for-jwt-signing-32chars!');

const {ApiKeyService} = await import('./apikey.service');
const {ApiKeyController} = await import('./apikey.controller');
const {AuthzService} = await import('../authz/authz.service');
const {GroupsService} = await import('../groups/groups.service');
const {UsersService} = await import('../users/users.service');
const {test} = await import('../db/test-fixture');

function mockAuthnService() {
  return {
    testPassword: vi.fn().mockResolvedValue(undefined),
    validateUser: vi.fn(),
    login: vi.fn(),
    validateApiKey: vi.fn(),
    logout: vi.fn(),
  };
}

function buildController(db: unknown) {
  const authnService = mockAuthnService();
  const apiKeyService = new ApiKeyService(db);
  const authzService = new AuthzService();
  const groupsService = new GroupsService(db);
  const usersService = new UsersService(db, groupsService);
  const controller = new ApiKeyController(
    authnService as never,
    apiKeyService,
    authzService,
    usersService,
    groupsService,
  );
  return {controller, authnService, apiKeyService};
}

describe('ApiKeyController', () => {
  describe('findAPIKeys', () => {
    test('returns keys for the requesting user when no userId/groupId', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `ctrl-find-self-${Date.now()}@ctrl.test`,
        role: 'user',
      });
      const {controller, apiKeyService} = buildController(db);
      await apiKeyService.create({id: user.id, email: user.email}, {name: 'my-key'});

      const result = await controller.findAPIKeys(
        {user: {...user, creationMethod: 'local'}},
        undefined as unknown as string,
        undefined as unknown as string,
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('my-key');
    });

    test('returns keys for a specific user when userId is provided', async ({db}) => {
      const admin = await legacyUserFactory.create(db, {
        email: `ctrl-admin-find-${Date.now()}@ctrl.test`,
        role: 'admin',
      });
      const target = await legacyUserFactory.create(db, {
        email: `ctrl-target-${Date.now()}@ctrl.test`,
        role: 'user',
      });
      const {controller, apiKeyService} = buildController(db);
      await apiKeyService.create({id: target.id, email: target.email}, {name: 'target-key'});

      const result = await controller.findAPIKeys(
        {user: {...admin, creationMethod: 'local'}},
        String(target.id),
        undefined as unknown as string,
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('target-key');
    });

    test('returns keys for a group when groupId is provided', async ({db}) => {
      const admin = await legacyUserFactory.create(db, {
        email: `ctrl-grp-find-${Date.now()}@ctrl.test`,
        role: 'admin',
      });
      const group = await groupFactory.create(db);
      const {controller, apiKeyService} = buildController(db);
      await apiKeyService.create(group, {name: 'group-key'});

      const result = await controller.findAPIKeys(
        {user: {...admin, creationMethod: 'local'}},
        undefined as unknown as string,
        String(group.id),
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('group-key');
    });

    test('throws BadRequestException when both userId and groupId are provided', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `ctrl-both-${Date.now()}@ctrl.test`,
        role: 'admin',
      });
      const {controller} = buildController(db);

      await expect(
        controller.findAPIKeys(
          {user: {...user, creationMethod: 'local'}},
          '1',
          '1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    test('throws ForbiddenError when non-admin reads another user keys', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `ctrl-forbid-${Date.now()}@ctrl.test`,
        role: 'user',
      });
      const other = await legacyUserFactory.create(db, {
        email: `ctrl-other-${Date.now()}@ctrl.test`,
        role: 'user',
      });
      const {controller} = buildController(db);

      await expect(
        controller.findAPIKeys(
          {user: {...user, creationMethod: 'local'}},
          String(other.id),
          undefined as unknown as string,
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('createAPIKey', () => {
    test('creates a key for the requesting user when no target specified', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `ctrl-create-self-${Date.now()}@ctrl.test`,
        role: 'user',
        creationMethod: 'github',
      });
      const {controller} = buildController(db);

      const result = await controller.createAPIKey(
        {user: {...user, creationMethod: 'github'}},
        {} as never,
      );
      expect(result.id).toBeTypeOf('string');
      expect(result.apiKey).toBeTypeOf('string');
    });

    test('calls testPassword for local users on create', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `ctrl-create-local-${Date.now()}@ctrl.test`,
        role: 'user',
        creationMethod: 'local',
      });
      const {controller, authnService} = buildController(db);

      await controller.createAPIKey(
        {user: {...user, creationMethod: 'local'}},
        {currentPassword: 'test123'} as never,
      );
      expect(authnService.testPassword).toHaveBeenCalledOnce();
    });

    test('does not call testPassword for non-local users on create', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `ctrl-create-github-${Date.now()}@ctrl.test`,
        role: 'user',
        creationMethod: 'github',
      });
      const {controller, authnService} = buildController(db);

      await controller.createAPIKey(
        {user: {...user, creationMethod: 'github'}},
        {} as never,
      );
      expect(authnService.testPassword).not.toHaveBeenCalled();
    });

    test('admin can create a key for another user by userId', async ({db}) => {
      const admin = await legacyUserFactory.create(db, {
        email: `ctrl-admin-create-${Date.now()}@ctrl.test`,
        role: 'admin',
        creationMethod: 'github',
      });
      const target = await legacyUserFactory.create(db, {
        email: `ctrl-target-create-${Date.now()}@ctrl.test`,
        role: 'user',
      });
      const {controller} = buildController(db);

      const result = await controller.createAPIKey(
        {user: {...admin, creationMethod: 'github'}},
        {userId: String(target.id)} as never,
      );
      expect(result.id).toBeTypeOf('string');
    });

    test('admin can create a key for a group by groupId', async ({db}) => {
      const admin = await legacyUserFactory.create(db, {
        email: `ctrl-admin-grp-create-${Date.now()}@ctrl.test`,
        role: 'admin',
        creationMethod: 'github',
      });
      const group = await groupFactory.create(db);
      const {controller} = buildController(db);

      const result = await controller.createAPIKey(
        {user: {...admin, creationMethod: 'github'}},
        {groupId: String(group.id)} as never,
      );
      expect(result.id).toBeTypeOf('string');
    });
  });

  describe('deleteAPIKey', () => {
    test('deletes a user-type API key with proper authorization', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `ctrl-del-${Date.now()}@ctrl.test`,
        role: 'user',
        creationMethod: 'github',
      });
      const {controller, apiKeyService} = buildController(db);
      const created = await apiKeyService.create(
        {id: user.id, email: user.email},
        {name: 'delete-me'},
      );

      const result = await controller.deleteAPIKey(
        {user: {...user, creationMethod: 'github'}},
        created.id,
        {} as never,
      );
      expect(result.name).toBe('delete-me');
    });

    test('deletes a group-type API key when user is admin', async ({db}) => {
      const admin = await legacyUserFactory.create(db, {
        email: `ctrl-del-grp-${Date.now()}@ctrl.test`,
        role: 'admin',
        creationMethod: 'github',
      });
      const group = await groupFactory.create(db);
      const {controller, apiKeyService} = buildController(db);
      const created = await apiKeyService.create(group, {name: 'grp-del'});

      const result = await controller.deleteAPIKey(
        {user: {...admin, creationMethod: 'github'}},
        created.id,
        {} as never,
      );
      expect(result.name).toBe('grp-del');
    });

    test('calls testPassword for local users on delete', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `ctrl-del-local-${Date.now()}@ctrl.test`,
        role: 'user',
        creationMethod: 'local',
      });
      const {controller, authnService, apiKeyService} = buildController(db);
      const created = await apiKeyService.create(
        {id: user.id, email: user.email},
        {name: 'local-del'},
      );

      await controller.deleteAPIKey(
        {user: {...user, creationMethod: 'local'}},
        created.id,
        {currentPassword: 'test123'} as never,
      );
      expect(authnService.testPassword).toHaveBeenCalledOnce();
    });
  });

  describe('updateAPIKey', () => {
    test('updates a user-type API key name', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `ctrl-upd-${Date.now()}@ctrl.test`,
        role: 'user',
        creationMethod: 'github',
      });
      const {controller, apiKeyService} = buildController(db);
      const created = await apiKeyService.create(
        {id: user.id, email: user.email},
        {name: 'old-name'},
      );

      const result = await controller.updateAPIKey(
        {user: {...user, creationMethod: 'github'}},
        created.id,
        {name: 'new-name'} as never,
      );
      expect(result.name).toBe('new-name');
    });

    test('updates a group-type API key name when user is admin', async ({db}) => {
      const admin = await legacyUserFactory.create(db, {
        email: `ctrl-upd-grp-${Date.now()}@ctrl.test`,
        role: 'admin',
        creationMethod: 'github',
      });
      const group = await groupFactory.create(db);
      const {controller, apiKeyService} = buildController(db);
      const created = await apiKeyService.create(group, {name: 'grp-old'});

      const result = await controller.updateAPIKey(
        {user: {...admin, creationMethod: 'github'}},
        created.id,
        {name: 'grp-new'} as never,
      );
      expect(result.name).toBe('grp-new');
    });

    test('calls testPassword for local users on update', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `ctrl-upd-local-${Date.now()}@ctrl.test`,
        role: 'user',
        creationMethod: 'local',
      });
      const {controller, authnService, apiKeyService} = buildController(db);
      const created = await apiKeyService.create(
        {id: user.id, email: user.email},
        {name: 'local-upd'},
      );

      await controller.updateAPIKey(
        {user: {...user, creationMethod: 'local'}},
        created.id,
        {name: 'local-new', currentPassword: 'test123'} as never,
      );
      expect(authnService.testPassword).toHaveBeenCalledOnce();
    });

    test('non-admin cannot update another user key', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `ctrl-upd-forbid-${Date.now()}@ctrl.test`,
        role: 'user',
      });
      const other = await legacyUserFactory.create(db, {
        email: `ctrl-upd-other-${Date.now()}@ctrl.test`,
        role: 'user',
      });
      const {controller, apiKeyService} = buildController(db);
      const created = await apiKeyService.create(
        {id: other.id, email: other.email},
        {name: 'other-key'},
      );

      await expect(
        controller.updateAPIKey(
          {user: {...user, creationMethod: 'github'}},
          created.id,
          {name: 'hacked'} as never,
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
