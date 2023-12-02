import {IGroupRelation} from '@heimdall/interfaces';
import {GroupRelation} from '../group-relation.model';

export class GroupRelationDto implements IGroupRelation {
  readonly id: string;
  readonly parentId: string;
  readonly childId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(groupRelation: GroupRelation) {
    this.id = groupRelation.id;
    this.parentId = groupRelation.parentId;
    this.childId = groupRelation.childId;
    this.createdAt = groupRelation.createdAt;
    this.updatedAt = groupRelation.updatedAt;
  }
}
