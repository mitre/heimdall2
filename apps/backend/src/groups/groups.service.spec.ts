import {ForbiddenException, NotFoundException} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test} from '@nestjs/testing';
import {
  EVALUATION_1,
  EVALUATION_WITH_TAGS_1
} from '../../test/constants/evaluations-test.constant';
import {GROUP_1} from '../../test/constants/groups-test.constant';
import {
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_2
} from '../../test/constants/users-test.constant';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTagDto} from '../evaluation-tags/dto/evaluation-tag.dto';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Evaluation} from '../evaluations/evaluation.model';
import {EvaluationsModule} from '../evaluations/evaluations.module';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {GroupEvaluationsModule} from '../group-evaluations/group-evaluations.module';
import {GroupUsersModule} from '../group-users/group-users.module';
import {UserDto} from '../users/dto/user.dto';
import {UsersModule} from '../users/users.module';
import {UsersService} from '../users/users.service';
import {Group} from './group.model';
import {GroupsService} from './groups.service';

describe('GroupsService', () => {
  let groupsService: GroupsService;
  let databaseService: DatabaseService;
  let usersService: UsersService;
  let evaluationsService: EvaluationsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([Group, Evaluation]),
        GroupEvaluationsModule,
        GroupUsersModule,
        EvaluationsModule,
        UsersModule
      ],
      providers: [
        GroupsService,
        DatabaseService,
        UsersService,
        EvaluationsService
      ]
    }).compile();

    groupsService = module.get<GroupsService>(GroupsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    usersService = module.get<UsersService>(UsersService);
    evaluationsService = module.get<EvaluationsService>(EvaluationsService);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
  });

  describe('findAll', () => {
    it('should find all groups', async () => {
      const groupsDtoArray = await groupsService.findAll();
      expect(groupsDtoArray).toEqual([]);
    });
  });

  describe('findByPkBang', () => {
    it('should throw a not found exception when the given id is not found', async () => {
      expect.assertions(1);
      await expect(groupsService.findByPkBang('0')).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('should include the group users', async () => {
      const group = await groupsService.create(GROUP_1);
      await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const user = await usersService.findByEmail(
        CREATE_USER_DTO_TEST_OBJ.email
      );
      await groupsService.addUserToGroup(group, user, 'owner');
      const foundGroup = await groupsService.findByPkBang(group.id);
      expect(new UserDto(foundGroup.users[0])).toEqual(new UserDto(user));
    });

    it('should not include the group evaluations by default', async () => {
      const group = await groupsService.create(GROUP_1);
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const evaluation = await evaluationsService.create(EVALUATION_1, user.id);
      await groupsService.addEvaluationToGroup(group, evaluation);
      const foundGroup = await groupsService.findByPkBang(group.id);
      expect(foundGroup.evaluations).not.toBeDefined();
    });
  });

  describe('addUserToGroup', () => {
    it('should add a user to a group', async () => {
      const group = await groupsService.create(GROUP_1);
      await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const user = await usersService.findByEmail(
        CREATE_USER_DTO_TEST_OBJ.email
      );
      await groupsService.addUserToGroup(group, user, 'owner');
      const groupUsers = await group.$get('users');
      const firstUser = groupUsers[0];
      expect(groupUsers).toHaveLength(1);
      expect(firstUser.GroupUser.role).toEqual('owner');
      expect(firstUser.email).toEqual(user.email);
    });
  });

  describe('removeUserFromGroup', () => {
    it('should remove a user from a group', async () => {
      const group = await groupsService.create(GROUP_1);
      await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const groupOwner = await usersService.findByEmail(
        CREATE_USER_DTO_TEST_OBJ.email
      );
      const groupMember = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);
      await groupsService.addUserToGroup(group, groupOwner, 'owner');
      await groupsService.addUserToGroup(group, groupMember, 'member');
      expect(await group.$get('users')).toHaveLength(2);
      await groupsService.removeUserFromGroup(group, groupMember);
      const groupUsers = await group.$get('users');
      expect(groupUsers).toHaveLength(1);
      expect(groupUsers[0].GroupUser.role).not.toEqual('member');
      expect(groupUsers[0].email).not.toEqual(groupMember.email);
    });

    it('should not remove the last owner from a group', async () => {
      expect.assertions(1);
      const group = await groupsService.create(GROUP_1);
      await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const groupOwner = await usersService.findByEmail(
        CREATE_USER_DTO_TEST_OBJ.email
      );
      await groupsService.addUserToGroup(group, groupOwner, 'owner');
      await expect(
        groupsService.removeUserFromGroup(group, groupOwner)
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('addEvaluationToGroup', () => {
    it('should add an evaluation to a group', async () => {
      const group = await groupsService.create(GROUP_1);
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const evaluation = await evaluationsService.create(
        EVALUATION_WITH_TAGS_1,
        user.id
      );
      await groupsService.addEvaluationToGroup(group, evaluation);
      const groupEvaluations = await group.$get('evaluations', {
        include: [{model: EvaluationTag}]
      });
      evaluation.reload;
      expect(groupEvaluations).toHaveLength(1);
      expect(groupEvaluations[0].filename).toEqual(evaluation.filename);
      expect(groupEvaluations[0].data).toEqual(evaluation.data);
      expect(
        new EvaluationTagDto(groupEvaluations[0].evaluationTags[0])
      ).toEqual(new EvaluationTagDto(evaluation.evaluationTags[0]));
    });
  });

  describe('removeEvaluationFromGroup', () => {
    it('should remove an evaluation from a group', async () => {
      const group = await groupsService.create(GROUP_1);
      const user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
      const evaluationOne = await evaluationsService.create(EVALUATION_1, user.id);
      const evaluationTwo = await evaluationsService.create(
        EVALUATION_WITH_TAGS_1,
        user.id
      );
      await groupsService.addEvaluationToGroup(group, evaluationOne);
      await groupsService.addEvaluationToGroup(group, evaluationTwo);
      expect(await group.$get('evaluations')).toHaveLength(2);
      await groupsService.removeEvaluationFromGroup(group, evaluationOne);
      const groupEvaluations = await group.$get('evaluations', {
        include: [{model: EvaluationTag}]
      });
      expect(groupEvaluations).toHaveLength(1);
      expect(groupEvaluations[0].filename).toEqual(evaluationTwo.filename);
      expect(groupEvaluations[0].data).toEqual(evaluationTwo.data);
      expect(
        new EvaluationTagDto(groupEvaluations[0].evaluationTags[0])
      ).toEqual(new EvaluationTagDto(evaluationTwo.evaluationTags[0]));
    });
  });

  describe('create', () => {
    it('should create a group', async () => {
      const group = await groupsService.create(GROUP_1);
      expect(group.id).toBeDefined();
      expect(group.name).toEqual(GROUP_1.name);
      expect(group.public).toEqual(GROUP_1.public);
      expect(group.updatedAt).toBeDefined();
      expect(group.createdAt).toBeDefined();
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
