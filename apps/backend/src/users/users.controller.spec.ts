import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test, TestingModule} from '@nestjs/testing';
import mock from 'mock-fs';
import {ValidationError} from 'sequelize';
import {REGISTRATION_DISABLED} from '../../test/constants/env-test.constant';
import {
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_2,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD,
  DELETE_USER_DTO_TEST_OBJ,
  DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD,
  ID,
  UPDATE_USER_DTO_TEST_OBJ,
  UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD
} from '../../test/constants/users-test.constant';
import {AuthzService} from '../authz/authz.service';
import {ConfigModule} from '../config/config.module';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Evaluation} from '../evaluations/evaluation.model';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';
import {UserDto} from './dto/user.dto';
import {User} from './user.model';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';

// Test suite for the UsersController
describe('UsersController Unit Tests', () => {
  let usersController: UsersController;
  let usersService: UsersService;
  let module: TestingModule;
  let databaseService: DatabaseService;

  let basicUser: User;
  let adminUser: User;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [UsersController],
      imports: [
        ConfigModule,
        DatabaseModule,
        SequelizeModule.forFeature([
          User,
          GroupUser,
          Group,
          GroupEvaluation,
          Evaluation,
          EvaluationTag
        ])
      ],
      providers: [AuthzService, DatabaseService, UsersService]
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersController = module.get<UsersController>(UsersController);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    const userDto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
    basicUser = await usersService.findByPkBang(userDto.id);
    const adminDto = await usersService.create(CREATE_ADMIN_DTO);
    adminUser = await usersService.findByPkBang(adminDto.id);
  });

  describe('FindbyId function', () => {
    // Tests the findById function with valid ID (basic positive test)
    it('should test findById with valid ID', async () => {
      expect.assertions(1);

      expect(
        await usersController.findById(basicUser.id, {user: basicUser})
      ).toEqual(new UserDto(await usersService.findById(basicUser.id)));
    });

    // Tests the findById function with ID that is 'not found'
    it('should test findById with invalid ID', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersController.findById(ID, {user: basicUser});
      }).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll function', () => {
    // Tests the findAll function with valid ID (basic positive test)
    it('should list all users for an admin', async () => {
      expect.assertions(1);
      const serviceFoundUsers = (await usersService.adminFindAll()).map(
        (user) => new UserDto(user)
      );
      const controllerFoundUsers = await usersController.adminFindAll({
        user: adminUser
      });
      // In the case of admin, they should be equal becuase admin can see all
      expect(controllerFoundUsers).toEqual(serviceFoundUsers);
    });
  });

  describe('Create function with registration enabled', () => {
    // Tests the create function with valid dto (basic positive test)
    it('should test the create function with valid dto', async () => {
      expect.assertions(1);

      const createdUser = await usersController.create(
        CREATE_USER_DTO_TEST_OBJ_2,
        {}
      );
      expect(createdUser).toEqual(
        new UserDto(await usersService.findById(createdUser.id))
      );
    });

    // Tests the create function with dto that is missing email
    it('should test the create function with missing email field', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersController.create(
          CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD,
          {}
        );
      }).rejects.toThrow(ValidationError);
    });

    // Tests the create function with dto that is missing password
    it('should test the create function with missing password field', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersController.create(
          CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD,
          {}
        );
      }).rejects.toThrow(BadRequestException);
    });

    // Tests the create function with dto that is missing passwordConfirmation
    it('should test the create function with missing password confirmation field', async () => {
      expect.assertions(1);

      await expect(async () => {
        await usersController.create(
          CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD,
          {}
        );
      }).rejects.toThrow(ValidationError);
    });
  });

  describe('Create function with registration disabled', () => {
    beforeAll(() => {
      mock({
        '.env': REGISTRATION_DISABLED
      });
    });

    it('should test the create function with valid dto', async () => {
      expect.assertions(1);

      await expect(
        usersController.create(CREATE_USER_DTO_TEST_OBJ_2, {})
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('Update function', () => {
    // Tests the update function with valid dto (basic positive test)
    it('should test the update function with a valid update dto', async () => {
      expect.assertions(1);

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
