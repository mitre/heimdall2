import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CreateGroupRelationDto } from './dto/create-group-relation.dto';
import { GroupRelation } from './group-relation.model';

@Injectable()
export class GroupRelationsService {
  constructor(
    @InjectModel(GroupRelation)
    private readonly groupRelationModel: typeof GroupRelation
  ) { }

  async findAll(): Promise<GroupRelation[]> {
    return this.groupRelationModel.findAll<GroupRelation>();
  }

  async count(): Promise<number> {
    return this.groupRelationModel.count();
  }

  async findByPkBang(id: string): Promise<GroupRelation> {
    // Users must be included for determining permissions on the group.
    // Other assocations should be called by their ID separately and not eagerly loaded.
    const groupRelation = await this.groupRelationModel.findByPk(id);
    if (groupRelation === null) {
      throw new NotFoundException('Group relation with given id not found');
    } else {
      return groupRelation;
    }
  }

  async findByIds(id: string[]): Promise<GroupRelation[]> {
    return this.groupRelationModel.findAll({
      where: { id: { [Op.in]: id } }
    });
  }

  async create(createGroupRelationDto: CreateGroupRelationDto): Promise<GroupRelation> {
    const group = new GroupRelation(createGroupRelationDto);
    return group.save();
  }

  async update(groupRelationToUpdate: GroupRelation, groupRelationDto: CreateGroupRelationDto): Promise<GroupRelation> {
    groupRelationToUpdate.update(groupRelationDto);

    return groupRelationToUpdate.save();
  }

  async remove(groupRelationToDelete: GroupRelation): Promise<GroupRelation> {
    await groupRelationToDelete.destroy();

    return groupRelationToDelete;
  }
}
