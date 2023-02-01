import { IGroup } from '../group/group.interface';

export interface IGroupRelation {
  id: string;
  readonly parentId: IGroup["id"];
  readonly childId: IGroup["id"];
}


