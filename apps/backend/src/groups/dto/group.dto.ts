import {IGroup} from '@heimdall/interfaces';
import {GroupUser} from '../../group-users/group-user.model';
import {Group} from '../group.model';

export class GroupDto implements IGroup {
  readonly id: string;
  readonly name: string;
  readonly public: boolean;
  readonly role?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(group: Group & {GroupUser?: GroupUser}) {
    this.id = group.id;
    this.name = group.name;
    this.role = group?.GroupUser?.role;
    this.public = group.public;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
  }
}
