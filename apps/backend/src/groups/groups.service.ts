import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {Op} from 'sequelize';
import {FindOptions} from 'sequelize/types';
import winston from 'winston';
import AppConfig from '../../config/app_config';
import {Evaluation} from '../evaluations/evaluation.model';
import {GroupUser} from '../group-users/group-user.model';
import {User} from '../users/user.model';
import {CreateGroupDto} from './dto/create-group.dto';
import {UpdateGroupUserRoleDto} from './dto/update-group-user.dto';
import {Group} from './group.model';
import {Build} from '../builds/build.model';
import {Product} from '../products/product.model';

@Injectable()
export class GroupsService {
  private readonly line = '_______________________________________________\n';
  public logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss Z'
      }),
      winston.format.printf(
        (info) =>
          `${this.line}[${[info.timestamp]}] (Group Service): ${info.message}`
      )
    )
  });
  constructor(
    @InjectModel(Group)
    private readonly groupModel: typeof Group,
    @InjectModel(User)
    private readonly userModel: typeof User
  ) {}

  async findAll(): Promise<Group[]> {
    return this.groupModel.findAll<Group>({include: 'users'});
  }

  async count(): Promise<number> {
    return this.groupModel.count();
  }

  async findOneBang(options?: FindOptions): Promise<Group> {
    const group = await this.groupModel.findOne<Group>(options);
    if (group === null) {
      throw new NotFoundException('Group with given name not found');
    } else {
      return group;
    }
  }

  // This method is used to find groups by group name,
  // primarily to sync user roles from an external provider
  async findByName(name: string): Promise<Group> {
    return this.findOneBang({
      where: {
        name
      }
    });
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

  async ensureGroupHasOwner(
    group: Group,
    user: User | GroupUser
  ): Promise<void> {
    const owners = (await group.$get('users')).filter(
      (userOnGroup) => userOnGroup.GroupUser.role === 'owner'
    );
    // If there are no more owners, set an admin to owner
    if (
      (owners.length < 2 &&
        owners.some(
          (owner) => owner.id === ('userId' in user ? user.userId : user.id)
        )) ||
      owners.length === 0
    ) {
      const appConfig = new AppConfig();
      // If default admin is not found, use admin with lowest ID
      const admin =
        (await this.userModel.findOne({
          where: {role: 'admin', email: appConfig.getDefaultAdmin()}
        })) ||
        (await this.userModel.findOne({
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
          ? await adminInGroup.GroupUser.update({role: 'owner'})
          : await this.addUserToGroup(group, admin, 'owner');
      } else {
        // No admin found in system
        throw new ForbiddenException('No admin to be promoted');
      }
    }
  }

  async updateGroupUserRole(
    group: Group,
    updateGroupUser: UpdateGroupUserRoleDto
  ): Promise<GroupUser | undefined> {
    const groupUser = await GroupUser.findOne({
      where: {groupId: group.id, userId: updateGroupUser.userId}
    });
    if (groupUser) {
      await this.ensureGroupHasOwner(group, groupUser);
    }
    return groupUser?.update({role: updateGroupUser.groupRole});
  }

  async removeUserFromGroup(group: Group, user: User): Promise<Group> {
    await this.ensureGroupHasOwner(group, user);
    return group.$remove('user', user);
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
    if (
      (await this.groupModel.findAll({where: {name: createGroupDto.name}}))
        .length > 0
    ) {
      throw new ForbiddenException(
        'Duplicate key detected. The names of groups must be unique.'
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const group = new Group(createGroupDto as any);
    return group.save();
  }

  async update(groupToUpdate: Group, groupDto: CreateGroupDto): Promise<Group> {
    if (
      (await this.groupModel.findAll({where: {name: groupDto.name}})).length > 1
    ) {
      throw new ForbiddenException(
        'Duplicate key detected. The names of groups must be unique.'
      );
    }
    return groupToUpdate.update(groupDto);
  }

  async remove(groupToDelete: Group): Promise<Group> {
    await groupToDelete.destroy();

    return groupToDelete;
  }

  async addBuildToGroup(group: Group, build: Build): Promise<void> {
    await group.$add('build', build, {
      through: {createdAt: new Date(), updatedAt: new Date()}
    });
  }

  async removeBuildFromGroup(
    group: Group,
    build: Build
  ): Promise<Group> {
    return group.$remove('build', build);
  }

  async addProductToGroup(group: Group, product: Product): Promise<void> {
    await group.$add('product', product, {
      through: {createdAt: new Date(), updatedAt: new Date()}
    });
  }

  async removeProductFromGroup(
    group: Group,
    product: Product
  ): Promise<Group> {
    return group.$remove('product', product);
  }

  // This method ensures that the passed in user is in all of the
  // passed in groups, as long as the group already exists.
  // It will additionally remove the user from any groups not in the list.
  // Called from oidc.strategy.ts, if OIDC_EXTERNAL_GROUPS is enabled
  async syncUserGroups(user: User, groups: string[]) {
    const currentGroups = await user.$get('groups', {include: [User]});
    const groupsToLeave = currentGroups.filter(
      (group) => !groups.includes(group.name)
    );

    // Remove user from any groups that they should not be in
    for (const groupToLeave of groupsToLeave) {
      try {
        await this.removeUserFromGroup(groupToLeave, user);
      } catch (err) {
        this.logger.warn(`Failed to remove user from group: ${err}`);
      }
    }

    const existingGroups: Group[] = [];

    // Find existing groups to add user to
    for (const group of groups) {
      try {
        const existingGroup = await this.findByName(group);
        existingGroups.push(existingGroup);
      } catch (err) {
        if (err instanceof NotFoundException) {
          this.logger.info('External group does not exist locally, skipping..');
        } else {
          this.logger.warn(err);
        }
      }
    }

    // Add user to existing groups that they aren't in yet
    await Promise.all(
      existingGroups
        .filter(
          (existingGroup) =>
            !currentGroups.some((group) => group.name === existingGroup.name)
        )
        .map((existingGroup) =>
          this.addUserToGroup(existingGroup, user, 'member')
        )
    );

    // Ensure we didn't leave any dangling groups
    await Promise.all(
      groupsToLeave.map(async (group) => {
        await this.ensureGroupHasOwner(group, user);
      })
    );
  }
}
