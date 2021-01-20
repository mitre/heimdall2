import {NotFoundException} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test} from '@nestjs/testing';
import {GROUP_1} from '../../test/constants/groups-test.constant';
import {CREATE_USER_DTO_TEST_OBJ, USER_ONE_DTO} from '../../test/constants/users-test.constant';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationsModule} from '../evaluations/evaluations.module';
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
  let user: UserDto;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([Group]),
        GroupEvaluationsModule,
        GroupUsersModule,
        EvaluationsModule,
        UsersModule
      ],
      providers: [GroupsService, DatabaseService, UsersService]
    }).compile();

    groupsService = module.get<GroupsService>(GroupsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    usersService = module.get<UsersService>(UsersService);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
  });

  describe('findAll', () => {
    it('should find all groups', async () => {
      let groupsDtoArray = await groupsService.findAll();
      expect(groupsDtoArray).toEqual([]);
    });
  });

  describe('addUserToGroup', () => {
    it('should add a user to a group', async () => {
      const group = await groupsService.create(GROUP_1);
      const user = await usersService.findByEmail(CREATE_USER_DTO_TEST_OBJ.email);
      await groupsService.addUserToGroup(group, user, 'owner');
      const groupUsers = await group.$get('users');
      const firstUser = groupUsers[0];
      expect(groupUsers).toHaveLength(1);
      expect(firstUser.GroupUser.role).toEqual('owner');
      expect(firstUser.email).toEqual(user.email);
    })
  })

  describe('create', () => {
    it('should create a group', async () => {
      const group = await groupsService.create(GROUP_1);
      expect(group.id).toBeDefined();
      expect(group.name).toEqual(GROUP_1.name);
      expect(group.public).toEqual(GROUP_1.public);
      expect(group.updatedAt).toBeDefined();
      expect(group.createdAt).toBeDefined();
    })
  })

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
