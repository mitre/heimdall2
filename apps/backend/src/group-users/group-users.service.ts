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

    const userArray = await this.returnUsersInGroup(users);

    return userArray;
  }

  async returnUsersInGroup(groupUsersArray: GroupUser[]): Promise<User[]> {
    const userArray: User[] = [];

    for (let i = 0; i < groupUsersArray.length; i++) {
      const user: User = await this.usersService.findById(
        groupUsersArray[i].userId
      );
      userArray.push(user);
    }

    return userArray;
  }
}
