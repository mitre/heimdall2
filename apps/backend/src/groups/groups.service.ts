import {Injectable} from '@nestjs/common';
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
    return this.groupModel.findAll<Group>();
  }

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const group = new Group(createGroupDto);
    return group.save();
  }

  async addUserToGroup(group: Group, user: User, role: string): Promise<void> {
    await group.$add('user', user, {
      through: {role: role, createdAt: new Date(), updatedAt: new Date()}
    });
  }
}
