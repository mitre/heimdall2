import {describe, expect, vi} from 'vitest';
import {NotFoundException} from '@nestjs/common';
import {eq} from 'drizzle-orm';
import {apiKeys} from '../db/schema';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {groupFactory} from '../db/factories/group.factory';

vi.stubEnv('API_KEY_SECRET', 'test-api-key-secret-for-jwt-signing-32chars!');

const {ApiKeyService} = await import('./apikey.service');
const {test} = await import('../db/test-fixture');

describe('ApiKeyService', () => {
  describe('create', () => {
    test('creates a user API key via Drizzle and returns typed result with hashed key', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `creator-${Date.now()}@apikey-svc.test`,
      });
      const service = new ApiKeyService(db);
      const result = await service.create(
        {id: user.id, email: user.email},
        {name: 'my-key'},
      );
      expect(result.id).toBeTypeOf('string');
      expect(result.name).toBe('my-key');
      expect(result.apiKey).toBeTypeOf('string');
      expect(result.apiKey.split('.')).toHaveLength(3);
    });

    test('persists the API key with hashed value in the database', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `persist-${Date.now()}@apikey-svc.test`,
      });
      const service = new ApiKeyService(db);
      const result = await service.create(
        {id: user.id, email: user.email},
        {name: 'persisted-key'},
      );
      const [found] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, Number(result.id)));
      expect(found).toBeDefined();
      expect(found.name).toBe('persisted-key');
      expect(found.userId).toBe(user.id);
      expect(found.type).toBe('user');
      expect(found.apiKey).not.toBe(result.apiKey);
      expect(found.apiKey).toMatch(/^\$2[aby]\$/);
    });

    test('creates a group API key when target has no email', async ({db}) => {
      const group = await groupFactory.create(db);
      const service = new ApiKeyService(db);
      const result = await service.create(group, {name: 'group-key'});
      expect(result.name).toBe('group-key');

      const [found] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, Number(result.id)));
      expect(found.groupId).toBe(group.id);
      expect(found.userId).toBeNull();
      expect(found.type).toBe('group');
    });
  });

  describe('count', () => {
    test('returns a number', async ({db}) => {
      const service = new ApiKeyService(db);
      const c = await service.count();
      expect(c).toBeTypeOf('number');
      expect(c).toBeGreaterThanOrEqual(0);
    });

    test('increments after creating a key', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `count-${Date.now()}@apikey-svc.test`,
      });
      const service = new ApiKeyService(db);
      const created = await service.create({id: user.id, email: user.email}, {name: 'counted'});
      const after = await service.count();
      expect(after).toBeGreaterThanOrEqual(1);
      const found = await service.findById(created.id);
      expect(found.name).toBe('counted');
    });
  });

  describe('findById', () => {
    test('returns an API key by id with user relation', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `find-${Date.now()}@apikey-svc.test`,
      });
      const service = new ApiKeyService(db);
      const created = await service.create(
        {id: user.id, email: user.email},
        {name: 'find-me'},
      );
      const found = await service.findById(created.id);
      expect(found.id).toBe(Number(created.id));
      expect(found.name).toBe('find-me');
      expect(found.user).toBeDefined();
      expect(found.user?.email).toBe(user.email);
    });

    test('throws NotFoundException for non-existent id', async ({db}) => {
      const service = new ApiKeyService(db);
      await expect(service.findById('999999')).rejects.toThrow(NotFoundException);
      await expect(service.findById('999999')).rejects.toThrow(
        'API key with given id not found',
      );
    });
  });

  describe('update', () => {
    test('updates the API key name and returns the updated key', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `update-${Date.now()}@apikey-svc.test`,
      });
      const service = new ApiKeyService(db);
      const created = await service.create(
        {id: user.id, email: user.email},
        {name: 'old-name'},
      );
      const updated = await service.update(created.id, {
        name: 'new-name',
        currentPassword: '',
      });
      expect(updated.name).toBe('new-name');
      expect(updated.id).toBe(String(Number(created.id)));
    });

    test('persists the name change in the database', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `upd-persist-${Date.now()}@apikey-svc.test`,
      });
      const service = new ApiKeyService(db);
      const created = await service.create(
        {id: user.id, email: user.email},
        {name: 'before-persist'},
      );
      await service.update(created.id, {
        name: 'after-persist',
        currentPassword: '',
      });
      const [found] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, Number(created.id)));
      expect(found.name).toBe('after-persist');
    });

    test('throws NotFoundException for non-existent id', async ({db}) => {
      const service = new ApiKeyService(db);
      await expect(
        service.update('999999', {name: 'x', currentPassword: ''}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    test('deletes the key and returns the deleted key data', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `remove-${Date.now()}@apikey-svc.test`,
      });
      const service = new ApiKeyService(db);
      const created = await service.create(
        {id: user.id, email: user.email},
        {name: 'remove-me'},
      );
      const removed = await service.remove(created.id);
      expect(removed.name).toBe('remove-me');

      const [gone] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, Number(created.id)));
      expect(gone).toBeUndefined();
    });

    test('throws NotFoundException for non-existent id', async ({db}) => {
      const service = new ApiKeyService(db);
      await expect(service.remove('999999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllForUser', () => {
    test('returns all keys for a specific user', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `foruser-${Date.now()}@apikey-svc.test`,
      });
      const service = new ApiKeyService(db);
      await service.create({id: user.id, email: user.email}, {name: 'key-1'});
      await service.create({id: user.id, email: user.email}, {name: 'key-2'});

      const keys = await service.findAllForUser({id: user.id});
      expect(keys).toHaveLength(2);
      expect(keys.map((k: {name: string}) => k.name).sort()).toEqual(['key-1', 'key-2']);
    });

    test('returns empty array when user has no keys', async ({db}) => {
      const user = await legacyUserFactory.create(db, {
        email: `nokeys-${Date.now()}@apikey-svc.test`,
      });
      const service = new ApiKeyService(db);
      const keys = await service.findAllForUser({id: user.id});
      expect(keys).toHaveLength(0);
    });
  });

  describe('findAllForGroup', () => {
    test('returns all keys for a specific group', async ({db}) => {
      const group = await groupFactory.create(db);
      const service = new ApiKeyService(db);
      await service.create(group, {name: 'grp-key-1'});
      await service.create(group, {name: 'grp-key-2'});

      const keys = await service.findAllForGroup({id: group.id});
      expect(keys).toHaveLength(2);
      expect(keys.map((k: {name: string}) => k.name).sort()).toEqual(['grp-key-1', 'grp-key-2']);
    });

    test('returns empty array when group has no keys', async ({db}) => {
      const group = await groupFactory.create(db);
      const service = new ApiKeyService(db);
      const keys = await service.findAllForGroup({id: group.id});
      expect(keys).toHaveLength(0);
    });
  });
});
