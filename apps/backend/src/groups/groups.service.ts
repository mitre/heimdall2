import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {User} from '../users/user.model';
import {CreateGroupDto} from './dto/create-group.dto';
import {GroupDto} from './dto/group.dto';
import {Group} from './group.model';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group)
    private groupModel: typeof Group
  ) { }

  async findAll(): Promise<GroupDto[]> {
    const groups = await this.groupModel.findAll<Group>();
    return groups.map(
      (group) => new GroupDto(group)
    );
  }

  async create(
    createGroupDto: CreateGroupDto
  ): Promise<Group> {
    const group = new Group(createGroupDto);
    return group.save();
  }

  async addUserToGroup(
    group: Group,
    user: User,
    role: string
  ): Promise<void> {
    await group.$add('user', user, {through: {role: role, createdAt: new Date(), updatedAt: new Date()}});
  }
}
