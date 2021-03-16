import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {Op} from 'sequelize';
import {Evaluation} from '../evaluations/evaluation.model';
import {User} from '../users/user.model';
import {CreateGroupDto} from './dto/create-group.dto';
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
      where: {id: {[Op.in]: id}}
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
}
