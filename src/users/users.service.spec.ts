import { Test } from '@nestjs/testing';
import { DatabaseModule } from '../database/database.module';
import { UsersService } from './users.service';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import {
  TEST_USER,
  USER_ONE_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  DELETE_USER_DTO_TEST_OBJ,
  UPDATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_2,
  DELETE_FAILURE_USER_DTO_TEST_OBJ,
  UPDATE_FAILURE_USER_DTO_TEST_OBJ,
  UPDATE_USER_DTO_TEST_WITH_INVALID_EMAIL,
  DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD,
  CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD,
} from '../../test/test.constants';
import { DatabaseService } from '../database/database.service';

describe('UsersService', () => {
  let usersService: UsersService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [DatabaseModule, SequelizeModule.forFeature([User])],
      providers: [UsersService, DatabaseService]
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    databaseService = module.get<DatabaseService>(DatabaseService);

    jest.setTimeout(10000);
  });

  beforeEach(() => {
    return databaseService.cleanAll();
  });

  describe('exists', () => {
    it('throws an error when null', () => {
      expect(() => {
        usersService.exists(null)
      }).toThrow(NotFoundException);
    });

    it('returns true when given a User', () => {
      expect(() => {
        usersService.exists(TEST_USER)
      }).toBeTruthy();
    });
  });

  describe('Create', () => {
    it('should create a valid User', async () => {
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      expect(user.id).toBeDefined;
      expect(user.email).toEqual(USER_ONE_DTO.email);
      expect(user.firstName).toEqual(USER_ONE_DTO.firstName);
      expect(user.lastName).toEqual(USER_ONE_DTO.lastName);
      expect(user.title).toEqual(USER_ONE_DTO.title);
      expect(user.organization).toEqual(USER_ONE_DTO.organization);
      expect(user.updatedAt.valueOf()).not.toBe(USER_ONE_DTO.updatedAt.valueOf());
    });

    it('should throw an error when missing the email field', async () => {
      expect.assertions(1);
      await expect(usersService.create(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD)).rejects.toThrow('notNull Violation: User.email cannot be null');
    });

    it('should throw an error when email field is invalid', async () => {
      expect.assertions(1);
      await expect(usersService.create(CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD)).rejects.toThrow('Validation isEmail on email failed');
    });

    it('should throw an error when missing the password field', async () => {
      expect.assertions(1);
      await expect(usersService.create(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD)).rejects.toThrow(BadRequestException);
    });
  });

  describe('FindAll', () => {
    it('should find all users', async () => {
      const userOne = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const userTwo = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      const userDtoArray = await usersService.findAll();
      expect(userDtoArray).toContainEqual(userOne);
      expect(userDtoArray).toContainEqual(userTwo);
    });
  });

  describe('FindById', () => {
    it('should find users by id', async () => {
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const foundUser = await usersService.findById(user.id);
      expect(foundUser.email).toEqual(user.email);
      expect(foundUser.firstName).toEqual(user.firstName);
      expect(foundUser.lastName).toEqual(user.lastName);
      expect(foundUser.title).toEqual(user.title);
      expect(foundUser.organization).toEqual(user.organization);
      expect(foundUser.createdAt.valueOf()).toEqual(user.createdAt.valueOf());
      expect(foundUser.id).toEqual(user.id);
    });

    it('should throw an error if user does not exist', async () => {
      expect.assertions(1);
      await expect(usersService.findById(-1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('FindByEmail', () => {
    it('should find users by email', async () => {
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const foundUser = await usersService.findByEmail(user.email)
      expect(foundUser.email).toEqual(user.email);
      expect(foundUser.firstName).toEqual(user.firstName);
      expect(foundUser.lastName).toEqual(user.lastName);
      expect(foundUser.title).toEqual(user.title);
      expect(foundUser.organization).toEqual(user.organization);
      expect(foundUser.createdAt.valueOf()).toEqual(user.createdAt.valueOf());
      expect(foundUser.id).toEqual(user.id);
    });

    it('should throw an error if user does not exist', async () => {
      expect.assertions(1);
      await expect(usersService.findByEmail('doesnotexist@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Update', () => {
    // Tests the update function (Successful update)
    it('should update a user', async () => {
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const updatedUser = await usersService.update(user.id, UPDATE_USER_DTO_TEST_OBJ);

      expect(updatedUser.email).toEqual(UPDATE_USER_DTO_TEST_OBJ.email);
      expect(updatedUser.firstName).toEqual(UPDATE_USER_DTO_TEST_OBJ.firstName);
      expect(updatedUser.lastName).toEqual(UPDATE_USER_DTO_TEST_OBJ.lastName);
      expect(updatedUser.title).toEqual(UPDATE_USER_DTO_TEST_OBJ.title);
      expect(updatedUser.organization).toEqual(UPDATE_USER_DTO_TEST_OBJ.organization);

      expect(updatedUser.email).not.toEqual(user.email);
      expect(updatedUser.firstName).not.toEqual(user.firstName);
      expect(updatedUser.lastName).not.toEqual(user.lastName);
      expect(updatedUser.title).not.toEqual(user.title);
      expect(updatedUser.organization).not.toEqual(user.organization);
      expect(updatedUser.updatedAt.valueOf()).not.toEqual(user.updatedAt.valueOf());
    });

    it('should throw an error when the email is invalid', async () => {
      expect.assertions(1);
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      await expect(usersService.update(user.id, UPDATE_USER_DTO_TEST_WITH_INVALID_EMAIL)).rejects.toThrow('Validation error: Validation isEmail on email failed');
    });

    it('should throw an error when password fields do not match', async () => {
      expect.assertions(1);
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      await expect(usersService.update(user.id, UPDATE_FAILURE_USER_DTO_TEST_OBJ)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Remove', () => {
    it('should throw an error when user does not exist', async () => {
      expect.assertions(1);
      await expect(usersService.remove(1, DELETE_USER_DTO_TEST_OBJ)).rejects.toThrow(NotFoundException);
    });

    it('should throw an error when password fields do not match', async () => {
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      expect.assertions(1);
      await expect(usersService.remove(user.id, DELETE_FAILURE_USER_DTO_TEST_OBJ)).rejects.toThrow(UnauthorizedException);
    });

    // Tests the remove function with DeleteUserDto that has no password field
    it('should throw an error when password field is blank', async () => {
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      expect.assertions(1);
      await expect(usersService.remove(user.id, DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD)).rejects.toThrow(UnauthorizedException);
    });

    it('should remove created user', async () => {
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const removedUser = await usersService.remove(user.id, DELETE_USER_DTO_TEST_OBJ);
      expect.assertions(6);
      expect(removedUser.email).toEqual(user.email);
      expect(removedUser.firstName).toEqual(user.firstName);
      expect(removedUser.lastName).toEqual(user.lastName);
      expect(removedUser.organization).toEqual(user.organization);
      expect(removedUser.title).toEqual(user.title);
      await expect(usersService.findByEmail(user.email)).rejects.toThrow(NotFoundException);
    });
  });

  afterAll(async () => {
    await databaseService.closeConnection();
  });
});
