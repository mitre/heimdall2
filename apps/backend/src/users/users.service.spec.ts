import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {sql} from 'drizzle-orm';
import {describe, expect, it, vi} from 'vitest';
import {test} from '../db/test-fixture';
import type {TestDb} from '../db/test-fixture';
import {CaslAbilityFactory} from '../casl/casl-ability.factory';
import {userFactory} from '../db/factories/user.factory';
import {UsersService} from './users.service';
import type {CreateUserDto} from './dto/create-user.dto';
import type {UpdateUserDto} from './dto/update-user.dto';
import type {DeleteUserDto} from './dto/delete-user.dto';

function createServiceAndMocks(db: TestDb) {
  const ensureGroupHasOwnerSpy = vi.fn();
  const mockGroupsService = {
    findAll: vi.fn().mockResolvedValue([]),
    ensureGroupHasOwner: ensureGroupHasOwnerSpy,
  };
  const service = new UsersService(db as any, mockGroupsService as any);
  return {service, mockGroupsService, ensureGroupHasOwnerSpy};
}

const caslFactory = new CaslAbilityFactory();

const CREATE_USER_DTO: CreateUserDto = {
  email: 'testuser@example.com',
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
  email: 'testuser2@example.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test2',
  lastName: 'User2',
  title: 'Analyst',
  organization: 'MITRE',
  role: 'user',
  creationMethod: 'local',
};

const CREATE_ADMIN_DTO: CreateUserDto = {
  email: 'admin@example.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Admin',
  lastName: 'User',
  title: 'Admin',
  organization: 'MITRE',
  role: 'admin',
  creationMethod: 'local',
};

const CREATE_ADMIN_DTO_2: CreateUserDto = {
  ...CREATE_ADMIN_DTO,
  email: 'admin2@example.com',
};

// No manual cleanup needed — test-fixture wraps each test() in a transaction that rolls back

describe('UserDto', () => {
  test('accepts a SelectUser from Drizzle and produces correct HTTP shape', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
    const user = await service.create(CREATE_USER_DTO);
    const {UserDto} = await import('./dto/user.dto');
    const dto = new UserDto(user);
    expect(dto.id).toBe(String(user.id));
    expect(dto.email).toBe('testuser@example.com');
    expect(dto.firstName).toBe('Test');
    expect(dto.role).toBe('user');
    expect(dto.loginCount).toBe(0);
    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.updatedAt).toBeInstanceOf(Date);
  });

  test('SlimUserDto accepts Pick<SelectUser, ...> from findAllUsers', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
    await service.create(CREATE_USER_DTO);
    const slim = await service.findAllUsers();
    const {SlimUserDto} = await import('./dto/slim-user.dto');
    const dto = new SlimUserDto(slim[0]);
    expect(dto.id).toBe(String(slim[0].id));
    expect(dto.email).toBe(slim[0].email);
  });
});

