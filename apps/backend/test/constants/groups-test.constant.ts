import { type Evaluation } from '../../src/evaluations/evaluation.model';
import { type GroupUser } from '../../src/group-users/group-user.model';
import { type CreateGroupDto } from '../../src/groups/dto/create-group.dto';
import { type UpdateGroupUserRoleDto } from '../../src/groups/dto/update-group-user.dto';
import { Group } from '../../src/groups/group.model';
import { type User } from '../../src/users/user.model';

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
  count: async (): Promise<number> => 1,
  create: async (_createGroupDto: CreateGroupDto): Promise<Group> => new Group(),
  async ensureGroupHasOwner(): Promise<void> {
    return;
  },
  findAll: async (): Promise<Group[]> => [],
  findByIds: async (_id: string[]): Promise<Group[]> => [],
  findByPkBang: async (_id: string): Promise<Group> => new Group(),
  remove: async (_groupToDelete: Group): Promise<Group> => new Group(),
  removeEvaluationFromGroup: async (_group: Group, _evaluation: Evaluation): Promise<Group> => new Group(),
  removeUserFromGroup: async (group: Group, user: User): Promise<Group> => group.$remove('user', user),
  update: async (_groupToUpdate: Group, _groupDto: CreateGroupDto): Promise<Group> => new Group(),
  updateGroupUserRole: async (_group: Group, _updateGroupUser: UpdateGroupUserRoleDto): Promise<GroupUser | undefined> => undefined,
};
