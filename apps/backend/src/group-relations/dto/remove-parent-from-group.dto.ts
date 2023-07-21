import { IRemoveGroupRelation } from '@heimdall/interfaces';
import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveParentFromGroupDto implements IRemoveGroupRelation {
  @IsNotEmpty()
  @IsString()
  readonly parentId!: string;

  @IsNotEmpty()
  @IsString()
  readonly childId!: string;
}
