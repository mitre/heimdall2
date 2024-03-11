import {Evaluation} from '../../src/evaluations/evaluation.model';
import {GroupUser} from '../../src/group-users/group-user.model';
import {CreateGroupDto} from '../../src/groups/dto/create-group.dto';
import {UpdateGroupUserRoleDto} from '../../src/groups/dto/update-group-user.dto';
import {Group} from '../../src/groups/group.model';
import {User} from '../../src/users/user.model';

export const GROUP_1 = {
  name: 'Heimdall Group',
  public: true,
  desc: ''
};

export const PRIVATE_GROUP = {
  name: 'Private Heimdall Group',
  public: false,
  desc: 'Test description'
};

export const UPDATE_GROUP: CreateGroupDto = {
  name: 'Updated Group',
  public: true,
  desc: 'Updated test description'
};

export const GROUPS_SERVICE_MOCK = {
  async findAll(): Promise<Group[]> {
    return [];
  },
  async count(): Promise<number> {
    return 1;
  },
  async findByPkBang(_id: string): Promise<Group> {
    return new Group();
  },
  async findByIds(_id: string[]): Promise<Group[]> {
    return [];
  },
  async addUserToGroup(
    _group: Group,
    _user: User,
    _role: string
  ): Promise<void> {
    return;
  },
  async updateGroupUserRole(
    _group: Group,
    _updateGroupUser: UpdateGroupUserRoleDto
  ): Promise<GroupUser | undefined> {
    return undefined;
  },
  async removeUserFromGroup(group: Group, user: User): Promise<Group> {
    return group.$remove('user', user);
  },
  async ensureGroupHasOwner(): Promise<void> {
    return;
  },
  async addEvaluationToGroup(
    _group: Group,
    _evaluation: Evaluation
  ): Promise<void> {
    return;
  },
  async removeEvaluationFromGroup(
    _group: Group,
    _evaluation: Evaluation
  ): Promise<Group> {
    return new Group();
  },
  async create(_createGroupDto: CreateGroupDto): Promise<Group> {
    return new Group();
  },
  async update(
    _groupToUpdate: Group,
    _groupDto: CreateGroupDto
  ): Promise<Group> {
    return new Group();
  },
  async remove(_groupToDelete: Group): Promise<Group> {
    return new Group();
  }
};
