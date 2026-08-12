import type { IGroup } from '@heimdall/common/interfaces';
import type { GroupUser } from '../../group-users/group-user.model';
import { SlimUserDto } from '../../users/dto/slim-user.dto';
import type { Group } from '../group.model';

export class GroupDto implements IGroup {
  readonly createdAt: Date;
  readonly desc: string;
  readonly id: string;
  readonly name: string;
  readonly public: boolean;
  readonly role?: string;
  readonly updatedAt: Date;
  readonly users: SlimUserDto[];

  constructor(group: Group & { GroupUser?: GroupUser }, role?: string) {
    this.id = group.id;
    this.name = group.name;
    this.role = role || group?.GroupUser?.role;
    this.public = group.public;
    this.users
      = group.users === undefined
        ? []
        : group.users.map((user) => {
          return new SlimUserDto(user, user.GroupUser.role);
        });
    this.desc = group.desc;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
  }
}
