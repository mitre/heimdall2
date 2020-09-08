import {IsNotEmpty} from 'class-validator';
import {IDeleteUser} from '@heimdall/interfaces';

export class DeleteUserDto implements IDeleteUser {
  @IsNotEmpty()
  readonly password: string;
}
