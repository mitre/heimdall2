import {describe, expect, it} from 'vitest';
import {eq} from 'drizzle-orm';
import {hash} from 'bcryptjs';
import {ba_user} from '../db/auth-schema.generated';
import {users} from '../db/schema';
import {legacyUserFactory} from '../db/factories/legacy-user.factory';
import {userFactory} from '../db/factories/user.factory';
import {test} from '../db/test-fixture';
import type {TestDb} from '../db/test-fixture';
import {AuthnService} from './authn.service';

const STRONG_PASSWORD = 'L1veTe$t!Pass#wd';

function createService(db: TestDb): AuthnService {
  const mockAuthService = {api: {signInEmail: async () => null}};
  const mockApiKeyService = {};
  const mockConfigService = {
    get: (key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret-long-enough';
      if (key === 'JWT_EXPIRE_TIME') return '1d';
      return undefined;
    },
  };
  const mockUsersService = {
    findByEmail: async (email: string) => {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) throw new Error('User not found');
      return user;
    },
    updateLoginMetadata: async () => {},
    updateUserSecret: async () => {},
    findById: async (id: string) => {
      const numId = Number(id);
      if (!Number.isFinite(numId)) throw new Error('Not found');
      const [user] = await db.select().from(users).where(eq(users.id, numId));
      if (!user) throw new Error('Not found');
      return user;
    },
  };
  const mockJwtService = {
    sign: (payload: Record<string, unknown>) => `mock-jwt-${payload.sub}`,
  };

  return new AuthnService(
    db as any,
    mockAuthService as any,
    mockApiKeyService as any,
    mockConfigService as any,
    mockUsersService as any,
    mockJwtService as any,
  );
}

describe('AuthnService', () => {
  describe('validateUser', () => {
    test('authenticates a better-auth user from ba_user + ba_account', async ({db}) => {
      const service = createService(db);
      const baUser = await userFactory.create(db, {
        email: `ba-user-${Date.now()}@authn-svc.test`,
        password: STRONG_PASSWORD,
      });

      const result = await service.validateUser(baUser.email, STRONG_PASSWORD);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(baUser.id);
      expect(result!.email).toBe(baUser.email);
      expect(result!.role).toBeDefined();
    });

    test('authenticates a legacy user from Users table', async ({db}) => {
      const service = createService(db);
      const hashedPw = await hash(STRONG_PASSWORD, 10);
      const now = new Date().toISOString();
      const [legacyUser] = await db.insert(users).values({
        email: `legacy-${Date.now()}@authn-svc.test`,
        encryptedPassword: hashedPw,
        role: 'user',
        creationMethod: 'local',
        createdAt: now,
        updatedAt: now,
      }).returning();

      const result = await service.validateUser(legacyUser.email, STRONG_PASSWORD);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(String(legacyUser.id));
      expect(result!.email).toBe(legacyUser.email);
    });

    test('returns null for wrong password on ba_user', async ({db}) => {
      const service = createService(db);
      const email = `wrong-pw-${Date.now()}@authn-svc.test`;
      await userFactory.create(db, {email, password: STRONG_PASSWORD});

      const result = await service.validateUser(email, 'WrongP@ssw0rd!!!!');
      expect(result).toBeNull();
    });

    test('returns null for non-existent email', async ({db}) => {
      const service = createService(db);
      const result = await service.validateUser(
        `nonexistent-${Date.now()}@authn-svc.test`,
        STRONG_PASSWORD,
      );
      expect(result).toBeNull();
    });

    test('prefers ba_user over legacy Users when both exist', async ({db}) => {
      const service = createService(db);
      const email = `dual-${Date.now()}@authn-svc.test`;
      const baUser = await userFactory.create(db, {email, password: STRONG_PASSWORD});
      const hashedPw = await hash(STRONG_PASSWORD, 10);
      const now = new Date().toISOString();
      await db.insert(users).values({
        email,
        encryptedPassword: hashedPw,
        role: 'user',
        creationMethod: 'local',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.validateUser(email, STRONG_PASSWORD);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(baUser.id);
    });

    test('returns role from ba_user', async ({db}) => {
      const service = createService(db);
      const baUser = await userFactory.create(db, {
        email: `admin-${Date.now()}@authn-svc.test`,
        password: STRONG_PASSWORD,
        role: 'admin',
      });

      const result = await service.validateUser(baUser.email, STRONG_PASSWORD);
      expect(result).not.toBeNull();
      expect(result!.role).toBe('admin');
    });
  });

  describe('testPassword', () => {
    it('succeeds when password matches', async () => {
      const service = createService(null as any);
      const hashedPw = await hash('TestP@ss1234!!!!', 10);
      await expect(
        service.testPassword(
          {currentPassword: 'TestP@ss1234!!!!'},
          {encryptedPassword: hashedPw},
        ),
      ).resolves.toBeUndefined();
    });

    it('throws ForbiddenException when password is wrong', async () => {
      const service = createService(null as any);
      const hashedPw = await hash('TestP@ss1234!!!!', 10);
      await expect(
        service.testPassword(
          {currentPassword: 'WrongP@ss!!!!'},
          {encryptedPassword: hashedPw},
        ),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('throws ForbiddenException when password is empty', async () => {
      const service = createService(null as any);
      const hashedPw = await hash('TestP@ss1234!!!!', 10);
      await expect(
        service.testPassword(
          {currentPassword: ''},
          {encryptedPassword: hashedPw},
        ),
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('splitName', () => {
    it('splits "John Doe" into firstName and lastName', () => {
      const service = createService(null as any);
      expect(service.splitName('John Doe')).toEqual({
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('handles single name', () => {
      const service = createService(null as any);
      expect(service.splitName('John')).toEqual({
        firstName: 'John',
        lastName: '',
      });
    });

    it('handles multiple last names', () => {
      const service = createService(null as any);
      expect(service.splitName('John Van Der Berg')).toEqual({
        firstName: 'John',
        lastName: 'Van Der Berg',
      });
    });
  });

  describe('createBetterAuthSession', () => {
    test('returns null when authService.api.signInEmail fails', async ({db}) => {
      const service = createService(db);
      const result = await service.createBetterAuthSession('no@one.test', 'wrong');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    test('returns userID and accessToken for a better-auth user (non-numeric id)', async ({db}) => {
      const service = createService(db);
      const result = await service.login({
        id: 'abc123-string-id',
        email: 'test@login.test',
        role: 'user',
        forcePasswordChange: false,
      });
      expect(result.userID).toBe('abc123-string-id');
      expect(result.accessToken).toContain('mock-jwt');
    });

    test('returns userID and accessToken for a legacy user (numeric id)', async ({db}) => {
      const service = createService(db);
      const hashedPw = await hash(STRONG_PASSWORD, 10);
      const now = new Date().toISOString();
      const [legacyUser] = await db.insert(users).values({
        email: `login-legacy-${Date.now()}@authn-svc.test`,
        encryptedPassword: hashedPw,
        role: 'user',
        creationMethod: 'local',
        createdAt: now,
        updatedAt: now,
      }).returning();

      const result = await service.login({
        id: String(legacyUser.id),
        email: legacyUser.email,
        role: 'user',
        forcePasswordChange: false,
      });
      expect(result.userID).toBe(String(legacyUser.id));
      expect(result.accessToken).toBeDefined();
    });
  });
});
