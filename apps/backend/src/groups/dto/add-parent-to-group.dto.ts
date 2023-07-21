import { IAddParentToGroup } from '@heimdall/interfaces';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddParentToGroupDto implements IAddParentToGroup {
  @IsNotEmpty()
  @IsString()
  readonly parentId!: string
}
