import type { Evaluation } from '../../src/evaluations/evaluation.model';
import type { GroupUser } from '../../src/group-users/group-user.model';
import type { CreateGroupDto } from '../../src/groups/dto/create-group.dto';
import type { UpdateGroupUserRoleDto } from '../../src/groups/dto/update-group-user.dto';
import { Group } from '../../src/groups/group.model';
import type { User } from '../../src/users/user.model';

export const GROUP_1 = {
  desc: '',
  name: 'Heimdall Group',
  public: true,
};

export const PRIVATE_GROUP = {
  desc: 'Test description',
  name: 'Private Heimdall Group',
  public: false,
};

export const UPDATE_GROUP: CreateGroupDto = {
  desc: 'Updated test description',
  name: 'Updated Group',
  public: true,
};

export const GROUPS_SERVICE_MOCK = {
  async addEvaluationToGroup(
    _group: Group,
    _evaluation: Evaluation,
  ): Promise<void> {
    return;
  },
  async addUserToGroup(
    _group: Group,
    _user: User,
    _role: string,
  ): Promise<void> {
    return;
  },
  async count(): Promise<number> {
    return 1;
  },
  async create(_createGroupDto: CreateGroupDto): Promise<Group> {
    return new Group();
  },
  async ensureGroupHasOwner(): Promise<void> {
    return;
  },
  async findAll(): Promise<Group[]> {
    return [];
  },
  async findByIds(_id: string[]): Promise<Group[]> {
    return [];
  },
  async findByPkBang(_id: string): Promise<Group> {
    return new Group();
  },
  async remove(_groupToDelete: Group): Promise<Group> {
    return new Group();
  },
  async removeEvaluationFromGroup(
    _group: Group,
    _evaluation: Evaluation,
  ): Promise<Group> {
    return new Group();
  },
  async removeUserFromGroup(group: Group, user: User): Promise<Group> {
    return group.$remove('user', user);
  },
  async update(
    _groupToUpdate: Group,
    _groupDto: CreateGroupDto,
  ): Promise<Group> {
    return new Group();
  },
  async updateGroupUserRole(
    _group: Group,
    _updateGroupUser: UpdateGroupUserRoleDto,
  ): Promise<GroupUser | undefined> {
    return undefined;
  },
};
