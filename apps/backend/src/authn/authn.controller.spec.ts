import {UnauthorizedException} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test, TestingModule} from '@nestjs/testing';
import {
  CREATE_USER_DTO_TEST_OBJ,
  USER_ONE_DTO
} from '../../test/constants/users-test.constant';
import {AuthzService} from '../authz/authz.service';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Evaluation} from '../evaluations/evaluation.model';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {AuthnController} from './authn.controller';
import {AuthnModule} from './authn.module';

// Test suite for the AuthnController
describe('UsersController Unit Tests', () => {
  let configService: ConfigService;
  let module: TestingModule;
  let databaseService: DatabaseService;
  let authnController: AuthnController;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        ConfigModule,
        AuthnModule,
        SequelizeModule.forFeature([
          User,
          GroupUser,
          Group,
          GroupEvaluation,
          Evaluation,
          EvaluationTag
        ])
      ],
      providers: [AuthzService, DatabaseService]
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    authnController = module.get<AuthnController>(AuthnController);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
  });

  describe('Signup function', () => {
    it('Should follow the registration enabled ENV variable', async () => {
      if (
        configService.get('REGISTRATION_DISABLED')?.toLocaleLowerCase() ===
        'true'
      ) {
        expect.assertions(1);

        await expect(
          authnController.signup(CREATE_USER_DTO_TEST_OBJ)
        ).rejects.toBeInstanceOf(UnauthorizedException);
      } else {
        expect.assertions(8);

        const user = await authnController.signup(CREATE_USER_DTO_TEST_OBJ);
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
      }
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
