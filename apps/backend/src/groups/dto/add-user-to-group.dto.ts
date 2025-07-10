import {IAddUserToGroup} from '@heimdall/common/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class AddUserToGroupDto implements IAddUserToGroup {
  @IsNotEmpty()
  @IsString()
  readonly userId!: string;

  @IsNotEmpty()
  @IsString()
  readonly groupRole!: string;
}
