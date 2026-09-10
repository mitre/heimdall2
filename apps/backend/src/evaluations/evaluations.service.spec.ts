import {NotFoundException} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test} from '@nestjs/testing';
import { isEmail } from 'class-validator';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {
  CREATE_EVALUATION_DTO_WITHOUT_FILENAME,
  CREATE_EVALUATION_DTO_WITHOUT_TAGS,
  EVALUATION_WITH_TAGS_1,
  UPDATE_EVALUATION,
  UPDATE_EVALUATION_DATA_ONLY,
  UPDATE_EVALUATION_FILENAME_ONLY
} from '../../test/constants/evaluations-test.constant';
import {GROUP_1} from '../../test/constants/groups-test.constant';
import {CREATE_USER_DTO_TEST_OBJ} from '../../test/constants/users-test.constant';
import {ConfigService} from '../config/config.service';
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
        ConfigService,
        EvaluationsService,
        DatabaseService,
        UsersService,
        GroupsService
      ]
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    evaluationsService = module.get<EvaluationsService>(EvaluationsService);
    evaluationTagsService = module.get<EvaluationTagsService>(
      EvaluationTagsService
    );
    usersService = module.get<UsersService>(UsersService);
    groupsService = module.get<GroupsService>(GroupsService);
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    user = new UserDto(await usersService.create(CREATE_USER_DTO_TEST_OBJ));
  });

  describe('findAll', () => {
    it('should find all evaluations', async () => {
      let evaluationsDtoArray = await evaluationsService.findAll();
      expect(evaluationsDtoArray).toEqual([]);

      await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        data: {},
        userId: user.id
      });
      await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        data: {},
        userId: user.id
      });
      evaluationsDtoArray = await evaluationsService.findAll();
      expect(evaluationsDtoArray.length).toEqual(2);
    });

    it('should include the evaluation user', async () => {
      await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        data: {},
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
        data: {},
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

  describe('evaluation visibility by email', () => {
    it.each([
      ['reader@example.com', 'user'],
      ["o'connor@example.com", 'user'],
      ["x'/**/OR/**/'x'='x@example.com", 'user'],
      ['"x\') OR 1=1--"@example.com', 'user'],
      ['%@yahoo.com', 'user'],
      ['a_c@yahoo.com', 'user'],
      ['admin@example.com', 'admin'],
    ])(
      'lists and counts only authorized evaluations for %s (%s)',
      async (email, role) => {
        expect(isEmail(email)).toBe(true);
        const viewer = await usersService.create({
          ...CREATE_USER_DTO_TEST_OBJ,
          email,
          role,
        });
        const otherUser = await usersService.findById(user.id);
        const createEvaluation = (
          filename: string,
          userId: string,
          isPublic = false,
        ) =>
          evaluationsService.create({
            ...EVALUATION_WITH_TAGS_1,
            data: {},
            filename: `visibility-${filename}`,
            public: isPublic,
            userId,
          });
        const publicEvaluation = await createEvaluation('public', user.id, true);
        const ownedEvaluation = await createEvaluation('owned', viewer.id);
        const sharedEvaluation = await createEvaluation('shared', user.id);
        const privateEvaluation = await createEvaluation('private', user.id);

        // Multiple matching groups must not inflate the evaluation counts.
        for (const name of ['shared-first', 'shared-second']) {
          const group = await groupsService.create({
            ...GROUP_1,
            name,
            public: false,
          });
          await groupsService.addUserToGroup(group, viewer, 'member');
          await groupsService.addUserToGroup(group, otherUser, 'owner');
          await groupsService.addEvaluationToGroup(group, sharedEvaluation);
        }
        const privateGroup = await groupsService.create({
          ...GROUP_1,
          name: 'private',
          public: false,
        });
        await groupsService.addUserToGroup(privateGroup, otherUser, 'owner');
        await groupsService.addEvaluationToGroup(privateGroup, privateEvaluation);

        const expectedIds = [
          publicEvaluation.id,
          ownedEvaluation.id,
          sharedEvaluation.id,
        ];
        if (role === 'admin') {
          expectedIds.push(privateEvaluation.id);
        }
        const parameters = { limit: 100, offset: 0, order: ['id', 'ASC'] };
        const result = await evaluationsService.getAllEvaluations(
          parameters,
          email,
          role,
        );
        expect(
          result.evaluations.map(evaluation => evaluation.id),
        ).toEqual(expectedIds);
        expect(result.totalItems).toBe(expectedIds.length);

        for (const operator of ['AND', 'OR']) {
          const searchResult = await evaluationsService.getEvaluationsWithClause(
            {
              ...parameters,
              operator,
              searchFields: ['^visibility-', '()', '()'],
            },
            email,
            role,
          );
          expect(
            searchResult.evaluations.map(evaluation => evaluation.id),
          ).toEqual(expectedIds);
          expect(searchResult.totalItems).toBe(expectedIds.length);
        }
      },
    );
  });

  describe('findById', () => {
    it('should find evaluations by id', async () => {
      expect.assertions(1);
      const evaluation = await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        data: {},
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
        data: {},
        userId: user.id
      });
      expect(evaluation.id).toBeDefined();
      expect(evaluation.updatedAt).toBeDefined();
      expect(evaluation.createdAt).toBeDefined();
      expect(evaluation.data).toEqual({});
      expect(evaluation.filename).toEqual(EVALUATION_WITH_TAGS_1.filename);
      expect(evaluation.evaluationTags[0].evaluationId).toBeDefined();
      expect(evaluation.evaluationTags[0].updatedAt).toBeDefined();
      expect(evaluation.evaluationTags[0].createdAt).toBeDefined();

      if (EVALUATION_WITH_TAGS_1.evaluationTags === undefined) {
        throw new TypeError(
          'Evaluation fixture does not have any associated tags.'
        );
      }

      expect(evaluation.evaluationTags?.[0].value).toEqual(
        EVALUATION_WITH_TAGS_1.evaluationTags[0].value
      );
    });

    it('should create a new evaluation without evaluation tags', async () => {
      const evaluation = await evaluationsService.create({
        ...CREATE_EVALUATION_DTO_WITHOUT_TAGS,
        data: {},
        userId: user.id
      });
      expect(evaluation.id).toBeDefined();
      expect(evaluation.updatedAt).toBeDefined();
      expect(evaluation.createdAt).toBeDefined();
      expect(evaluation.data).toEqual({});
      expect(evaluation.filename).toEqual(
        CREATE_EVALUATION_DTO_WITHOUT_TAGS.filename
      );
      expect(evaluation.evaluationTags).not.toBeDefined();
      expect((await evaluationTagsService.findAll()).length).toBe(0);
    });

    it('should throw an error when missing the filename field', async () => {
      expect.assertions(1);
      await expect(
        evaluationsService.create({
          ...CREATE_EVALUATION_DTO_WITHOUT_FILENAME,
          data: {},
          userId: user.id
        })
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
        data: {},
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
        data: {},
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
        data: {},
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
        data: {},
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
});
