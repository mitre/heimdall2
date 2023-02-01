import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { GroupRelation } from './group-relation.model';

@Injectable()
export class GroupRelationsService {
  constructor(
    @InjectModel(GroupRelation)
    private readonly groupRelationModel: typeof GroupRelation
  ) { }

  async findAll(): Promise<GroupRelation[]> {
    return this.groupRelationModel.findAll<GroupRelation>({ include: 'users' });
  }

  async count(): Promise<number> {
    return this.groupRelationModel.count();
  }

  async findByPkBang(id: string): Promise<GroupRelation> {
    // Users must be included for determining permissions on the group.
    // Other assocations should be called by their ID separately and not eagerly loaded.
    const group = await this.groupRelationModel.findByPk(id, { include: 'users' });
    if (group === null) {
      throw new NotFoundException('Group with given id not found');
    } else {
      return group;
    }
  }

  async findByIds(id: string[]): Promise<GroupRelation[]> {
    return this.groupRelationModel.findAll({
      where: { id: { [Op.in]: id } },
      include: 'users'
    });
  }

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const group = new Group(createGroupDto);
    return group.save();
  }

  async update(groupToUpdate: GroupRelation, groupDto: CreateGroupDto): Promise<Group> {
    groupToUpdate.update(groupDto);

    return groupToUpdate.save();
  }

  async remove(groupRelationToDelete: GroupRelation): Promise<GroupRelation> {
    await groupRelationToDelete.destroy();

    return groupRelationToDelete;
  }
}
