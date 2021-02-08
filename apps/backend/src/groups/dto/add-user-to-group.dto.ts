import {IAddUserToGroup} from '@heimdall/interfaces';

import {IsString, IsNotEmpty} from 'class-validator';

export class AddUserToGroupDto implements IAddUserToGroup {
  @IsNotEmpty()
  @IsString()
  readonly userId!: string;

  @IsNotEmpty()
  @IsString()
  readonly groupRole!: string;
}
