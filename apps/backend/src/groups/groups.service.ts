import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {Op} from 'sequelize';
import {FindOptions} from 'sequelize/types';
import winston from 'winston';
import {Evaluation} from '../evaluations/evaluation.model';
import {User} from '../users/user.model';
import {CreateGroupDto} from './dto/create-group.dto';
import {Group} from './group.model';
@Injectable()
export class GroupsService {
  public logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss Z'
      }),
      winston.format.printf((info) => `[${[info.timestamp]}] ${info.message}`)
    )
  });
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

  async removeUserFromGroup(group: Group, user: User): Promise<Group> {
    const owners = (await group.$get('users')).filter(
      (userOnGroup) => userOnGroup.GroupUser.role === 'owner'
    );
    if (owners.length < 2 && owners.some((owner) => owner.id === user.id)) {
      throw new ForbiddenException(
        'Cannot remove only group owner, please promote another user to owner first'
      );
    }
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
    const group = new Group(createGroupDto);
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

  // This method ensures that the passed in user is in all of the
  // passed in groups, as long as the group already exists.
  // It will additionally remove the user from any groups not in the list.
  // Called from oidc.strategy.ts, if OIDC_EXTERNAL_GROUPS is enabled
  async syncUserGroups(user: User, groups: string[]) {
    const currentGroups = await user.$get('groups', {include: [User]});
    const groupsToLeave = currentGroups.filter(
      (group) => !groups.includes(group.name)
    );
    const existingGroups: Group[] = [];

    // Remove user from any groups that they should not be in
    for (const groupToLeave of groupsToLeave) {
      try {
        await this.removeUserFromGroup(groupToLeave, user);
      } catch (err) {
        this.logger.warn(`Failed to remove user from group: ${err}`);
      }
    }

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
    for (const existingGroup of existingGroups) {
      if (!currentGroups.some((group) => group.name === existingGroup.name)) {
        this.addUserToGroup(existingGroup, user, 'member');
      }
    }
  }
}
