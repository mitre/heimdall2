import {ForbiddenError} from '@casl/ability';
import {BadRequestException, NotFoundException} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test, TestingModule} from '@nestjs/testing';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {Readable} from 'stream';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';
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
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_2
} from '../../test/constants/users-test.constant';
import {AuthzService} from '../authz/authz.service';
import {ConfigService} from '../config/config.service';
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
import {EvaluationFile} from './evaluation-file.model';
import {Evaluation} from './evaluation.model';
import {EvaluationsController} from './evaluations.controller';
import {EvaluationsService} from './evaluations.service';

function uploadFile(originalname: string, buffer: Buffer): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: buffer.length,
    destination: '',
    filename: originalname,
    path: '',
    stream: Readable.from(buffer),
    buffer
  };
}
const hdfBuffer = Buffer.from(
  JSON.stringify({
    platform: {name: 'test', release: '1'},
    profiles: [],
    statistics: {},
    version: '5.0'
  })
);
const mockFile = uploadFile('abc.json', hdfBuffer);
const secondMockFile = uploadFile('cda.json', hdfBuffer);

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
          EvaluationFile,
          Evaluation,
          User,
          GroupEvaluation,
          GroupUser,
          Group
        ])
      ],
      providers: [
        AuthzService,
        ConfigService,
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

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
  });

  describe('findById', () => {
    it('should return an evaluation', async () => {
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: user.id
      });

      const foundEvaluation = await evaluationsController.findById(
        evaluation.id,
        {user: user}
      );

      expect(foundEvaluation).toEqual(
        // The evaluation is created with the current user ID above
        // so the expectation is that user should be able to edit
        // which is the 2nd parameter to EvaluationDto.
        new EvaluationDto(evaluation, true)
      );
    });

    it('should return an evaluations tags', async () => {
      const evaluation = await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        data: mockFile,
        userId: user.id
      });

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
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: evaluationOwner.id
      });
      await expect(
        evaluationsController.findById(evaluation.id, {user: user})
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('findAll', () => {
    it('should return all evaluations a user has permissions to read', async () => {
      await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: user.id
      });
      let foundEvaluations = await evaluationsController.findAll({user: user});
      expect(foundEvaluations.length).toEqual(1);
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: evaluationOwner.id
      });
      foundEvaluations = await evaluationsController.findAll({user: user});
      expect(foundEvaluations.length).toEqual(1);
    });

    it('should return all evaluations and their associated tags', async () => {
      await evaluationsService.create({
        ...EVALUATION_WITH_TAGS_1,
        data: mockFile,
        userId: user.id
      });
      const foundEvaluations = await evaluationsController.findAll({
        user: user
      });
      expect(foundEvaluations[0].evaluationTags.length).toEqual(1);
    });

    it('should return editable true if the user is the owner of an evaluation', async () => {
      await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: user.id
      });
      const foundEvaluations = await evaluationsController.findAll({
        user: user
      });
      expect(foundEvaluations[0].editable).toBeTruthy();
    });

    it('should return editable true if the user is the owner of a group that an evaluation belongs to', async () => {
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: evaluationOwner.id
      });
      const group = await groupsService.create(PRIVATE_GROUP);
      await groupsService.addUserToGroup(group, user, 'owner');
      await groupsService.addEvaluationToGroup(group, evaluation);
      const foundEvaluations = await evaluationsController.findAll({
        user: user
      });

      expect(foundEvaluations[0].editable).toBeTruthy();
    });

    it('should return editable false if the user is not owner of a group that an evaluation belongs to', async () => {
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: evaluationOwner.id
      });
      const group = await groupsService.create(GROUP_1);
      const group2 = await groupsService.create(PRIVATE_GROUP);
      await groupsService.addUserToGroup(group, user, 'user');
      await groupsService.addUserToGroup(group2, user, 'owner');
      await groupsService.addEvaluationToGroup(group, evaluation);
      const foundEvaluations = await evaluationsController.findAll({
        user: user
      });
      expect(foundEvaluations[0].editable).toBeFalsy();
    });
  });

  describe('create', () => {
    it('should allow a user to create an evaluation', async () => {
      const evaluation = await evaluationsController.create(
        EVALUATION_WITH_TAGS_1,
        [mockFile],
        {user: user}
      );
      expect(evaluation).toBeDefined();
      if (Array.isArray(evaluation)) {
        throw new Error(
          'Returned evaluation for one file upload should not be an array'
        );
      }
      expect(evaluation.evaluationTags.length).toEqual(1);
      // Creating an evaluation should return a DTO without data.
      expect(evaluation.data).not.toBeDefined();
    });

    it('should create an evaluation without tags', async () => {
      const evaluation = await evaluationsController.create(
        CREATE_EVALUATION_DTO_WITHOUT_TAGS,
        [mockFile],
        {user: user}
      );
      expect(evaluation).toBeDefined();
      if (Array.isArray(evaluation)) {
        throw new Error(
          'Returned evaluation for one file upload should not be an array'
        );
      }
      expect(evaluation.evaluationTags.length).toEqual(0);
    });

    it('should accept multiple evaluations', async () => {
      const evaluations = await evaluationsController.create(
        EVALUATION_WITH_TAGS_1,
        [mockFile, secondMockFile],
        {user: user}
      );
      expect(evaluations).toBeDefined();
      if (!Array.isArray(evaluations)) {
        throw new Error(
          'Returned evaluation for multiple file upload should be an array'
        );
      }
      expect(evaluations.length).toEqual(2);
      expect(evaluations[0].filename).toEqual(mockFile.originalname);
      expect(evaluations[1].filename).toEqual(secondMockFile.originalname);
      // Creating an evaluation should return a DTO without data.
      expect(evaluations[0].data).not.toBeDefined();
    });
  });

  describe('API upload conversion and source storage', () => {
    const sample = (path: string, filename: string): Express.Multer.File =>
      uploadFile(
        filename,
        readFileSync(
          resolve(
            __dirname,
            '../../../../libs/hdf-converters/sample_jsons',
            path
          )
        )
      );

    it('persists HDF and the exact original SARIF bytes separately', async () => {
      const file = sample(
        'sarif_mapper/sample_input_report/sarif_input.sarif',
        'scan.sarif'
      );
      const response = await evaluationsController.create(
        EVALUATION_WITH_TAGS_1,
        [file],
        {user}
      );
      if (Array.isArray(response)) {
        throw new Error('Expected a single evaluation');
      }
      const evaluation = await evaluationsService.findById(response.id);
      expect(evaluation.data).toHaveProperty('profiles.0.controls.0.id');
      const originals = await EvaluationFile.findAll({
        where: {id: evaluation.originalFileId}
      });
      expect(originals).toHaveLength(1);
      expect(originals[0].filename).toBe('scan.sarif');
      expect(originals[0].role).toBe('original');
      expect(originals[0].data).toEqual(file.buffer);
      expect(response.data).toBeUndefined();
    });

    it('preserves a valid HDF upload unchanged', async () => {
      const response = await evaluationsController.create(
        EVALUATION_WITH_TAGS_1,
        [mockFile],
        {user}
      );
      if (Array.isArray(response)) {
        throw new Error('Expected a single evaluation');
      }
      const evaluation = await evaluationsService.findById(response.id);
      expect(evaluation.data).toEqual(
        JSON.parse(mockFile.buffer.toString('utf8'))
      );
    });

    it('rejects an empty upload', async () => {
      await expect(
        evaluationsController.create(EVALUATION_WITH_TAGS_1, [], {user})
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(await evaluationsService.count()).toBe(0);
    });

    it('saves no evaluations when any file in a batch cannot be converted', async () => {
      const invalid = uploadFile('bad.json', Buffer.from('{}'));
      await expect(
        evaluationsController.create(
          EVALUATION_WITH_TAGS_1,
          [mockFile, invalid],
          {user}
        )
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(await evaluationsService.count()).toBe(0);
      expect(await EvaluationFile.count()).toBe(0);
    });

    it('stores one original shared by every generated evaluation', async () => {
      const file = sample(
        'asff_mapper/sample_input_report/asff_sample.json',
        'scan.asff'
      );
      const response = await evaluationsController.create(
        EVALUATION_WITH_TAGS_1,
        [file],
        {user}
      );
      if (!Array.isArray(response)) {
        throw new Error('Expected multiple evaluations');
      }
      expect(response.length).toBeGreaterThan(1);
      expect(
        new Set(response.map((evaluation) => evaluation.filename)).size
      ).toBe(response.length);
      const persisted = await Promise.all(
        response.map((evaluation) => evaluationsService.findById(evaluation.id))
      );
      expect(
        new Set(persisted.map((evaluation) => evaluation.originalFileId)).size
      ).toBe(1);
      const originals = await EvaluationFile.findAll();
      expect(originals).toHaveLength(1);
      expect(originals[0].data).toEqual(file.buffer);
      const [sizes] = await databaseService.sequelize.query(
        'SELECT sum(octet_length(data)) AS bytes FROM "EvaluationFiles"'
      );
      expect(Number((sizes as {bytes: string}[])[0].bytes)).toBe(
        file.buffer.length
      );
    });

    it('converts group API-key uploads and retains their group ownership', async () => {
      const group = await groupsService.create(PRIVATE_GROUP);
      const file = sample(
        'sarif_mapper/sample_input_report/sarif_input.sarif',
        'scan.sarif'
      );
      const response = await evaluationsController.create(
        EVALUATION_WITH_TAGS_1,
        [file],
        {user: group}
      );
      if (Array.isArray(response)) {
        throw new Error('Expected a single evaluation');
      }
      const evaluation = await evaluationsService.findById(response.id);
      expect(evaluation.groupId).toBe(group.id);
      expect(evaluation.groups.map((item) => item.id)).toContain(group.id);
      expect(evaluation.data).toHaveProperty('profiles.0.controls');
      expect(
        await EvaluationFile.count({where: {id: evaluation.originalFileId}})
      ).toBe(1);
    });

    it('rolls back the evaluation if saving the original file fails', async () => {
      const failure = vi
        .spyOn(EvaluationFile, 'create')
        .mockRejectedValue(new Error('File persistence failed'));
      try {
        await expect(
          evaluationsController.create(EVALUATION_WITH_TAGS_1, [mockFile], {
            user
          })
        ).rejects.toThrow('File persistence failed');
        expect(await evaluationsService.count()).toBe(0);
      } finally {
        failure.mockRestore();
      }
    });

    it.each(['user', 'group'])(
      'rolls back every ASFF result when a later save fails for a %s upload',
      async (principal) => {
        const group = await groupsService.create(PRIVATE_GROUP);
        await groupsService.addUserToGroup(group, user, 'owner');
        const file = sample(
          'asff_mapper/sample_input_report/asff_sample.json',
          'scan.asff'
        );
        const create = evaluationsService.create.bind(evaluationsService);
        const failure = vi
          .spyOn(evaluationsService, 'create')
          .mockImplementationOnce(create)
          .mockRejectedValueOnce(new Error('Second evaluation failed'));
        try {
          await expect(
            evaluationsController.create(
              {...EVALUATION_WITH_TAGS_1, groups: [group.id]},
              [file],
              {user: principal === 'group' ? group : user}
            )
          ).rejects.toThrow('Second evaluation failed');
          expect(await Evaluation.count()).toBe(0);
          expect(await EvaluationFile.count()).toBe(0);
          expect(await EvaluationTag.count()).toBe(0);
          expect(await GroupEvaluation.count()).toBe(0);
        } finally {
          failure.mockRestore();
        }
      }
    );

    it('rolls back the whole request when a later source fails to save', async () => {
      const create = evaluationsService.create.bind(evaluationsService);
      const failure = vi
        .spyOn(evaluationsService, 'create')
        .mockImplementationOnce(create)
        .mockRejectedValueOnce(new Error('Second source failed'));
      try {
        await expect(
          evaluationsController.create(
            EVALUATION_WITH_TAGS_1,
            [mockFile, secondMockFile],
            {user}
          )
        ).rejects.toThrow('Second source failed');
        expect(await Evaluation.count()).toBe(0);
        expect(await EvaluationFile.count()).toBe(0);
        expect(await EvaluationTag.count()).toBe(0);
      } finally {
        failure.mockRestore();
      }
    });

    it('rolls back results and originals when a later group association fails', async () => {
      const group = await groupsService.create(PRIVATE_GROUP);
      const file = sample(
        'asff_mapper/sample_input_report/asff_sample.json',
        'scan.asff'
      );
      const create = GroupEvaluation.create.bind(GroupEvaluation);
      const failure = vi
        .spyOn(GroupEvaluation, 'create')
        .mockImplementationOnce(create)
        .mockRejectedValueOnce(new Error('Group link failed'));
      try {
        await expect(
          evaluationsController.create(EVALUATION_WITH_TAGS_1, [file], {
            user: group
          })
        ).rejects.toThrow('Group link failed');
        expect(await Evaluation.count()).toBe(0);
        expect(await EvaluationFile.count()).toBe(0);
        expect(await EvaluationTag.count()).toBe(0);
        expect(await GroupEvaluation.count()).toBe(0);
      } finally {
        failure.mockRestore();
      }
    });

    it('retains shared source bytes until the final evaluation is deleted', async () => {
      const file = sample(
        'asff_mapper/sample_input_report/asff_sample.json',
        'scan.asff'
      );
      const response = await evaluationsController.create(
        EVALUATION_WITH_TAGS_1,
        [file],
        {user}
      );
      if (!Array.isArray(response) || response.length < 2) {
        throw new Error('Expected multiple evaluations');
      }
      await evaluationsController.remove(response[0].id, {user});
      expect(await EvaluationFile.count()).toBe(1);
      const sibling = await evaluationsService.findById(response[1].id);
      const original = await EvaluationFile.findByPk(sibling.originalFileId || undefined);
      expect(original?.data).toEqual(file.buffer);
      await Promise.all(
        response
          .slice(1)
          .map((evaluation) =>
            evaluationsController.remove(evaluation.id, {user})
          )
      );
      expect(await EvaluationFile.count()).toBe(0);
    });

    it('deletes related originals when an evaluation is removed', async () => {
      const response = await evaluationsController.create(
        EVALUATION_WITH_TAGS_1,
        [mockFile],
        {user}
      );
      if (Array.isArray(response)) {
        throw new Error('Expected a single evaluation');
      }
      const evaluation = await evaluationsService.findById(response.id);
      await evaluationsController.remove(response.id, {user});
      expect(
        await EvaluationFile.count({where: {id: evaluation.originalFileId}})
      ).toBe(0);
    });
  });

  describe('update', () => {
    it('should allow an evaluation owner to update', async () => {
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: user.id
      });
      const updatedEvaluation = await evaluationsController.update(
        evaluation.id,
        {user: user},
        UPDATE_EVALUATION
      );
      expect(evaluation.filename).not.toEqual(updatedEvaluation.filename);
      expect(evaluation.data).not.toEqual(updatedEvaluation.data);
    });

    it('should allow a group owner to update', async () => {
      const privateGroup = await groupsService.create(PRIVATE_GROUP);
      const owner = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);

      await groupsService.addUserToGroup(privateGroup, owner, 'owner');

      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: user.id
      });

      await groupsService.addEvaluationToGroup(privateGroup, evaluation);

      const updatedEvaluation = await evaluationsController.update(
        evaluation.id,
        {user: owner},
        UPDATE_EVALUATION
      );
      expect(evaluation.filename).not.toEqual(updatedEvaluation.filename);
      expect(evaluation.data).not.toEqual(updatedEvaluation.data);
    });

    it('should prevent unauthorized group users from updating an evalution in a group they belong to', async () => {
      expect.assertions(1);

      const privateGroup = await groupsService.create(PRIVATE_GROUP);
      const owner = await usersService.create(CREATE_ADMIN_DTO);
      const basicUser = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);

      await groupsService.addUserToGroup(privateGroup, owner, 'owner');
      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: user.id
      });

      await groupsService.addEvaluationToGroup(privateGroup, evaluation);

      await expect(
        evaluationsController.update(
          evaluation.id,
          {user: basicUser},
          UPDATE_EVALUATION
        )
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should prevent unauthorized users from updating', async () => {
      expect.assertions(1);
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: evaluationOwner.id
      });
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
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: {},
        userId: user.id
      });
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
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: evaluationOwner.id
      });
      await expect(
        evaluationsController.remove(evaluation.id, {user: user})
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('groups for evaluation', () => {
    it('should return groups the evaluation belongs to that the requesting user can add and remove the evaluation from', async () => {
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: evaluationOwner.id
      });
      const group = await groupsService.create(GROUP_1);
      await groupsService.addUserToGroup(group, user, 'member');
      await groupsService.addEvaluationToGroup(group, evaluation);
      const foundGroups = await evaluationsController.groupsForEvaluation(
        evaluation.id,
        {user: user}
      );
      expect(foundGroups[0].id).toEqual(group.id);
    });

    it('should not return groups the user has no access to', async () => {
      // GROUP_1 is a public group and still should not show up.
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: mockFile,
        userId: evaluationOwner.id
      });
      const group = await groupsService.create(GROUP_1);
      await groupsService.addEvaluationToGroup(group, evaluation);
      const foundGroups = await evaluationsController.groupsForEvaluation(
        evaluation.id,
        {user: user}
      );
      expect(foundGroups.length).toEqual(0);
    });
  });
});
