import {ForbiddenError} from '@casl/ability';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test, TestingModule} from '@nestjs/testing';
import {EVALUATION_1} from '../../test/constants/evaluations-test.constant';
import {
  GROUP_1,
  PRIVATE_GROUP,
  UPDATE_GROUP
} from '../../test/constants/groups-test.constant';
import {
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_2
} from '../../test/constants/users-test.constant';
import {AuthzService} from '../authz/authz.service';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Evaluation} from '../evaluations/evaluation.model';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {SlimUserDto} from '../users/dto/slim-user.dto';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {Group} from './group.model';
import {GroupsController} from './groups.controller';
import {GroupsService} from './groups.service';

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
        DatabaseModule,
        SequelizeModule.forFeature([
          Group,
          GroupUser,
          GroupEvaluation,
          Evaluation,
          EvaluationTag,
          User
        ])
      ],
      providers: [
        AuthzService,
        DatabaseService,
        GroupsService,
        UsersService,
        EvaluationsService
      ]
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

  afterAll((done) => {
    databaseService.closeConnection();
    done();
  });

  describe('Create', () => {
    it('should allow a user to create a group and make them owner', async () => {
      expect.assertions(3);

      const response = await groupsController.create(
        {user: basicUser},
        PRIVATE_GROUP
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

      const groups = await groupsController.findAll({user: basicUser});
      expect(groups.length).toEqual(1);
    });

    it('findAll should return all groups if the user explicitly is added to a private group', async () => {
      expect.assertions(1);

      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      const groups = await groupsController.findAll({user: basicUser});
      expect(groups.length).toEqual(2);
    });

    it('findForUser should return groups the user is a member of', async () => {
      expect.assertions(1);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');
      const groups = await groupsController.findForUser({user: basicUser});
      expect(groups.length).toEqual(1);
    });

    it('findForUser should return users in groups the user is a member of', async () => {
      const otherUser = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');
      await groupsService.addUserToGroup(privateGroup, otherUser, 'member');
      const groups = await groupsController.findForUser({user: basicUser});

      expect(groups[0].users).toContainEqual(new SlimUserDto(otherUser));
    });
  });

  describe('update', () => {
    let privateGroup: Group;

    beforeEach(async () => {
      privateGroup = await groupsService.create(PRIVATE_GROUP);
    });

    it('should allow owners of a group to update a group', async () => {
      expect.assertions(3);

      const owner = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, owner, 'owner');
      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      const response = await groupsController.update(
        {user: owner},
        privateGroup.id,
        UPDATE_GROUP
      );
      expect(response.id).toEqual(privateGroup.id);
      expect(response.name).toEqual(UPDATE_GROUP.name);
      expect(response.public).toEqual(UPDATE_GROUP.public);
    });

    it('should stop regular users and others from updating a group', async () => {
      expect.assertions(2);

      const owner = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, owner, 'owner');

      await expect(
        groupsController.update(
          {user: basicUser},
          privateGroup.id,
          UPDATE_GROUP
        )
      ).rejects.toBeInstanceOf(ForbiddenError);

      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      await expect(
        groupsController.update(
          {user: basicUser},
          privateGroup.id,
          UPDATE_GROUP
        )
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should allow owners to add users to a group', async () => {
      expect.assertions(1);

      const owner = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, owner, 'owner');

      await groupsController.addUserToGroup(
        privateGroup.id,
        {user: owner},
        {userId: basicUser.id, groupRole: 'member'}
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
          {user: basicUser},
          {userId: user.id, groupRole: 'member'}
        )
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should allow members to add an evaluation to a group', async () => {
      expect.assertions(1);
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        basicUser.id
      );
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');

      await groupsController.addEvaluationToGroup(
        privateGroup.id,
        {user: basicUser}, // Request
        {id: evaluation.id} // Dto
      );

      const groupEvaluations = await privateGroup.$get('evaluations');
      expect(groupEvaluations.length).toEqual(1);
    });

    it('should stop non-members from adding an evaluation to a group', async () => {
      expect.assertions(1);
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        basicUser.id
      );

      await expect(
        groupsController.addEvaluationToGroup(
          privateGroup.id,
          {user: basicUser},
          {id: evaluation.id}
        )
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should stop members from adding an evaluation they do not have access to', async () => {
      expect.assertions(1);
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        evaluationOwner.id
      );
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');

      await expect(
        groupsController.addEvaluationToGroup(
          privateGroup.id,
          {user: basicUser},
          {id: evaluation.id}
        )
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
        {user: owner},
        privateGroup.id
      );
      expect(response.id).toEqual(privateGroup.id);
      expect(response.name).toEqual(privateGroup.name);
      expect(response.public).toEqual(privateGroup.public);
    });

    it('should stop users and others from deleting a group', async () => {
      expect.assertions(2);

      await expect(
        groupsController.remove({user: basicUser}, privateGroup.id)
      ).rejects.toBeInstanceOf(ForbiddenError);

      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      await expect(
        groupsController.remove({user: basicUser}, privateGroup.id)
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should allow members to remove an evaluation', async () => {
      expect.assertions(2);
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        basicUser.id
      );
      await groupsService.addEvaluationToGroup(privateGroup, evaluation);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');
      expect((await privateGroup.$get('evaluations')).length).toEqual(1);
      await groupsController.removeEvaluationFromGroup(
        privateGroup.id,
        {user: basicUser},
        {id: evaluation.id}
      );
      expect((await privateGroup.$get('evaluations')).length).toEqual(0);
    });

    it('should prevent non-members from removing an evaluation', async () => {
      expect.assertions(1);
      const evaluationOwner = await usersService.create(
        CREATE_USER_DTO_TEST_OBJ_2
      );
      const evaluation = await evaluationsService.create(
        EVALUATION_1,
        {},
        evaluationOwner.id
      );
      await groupsService.addEvaluationToGroup(privateGroup, evaluation);

      await expect(
        groupsController.removeEvaluationFromGroup(
          privateGroup.id,
          {user: basicUser},
          {id: evaluation.id}
        )
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('should allow owners to remove members', async () => {
      expect.assertions(2);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'owner');
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, user, 'member');
      expect((await privateGroup.$get('users')).length).toEqual(2);
      await groupsController.removeUserFromGroup(
        privateGroup.id,
        {user: basicUser},
        {userId: user.id}
      );
      expect((await privateGroup.$get('users')).length).toEqual(1);
    });

    it('should allow owners to remove owners', async () => {
      expect.assertions(2);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'owner');
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, user, 'owner');
      expect((await privateGroup.$get('users')).length).toEqual(2);
      await groupsController.removeUserFromGroup(
        privateGroup.id,
        {user: basicUser},
        {userId: user.id}
      );
      expect((await privateGroup.$get('users')).length).toEqual(1);
    });

    it('should prevent non-owners from removing members', async () => {
      expect.assertions(1);
      await groupsService.addUserToGroup(privateGroup, basicUser, 'member');
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(privateGroup, user, 'member');
      await expect(
        groupsController.removeUserFromGroup(
          privateGroup.id,
          {user: basicUser},
          {userId: user.id}
        )
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });
});
