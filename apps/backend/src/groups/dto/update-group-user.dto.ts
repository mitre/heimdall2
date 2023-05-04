import {IUpdateGroupUser} from '@heimdall/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class UpdateGroupUserRoleDto implements IUpdateGroupUser {
  @IsNotEmpty()
  @IsString()
  readonly userId!: string;

  @IsNotEmpty()
  @IsString()
  readonly groupRole!: string;
}
