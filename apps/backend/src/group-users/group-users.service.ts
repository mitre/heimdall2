import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {GroupUser} from './group-user.model';

@Injectable()
export class GroupUsersService {
  constructor(
    @InjectModel(GroupUser)
    private readonly groupUserModel: typeof GroupUser,
    private readonly usersService: UsersService
  ) {}

  async findUsersInGroup(groupId: string): Promise<User[]> {
    const users = await this.groupUserModel.findAll<GroupUser>({
      where: {groupId: groupId}
    });

    return this.returnUsersInGroup(users);
  }

  async returnUsersInGroup(groupUsersArray: GroupUser[]): Promise<User[]> {
    const userArray: User[] = [];

    for (const val of groupUsersArray) {
      const user: User = await this.usersService.findById(val.userId);
      userArray.push(user);
    }

    return userArray;
  }
}
