import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  INestApplication,
  NotFoundException
} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test, TestingModule} from '@nestjs/testing';
import {ValidationError} from 'sequelize';
import {
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_2,
  CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE,
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS,
  DELETE_USER_DTO_TEST_OBJ,
  DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD,
  ID,
  MINUTE_IN_MILLISECONDS,
  UPDATE_USER_DTO_TEST_OBJ,
  UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD
} from '../../test/constants/users-test.constant';
import {register} from '../../test/helpers/users.helper';
import {AuthzService} from '../authz/authz.service';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {UserDto} from './dto/user.dto';
import {User} from './user.model';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';

// Test suite for the UsersController
describe('UsersController Unit Tests', () => {
  let app: INestApplication;
  let usersController: UsersController;
  let usersService: UsersService;
  let module: TestingModule;
  let databaseService: DatabaseService;

  let basicUser: User;
  let adminUser: User;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [UsersController],
      imports: [DatabaseModule, SequelizeModule.forFeature([User])],
      providers: [AuthzService, DatabaseService, UsersService]
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersController = module.get<UsersController>(UsersController);
    databaseService = module.get<DatabaseService>(DatabaseService);

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();

    const adminDto = await usersService.create(CREATE_ADMIN_DTO);
    adminUser = await usersService.findByPkBang(adminDto.id);
  });

  describe('FindbyId function', () => {
    // Tests the findById function with valid ID (basic positive test)
    it('should test findById with valid ID', async () => {
      expect.assertions(1);

      const userDto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      basicUser = await usersService.findByPkBang(userDto.id);

      expect(
        await usersController.findById(basicUser.id, {user: basicUser})
      ).toEqual(new UserDto(await usersService.findById(basicUser.id)));
    });

    // Tests the findById function with ID that is 'not found'
    it('should test findById with invalid ID', async () => {
      expect.assertions(1);

      const userDto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      basicUser = await usersService.findByPkBang(userDto.id);

      await expect(async () => {
        await usersController.findById(ID, {user: basicUser});
      }).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll function', () => {
    // Tests the findAll function with valid ID (basic positive test)
    it('should list all users', async () => {
      expect.assertions(1);

      expect(await usersController.findAll({user: adminUser})).toEqual(
        await usersService.findAll()
      );
    });
  });

  describe('Create function', () => {
    // Tests the create function with valid dto (basic positive test)
    it('should test the create function with valid dto', async () => {
      expect.assertions(9);

      const createdUser = await usersController.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      // User should have been created within the last minute
      const timeSinceCreation =
        new Date().getTime() - new Date(createdUser.createdAt).getTime();
      expect(timeSinceCreation).toBeLessThanOrEqual(MINUTE_IN_MILLISECONDS);
      // Actual user fields should match the created user
      expect(createdUser.email).toEqual(CREATE_USER_DTO_TEST_OBJ_2.email);
      expect(createdUser.firstName).toEqual(
        CREATE_USER_DTO_TEST_OBJ_2.firstName
      );
      expect(createdUser.id).toBeDefined();
      expect(createdUser.lastName).toEqual(CREATE_USER_DTO_TEST_OBJ_2.lastName);
      expect(createdUser.loginCount).toEqual(0);
      expect(createdUser.organization).toEqual(
        CREATE_USER_DTO_TEST_OBJ_2.organization
      );
      expect(createdUser.role).toEqual(CREATE_USER_DTO_TEST_OBJ_2.role);
      expect(createdUser.title).toEqual(CREATE_USER_DTO_TEST_OBJ_2.title);
    });

    it('should test the create function with invalid email field', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersController.create(
          CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD
        );
      }).rejects.toThrow(ValidationError);
    });

    it('should test the create function with already existing email', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersController.create(CREATE_USER_DTO_TEST_OBJ);
      }).rejects.toThrow(ValidationError);
    });

    // Tests the create function with dto that is missing email
    it('should test the create function with missing email field', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersController.create(
          CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD
        );
      }).rejects.toThrow(ValidationError);
    });

    // Tests the create function with dto that is missing password
    it('should test the create function with missing password field', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersController.create(
          CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD
        );
      }).rejects.toThrow(BadRequestException);
    });

    // Tests the create function with dto that is missing passwordConfirmation
    it('should test the create function with missing password confirmation field', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersController.create(
          CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD
        );
      }).rejects.toThrow(ValidationError);
    });

    it('should test the create function with mis-matching passwords', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersController.create(
          CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
        );
      }).rejects.toThrow(ValidationError);
    });

    it('should test the create function with a password that does not meet the complexity requirements', async () => {
      await register(app, CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD)
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body.message).toEqual(
            'Password does not meet complexity requirements. Passwords are a minimum of 15 characters in length. Passwords ' +
              'must contain at least one special character, number, upper-case letter, and lower-case letter. Passwords cannot contain more than three consecutive repeating ' +
              'characters. Passwords cannot contain more than four repeating characters from the same character class.'
          );
          expect(response.body.error).toEqual('Bad Request');
        });
    });

    it('should test the create function with no provided role', async () => {
      expect(async () => {
        await usersController.create(
          CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE
        );
      }).rejects.toThrowError('notNull Violation: User.role cannot be null');
    });
  });

  describe('Update function', () => {
    // Tests the update function with valid dto (basic positive test)
    it('should test the update function with a valid update dto', async () => {
      expect.assertions(1);

      const userDto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      basicUser = await usersService.findByPkBang(userDto.id);

      expect(
        await usersController.update(
          basicUser.id,
          {user: basicUser},
          UPDATE_USER_DTO_TEST_OBJ
        )
      ).toEqual(new UserDto(await usersService.findById(basicUser.id)));
    });

    // Tests the update function with ID that is 'not found'
    it('should test update function with invalid ID', async () => {
      expect.assertions(1);

      const userDto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      basicUser = await usersService.findByPkBang(userDto.id);

      await expect(async () => {
        await usersController.update(
          ID,
          {user: basicUser},
          UPDATE_USER_DTO_TEST_OBJ
        );
      }).rejects.toThrow(NotFoundException);
    });

    // Tests the update function with dto that is missing currentPassword
    it('should test the update function with a dto that is missing currentPassword field', async () => {
      expect.assertions(1);

      const userDto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      basicUser = await usersService.findByPkBang(userDto.id);

      await expect(async () => {
        await usersController.update(
          basicUser.id,
          {user: basicUser},
          UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD
        );
      }).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Remove function', () => {
    // Tests the remove function with valid dto (basic positive test)
    it('should remove', async () => {
      expect.assertions(1);

      const userDto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      basicUser = await usersService.findByPkBang(userDto.id);

      expect(
        await usersController.remove(
          basicUser.id,
          {user: basicUser},
          DELETE_USER_DTO_TEST_OBJ
        )
      ).toEqual(new UserDto(basicUser));
    });

    // Tests the remove function with ID that is 'not found'
    it('should test remove function with invalid ID', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersController.remove(
          ID,
          {user: adminUser},
          DELETE_USER_DTO_TEST_OBJ
        );
      }).rejects.toThrow(NotFoundException);
    });

    // Tests the remove function with dto that is missing password
    it('should test remove function with a dto that is missing password field', async () => {
      expect.assertions(1);

      const userDto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      basicUser = await usersService.findByPkBang(userDto.id);

      await expect(async () => {
        await usersController.remove(
          basicUser.id,
          {user: basicUser},
          DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD
        );
      }).rejects.toThrow(ForbiddenException);
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
