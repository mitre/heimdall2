import {ForbiddenError} from '@casl/ability';
import {BadRequestException, NotFoundException} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test, TestingModule} from '@nestjs/testing';
import {
  EVALUATION_1
} from '../../test/constants/evaluations-test.constant';
import {CREATE_USER_DTO_TEST_OBJ} from '../../test/constants/users-test.constant';
import {AuthzService} from '../authz/authz.service';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {UsersController} from '../users/users.controller';
import {UsersModule} from '../users/users.module';
import {UsersService} from '../users/users.service';
import {EvaluationDto} from './dto/evaluation.dto';
import {Evaluation} from './evaluation.model';
import {EvaluationsController} from './evaluations.controller';
import {EvaluationsService} from './evaluations.service';

describe('EvaluationsController', () => {
  let evaluationsController: EvaluationsController;
  let evaluationsService: EvaluationsService;
  let module: TestingModule;
  let databaseService: DatabaseService;
  let usersService: UsersService;

  let user: User;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [EvaluationsController],
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([
          EvaluationTag,
          Evaluation,
          User,
          GroupEvaluation,
          GroupUser,
          Group
        ])
      ],
      providers: [
        AuthzService,
        DatabaseService,
        UsersService,
        EvaluationsService
      ]
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    evaluationsService = module.get<EvaluationsService>(EvaluationsService);
    evaluationsController = module.get<EvaluationsController>(
      EvaluationsController
    );
    usersService = module.get<UsersService>(UsersService);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
  });

  describe('findById', () => {
    it('should return an evaluation', async () => {
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        userId: user.id
      });

      const foundEvaluation = await evaluationsController.findById(
        evaluation.id,
        {user: user}
      );
      expect(foundEvaluation).toEqual(new EvaluationDto(evaluation));
    });

    it('should return an evaluations tags', async () => {

    });

    it('should throw a not found exeception when given an invalid id', async () => {
      expect.assertions(1);

      await expect(
        evaluationsController.findById(
          '0',
          {user: user}
        )
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should prevent non-owners from viewing an evaluation', async () => {
      expect.assertions(1);
      const evaluation = await evaluationsService.create(EVALUATION_1);
      await expect(
        evaluationsController.findById(
          evaluation.id,
          {user: user}
        )
      ).rejects.toBeInstanceOf(ForbiddenError)
    });
  });

  describe('findAll', () => {
    it('should return all evaluations a user has permissions to read', async () => {
      await evaluationsService.create({
        ...EVALUATION_1,
        userId: user.id
      });
      let foundEvaluations = await evaluationsController.findAll({user: user});
      expect(foundEvaluations.length).toEqual(1);
      await evaluationsService.create(EVALUATION_1);
      foundEvaluations = await evaluationsController.findAll({user: user});
      expect(foundEvaluations.length).toEqual(1);
    });

    it('should return all evaluations and their associated tags', async () => {

    });
  });

  describe('create', () => {
    it('should allow a user to create an evaluation', async () => {

    });

    it('should create an evaluation without tags', async () => {

    });
  });

  describe('update', () => {
    it('should allow an evaluation owner to update', async () => {

    });

    it('should prevent unauthorized users from updating', async () => {

    });
  });

  describe('remove', () => {
    it('should remove an evaluation', async () => {

    });

    it('should prevent unauthorized users removing an evaluation', async () => {

    })
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
