import {ForbiddenError} from '@casl/ability';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test, TestingModule} from '@nestjs/testing';
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
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
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
      providers: [AuthzService, DatabaseService, GroupsService, UsersService]
    }).compile();

    groupsService = module.get<GroupsService>(GroupsService);
    groupsController = module.get<GroupsController>(GroupsController);
    databaseService = module.get<DatabaseService>(DatabaseService);
    usersService = module.get<UsersService>(UsersService);
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

    it('should only return public groups and groups the user is explicitly added to', async () => {
      expect.assertions(1);

      const groups = await groupsController.findAll({user: basicUser});
      expect(groups.length).toEqual(1);
    });

    it('should return all groups if the user explicitly is added to a private group', async () => {
      expect.assertions(1);

      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      const groups = await groupsController.findAll({user: basicUser});
      expect(groups.length).toEqual(2);
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
      const privateGroup = await groupsService.create(PRIVATE_GROUP);
      await groupsService.addUserToGroup(privateGroup, owner, 'owner');
      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      const response = await groupsController.update(
        {user: basicUser},
        privateGroup.id,
        UPDATE_GROUP
      );
      expect(response.id).toEqual(privateGroup.id);
      expect(response.name).toEqual(UPDATE_GROUP.name);
      expect(response.public).toEqual(UPDATE_GROUP.public);
    });

    it('should stop users and others from updating a group', async () => {
      expect.assertions(2);

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
  });

  describe('delete', () => {
    let privateGroup: Group;

    beforeEach(async () => {
      privateGroup = await groupsService.create(PRIVATE_GROUP);
    });

    it('should allow owners of a group to delete a group', async () => {
      expect.assertions(3);

      const owner = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      const privateGroup = await groupsService.create(PRIVATE_GROUP);
      await groupsService.addUserToGroup(privateGroup, owner, 'owner');
      await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

      const response = await groupsController.update(
        {user: basicUser},
        privateGroup.id,
        UPDATE_GROUP
      );
      expect(response.id).toEqual(privateGroup.id);
      expect(response.name).toEqual(UPDATE_GROUP.name);
      expect(response.public).toEqual(UPDATE_GROUP.public);
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
  });
});
