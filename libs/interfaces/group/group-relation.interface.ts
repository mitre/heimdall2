export interface IGroupRelation {
  readonly id: string;
  readonly parentId: string;
  readonly childId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