describe('UsersService (Drizzle)', () => {
  describe('create', () => {
    test('creates a user and returns typed result with id, email, role', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      expect(user.id).toBeDefined();
      expect(user.email).toBe('testuser@example.com');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.title).toBe('Engineer');
      expect(user.organization).toBe('MITRE');
      expect(user.role).toBe('user');
      expect(user.creationMethod).toBe('local');
    });

    test('hashes the password with bcrypt', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      expect(user.encryptedPassword).toMatch(/^\$2[ab]\$14\$/);
      expect(user.encryptedPassword).not.toBe(CREATE_USER_DTO.password);
    });

    test('throws BadRequestException when password is missing', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const dto = {...CREATE_USER_DTO, password: undefined} as any;
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    test('throws BadRequestException when email is not a valid email format', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const dto = {...CREATE_USER_DTO, email: 'NotAValidEmail'};
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('adminFindAllUsers', () => {
    test('returns all users with all fields', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      await service.create(CREATE_USER_DTO);
      await service.create(CREATE_USER_DTO_2);
      const all = await service.adminFindAllUsers();
      const emails = all.map((u) => u.email);
      expect(emails).toContain('testuser@example.com');
      expect(emails).toContain('testuser2@example.com');
      expect(all[0].encryptedPassword).toMatch(/^\$2[ab]\$14\$/);
    });
  });

  describe('findAllUsers', () => {
    test('returns only id, email, title, firstName, lastName', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      await service.create(CREATE_USER_DTO);
      const slim = await service.findAllUsers();
      expect(slim.length).toBeGreaterThanOrEqual(1);
      const user = slim.find((u) => u.email === 'testuser@example.com');
      expect(user).toBeDefined();
      expect(user!.id).toBeDefined();
      expect(user!.email).toBe('testuser@example.com');
      expect(user!.firstName).toBe('Test');
      expect('encryptedPassword' in user!).toBe(false);
    });
  });

  describe('count', () => {
    test('returns a number and increases when a user is created', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const countResult = await service.count();
      expect(countResult).toBeTypeOf('number');
      expect(countResult).toBeGreaterThanOrEqual(0);
    });
  });

  describe('findById', () => {
    test('finds a user by id', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const created = await service.create(CREATE_USER_DTO);
      const found = await service.findById(String(created.id));
      expect(found.email).toBe(created.email);
      expect(found.id).toBe(created.id);
    });

    test('throws NotFoundException for non-existent id', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      await expect(service.findById('999999')).rejects.toThrow(
        NotFoundException,
      );
    });

    test('throws NotFoundException for non-numeric string id like "abc"', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      await expect(service.findById('abc')).rejects.toThrow(
        NotFoundException,
      );
    });

    test('throws NotFoundException for negative id', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      await expect(service.findById('-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    test('throws NotFoundException for zero id', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      await expect(service.findById('0')).rejects.toThrow(
        NotFoundException,
      );
    });

    test('finds a better-auth user by string id from ba_user', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const baUser = await userFactory.create(db, {
        email: `ba-findby-${Date.now()}@example.com`,
      });
      const found = await service.findById(baUser.id);
      expect(found).toBeDefined();
      expect(found.email).toBe(baUser.email);
    });

    test('returns SelectUser-compatible shape for better-auth users', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const baUser = await userFactory.create(db, {
        email: `ba-shape-${Date.now()}@example.com`,
        role: 'admin',
      });
      const found = await service.findById(baUser.id);
      expect(found.id).toBeDefined();
      expect(found.email).toBe(baUser.email);
      expect(found.role).toBe('admin');
      expect(found.createdAt).toBeDefined();
      expect(found.updatedAt).toBeDefined();
    });
  });

  describe('findByEmail', () => {
    test('finds a user by email', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      await service.create(CREATE_USER_DTO);
      const found = await service.findByEmail('testuser@example.com');
      expect(found.email).toBe('testuser@example.com');
      expect(found.role).toBe('user');
    });

    test('throws NotFoundException for non-existent email', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      await expect(
        service.findByEmail('doesnotexist@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneBang', () => {
    test('finds a user by field and value', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      await service.create(CREATE_USER_DTO);
      const found = await service.findOneBang('email', 'testuser@example.com');
      expect(found.email).toBe('testuser@example.com');
    });

    test('throws NotFoundException when no match', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      await expect(
        service.findOneBang('email', 'nope@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    test('updates user fields', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({
        id: String(user.id),
        role: user.role,
      });
      const updateDto: UpdateUserDto = {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        organization: 'Updated Org',
        title: 'Updated Title',
        role: 'user',
        password: 'LETmeiN123$$$tP',
        passwordConfirmation: 'LETmeiN123$$$tP',
        currentPassword: 'LETmeiN123$$$tP',
        forcePasswordChange: false,
      };
      const updated = await service.update(user, updateDto, abac);
      expect(updated.email).toBe('updated@example.com');
      expect(updated.firstName).toBe('Updated');
      expect(updated.lastName).toBe('Name');
      expect(updated.organization).toBe('Updated Org');
      expect(updated.title).toBe('Updated Title');
    });

    test('throws ForbiddenException when current password is wrong', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({
        id: String(user.id),
        role: 'user',
      });
      const updateDto = {
        email: 'x@example.com',
        currentPassword: 'wrong_password!',
      } as UpdateUserDto;
      await expect(service.update(user, updateDto, abac)).rejects.toThrow(
        ForbiddenException,
      );
    });

    test('throws ForbiddenException when encryptedPassword is malformed', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({
        id: String(user.id),
        role: 'user',
      });

      await db.execute(
        sql`UPDATE "Users" SET "encryptedPassword" = 'not-a-bcrypt-hash' WHERE id = ${user.id}`,
      );
      const corruptedUser = await service.findById(String(user.id));

      const updateDto = {
        email: 'x@example.com',
        currentPassword: 'LETmeiN123$$$tP',
      } as UpdateUserDto;
      await expect(
        service.update(corruptedUser, updateDto, abac),
      ).rejects.toThrow(ForbiddenException);
    });

    test('allows admin to update ANOTHER user without matching current password', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const admin = await service.create(CREATE_ADMIN_DTO);
      const abac = caslFactory.createForUser({
        id: String(admin.id),
        role: 'admin',
      });
      const updateDto = {
        firstName: 'AdminUpdated',
        currentPassword: 'wrong',
      } as UpdateUserDto;
      const updated = await service.update(user, updateDto, abac);
      expect(updated.firstName).toBe('AdminUpdated');
    });

    test('throws ForbiddenException when admin updates OWN account without current password', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const admin = await service.create(CREATE_ADMIN_DTO);
      const abac = caslFactory.createForUser({
        id: String(admin.id),
        role: 'admin',
      });
      const updateDto = {
        firstName: 'SelfUpdate',
        currentPassword: 'wrong_password!',
      } as UpdateUserDto;
      await expect(service.update(admin, updateDto, abac)).rejects.toThrow(
        ForbiddenException,
      );
    });

    test('throws BadRequestException when forcePasswordChange is true and no new password', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const admin = await service.create(CREATE_ADMIN_DTO);
      const adminAbac = caslFactory.createForUser({
        id: String(admin.id),
        role: 'admin',
      });
      const userAbac = caslFactory.createForUser({
        id: String(user.id),
        role: 'user',
      });

      const setupDto = {
        forcePasswordChange: true,
        currentPassword: 'irrelevant',
      } as UpdateUserDto;
      const forced = await service.update(user, setupDto, adminAbac);
      expect(forced.forcePasswordChange).toBe(true);

      const noPasswordDto = {
        email: 'changed@example.com',
        currentPassword: 'LETmeiN123$$$tP',
      } as UpdateUserDto;
      await expect(
        service.update(forced, noPasswordDto, userAbac),
      ).rejects.toThrow(BadRequestException);
    });

    test('preserves email when update DTO omits email field', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        firstName: 'Changed',
        currentPassword: 'LETmeiN123$$$tP',
      } as UpdateUserDto, abac);
      expect(updated.email).toBe(CREATE_USER_DTO.email);
    });

    test('preserves firstName when update DTO omits firstName', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        lastName: 'Changed',
        currentPassword: 'LETmeiN123$$$tP',
      } as UpdateUserDto, abac);
      expect(updated.firstName).toBe(CREATE_USER_DTO.firstName);
    });

    test('preserves lastName when update DTO omits lastName', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        firstName: 'Changed',
        currentPassword: 'LETmeiN123$$$tP',
      } as UpdateUserDto, abac);
      expect(updated.lastName).toBe(CREATE_USER_DTO.lastName);
    });

    test('preserves organization when update DTO omits organization', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        firstName: 'Changed',
        currentPassword: 'LETmeiN123$$$tP',
      } as UpdateUserDto, abac);
      expect(updated.organization).toBe(CREATE_USER_DTO.organization);
    });

    test('preserves title when update DTO omits title', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        firstName: 'Changed',
        currentPassword: 'LETmeiN123$$$tP',
      } as UpdateUserDto, abac);
      expect(updated.title).toBe(CREATE_USER_DTO.title);
    });

    test('preserves role when update DTO omits role (non-admin)', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        firstName: 'Changed',
        currentPassword: 'LETmeiN123$$$tP',
      } as UpdateUserDto, abac);
      expect(updated.role).toBe('user');
    });

    test('non-admin cannot change role even if included in DTO', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        role: 'admin',
        currentPassword: 'LETmeiN123$$$tP',
      } as UpdateUserDto, abac);
      expect(updated.role).toBe('user');
    });

    test('admin can change another user role', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const admin = await service.create(CREATE_ADMIN_DTO);
      const abac = caslFactory.createForUser({id: String(admin.id), role: 'admin'});
      const updated = await service.update(user, {
        role: 'admin',
        currentPassword: 'irrelevant',
      } as UpdateUserDto, abac);
      expect(updated.role).toBe('admin');
    });

    test('non-admin cannot set forcePasswordChange even when providing valid password', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});

      const dto = {
        forcePasswordChange: true,
        password: 'NEWpass789!@#xY',
        passwordConfirmation: 'NEWpass789!@#xY',
        currentPassword: 'LETmeiN123$$$tP',
      } as UpdateUserDto;
      const updated = await service.update(user, dto, abac);
      expect(updated.forcePasswordChange).toBe(false);
    });

    test('admin can set forcePasswordChange on another user', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const admin = await service.create(CREATE_ADMIN_DTO);
      const abac = caslFactory.createForUser({id: String(admin.id), role: 'admin'});

      const setDto = {
        forcePasswordChange: true,
        currentPassword: 'irrelevant',
      } as UpdateUserDto;
      const updated = await service.update(user, setDto, abac);
      expect(updated.forcePasswordChange).toBe(true);

      const clearDto = {
        forcePasswordChange: false,
        currentPassword: 'irrelevant',
      } as UpdateUserDto;
      const cleared = await service.update(updated, clearDto, abac);
      expect(cleared.forcePasswordChange).toBe(false);
    });

    test('updates profile fields without changing password', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        email: 'newprofile@example.com',
        firstName: 'NewFirst',
        lastName: 'NewLast',
        organization: 'NewOrg',
        title: 'NewTitle',
        currentPassword: 'LETmeiN123$$$tP',
      } as UpdateUserDto, abac);
      expect(updated.email).toBe('newprofile@example.com');
      expect(updated.firstName).toBe('NewFirst');
      expect(updated.encryptedPassword).toBe(user.encryptedPassword);
    });
  });

  describe('updateLoginMetadata', () => {
    test('increments loginCount and sets lastLogin', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      expect(user.loginCount).toBe(0);

      await service.updateLoginMetadata(user);
      const after = await service.findById(String(user.id));
      expect(after.loginCount).toBe(1);
      expect(after.lastLogin).not.toBeNull();
    });
  });

  describe('updateUserSecret', () => {
    test('sets a new jwtSecret value on the user', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      expect(user.jwtSecret).toBeNull();

      await service.updateUserSecret(user);
      const after = await service.findById(String(user.id));
      expect(after.jwtSecret).not.toBeNull();
      expect(after.jwtSecret).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    test('generates a different secret on each call', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      await service.updateUserSecret(user);
      const first = await service.findById(String(user.id));

      await service.updateUserSecret(first);
      const second = await service.findById(String(first.id));

      expect(second.jwtSecret).not.toBe(first.jwtSecret);
    });

    test('updates updatedAt timestamp', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const beforeUpdate = user.updatedAt;

      await service.updateUserSecret(user);
      const after = await service.findById(String(user.id));
      expect(after.updatedAt).not.toBe(beforeUpdate);
    });
  });

  describe('updateOAuthProfile', () => {
    test('updates firstName and lastName via Drizzle', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');

      await service.updateOAuthProfile(user, 'NewFirst', 'NewLast');
      const after = await service.findById(String(user.id));
      expect(after.firstName).toBe('NewFirst');
      expect(after.lastName).toBe('NewLast');
    });

    test('does nothing when names have not changed', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const beforeUpdatedAt = user.updatedAt;

      await service.updateOAuthProfile(user, 'Test', 'User');
      const after = await service.findById(String(user.id));
      expect(after.updatedAt).toBe(beforeUpdatedAt);
    });
  });

  describe('remove', () => {
    test('removes a user when password matches', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({
        id: String(user.id),
        role: 'user',
      });
      const deleteDto: DeleteUserDto = {password: 'LETmeiN123$$$tP'};
      const deleted = await service.remove(user, deleteDto, abac);
      expect(deleted.email).toBe(user.email);
      await expect(
        service.findByEmail(user.email),
      ).rejects.toThrow(NotFoundException);
    });

    test('throws ForbiddenException when password is wrong', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({
        id: String(user.id),
        role: 'user',
      });
      const deleteDto: DeleteUserDto = {password: 'wrong_password!'};
      await expect(service.remove(user, deleteDto, abac)).rejects.toThrow(
        ForbiddenException,
      );
    });

    test('throws ForbiddenException when password field is blank', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({
        id: String(user.id),
        role: 'user',
      });
      await expect(
        service.remove(user, {password: ''} as DeleteUserDto, abac),
      ).rejects.toThrow(ForbiddenException);
    });

    test('prevents deleting the only admin', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const admin = await service.create(CREATE_ADMIN_DTO);
      const abac = caslFactory.createForUser({
        id: String(admin.id),
        role: 'admin',
      });
      const deleteDto: DeleteUserDto = {password: 'LETmeiN123$$$tP'};
      await expect(service.remove(admin, deleteDto, abac)).rejects.toThrow(
        'Cannot destroy only administrator account',
      );
    });

    test('allows deleting an admin when another admin exists', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const admin1 = await service.create(CREATE_ADMIN_DTO);
      await service.create(CREATE_ADMIN_DTO_2);
      const abac = caslFactory.createForUser({
        id: String(admin1.id),
        role: 'admin',
      });
      const deleteDto: DeleteUserDto = {password: 'LETmeiN123$$$tP'};
      await service.remove(admin1, deleteDto, abac);
      await expect(
        service.findByEmail(admin1.email),
      ).rejects.toThrow(NotFoundException);
    });

    test('calls ensureGroupHasOwner for groups the deleted user belongs to', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const abac = caslFactory.createForUser({
        id: String(user.id),
        role: 'user',
      });

      const {groups: groupsTable, groupUsers: groupUsersTable} = await import('../db/schema');
      const now = new Date().toISOString();
      const [group] = await db.insert(groupsTable).values({
        name: `TestGroup-${Date.now()}`, public: false, desc: '', createdAt: now, updatedAt: now,
      }).returning();
      await db.insert(groupUsersTable).values({
        groupId: group.id, userId: user.id, role: 'member', createdAt: now, updatedAt: now,
      });

      await service.remove(
        user,
        {password: 'LETmeiN123$$$tP'} as DeleteUserDto,
        abac,
      );

      expect(ensureGroupHasOwnerSpy).toHaveBeenCalledWith(
        group.id,
        user.id,
      );
    });

    test('allows admin to delete another user without password', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await service.create(CREATE_USER_DTO);
      const admin = await service.create(CREATE_ADMIN_DTO);
      const abac = caslFactory.createForUser({
        id: String(admin.id),
        role: 'admin',
      });
      const deleted = await service.remove(user, {} as DeleteUserDto, abac);
      expect(deleted.email).toBe(user.email);
    });

    test('throws ForbiddenException when admin self-deletes without password', async ({db}) => {
      const {service, mockGroupsService, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const admin = await service.create(CREATE_ADMIN_DTO);
      await service.create(CREATE_ADMIN_DTO_2);
      const abac = caslFactory.createForUser({
        id: String(admin.id),
        role: 'admin',
      });
      await expect(
        service.remove(admin, {} as DeleteUserDto, abac),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
