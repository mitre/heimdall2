import {IGroup} from '@heimdall/interfaces';
import {Group} from '../group.model';

export class GroupDto implements IGroup {
  readonly id: string;
  readonly name: string;
  readonly public: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(group: Group) {
    this.id = group.id;
    this.name = group.name;
    this.public = group.public;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
  }
}
