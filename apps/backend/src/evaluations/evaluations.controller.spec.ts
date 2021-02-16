import {ForbiddenError} from '@casl/ability';
import {NotFoundException} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test, TestingModule} from '@nestjs/testing';
import {
  CREATE_EVALUATION_DTO_WITHOUT_TAGS,
  EVALUATION_1,
  EVALUATION_WITH_TAGS_1,
  UPDATE_EVALUATION
} from '../../test/constants/evaluations-test.constant';
import {
  GROUP_1,
  PRIVATE_GROUP
} from '../../test/constants/groups-test.constant';
import {
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_2
} from '../../test/constants/users-test.constant';
import {AuthzService} from '../authz/authz.service';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {User} from '../users/user.model';
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
  let groupsService: GroupsService;

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
        EvaluationsService,
        GroupsService
      ]
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    evaluationsService = module.get<EvaluationsService>(EvaluationsService);
    evaluationsController = module.get<EvaluationsController>(
      EvaluationsController
    );
    usersService = module.get<UsersService>(UsersService);
    groupsService = module.get<GroupsService>(GroupsService);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
  });

  describe('findById', () => {
    it('should return an evaluation', async () => {
      const evaluation = await evaluationsService.create(EVALUATION_1, user.id);

      const foundEvaluation = await evaluationsController.findById(
        evaluation.id,
        {user: user}
      );
      expect(foundEvaluation).toEqual(new EvaluationDto(evaluation));
    });

    it('should return an evaluations tags', async () => {
      const evaluation = await evaluationsService.create(
        EVALUATION_WITH_TAGS_1,
        user.id
      );

      const foundEvaluation = await evaluationsController.findById(
        evaluation.id,
        {user: user}
      );
      expect(foundEvaluation.evaluationTags).toEqual(
        new EvaluationDto(evaluation).evaluationTags
      );
    });

    it('should throw a not found exeception when given an invalid id', async () => {
      expect.assertions(1);

      await expect(
        evaluationsController.findById('0', {user: user})
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should prevent non-owners from viewing an evaluation', async () => {
      expect.assertions(1);
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        evaluationOwner.id
      );
      await expect(
        evaluationsController.findById(evaluation.id, {user: user})
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('findAll', () => {
    it('should return all evaluations a user has permissions to read', async () => {
      await evaluationsService.create(EVALUATION_1, user.id);
      let foundEvaluations = await evaluationsController.findAll({user: user});
      expect(foundEvaluations.length).toEqual(1);
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      await evaluationsService.create(EVALUATION_1, evaluationOwner.id);
      foundEvaluations = await evaluationsController.findAll({user: user});
      expect(foundEvaluations.length).toEqual(1);
    });

    it('should return all evaluations and their associated tags', async () => {
      await evaluationsService.create(EVALUATION_WITH_TAGS_1, user.id);
      const foundEvaluations = await evaluationsController.findAll({
        user: user
      });
      expect(foundEvaluations[0].evaluationTags.length).toEqual(1);
    });

    it('should return editable true if the user is the owner of an evaluation', async () => {
      await evaluationsService.create(EVALUATION_1, user.id);
      const foundEvaluations = await evaluationsController.findAll({
        user: user
      });
      expect(foundEvaluations[0].editable).toBeTruthy();
    });

    it('should return editable true if the user is the owner of a group that an evaluation belongs to', async () => {
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        evaluationOwner.id
      );
      const group = await groupsService.create(GROUP_1);
      const group2 = await groupsService.create(PRIVATE_GROUP);
      await groupsService.addUserToGroup(group, user, 'user');
      await groupsService.addUserToGroup(group2, user, 'owner');
      await groupsService.addEvaluationToGroup(group, evaluation);
      const foundEvaluations = await evaluationsController.findAll({
        user: user
      });
      expect(foundEvaluations[0].editable).toBeTruthy();
    });
  });

  describe('create', () => {
    it('should allow a user to create an evaluation', async () => {
      const evaluation = await evaluationsController.create(
        EVALUATION_WITH_TAGS_1,
        {user: user}
      );
      expect(evaluation).toBeDefined();
      expect(evaluation.evaluationTags.length).toEqual(1);
    });

    it('should create an evaluation without tags', async () => {
      const evaluation = await evaluationsController.create(
        CREATE_EVALUATION_DTO_WITHOUT_TAGS,
        {user: user}
      );
      expect(evaluation).toBeDefined();
      expect(evaluation.evaluationTags.length).toEqual(0);
    });
  });

  describe('update', () => {
    it('should allow an evaluation owner to update', async () => {
      const evaluation = await evaluationsService.create(EVALUATION_1, user.id);
      const updatedEvaluation = await evaluationsController.update(
        evaluation.id,
        {user: user},
        UPDATE_EVALUATION
      );
      expect(evaluation.filename).not.toEqual(updatedEvaluation.filename);
      expect(evaluation.data).not.toEqual(updatedEvaluation.data);
    });

    it('should prevent unauthorized users from updating', async () => {
      expect.assertions(1);
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        evaluationOwner.id
      );
      await expect(
        evaluationsController.update(
          evaluation.id,
          {user: user},
          UPDATE_EVALUATION
        )
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('remove', () => {
    it('should remove an evaluation', async () => {
      expect.assertions(1);
      const evaluation = await evaluationsService.create(EVALUATION_1, user.id);
      await evaluationsController.remove(evaluation.id, {user: user});
      await expect(
        evaluationsController.findById(evaluation.id, {user: user})
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should prevent unauthorized users removing an evaluation', async () => {
      expect.assertions(1);
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        evaluationOwner.id
      );
      await expect(
        evaluationsController.remove(evaluation.id, {user: user})
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
