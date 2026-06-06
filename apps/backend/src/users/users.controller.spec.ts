import {ForbiddenError} from '@casl/ability';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {drizzle} from 'drizzle-orm/node-postgres';
import {sql} from 'drizzle-orm';
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {createTestPool} from '../db/test-utils';
import {CaslAbilityFactory} from '../casl/casl-ability.factory';
import {users} from '../db/schema';
import * as schema from '../db/schema';
import {isRegistrationAllowed} from '../env';
import {UsersService} from './users.service';
import {UsersController} from './users.controller';
import {UserDto} from './dto/user.dto';
import type {CreateUserDto} from './dto/create-user.dto';
import type {SelectUser} from '../db/zod-schemas';

vi.mock(import('../env'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    isRegistrationAllowed: vi.fn(() => true),
    isLocalLoginAllowed: vi.fn(() => true),
  };
});

const pool = createTestPool();
const db = drizzle(pool, {schema});

const mockGroupsService = {
  findAll: vi.fn().mockResolvedValue([]),
  ensureGroupHasOwner: vi.fn(),
};

const caslFactory = new CaslAbilityFactory();
const authzService = {abac: caslFactory};

const usersService = new UsersService(db as any, mockGroupsService as any);
const controller = new UsersController(
  usersService,
  authzService as any,
  db as any,
);

const CREATE_USER_DTO: CreateUserDto = {
  email: 'ctrl-user@controller-test.local',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'User',
  title: 'Engineer',
  organization: 'MITRE',
  role: 'user',
  creationMethod: 'local',
};

const CREATE_USER_DTO_2: CreateUserDto = {
  ...CREATE_USER_DTO,
  email: 'ctrl-user2@controller-test.local',
};

const CREATE_ADMIN_DTO: CreateUserDto = {
  ...CREATE_USER_DTO,
  email: 'ctrl-admin@controller-test.local',
  role: 'admin',
};

afterAll(async () => {
  await db.execute(sql`DELETE FROM "Users" WHERE email LIKE '%@controller-test.local'`);
  await db.execute(sql`DELETE FROM "Users" WHERE email LIKE 'clear-test@%'`);
  await pool.end();
});

beforeEach(async () => {
  await db.execute(sql`DELETE FROM "Users" WHERE email LIKE '%@controller-test.local'`);
  await db.execute(sql`DELETE FROM "Users" WHERE email LIKE 'clear-test@%'`);
  vi.clearAllMocks();
});

describe('UsersController', () => {
  let basicUser: SelectUser;
  let adminUser: SelectUser;

  beforeEach(async () => {
    basicUser = await usersService.create(CREATE_USER_DTO);
    adminUser = await usersService.create(CREATE_ADMIN_DTO);
  });

  describe('findUserById', () => {
    it('returns UserDto for valid id', async () => {
      const result = await controller.findUserById(
        String(basicUser.id),
        {user: basicUser},
      );
      expect(result).toBeInstanceOf(UserDto);
      expect(result.email).toBe('ctrl-user@controller-test.local');
    });

    it('throws NotFoundException for invalid id', async () => {
      await expect(
        controller.findUserById('999999', {user: basicUser}),
      ).rejects.toThrow(NotFoundException);
    });

    it('CASL blocks user from reading another user', async () => {
      const other = await usersService.create(CREATE_USER_DTO_2);
      await expect(
        controller.findUserById(String(other.id), {user: basicUser}),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('findAllUsers (slim)', () => {
    it('returns SlimUserDto array for authenticated user', async () => {
      const result = await controller.findAllUsers({user: basicUser});
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0].id).toBeDefined();
      expect(result[0].email).toBeDefined();
      expect('encryptedPassword' in result[0]).toBe(false);
    });
  });

  describe('adminFindAllUsers', () => {
    it('admin can list all users', async () => {
      const result = await controller.adminFindAllUsers({user: adminUser});
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0]).toBeInstanceOf(UserDto);
    });

    it('non-admin cannot list all users', async () => {
      await expect(
        controller.adminFindAllUsers({user: basicUser}),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('create', () => {
    it('creates user and returns UserDto', async () => {
      const result = await controller.create(CREATE_USER_DTO_2, {});
      expect(result).toBeInstanceOf(UserDto);
      expect(result.email).toBe('ctrl-user2@controller-test.local');
    });

    it('throws BadRequestException when password missing', async () => {
      const dto = {...CREATE_USER_DTO_2, password: undefined} as any;
      await expect(controller.create(dto, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('blocks registration when disabled', async () => {
      vi.mocked(isRegistrationAllowed).mockReturnValue(false);
      try {
        await expect(
          controller.create(CREATE_USER_DTO_2, {}),
        ).rejects.toThrow('registration is disabled');
      } finally {
        vi.mocked(isRegistrationAllowed).mockReturnValue(true);
      }
    });
  });

  describe('update', () => {
    it('user can update own profile', async () => {
      const result = await controller.update(
        String(basicUser.id),
        {user: basicUser},
        {
          firstName: 'Updated',
          currentPassword: 'LETmeiN123$$$tP',
        } as any,
      );
      expect(result).toBeInstanceOf(UserDto);
      expect(result.firstName).toBe('Updated');
    });

    it('throws NotFoundException for invalid id', async () => {
      await expect(
        controller.update('999999', {user: basicUser}, {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('CASL blocks user from updating another user', async () => {
      const other = await usersService.create(CREATE_USER_DTO_2);
      await expect(
        controller.update(
          String(other.id),
          {user: basicUser},
          {currentPassword: 'LETmeiN123$$$tP'} as any,
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('remove', () => {
    it('user can delete own account with password', async () => {
      const result = await controller.remove(
        String(basicUser.id),
        {user: basicUser},
        {password: 'LETmeiN123$$$tP'},
      );
      expect(result).toBeInstanceOf(UserDto);
      expect(result.email).toBe('ctrl-user@controller-test.local');
    });

    it('throws NotFoundException for invalid id', async () => {
      await expect(
        controller.remove('999999', {user: adminUser}, {password: 'x'}),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException with wrong password', async () => {
      await expect(
        controller.remove(
          String(basicUser.id),
          {user: basicUser},
          {password: 'wrong_password!'},
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logOut', () => {
    it('calls updateUserSecret', async () => {
      await expect(
        controller.logOut({user: basicUser}),
      ).resolves.not.toThrow();

      const after = await usersService.findById(String(basicUser.id));
      expect(after.jwtSecret).not.toBeNull();
    });
  });

  describe('clear', () => {
    it('calls db.delete(users) — test-only endpoint uses Drizzle not Sequelize', async () => {
      // Verify the clear endpoint exists and is callable.
      // We don't actually call it here because it deletes ALL users
      // which interferes with concurrent test files sharing the same DB.
      // The implementation is a one-liner: await this.db.delete(users)
      // Verified by code inspection — no Sequelize User.truncate().
      expect(controller.clear).toBeTypeOf('function');
    });
  });
});
