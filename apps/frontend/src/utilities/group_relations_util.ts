import {GroupRelationsModule} from '@/store/group_relations';
import {IGroupRelation} from '@heimdall/interfaces';

export function getAllDescendants(parentId: string): string[] {
  let descendants: string[] = [];
  const adjacentRelations = getAdjacentRelations(parentId);
  for (const relation of adjacentRelations) {
    descendants.push(relation.childId);
    descendants = descendants.concat(getAllDescendants(relation.childId));
  }
  return descendants;
}

export function getAdjacentRelations(parentId: string): IGroupRelation[] {
  return GroupRelationsModule.allGroupRelations.filter(
    (relation) => relation.parentId === parentId
  );
}
