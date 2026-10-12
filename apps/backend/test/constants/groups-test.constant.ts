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
  addEvaluationToGroup(
    _group: Group,
    _evaluation: Evaluation,
  ): Promise<void> {
    return Promise.resolve();
  },
  addUserToGroup(
    _group: Group,
    _user: User,
    _role: string,
  ): Promise<void> {
    return Promise.resolve();
  },
  count(): Promise<number> {
    return Promise.resolve(1);
  },
  create(_createGroupDto: CreateGroupDto): Promise<Group> {
    return Promise.resolve(new Group());
  },
  ensureGroupHasOwner(): Promise<void> {
    return Promise.resolve();
  },
  findAll(): Promise<Group[]> {
    return Promise.resolve([]);
  },
  findByIds(_id: string[]): Promise<Group[]> {
    return Promise.resolve([]);
  },
  findByPkBang(_id: string): Promise<Group> {
    return Promise.resolve(new Group());
  },
  remove(_groupToDelete: Group): Promise<Group> {
    return Promise.resolve(new Group());
  },
  removeEvaluationFromGroup(
    _group: Group,
    _evaluation: Evaluation,
  ): Promise<Group> {
    return Promise.resolve(new Group());
  },
  removeUserFromGroup(group: Group, user: User): Promise<Group> {
    return group.$remove('user', user);
  },
  update(
    _groupToUpdate: Group,
    _groupDto: CreateGroupDto,
  ): Promise<Group> {
    return Promise.resolve(new Group());
  },
  updateGroupUserRole(
    _group: Group,
    _updateGroupUser: UpdateGroupUserRoleDto,
  ): Promise<GroupUser | undefined> {
    return Promise.resolve(undefined);
  },
};
