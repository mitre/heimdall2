import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {Op} from 'sequelize';
import {AddGroupRelationDto} from './dto/add-group-relation.dto';
import {UpdateGroupRelationDto} from './dto/update-group-relation.dto';
import {GroupRelation} from './group-relation.model';

@Injectable()
export class GroupRelationsService {
  constructor(
    @InjectModel(GroupRelation)
    private readonly groupRelationModel: typeof GroupRelation
  ) {}

  async findAll(): Promise<GroupRelation[]> {
    return this.groupRelationModel.findAll<GroupRelation>();
  }

  async count(): Promise<number> {
    return this.groupRelationModel.count();
  }

  async findByPkBang(id: string): Promise<GroupRelation> {
    const groupRelation = await this.groupRelationModel.findByPk(id);
    if (groupRelation === null) {
      throw new NotFoundException('GroupRelation with given id not found');
    } else {
      return groupRelation;
    }
  }

  async findByIds(id: string[]): Promise<GroupRelation[]> {
    return this.groupRelationModel.findAll({
      where: {id: {[Op.in]: id}}
    });
  }

  async create(
    addGroupRelationDto: AddGroupRelationDto
  ): Promise<GroupRelation> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groupRelation = new GroupRelation(addGroupRelationDto as any);
    return groupRelation.save();
  }

  async update(
    groupRelationToUpdate: GroupRelation,
    updateGroupRelationDto: UpdateGroupRelationDto
  ) {
    groupRelationToUpdate.update(updateGroupRelationDto);

    return groupRelationToUpdate.save();
  }

  async remove(groupRelationToDelete: GroupRelation): Promise<GroupRelation> {
    await groupRelationToDelete.destroy();

    return groupRelationToDelete;
  }

  async getAdjacentRelations(parentId: string): Promise<GroupRelation[]> {
    return (await this.findAll()).filter(
      (relation) => relation.parentId === parentId
    );
  }

  async getAdjacentDescendants(parentId: string): Promise<string[]> {
    return (await this.getAdjacentRelations(parentId)).map(
      (relation) => relation.childId
    );
  }

  async getAllDescendants(parentId: string): Promise<string[]> {
    let descendants: string[] = [];
    const adjacentRelations = await this.getAdjacentRelations(parentId);
    for (const relation of adjacentRelations) {
      descendants.push(relation.childId);
      descendants = descendants.concat(
        await this.getAllDescendants(relation.childId)
      );
    }
    return descendants;
  }
}
