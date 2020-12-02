import {Test, TestingModule} from '@nestjs/testing';
import {DatabaseService} from '../../src/database/database.service';
import {ADMIN, TEST_USER} from '../../test/constants/users-test.constant';
import {AuthzService} from './authz.service';

describe('Authz Service', () => {
  let testingModule: TestingModule;
  let authzService: AuthzService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      providers: [AuthzService]
    }).compile();

    authzService = testingModule.get<AuthzService>(AuthzService);
  });

  describe('Test the can function', () => {
    describe('delete users', () => {
      it('should grant access when subject has admin role', async () => {
        expect(await authzService.can(ADMIN, 'delete', '/users')).toBeTruthy();
      });

      it('should grant access when role, action, and resource are all valid', async () => {
        expect(
          await authzService.can(TEST_USER, 'delete', '/users')
        ).toBeTruthy();
      });

      it('should deny access when action is invalid delete', async () => {
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

    describe('update users', () => {
      it('should grant access when role, action an dresource are all valid', async () => {
        expect(await authzService.can(TEST_USER, 'put', '/users')).toBeTruthy();
      });
    });
  });

  describe('Tests logging of the policies', () => {
    // Used to make sure policies logs are printed
    const consoleSpy = jest.spyOn(console, 'log');

    beforeAll(async () => {
      await Test.createTestingModule({
        providers: [AuthzService]
      }).compile();
    });

    it('should log the loaded default policies', async () => {
      expect(consoleSpy).toHaveBeenCalledWith('Loaded Policy!');
      expect(consoleSpy).toHaveBeenCalledWith('\tRole: any');
      expect(consoleSpy).toHaveBeenCalledWith('\tAction: delete');
      expect(consoleSpy).toHaveBeenCalledWith('\tResource: users');
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
