import {Test, TestingModule} from '@nestjs/testing';
import {AuthzService} from './authz.service';
import {DatabaseService} from '../../src/database/database.service';
import {Policy} from './policy.model';
import {SequelizeModule, getModelToken} from '@nestjs/sequelize';
import {DatabaseModule} from '../../src/database/database.module';
import {
  ADMIN_DELETE_USERS_POLICY_DTO,
  USER_DELETE_USERS_POLICY_DTO,
  POLICY_ARRAY
} from '../../test/constants/policy-test.constant';
import {
  ADMIN,
  TEST_USER_WITH_INVALID_ROLE,
  TEST_USER
} from '../../test/constants/users-test.constant';

describe('Authz Service', () => {
  let testingModule: TestingModule;
  let authzService: AuthzService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [DatabaseModule, SequelizeModule.forFeature([Policy])],
      providers: [DatabaseService, AuthzService]
    }).compile();

    authzService = testingModule.get<AuthzService>(AuthzService);
    databaseService = testingModule.get<DatabaseService>(DatabaseService);

    // Seed database with policies
    authzService.abac.allow(ADMIN_DELETE_USERS_POLICY_DTO);
    authzService.abac.allow(USER_DELETE_USERS_POLICY_DTO);
  });

  beforeEach(() => {
    return databaseService.cleanAll();
  });

  describe('Test the can function', () => {
    it('should grant access when subject has admin role', async () => {
      expect(await authzService.can(ADMIN, 'delete', '/users')).toBeTruthy();
    });

    it('should grant access when role, action, and resource are all valid', async () => {
      expect(
        await authzService.can(TEST_USER, 'delete', '/users')
      ).toBeTruthy();
    });

    it('should deny access when subject role is invalid', async () => {
      expect(
        await authzService.can(TEST_USER_WITH_INVALID_ROLE, 'delete', '/users')
      ).toBeFalsy();
    });

    it('should deny access when action is invalid', async () => {
      expect(
        await authzService.can(TEST_USER, 'invalid action', '/users')
      ).toBeFalsy();
    });

    it('should deny access when resource is invalid', async () => {
      expect(
        await authzService.can(TEST_USER, 'delete', '/unknown')
      ).toBeFalsy();
    });
  });

  describe('Tests logging of the policies', () => {
    // Used to make sure policies logs are printed
    const consoleSpy = jest.spyOn(console, 'log');

    beforeAll(async () => {
      await Test.createTestingModule({
        imports: [DatabaseModule, SequelizeModule.forFeature([Policy])],
        providers: [
          DatabaseService,
          AuthzService,
          {
            provide: getModelToken(Policy),
            useValue: {
              findAll: jest.fn().mockReturnValueOnce(POLICY_ARRAY)
            }
          }
        ]
      }).compile();
    });

    it('should log the loaded policies', async () => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Attempting to read configuration file `.env`!'
      );
      expect(consoleSpy).toHaveBeenCalledWith('Read config!');
      expect(consoleSpy).toHaveBeenCalledWith('Loaded Policy!');
      expect(consoleSpy).toHaveBeenCalledWith('\tRole: user');
      expect(consoleSpy).toHaveBeenCalledWith('\tAction: delete');
      expect(consoleSpy).toHaveBeenCalledWith('\tResource: users\n');
      expect(consoleSpy).toHaveBeenCalledWith('Loaded Policy!');
      expect(consoleSpy).toHaveBeenCalledWith('\tRole: admin');
      expect(consoleSpy).toHaveBeenCalledWith('\tAction: delete');
      expect(consoleSpy).toHaveBeenCalledWith('\tResource: users\n');
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
