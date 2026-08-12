import type { Ability } from '@casl/ability';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { GROUPS_SERVICE_MOCK } from '../../test/constants/groups-test.constant';
import {
  CREATE_ADMIN_DTO,
  CREATE_SECOND_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_2,
  CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE,
  DELETE_FAILURE_USER_DTO_TEST_OBJ,
  DELETE_USER_DTO_TEST_OBJ,
  DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD,
  UPDATE_USER_DTO_SETUP_FORCE_PASSWORD_CHANGE,
  UPDATE_USER_DTO_TEST_OBJ,
  UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD,
  UPDATE_USER_DTO_TEST_WITH_INVALID_EMAIL,
  UPDATE_USER_DTO_TEST_WITHOUT_EMAIL,
  UPDATE_USER_DTO_TEST_WITHOUT_FIRST_NAME,
  UPDATE_USER_DTO_TEST_WITHOUT_FORCE_PASSWORD_CHANGE,
  UPDATE_USER_DTO_TEST_WITHOUT_LAST_NAME,
  UPDATE_USER_DTO_TEST_WITHOUT_ORGANIZATION,
  UPDATE_USER_DTO_TEST_WITHOUT_ROLE,
  UPDATE_USER_DTO_TEST_WITHOUT_TITLE,
  UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD,
  UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS,
  USER_ONE_DTO,
} from '../../test/constants/users-test.constant';
import { AuthzModule } from '../authz/authz.module';
import { AuthzService } from '../authz/authz.service';
import { ConfigService } from '../config/config.service';
import { CryptoModule } from '../crypto/crypto.module';
import type * as PasswordCrypto from '../crypto/password';
import { hashPassword, verifyPassword } from '../crypto/password';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { EvaluationTag } from '../evaluation-tags/evaluation-tag.model';
import { Evaluation } from '../evaluations/evaluation.model';
import { GroupEvaluation } from '../group-evaluations/group-evaluation.model';
import { GroupUser } from '../group-users/group-user.model';
import { Group } from '../groups/group.model';
import { GroupsService } from '../groups/groups.service';
import { SlimUserDto } from './dto/slim-user.dto';
import { UserDto } from './dto/user.dto';
import { User } from './user.model';
import { UsersService } from './users.service';

// Pass-through wrap so the FIPS-refuse test can steer ONE verifyPassword
// result (real host FIPS state cannot be entered in CI — §10 it is host-level;
// verifyPassword's own FIPS behavior is proven in password.spec.ts with an
// injected getFips). Every other call goes to the real implementation.
vi.mock('../crypto/password', async (importOriginal) => {
  const actual = await importOriginal<typeof PasswordCrypto>();
  return { ...actual, verifyPassword: vi.fn(actual.verifyPassword) };
});

// ADR-006 §2: exact prefix — algorithm AND iteration count pinned, never a
// loose $pbkdf2-sha* match (the ADR anti-pattern). Module scope so the regex
// is compiled once.
const PHC_SHA512_600K_PREFIX = /^\$pbkdf2-sha512\$i=600000\$/v;

