import {IGroup} from '@heimdall/interfaces';
import {GroupUser} from '../../group-users/group-user.model';
import {SlimUserDto} from '../../users/dto/slim-user.dto';
import {Group} from '../group.model';

export class GroupDto implements IGroup {
  readonly id: string;
  readonly name: string;
  readonly public: boolean;
  readonly role?: string;
  readonly users: SlimUserDto[];
  readonly desc: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(group: Group & {GroupUser?: GroupUser}, role?: string) {
    this.id = group.id;
    this.name = group.name;
    this.role = role || group?.GroupUser?.role;
    this.public = group.public;
    this.users =
      group.users === undefined
        ? []
        : group.users.map((user) => {
            return new SlimUserDto(user, user.GroupUser.role);
          });
    this.desc = group.desc;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
  }
}
