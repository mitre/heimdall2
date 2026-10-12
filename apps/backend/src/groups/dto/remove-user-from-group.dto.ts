import {IRemoveUserFromGroup} from '@heimdall/common/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class RemoveUserFromGroupDto implements IRemoveUserFromGroup {
  @IsNotEmpty()
  @IsString()
  readonly userId!: string;
}
