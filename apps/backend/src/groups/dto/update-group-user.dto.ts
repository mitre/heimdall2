import { IUpdateGroupUser } from '@heimdall/common/interfaces';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateGroupUserRoleDto implements IUpdateGroupUser {
  @IsNotEmpty()
  @IsString()
  readonly groupRole!: string;

  @IsNotEmpty()
  @IsString()
  readonly userId!: string;
}
