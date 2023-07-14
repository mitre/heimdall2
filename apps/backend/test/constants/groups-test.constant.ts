import {Evaluation} from '../../src/evaluations/evaluation.model';
import {GroupUser} from '../../src/group-users/group-user.model';
import {CreateGroupDto} from '../../src/groups/dto/create-group.dto';
import {UpdateGroupUserRoleDto} from '../../src/groups/dto/update-group-user.dto';
import {Group} from '../../src/groups/group.model';
import {User} from '../../src/users/user.model';

export const GROUP_1 = {
  name: 'Heimdall Group',
  public: true
};

export const PRIVATE_GROUP = {
  name: 'Private Heimdall Group',
  public: false
};

export const UPDATE_GROUP: CreateGroupDto = {
  name: 'Updated Group',
  public: true
};

export const GROUPS_SERVICE_MOCK = {
  async findAll(): Promise<Group[]> {
    return [];
  },
  async count(): Promise<number> {
    return 1;
  },
  async findByPkBang(id: string): Promise<Group> {
    return new Group();
  },
  async findByIds(id: string[]): Promise<Group[]> {
    return [];
  },
  async addUserToGroup(
    group: Group,
    user: User,
    role: string
  ): Promise<void> {},
  async updateGroupUserRole(
    group: Group,
    updateGroupUser: UpdateGroupUserRoleDto
  ): Promise<GroupUser | undefined> {
    return undefined;
  },
  async removeUserFromGroup(group: Group, user: User): Promise<Group> {
    return group.$remove('user', user);
  },
  async setDefaultToOwner(): Promise<void> {},
  async addEvaluationToGroup(
    group: Group,
    evaluation: Evaluation
  ): Promise<void> {},
  async removeEvaluationFromGroup(
    group: Group,
    evaluation: Evaluation
  ): Promise<Group> {
    return new Group();
  },
  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    return new Group();
  },
  async update(groupToUpdate: Group, groupDto: CreateGroupDto): Promise<Group> {
    return new Group();
  },
  async remove(groupToDelete: Group): Promise<Group> {
    return new Group();
  }
};
