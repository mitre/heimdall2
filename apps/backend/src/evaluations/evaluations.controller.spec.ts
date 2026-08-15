import type { AddressInfo } from 'node:net';
import {Readable} from 'node:stream';
import {ForbiddenError} from '@casl/ability';
import type { ExecutionContext, INestApplication } from '@nestjs/common';
import {BadRequestException, NotFoundException} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import {Test} from '@nestjs/testing';
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
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
import { CryptoModule } from '../crypto/crypto.module';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import { APIKeyOrJwtAuthGuard } from '../guards/api-key-or-jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {EvaluationDto} from './dto/evaluation.dto';
import {Evaluation} from './evaluation.model';
import {EvaluationsController} from './evaluations.controller';
import {EvaluationsService} from './evaluations.service';

// A complete Multer File — the controller only reads originalname/buffer,
// but a partial literal is a TS2740 under tsc --noEmit (the transpile-only
// test runner never type checks, so the gap was invisible until then).
function buildMockFile(originalname: string): Express.Multer.File {
  const buffer = Buffer.from('{}');
  return {
    buffer,
    destination: '',
    encoding: '7bit',
    fieldname: 'data',
    filename: originalname,
    mimetype: 'application/json',
    originalname,
    path: '',
    size: buffer.length,
    stream: Readable.from(buffer)
  };
}
const mockFile = buildMockFile('abc.json');
const secondMockFile = buildMockFile('cda.json');

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
        CryptoModule,
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
        throw new TypeError(
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
        throw new TypeError(
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
        throw new TypeError(
          'Returned evaluation for multiple file upload should be an array'
        );
      }
      expect(evaluations.length).toEqual(2);
      expect(evaluations[0].filename).toEqual(mockFile.originalname);
      expect(evaluations[1].filename).toEqual(secondMockFile.originalname);
      // Creating an evaluation should return a DTO without data.
      expect(evaluations[0].data).not.toBeDefined();
    });

    // These two pin the awaited group attach on BOTH create paths. They induce
    // the failure deliberately: a discarded promise is indistinguishable from an
    // awaited one until the attach REJECTS. Without the await the rejection
    // becomes an unhandled rejection AFTER create has already resolved, so the
    // caller is told the upload succeeded. The route-resolution tests elsewhere
    // in this file pass either way and do not pin this.
    it('surfaces a failed group attach instead of reporting success (user path)', async () => {
      const group = await groupsService.create(PRIVATE_GROUP);
      await groupsService.addUserToGroup(group, user, 'owner');
      const attach = vi
        .spyOn(groupsService, 'addEvaluationToGroup')
        .mockRejectedValue(new Error('group attach exploded'));

      await expect(
        evaluationsController.create(
          {...CREATE_EVALUATION_DTO_WITHOUT_TAGS, groups: [group.id]},
          [mockFile],
          {user: user}
        )
      ).rejects.toThrow('group attach exploded');

      attach.mockRestore();
    });

    it('surfaces a failed group attach on the group-upload path', async () => {
      const group = await groupsService.create(PRIVATE_GROUP);
      const attach = vi
        .spyOn(groupsService, 'addEvaluationToGroup')
        .mockRejectedValue(new Error('group attach exploded'));

      await expect(
        evaluationsController.create(
          CREATE_EVALUATION_DTO_WITHOUT_TAGS,
          [mockFile],
          {user: group}
        )
      ).rejects.toThrow(BadRequestException);

      attach.mockRestore();
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

// Route resolution is a ROUTER concern, not a handler concern: calling
// evaluationsController.findAll() directly succeeds no matter what order the
// decorators are declared in, so the unit tests above cannot detect route
// shadowing. These tests boot the real Nest application and issue real HTTP
// requests so the actual registered routing table is what gets exercised.
// Node's built-in fetch is used deliberately — supertest is not a dependency
// of this repo and adding one to reach a routing assertion is not warranted.
describe('EvaluationsController route resolution', () => {
  let app: INestApplication;
  let baseUrl: string;
  let module: TestingModule;
  let databaseService: DatabaseService;
  let usersService: UsersService;
  let evaluationsService: EvaluationsService;
  // The overridden guards read this at request time, so each test's freshly
  // created user is the one ABAC sees.
  let currentUser: User;

  const allowWithCurrentUser = {
    canActivate: (context: ExecutionContext): boolean => {
      context.switchToHttp().getRequest<{ user: User }>().user = currentUser;
      return true;
    },
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [EvaluationsController],
      imports: [
        CryptoModule,
        DatabaseModule,
        SequelizeModule.forFeature([
          EvaluationTag,
          Evaluation,
          User,
          GroupEvaluation,
          GroupUser,
          Group,
        ]),
      ],
      providers: [
        AuthzService,
        ConfigService,
        DatabaseService,
        UsersService,
        EvaluationsService,
        GroupsService,
      ],
    })
      // Auth is not what these tests are about; the routing table is.
      .overrideGuard(APIKeyOrJwtAuthGuard)
      .useValue(allowWithCurrentUser)
      .overrideGuard(JwtAuthGuard)
      .useValue(allowWithCurrentUser)
      .compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    usersService = module.get<UsersService>(UsersService);
    evaluationsService = module.get<EvaluationsService>(EvaluationsService);

    app = module.createNestApplication();
    await app.init();
    // Port 0 = ephemeral, so this never collides with a dev server.
    await app.listen(0);
    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${String(address.port)}`;
  });

  afterAll(async () => {
    // Order matters: app.close() tears down the Nest app INCLUDING its
    // Sequelize connection, so the cleanup query has to run first or it hits
    // "ConnectionManager.getConnection was called after the connection manager
    // was closed". app.close() also makes a separate closeConnection() call
    // redundant.
    await databaseService.cleanAll();
    await app.close();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    // ABAC needs a real model instance, and create() returns a DTO — so the
    // row is re-read rather than cast.
    const createdUser = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
    const persisted = await User.findByPk<User>(createdUser.id);
    if (persisted === null) {
      throw new TypeError('test user was not persisted');
    }
    currentUser = persisted;
  });

  it('routes GET /evaluations/e2e to findAll, not to the :id handler', async () => {
    expect.assertions(2);
    const response = await fetch(`${baseUrl}/evaluations/e2e`);

    // If ':id' is declared first, Nest dispatches this to findById, which
    // hands the literal string "e2e" to Postgres as a bigint and 500s with
    // 'invalid input syntax for type bigint'.
    expect(response.status).toBe(200);
    // findAll returns a LIST; findById returns a single object.
    expect(Array.isArray(await response.json())).toBe(true);
  });

  it('still routes GET /evaluations/:id to findById for a real numeric id', async () => {
    expect.assertions(2);
    const created = await evaluationsService.create({
      ...EVALUATION_1,
      data: mockFile,
      userId: currentUser.id
    });

    const response = await fetch(`${baseUrl}/evaluations/${created.id}`);

    expect(response.status).toBe(200);
    const body = (await response.json()) as {id: string};
    expect(body.id).toBe(created.id);
  });

  it('still routes GET /evaluations/:id/groups to groupsForEvaluation', async () => {
    expect.assertions(2);
    const created = await evaluationsService.create({
      ...EVALUATION_1,
      data: mockFile,
      userId: currentUser.id
    });

    const response = await fetch(`${baseUrl}/evaluations/${created.id}/groups`);

    expect(response.status).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });
});
