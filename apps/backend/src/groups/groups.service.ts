import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {Op} from 'sequelize';
import AppConfig from '../../config/app_config';
import {Evaluation} from '../evaluations/evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {User} from '../users/user.model';
import {CreateGroupDto} from './dto/create-group.dto';
import {UpdateGroupUserRoleDto} from './dto/update-group-user.dto';
import {Group} from './group.model';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group)
    private readonly groupModel: typeof Group
  ) {}

  async findAll(): Promise<Group[]> {
    return this.groupModel.findAll<Group>({include: 'users'});
  }

  async count(): Promise<number> {
    return this.groupModel.count();
  }

  async findByPkBang(id: string): Promise<Group> {
    // Users must be included for determining permissions on the group.
    // Other assocations should be called by their ID separately and not eagerly loaded.
    const group = await this.groupModel.findByPk(id, {include: 'users'});
    if (group === null) {
      throw new NotFoundException('Group with given id not found');
    } else {
      return group;
    }
  }

  async findByIds(id: string[]): Promise<Group[]> {
    return this.groupModel.findAll({
      where: {id: {[Op.in]: id}},
      include: 'users'
    });
  }

  async addUserToGroup(group: Group, user: User, role: string): Promise<void> {
    await group.$add('user', user, {
      through: {role: role, createdAt: new Date(), updatedAt: new Date()}
    });
  }

  async updateGroupUserRole(
    group: Group,
    updateGroupUser: UpdateGroupUserRoleDto
  ): Promise<GroupUser | undefined> {
    const groupUser = await GroupUser.findOne({
      where: {groupId: group.id, userId: updateGroupUser.userId}
    });
    if (groupUser) {
      await this.setDefaultToOwner(group, groupUser.userId);
    }
    return groupUser?.update({role: updateGroupUser.groupRole});
  }

  async removeUserFromGroup(group: Group, user: User): Promise<Group> {
    await this.setDefaultToOwner(group, user.id);
    return group.$remove('user', user);
  }

  async setDefaultToOwner(group: Group, id: string) {
    const owners = (await group.$get('users')).filter(
      (userOnGroup) => userOnGroup.GroupUser.role === 'owner'
    );
    // If there are no more owners, set an admin to owner
    if (owners.length < 2 && owners.some((owner) => owner.id === id)) {
      const appConfig = new AppConfig();
      // If default admin is not found, use admin with lowest ID
      const admin =
        (await User.findOne({
          where: {role: 'admin', email: appConfig.getDefaultAdmin()}
        })) ||
        (await User.findOne({
          where: {role: 'admin'},
          order: [['id', 'ASC']]
        }));
      if (admin !== null) {
        // If admin is in the group, promote it. If not, add as owner
        const adminId = admin.id;
        const adminInGroup = (await group.$get('users')).find(
          (userOnGroup) => userOnGroup.id === adminId
        );
        adminInGroup
          ? await adminInGroup.update({role: 'owner'})
          : await this.addUserToGroup(group, admin, 'owner');
      } else {
        // No admin found in system
        throw new ForbiddenException('No admin to be promoted');
      }
    }
  }

  async addEvaluationToGroup(
    group: Group,
    evaluation: Evaluation
  ): Promise<void> {
    await group.$add('evaluation', evaluation, {
      through: {createdAt: new Date(), updatedAt: new Date()}
    });
  }

  async removeEvaluationFromGroup(
    group: Group,
    evaluation: Evaluation
  ): Promise<Group> {
    return group.$remove('evaluation', evaluation);
  }

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const group = new Group(createGroupDto as any);
    return group.save();
  }

  async update(groupToUpdate: Group, groupDto: CreateGroupDto): Promise<Group> {
    groupToUpdate.update(groupDto);

    return groupToUpdate.save();
  }

  async remove(groupToDelete: Group): Promise<Group> {
    await groupToDelete.destroy();

    return groupToDelete;
  }
}
