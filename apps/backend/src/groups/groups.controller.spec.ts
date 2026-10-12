import type { AddressInfo } from 'node:net';
import { ForbiddenError } from '@casl/ability';
import type { ExecutionContext, INestApplication } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { EVALUATION_1 } from '../../test/constants/evaluations-test.constant';
import {
  GROUP_1,
  PRIVATE_GROUP,
  UPDATE_GROUP,
} from '../../test/constants/groups-test.constant';
import {
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_2,
} from '../../test/constants/users-test.constant';
import { AuthzService } from '../authz/authz.service';
import { ConfigModule } from '../config/config.module';
import { CryptoModule } from '../crypto/crypto.module';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { EvaluationTag } from '../evaluation-tags/evaluation-tag.model';
import { Evaluation } from '../evaluations/evaluation.model';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { GroupEvaluation } from '../group-evaluations/group-evaluation.model';
import { GroupUser } from '../group-users/group-user.model';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SlimUserDto } from '../users/dto/slim-user.dto';
import { User } from '../users/user.model';
import { UsersService } from '../users/users.service';
import { Group } from './group.model';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

describe('GroupsController', () => {
  let groupsController: GroupsController;
  let groupsService: GroupsService;
  let databaseService: DatabaseService;
  let usersService: UsersService;
  let evaluationsService: EvaluationsService;
  let module: TestingModule;

  let basicUser: User;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [GroupsController],
      imports: [
        ConfigModule,
        CryptoModule,
        DatabaseModule,
        SequelizeModule.forFeature([
          Group,
          GroupUser,
          GroupEvaluation,
          Evaluation,
          EvaluationTag,
          User,
        ]),
      ],
      providers: [
        AuthzService,
        DatabaseService,
        GroupsService,
        UsersService,
        EvaluationsService,
      ],
    }).compile();

    groupsService = module.get<GroupsService>(GroupsService);
    groupsController = module.get<GroupsController>(GroupsController);
    databaseService = module.get<DatabaseService>(DatabaseService);
    usersService = module.get<UsersService>(UsersService);
    evaluationsService = module.get<EvaluationsService>(EvaluationsService);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    basicUser = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
  });

  afterAll(async () => {
    await databaseService.closeConnection();
  });

  describe('Create', () => {
    it('should allow a user to create a group and make them owner', async () => {
      expect.assertions(3);

      const response = await groupsController.create(
        { user: basicUser },
        PRIVATE_GROUP,
      );
      const group = await groupsService.findByPkBang(response.id);
      expect(response.name).toEqual(PRIVATE_GROUP.name);
      expect(group.users[0].id).toEqual(basicUser.id);
      expect(group.users[0].GroupUser.role).toEqual('owner');
    });
  });

  describe('Read', () => {
    let privateGroup: Group;

    beforeEach(async () => {
      await groupsService.create(GROUP_1);
      privateGroup = await groupsService.create(PRIVATE_GROUP);
    });

    it('findAll should only return public groups and groups the user is explicitly added to', async () => {
      expect.assertions(1);

      const groups = await groupsController.findAll({ user: basicUser });
      expect(groups.length).toEqual(1);
    });

    it('findAll should return all groups if the user explicitly is added to a private group', async () => {
      expect.assertions(1);

      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      const groups = await groupsController.findAll({ user: basicUser });
      expect(groups.length).toEqual(2);
    });

    it('findForUser should return groups the user is a member of', async () => {
      expect.assertions(1);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');
      const allGroups = await groupsService.findAll();
      const publicGroups = allGroups.filter(
        group => group.public && group.id !== privateGroup.id,
      );
      const groups = await groupsController.findForUser({ user: basicUser });
      expect(groups.length).toEqual(1 + publicGroups.length);
    });

    it('findForUser should return users in groups the user is a member of', async () => {
      const otherUser = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');
      await groupsService.addUserToGroup(privateGroup, otherUser, 'member');
      const groups = await groupsController.findForUser({ user: basicUser });

      expect(groups[0].users).toContainEqual(
        new SlimUserDto(otherUser, 'member'),
      );
    });
  });

  describe('update', () => {
    let privateGroup: Group;

    beforeEach(async () => {
      privateGroup = await groupsService.create(PRIVATE_GROUP);
    });

    it('should allow owners of a group to update a group', async () => {
      expect.assertions(4);

      const owner = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, owner, 'owner');
      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      const response = await groupsController.update(
        { user: owner },
        privateGroup.id,
        UPDATE_GROUP,
      );
      expect(response.id).toEqual(privateGroup.id);
      expect(response.name).toEqual(UPDATE_GROUP.name);
      expect(response.public).toEqual(UPDATE_GROUP.public);
      expect(response.desc).toEqual(UPDATE_GROUP.desc);
    });

    it('should stop regular users and others from updating a group', async () => {
      expect.assertions(2);

      const owner = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, owner, 'owner');

      await expect(
        groupsController.update(
          { user: basicUser },
          privateGroup.id,
          UPDATE_GROUP,
        ),
      ).rejects.toBeInstanceOf(ForbiddenError);

      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      await expect(
        groupsController.update(
          { user: basicUser },
          privateGroup.id,
          UPDATE_GROUP,
        ),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should allow owners to add users to a group', async () => {
      expect.assertions(1);

      const owner = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, owner, 'owner');

      await groupsController.addUserToGroup(
        privateGroup.id,
        { user: owner },
        { groupRole: 'member', userId: basicUser.id },
      );

      const groupMembers = await privateGroup.$get('users');
      expect(groupMembers.length).toEqual(2);
    });

    it('should stop non-owners from adding users to a group', async () => {
      expect.assertions(1);
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');

      await expect(
        groupsController.addUserToGroup(
          privateGroup.id,
          { user: basicUser },
          { groupRole: 'member', userId: user.id },
        ),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should allow members to add an evaluation to a group', async () => {
      expect.assertions(1);
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: {},
        userId: basicUser.id,
      });
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');

      await groupsController.addEvaluationToGroup(
        privateGroup.id,
        { user: basicUser },
        { id: evaluation.id },
      );

      const groupEvaluations = await privateGroup.$get('evaluations');
      expect(groupEvaluations.length).toEqual(1);
    });

    it('should stop non-members from adding an evaluation to a group', async () => {
      expect.assertions(1);
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: {},
        userId: basicUser.id,
      });

      await expect(
        groupsController.addEvaluationToGroup(
          privateGroup.id,
          { user: basicUser },
          { id: evaluation.id },
        ),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should stop members from adding an evaluation they do not have access to', async () => {
      expect.assertions(1);
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2,
      );
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: {},
        userId: evaluationOwner.id,
      });
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');

      await expect(
        groupsController.addEvaluationToGroup(
          privateGroup.id,
          { user: basicUser },
          { id: evaluation.id },
        ),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('delete', () => {
    let privateGroup: Group;

    beforeEach(async () => {
      privateGroup = await groupsService.create(PRIVATE_GROUP);
    });

    it('should allow owners of a group to delete a group', async () => {
      const owner = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, owner, 'owner');
      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      const response = await groupsController.remove(
        { user: owner },
        privateGroup.id,
      );
      expect(response.id).toEqual(privateGroup.id);
      expect(response.name).toEqual(privateGroup.name);
      expect(response.public).toEqual(privateGroup.public);
      expect(response.desc).toEqual(privateGroup.desc);
    });

    it('should stop users and others from deleting a group', async () => {
      expect.assertions(2);

      await expect(
        groupsController.remove({ user: basicUser }, privateGroup.id),
      ).rejects.toBeInstanceOf(ForbiddenError);

      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      await expect(
        groupsController.remove({ user: basicUser }, privateGroup.id),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should allow members to remove an evaluation', async () => {
      expect.assertions(2);
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: {},
        userId: basicUser.id,
      });
      await groupsService.addEvaluationToGroup(privateGroup, evaluation);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');
      const evaluationsBeforeRemove = await privateGroup.$get('evaluations');
      expect(evaluationsBeforeRemove.length).toEqual(1);
      await groupsController.removeEvaluationFromGroup(
        privateGroup.id,
        { user: basicUser },
        { id: evaluation.id },
      );
      const evaluationsAfterRemove = await privateGroup.$get('evaluations');
      expect(evaluationsAfterRemove.length).toEqual(0);
    });

    it('should prevent non-members from removing an evaluation', async () => {
      expect.assertions(1);
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2,
      );
      const evaluation = await evaluationsService.create({
        ...EVALUATION_1,
        data: {},
        userId: evaluationOwner.id,
      });
      await groupsService.addEvaluationToGroup(privateGroup, evaluation);

      await expect(
        groupsController.removeEvaluationFromGroup(
          privateGroup.id,
          { user: basicUser },
          { id: evaluation.id },
        ),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should allow owners to remove members', async () => {
      expect.assertions(2);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'owner');
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, user, 'member');
      const usersBeforeRemove = await privateGroup.$get('users');
      expect(usersBeforeRemove.length).toEqual(2);
      await groupsController.removeUserFromGroup(
        privateGroup.id,
        { user: basicUser },
        { userId: user.id },
      );
      const usersAfterRemove = await privateGroup.$get('users');
      expect(usersAfterRemove.length).toEqual(1);
    });

    it('should allow owners to remove owners', async () => {
      expect.assertions(2);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'owner');
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, user, 'owner');
      const usersBeforeRemove = await privateGroup.$get('users');
      expect(usersBeforeRemove.length).toEqual(2);
      await groupsController.removeUserFromGroup(
        privateGroup.id,
        { user: basicUser },
        { userId: user.id },
      );
      const usersAfterRemove = await privateGroup.$get('users');
      expect(usersAfterRemove.length).toEqual(1);
    });

    it('should prevent non-owners from removing members', async () => {
      expect.assertions(1);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, user, 'member');
      await expect(
        groupsController.removeUserFromGroup(
          privateGroup.id,
          { user: basicUser },
          { userId: user.id },
        ),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });
});

