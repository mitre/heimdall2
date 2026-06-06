import {describe, expect, vi} from 'vitest';
import {BadRequestException} from '@nestjs/common';
import {eq} from 'drizzle-orm';
import {apiKeys} from '../db/schema';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {groupFactory} from '../db/factories/group.factory';

vi.stubEnv('API_KEY_SECRET', 'test-api-key-secret-for-jwt-signing-32chars!');

const {ApiKeyService} = await import('./apikey.service');
const {test} = await import('../db/test-fixture');

describe('ApiKeyService security hardening', () => {
  describe('API_KEY_SECRET validation', () => {
    test('service create checks for API_KEY_SECRET and throws BadRequestException if empty', async ({db}) => {
      const service = new ApiKeyService(db);
      const user = await legacyUserFactory.create(db, {
        email: `nosecret-${Date.now()}@security.test`,
      });

      const origValue = (await import('../env')).default.API_KEY_SECRET;
      const envModule = await import('../env');
      const savedSecret = envModule.default.API_KEY_SECRET;
      envModule.default.API_KEY_SECRET = undefined;

      try {
        await expect(
          service.create({id: user.id, email: user.email}, {name: 'should-fail'}),
        ).rejects.toThrow('API_KEY_SECRET is not configured');
      } finally {
        envModule.default.API_KEY_SECRET = savedSecret;
      }
    });
  });

  describe('API key JWT expiry', () => {
    test('created API key JWT contains an exp claim', async ({db}) => {
      const service = new ApiKeyService(db);
      const user = await legacyUserFactory.create(db, {
        email: `expiry-${Date.now()}@security.test`,
      });
      const result = await service.create(
        {id: user.id, email: user.email},
        {name: 'expiry-test'},
      );
      const [, payloadB64] = result.apiKey.split('.');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeTypeOf('number');
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('API key create atomicity', () => {
    test('API key row has non-empty hashed apiKey after create', async ({db}) => {
      const service = new ApiKeyService(db);
      const user = await legacyUserFactory.create(db, {
        email: `atomic-${Date.now()}@security.test`,
      });
      const result = await service.create(
        {id: user.id, email: user.email},
        {name: 'atomic-test'},
      );
      const [row] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, Number(result.id)));
      expect(row.apiKey).not.toBe('');
      expect(row.apiKey).toMatch(/^\$2[aby]\$/);
    });
  });
});

describe('Group role validation', () => {
  test('addUserToGroupSchema rejects invalid role values', async () => {
    const {addUserToGroupSchema} = await import(
      '../groups/dto/add-user-to-group.schema'
    );
    const valid = addUserToGroupSchema.safeParse({userId: '1', groupRole: 'member'});
    expect(valid.success).toBe(true);

    const validOwner = addUserToGroupSchema.safeParse({userId: '1', groupRole: 'owner'});
    expect(validOwner.success).toBe(true);

    const invalid = addUserToGroupSchema.safeParse({userId: '1', groupRole: 'superadmin'});
    expect(invalid.success).toBe(false);

    const empty = addUserToGroupSchema.safeParse({userId: '1', groupRole: ''});
    expect(empty.success).toBe(false);
  });

  test('updateGroupUserRoleSchema rejects invalid role values', async () => {
    const {updateGroupUserRoleSchema} = await import(
      '../groups/dto/update-group-user.schema'
    );
    const valid = updateGroupUserRoleSchema.safeParse({userId: '1', groupRole: 'owner'});
    expect(valid.success).toBe(true);

    const invalid = updateGroupUserRoleSchema.safeParse({userId: '1', groupRole: 'admin'});
    expect(invalid.success).toBe(false);
  });
});