describe('UsersService', () => {
  let authzService: AuthzService;
  let usersService: UsersService;
  let databaseService: DatabaseService;
  const errorString
    = 'User that was just created was not returned from the database. Create method may have failed silently.';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([
          User,
          GroupUser,
          Group,
          GroupEvaluation,
          Evaluation,
          EvaluationTag,
        ]),
        AuthzModule,
        CryptoModule,
      ],
      providers: [
        AuthzService,
        ConfigService,
        DatabaseService,
        UsersService,
        { provide: GroupsService, useValue: GROUPS_SERVICE_MOCK },
      ],
    }).compile();

    authzService = module.get<AuthzService>(AuthzService);
    usersService = module.get<UsersService>(UsersService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
  });

  describe('Create', () => {
    it('should create a valid User', async () => {
      expect.assertions(8);
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      expect(user.id).toBeDefined();
      expect(user.email).toEqual(USER_ONE_DTO.email);
      expect(user.firstName).toEqual(USER_ONE_DTO.firstName);
      expect(user.lastName).toEqual(USER_ONE_DTO.lastName);
      expect(user.title).toEqual(USER_ONE_DTO.title);
      expect(user.organization).toEqual(USER_ONE_DTO.organization);
      expect(user.updatedAt.valueOf()).not.toBe(
        USER_ONE_DTO.updatedAt.valueOf(),
      );
      expect(user.role).toEqual(USER_ONE_DTO.role);
    });

    it('stores encryptedPassword as a PBKDF2 PHC string that round-trips through verifyPassword (ADR-006 §4 site 1)', async () => {
      expect.assertions(3);
      const created = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const stored = await User.findByPk<User>(created.id);
      expect(stored?.encryptedPassword).toMatch(PHC_SHA512_600K_PREFIX);
      const result = await verifyPassword({
        hash: stored?.encryptedPassword ?? '',
        password: CREATE_USER_DTO_TEST_OBJ.password,
      });
      expect(result.valid).toBe(true);
      // A freshly written hash must already be at policy — no rehash debt.
      expect(result.needsRehash).toBe(false);
    });

    it('accepts the 64-char external-auth placeholder password (ADR-006 §6 — regression pairing with e25.11)', async () => {
      expect.assertions(1);
      // validateOrCreateUser feeds randomBytes(32).toString('hex') — exactly
      // 64 chars — through this path; it must clear the 128 cap.
      const placeholder = 'ab'.repeat(32);
      const created = await usersService.create({
        ...CREATE_USER_DTO_TEST_OBJ,
        password: placeholder,
        passwordConfirmation: placeholder,
      });
      const stored = await User.findByPk<User>(created.id);
      expect(stored?.encryptedPassword).toMatch(PHC_SHA512_600K_PREFIX);
    });

    it('rejects a password over the 128-char cap with BadRequestException (§6 approved range)', async () => {
      expect.assertions(1);
      const overCap = 'a'.repeat(129);
      await expect(
        usersService.create({
          ...CREATE_USER_DTO_TEST_OBJ,
          password: overCap,
          passwordConfirmation: overCap,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error when missing the email field', async () => {
      expect.assertions(1);
      await expect(
        usersService.create(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD),
      ).rejects.toThrow('notNull Violation: User.email cannot be null');
    });

    it('should throw an error when email field is invalid', async () => {
      expect.assertions(1);
      await expect(
        usersService.create(CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD),
      ).rejects.toThrow('Validation isEmail on email failed');
    });

    it('should throw an error when missing the password field', async () => {
      expect.assertions(1);
      await expect(
        usersService.create(
          CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error when missing the role field', async () => {
      expect.assertions(1);
      await expect(
        usersService.create(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE),
      ).rejects.toThrow('notNull Violation: User.role cannot be null');
    });
  });

  describe('adminFindAllUsers', () => {
    it('should find all users', async () => {
      expect.assertions(2);
      const userOne = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const userTwo = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      const userDtoArray = (await usersService.adminFindAllUsers()).map(
        user => new UserDto(user),
      );
      expect(userDtoArray).toContainEqual(new UserDto(userOne));
      expect(userDtoArray).toContainEqual(new UserDto(userTwo));
    });
  });

  describe('findAllUsers', () => {
    it('should find all users id, email, firstName, lastName only', async () => {
      expect.assertions(2);
      const userOne = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const userTwo = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      const slimUserDtoArray = (await usersService.findAllUsers()).map(
        user => new SlimUserDto(user),
      );
      expect(slimUserDtoArray).toContainEqual(new SlimUserDto(userOne));
      expect(slimUserDtoArray).toContainEqual(new SlimUserDto(userTwo));
    });
  });

  describe('FindById', () => {
    it('should find users by id', async () => {
      expect.assertions(8);
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const foundUser = await usersService.findById(user.id);
      expect(foundUser.email).toEqual(user.email);
      expect(foundUser.firstName).toEqual(user.firstName);
      expect(foundUser.lastName).toEqual(user.lastName);
      expect(foundUser.title).toEqual(user.title);
      expect(foundUser.organization).toEqual(user.organization);
      expect(foundUser.createdAt.valueOf()).toEqual(user.createdAt.valueOf());
      expect(foundUser.id).toEqual(user.id);
      expect(foundUser.role).toEqual(user.role);
    });

    it('should throw an error if user does not exist', async () => {
      expect.assertions(1);
      await expect(usersService.findById('-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('FindByEmail', () => {
    it('should find users by email', async () => {
      expect.assertions(6);
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const foundUser = await usersService.findByEmail(user.email);
      expect(foundUser.email).toEqual(CREATE_USER_DTO_TEST_OBJ.email);
      expect(foundUser.firstName).toEqual(CREATE_USER_DTO_TEST_OBJ.firstName);
      expect(foundUser.lastName).toEqual(CREATE_USER_DTO_TEST_OBJ.lastName);
      expect(foundUser.title).toEqual(CREATE_USER_DTO_TEST_OBJ.title);
      expect(foundUser.organization).toEqual(
        CREATE_USER_DTO_TEST_OBJ.organization,
      );
      expect(foundUser.role).toEqual(CREATE_USER_DTO_TEST_OBJ.role);
    });

    it('should throw an error if user does not exist', async () => {
      expect.assertions(1);
      await expect(
        usersService.findByEmail('doesnotexist@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Update', () => {
    let createUserDto: UserDto;
    let user: User;
    let abacPolicy: Ability;
    let adminAbacPolicy: Ability;
    let userCreatedAt: Date;

    beforeEach(async () => {
      createUserDto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const findUser = await User.findByPk<User>(createUserDto.id);
      const adminDto = await usersService.create(CREATE_ADMIN_DTO);
      const admin = await User.findByPk<User>(adminDto.id);

      if (findUser === null || admin === null) {
        throw new TypeError(errorString);
      }
      user = findUser;

      userCreatedAt = user.updatedAt;
      abacPolicy = authzService.abac.createForUser(user);
      adminAbacPolicy = authzService.abac.createForUser(admin);
    });

    // Tests the update function (Successful update)
    it('should update a user', async () => {
      expect.assertions(14);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_OBJ,
        abacPolicy,
      );

      expect(updatedUser.email).toEqual(UPDATE_USER_DTO_TEST_OBJ.email);
      expect(updatedUser.firstName).toEqual(UPDATE_USER_DTO_TEST_OBJ.firstName);
      expect(updatedUser.lastName).toEqual(UPDATE_USER_DTO_TEST_OBJ.lastName);
      expect(updatedUser.title).toEqual(UPDATE_USER_DTO_TEST_OBJ.title);
      expect(updatedUser.organization).toEqual(
        UPDATE_USER_DTO_TEST_OBJ.organization,
      );
      expect(updatedUser.role).toEqual(UPDATE_USER_DTO_TEST_OBJ.role);

      expect(updatedUser.email).not.toEqual(CREATE_USER_DTO_TEST_OBJ.email);
      expect(updatedUser.firstName).not.toEqual(
        CREATE_USER_DTO_TEST_OBJ.firstName,
      );
      expect(updatedUser.lastName).not.toEqual(
        CREATE_USER_DTO_TEST_OBJ.lastName,
      );
      expect(updatedUser.title).not.toEqual(CREATE_USER_DTO_TEST_OBJ.title);
      expect(updatedUser.organization).not.toEqual(
        CREATE_USER_DTO_TEST_OBJ.organization,
      );
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf(),
      );
      // This will not change currently because there is only a 'user' role that can be updated via API.
      expect(updatedUser.role).toEqual(user.role);
      expect(user.forcePasswordChange).toEqual(
        UPDATE_USER_DTO_TEST_OBJ.forcePasswordChange,
      );
    });

    it('stores a changed password as PBKDF2 PHC and preserves the lifecycle semantics (ADR-006 §4 site 2)', async () => {
      expect.assertions(5);
      // Seed force-change ON so the clear inside update()'s password branch
      // is observable — with the fixture's false baseline the assertion below
      // would pass even if the clear were deleted (AC-review round-1 finding).
      await user.update({ forcePasswordChange: true }, { silent: true });
      const preUpdate = await User.findByPk<User>(user.id);
      const pre = preUpdate?.passwordChangedAt;
      await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD,
        abacPolicy,
      );
      const stored = await User.findByPk<User>(user.id);
      expect(stored?.encryptedPassword).toMatch(PHC_SHA512_600K_PREFIX);
      const result = await verifyPassword({
        hash: stored?.encryptedPassword ?? '',
        password: UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.password ?? '',
      });
      expect(result.valid).toBe(true);
      expect(result.needsRehash).toBe(false);
      // Genuine password change (users.service.ts:84-104 unchanged): the
      // lifecycle fields still move — passwordChangedAt is stamped, and
      // forcePasswordChange clears when the DTO does not re-raise it.
      expect(String(stored?.passwordChangedAt)).not.toBe(String(pre));
      expect(stored?.forcePasswordChange).toBe(false);
    });

    it('rejects a changed password over the 128-char cap with BadRequestException (§6 approved range)', async () => {
      expect.assertions(1);
      const overCap = 'a'.repeat(129);
      await expect(
        usersService.update(
          user,
          {
            ...UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD,
            password: overCap,
            passwordConfirmation: overCap,
          },
          abacPolicy,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    // Users should be able to update their account without updating their email
    it('should update a user without updating email', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_EMAIL,
        abacPolicy,
      );

      expect(updatedUser.email).toEqual(CREATE_USER_DTO_TEST_OBJ.email);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf(),
      );
    });

    // Users should be able to update their account without updating their first name
    it('should update a user without updating firstName', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_FIRST_NAME,
        abacPolicy,
      );

      expect(updatedUser.firstName).toEqual(user.firstName);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf(),
      );
    });

    // Users should be able to update their account without updating their last name
    it('should update a user without updating lastName', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_LAST_NAME,
        abacPolicy,
      );

      expect(updatedUser.lastName).toEqual(user.lastName);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf(),
      );
    });

    // Users should be able to update their account without updating their organization
    it('should update a user without updating organization', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_ORGANIZATION,
        abacPolicy,
      );

      expect(updatedUser.organization).toEqual(user.organization);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf(),
      );
    });

    // Users should be able to update their account without updating their title
    it('should update a user without updating title', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_TITLE,
        abacPolicy,
      );

      expect(updatedUser.title).toEqual(user.title);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf(),
      );
    });

    // If role is not provided, then the users role should stay the same
    it('should update a user without updating role', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_ROLE,
        abacPolicy,
      );

      expect(updatedUser.role).toEqual(user.role);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf(),
      );
    });

    // Changing user information should not require the user to change their password
    it('should update a user without updating forcePasswordChange', async () => {
      expect.assertions(2);
      const updateUserDto = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_FORCE_PASSWORD_CHANGE,
        abacPolicy,
      );
      const updateUser = await usersService.findByPkBang(updateUserDto.id);

      expect(updateUserDto.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf(),
      );
      expect(updateUser.forcePasswordChange).toEqual(user.forcePasswordChange);
    });

    it('should update a user without updating password', async () => {
      expect.assertions(8);
      const { encryptedPassword } = user;

      await usersService.update(
        user,
        UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS,
        abacPolicy,
      );

      expect(user.email).toEqual(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.email);
      expect(user.firstName).toEqual(
        UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.firstName,
      );
      expect(user.lastName).toEqual(
        UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.lastName,
      );
      expect(user.organization).toEqual(
        UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.organization,
      );
      expect(user.title).toEqual(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.title);
      expect(user.role).toEqual(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.role);
      expect(user.encryptedPassword).toEqual(encryptedPassword);
      expect(user.updatedAt.valueOf()).not.toEqual(userCreatedAt.valueOf());
    });

    it('should update a user without matching password when admin', async () => {
      expect.assertions(2);
      const { encryptedPassword } = user;

      const updateUser = await usersService.update(
        user,
        UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD,
        adminAbacPolicy,
      );

      expect(user.encryptedPassword).not.toEqual(encryptedPassword);

      expect(updateUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf(),
      );
    });

    it('should throw an error when the password is invalid', async () => {
      expect.assertions(1);
      await expect(
        usersService.update(
          user,
          UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD,
          abacPolicy,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw an error when the email is invalid', async () => {
      expect.assertions(1);
      await expect(
        usersService.update(
          user,
          UPDATE_USER_DTO_TEST_WITH_INVALID_EMAIL,
          abacPolicy,
        ),
      ).rejects.toThrow('Validation error: Validation isEmail on email failed');
    });

    it('should throw an error when password is not updated and forcePasswordChange is true', async () => {
      expect.assertions(1);
      await usersService.update(
        user,
        UPDATE_USER_DTO_SETUP_FORCE_PASSWORD_CHANGE,
        abacPolicy,
      );
      await expect(
        usersService.update(
          user,
          UPDATE_USER_DTO_TEST_WITHOUT_FORCE_PASSWORD_CHANGE,
          abacPolicy,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    describe('UpdateLoginMetadata', () => {
      it('should update user lastLogin and loginCount', async () => {
        expect.assertions(2);
        const { lastLogin } = user;

        await usersService.updateLoginMetadata(user);

        expect(user.loginCount).toBe(1);
        expect(user.lastLogin).not.toBe(lastLogin);
      });
    });
  });

  describe('Remove', () => {
    let user: User;
    let adminUser: User;
    let abacPolicy: Ability;
    let adminAbacPolicy: Ability;

    beforeEach(async () => {
      const userDto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const userResponse = await User.findByPk<User>(userDto.id);
      const adminDto = await usersService.create(CREATE_ADMIN_DTO);
      const adminResponse = await User.findByPk<User>(adminDto.id);

      if (userResponse === null || adminResponse === null) {
        throw new TypeError(errorString);
      }
      user = userResponse;
      adminUser = adminResponse;

      abacPolicy = authzService.abac.createForUser(user);
      adminAbacPolicy = authzService.abac.createForUser(adminResponse);
    });

    it('should throw an error when password fields do not match', async () => {
      expect.assertions(1);
      await expect(
        usersService.remove(user, DELETE_FAILURE_USER_DTO_TEST_OBJ, abacPolicy),
      ).rejects.toThrow(ForbiddenException);
    });

    // Tests the remove function with DeleteUserDto that has no password field
    it('should throw an error when password field is blank', async () => {
      expect.assertions(1);
      await expect(
        usersService.remove(
          user,
          DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD,
          abacPolicy,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('succeeds when the supplied password matches a PBKDF2-stored hash (site 3)', async () => {
      // Overwrite the bcrypt hash create() wrote (site 1 — e25.12's card) with
      // a PBKDF2 hash of the same password. remove() must verify it via the
      // pure verifyPassword; bcryptjs.compare returns false on a PHC string.
      // DeleteUserDto.password is optional; '' makes hashPassword throw, so a
      // fixture that ever loses its password fails this test loudly.
      await user.update({
        encryptedPassword: await hashPassword(
          DELETE_USER_DTO_TEST_OBJ.password ?? '',
        ),
      });
      const removedUser = await usersService.remove(
        user,
        DELETE_USER_DTO_TEST_OBJ,
        abacPolicy,
      );
      expect(removedUser.email).toEqual(user.email);
      await expect(usersService.findByEmail(user.email)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refuses deletion when verifyPassword returns the FIPS-refuse result (site 3 consumes .valid only)', async () => {
      // Steer one result to the §3 refuse shape. remove() must read .valid
      // alone — a refused bcrypt credential blocks deletion exactly like a
      // wrong password. Clear first so the invocation assertion below cannot
      // be satisfied by a prior test's call on the shared module mock.
      vi.mocked(verifyPassword).mockClear();
      vi.mocked(verifyPassword).mockResolvedValueOnce({
        needsRehash: false,
        requiresReset: true,
        valid: false,
      });
      await expect(
        usersService.remove(user, DELETE_USER_DTO_TEST_OBJ, abacPolicy),
      ).rejects.toThrow(ForbiddenException);
      expect(verifyPassword).toHaveBeenCalled();
    });

    it('should remove created user', async () => {
      const removedUser = await usersService.remove(
        user,
        DELETE_USER_DTO_TEST_OBJ,
        abacPolicy,
      );
      expect.assertions(7);
      expect(removedUser.email).toEqual(user.email);
      expect(removedUser.firstName).toEqual(user.firstName);
      expect(removedUser.lastName).toEqual(user.lastName);
      expect(removedUser.organization).toEqual(user.organization);
      expect(removedUser.title).toEqual(user.title);
      expect(removedUser.role).toEqual(user.role);
      await expect(usersService.findByEmail(user.email)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete a user without matching password when admin', async () => {
      const removedUser = await usersService.remove(
        user,
        DELETE_USER_DTO_TEST_OBJ,
        adminAbacPolicy,
      );
      expect.assertions(7);
      expect(removedUser.email).toEqual(user.email);
      expect(removedUser.firstName).toEqual(user.firstName);
      expect(removedUser.lastName).toEqual(user.lastName);
      expect(removedUser.organization).toEqual(user.organization);
      expect(removedUser.title).toEqual(user.title);
      expect(removedUser.role).toEqual(user.role);
      await expect(usersService.findByEmail(user.email)).rejects.toThrow(
        NotFoundException,
      );
    });

    // Admins should be able to remove their account if there is another administrator
    it('should test remove function with admin user and there is another admin', async () => {
      expect.assertions(1);
      // Create a second user so we can delete the first
      await usersService.create(CREATE_SECOND_ADMIN_DTO);
      // Delete the existing user
      await usersService.remove(
        adminUser,
        DELETE_USER_DTO_TEST_OBJ,
        adminAbacPolicy,
      );
      // Make sure the existing admin has been deleted
      await expect(usersService.findById(adminUser.id)).rejects.toThrow(NotFoundException);
    });

    // Admins should not be able to remove their account if they are the only administrator
    it('should test remove function with admin user that is the only admin', async () => {
      expect.assertions(1);

      await expect(usersService.remove(
        adminUser,
        DELETE_USER_DTO_TEST_OBJ,
        adminAbacPolicy,
      )).rejects.toThrow(ForbiddenException);
    });

    // Admins should be able to remove other users without their password
    it('should test remove function with admin user and a dto that has no password', async () => {
      expect(
        new UserDto(await usersService.remove(user, {}, adminAbacPolicy)),
      ).toEqual(new UserDto(user));
    });
  });

  // ADR-006 §7: narrow compare-and-swap writer for lazy rehash. Touches
  // encryptedPassword ONLY, gated on the stored hash still matching, silent so
  // updatedAt is not bumped. Takes a userId (not a User instance) so it cannot
  // leak the new hash into the un-awaited updateLoginMetadata save (AC6 by
  // construction).
  describe('updateEncryptedPassword (§7 compare-and-swap)', () => {
    let user: User;
    const ORIGINAL = '$pbkdf2-sha512$i=600000$origOrigOrigOrigOrig$origKeyOrig';
    const NEW = '$pbkdf2-sha512$i=600000$newnewnewnewnewnew$newKeyNewKey';

    beforeEach(async () => {
      const dto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const created = await User.findByPk<User>(dto.id);
      if (created === null) {
        throw new TypeError(errorString);
      }
      user = created;
      // Seed a known stored hash directly (bypassing hashing — this card is
      // persistence only). silent so the baseline updatedAt is stable.
      await user.update({ encryptedPassword: ORIGINAL }, { silent: true });
    });

    it('returns 0 and writes nothing when the stored hash no longer matches originalHash', async () => {
      // The CAS-loses-the-race case (§7's damage scenario) — comes first.
      const affected = await usersService.updateEncryptedPassword(
        user.id,
        'a-stale-hash-that-does-not-match',
        NEW,
      );
      expect(affected).toBe(0);
      const reloaded = await User.findByPk<User>(user.id);
      expect(reloaded?.encryptedPassword).toBe(ORIGINAL);
    });

    it('returns 1 and swaps encryptedPassword when originalHash matches', async () => {
      const affected = await usersService.updateEncryptedPassword(
        user.id,
        ORIGINAL,
        NEW,
      );
      expect(affected).toBe(1);
      const reloaded = await User.findByPk<User>(user.id);
      expect(reloaded?.encryptedPassword).toBe(NEW);
    });

    it('does NOT bump updatedAt on a winning write (silent: true)', async () => {
      const before = await User.findByPk<User>(user.id);
      const beforeUpdatedAt = before?.updatedAt?.getTime();
      await usersService.updateEncryptedPassword(user.id, ORIGINAL, NEW);
      const after = await User.findByPk<User>(user.id);
      expect(after?.updatedAt?.getTime()).toBe(beforeUpdatedAt);
    });

    it('does NOT touch passwordChangedAt or forcePasswordChange', async () => {
      const before = await User.findByPk<User>(user.id);
      // Type-agnostic capture (§7 wrinkle: column may be STRING or DATE).
      const beforePwChanged = String(before?.passwordChangedAt);
      const beforeForce = before?.forcePasswordChange;
      await usersService.updateEncryptedPassword(user.id, ORIGINAL, NEW);
      const after = await User.findByPk<User>(user.id);
      expect(String(after?.passwordChangedAt)).toBe(beforePwChanged);
      expect(after?.forcePasswordChange).toBe(beforeForce);
    });
  });
});