// Route resolution is a ROUTER concern, not a handler concern: calling
// groupsController.findForUser() directly succeeds no matter what order the
// decorators are declared in, so the unit tests above cannot detect route
// shadowing. These tests boot the real Nest application and issue real HTTP
// requests so the actual registered routing table is what gets exercised.
// Node's built-in fetch is used deliberately — supertest is not a dependency
// of this repo and adding one to reach a routing assertion is not warranted.
describe('GroupsController route resolution', () => {
  let app: INestApplication;
  let baseUrl: string;
  let module: TestingModule;
  let databaseService: DatabaseService;
  let usersService: UsersService;
  let groupsService: GroupsService;
  // The overridden guard reads this at request time, so each test's freshly
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
      controllers: [GroupsController],
      imports: [
        ConfigModule,
        CryptoModule,
        DatabaseModule,
        SequelizeModule.forFeature([
          Group,
          GroupUser,
          GroupEvaluation,
          Evaluation,
          EvaluationTag,
          User,
        ]),
      ],
      providers: [
        AuthzService,
        DatabaseService,
        GroupsService,
        UsersService,
        EvaluationsService,
      ],
    })
      // Auth is not what these tests are about; the routing table is.
      .overrideGuard(JwtAuthGuard)
      .useValue(allowWithCurrentUser)
      .compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    usersService = module.get<UsersService>(UsersService);
    groupsService = module.get<GroupsService>(GroupsService);

    app = module.createNestApplication();
    await app.init();
    // Port 0 = ephemeral, so this never collides with a dev server.
    await app.listen(0);
    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${String(address.port)}`;
  });

  afterAll(async () => {
    // Order matters: app.close() tears down the Nest app INCLUDING its
    // Sequelize connection, so the cleanup query has to run first.
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

  it('routes GET /groups/my to findForUser, not to the :id handler', async () => {
    expect.assertions(2);
    const response = await fetch(`${baseUrl}/groups/my`);

    // If ':id' is declared first, Nest dispatches this to findById, which
    // hands the literal string "my" to Postgres as a bigint and 500s with
    // 'invalid input syntax for type bigint'. That is the exact regression
    // ESLint's class-member sorting introduced in 3bdd1f146 — and it broke
    // GUI login outright, because the login handler calls /groups/my.
    expect(response.status).toBe(200);
    // findForUser returns a LIST; findById returns a single object.
    expect(Array.isArray(await response.json())).toBe(true);
  });

  it('still routes GET /groups/:id to findById for a real numeric id', async () => {
    expect.assertions(2);
    const created = await groupsService.create(GROUP_1);

    const response = await fetch(`${baseUrl}/groups/${created.id}`);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { id: string };
    expect(body.id).toBe(created.id);
  });
});
