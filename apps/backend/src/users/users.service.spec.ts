import {Ability} from '@casl/ability';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test} from '@nestjs/testing';
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
  UPDATE_USER_DTO_TEST_WITHOUT_EMAIL,
  UPDATE_USER_DTO_TEST_WITHOUT_FIRST_NAME,
  UPDATE_USER_DTO_TEST_WITHOUT_FORCE_PASSWORD_CHANGE,
  UPDATE_USER_DTO_TEST_WITHOUT_LAST_NAME,
  UPDATE_USER_DTO_TEST_WITHOUT_ORGANIZATION,
  UPDATE_USER_DTO_TEST_WITHOUT_ROLE,
  UPDATE_USER_DTO_TEST_WITHOUT_TITLE,
  UPDATE_USER_DTO_TEST_WITH_INVALID_EMAIL,
  UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS,
  UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD,
  USER_ONE_DTO
} from '../../test/constants/users-test.constant';
import {AuthzModule} from '../authz/authz.module';
import {AuthzService} from '../authz/authz.service';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Evaluation} from '../evaluations/evaluation.model';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';
import {SlimUserDto} from './dto/slim-user.dto';
import {UserDto} from './dto/user.dto';
import {User} from './user.model';
import {UsersService} from './users.service';

describe('UsersService', () => {
  let authzService: AuthzService;
  let usersService: UsersService;
  let databaseService: DatabaseService;
  const errorString =
    'User that was just created was not returned from the database. Create method may have failed silently.';

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
          EvaluationTag
        ]),
        AuthzModule
      ],
      providers: [UsersService, DatabaseService, AuthzService]
    }).compile();

    authzService = module.get<AuthzService>(AuthzService);
    usersService = module.get<UsersService>(UsersService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  beforeEach(() => {
    return databaseService.cleanAll();
  });

  afterAll((done) => {
    databaseService.closeConnection();
    done();
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
        USER_ONE_DTO.updatedAt.valueOf()
      );
      expect(user.role).toEqual(USER_ONE_DTO.role);
    });

    it('should throw an error when missing the email field', async () => {
      expect.assertions(1);
      await expect(
        usersService.create(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD)
      ).rejects.toThrow('notNull Violation: User.email cannot be null');
    });

    it('should throw an error when email field is invalid', async () => {
      expect.assertions(1);
      await expect(
        usersService.create(CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD)
      ).rejects.toThrow('Validation isEmail on email failed');
    });

    it('should throw an error when missing the password field', async () => {
      expect.assertions(1);
      await expect(
        usersService.create(
          CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error when missing the role field', async () => {
      expect.assertions(1);
      await expect(
        usersService.create(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE)
      ).rejects.toThrow('notNull Violation: User.role cannot be null');
    });
  });

  describe('AdminFindAll', () => {
    it('should find all users', async () => {
      expect.assertions(2);
      const userOne = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const userTwo = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      const userDtoArray = (await usersService.adminFindAll()).map(
        (user) => new UserDto(user)
      );
      expect(userDtoArray).toContainEqual(new UserDto(userOne));
      expect(userDtoArray).toContainEqual(new UserDto(userTwo));
    });
  });

  describe('UserFindAll', () => {
    it('should find all users id, email, firstName, lastName only', async () => {
      expect.assertions(2);
      const userOne = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const userTwo = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      const slimUserDtoArray = (await usersService.userFindAll()).map(
        (user) => new SlimUserDto(user)
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
        NotFoundException
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
        CREATE_USER_DTO_TEST_OBJ.organization
      );
      expect(foundUser.role).toEqual(CREATE_USER_DTO_TEST_OBJ.role);
    });

    it('should throw an error if user does not exist', async () => {
      expect.assertions(1);
      await expect(
        usersService.findByEmail('doesnotexist@example.com')
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
      } else {
        user = findUser;
      }

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
        abacPolicy
      );

      expect(updatedUser.email).toEqual(UPDATE_USER_DTO_TEST_OBJ.email);
      expect(updatedUser.firstName).toEqual(UPDATE_USER_DTO_TEST_OBJ.firstName);
      expect(updatedUser.lastName).toEqual(UPDATE_USER_DTO_TEST_OBJ.lastName);
      expect(updatedUser.title).toEqual(UPDATE_USER_DTO_TEST_OBJ.title);
      expect(updatedUser.organization).toEqual(
        UPDATE_USER_DTO_TEST_OBJ.organization
      );
      expect(updatedUser.role).toEqual(UPDATE_USER_DTO_TEST_OBJ.role);

      expect(updatedUser.email).not.toEqual(CREATE_USER_DTO_TEST_OBJ.email);
      expect(updatedUser.firstName).not.toEqual(
        CREATE_USER_DTO_TEST_OBJ.firstName
      );
      expect(updatedUser.lastName).not.toEqual(
        CREATE_USER_DTO_TEST_OBJ.lastName
      );
      expect(updatedUser.title).not.toEqual(CREATE_USER_DTO_TEST_OBJ.title);
      expect(updatedUser.organization).not.toEqual(
        CREATE_USER_DTO_TEST_OBJ.organization
      );
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf()
      );
      // This will not change currently because there is only a 'user' role that can be updated via API.
      expect(updatedUser.role).toEqual(user.role);
      expect(user.forcePasswordChange).toEqual(
        UPDATE_USER_DTO_TEST_OBJ.forcePasswordChange
      );
    });

    // Users should be able to update their account without updating their email
    it('should update a user without updating email', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_EMAIL,
        abacPolicy
      );

      expect(updatedUser.email).toEqual(CREATE_USER_DTO_TEST_OBJ.email);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf()
      );
    });

    // Users should be able to update their account without updating their first name
    it('should update a user without updating firstName', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_FIRST_NAME,
        abacPolicy
      );

      expect(updatedUser.firstName).toEqual(user.firstName);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf()
      );
    });

    // Users should be able to update their account without updating their last name
    it('should update a user without updating lastName', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_LAST_NAME,
        abacPolicy
      );

      expect(updatedUser.lastName).toEqual(user.lastName);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf()
      );
    });

    // Users should be able to update their account without updating their organization
    it('should update a user without updating organization', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_ORGANIZATION,
        abacPolicy
      );

      expect(updatedUser.organization).toEqual(user.organization);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf()
      );
    });

    // Users should be able to update their account without updating their title
    it('should update a user without updating title', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_TITLE,
        abacPolicy
      );

      expect(updatedUser.title).toEqual(user.title);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf()
      );
    });

    // If role is not provided, then the users role should stay the same
    it('should update a user without updating role', async () => {
      expect.assertions(2);
      const updatedUser = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_ROLE,
        abacPolicy
      );

      expect(updatedUser.role).toEqual(user.role);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf()
      );
    });

    // Changing user information should not require the user to change their password
    it('should update a user without updating forcePasswordChange', async () => {
      expect.assertions(2);
      const updateUserDto = await usersService.update(
        user,
        UPDATE_USER_DTO_TEST_WITHOUT_FORCE_PASSWORD_CHANGE,
        abacPolicy
      );
      const updateUser = await usersService.findByPkBang(updateUserDto.id);

      expect(updateUserDto.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf()
      );
      expect(updateUser.forcePasswordChange).toEqual(user.forcePasswordChange);
    });

    it('should update a user without updating password', async () => {
      expect.assertions(8);
      const {encryptedPassword} = user;

      await usersService.update(
        user,
        UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS,
        abacPolicy
      );

      expect(user.email).toEqual(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.email);
      expect(user.firstName).toEqual(
        UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.firstName
      );
      expect(user.lastName).toEqual(
        UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.lastName
      );
      expect(user.organization).toEqual(
        UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.organization
      );
      expect(user.title).toEqual(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.title);
      expect(user.role).toEqual(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.role);
      expect(user.encryptedPassword).toEqual(encryptedPassword);
      expect(user.updatedAt.valueOf()).not.toEqual(userCreatedAt.valueOf());
    });

    it('should update a user without matching password when admin', async () => {
      expect.assertions(2);
      const {encryptedPassword} = user;

      const updateUser = await usersService.update(
        user,
        UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD,
        adminAbacPolicy
      );

      expect(user.encryptedPassword).not.toEqual(encryptedPassword);

      expect(updateUser.updatedAt.valueOf()).not.toEqual(
        userCreatedAt.valueOf()
      );
    });

    it('should throw an error when the password is invalid', async () => {
      expect.assertions(1);
      await expect(
        usersService.update(
          user,
          UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD,
          abacPolicy
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw an error when the email is invalid', async () => {
      expect.assertions(1);
      await expect(
        usersService.update(
          user,
          UPDATE_USER_DTO_TEST_WITH_INVALID_EMAIL,
          abacPolicy
        )
      ).rejects.toThrow('Validation error: Validation isEmail on email failed');
    });

    it('should throw an error when password is not updated and forcePasswordChange is true', async () => {
      expect.assertions(1);
      await usersService.update(
        user,
        UPDATE_USER_DTO_SETUP_FORCE_PASSWORD_CHANGE,
        abacPolicy
      );
      await expect(
        usersService.update(
          user,
          UPDATE_USER_DTO_TEST_WITHOUT_FORCE_PASSWORD_CHANGE,
          abacPolicy
        )
      ).rejects.toThrow(BadRequestException);
    });

    describe('UpdateLoginMetadata', () => {
      it('should update user lastLogin and loginCount', async () => {
        expect.assertions(2);
        const {lastLogin} = user;

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
      } else {
        user = userResponse;
        adminUser = adminResponse;
      }

      abacPolicy = authzService.abac.createForUser(user);
      adminAbacPolicy = authzService.abac.createForUser(adminResponse);
    });

    it('should throw an error when password fields do not match', async () => {
      expect.assertions(1);
      await expect(
        usersService.remove(user, DELETE_FAILURE_USER_DTO_TEST_OBJ, abacPolicy)
      ).rejects.toThrow(ForbiddenException);
    });

    // Tests the remove function with DeleteUserDto that has no password field
    it('should throw an error when password field is blank', async () => {
      expect.assertions(1);
      await expect(
        usersService.remove(
          user,
          DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD,
          abacPolicy
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('should remove created user', async () => {
      const removedUser = await usersService.remove(
        user,
        DELETE_USER_DTO_TEST_OBJ,
        abacPolicy
      );
      expect.assertions(7);
      expect(removedUser.email).toEqual(user.email);
      expect(removedUser.firstName).toEqual(user.firstName);
      expect(removedUser.lastName).toEqual(user.lastName);
      expect(removedUser.organization).toEqual(user.organization);
      expect(removedUser.title).toEqual(user.title);
      expect(removedUser.role).toEqual(user.role);
      await expect(usersService.findByEmail(user.email)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should delete a user without matching password when admin', async () => {
      const removedUser = await usersService.remove(
        user,
        DELETE_USER_DTO_TEST_OBJ,
        adminAbacPolicy
      );
      expect.assertions(7);
      expect(removedUser.email).toEqual(user.email);
      expect(removedUser.firstName).toEqual(user.firstName);
      expect(removedUser.lastName).toEqual(user.lastName);
      expect(removedUser.organization).toEqual(user.organization);
      expect(removedUser.title).toEqual(user.title);
      expect(removedUser.role).toEqual(user.role);
      await expect(usersService.findByEmail(user.email)).rejects.toThrow(
        NotFoundException
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
        adminAbacPolicy
      );
      // Make sure the existing admin has been deleted
      await expect(async () => {
        await usersService.findById(adminUser.id);
      }).rejects.toThrow(NotFoundException);
    });

    // Admins should not be able to remove their account if they are the only administrator
    it('should test remove function with admin user that is the only admin', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersService.remove(
          adminUser,
          DELETE_USER_DTO_TEST_OBJ,
          adminAbacPolicy
        );
      }).rejects.toThrow(ForbiddenException);
    });

    // Admins should be able to remove other users without their password
    it('should test remove function with admin user and a dto that has no password', async () => {
      expect(
        new UserDto(await usersService.remove(user, {}, adminAbacPolicy))
      ).toEqual(new UserDto(user));
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
