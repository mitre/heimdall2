import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {User} from '../users/user.model';
import {CreateGroupDto} from './dto/create-group.dto';
import {Group} from './group.model';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group)
    private groupModel: typeof Group
  ) {}

  async findAll(): Promise<Group[]> {
    return this.groupModel.findAll<Group>({include: 'users'});
  }

  async findByPkBang(id: string): Promise<Group> {
    const group = await this.groupModel.findByPk(id, {include: 'users'});
    if (group === null) {
      throw new NotFoundException('Group with given id not found');
    } else {
      return group;
    }
  }

  async addUserToGroup(group: Group, user: User, role: string): Promise<void> {
    await group.$add('user', user, {
      through: {role: role, createdAt: new Date(), updatedAt: new Date()}
    });
  }

  async removeUserFromGroup(group: Group, user: User): Promise<void> {
    
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
