import {ForbiddenError} from '@casl/ability';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test, TestingModule} from '@nestjs/testing';
import {CREATE_EVALUATION_TAG_DTO} from '../../test/constants/evaluation-tags-test.constant';
import {EVALUATION_1} from '../../test/constants/evaluations-test.constant';
import {PRIVATE_GROUP} from '../../test/constants/groups-test.constant';
import {
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_2
} from '../../test/constants/users-test.constant';
import {AuthzService} from '../authz/authz.service';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {Evaluation} from '../evaluations/evaluation.model';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {EvaluationTag} from './evaluation-tag.model';
import {EvaluationTagsController} from './evaluation-tags.controller';
import {EvaluationTagsService} from './evaluation-tags.service';

describe('EvaluationTagsController', () => {
  let evaluationTagsController: EvaluationTagsController;
  let evaluationTagsService: EvaluationTagsService;
  let module: TestingModule;
  let usersService: UsersService;
  let databaseService: DatabaseService;
  let evaluationsService: EvaluationsService;
  let groupsService: GroupsService;
  let user: User;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [EvaluationTagsController],
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([
          Evaluation,
          EvaluationTag,
          User,
          GroupEvaluation,
          Group,
          GroupUser
        ])
      ],
      providers: [
        AuthzService,
        DatabaseService,
        EvaluationTagsService,
        UsersService,
        EvaluationsService,
        GroupsService
      ]
    }).compile();

    evaluationTagsController = module.get<EvaluationTagsController>(
      EvaluationTagsController
    );
    evaluationTagsService = module.get<EvaluationTagsService>(
      EvaluationTagsService
    );
    evaluationsService = module.get<EvaluationsService>(EvaluationsService);
    usersService = module.get<UsersService>(UsersService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    groupsService = module.get<GroupsService>(GroupsService);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
  });

  afterAll((done) => {
    databaseService.closeConnection();
    done();
  });

  describe('index', () => {
    it('should return EvaluationTags a User has ownership of', async () => {
      // Evaluation 1 has no tags so a tag needs to be added manually
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        user.id
      );
      await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      const foundEvaluationTags = await evaluationTagsController.index({
        user: user
      });
      expect(foundEvaluationTags.length).toEqual(1);
      expect(foundEvaluationTags[0].value).toEqual(
        CREATE_EVALUATION_TAG_DTO.value
      );
    });

    it('should return EvaluationTags a User has group ownership of', async () => {
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        evaluationOwner.id
      );
      const group = await groupsService.create(PRIVATE_GROUP);
      await groupsService.addUserToGroup(group, user, 'owner');
      await groupsService.addEvaluationToGroup(group, evaluation);
      await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      const foundEvaluationTags = await evaluationTagsController.index({
        user: user
      });

      expect(foundEvaluationTags.length).toEqual(1);
      expect(foundEvaluationTags[0].value).toEqual(
        CREATE_EVALUATION_TAG_DTO.value
      );
    });

    it('should not return EvaluationTags associated with an Evaluation a User not authorized to view', async () => {
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        evaluationOwner.id
      );
      await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      const foundEvaluationTags = await evaluationTagsController.index({
        user: user
      });
      expect(foundEvaluationTags.length).toEqual(0);
    });
  });

  describe('findById', () => {
    it('should return an EvaluationTag a User has ownership of', async () => {
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        user.id
      );
      const evaluationTag = await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      const foundTag = await evaluationTagsController.findById(
        evaluationTag.id,
        {user: user}
      );
      expect(foundTag.value).toEqual(CREATE_EVALUATION_TAG_DTO.value);
    });

    it('should return an EvaluationTags a User has group ownership of', async () => {
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        evaluationOwner.id
      );
      const group = await groupsService.create(PRIVATE_GROUP);
      await groupsService.addUserToGroup(group, user, 'owner');
      await groupsService.addEvaluationToGroup(group, evaluation);
      const evaluationTag = await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      const foundEvaluationTag = await evaluationTagsController.findById(
        evaluationTag.id,
        {user: user}
      );

      expect(foundEvaluationTag.value).toEqual(CREATE_EVALUATION_TAG_DTO.value);
    });

    it('should not return an EvaluationTags associated with an Evaluation a User not authorized to view', async () => {
      expect.assertions(1);

      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        evaluationOwner.id
      );
      const evaluationTag = await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );

      await expect(
        evaluationTagsController.findById(evaluationTag.id, {user: user})
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('create', () => {
    it('should create EvaluationTags on an Evaluation a User has ownership of', async () => {
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        user.id
      );
      const evaluationTag = await evaluationTagsController.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO,
        {user: user}
      );
      expect(evaluationTag).toBeDefined();
    });

    it('should create EvaluationTags on an Evaluation a User has Group ownership of', async () => {
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        evaluationOwner.id
      );
      const group = await groupsService.create(PRIVATE_GROUP);
      await groupsService.addUserToGroup(group, user, 'owner');
      await groupsService.addEvaluationToGroup(group, evaluation);
      const evaluationTag = await evaluationTagsController.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO,
        {user: user}
      );

      expect(evaluationTag).toBeDefined();
    });

    it('should throw ForbiddenError when adding EvaluationTags to an Evaluation a User is not authorized to manage', async () => {
      expect.assertions(1);

      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        evaluationOwner.id
      );

      await expect(
        evaluationTagsController.create(
          evaluation.id,
          CREATE_EVALUATION_TAG_DTO,
          {user: user}
        )
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('remove', () => {
    it('should remove EvaluationTags from Evaluations a User has ownership of', async () => {
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        user.id
      );
      const evaluationTag = await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      const removedTag = await evaluationTagsController.remove(
        evaluationTag.id,
        {user: user}
      );
      expect(removedTag.value).toEqual(CREATE_EVALUATION_TAG_DTO.value);
    });

    it('should remove EvaluationTags on an Evaluation a User has Group ownership of', async () => {
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        evaluationOwner.id
      );
      const group = await groupsService.create(PRIVATE_GROUP);
      await groupsService.addUserToGroup(group, user, 'owner');
      await groupsService.addEvaluationToGroup(group, evaluation);
      const evaluationTag = await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      const removedTag = await evaluationTagsController.remove(
        evaluationTag.id,
        {user: user}
      );

      expect(removedTag.value).toEqual(CREATE_EVALUATION_TAG_DTO.value);
    });

    it('should throw ForbiddenError when removing EvaluationTags from an Evaluation a User is not authorized to manage', async () => {
      expect.assertions(1);

      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        evaluationOwner.id
      );
      const evaluationTag = await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );

      await expect(
        evaluationTagsController.remove(evaluationTag.id, {user: user})
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });
});
