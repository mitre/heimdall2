import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {sql} from 'drizzle-orm';
import {describe, expect, vi} from 'vitest';
import {test} from '../db/test-fixture';
import type {TestDb} from '../db/test-fixture';
import {CaslAbilityFactory} from '../casl/casl-ability.factory';
import {
  groupFactory,
  groupMemberFactory,
  legacyUserFactory,
  userFactory,
} from '../db/factories';
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
  return {service, ensureGroupHasOwnerSpy};
}

const caslFactory = new CaslAbilityFactory();

const validPassword = 'LETmeiN123$$$tP';
const validPasswordHash =
  '$2b$10$JGjw5sQdDznQipbSNMKkteqPw4dg5KA0pL2P2PAle390e/uh/7wdy';

let emailCounter = 0;

function uniqueEmail(prefix: string): string {
  emailCounter += 1;
  return `${prefix}-${Date.now()}-${emailCounter}@users-service.test`;
}

function buildCreateUserDto(
  overrides: Partial<CreateUserDto> = {},
): CreateUserDto {
  return {
    email: uniqueEmail('create'),
    password: validPassword,
    passwordConfirmation: validPassword,
    firstName: 'Test',
    lastName: 'User',
    title: 'Engineer',
    organization: 'MITRE',
    role: 'user',
    creationMethod: 'local',
    ...overrides,
  };
}

type LegacyUserOverrides = NonNullable<
  Parameters<typeof legacyUserFactory.create>[1]
>;

async function createLegacyUser(
  db: TestDb,
  overrides: LegacyUserOverrides = {},
) {
  return legacyUserFactory.create(db, {
    email: uniqueEmail('legacy-user'),
    encryptedPassword: validPasswordHash,
    firstName: 'Test',
    lastName: 'User',
    title: 'Engineer',
    organization: 'MITRE',
    role: 'user',
    creationMethod: 'local',
    loginCount: 0,
    ...overrides,
  });
}

async function createLegacyAdmin(
  db: TestDb,
  overrides: LegacyUserOverrides = {},
) {
  return createLegacyUser(db, {
    email: uniqueEmail('legacy-admin'),
    firstName: 'Admin',
    lastName: 'User',
    title: 'Admin',
    role: 'admin',
    ...overrides,
  });
}

// No manual cleanup needed — test-fixture wraps each test() in a transaction that rolls back

describe('UserDto', () => {
  test('accepts a SelectUser from Drizzle and produces correct HTTP shape', async ({db}) => {
    const user = await createLegacyUser(db);
    const {UserDto} = await import('./dto/user.dto');
    const dto = new UserDto(user);
    expect(dto.id).toBe(String(user.id));
    expect(dto.email).toBe(user.email);
    expect(dto.firstName).toBe('Test');
    expect(dto.role).toBe('user');
    expect(dto.loginCount).toBe(0);
    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.updatedAt).toBeInstanceOf(Date);
  });

  test('SlimUserDto accepts Pick<SelectUser, ...> from findAllUsers', async ({db}) => {
    const {service} = createServiceAndMocks(db);
    const created = await createLegacyUser(db);
    const slim = await service.findAllUsers();
    const {SlimUserDto} = await import('./dto/slim-user.dto');
    const found = slim.find((user) => user.email === created.email);
    expect(found).toEqual({
      id: created.id,
      email: created.email,
      title: created.title,
      firstName: created.firstName,
      lastName: created.lastName,
    });
    const dto = new SlimUserDto(found!);
    expect(dto.id).toBe(String(created.id));
    expect(dto.email).toBe(created.email);
  });
});

