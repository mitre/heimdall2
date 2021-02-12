import {NotFoundException} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test} from '@nestjs/testing';
import {
  CREATE_EVALUATION_DTO_WITHOUT_DATA,
  CREATE_EVALUATION_DTO_WITHOUT_FILENAME,
  CREATE_EVALUATION_DTO_WITHOUT_TAGS,
  EVALUATION_WITH_TAGS_1,
  UPDATE_EVALUATION,
  UPDATE_EVALUATION_DATA_ONLY,
  UPDATE_EVALUATION_FILENAME_ONLY
} from '../../test/constants/evaluations-test.constant';
import {GROUP_1} from '../../test/constants/groups-test.constant';
import {CREATE_USER_DTO_TEST_OBJ} from '../../test/constants/users-test.constant';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTagsModule} from '../evaluation-tags/evaluation-tags.module';
import {EvaluationTagsService} from '../evaluation-tags/evaluation-tags.service';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {UserDto} from '../users/dto/user.dto';
import {UsersModule} from '../users/users.module';
import {UsersService} from '../users/users.service';
import {EvaluationDto} from './dto/evaluation.dto';
import {Evaluation} from './evaluation.model';
import {EvaluationsService} from './evaluations.service';

describe('EvaluationsService', () => {
  let evaluationsService: EvaluationsService;
  let evaluationTagsService: EvaluationTagsService;
  let databaseService: DatabaseService;
  let usersService: UsersService;
  let user: UserDto;
  let groupsService: GroupsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([
          Evaluation,
          GroupUser,
          Group,
          GroupEvaluation
        ]),
        EvaluationTagsModule,
        UsersModule
      ],
      providers: [
        EvaluationsService,
        DatabaseService,
        UsersService,
        GroupsService
      ]
    }).compile();

    evaluationsService = module.get<EvaluationsService>(EvaluationsService);
    evaluationTagsService = module.get<EvaluationTagsService>(
      EvaluationTagsService
    );
    databaseService = module.get<DatabaseService>(DatabaseService);
    usersService = module.get<UsersService>(UsersService);
    groupsService = module.get<GroupsService>(GroupsService);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    user = new UserDto(await usersService.create(CREATE_USER_DTO_TEST_OBJ));
  });

  describe('findAll', () => {
    it('should find all evaluations', async () => {
      let evaluationsDtoArray = await evaluationsService.findAll();
      expect(evaluationsDtoArray).toEqual([]);

      const evaluationOne = await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        userId: user.id
      });
      const evaluationTwo = await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        userId: user.id
      });
      evaluationsDtoArray = await evaluationsService.findAll();

      expect(evaluationsDtoArray[0].id).toEqual(evaluationOne.id);
      expect(evaluationsDtoArray[0].filename).toEqual(evaluationOne.filename);
      expect(evaluationsDtoArray[0].createdAt).toEqual(evaluationOne.createdAt);
      expect(evaluationsDtoArray[0].updatedAt).toEqual(evaluationOne.updatedAt);
      expect(evaluationsDtoArray[0].evaluationTags.length).toEqual(
        evaluationOne.evaluationTags.length
      );

      expect(evaluationsDtoArray[1].id).toEqual(evaluationTwo.id);
      expect(evaluationsDtoArray[1].filename).toEqual(evaluationTwo.filename);
      expect(evaluationsDtoArray[1].createdAt).toEqual(evaluationTwo.createdAt);
      expect(evaluationsDtoArray[1].updatedAt).toEqual(evaluationTwo.updatedAt);
      expect(evaluationsDtoArray[1].evaluationTags.length).toEqual(
        evaluationTwo.evaluationTags.length
      );
    });

    it('should include the evaluation user', async () => {
      await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        userId: user.id
      });

      const evaluations = await evaluationsService.findAll();
      expect(new UserDto(evaluations[0].user)).toEqual(user);
    });

    it('should include the evaluation group and group users', async () => {
      const group = await groupsService.create(GROUP_1);
      const owner = await usersService.findById(user.id);
      const evaluation = await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        userId: user.id
      });

      let evaluations = await evaluationsService.findAll();
      expect(evaluations[0].groups[0]).not.toBeDefined();

      await groupsService.addEvaluationToGroup(group, evaluation);
      await groupsService.addUserToGroup(group, owner, 'owner');

      evaluations = await evaluationsService.findAll();
      const foundGroup = evaluations[0].groups[0];
      expect(foundGroup).toBeDefined();
      expect(foundGroup.id).toEqual(group.id);
      expect(foundGroup.users.length).toEqual(1);
      expect(foundGroup.users[0].id).toEqual(owner.id);
      expect(foundGroup.users[0].GroupUser.role).toEqual('owner');
    });
  });

  describe('findById', () => {
    it('should find evaluations by id', async () => {
      const evaluation = await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        userId: user.id
      });
      const foundEvaluation = await evaluationsService.findById(evaluation.id);
      expect(new EvaluationDto(evaluation)).toEqual(
        new EvaluationDto(foundEvaluation)
      );
    });

    it('should throw an error if an evaluation does not exist', async () => {
      expect.assertions(1);
      await expect(evaluationsService.findById('-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('create', () => {
    it('should create a new evaluation with evaluation tags', async () => {
      const evaluation = await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        userId: user.id
      });
      expect(evaluation.id).toBeDefined();
      expect(evaluation.updatedAt).toBeDefined();
      expect(evaluation.createdAt).toBeDefined();
      expect(evaluation.data).toEqual(EVALUATION_WITH_TAGS_1.data);
      expect(evaluation.filename).toEqual(EVALUATION_WITH_TAGS_1.filename);
      expect(evaluation.evaluationTags[0].evaluationId).toBeDefined();
      expect(evaluation.evaluationTags[0].updatedAt).toBeDefined();
      expect(evaluation.evaluationTags[0].createdAt).toBeDefined();

      if (EVALUATION_WITH_TAGS_1.evaluationTags === undefined) {
        throw new TypeError(
          'Evaluation fixture does not have any assocaited tags.'
        );
      }

      expect(evaluation.evaluationTags?.[0].value).toEqual(
        EVALUATION_WITH_TAGS_1.evaluationTags[0].value
      );
    });

    it('should create a new evaluation without evaluation tags', async () => {
      const evaluation = await evaluationsService.create({
        ...CREATE_EVALUATION_DTO_WITHOUT_TAGS,
        userId: user.id
      });
      expect(evaluation.id).toBeDefined();
      expect(evaluation.updatedAt).toBeDefined();
      expect(evaluation.createdAt).toBeDefined();
      expect(evaluation.data).toEqual(CREATE_EVALUATION_DTO_WITHOUT_TAGS.data);
      expect(evaluation.filename).toEqual(
        CREATE_EVALUATION_DTO_WITHOUT_TAGS.filename
      );
      expect(evaluation.evaluationTags).not.toBeDefined();
      expect((await evaluationTagsService.findAll()).length).toBe(0);
    });

    it('should throw an error when missing the data field', async () => {
      expect.assertions(1);
      await expect(
        evaluationsService.create(CREATE_EVALUATION_DTO_WITHOUT_DATA)
      ).rejects.toThrow('notNull Violation: Evaluation.data cannot be null');
    });

    it('should throw an error when missing the filename field', async () => {
      expect.assertions(1);
      await expect(
        evaluationsService.create(CREATE_EVALUATION_DTO_WITHOUT_FILENAME)
      ).rejects.toThrow(
        'notNull Violation: Evaluation.filename cannot be null'
      );
    });
  });

  describe('update', () => {
    it('should throw an error if an evaluation does not exist', async () => {
      expect.assertions(1);
      await expect(
        evaluationsService.update('-1', UPDATE_EVALUATION)
      ).rejects.toThrow(NotFoundException);
    });

    it('should update all fields of an evaluation', async () => {
      const evaluation = await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        userId: user.id
      });
      const updatedEvaluation = await evaluationsService.update(
        evaluation.id,
        UPDATE_EVALUATION
      );
      expect(updatedEvaluation.id).toEqual(evaluation.id);
      expect(updatedEvaluation.createdAt).toEqual(evaluation.createdAt);
      expect(updatedEvaluation.updatedAt).not.toEqual(evaluation.updatedAt);
      expect(updatedEvaluation.data).not.toEqual(evaluation.data);
      expect(updatedEvaluation.filename).not.toEqual(evaluation.filename);
    });

    it('should only update data if provided', async () => {
      const evaluation = await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        userId: user.id
      });
      const updatedEvaluation = await evaluationsService.update(
        evaluation.id,
        UPDATE_EVALUATION_DATA_ONLY
      );
      expect(updatedEvaluation.id).toEqual(evaluation.id);
      expect(updatedEvaluation.createdAt).toEqual(evaluation.createdAt);
      expect(updatedEvaluation.updatedAt).not.toEqual(evaluation.updatedAt);
      expect(updatedEvaluation.evaluationTags.length).toEqual(
        evaluation.evaluationTags.length
      );
      expect(updatedEvaluation.data).not.toEqual(evaluation.data);
      expect(updatedEvaluation.filename).toEqual(evaluation.filename);
    });

    it('should only update filename if provided', async () => {
      const evaluation = await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        userId: user.id
      });

      const updatedEvaluation = await evaluationsService.update(
        evaluation.id,
        UPDATE_EVALUATION_FILENAME_ONLY
      );
      expect(updatedEvaluation.id).toEqual(evaluation.id);
      expect(updatedEvaluation.createdAt).toEqual(evaluation.createdAt);
      expect(updatedEvaluation.updatedAt).not.toEqual(evaluation.updatedAt);
      expect(updatedEvaluation.evaluationTags.length).toEqual(
        evaluation.evaluationTags.length
      );
      expect(updatedEvaluation.data).toEqual(evaluation.data);
      expect(updatedEvaluation.filename).not.toEqual(evaluation.filename);
    });
  });

  describe('remove', () => {
    it('should remove an evaluation and its evaluation tags given an id', async () => {
      const evaluation = await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        userId: user.id
      });
      const removedEvaluation = await evaluationsService.remove(evaluation.id);
      const foundEvaluationTags = await evaluationTagsService.findAll();
      expect(foundEvaluationTags.length).toEqual(0);
      expect(new EvaluationDto(removedEvaluation)).toEqual(
        new EvaluationDto(evaluation)
      );

      await expect(
        evaluationsService.findById(removedEvaluation.id)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an error when the evaluation does not exist', async () => {
      expect.assertions(1);
      await expect(evaluationsService.findById('-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
