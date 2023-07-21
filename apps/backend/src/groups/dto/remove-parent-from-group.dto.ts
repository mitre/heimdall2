import { IRemoveParentFromGroup } from '@heimdall/interfaces';
import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveParentFromGroupDto implements IRemoveParentFromGroup {
  @IsNotEmpty()
  @IsString()
  readonly parentId!: string;
}