describe('UsersService (Drizzle)', () => {
  describe('create', () => {
    test('creates a user and returns typed result with id, email, role', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const dto = buildCreateUserDto();
      const user = await service.create(dto);
      expect(Number.isInteger(user.id)).toBe(true);
      expect(user.email).toBe(dto.email);
      expect(user.firstName).toBe(dto.firstName);
      expect(user.lastName).toBe(dto.lastName);
      expect(user.title).toBe(dto.title);
      expect(user.organization).toBe(dto.organization);
      expect(user.role).toBe(dto.role);
      expect(user.creationMethod).toBe(dto.creationMethod);
    });

    test('hashes the password with bcrypt', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const dto = buildCreateUserDto();
      const user = await service.create(dto);
      expect(user.encryptedPassword).toMatch(/^\$2[ab]\$14\$/);
      expect(user.encryptedPassword).not.toBe(dto.password);
    });

    test('throws BadRequestException when password is missing', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const dto = buildCreateUserDto({password: undefined});
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    test('throws BadRequestException when email is not a valid email format', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const dto = buildCreateUserDto({email: 'NotAValidEmail'});
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('adminFindAllUsers', () => {
    test('returns all users with all fields', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const firstUser = await createLegacyUser(db);
      const secondUser = await createLegacyUser(db, {
        firstName: 'Test2',
        lastName: 'User2',
        title: 'Analyst',
      });
      const all = await service.adminFindAllUsers();
      const emails = all.map((u) => u.email);
      expect(emails).toContain(firstUser.email);
      expect(emails).toContain(secondUser.email);
      expect(
        all.find((user) => user.email === firstUser.email)?.encryptedPassword,
      ).toBe(validPasswordHash);
    });
  });

  describe('findAllUsers', () => {
    test('returns only id, email, title, firstName, lastName', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const created = await createLegacyUser(db);
      const slim = await service.findAllUsers();
      const user = slim.find((u) => u.email === created.email);
      expect(user).toEqual({
        id: created.id,
        email: created.email,
        title: created.title,
        firstName: created.firstName,
        lastName: created.lastName,
      });
      expect(user!.firstName).toBe('Test');
      expect('encryptedPassword' in user!).toBe(false);
    });
  });

  describe('count', () => {
    test('returns a number and increases when a user is created', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const before = await service.count();
      await createLegacyUser(db);
      const after = await service.count();
      expect(after).toBe(before + 1);
    });
  });

  describe('findById', () => {
    test('finds a user by id', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const created = await createLegacyUser(db);
      const found = await service.findById(String(created.id));
      expect(found.email).toBe(created.email);
      expect(found.id).toBe(created.id);
    });

    test('throws NotFoundException for non-existent id', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      await expect(service.findById('999999')).rejects.toThrow(
        NotFoundException,
      );
    });

    test('throws NotFoundException for non-numeric string id like "abc"', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      await expect(service.findById('abc')).rejects.toThrow(
        NotFoundException,
      );
    });

    test('throws NotFoundException for negative id', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      await expect(service.findById('-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    test('throws NotFoundException for zero id', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      await expect(service.findById('0')).rejects.toThrow(
        NotFoundException,
      );
    });

    test('finds a better-auth user by string id from ba_user', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const baUser = await userFactory.create(db, {
        email: uniqueEmail('ba-findby'),
      });
      const found = await service.findById(baUser.id);
      expect(found.id).toBe(0);
      expect(found.email).toBe(baUser.email);
    });

    test('returns SelectUser-compatible shape for better-auth users', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const baUser = await userFactory.create(db, {
        email: uniqueEmail('ba-shape'),
        role: 'admin',
      });
      const found = await service.findById(baUser.id);
      expect(found.id).toBe(0);
      expect(found.email).toBe(baUser.email);
      expect(found.role).toBe('admin');
      expect(found.createdAt).toBe(baUser.createdAt.toISOString());
      expect(found.updatedAt).toBe(baUser.updatedAt.toISOString());
    });
  });

  describe('findByEmail', () => {
    test('finds a user by email', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const created = await createLegacyUser(db);
      const found = await service.findByEmail(created.email);
      expect(found.email).toBe(created.email);
      expect(found.role).toBe('user');
    });

    test('throws NotFoundException for non-existent email', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      await expect(
        service.findByEmail('doesnotexist@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneBang', () => {
    test('finds a user by field and value', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const created = await createLegacyUser(db);
      const found = await service.findOneBang('email', created.email);
      expect(found.email).toBe(created.email);
    });

    test('throws NotFoundException when no match', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      await expect(
        service.findOneBang('email', 'nope@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    test('updates user fields', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({
        id: String(user.id),
        role: user.role,
      });
      const updateDto: UpdateUserDto = {
        email: uniqueEmail('updated'),
        firstName: 'Updated',
        lastName: 'Name',
        organization: 'Updated Org',
        title: 'Updated Title',
        role: 'user',
        password: validPassword,
        passwordConfirmation: validPassword,
        currentPassword: validPassword,
        forcePasswordChange: false,
      };
      const updated = await service.update(user, updateDto, abac);
      expect(updated.email).toBe(updateDto.email);
      expect(updated.firstName).toBe('Updated');
      expect(updated.lastName).toBe('Name');
      expect(updated.organization).toBe('Updated Org');
      expect(updated.title).toBe('Updated Title');
    });

    test('throws ForbiddenException when current password is wrong', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
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
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
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
        currentPassword: validPassword,
      } as UpdateUserDto;
      await expect(
        service.update(corruptedUser, updateDto, abac),
      ).rejects.toThrow(ForbiddenException);
    });

    test('allows admin to update ANOTHER user without matching current password', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const admin = await createLegacyAdmin(db);
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
      const {service} = createServiceAndMocks(db);
      const admin = await createLegacyAdmin(db);
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
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const admin = await createLegacyAdmin(db);
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
        email: uniqueEmail('changed'),
        currentPassword: validPassword,
      } as UpdateUserDto;
      await expect(
        service.update(forced, noPasswordDto, userAbac),
      ).rejects.toThrow(BadRequestException);
    });

    test('preserves email when update DTO omits email field', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        firstName: 'Changed',
        currentPassword: validPassword,
      } as UpdateUserDto, abac);
      expect(updated.email).toBe(user.email);
    });

    test('preserves firstName when update DTO omits firstName', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        lastName: 'Changed',
        currentPassword: validPassword,
      } as UpdateUserDto, abac);
      expect(updated.firstName).toBe(user.firstName);
    });

    test('preserves lastName when update DTO omits lastName', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        firstName: 'Changed',
        currentPassword: validPassword,
      } as UpdateUserDto, abac);
      expect(updated.lastName).toBe(user.lastName);
    });

    test('preserves organization when update DTO omits organization', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        firstName: 'Changed',
        currentPassword: validPassword,
      } as UpdateUserDto, abac);
      expect(updated.organization).toBe(user.organization);
    });

    test('preserves title when update DTO omits title', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        firstName: 'Changed',
        currentPassword: validPassword,
      } as UpdateUserDto, abac);
      expect(updated.title).toBe(user.title);
    });

    test('preserves role when update DTO omits role (non-admin)', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        firstName: 'Changed',
        currentPassword: validPassword,
      } as UpdateUserDto, abac);
      expect(updated.role).toBe('user');
    });

    test('non-admin cannot change role even if included in DTO', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const updated = await service.update(user, {
        role: 'admin',
        currentPassword: validPassword,
      } as UpdateUserDto, abac);
      expect(updated.role).toBe('user');
    });

    test('admin can change another user role', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const admin = await createLegacyAdmin(db);
      const abac = caslFactory.createForUser({id: String(admin.id), role: 'admin'});
      const updated = await service.update(user, {
        role: 'admin',
        currentPassword: 'irrelevant',
      } as UpdateUserDto, abac);
      expect(updated.role).toBe('admin');
    });

    test('non-admin cannot set forcePasswordChange even when providing valid password', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});

      const dto = {
        forcePasswordChange: true,
        password: 'NEWpass789!@#xY',
        passwordConfirmation: 'NEWpass789!@#xY',
        currentPassword: validPassword,
      } as UpdateUserDto;
      const updated = await service.update(user, dto, abac);
      expect(updated.forcePasswordChange).toBe(false);
    });

    test('admin can set forcePasswordChange on another user', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const admin = await createLegacyAdmin(db);
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
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({id: String(user.id), role: 'user'});
      const newEmail = uniqueEmail('newprofile');
      const updated = await service.update(user, {
        email: newEmail,
        firstName: 'NewFirst',
        lastName: 'NewLast',
        organization: 'NewOrg',
        title: 'NewTitle',
        currentPassword: validPassword,
      } as UpdateUserDto, abac);
      expect(updated.email).toBe(newEmail);
      expect(updated.firstName).toBe('NewFirst');
      expect(updated.encryptedPassword).toBe(user.encryptedPassword);
    });
  });

  describe('updateLoginMetadata', () => {
    test('increments loginCount and sets lastLogin', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      expect(user.loginCount).toBe(0);

      await service.updateLoginMetadata(user);
      const after = await service.findById(String(user.id));
      expect(after.loginCount).toBe(1);
      expect(after.lastLogin).not.toBeNull();
    });
  });

  describe('updateUserSecret', () => {
    test('sets a new jwtSecret value on the user', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      expect(user.jwtSecret).toBeNull();

      await service.updateUserSecret(user);
      const after = await service.findById(String(user.id));
      expect(after.jwtSecret).not.toBeNull();
      expect(after.jwtSecret).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    test('generates a different secret on each call', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      await service.updateUserSecret(user);
      const first = await service.findById(String(user.id));

      await service.updateUserSecret(first);
      const second = await service.findById(String(first.id));

      expect(second.jwtSecret).not.toBe(first.jwtSecret);
    });

    test('updates updatedAt timestamp', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db, {
        updatedAt: '2000-01-01T00:00:00.000Z',
      });
      const beforeUpdate = user.updatedAt;

      await service.updateUserSecret(user);
      const after = await service.findById(String(user.id));
      expect(after.updatedAt).not.toBe(beforeUpdate);
    });
  });

  describe('updateOAuthProfile', () => {
    test('updates firstName and lastName via Drizzle', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');

      await service.updateOAuthProfile(user, 'NewFirst', 'NewLast');
      const after = await service.findById(String(user.id));
      expect(after.firstName).toBe('NewFirst');
      expect(after.lastName).toBe('NewLast');
    });

    test('does nothing when names have not changed', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const beforeUpdatedAt = user.updatedAt;

      await service.updateOAuthProfile(user, 'Test', 'User');
      const after = await service.findById(String(user.id));
      expect(after.updatedAt).toBe(beforeUpdatedAt);
    });
  });

  describe('remove', () => {
    test('removes a user when password matches', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({
        id: String(user.id),
        role: 'user',
      });
      const deleteDto: DeleteUserDto = {password: validPassword};
      const deleted = await service.remove(user, deleteDto, abac);
      expect(deleted.email).toBe(user.email);
      await expect(
        service.findByEmail(user.email),
      ).rejects.toThrow(NotFoundException);
    });

    test('throws ForbiddenException when password is wrong', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
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
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({
        id: String(user.id),
        role: 'user',
      });
      await expect(
        service.remove(user, {password: ''} as DeleteUserDto, abac),
      ).rejects.toThrow(ForbiddenException);
    });

    test('prevents deleting the only admin', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const admin = await createLegacyAdmin(db);
      const abac = caslFactory.createForUser({
        id: String(admin.id),
        role: 'admin',
      });
      const deleteDto: DeleteUserDto = {password: validPassword};
      await expect(service.remove(admin, deleteDto, abac)).rejects.toThrow(
        'Cannot destroy only administrator account',
      );
    });

    test('allows deleting an admin when another admin exists', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const admin1 = await createLegacyAdmin(db);
      await createLegacyAdmin(db);
      const abac = caslFactory.createForUser({
        id: String(admin1.id),
        role: 'admin',
      });
      const deleteDto: DeleteUserDto = {password: validPassword};
      await service.remove(admin1, deleteDto, abac);
      await expect(
        service.findByEmail(admin1.email),
      ).rejects.toThrow(NotFoundException);
    });

    test('calls ensureGroupHasOwner for groups the deleted user belongs to', async ({db}) => {
      const {service, ensureGroupHasOwnerSpy} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const abac = caslFactory.createForUser({
        id: String(user.id),
        role: 'user',
      });

      const group = await groupFactory.create(db, {
        name: `owner-check-${Date.now()}-${user.id}`,
      });
      await groupMemberFactory.create(db, {
        groupId: group.id,
        userId: user.id,
        role: 'member',
      });

      await service.remove(
        user,
        {password: validPassword} as DeleteUserDto,
        abac,
      );

      expect(ensureGroupHasOwnerSpy).toHaveBeenCalledWith(
        group.id,
        user.id,
      );
    });

    test('allows admin to delete another user without password', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const user = await createLegacyUser(db);
      const admin = await createLegacyAdmin(db);
      const abac = caslFactory.createForUser({
        id: String(admin.id),
        role: 'admin',
      });
      const deleted = await service.remove(user, {} as DeleteUserDto, abac);
      expect(deleted.email).toBe(user.email);
    });

    test('throws ForbiddenException when admin self-deletes without password', async ({db}) => {
      const {service} = createServiceAndMocks(db);
      const admin = await createLegacyAdmin(db);
      await createLegacyAdmin(db);
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
